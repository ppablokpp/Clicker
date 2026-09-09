import { memo, useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Archive, Gem, List, Loader2, Minus, Plus, X } from 'lucide-react'
import { AstronautPieceById } from './AstronautPiecePreview'
import { MineralIcon } from './MaterialIcons'
import { ChestCatalogModal } from './ChestCatalogModal'
import { MATERIAL_TIER_COLORS } from '../lib/materialTiers'
import { VaultChest, VaultKey } from './VaultChest'
import { useLanguage } from '../context/LanguageContext'
import { useAppAuth } from '../hooks/useAppAuth'
import { useSignInPrompt } from '../context/SignInPromptContext'
import { useKeysContext } from '../context/KeysContext'
import { useGemsContext } from '../context/GemsContext'
import { useCosmetics } from '../context/CosmeticsContext'
import { useDailyKeyContext } from '../context/DailyKeyContext'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useDailyCaseContext, type DailyCasePrize } from '../context/DailyCaseContext'
import { useGemChestContext } from '../context/GemChestContext'
import { playCaseReveal, playCaseTick } from '../lib/caseSound'
import { fetchOwnedChests, openChests, type ChestBatchResult } from '../lib/chestBenchApi'
import { CASE_PRIZE_STYLES, DEFAULT_CASE_PRIZE_STYLE } from '../store/caseConfig'
import {
  CHEST_KEY_COST,
  CHEST_ORDER,
  MAX_SELECTED,
  isCosmeticChest,
  type ChestId,
} from '../store/chestBench'
import {
  COSMETIC_CASE_ITEMS,
  COSMETIC_RARE_POOL,
  COSMETIC_RARITY_ORDER,
  cosmeticKey,
  rollCosmetic,
  type CosmeticCaseItem,
} from '../store/cosmeticCase'

/**
 * The chest card. Four chests on a rack, each priced in keys and nothing
 * else; put up to five on the bench, and one button opens the lot.
 *
 * This replaced the old two-step flow (buy a chest with material, then open
 * it with a key) and the separate cosmetics card — hence the daily key claim
 * living up here now: keys are the only currency this card spends, so the
 * place you top them up belongs on it.
 *
 * The five reels are deliberately ONE machine rather than five widgets: a
 * single pointer rail runs down through every lane, and lanes land in
 * sequence from the top, so a five-chest pull reads as one run of results
 * instead of five things finishing in a heap.
 *
 * All four are real: rolled, charged and granted server-side in a single
 * transaction (see back/src/routes/chests.js). Style chests grant a cosmetic
 * into user_cosmetics and never roll something you already own, so a key
 * spent there always buys a new piece — the cost of that rule is that the
 * pool eventually runs dry, which is why a chest greys out when this account
 * has emptied it.
 *
 * Ownership is now a real gate, not just a record: the locker locks anything
 * you don't own, and this card's own reel and odds table both hide what you
 * already have — the server can't roll it, so showing it would advertise a
 * prize that isn't on the table.
 */

const TILE = 84
const GAP = 6
const SPAN = TILE + GAP
const LANE_HEIGHT = 92
const STRIP_LENGTH = 44
const LANDING_INDEX = 40
const BASE_SPIN_SECONDS = 6.2
// Each lane below the first lands a beat later, so the reveals cascade down
// the machine. Five lanes finish within ~8s, the same wait one chest used to
// take on its own.
const LANE_STAGGER_SECONDS = 0.42

function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds)
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const CHEST_ACCENT: Record<ChestId, { text: string; ring: string; chip: string }> = {
  material: { text: 'text-neutral-300', ring: 'border-white/10', chip: 'bg-white/[0.04]' },
  gems: { text: 'text-indigo-300', ring: 'border-indigo-400/25', chip: 'bg-indigo-500/[0.08]' },
  style: { text: 'text-violet-300', ring: 'border-violet-400/25', chip: 'bg-violet-500/[0.08]' },
  styleRare: { text: 'text-fuchsia-300', ring: 'border-fuchsia-400/25', chip: 'bg-fuchsia-500/[0.08]' },
}

// What lands in a lane: either a currency prize, or a cosmetic. One union
// rather than two parallel machines, since everything above the tile is
// identical for both.
type LaneItem =
  | { kind: 'currency'; prize: DailyCasePrize }
  | { kind: 'cosmetic'; item: CosmeticCaseItem }

function laneItemStyle(item: LaneItem) {
  const id = item.kind === 'currency' ? item.prize.id : item.item.rarity
  return CASE_PRIZE_STYLES[id] ?? DEFAULT_CASE_PRIZE_STYLE
}

function pickCurrency(catalog: DailyCasePrize[]): DailyCasePrize {
  const total = catalog.reduce((sum, p) => sum + p.weight, 0)
  let r = Math.random() * total
  for (const p of catalog) {
    if (r < p.weight) return p
    r -= p.weight
  }
  return catalog[catalog.length - 1]
}

interface Lane {
  uid: number
  chest: ChestId
  items: LaneItem[]
  targetX: number
  result: LaneItem
  delay: number
}

// Memoized: five lanes of 44 tiles is 220 nodes, and a cosmetic tile is a
// whole SVG garment. `item` wrappers are built once per spin and held in
// state, so the shallow compare holds for the life of the animation.
const LaneTile = memo(function LaneTile({ item, label }: { item: LaneItem; label: string }) {
  const style = laneItemStyle(item)
  const glowSize = style.glowSize ?? 1
  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border px-1 text-center"
      style={{
        width: TILE,
        height: TILE,
        borderColor: `${style.color}55`,
        backgroundColor: `${style.color}14`,
        boxShadow: `0 0 ${14 * glowSize}px ${style.glow} inset, 0 0 ${10 * glowSize}px ${style.glow}`,
      }}
    >
      {item.kind === 'cosmetic' ? (
        <AstronautPieceById slot={item.item.slot} id={item.item.id} size={46} />
      ) : item.prize.currency === 'gems' ? (
        <Gem size={17} style={{ color: style.color }} />
      ) : (
        <MineralIcon size={24} style={{ color: style.color }} />
      )}
      <span className="w-full truncate text-[10px] font-bold tabular-nums text-white">{label}</span>
    </div>
  )
})

/**
 * The still strip in a lane that hasn't been spun yet — and you can drag it.
 *
 * That drag is the whole point: nine tiles are wider than the viewport, so
 * without it a chest on the bench only ever shows the same three prizes and
 * the rest of the strip is a rumour. Being able to shove it along is how you
 * see what's in there before spending a key.
 *
 * Endless in both directions, and the trick is that the gesture never writes
 * the position you see. `offset` is a free-running total the pan adds to and
 * the momentum decays; the rendered `x` is derived from it modulo one strip
 * width, so it can only ever be in [-loopWidth, 0). Two copies are drawn, so
 * any value in that window shows an unbroken run of tiles and the wrap is
 * invisible.
 *
 * The old Store.tsx reel this replaces did it the direct way — three copies,
 * and a change handler that teleported the dragged value by one copy at each
 * seam — and that does not survive `dragMomentum`. Framer's inertia owns the
 * value it animates and rewrites it every frame from its own internal origin,
 * so the teleport is undone on the next frame and the strip coasts straight
 * past the seam. Measured on the real page: settling at +622px and still
 * climbing after four flicks, i.e. a growing empty gap at the head of the
 * lane. Deriving the position instead means there is nothing to fight.
 *
 * Momentum is therefore hand-rolled, which is twelve lines: exponential decay
 * on the release velocity, stopped once it drops below a pixel or so a frame.
 *
 * `touch-action: pan-y` rather than `none`: this lives inside a page that
 * scrolls vertically, so it may only claim the horizontal axis.
 */
function IdleLane({ items, labelFor }: { items: LaneItem[]; labelFor: (item: LaneItem) => string }) {
  const loopWidth = items.length * SPAN
  const offset = useMotionValue(0)
  const raf = useRef<number | null>(null)

  const x = useTransform(offset, (v) =>
    loopWidth > 0 ? (((v % loopWidth) + loopWidth) % loopWidth) - loopWidth : 0,
  )

  const stop = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current)
    raf.current = null
  }
  useEffect(() => stop, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        style={{ x, y: '-50%', gap: GAP }}
        className="pointer-events-none absolute left-0 top-1/2 flex items-center opacity-45"
      >
        {[...items, ...items].map((item, j) => (
          <LaneTile key={j} item={item} label={labelFor(item)} />
        ))}
      </motion.div>

      {/* The grab surface, deliberately stationary: it reads the gesture and
          never moves, so it can't slide out from under the pointer. */}
      <motion.div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'pan-y' }}
        onPanStart={stop}
        onPan={(_, info) => offset.set(offset.get() + info.delta.x)}
        onPanEnd={(_, info) => {
          let v = info.velocity.x
          let last = performance.now()
          const step = (now: number) => {
            const dt = (now - last) / 1000
            last = now
            v *= Math.pow(0.94, dt * 60)
            if (Math.abs(v) < 20) return stop()
            offset.set(offset.get() + v * dt)
            raf.current = requestAnimationFrame(step)
          }
          raf.current = requestAnimationFrame(step)
        }}
      />
    </div>
  )
}

export function ChestBench() {
  const { language, strings } = useLanguage()
  const s = strings.store
  const locale = language === 'en' ? 'en-US' : 'es-ES'

  const { userId, getToken } = useAppAuth()
  const { promptSignIn } = useSignInPrompt()
  const { keys, syncKeys } = useKeysContext()
  // How many chests of each kind this account is holding. Only the two style
  // ones cover their own key cost on this bench; material and gems are stock
  // the daily case spends elsewhere, so their count is shown but never
  // discounts anything here.
  const [held, setHeld] = useState<Record<string, number>>({ material: 0, gems: 0, style: 0, styleRare: 0 })
  const COVERS_ITS_COST = (chest: ChestId) => chest === 'style' || chest === 'styleRare'
  const { syncGems } = useGemsContext()
  const { prestigeTier, syncTotalClicks, suspendSync, resumeSync } = useClickCounterContext()
  const { catalog: materialCatalog } = useDailyCaseContext()
  const { catalog: gemCatalog } = useGemChestContext()
  // "slot:id" keys of every piece this account owns, from the same context
  // the locker reads. Used here to stop a player picking a chest that has
  // nothing left for them, and to keep what they already own out of both the
  // reel and the odds table — the server never rolls an owned piece, so
  // showing one would advertise a prize that cannot come out.
  const { owned: ownedCosmetics, grantCosmetics } = useCosmetics()
  const unownedCommon = COSMETIC_CASE_ITEMS.filter((i) => !ownedCosmetics.has(cosmeticKey(i)))
  const unownedRare = COSMETIC_RARE_POOL.filter((i) => !ownedCosmetics.has(cosmeticKey(i)))
  const {
    claimedToday,
    cooldownSecondsLeft,
    isClaiming,
    claim: claimDailyKey,
  } = useDailyKeyContext()
  const materialName = strings.home.trajectoryTierNames[prestigeTier]

  // The tile shows no name at all — the gem says which chest it is, and a
  // word under a picture of the thing it names carries nothing. What is
  // left of this map is the catalogue modal's title and the aria labels,
  // and both are read with no chest in view, so both want the full name.
  const chestName: Record<ChestId, string> = {
    material: s.caseTitleClicks(materialName),
    gems: s.caseTitleGems,
    style: s.cosmeticCaseTitleKeys,
    styleRare: s.cosmeticCaseTitleGems,
  }

  // The material chest wears whatever you are currently mining, so its
  // gem is read from the tier table the asteroid and the currency icon
  // already share rather than being a fifth hardcoded colour that would
  // silently disagree with them after a prestige.
  const tierGem = MATERIAL_TIER_COLORS[prestigeTier] ?? MATERIAL_TIER_COLORS[0]
  const gemFor = (chest: ChestId) =>
    chest === 'material'
      ? { lit: tierGem.light, mid: tierGem.fill, deep: tierGem.dark, edge: tierGem.dark }
      : undefined

  const labelFor = (item: LaneItem): string =>
    item.kind === 'cosmetic'
      ? (strings.profile.styleNames[item.item.id] ?? item.item.id)
      : item.prize.amount.toLocaleString(locale)

  // Filler tiles for the reel. The pools drop anything already owned, for the
  // same reason the catalogue does: the server can't roll it, so watching it
  // scroll past is the reel advertising a prize that was never on the table.
  const rollFor = (chest: ChestId): LaneItem => {
    switch (chest) {
      case 'material':
        return { kind: 'currency', prize: pickCurrency(materialCatalog) }
      case 'gems':
        return { kind: 'currency', prize: pickCurrency(gemCatalog) }
      case 'styleRare':
        return { kind: 'cosmetic', item: rollCosmetic(unownedRare) }
      default:
        return { kind: 'cosmetic', item: rollCosmetic(unownedCommon) }
    }
  }

  const uidRef = useRef(0)
  const viewportRef = useRef<HTMLDivElement>(null)
  const lastTickIndexRef = useRef<number | null>(null)
  const landedRef = useRef(0)
  const pendingGemsRef = useRef<number | null>(null)
  // Mirrors isSpinning for the unmount cleanup below, so the cleanup always
  // reads the latest value rather than whatever was current when the effect
  // last ran.
  const isSpinningRef = useRef(false)

  const [picks, setPicks] = useState<{ uid: number; chest: ChestId; idle: LaneItem[] }[]>([])
  const [spin, setSpin] = useState<{ id: number; lanes: Lane[] } | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [results, setResults] = useState<{ uid: number; item: LaneItem }[]>([])
  const [catalogFor, setCatalogFor] = useState<ChestId | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    void (async () => {
      try {
        const token = await getToken()
        const counts = await fetchOwnedChests(token)
        if (!cancelled) setHeld(counts)
      } catch {
        // A failed read just means no free chests are shown; the server is
        // still the one that decides what a pull costs.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    isSpinningRef.current = isSpinning
  }, [isSpinning])

  // (Ownership used to be fetched here, behind a `racksCosmetics` flag so it
  // cost nothing while the style chests were hidden. CosmeticsProvider
  // fetches it once for the whole app now — the customization screen needs
  // the same set — so this card just reads it.)

  // Safety net: anything that unmounts this card mid-reel (browser back, a
  // tab change) would otherwise orphan the suspendSync call forever, since
  // Framer's onAnimationComplete never fires for an unmounted node — wedging
  // every future total-clicks sync app-wide.
  useEffect(() => {
    return () => {
      if (isSpinningRef.current) resumeSync()
    }
  }, [resumeSync])

  // Mirrors openChestBatch: granted chests are consumed first, cheapest
  // accounting first, and only what is left over is priced in keys.
  const remaining = { ...held }
  const totalCost = picks.reduce((sum, p) => {
    if (COVERS_ITS_COST(p.chest) && (remaining[p.chest] ?? 0) > 0) {
      remaining[p.chest] -= 1
      return sum
    }
    return sum + CHEST_KEY_COST[p.chest]
  }, 0)
  const countOf = (chest: ChestId) => picks.filter((p) => p.chest === chest).length
  const isBusy = isSpinning || isOpening
  // Checked here only to keep the button honest; the server re-checks it
  // under the row lock, which is the check that actually counts.
  const missingKeys = Math.max(0, totalCost - keys)
  const cantAfford = picks.length > 0 && missingKeys > 0
  const openDisabled = isBusy || picks.length === 0 || cantAfford

  // Style chests never hand out a piece you already own, so a pool this
  // account has emptied can only fail — and each one already on the bench
  // will consume another piece from it, so the ones queued up count too.
  const cosmeticsLeft = (chest: ChestId, queued: number) =>
    (chest === 'styleRare' ? unownedRare : unownedCommon).length - queued

  // Dimmed: nothing this chest could ever give right now. A paid chest with
  // no catalogue yet (signed out, still fetching) can't build a strip either.
  const chestReady = (chest: ChestId) => {
    if (chest === 'material') return materialCatalog.length > 0
    if (chest === 'gems') return gemCatalog.length > 0
    return cosmeticsLeft(chest, 0) > 0
  }

  const canAdd = (chest: ChestId) =>
    chestReady(chest) && (!isCosmeticChest(chest) || cosmeticsLeft(chest, countOf(chest)) > 0)

  const add = (chest: ChestId) => {
    if (isBusy || picks.length >= MAX_SELECTED || !canAdd(chest)) return
    // The idle strip is rolled once, when the chest goes on the bench, and
    // carried on the pick. Rolling it during render would reshuffle every
    // tile on every re-render, and this card re-renders on each add, remove
    // and landing.
    const idle = Array.from({ length: 9 }, () => rollFor(chest))
    setPicks((prev) => [...prev, { uid: uidRef.current++, chest, idle }])
  }

  // Removes the last one added of that chest, so tapping − undoes the tap
  // that most recently put one there.
  const remove = (chest: ChestId) => {
    if (isBusy) return
    setPicks((prev) => {
      const i = prev.map((p) => p.chest).lastIndexOf(chest)
      return i < 0 ? prev : [...prev.slice(0, i), ...prev.slice(i + 1)]
    })
  }

  const handleClaimKey = async () => {
    if (claimedToday || isClaiming) return
    setError(null)
    const result = await claimDailyKey()
    if (!result.ok && result.error && result.error !== 'not-signed-in' && result.error !== 'already-claimed') {
      setError(s.purchaseError)
    }
  }

  // Turns one server result into the tile its lane lands on. Falls back to a
  // local roll only if the response somehow came back short — a lane with
  // nothing to land on would spin forever.
  const landingFor = (pick: { chest: ChestId }, won: ChestBatchResult | undefined): LaneItem => {
    if (!won) return rollFor(pick.chest)
    if (won.kind === 'cosmetic') {
      const item = COSMETIC_CASE_ITEMS.find((i) => i.slot === won.slot && i.id === won.itemId)
      return item ? { kind: 'cosmetic', item } : rollFor(pick.chest)
    }
    return {
      kind: 'currency',
      prize: { id: won.prizeId, amount: won.prizeAmount, weight: 1, currency: won.currency },
    }
  }

  const startReels = (serverResults: ChestBatchResult[]) => {
    const viewportWidth = viewportRef.current?.clientWidth ?? 320
    const centerOfItem = LANDING_INDEX * SPAN + TILE / 2
    const lanes: Lane[] = picks.map((pick, laneIndex) => {
      // Every lane lands on the server's roll now — the client picks nothing.
      const result = landingFor(pick, serverResults[laneIndex])
      const items = Array.from({ length: STRIP_LENGTH }, (_, i) =>
        i === LANDING_INDEX ? result : rollFor(pick.chest),
      )
      const jitter = (Math.random() - 0.5) * (TILE * 0.5)
      return {
        uid: pick.uid,
        chest: pick.chest,
        items,
        result,
        targetX: centerOfItem - viewportWidth / 2 + jitter,
        delay: laneIndex * LANE_STAGGER_SECONDS,
      }
    })
    landedRef.current = 0
    lastTickIndexRef.current = null
    setResults([])
    setIsSpinning(true)
    setSpin({ id: Date.now(), lanes })
  }

  const handleOpen = async () => {
    if (isBusy || picks.length === 0) return
    setError(null)

    if (!userId) {
      promptSignIn()
      return
    }

    setIsOpening(true)
    try {
      const token = await getToken()
      if (!token) {
        setError(s.purchaseError)
        return
      }
      const res = await openChests(
        token,
        picks.map((p) => p.chest),
      )
      if (!res.ok) {
        if (res.error === 'not-enough-keys') setError(s.notEnoughKeys)
        else if (res.error === 'collection-complete') setError(s.chestCollectionComplete)
        else setError(s.purchaseError)
        return
      }

      // Keys are spent now, so they drop now — what you paid should never lag
      // behind the press. The winnings are the opposite: held back until the
      // reels land, or the header would spoil every result.
      if (typeof res.keys === 'number') syncKeys(res.keys)
      // The open response carries the fresh counts, so the card stops
      // advertising a chest that was just spent.
      if (res.ownedChests) setHeld(res.ownedChests)
      suspendSync()
      if (typeof res.totalClicks === 'number') syncTotalClicks(res.totalClicks)
      pendingGemsRef.current = typeof res.gems === 'number' ? res.gems : null

      // Recorded before the reels even start: the pieces are already in the
      // database, and this set only gates what can be picked next.
      grantCosmetics(
        (res.results ?? [])
          .filter((r): r is Extract<ChestBatchResult, { kind: 'cosmetic' }> => r.kind === 'cosmetic')
          .map((r) => ({ slot: r.slot, itemId: r.itemId })),
      )

      startReels(res.results ?? [])
    } finally {
      setIsOpening(false)
    }
  }

  const settle = () => {
    setIsSpinning(false)
    resumeSync()
    if (pendingGemsRef.current !== null) {
      syncGems(pendingGemsRef.current)
      pendingGemsRef.current = null
    }
  }

  const lanes = spin?.lanes ?? []

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-500/10 blur-2xl" />

      <div className="relative mb-1 flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-400/30 to-rose-500/20 text-red-200">
          <Archive size={17} />
        </div>
        <div className="text-base font-semibold text-white">{s.casesSection}</div>
        <button
          onClick={handleClaimKey}
          disabled={claimedToday || isClaiming}
          aria-label={s.claimDailyKey}
          className={`ml-auto flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
            claimedToday
              ? 'border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
              : 'border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15'
          }`}
        >
          <VaultKey tone="key" size={28} />
          {isClaiming ? s.claimingKey : claimedToday ? formatCountdown(cooldownSecondsLeft) : s.claimDailyKey}
        </button>
      </div>

      <p className="relative mb-5 mt-4 text-sm text-neutral-500">{s.casesSubtitle}</p>

      {/* The rack. Two per row, every chest priced in the one currency. */}
      <div className="relative mb-4 grid grid-cols-2 gap-3">
        {CHEST_ORDER.map((chest) => {
          const count = countOf(chest)
          const accent = CHEST_ACCENT[chest]
          const ready = chestReady(chest)
          const addable = canAdd(chest)
          const full = picks.length >= MAX_SELECTED
          return (
            <div
              key={chest}
              className={`relative flex flex-col gap-2 rounded-xl border p-2.5 transition-colors ${
                count > 0 ? `${accent.ring} ${accent.chip}` : 'border-white/5 bg-white/[0.02]'
              } ${ready ? '' : 'opacity-40'}`}
            >
              {/* One case, holding everything that describes the chest: the
                  model, how many you hold, and what it costs. The name is
                  gone on purpose — the gem already says which chest this is,
                  and a word under a picture of the thing it names is the one
                  element on the card carrying no information.

                  The price lives INSIDE here rather than on a plate of its
                  own below, which read as a button you could press and
                  could not. In here it is part of a control that really is
                  pressable, so the affordance stops lying either way. */}
              <button
                onClick={() => setCatalogFor(chest)}
                aria-label={`${s.caseCatalogButton} — ${chestName[chest]}`}
                className="group relative flex h-[164px] w-full flex-col overflow-hidden rounded-lg border border-white/5 bg-black/25 transition-colors hover:border-white/15 hover:bg-black/40"
              >
                {/* Lit from the same upper left the model is, so the chest
                    reads as standing inside a case rather than pasted on. */}
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_32%_24%,rgba(255,255,255,0.07),transparent_62%)]" />

                {/* 128 = the 100px model plus the 14px two ghosts reach on
                    each side, so the held stack lands exactly on the edges of
                    this band and can never be clipped by overflow-hidden. */}
                <span className="relative flex h-[128px] w-full items-center justify-center">
                  {/* The chest you can see IS the first one you hold, so the
                      ghosts behind it are however many MORE there are. */}
                  {Array.from({ length: Math.min(Math.max((held[chest] ?? 0) - 1, 0), 2) }, (_, i) => (
                    <span
                      key={i}
                      aria-hidden
                      className="absolute"
                      style={{ transform: `translate(${(i + 1) * 7}px, ${(i + 1) * -7}px)`, opacity: 0.32 - i * 0.09 }}
                    >
                      <VaultChest tone={chest} gem={gemFor(chest)} size={100} />
                    </span>
                  ))}
                  <VaultChest tone={chest} gem={gemFor(chest)} size={100} className="relative" />
                </span>

                {/* Centred in the gap between the chest and the floor of
                    the case rather than parked in a band at the very
                    bottom. 106 is where the chest visually ends: the
                    128px band centres a 100px model at y=14, and the
                    model draws its own contact shadow 92% of the way down
                    its box. Measured from the shadow and not from the box
                    edge, because the last 8px of that box are empty and
                    centring against them puts the key visibly low. */}
                <span className="absolute inset-x-0 bottom-0 top-[106px] flex items-center justify-center">
                  {(held[chest] ?? 0) > 0 && COVERS_ITS_COST(chest) ? (
                    <span className={`text-xs font-bold uppercase tracking-wide ${accent.text}`}>{s.chestGranted}</span>
                  ) : (
                    <span className="relative inline-flex">
                      <VaultKey tone="key" size={40} />
                      {/* Tucked into the key's own bottom right, which is
                          the one corner the tilt leaves empty: the bow sits
                          low and left, the shaft runs up and right.

                          Anchored by its LEFT edge, not its right. Pinned
                          right, a wider number grows back toward the key,
                          so x1 sat further from it than x10 did and the
                          gap changed every time the price did. Left-pinned,
                          every price starts in the same place and grows
                          outward. */}
                      <span className="absolute bottom-0.5 left-full -ml-2 text-[11px] font-bold tabular-nums text-amber-200/90">
                        ×{CHEST_KEY_COST[chest]}
                      </span>
                    </span>
                  )}
                </span>

                {(held[chest] ?? 0) > 0 && (
                  <span
                    className={`absolute left-1.5 top-1.5 rounded-full border ${accent.ring} bg-black/60 px-1.5 py-px text-[10px] font-bold tabular-nums ${accent.text}`}
                  >
                    ×{held[chest]}
                  </span>
                )}
                {/* Top right, clear of the stack: the ghosts fan up and to
                    the right, but their slabs start a fifth of the way down
                    their own box, so nothing of them reaches this corner.
                    Visible at rest rather than on hover — half the people
                    here are on a phone and would never see a hover-only
                    affordance at all. */}
                <List
                  size={12}
                  className="absolute right-1.5 top-1.5 text-neutral-500 transition-colors group-hover:text-neutral-200"
                />
              </button>

              {count === 0 ? (
                <button
                  onClick={() => add(chest)}
                  disabled={isBusy || full || !addable}
                  aria-label={`${s.chestBenchAdd} — ${chestName[chest]}`}
                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5 text-xs font-semibold text-neutral-300 transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {ready ? (
                    <>
                      <Plus size={13} />
                      {s.chestBenchAdd}
                    </>
                  ) : (
                    // A style chest with nothing left says so, rather than
                    // sitting there as a dimmed "Add" you can't press.
                    s.chestCollectionComplete
                  )}
                </button>
              ) : (
                // Once there is one on the bench the card becomes a stepper —
                // adding and taking away is the whole interaction here, so it
                // should not need a different control to undo than to do.
                <div className={`flex w-full items-center justify-between rounded-lg border ${accent.ring} bg-black/20 px-1 py-1`}>
                  <button
                    onClick={() => remove(chest)}
                    disabled={isBusy}
                    aria-label={`−1 ${chestName[chest]}`}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-300 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={13} />
                  </button>
                  <span className={`text-sm font-bold tabular-nums ${accent.text}`}>{count}</span>
                  <button
                    onClick={() => add(chest)}
                    disabled={isBusy || full || !addable}
                    aria-label={`+1 ${chestName[chest]}`}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-300 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="relative mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold tabular-nums text-neutral-400">
          {s.chestBenchSelected(picks.length, MAX_SELECTED)}
        </span>
        {picks.length > 0 && !isBusy && (
          <button
            onClick={() => setPicks([])}
            className="flex items-center gap-1 rounded-full border border-white/5 bg-white/[0.03] px-2 py-0.5 font-semibold text-neutral-400 transition-colors hover:bg-white/[0.07] hover:text-neutral-200"
          >
            <X size={11} />
            {s.chestBenchClear}
          </button>
        )}
      </div>

      {/* One machine, N lanes. The pointer rail is on the container and runs
          through the gaps between lanes, which is what stops five reels from
          reading as five separate widgets stacked up. */}
      <div ref={viewportRef} className="relative mb-3">
        {picks.length > 0 && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-0.5 -translate-x-1/2 bg-red-300/70 shadow-[0_0_8px_rgba(252,165,165,0.8)]" />
            <div className="pointer-events-none absolute -top-1 left-1/2 z-10 h-2 w-2 -translate-x-1/2 rotate-45 bg-red-300" />
            <div className="pointer-events-none absolute -bottom-1 left-1/2 z-10 h-2 w-2 -translate-x-1/2 rotate-45 bg-red-300" />
          </>
        )}

        <div className="flex flex-col gap-1.5">
          {picks.length === 0 && (
            <div className="flex h-[92px] items-center justify-center rounded-xl border border-dashed border-white/[0.07] bg-black/20 px-6 text-center text-xs text-neutral-600">
              {s.chestBenchEmpty}
            </div>
          )}

          {picks.map((pick, i) => {
            const lane = lanes.find((l) => l.uid === pick.uid)
            const accent = CHEST_ACCENT[pick.chest]
            return (
              <div
                key={pick.uid}
                className="relative overflow-hidden rounded-xl border border-white/5 bg-black/30"
                style={{ height: LANE_HEIGHT }}
              >
                <span
                  className={`pointer-events-none absolute left-2 top-1.5 z-10 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${accent.chip} ${accent.text}`}
                >
                  {chestName[pick.chest]}
                </span>

                {lane && spin ? (
                  <motion.div
                    key={`${spin.id}-${lane.uid}`}
                    className="absolute left-0 top-1/2 flex -translate-y-1/2 items-center"
                    style={{ gap: GAP }}
                    initial={{ x: 0 }}
                    animate={{ x: -lane.targetX }}
                    transition={{
                      duration: BASE_SPIN_SECONDS,
                      delay: lane.delay,
                      ease: [0.12, 0.72, 0.29, 1],
                    }}
                    onUpdate={
                      // Only the top lane drives the tick. Five lanes ticking
                      // in parallel is not five times the feedback, it's
                      // noise — one rail, one sound.
                      i === 0
                        ? (latest) => {
                            const x = typeof latest.x === 'number' ? latest.x : 0
                            const width = viewportRef.current?.clientWidth ?? 320
                            const index = Math.floor((width / 2 - x) / SPAN)
                            if (index !== lastTickIndexRef.current) {
                              lastTickIndexRef.current = index
                              playCaseTick()
                            }
                          }
                        : undefined
                    }
                    onAnimationComplete={() => {
                      const won = lane.result
                      setResults((prev) => [...prev, { uid: lane.uid, item: won }])
                      // Reveal pitch rises with how good the pull was: the
                      // rarity ladder for cosmetics, the catalogue's own order
                      // for currency (both run cheapest-first).
                      const table = lane.chest === 'gems' ? gemCatalog : materialCatalog
                      const tier =
                        won.kind === 'cosmetic'
                          ? COSMETIC_RARITY_ORDER.indexOf(won.item.rarity)
                          : table.findIndex((p) => p.id === won.prize.id)
                      playCaseReveal(tier < 0 ? 0 : tier)
                      landedRef.current += 1
                      if (landedRef.current >= lanes.length) settle()
                    }}
                  >
                    {lane.items.map((item, j) => (
                      <LaneTile key={j} item={item} label={labelFor(item)} />
                    ))}
                  </motion.div>
                ) : (
                  <IdleLane items={pick.idle} labelFor={labelFor} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* The haul, as one row of chips — five separate reveal panels would be
          taller than the machine that produced them. */}
      {results.length > 0 && (
        <div className="relative mb-3 flex flex-wrap gap-1.5">
          {results.map(({ uid, item }) => {
            const style = laneItemStyle(item)
            return (
              <motion.span
                key={uid}
                initial={{ opacity: 0, scale: 0.85, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-bold"
                style={{
                  borderColor: `${style.color}55`,
                  backgroundColor: `${style.color}14`,
                  color: style.color,
                }}
              >
                {item.kind === 'cosmetic' ? (
                  <AstronautPieceById slot={item.item.slot} id={item.item.id} size={18} />
                ) : item.prize.currency === 'gems' ? (
                  <Gem size={11} />
                ) : (
                  <MineralIcon size={16} />
                )}
                <span className="tabular-nums">{labelFor(item)}</span>
              </motion.span>
            )
          })}
        </div>
      )}

      <button
        onClick={handleOpen}
        disabled={openDisabled}
        aria-label={`${s.openCase} — ${totalCost}`}
        className={`relative flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
          openDisabled
            ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
            : 'border border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15'
        }`}
      >
        {isOpening ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            {/* Side by side, not tucked in the corner the way a card's
                price is: that one is a tag on an object, this one is the
                confirmation of what you are about to spend, and it has
                to be read as a sentence. Pulled in past the button's own
                gap-2 because the tilt leaves the key's lower right empty
                and the total can sit into that space. */}
            <span className="flex items-center">
              <VaultKey tone="key" size={40} />
              <span className="-ml-1 translate-y-[4px] tabular-nums">×{totalCost}</span>
            </span>
          </>
        )}
      </button>

      {/* Says why the button is dead, and by how much — a greyed-out total on
          its own doesn't distinguish "pick something" from "you can't afford
          this", and knowing you're 4 keys short is what tells you whether to
          drop a chest or wait for tomorrow's claim. */}
      {cantAfford && (
        <p className="relative mt-2 text-center text-xs text-amber-300/70">
          {s.chestBenchMissingKeys(missingKeys)}
        </p>
      )}
      {error && <p className="relative mt-2 text-center text-xs text-red-400">{error}</p>}

      {catalogFor && (
        <ChestCatalogModal
          chest={catalogFor}
          title={chestName[catalogFor]}
          prizes={catalogFor === 'gems' ? gemCatalog : materialCatalog}
          locale={locale}
          onClose={() => setCatalogFor(null)}
        />
      )}
    </div>
  )
}
