import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, Asterisk, Bot, Clover, Gem, Lock, Minus, MousePointerClick, Plus, RotateCcw, Sparkles, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useTreeContext } from '../context/TreeContext'
import { useGemUpgradesContext, type GemUpgradeDef } from '../context/GemUpgradesContext'
import { useGemsContext } from '../context/GemsContext'

// Radial stagger for the reveal pop — nodes closer to whatever unlocked
// them animate in first, farther ones follow a beat later, so a whole
// batch (e.g. every "+2" node at once) ripples outward instead of all
// popping in simultaneously.
function revealDelay(node: { x: number; y: number }, originX: number, originY: number): number {
  const distance = Math.hypot(node.x - originX, node.y - originY)
  return Math.min(distance / 900, 0.5)
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

  // Branch A — long single chain curving up and to the right, with one
  // short side twig off the first node.
  { id: 'a1', x: CENTER + 140, y: CENTER - 100, label: 'Mejora' },
  { id: 'a1b', x: CENTER + 60, y: CENTER - 220, label: 'Mejora' },
  { id: 'a2', x: CENTER + 260, y: CENTER - 200, label: 'Mejora' },
  { id: 'a3', x: CENTER + 400, y: CENTER - 240, label: 'Mejora+' },

  // Branch B — short reach left that forks into two.
  { id: 'b1', x: CENTER - 170, y: CENTER + 20, label: 'Mejora' },
  { id: 'b2a', x: CENTER - 320, y: CENTER - 60, label: 'Mejora' },
  { id: 'b2b', x: CENTER - 330, y: CENTER + 110, label: 'Mejora' },
  { id: 'b3', x: CENTER - 460, y: CENTER - 120, label: 'Mejora+' },

  // Branch C — one lone node straight down, nothing beyond it yet.
  { id: 'c1', x: CENTER + 10, y: CENTER + 165, label: 'Mejora' },

  // Branch D — long chain up and slightly left.
  { id: 'd1', x: CENTER - 100, y: CENTER - 160, label: 'Mejora' },
  { id: 'd2', x: CENTER - 170, y: CENTER - 310, label: 'Mejora' },
  { id: 'd3', x: CENTER - 80, y: CENTER - 440, label: 'Mejora+' },

  // Branch E — forks into two, one of which reaches one node further.
  { id: 'e1', x: CENTER + 150, y: CENTER + 110, label: 'Mejora' },
  { id: 'e2a', x: CENTER + 280, y: CENTER + 60, label: 'Mejora' },
  { id: 'e2b', x: CENTER + 260, y: CENTER + 220, label: 'Mejora' },
  { id: 'e3a', x: CENTER + 420, y: CENTER + 20, label: 'Mejora+' },
]

const EDGES: TreeEdge[] = [
  { from: 'root', to: 'a1' },
  { from: 'a1', to: 'a1b' },
  { from: 'a1', to: 'a2' },
  { from: 'a2', to: 'a3' },

  { from: 'root', to: 'b1' },
  { from: 'b1', to: 'b2a' },
  { from: 'b1', to: 'b2b' },
  { from: 'b2a', to: 'b3' },

  { from: 'root', to: 'c1' },

  { from: 'root', to: 'd1' },
  { from: 'd1', to: 'd2' },
  { from: 'd2', to: 'd3' },

  { from: 'root', to: 'e1' },
  { from: 'e1', to: 'e2a' },
  { from: 'e1', to: 'e2b' },
  { from: 'e2a', to: 'e3a' },
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
// Store) — green/Clover, matching the old "Suerte" card's color exactly,
// same opaque-dark-backing recipe as the other two real nodes.
const LUCK_NODE_STYLE = 'border-green-400/25 bg-[#0f1f16] text-green-200 shadow-black/20'

// Branch E's node (the base click-value multiplier) — sky blue, unused by
// anything else on this page, same opaque-dark-backing recipe.
const MULTIPLIER_NODE_STYLE = 'border-sky-400/25 bg-[#0a1a24] text-sky-200 shadow-black/20'

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
  const { totalClicks } = useClickCounterContext()
  const {
    autoClickLevel,
    autoClickCps,
    autoClickNextCost,
    autoClickNextCps,
    isBuying,
    buyAutoClick,
    luckLevel,
    luckMultiplier,
    luckNextCost,
    isBuyingLuck,
    buyLuck,
    multiplierLevel,
    multiplierValue,
    multiplierNextCost,
    isBuyingMultiplier,
    buyMultiplier,
  } = useTreeContext()
  const canAffordAutoClick = totalClicks >= autoClickNextCost
  const canAffordLuck = totalClicks >= luckNextCost
  const canAffordMultiplier = totalClicks >= multiplierNextCost
  const { catalog: premiumCatalog, owned: premiumOwned, bestOwned: premiumBestOwned, buyingId: premiumBuyingId, buy: buyPremium } =
    useGemUpgradesContext()
  const { gems } = useGemsContext()
  const [transform, setTransform] = useState(centeredView)
  const [showAutoClickModal, setShowAutoClickModal] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showLuckModal, setShowLuckModal] = useState(false)
  const [showMultiplierModal, setShowMultiplierModal] = useState(false)
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
  const premiumLooksDisabled = premiumBuyingId !== null || !canAffordPremium

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
    c1: premiumOwnedCount,
    e1: multiplierLevel,
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
              node.id !== 'a1' &&
              node.id !== 'e1' &&
              revealStateById[node.id] !== 'hidden',
          ).map((node) => {
            const revealState = revealStateById[node.id] as 'available' | 'locked'
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
                  className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES[revealState]}`}
                >
                  <Sparkles size={20} className={revealState === 'available' ? 'text-violet-300' : ''} />
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
                <Clover size={20} />
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
                <Clover size={20} className="text-green-300" />
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

          {/* Branch E — the base click-value multiplier, sitting angularly
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
                <Asterisk size={20} />
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
                className={`relative flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg transition-colors hover:border-sky-400/40 ${MULTIPLIER_NODE_STYLE}`}
              >
                <Asterisk size={20} className="text-sky-300" />
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

          {/* Root — the only real node so far: a repeatable auto-click
              upgrade. Tap opens the info modal (with the actual buy
              button inside it) instead of buying directly; everything
              else in the tree is still just a visual placeholder. */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setShowAutoClickModal(true)}
            className="absolute flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1.5 rounded-full border border-violet-400/20 bg-[#14101f] text-center text-violet-200 shadow-lg shadow-black/20 transition-colors hover:border-violet-400/35"
            style={{ left: CENTER, top: CENTER }}
          >
            <Bot size={20} className="text-violet-300" />
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

      {showAutoClickModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
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
              <Bot size={18} className="text-violet-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.autoClickName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.autoClickDesc}</p>

            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentRate}{' '}
                <span className="font-semibold text-white">{autoClickCps.toLocaleString(locale)} c/s</span>
              </span>
              <span>
                {strings.tree.nextLevelRate}{' '}
                <span className="font-semibold text-white">{autoClickNextCps.toLocaleString(locale)} c/s</span>
              </span>
            </div>

            <button
              onClick={buyAutoClick}
              disabled={isBuying || !canAffordAutoClick}
              className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                isBuying || !canAffordAutoClick
                  ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
                  : 'bg-white text-neutral-900 hover:opacity-90'
              }`}
            >
              {isBuying ? (
                strings.tree.upgrading
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <MousePointerClick size={14} className="opacity-70" />
                  <span className="tabular-nums">{autoClickNextCost.toLocaleString(locale)}</span>
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {showPremiumModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
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
              <button
                onClick={handleBuyPremium}
                disabled={premiumLooksDisabled}
                className={`relative w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                  premiumLooksDisabled
                    ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
                    : 'border border-indigo-400/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/15'
                }`}
              >
                {isBuyingThisPremium ? (
                  strings.tree.upgrading
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <Gem size={14} className="opacity-80" />
                    <span className="text-base font-bold tabular-nums">{nextPremiumUpgrade.cost}</span>
                  </span>
                )}
              </button>
            )}

            {premiumError && <p className="relative mt-2 text-xs text-red-400">{premiumError}</p>}
          </div>
        </div>
      )}

      {showLuckModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
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
              <Clover size={18} className="text-green-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.luckName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.luckDesc}</p>

            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentMultiplier}{' '}
                <span className="font-semibold text-white">×{luckMultiplier}</span>
              </span>
              <span>
                {strings.tree.nextMultiplier}{' '}
                <span className="font-semibold text-white">×{luckMultiplier + 1}</span>
              </span>
            </div>

            <button
              onClick={buyLuck}
              disabled={isBuyingLuck || !canAffordLuck}
              className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                isBuyingLuck || !canAffordLuck
                  ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
                  : 'bg-white text-neutral-900 hover:opacity-90'
              }`}
            >
              {isBuyingLuck ? (
                strings.tree.upgrading
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <MousePointerClick size={14} className="opacity-70" />
                  <span className="tabular-nums">{luckNextCost.toLocaleString(locale)}</span>
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {showMultiplierModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
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
              <Asterisk size={18} className="text-sky-300" />
              <p className="text-sm font-semibold text-white">{strings.tree.multiplierName}</p>
            </div>
            <p className="mb-4 text-sm text-neutral-400">{strings.tree.multiplierDesc}</p>

            <div className="mb-4 flex flex-col gap-1 text-xs text-neutral-400">
              <span>
                {strings.tree.currentMultiplier}{' '}
                <span className="font-semibold text-white">×{multiplierValue}</span>
              </span>
              <span>
                {strings.tree.nextMultiplier}{' '}
                <span className="font-semibold text-white">×{multiplierValue + 0.25}</span>
              </span>
            </div>

            <button
              onClick={buyMultiplier}
              disabled={isBuyingMultiplier || !canAffordMultiplier}
              className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                isBuyingMultiplier || !canAffordMultiplier
                  ? 'border border-white/5 bg-white/[0.03] text-neutral-500 opacity-60'
                  : 'bg-white text-neutral-900 hover:opacity-90'
              }`}
            >
              {isBuyingMultiplier ? (
                strings.tree.upgrading
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <MousePointerClick size={14} className="opacity-70" />
                  <span className="tabular-nums">{multiplierNextCost.toLocaleString(locale)}</span>
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
