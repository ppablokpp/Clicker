import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUp,
  Atom,
  Crosshair,
  ChevronsDown,
  ChevronsUp,
  Gauge,
  Gem,
  HelpCircle,
  Lock,
  Minus,
  Moon,
  Orbit,
  Pickaxe,
  Plus,
  Radar,
  Radiation,
  Radio,
  RotateCcw,
  Sparkles,
  Split,
  Telescope,
  Timer,
  X,
  Zap,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useTreeContext } from '../context/TreeContext'
import { useTutorialContext } from '../context/TutorialContext'
import { useGemUpgradesContext, type GemUpgradeDef } from '../context/GemUpgradesContext'
import { useGemsContext } from '../context/GemsContext'
import { DroneIcon } from '../components/DroneIcon'
import { PlatinumIcon } from '../components/PlatinumIcon'
import { MATERIAL_BUTTON_THEMES, MATERIAL_ABBREVIATIONS } from '../lib/materialTiers'

// Radial stagger for the reveal pop — nodes closer to whatever unlocked
// them animate in first, farther ones follow a beat later, so a whole
// batch (e.g. every "+2" node at once) ripples outward instead of all
// popping in simultaneously.
function revealDelay(node: { x: number; y: number }, originX: number, originY: number): number {
  const distance = Math.hypot(node.x - originX, node.y - originY)
  return Math.min(distance / 900, 0.5)
}

// 0.015 -> "1.5%", 0.01 -> "1%" — never a trailing ".0" for the whole steps.
function formatChance(chance: number): string {
  return `${(chance * 100).toFixed(1).replace(/\.0$/, '')}%`
}


interface TreeBuyButtonProps {
  onClick: () => void
  isBuying: boolean
  canAfford: boolean
  buyingLabel: string
  cost: number
  balance: number
  locale: string
  currency: 'clicks' | 'gems'
  dataTutorial?: string
  // Tutorial-only: the very first drone is free — bypasses the real
  // afford-check (a brand-new account has 0 of everything, which would
  // otherwise render this permanently disabled) and swaps the price for a
  // "Free!" label instead of a cost nobody's actually about to pay.
  isFree?: boolean
  freeLabel?: string
}

// Shared by every node's buy button (all 9 modals use this exact shape).
// While saving up, a subtle fill creeps across the button showing progress
// toward the cost — same trick as Home's Legendary combo bar (a light
// overlay on the already-muted "can't afford it" background, never
// obscuring the price text). Once affordable it's gone — the button's own
// bright color is signal enough at that point.
function TreeBuyButton({
  onClick,
  isBuying,
  canAfford,
  buyingLabel,
  cost,
  balance,
  locale,
  currency,
  dataTutorial,
  isFree,
  freeLabel,
}: TreeBuyButtonProps) {
  const disabled = isBuying || (!canAfford && !isFree)
  const progressPct = cost > 0 ? Math.min(100, (balance / cost) * 100) : 100
  // Reads its own current material straight from context instead of having
  // it threaded through 13 call sites — this button is purely presentational
  // otherwise, so a self-contained hook read is simpler than prop drilling.
  const { prestigeTier } = useClickCounterContext()
  const materialButtonClass = MATERIAL_BUTTON_THEMES[prestigeTier].button
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-tutorial={dataTutorial}
      className={`relative w-full overflow-hidden rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
        disabled
          ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
          : currency === 'gems'
            ? 'border border-indigo-400/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/15'
            : materialButtonClass
      }`}
    >
      {!isBuying && !canAfford && !isFree && (
        <span
          className="pointer-events-none absolute inset-y-0 left-0 z-0 bg-white/[0.08] transition-[width] duration-200 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-1.5">
        {isBuying ? (
          buyingLabel
        ) : isFree ? (
          freeLabel
        ) : (
          <>
            {currency === 'gems' ? (
              <Gem size={14} className="opacity-80" />
            ) : (
              <PlatinumIcon size={17} className="opacity-70" />
            )}
            <span className="tabular-nums">{cost.toLocaleString(locale)}</span>
          </>
        )}
      </span>
    </button>
  )
}

const MIN_SCALE = 0.5
const MAX_SCALE = 2.5

interface TreeNode {
  id: string
  x: number
  y: number
  label: string
}

interface TreeEdge {
  from: string
  to: string
}

type RevealState = 'hidden' | 'locked' | 'available'

// Pure placeholder layout — no real upgrades wired up yet, just enough
// nodes/branches to see how a pannable/zoomable incremental tech-tree
// screen could look and feel. Root sits dead center of the world, but each
// branch is deliberately its own shape — different length, different
// depth, some forking and some not — instead of a mirrored starburst.
const CENTER = 500

const NODES: TreeNode[] = [
  { id: 'root', x: CENTER, y: CENTER, label: 'Inicio' },

  // Branch A — Suerte forks into Probabilidad (a2); Drones buscadores (a1b)
  // used to hang off Suerte too but is now its own root branch, see below.
  { id: 'a1', x: CENTER + 140, y: CENTER - 100, label: 'Mejora' },
  { id: 'a2', x: CENTER + 260, y: CENTER - 200, label: 'Mejora' },
  { id: 'a2b', x: CENTER + 300, y: CENTER - 340, label: 'Mejora' },
  { id: 'a3', x: CENTER + 400, y: CENTER - 240, label: 'Mejora+' },

  // Branch B — short reach left that forks into two.
  { id: 'b1', x: CENTER - 170, y: CENTER + 70, label: 'Mejora' },
  { id: 'b2a', x: CENTER - 320, y: CENTER - 10, label: 'Mejora' },
  { id: 'b2b', x: CENTER - 330, y: CENTER + 160, label: 'Mejora' },

  // Branch C — one lone node straight down, nothing beyond it yet.
  { id: 'c1', x: CENTER + 20, y: CENTER + 175, label: 'Mejora' },

  // Branch F — Sobrecarga/Drones buscadores/Frecuencia (e2b/a1b/a1b1), a
  // second production unit moved off Suerte to be its own root branch.
  // Sobrecarga (moved off Multiplicador, since it boosts this branch's own
  // drones, not the regular ones) leads the chain, then Dron buscador,
  // then Frecuencia — reusing the branch's existing 3 positions in that
  // new order. Sobrecarga's own child, Autonomía (e2b1, raises how much of
  // the fleet's real rate still applies while you're away), took over the
  // trailing placeholder leaf moved here from Frecuencia's end.
  { id: 'e2b', x: CENTER + 30, y: CENTER - 180, label: 'Mejora' },
  { id: 'a1b', x: CENTER - 20, y: CENTER - 310, label: 'Mejora' },
  { id: 'a1b1', x: CENTER + 100, y: CENTER - 440, label: 'Mejora' },
  { id: 'e2b1', x: CENTER + 140, y: CENTER - 290, label: 'Mejora+' },

  // Branch D — Anomalías (d1, a one-time gate on Home's "Anomalía" mini-
  // event, same shape as Modo Legendario) forking into Extracción (d2,
  // raises the material % it pays out) and Detección (d3, shrinks the
  // wait between spawns). Both children sit at the same distance from d1
  // and from each other as a straight up "V" would, just the whole V
  // rotated 45° left (counterclockwise) so it opens toward the upper-left.
  { id: 'd1', x: CENTER - 120, y: CENTER - 115, label: 'Mejora' },
  { id: 'd2', x: CENTER - 276, y: CENTER - 172, label: 'Mejora' },
  { id: 'd3', x: CENTER - 177, y: CENTER - 271, label: 'Mejora+' },

  // Branch E — forks into two: Modo Legendario (e2a0) gates the heat
  // tier itself and fans out into its own three children (Catalizador/e2a,
  // Impulso/e2a1, Umbral/e2a2 — lowers the t/s needed to trigger Legendary
  // in the first place); Multiplicador (e2c) is the other child off
  // Productividad. Sobrecarga used to live here too but now leads Branch F,
  // its own root branch.
  //
  // The three e2a0 children sit on a common arc, 160px out from e2a0 and
  // 40° apart from each other (adjacent pairs land ~110px apart center to
  // center — 80px node diameter plus a real gap, no overlap) — equal
  // distance from the parent and from each other. Whole arc rotated 20°
  // clockwise from its first draft.
  { id: 'e1', x: CENTER + 150, y: CENTER + 110, label: 'Mejora' },
  { id: 'e2a0', x: 773, y: 524, label: 'Mejora' },
  { id: 'e2a', x: 865, y: 393, label: 'Mejora' },
  { id: 'e2a1', x: 928, y: 483, label: 'Mejora' },
  { id: 'e2a2', x: 918, y: 592, label: 'Mejora' },
  { id: 'e2c', x: CENTER + 275, y: CENTER + 205, label: 'Mejora' },
]

const EDGES: TreeEdge[] = [
  { from: 'root', to: 'a1' },
  { from: 'a1', to: 'a2' },
  { from: 'a2', to: 'a2b' },
  { from: 'a2', to: 'a3' },

  { from: 'root', to: 'b1' },
  { from: 'b1', to: 'b2a' },
  { from: 'b1', to: 'b2b' },

  { from: 'root', to: 'c1' },

  { from: 'root', to: 'e2b' },
  { from: 'e2b', to: 'a1b' },
  { from: 'a1b', to: 'a1b1' },
  { from: 'e2b', to: 'e2b1' },

  { from: 'root', to: 'd1' },
  { from: 'd1', to: 'd2' },
  { from: 'd1', to: 'd3' },

  { from: 'root', to: 'e1' },
  { from: 'e1', to: 'e2a0' },
  { from: 'e2a0', to: 'e2a' },
  { from: 'e2a0', to: 'e2a1' },
  { from: 'e2a0', to: 'e2a2' },
  { from: 'e1', to: 'e2c' },
]

// BFS parent pointers from root — the only graph info the reveal rule
// below needs, since it walks the chain itself rather than working off a
// fixed distance cutoff.
function computeParentsFromRoot(edges: TreeEdge[]): Record<string, string> {
  const adjacency: Record<string, string[]> = {}
  for (const { from, to } of edges) {
    ;(adjacency[from] ??= []).push(to)
    ;(adjacency[to] ??= []).push(from)
  }
  const parentOf: Record<string, string> = {}
  const visited = new Set(['root'])
  const queue = ['root']
  while (queue.length > 0) {
    const current = queue.shift() as string
    for (const neighbor of adjacency[current] ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        parentOf[neighbor] = current
        queue.push(neighbor)
      }
    }
  }
  return parentOf
}

const PARENT_OF = computeParentsFromRoot(EDGES)

// Recursive, so the same rule applies at every depth instead of a
// hardcoded "distance 1 / distance 2" cutoff: a node becomes visible
// ('locked') as soon as its parent is 'available', and gets promoted all
// the way to 'available' itself only if that parent is a real node past
// level 0. That's how root revealing a1/c1 works, and it's exactly the
// same mechanism that makes leveling up a1 (luck) reveal a1's own
// children, and would keep cascading into a3 once a2 ever becomes real.
function getRevealState(nodeId: string, realLevelById: Record<string, number>): RevealState {
  const parentId = PARENT_OF[nodeId]

  // Root's direct children are a special case: always at least visible
  // ('locked'), never hidden, even before root has any level at all —
  // everything deeper only appears once its own parent is 'available'.
  if (parentId === 'root') {
    return (realLevelById.root ?? 0) > 0 ? 'available' : 'locked'
  }

  const parentState = getRevealState(parentId, realLevelById)
  if (parentState !== 'available') return 'hidden'
  return (realLevelById[parentId] ?? 0) > 0 ? 'available' : 'locked'
}

// 'available' echoes the subtle tinted-glass badges used for gem
// purchases in the Store (thin low-opacity border, muted text, no strong
// glow) — just with a solid dark backing instead of a see-through fill,
// since the dashed branch lines sit right underneath and would show
// through actual transparency. Whether it's currently affordable shows up
// separately, as the green up-arrow badge on root — not a color change.
// Always violet regardless of the current material — only each node's own
// buy button (TreeBuyButton) follows the material tier, not the node
// circle itself.
const NODE_STYLES: Record<Exclude<RevealState, 'hidden'>, string> = {
  available: 'border-violet-400/20 bg-[#14101f] text-violet-200 shadow-black/20',
  locked: 'border-dashed border-neutral-700 bg-neutral-900 text-neutral-600 shadow-black/30',
}

// Branch C's node (the premium gem multiplier, moved here from the Store)
// echoes the modal's own indigo buy-button color instead of the fuchsia
// icon-badge gradient — opaque dark backing so the branch lines never show
// through, color carried by the border/text; the Gem icon itself stays
// fuchsia, matching the store's icon treatment.
const PREMIUM_NODE_STYLE = 'border-indigo-400/25 bg-[#141a2e] text-indigo-200 shadow-black/20'

// Branch A's node (the permanent luck upgrade, also moved here from the
// Store) — green/Sparkles, matching the old "Suerte" card's color exactly,
// same opaque-dark-backing recipe as the other two real nodes.
const LUCK_NODE_STYLE = 'border-green-400/25 bg-[#0f1f16] text-green-200 shadow-black/20'

// Branch E's whole family (Multiplicador, Impulso, Reflejos) — red, same
// tone as the Home page's Legendary heat badge, since all three feed that
// one system. Same opaque-dark-backing recipe as the other real nodes.
const LEGENDARY_NODE_STYLE = 'border-red-400/25 bg-[#1f0d0d] text-red-200 shadow-black/20'

// Drones buscadores/Frecuencia — a second production unit alongside the
// regular drones. Amber, its own family, distinct from every other branch.
const AUTO_LUCK_NODE_STYLE = 'border-amber-400/25 bg-[#1f1608] text-amber-200 shadow-black/20'

// Multidisparo — branch B's first real node (was an empty placeholder
// branch). Cyan, distinct from every other branch's color so far, same
// opaque-dark-backing recipe as the other real nodes.
const MULTI_SHOT_NODE_STYLE = 'border-cyan-400/25 bg-[#08191c] text-cyan-200 shadow-black/20'

// Branch D — Anomalías/Extracción/Detección. Orange, its own family, distinct
// from every other branch's color so far.
const ANOMALY_NODE_STYLE = 'border-orange-400/25 bg-[#1f1006] text-orange-200 shadow-black/20'

// Still-unwired placeholder leaves at the end of each real branch — tinted
// with that branch's own family color/icon once revealed instead of the
// generic default violet, so a branch reads as one color end-to-end even
// before its later nodes have anything to actually buy yet.
const PLACEHOLDER_FAMILY: Record<string, { style: string; iconText: string }> = {
  a2b: { style: LUCK_NODE_STYLE, iconText: 'text-green-300' },
  a3: { style: LUCK_NODE_STYLE, iconText: 'text-green-300' },
  b2a: { style: MULTI_SHOT_NODE_STYLE, iconText: 'text-cyan-300' },
  b2b: { style: MULTI_SHOT_NODE_STYLE, iconText: 'text-cyan-300' },
}

const DEFAULT_SCALE = 0.68

// Centers the root node (world coordinates CENTER, CENTER) in the middle of
// whatever the viewport happens to be, at the default zoom level.
function centeredView(): { x: number; y: number; scale: number } {
  return {
    x: window.innerWidth / 2 - CENTER * DEFAULT_SCALE,
    y: window.innerHeight / 2 - CENTER * DEFAULT_SCALE,
    scale: DEFAULT_SCALE,
  }
}

export function Tree() {
  const { strings, language } = useLanguage()
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const { totalClicks, prestigeTier } = useClickCounterContext()
  const currentMaterialName = strings.home.trajectoryTierNames[prestigeTier]
  // "pt/s" only ever meant Platino — now the unit tracks whichever material
  // the current prestige tier actually produces (am/pt/es/or/di).
  const cpsUnit = `${MATERIAL_ABBREVIATIONS[prestigeTier]}/s`
  const tutorial = useTutorialContext()
  const [showTutorialConfirm, setShowTutorialConfirm] = useState(false)
  const {
    autoClickLevel,
    autoClickNextCost,
    isBuying,
    buyAutoClick,
    grantAutoClickFree,
    luckLevel,
    luckMultiplier,
    luckNextCost,
    isBuyingLuck,
    buyLuck,
    luckChance,
    luckChanceLevel,
    luckChanceNextCost,
    isBuyingLuckChance,
    buyLuckChance,
    multiplierLevel,
    multiplierValue,
    multiplierNextValue,
    multiplierNextCost,
    isBuyingMultiplier,
    buyMultiplier,
    legendaryUnlockLevel,
    legendaryUnlockNextCost,
    isBuyingLegendaryUnlock,
    buyLegendaryUnlock,
    legendaryEaseLevel,
    legendaryStreakBase,
    legendaryEaseNextCost,
    isBuyingLegendaryEase,
    buyLegendaryEase,
    legendaryGrowthLevel,
    legendaryBonusStep,
    legendaryGrowthNextCost,
    isBuyingLegendaryGrowth,
    buyLegendaryGrowth,
    legendaryThresholdLevel,
    legendaryThresholdTps,
    legendaryThresholdNextCost,
    isBuyingLegendaryThreshold,
    buyLegendaryThreshold,
    scoutDroneLevel,
    scoutDroneRate,
    scoutDroneNextCost,
    isBuyingScoutDrone,
    buyScoutDrone,
    scoutFrequencyLevel,
    scoutFrequencyNextCost,
    isBuyingScoutFrequency,
    buyScoutFrequency,
    autoMultiplierLevel,
    autoMultiplierValue,
    autoMultiplierNextValue,
    autoMultiplierNextCost,
    isBuyingAutoMultiplier,
    buyAutoMultiplier,
    tapMultiplierLevel,
    tapMultiplierValue,
    tapMultiplierNextCost,
    isBuyingTapMultiplier,
    buyTapMultiplier,
    multiShotLevel,
    multiShotValue,
    multiShotNextCost,
    isBuyingMultiShot,
    buyMultiShot,
    anomalyUnlockLevel,
    anomalyUnlockNextCost,
    isBuyingAnomalyUnlock,
    buyAnomalyUnlock,
    anomalyRewardLevel,
    anomalyRewardValue,
    anomalyRewardNextCost,
    isBuyingAnomalyReward,
    buyAnomalyReward,
    anomalyFrequencyLevel,
    anomalyFrequencySeconds,
    anomalyFrequencyNextCost,
    isBuyingAnomalyFrequency,
    buyAnomalyFrequency,
    offlineProductionLevel,
    offlineProductionValue,
    offlineProductionNextCost,
    isBuyingOfflineProduction,
    buyOfflineProduction,
  } = useTreeContext()
  const isAutoClickMaxed = autoClickNextCost === null
  const canAffordAutoClick = autoClickNextCost !== null && totalClicks >= autoClickNextCost
  const isLuckMaxed = luckNextCost === null
  const canAffordLuck = luckNextCost !== null && totalClicks >= luckNextCost
  const isLuckChanceMaxed = luckChanceNextCost === null
  const canAffordLuckChance = luckChanceNextCost !== null && totalClicks >= luckChanceNextCost
  const isMultiplierMaxed = multiplierNextCost === null
  const canAffordMultiplier = multiplierNextCost !== null && totalClicks >= multiplierNextCost
  const isLegendaryUnlockMaxed = legendaryUnlockNextCost === null
  const canAffordLegendaryUnlock = legendaryUnlockNextCost !== null && totalClicks >= legendaryUnlockNextCost
  const isLegendaryEaseMaxed = legendaryEaseNextCost === null
  const canAffordLegendaryEase = legendaryEaseNextCost !== null && totalClicks >= legendaryEaseNextCost
  const isLegendaryGrowthMaxed = legendaryGrowthNextCost === null
  const canAffordLegendaryGrowth = legendaryGrowthNextCost !== null && totalClicks >= legendaryGrowthNextCost
  const isLegendaryThresholdMaxed = legendaryThresholdNextCost === null
  const canAffordLegendaryThreshold = legendaryThresholdNextCost !== null && totalClicks >= legendaryThresholdNextCost
  const isScoutDroneMaxed = scoutDroneNextCost === null
  const canAffordScoutDrone = scoutDroneNextCost !== null && totalClicks >= scoutDroneNextCost
  const isScoutFrequencyMaxed = scoutFrequencyNextCost === null
  const canAffordScoutFrequency = scoutFrequencyNextCost !== null && totalClicks >= scoutFrequencyNextCost
  const isAutoMultiplierMaxed = autoMultiplierNextCost === null
  const canAffordAutoMultiplier = autoMultiplierNextCost !== null && totalClicks >= autoMultiplierNextCost
  const isTapMultiplierMaxed = tapMultiplierNextCost === null
  const canAffordTapMultiplier = tapMultiplierNextCost !== null && totalClicks >= tapMultiplierNextCost
  const isMultiShotMaxed = multiShotNextCost === null
  const canAffordMultiShot = multiShotNextCost !== null && totalClicks >= multiShotNextCost
  const isAnomalyUnlockMaxed = anomalyUnlockNextCost === null
  const canAffordAnomalyUnlock = anomalyUnlockNextCost !== null && totalClicks >= anomalyUnlockNextCost
  const isAnomalyRewardMaxed = anomalyRewardNextCost === null
  const canAffordAnomalyReward = anomalyRewardNextCost !== null && totalClicks >= anomalyRewardNextCost
  const isAnomalyFrequencyMaxed = anomalyFrequencyNextCost === null
  const canAffordAnomalyFrequency = anomalyFrequencyNextCost !== null && totalClicks >= anomalyFrequencyNextCost
  const isOfflineProductionMaxed = offlineProductionNextCost === null
  const canAffordOfflineProduction = offlineProductionNextCost !== null && totalClicks >= offlineProductionNextCost
  const { catalog: premiumCatalog, owned: premiumOwned, bestOwned: premiumBestOwned, buyingId: premiumBuyingId, buy: buyPremium } =
    useGemUpgradesContext()
  const { gems } = useGemsContext()
  const [transform, setTransform] = useState(centeredView)
  const [showAutoClickModal, setShowAutoClickModal] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showLuckModal, setShowLuckModal] = useState(false)
  const [showLuckChanceModal, setShowLuckChanceModal] = useState(false)
  const [showMultiplierModal, setShowMultiplierModal] = useState(false)
  const [showLegendaryUnlockModal, setShowLegendaryUnlockModal] = useState(false)
  const [showLegendaryEaseModal, setShowLegendaryEaseModal] = useState(false)
  const [showLegendaryGrowthModal, setShowLegendaryGrowthModal] = useState(false)
  const [showLegendaryThresholdModal, setShowLegendaryThresholdModal] = useState(false)
  const [showScoutDroneModal, setShowScoutDroneModal] = useState(false)
  const [showScoutFrequencyModal, setShowScoutFrequencyModal] = useState(false)
  const [showAutoMultiplierModal, setShowAutoMultiplierModal] = useState(false)
  const [showTapMultiplierModal, setShowTapMultiplierModal] = useState(false)
  const [showMultiShotModal, setShowMultiShotModal] = useState(false)
  const [showAnomalyUnlockModal, setShowAnomalyUnlockModal] = useState(false)
  const [showAnomalyRewardModal, setShowAnomalyRewardModal] = useState(false)
  const [showAnomalyFrequencyModal, setShowAnomalyFrequencyModal] = useState(false)
  const [showOfflineProductionModal, setShowOfflineProductionModal] = useState(false)
  const [premiumError, setPremiumError] = useState<string | null>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  )
  // Every finger currently on the screen, keyed by pointerId — a second
  // one landing while the first is still down turns the gesture into a
  // pinch instead of a pan.
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchRef = useRef<{
    idA: number
    idB: number
    startDistance: number
    startScale: number
    startMidX: number
    startMidY: number
    originX: number
    originY: number
  } | null>(null)

  const clampScale = (scale: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
  const distanceBetween = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

  const handlePointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 2) {
      // Second finger just landed — switch from panning to a pinch,
      // anchored on both fingers' current midpoint so nothing jumps.
      dragRef.current = null
      const [idA, idB] = pointersRef.current.keys()
      const a = pointersRef.current.get(idA)!
      const b = pointersRef.current.get(idB)!
      pinchRef.current = {
        idA,
        idB,
        startDistance: distanceBetween(a, b),
        startScale: transform.scale,
        startMidX: (a.x + b.x) / 2,
        startMidY: (a.y + b.y) / 2,
        originX: transform.x,
        originY: transform.y,
      }
    } else if (pointersRef.current.size === 1) {
      pinchRef.current = null
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX: transform.x,
        originY: transform.y,
      }
    }
  }, [transform.x, transform.y, transform.scale])

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }

    const pinch = pinchRef.current
    if (pinch) {
      const a = pointersRef.current.get(pinch.idA)
      const b = pointersRef.current.get(pinch.idB)
      if (a && b) {
        const distance = distanceBetween(a, b)
        const scale = clampScale(pinch.startScale * (distance / pinch.startDistance))
        const ratio = scale / pinch.startScale
        const midX = (a.x + b.x) / 2
        const midY = (a.y + b.y) / 2
        setTransform({
          x: midX - (pinch.startMidX - pinch.originX) * ratio,
          y: midY - (pinch.startMidY - pinch.originY) * ratio,
          scale,
        })
      }
      return
    }

    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    setTransform((prev) => ({
      ...prev,
      x: drag.originX + (e.clientX - drag.startX),
      y: drag.originY + (e.clientY - drag.startY),
    }))
  }, [])

  const endDrag = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId)

    const pinch = pinchRef.current
    if (pinch && (e.pointerId === pinch.idA || e.pointerId === pinch.idB)) {
      pinchRef.current = null
      // One finger may still be down — hand off to a fresh single-finger
      // pan anchored on its current position so it doesn't jump.
      const [remainingId] = pointersRef.current.keys()
      const remaining = remainingId !== undefined ? pointersRef.current.get(remainingId) : undefined
      if (remaining) {
        dragRef.current = {
          pointerId: remainingId,
          startX: remaining.x,
          startY: remaining.y,
          originX: transform.x,
          originY: transform.y,
        }
      }
      return
    }

    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null
  }, [transform.x, transform.y])

  // Keeps whatever's currently at the viewport center visually fixed while
  // the scale changes, instead of zooming toward the world's (0,0) origin
  // and drifting the tree off-screen.
  const zoomAroundCenter = useCallback((nextScale: (scale: number) => number) => {
    setTransform((prev) => {
      const scale = clampScale(nextScale(prev.scale))
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const ratio = scale / prev.scale
      return {
        x: cx - (cx - prev.x) * ratio,
        y: cy - (cy - prev.y) * ratio,
        scale,
      }
    })
  }, [])

  const handleWheel = useCallback(
    (e: WheelEvent<HTMLDivElement>) => {
      e.preventDefault()
      zoomAroundCenter((scale) => scale - e.deltaY * 0.001 * scale)
    },
    [zoomAroundCenter],
  )

  const zoomBy = (factor: number) => {
    zoomAroundCenter((scale) => scale * factor)
  }

  const resetView = () => setTransform(centeredView())

  // Same sequential-tier math the Store used to do — moved here as-is,
  // just now rendered inside the tree's modal instead of a Store card.
  const premiumOwnedCount = premiumCatalog.filter((u) => premiumOwned.has(u.id)).length
  const nextPremiumUpgrade: GemUpgradeDef | undefined = premiumCatalog[premiumOwnedCount]
  const isPremiumMaxed = !nextPremiumUpgrade
  const canAffordPremium = nextPremiumUpgrade ? gems >= nextPremiumUpgrade.cost : false
  const isBuyingThisPremium = nextPremiumUpgrade ? premiumBuyingId === nextPremiumUpgrade.id : false

  const handleBuyPremium = async () => {
    if (!nextPremiumUpgrade) return
    setPremiumError(null)
    const result = await buyPremium(nextPremiumUpgrade)
    if (!result.ok && result.error !== 'not-signed-in') {
      setPremiumError(result.error === 'not-enough-gems' ? strings.store.notEnoughGems : strings.store.purchaseError)
    }
  }

  const nodeById = Object.fromEntries(NODES.map((n) => [n.id, n]))
  // Every node with a real, buyable level today — anything else defaults
  // to 0 inside getRevealState, which is exactly right for placeholder
  // branches that don't have a purchase system yet.
  const realLevelById: Record<string, number> = {
    root: autoClickLevel,
    a1: luckLevel,
    a1b: scoutDroneLevel,
    a1b1: scoutFrequencyLevel,
    a2: luckChanceLevel,
    b1: multiShotLevel,
    c1: premiumOwnedCount,
    e1: multiplierLevel,
    e2a0: legendaryUnlockLevel,
    e2a: legendaryEaseLevel,
    e2a1: legendaryGrowthLevel,
    e2a2: legendaryThresholdLevel,
    e2b: autoMultiplierLevel,
    e2b1: offlineProductionLevel,
    e2c: tapMultiplierLevel,
    d1: anomalyUnlockLevel,
  }
  // Recomputed each render off the real levels above — cheap for a graph
  // this small, and keeps the reveal rule as the single source of truth
  // instead of duplicating "what's visible" as separate state.
  const revealStateById: Record<string, RevealState> = Object.fromEntries(
    NODES.filter((n) => n.id !== 'root').map((n) => [n.id, getRevealState(n.id, realLevelById)]),
  )
  const isVisible = (id: string) => id === 'root' || revealStateById[id] !== 'hidden'

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#08080c]">
      <div
        className="h-full w-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={handleWheel}
      >
        <div
          className="relative h-0 w-0"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
          }}
        >
          <svg width={1000} height={1000} className="pointer-events-none absolute left-0 top-0 overflow-visible">
            {EDGES.filter(({ from, to }) => isVisible(from) && isVisible(to)).map(({ from, to }) => {
              const a = nodeById[from]
              const b = nodeById[to]
              // A branch reads as "open" once the node it leads to is
              // actually unlocked — solid and lightly glowing instead of
              // the muted dashed line used while still waiting.
              const isUnlocked = revealStateById[to] === 'available'
              return (
                <motion.line
                  key={`${from}-${to}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={isUnlocked ? 'rgba(167,139,250,0.45)' : 'rgba(255,255,255,0.06)'}
                  strokeWidth={3}
                  strokeDasharray={isUnlocked ? undefined : '6 6'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: revealDelay(b, a.x, a.y), ease: 'easeOut' }}
                />
              )
            })}
          </svg>

          {NODES.filter(
            (node) =>
              node.id !== 'root' &&
              node.id !== 'c1' &&
              node.id !== 'b1' &&
              node.id !== 'a1' &&
              node.id !== 'a1b' &&
              node.id !== 'a1b1' &&
              node.id !== 'a2' &&
              node.id !== 'e1' &&
              node.id !== 'e2a' &&
              node.id !== 'e2b' &&
              node.id !== 'e2b1' &&
              node.id !== 'e2a1' &&
              node.id !== 'e2a2' &&
              node.id !== 'e2c' &&
              node.id !== 'd1' &&
              node.id !== 'd2' &&
              node.id !== 'd3' &&
              revealStateById[node.id] !== 'hidden',
          ).map((node) => {
            const revealState = revealStateById[node.id] as 'available' | 'locked'
            const family = PLACEHOLDER_FAMILY[node.id]
            const styleClass = revealState === 'available' && family ? family.style : NODE_STYLES[revealState]
            const iconClass = revealState === 'available' ? (family?.iconText ?? 'text-violet-300') : ''
            return (
              // Positioning (left/top + centering translate) lives on this
              // plain wrapper so framer-motion's own animated transform
              // (on the child below) doesn't fight it — motion overwrites
              // the whole `transform` style each frame, which would
              // silently drop a Tailwind translate class on the same node.
              <div
                key={node.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: node.x, top: node.y }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(node, CENTER, CENTER) }}
                  className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${styleClass}`}
                >
                  <Sparkles size={20} className={iconClass} />
                  <span className="whitespace-nowrap text-xs font-semibold">{node.label}</span>
                  {revealState === 'locked' && (
                    <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                      <Lock size={14} />
                    </span>
                  )}
                </motion.div>
              </div>
            )
          })}

          {/* Branch C — the premium gem multiplier, moved here from the
              Store (removed there entirely). Locked until root has a
              level, same as the rest of root's direct children; once
              unlocked it's a second real node, not a placeholder. */}
          {revealStateById.c1 === 'locked' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.c1.x, top: nodeById.c1.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.c1, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES.locked}`}
              >
                <Gem size={20} />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {premiumOwnedCount}
                </span>
                <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                  <Lock size={14} />
                </span>
              </motion.div>
            </div>
          )}

          {revealStateById.c1 === 'available' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.c1.x, top: nodeById.c1.y }}
            >
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowPremiumModal(true)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.c1, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-indigo-400/40 ${PREMIUM_NODE_STYLE}`}
              >
                <Gem size={20} className="text-indigo-300" />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {premiumOwnedCount}
                </span>

                {!isPremiumMaxed && canAffordPremium && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                    <ArrowUp size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {/* Branch B — Multidisparo, raises how many fingers can be firing
              at once (the actual cap is enforced on Home's own pointer
              handling). Same locked/available split as the other real
              nodes. */}
          {revealStateById.b1 === 'locked' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.b1.x, top: nodeById.b1.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.b1, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES.locked}`}
              >
                <Split size={20} />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {multiShotLevel}
                </span>
                <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                  <Lock size={14} />
                </span>
              </motion.div>
            </div>
          )}

          {revealStateById.b1 === 'available' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.b1.x, top: nodeById.b1.y }}
            >
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowMultiShotModal(true)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.b1, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-cyan-400/40 ${MULTI_SHOT_NODE_STYLE}`}
              >
                <Split size={20} className="text-cyan-300" />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {multiShotLevel}
                </span>

                {!isMultiShotMaxed && canAffordMultiShot && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                    <ArrowUp size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {/* Branch A — the permanent luck upgrade, moved here from the
              Store (removed there entirely). Same locked/available split
              as branch C. */}
          {revealStateById.a1 === 'locked' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.a1.x, top: nodeById.a1.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.a1, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES.locked}`}
              >
                <Sparkles size={20} />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {luckLevel}
                </span>
                <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                  <Lock size={14} />
                </span>
              </motion.div>
            </div>
          )}

          {revealStateById.a1 === 'available' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.a1.x, top: nodeById.a1.y }}
            >
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowLuckModal(true)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.a1, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-green-400/40 ${LUCK_NODE_STYLE}`}
              >
                <Sparkles size={20} className="text-green-300" />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {luckLevel}
                </span>

                {canAffordLuck && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                    <ArrowUp size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {/* Drones buscadores — a second, independent production unit, same
              plain level-counter shape as the regular drones (root), just
              stronger per-unit and pricier. Sobrecarga's own child now
              (see Branch F above), amber family throughout. */}
          {revealStateById.a1b === 'locked' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.a1b.x, top: nodeById.a1b.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.a1b, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES.locked}`}
              >
                <Radar size={20} />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {scoutDroneLevel}
                </span>
                <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                  <Lock size={14} />
                </span>
              </motion.div>
            </div>
          )}

          {revealStateById.a1b === 'available' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.a1b.x, top: nodeById.a1b.y }}
            >
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowScoutDroneModal(true)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.a1b, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-amber-400/40 ${AUTO_LUCK_NODE_STYLE}`}
              >
                <Radar size={20} className="text-amber-300" />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {scoutDroneLevel}
                </span>

                {canAffordScoutDrone && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                    <ArrowUp size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {/* Drones buscadores' own child — Frecuencia, a flat per-unit cps
              booster mirroring Sobrecarga but for scout drones. */}
          {revealStateById.a1b1 === 'locked' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.a1b1.x, top: nodeById.a1b1.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.a1b1, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES.locked}`}
              >
                <Radio size={20} />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {scoutFrequencyLevel}
                </span>
                <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                  <Lock size={14} />
                </span>
              </motion.div>
            </div>
          )}

          {revealStateById.a1b1 === 'available' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.a1b1.x, top: nodeById.a1b1.y }}
            >
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowScoutFrequencyModal(true)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.a1b1, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-amber-400/40 ${AUTO_LUCK_NODE_STYLE}`}
              >
                <Radio size={20} className="text-amber-300" />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {scoutFrequencyLevel}
                </span>

                {canAffordScoutFrequency && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                    <ArrowUp size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {/* Destello's own second node — raises the % chance itself (Destello
              raises the payout when it hits). Same green as Destello (same
              family), Telescope icon instead of Sparkles to tell them apart
              (Radar moved over to Dron buscador). Same locked/available
              split. */}
          {revealStateById.a2 === 'locked' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.a2.x, top: nodeById.a2.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.a2, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES.locked}`}
              >
                <Telescope size={20} />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {luckChanceLevel}
                </span>
                <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                  <Lock size={14} />
                </span>
              </motion.div>
            </div>
          )}

          {revealStateById.a2 === 'available' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.a2.x, top: nodeById.a2.y }}
            >
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowLuckChanceModal(true)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.a2, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-green-400/40 ${LUCK_NODE_STYLE}`}
              >
                <Telescope size={20} className="text-green-300" />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {luckChanceLevel}
                </span>

                {canAffordLuckChance && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                    <ArrowUp size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {/* Branch E — Fuerza, the manual click's base value (additive,
              same shape as autoclick's own production), sitting angularly
              between Suerte (a1) and Multiplicador premium (c1). Same
              locked/available split as the other two real branches. */}
          {revealStateById.e1 === 'locked' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.e1.x, top: nodeById.e1.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.e1, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES.locked}`}
              >
                <Crosshair size={20} />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {multiplierLevel}
                </span>
                <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                  <Lock size={14} />
                </span>
              </motion.div>
            </div>
          )}

          {revealStateById.e1 === 'available' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.e1.x, top: nodeById.e1.y }}
            >
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowMultiplierModal(true)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.e1, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-red-400/40 ${LEGENDARY_NODE_STYLE}`}
              >
                <Crosshair size={20} className="text-red-300" />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {multiplierLevel}
                </span>

                {canAffordMultiplier && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                    <ArrowUp size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {/* Multiplicador's direct children — Modo Legendario (e2a0, a
              single flat purchase gating the Legendary heat tier itself)
              fans out into Ritmo (e2a, shrinks the clicks it takes to level
              up) and Impulso (e2a1, grows the Legendary bonus step). All
              finite, same red Legendary family as Multiplicador itself —
              Sobrecarga used to live here too but now leads Branch F, its
              own root branch. */}
          {revealStateById.e2a0 === 'locked' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.e2a0.x, top: nodeById.e2a0.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.e2a0, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES.locked}`}
              >
                <Zap size={20} />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {legendaryUnlockLevel}
                </span>
                <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                  <Lock size={14} />
                </span>
              </motion.div>
            </div>
          )}

          {revealStateById.e2a0 === 'available' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.e2a0.x, top: nodeById.e2a0.y }}
            >
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowLegendaryUnlockModal(true)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.e2a0, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-red-400/40 ${LEGENDARY_NODE_STYLE}`}
              >
                <Zap size={20} className="text-red-300" />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {legendaryUnlockLevel}
                </span>

                {!isLegendaryUnlockMaxed && canAffordLegendaryUnlock && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                    <ArrowUp size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {revealStateById.e2a === 'locked' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.e2a.x, top: nodeById.e2a.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.e2a, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES.locked}`}
              >
                <Gauge size={20} />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {legendaryEaseLevel}
                </span>
                <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                  <Lock size={14} />
                </span>
              </motion.div>
            </div>
          )}

          {revealStateById.e2a === 'available' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.e2a.x, top: nodeById.e2a.y }}
            >
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowLegendaryEaseModal(true)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.e2a, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-red-400/40 ${LEGENDARY_NODE_STYLE}`}
              >
                <Gauge size={20} className="text-red-300" />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {legendaryEaseLevel}
                </span>

                {!isLegendaryEaseMaxed && canAffordLegendaryEase && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                    <ArrowUp size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {revealStateById.e2a1 === 'locked' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.e2a1.x, top: nodeById.e2a1.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.e2a1, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES.locked}`}
              >
                <ChevronsUp size={20} />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {legendaryGrowthLevel}
                </span>
                <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                  <Lock size={14} />
                </span>
              </motion.div>
            </div>
          )}

          {revealStateById.e2a1 === 'available' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.e2a1.x, top: nodeById.e2a1.y }}
            >
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowLegendaryGrowthModal(true)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.e2a1, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-red-400/40 ${LEGENDARY_NODE_STYLE}`}
              >
                <ChevronsUp size={20} className="text-red-300" />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {legendaryGrowthLevel}
                </span>

                {!isLegendaryGrowthMaxed && canAffordLegendaryGrowth && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                    <ArrowUp size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {revealStateById.e2a2 === 'locked' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.e2a2.x, top: nodeById.e2a2.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.e2a2, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES.locked}`}
              >
                <ChevronsDown size={20} />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {legendaryThresholdLevel}
                </span>
                <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                  <Lock size={14} />
                </span>
              </motion.div>
            </div>
          )}

          {revealStateById.e2a2 === 'available' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.e2a2.x, top: nodeById.e2a2.y }}
            >
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowLegendaryThresholdModal(true)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.e2a2, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-red-400/40 ${LEGENDARY_NODE_STYLE}`}
              >
                <ChevronsDown size={20} className="text-red-300" />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {legendaryThresholdLevel}
                </span>

                {!isLegendaryThresholdMaxed && canAffordLegendaryThreshold && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                    <ArrowUp size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {revealStateById.e2b === 'locked' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.e2b.x, top: nodeById.e2b.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.e2b, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES.locked}`}
              >
                <Atom size={20} />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {autoMultiplierLevel}
                </span>
                <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                  <Lock size={14} />
                </span>
              </motion.div>
            </div>
          )}

          {revealStateById.e2b === 'available' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.e2b.x, top: nodeById.e2b.y }}
            >
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowAutoMultiplierModal(true)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.e2b, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-amber-400/40 ${AUTO_LUCK_NODE_STYLE}`}
              >
                <Atom size={20} className="text-amber-300" />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {autoMultiplierLevel}
                </span>

                {!isAutoMultiplierMaxed && canAffordAutoMultiplier && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                    <ArrowUp size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {/* Sobrecarga's own child — Autonomía, raises how much of the
              fleet's real rate still applies to time spent genuinely away
              (not just idling with the tab open). Same amber family. */}
          {revealStateById.e2b1 === 'locked' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.e2b1.x, top: nodeById.e2b1.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.e2b1, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES.locked}`}
              >
                <Moon size={20} />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {offlineProductionLevel}
                </span>
                <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                  <Lock size={14} />
                </span>
              </motion.div>
            </div>
          )}

          {revealStateById.e2b1 === 'available' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.e2b1.x, top: nodeById.e2b1.y }}
            >
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowOfflineProductionModal(true)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.e2b1, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-amber-400/40 ${AUTO_LUCK_NODE_STYLE}`}
              >
                <Moon size={20} className="text-amber-300" />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {offlineProductionLevel}
                </span>

                {!isOfflineProductionMaxed && canAffordOfflineProduction && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                    <ArrowUp size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {/* Multiplicador's other direct child (besides Modo Legendario) —
              Amplificador, a genuine ×multiplier stacked on top of the
              additive base click value. Same red Legendary family. */}
          {revealStateById.e2c === 'locked' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.e2c.x, top: nodeById.e2c.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.e2c, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES.locked}`}
              >
                <Radiation size={20} />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {tapMultiplierLevel}
                </span>
                <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                  <Lock size={14} />
                </span>
              </motion.div>
            </div>
          )}

          {revealStateById.e2c === 'available' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.e2c.x, top: nodeById.e2c.y }}
            >
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowTapMultiplierModal(true)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.e2c, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-red-400/40 ${LEGENDARY_NODE_STYLE}`}
              >
                <Radiation size={20} className="text-red-300" />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {tapMultiplierLevel}
                </span>

                {canAffordTapMultiplier && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                    <ArrowUp size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {/* Branch D — Anomalías, a one-time gate on Home's "Anomalía"
              mini-event itself (same shape as Modo Legendario gating the
              Legendary heat tier), forking into Extracción and Detección.
              Orange, its own family. */}
          {revealStateById.d1 === 'locked' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.d1.x, top: nodeById.d1.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.d1, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES.locked}`}
              >
                <Orbit size={20} />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {anomalyUnlockLevel}
                </span>
                <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                  <Lock size={14} />
                </span>
              </motion.div>
            </div>
          )}

          {revealStateById.d1 === 'available' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.d1.x, top: nodeById.d1.y }}
            >
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowAnomalyUnlockModal(true)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.d1, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-orange-400/40 ${ANOMALY_NODE_STYLE}`}
              >
                <Orbit size={20} className="text-orange-300" />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {anomalyUnlockLevel}
                </span>

                {!isAnomalyUnlockMaxed && canAffordAnomalyUnlock && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                    <ArrowUp size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {revealStateById.d2 === 'locked' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.d2.x, top: nodeById.d2.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.d2, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES.locked}`}
              >
                <Pickaxe size={20} />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {anomalyRewardLevel}
                </span>
                <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                  <Lock size={14} />
                </span>
              </motion.div>
            </div>
          )}

          {revealStateById.d2 === 'available' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.d2.x, top: nodeById.d2.y }}
            >
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowAnomalyRewardModal(true)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.d2, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-orange-400/40 ${ANOMALY_NODE_STYLE}`}
              >
                <Pickaxe size={20} className="text-orange-300" />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {anomalyRewardLevel}
                </span>

                {!isAnomalyRewardMaxed && canAffordAnomalyReward && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                    <ArrowUp size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {revealStateById.d3 === 'locked' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.d3.x, top: nodeById.d3.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.d3, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES.locked}`}
              >
                <Timer size={20} />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {anomalyFrequencyLevel}
                </span>
                <span className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-neutral-200 shadow-md">
                  <Lock size={14} />
                </span>
              </motion.div>
            </div>
          )}

          {revealStateById.d3 === 'available' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: nodeById.d3.x, top: nodeById.d3.y }}
            >
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowAnomalyFrequencyModal(true)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: revealDelay(nodeById.d3, CENTER, CENTER) }}
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-orange-400/40 ${ANOMALY_NODE_STYLE}`}
              >
                <Timer size={20} className="text-orange-300" />
                <span className="whitespace-nowrap text-xs font-semibold">
                  {strings.tree.level} {anomalyFrequencyLevel}
                </span>

                {!isAnomalyFrequencyMaxed && canAffordAnomalyFrequency && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                    <ArrowUp size={13} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {/* Root — the only real node so far: a repeatable auto-click
              upgrade. Tap opens the info modal (with the actual buy
              button inside it) instead of buying directly; everything
              else in the tree is still just a visual placeholder. */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              // Tapping this node during the tutorial also satisfies its
              // auto-advance (see TutorialOverlay's document-level listener)
              // in the very same tap — that fires off the raw `pointerdown`,
              // synchronously, *before* this `click` handler ever runs. With
              // the drone already owned (skipDroneGrant), that advance jumps
              // straight past pointTreeBuy to closing, so checking
              // `currentStep?.id` here was racy: by the time this runs, it
              // had *already* moved past pointTreeRoot/pointTreeBuy even for
              // the one legitimate tap that's supposed to open this exact
              // modal, blocking it outright. `skipDroneGrant` itself doesn't
              // change mid-tap — it's set once, for the whole replay session,
              // by the "?" button (Tree.tsx's tutorial.start call) — so it's
              // what should actually gate this, not the step id: skip the
              // modal only when the drone's already owned (the tutorial is
              // deliberately fast-forwarding past this node, and opening it
              // anyway is what used to get stuck open behind the closing
              // overlay), never based on which step the race already landed
              // on.
              if (tutorial.isActive && tutorial.skipDroneGrant) {
                return
              }
              setShowAutoClickModal(true)
            }}
            data-tutorial="tree-root-node"
            className="absolute flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1.5 rounded-full border border-violet-400/20 bg-[#14101f] text-center text-violet-200 shadow-lg shadow-black/20 transition-colors hover:border-violet-400/35"
            style={{ left: CENTER, top: CENTER }}
          >
            <span className="text-violet-300">
              <DroneIcon size={20} />
            </span>
            <span className="whitespace-nowrap text-xs font-semibold">
              {strings.tree.level} {autoClickLevel}
            </span>

            {/* Real affordability signal, separate from the node's own
                (always-violet) color — same tinted-glass badge recipe as
                the node itself, just recolored to green. */}
            {canAffordAutoClick && (
              <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-green-400/30 bg-[#0f1f16] text-green-400 shadow-black/20">
                <ArrowUp size={13} strokeWidth={3} />
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="fixed bottom-24 right-4 z-10 flex flex-col gap-1.5 sm:bottom-28 sm:right-6">
        {/* Replay entry point — sits right above the zoom stack so it reads
            as part of the same control cluster instead of a random extra
            button. Confirms first since it's a deliberate re-watch, not an
            accidental tap target. */}
        <button
          onClick={() => setShowTutorialConfirm(true)}
          aria-label={strings.tutorial.replayAriaLabel}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/20 bg-black/40 text-violet-300 backdrop-blur-xl transition-colors hover:bg-white/10"
        >
          <HelpCircle size={16} />
        </button>
        <button
          onClick={() => zoomBy(1.25)}
          aria-label={strings.tree.zoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-neutral-300 backdrop-blur-xl transition-colors hover:bg-white/10"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => zoomBy(0.8)}
          aria-label={strings.tree.zoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-neutral-300 backdrop-blur-xl transition-colors hover:bg-white/10"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={resetView}
          aria-label={strings.tree.resetView}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-neutral-300 backdrop-blur-xl transition-colors hover:bg-white/10"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {showTutorialConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowTutorialConfirm(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="text-violet-300">
                <HelpCircle size={18} />
              </span>
              <p className="text-sm font-semibold text-white">{strings.tutorial.replayConfirmTitle}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTutorialConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-neutral-300 transition-colors hover:bg-white/[0.06]"
              >
                {strings.tutorial.replayConfirmNo}
              </button>
              <button
                onClick={() => {
                  setShowTutorialConfirm(false)
                  tutorial.start({ skipDroneGrant: autoClickLevel > 0 })
                }}
                className="flex-1 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-500/15"
              >
                {strings.tutorial.replayConfirmYes}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAutoClickModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowAutoClickModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAutoClickModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <span className="text-violet-300">
                <DroneIcon size={18} />
              </span>
              <p className="text-sm font-semibold text-white">{strings.tree.autoClickName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">
              {strings.tree.autoClickDesc(autoMultiplierValue.toLocaleString(locale, { maximumFractionDigits: 2 }), cpsUnit)}
            </p>

            {/* Buying this node literally buys one more drone — the stat
                block shows the drone count itself (what the purchase adds),
                not the resulting cps, which lives elsewhere (Home's own
                "Auto" pill). Per-drone output is stated in the description
                above; a future node raises that per-drone rate instead of
                this one, which stays "buy another drone". */}
            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentRate}{' '}
                <span className="font-semibold text-white">
                  {autoClickLevel.toLocaleString(locale)} {strings.tree.dronesUnit}
                </span>
              </span>
              {!isAutoClickMaxed && (
                <span>
                  {strings.tree.nextLevelRate}{' '}
                  <span className="font-semibold text-white">
                    {(autoClickLevel + 1).toLocaleString(locale)} {strings.tree.dronesUnit}
                  </span>
                </span>
              )}
            </div>

            {isAutoClickMaxed ? (
              <div className="relative w-full rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-red-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={
                  tutorial.currentStep?.id === 'pointTreeBuy'
                    ? async () => {
                        const result = await grantAutoClickFree()
                        if (result.ok) {
                          tutorial.advance()
                          setShowAutoClickModal(false)
                        }
                      }
                    : buyAutoClick
                }
                isBuying={isBuying}
                canAfford={canAffordAutoClick}
                buyingLabel={strings.tree.upgrading}
                cost={autoClickNextCost ?? 0}
                balance={totalClicks}
                locale={locale}
                currency="clicks"
                dataTutorial="tree-buy-root"
                isFree={tutorial.currentStep?.id === 'pointTreeBuy'}
                freeLabel={strings.tutorial.freeLabel}
              />
            )}
          </div>
        </div>
      )}

      {showPremiumModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowPremiumModal(false)}
        >
          <div
            className="relative w-full max-w-xs overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-fuchsia-500/10 blur-2xl" />

            <button
              onClick={() => setShowPremiumModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="relative mb-3 flex items-center gap-2">
              <Gem size={18} className="text-fuchsia-300" />
              <p className="text-sm font-semibold text-white">{strings.store.moneyUpgradesTitle}</p>
            </div>
            <p className="relative mb-4 text-sm text-neutral-400">{strings.tree.premiumDesc}</p>

            <div className="relative mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentMultiplier}{' '}
                <span className="font-semibold text-white">
                  {premiumBestOwned ? `×${premiumBestOwned.multiplier}` : strings.store.noUpgradeYet}
                </span>
              </span>
              {!isPremiumMaxed && (
                <span>
                  {strings.tree.nextMultiplier}{' '}
                  <span className="font-semibold text-white">×{nextPremiumUpgrade.multiplier}</span>
                </span>
              )}
            </div>

            {isPremiumMaxed ? (
              <div className="relative w-full rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-fuchsia-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={handleBuyPremium}
                isBuying={isBuyingThisPremium}
                canAfford={canAffordPremium}
                buyingLabel={strings.tree.upgrading}
                cost={nextPremiumUpgrade.cost}
                balance={gems}
                locale={locale}
                currency="gems"
              />
            )}

            {premiumError && <p className="relative mt-2 text-xs text-red-400">{premiumError}</p>}
          </div>
        </div>
      )}

      {showLuckModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowLuckModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLuckModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-green-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.luckName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.luckDesc}</p>

            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentMultiplier}{' '}
                <span className="font-semibold text-white">×{luckMultiplier}</span>
              </span>
              {!isLuckMaxed && (
                <span>
                  {strings.tree.nextMultiplier}{' '}
                  <span className="font-semibold text-white">×{luckMultiplier + 1}</span>
                </span>
              )}
            </div>

            {isLuckMaxed ? (
              <div className="relative w-full rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-red-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={buyLuck}
                isBuying={isBuyingLuck}
                canAfford={canAffordLuck}
                buyingLabel={strings.tree.upgrading}
                cost={luckNextCost ?? 0}
                balance={totalClicks}
                locale={locale}
                currency="clicks"
              />
            )}
          </div>
        </div>
      )}

      {showLuckChanceModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowLuckChanceModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLuckChanceModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <Telescope size={18} className="text-green-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.luckChanceName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.luckChanceDesc}</p>

            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentChance}{' '}
                <span className="font-semibold text-white">{formatChance(luckChance)}</span>
              </span>
              {!isLuckChanceMaxed && (
                <span>
                  {strings.tree.nextChance}{' '}
                  <span className="font-semibold text-white">{formatChance(luckChance + 0.01)}</span>
                </span>
              )}
            </div>

            {isLuckChanceMaxed ? (
              <div className="relative w-full rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-red-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={buyLuckChance}
                isBuying={isBuyingLuckChance}
                canAfford={canAffordLuckChance}
                buyingLabel={strings.tree.upgrading}
                cost={luckChanceNextCost ?? 0}
                balance={totalClicks}
                locale={locale}
                currency="clicks"
              />
            )}
          </div>
        </div>
      )}

      {showMultiplierModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowMultiplierModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowMultiplierModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <Crosshair size={18} className="text-red-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.multiplierName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.multiplierDesc}</p>

            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentClickValue}{' '}
                <span className="font-semibold text-white">{multiplierValue}</span>
              </span>
              {!isMultiplierMaxed && (
                <span>
                  {strings.tree.nextClickValue}{' '}
                  <span className="font-semibold text-white">{multiplierNextValue}</span>
                </span>
              )}
            </div>

            {isMultiplierMaxed ? (
              <div className="relative w-full rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-red-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={buyMultiplier}
                isBuying={isBuyingMultiplier}
                canAfford={canAffordMultiplier}
                buyingLabel={strings.tree.upgrading}
                cost={multiplierNextCost ?? 0}
                balance={totalClicks}
                locale={locale}
                currency="clicks"
              />
            )}
          </div>
        </div>
      )}

      {showLegendaryGrowthModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowLegendaryGrowthModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLegendaryGrowthModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <ChevronsUp size={18} className="text-red-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.legendaryGrowthName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.legendaryGrowthDesc}</p>

            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentBonusStep}{' '}
                <span className="font-semibold text-white">+{legendaryBonusStep.toFixed(1)}</span>
              </span>
              {!isLegendaryGrowthMaxed && (
                <span>
                  {strings.tree.nextBonusStep}{' '}
                  <span className="font-semibold text-white">+{(legendaryBonusStep + 0.1).toFixed(1)}</span>
                </span>
              )}
            </div>

            {isLegendaryGrowthMaxed ? (
              <div className="relative w-full rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-red-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={buyLegendaryGrowth}
                isBuying={isBuyingLegendaryGrowth}
                canAfford={canAffordLegendaryGrowth}
                buyingLabel={strings.tree.upgrading}
                cost={legendaryGrowthNextCost ?? 0}
                balance={totalClicks}
                locale={locale}
                currency="clicks"
              />
            )}
          </div>
        </div>
      )}

      {showLegendaryThresholdModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowLegendaryThresholdModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLegendaryThresholdModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <ChevronsDown size={18} className="text-red-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.legendaryThresholdName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.legendaryThresholdDesc}</p>

            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentThresholdTps}{' '}
                <span className="font-semibold text-white">{legendaryThresholdTps} {strings.home.tps}</span>
              </span>
              {!isLegendaryThresholdMaxed && (
                <span>
                  {strings.tree.nextThresholdTps}{' '}
                  <span className="font-semibold text-white">{legendaryThresholdTps - 1} {strings.home.tps}</span>
                </span>
              )}
            </div>

            {isLegendaryThresholdMaxed ? (
              <div className="relative w-full rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-red-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={buyLegendaryThreshold}
                isBuying={isBuyingLegendaryThreshold}
                canAfford={canAffordLegendaryThreshold}
                buyingLabel={strings.tree.upgrading}
                cost={legendaryThresholdNextCost ?? 0}
                balance={totalClicks}
                locale={locale}
                currency="clicks"
              />
            )}
          </div>
        </div>
      )}

      {showLegendaryUnlockModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowLegendaryUnlockModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLegendaryUnlockModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <Zap size={18} className="text-red-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.legendaryUnlockName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.legendaryUnlockDesc(legendaryThresholdTps.toString())}</p>

            {isLegendaryUnlockMaxed ? (
              <div className="relative w-full rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-red-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={buyLegendaryUnlock}
                isBuying={isBuyingLegendaryUnlock}
                canAfford={canAffordLegendaryUnlock}
                buyingLabel={strings.tree.upgrading}
                cost={legendaryUnlockNextCost ?? 0}
                balance={totalClicks}
                locale={locale}
                currency="clicks"
              />
            )}
          </div>
        </div>
      )}

      {showLegendaryEaseModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowLegendaryEaseModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLegendaryEaseModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <Gauge size={18} className="text-red-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.legendaryEaseName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.legendaryEaseDesc}</p>

            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentStreakClicks}{' '}
                <span className="font-semibold text-white">{legendaryStreakBase}</span>
              </span>
              {!isLegendaryEaseMaxed && (
                <span>
                  {strings.tree.nextStreakClicks}{' '}
                  <span className="font-semibold text-white">{legendaryStreakBase - 5}</span>
                </span>
              )}
            </div>

            {isLegendaryEaseMaxed ? (
              <div className="relative w-full rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-red-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={buyLegendaryEase}
                isBuying={isBuyingLegendaryEase}
                canAfford={canAffordLegendaryEase}
                buyingLabel={strings.tree.upgrading}
                cost={legendaryEaseNextCost ?? 0}
                balance={totalClicks}
                locale={locale}
                currency="clicks"
              />
            )}
          </div>
        </div>
      )}

      {showScoutDroneModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowScoutDroneModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowScoutDroneModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <Radar size={18} className="text-amber-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.scoutDroneName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.scoutDroneDesc}</p>

            {/* Same shape as the regular Drones modal — buying this adds one
                more scout drone; per-unit output (2 pt/s base) is stated in
                the description above, Frecuencia raises that rate instead of
                this node, which stays "buy another scout drone". */}
            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.scoutDroneCurrentLabel}{' '}
                <span className="font-semibold text-white">{scoutDroneLevel.toLocaleString(locale)}</span>
              </span>
              {!isScoutDroneMaxed && (
                <span>
                  {strings.tree.scoutDroneNextLabel}{' '}
                  <span className="font-semibold text-white">{(scoutDroneLevel + 1).toLocaleString(locale)}</span>
                </span>
              )}
            </div>

            {isScoutDroneMaxed ? (
              <div className="relative w-full rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-red-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={buyScoutDrone}
                isBuying={isBuyingScoutDrone}
                canAfford={canAffordScoutDrone}
                buyingLabel={strings.tree.upgrading}
                cost={scoutDroneNextCost ?? 0}
                balance={totalClicks}
                locale={locale}
                currency="clicks"
              />
            )}
          </div>
        </div>
      )}

      {showScoutFrequencyModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowScoutFrequencyModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowScoutFrequencyModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <Radio size={18} className="text-amber-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.scoutFrequencyName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.scoutFrequencyDesc}</p>

            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentProduction}{' '}
                <span className="font-semibold text-white">
                  {scoutDroneRate.toLocaleString(locale, { maximumFractionDigits: 2 })} {cpsUnit}
                </span>
              </span>
              {!isScoutFrequencyMaxed && (
                <span>
                  {strings.tree.nextProduction}{' '}
                  <span className="font-semibold text-white">
                    {(scoutDroneRate + 1).toLocaleString(locale, { maximumFractionDigits: 2 })} {cpsUnit}
                  </span>
                </span>
              )}
            </div>

            {isScoutFrequencyMaxed ? (
              <div className="relative w-full rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-red-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={buyScoutFrequency}
                isBuying={isBuyingScoutFrequency}
                canAfford={canAffordScoutFrequency}
                buyingLabel={strings.tree.upgrading}
                cost={scoutFrequencyNextCost ?? 0}
                balance={totalClicks}
                locale={locale}
                currency="clicks"
              />
            )}
          </div>
        </div>
      )}

      {showAutoMultiplierModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowAutoMultiplierModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAutoMultiplierModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <Atom size={18} className="text-amber-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.turboName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.turboDesc}</p>

            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentProduction}{' '}
                <span className="font-semibold text-white">
                  {autoMultiplierValue.toLocaleString(locale, {
                    maximumFractionDigits: 2,
                  })}{' '}
                  {cpsUnit}
                </span>
              </span>
              {!isAutoMultiplierMaxed && (
                <span>
                  {strings.tree.nextProduction}{' '}
                  <span className="font-semibold text-white">
                    {autoMultiplierNextValue.toLocaleString(locale, {
                      maximumFractionDigits: 2,
                    })}{' '}
                    {cpsUnit}
                  </span>
                </span>
              )}
            </div>

            {isAutoMultiplierMaxed ? (
              <div className="relative w-full rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-red-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={buyAutoMultiplier}
                isBuying={isBuyingAutoMultiplier}
                canAfford={canAffordAutoMultiplier}
                buyingLabel={strings.tree.upgrading}
                cost={autoMultiplierNextCost ?? 0}
                balance={totalClicks}
                locale={locale}
                currency="clicks"
              />
            )}
          </div>
        </div>
      )}

      {showTapMultiplierModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowTapMultiplierModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTapMultiplierModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <Radiation size={18} className="text-red-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.tapMultiplierName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.tapMultiplierDesc}</p>

            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentMultiplier}{' '}
                <span className="font-semibold text-white">×{tapMultiplierValue}</span>
              </span>
              {!isTapMultiplierMaxed && (
                <span>
                  {strings.tree.nextMultiplier}{' '}
                  <span className="font-semibold text-white">×{tapMultiplierValue + 1}</span>
                </span>
              )}
            </div>

            {isTapMultiplierMaxed ? (
              <div className="relative w-full rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-red-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={buyTapMultiplier}
                isBuying={isBuyingTapMultiplier}
                canAfford={canAffordTapMultiplier}
                buyingLabel={strings.tree.upgrading}
                cost={tapMultiplierNextCost ?? 0}
                balance={totalClicks}
                locale={locale}
                currency="clicks"
              />
            )}
          </div>
        </div>
      )}

      {showMultiShotModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowMultiShotModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowMultiShotModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <Split size={18} className="text-cyan-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.multiShotName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.multiShotDesc}</p>

            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentMultiShot}{' '}
                <span className="font-semibold text-white">{multiShotValue}</span>
              </span>
              {!isMultiShotMaxed && (
                <span>
                  {strings.tree.nextMultiShot}{' '}
                  <span className="font-semibold text-white">{multiShotValue + 1}</span>
                </span>
              )}
            </div>

            {isMultiShotMaxed ? (
              <div className="relative w-full rounded-xl border border-cyan-400/20 bg-cyan-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-cyan-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={buyMultiShot}
                isBuying={isBuyingMultiShot}
                canAfford={canAffordMultiShot}
                buyingLabel={strings.tree.upgrading}
                cost={multiShotNextCost ?? 0}
                balance={totalClicks}
                locale={locale}
                currency="clicks"
              />
            )}
          </div>
        </div>
      )}

      {showAnomalyUnlockModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowAnomalyUnlockModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAnomalyUnlockModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <Orbit size={18} className="text-orange-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.anomalyUnlockName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.anomalyUnlockDesc(currentMaterialName)}</p>

            {isAnomalyUnlockMaxed ? (
              <div className="relative w-full rounded-xl border border-orange-400/20 bg-orange-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-orange-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={buyAnomalyUnlock}
                isBuying={isBuyingAnomalyUnlock}
                canAfford={canAffordAnomalyUnlock}
                buyingLabel={strings.tree.upgrading}
                cost={anomalyUnlockNextCost ?? 0}
                balance={totalClicks}
                locale={locale}
                currency="clicks"
              />
            )}
          </div>
        </div>
      )}

      {showAnomalyRewardModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowAnomalyRewardModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAnomalyRewardModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <Pickaxe size={18} className="text-orange-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.anomalyRewardName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.anomalyRewardDesc(currentMaterialName)}</p>

            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentAnomalyReward}{' '}
                <span className="font-semibold text-white">{formatChance(anomalyRewardValue)}</span>
              </span>
              {!isAnomalyRewardMaxed && (
                <span>
                  {strings.tree.nextAnomalyReward}{' '}
                  <span className="font-semibold text-white">{formatChance(anomalyRewardValue + 0.005)}</span>
                </span>
              )}
            </div>

            {isAnomalyRewardMaxed ? (
              <div className="relative w-full rounded-xl border border-orange-400/20 bg-orange-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-orange-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={buyAnomalyReward}
                isBuying={isBuyingAnomalyReward}
                canAfford={canAffordAnomalyReward}
                buyingLabel={strings.tree.upgrading}
                cost={anomalyRewardNextCost ?? 0}
                balance={totalClicks}
                locale={locale}
                currency="clicks"
              />
            )}
          </div>
        </div>
      )}

      {showAnomalyFrequencyModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowAnomalyFrequencyModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAnomalyFrequencyModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <Timer size={18} className="text-orange-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.anomalyFrequencyName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.anomalyFrequencyDesc}</p>

            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentAnomalyFrequency}{' '}
                <span className="font-semibold text-white">{strings.tree.formatAnomalyWait(anomalyFrequencySeconds)}</span>
              </span>
              {!isAnomalyFrequencyMaxed && (
                <span>
                  {strings.tree.nextAnomalyFrequency}{' '}
                  <span className="font-semibold text-white">
                    {strings.tree.formatAnomalyWait(Math.max(30, anomalyFrequencySeconds - 30))}
                  </span>
                </span>
              )}
            </div>

            {isAnomalyFrequencyMaxed ? (
              <div className="relative w-full rounded-xl border border-orange-400/20 bg-orange-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-orange-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={buyAnomalyFrequency}
                isBuying={isBuyingAnomalyFrequency}
                canAfford={canAffordAnomalyFrequency}
                buyingLabel={strings.tree.upgrading}
                cost={anomalyFrequencyNextCost ?? 0}
                balance={totalClicks}
                locale={locale}
                currency="clicks"
              />
            )}
          </div>
        </div>
      )}

      {showOfflineProductionModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
          onClick={() => setShowOfflineProductionModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0d14] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowOfflineProductionModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
            >
              <X size={16} />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <Moon size={18} className="text-amber-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.offlineProductionName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.offlineProductionDesc}</p>

            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentOfflineProduction}{' '}
                <span className="font-semibold text-white">{formatChance(offlineProductionValue)}</span>
              </span>
              {!isOfflineProductionMaxed && (
                <span>
                  {strings.tree.nextOfflineProduction}{' '}
                  <span className="font-semibold text-white">
                    {formatChance(offlineProductionValue + 0.01)}
                  </span>
                </span>
              )}
            </div>

            {isOfflineProductionMaxed ? (
              <div className="relative w-full rounded-xl border border-amber-400/20 bg-amber-500/[0.07] px-4 py-2.5 text-center text-sm font-semibold text-amber-200">
                {strings.store.maxLevel}
              </div>
            ) : (
              <TreeBuyButton
                onClick={buyOfflineProduction}
                isBuying={isBuyingOfflineProduction}
                canAfford={canAffordOfflineProduction}
                buyingLabel={strings.tree.upgrading}
                cost={offlineProductionNextCost ?? 0}
                balance={totalClicks}
                locale={locale}
                currency="clicks"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
