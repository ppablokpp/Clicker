import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, Bot, Lock, Minus, MousePointerClick, Plus, RotateCcw, Sparkles, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useTreeContext } from '../context/TreeContext'

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
  { id: 'a1', x: CENTER + 140, y: CENTER - 100, label: 'Rama A' },
  { id: 'a1b', x: CENTER + 60, y: CENTER - 220, label: 'Mejora' },
  { id: 'a2', x: CENTER + 260, y: CENTER - 200, label: 'Mejora' },
  { id: 'a3', x: CENTER + 400, y: CENTER - 240, label: 'Mejora+' },

  // Branch B — short reach left that forks into two.
  { id: 'b1', x: CENTER - 170, y: CENTER + 20, label: 'Rama B' },
  { id: 'b2a', x: CENTER - 320, y: CENTER - 60, label: 'Mejora' },
  { id: 'b2b', x: CENTER - 330, y: CENTER + 110, label: 'Mejora' },
  { id: 'b3', x: CENTER - 460, y: CENTER - 120, label: 'Mejora+' },

  // Branch C — one lone node straight down, nothing beyond it yet.
  { id: 'c1', x: CENTER + 40, y: CENTER + 160, label: 'Rama C' },

  // Branch D — long chain up and slightly left.
  { id: 'd1', x: CENTER - 100, y: CENTER - 160, label: 'Rama D' },
  { id: 'd2', x: CENTER - 170, y: CENTER - 310, label: 'Mejora' },
  { id: 'd3', x: CENTER - 80, y: CENTER - 440, label: 'Mejora+' },

  // Branch E — short reach down-right that forks into two.
  { id: 'e1', x: CENTER + 150, y: CENTER + 110, label: 'Rama E' },
  { id: 'e2a', x: CENTER + 280, y: CENTER + 60, label: 'Mejora' },
  { id: 'e2b', x: CENTER + 260, y: CENTER + 220, label: 'Mejora' },
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
]

// BFS graph-distance from root, so each node's reveal state can be derived
// from a single real number (root's level) instead of hand-set per node.
function computeDistancesFromRoot(edges: TreeEdge[]): Record<string, number> {
  const adjacency: Record<string, string[]> = {}
  for (const { from, to } of edges) {
    ;(adjacency[from] ??= []).push(to)
    ;(adjacency[to] ??= []).push(from)
  }
  const distances: Record<string, number> = { root: 0 }
  const queue = ['root']
  while (queue.length > 0) {
    const current = queue.shift() as string
    for (const neighbor of adjacency[current] ?? []) {
      if (distances[neighbor] === undefined) {
        distances[neighbor] = distances[current] + 1
        queue.push(neighbor)
      }
    }
  }
  return distances
}

const DISTANCE_FROM_ROOT = computeDistancesFromRoot(EDGES)

// The general rule: once a node passes level 0, its direct children (+1)
// unlock and become purchasable, and its grandchildren (+2) become visible
// as locked — nothing beyond that shows up yet. Only root has a real level
// today, so this is only actually evaluated relative to root for now; once
// more nodes are real, each one drives its own +1/+2 the same way.
function getRevealState(distance: number, parentLevel: number): RevealState {
  if (distance === 1) return parentLevel > 0 ? 'available' : 'locked'
  if (distance === 2) return parentLevel > 0 ? 'locked' : 'hidden'
  return 'hidden'
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

const DEFAULT_SCALE = 0.85

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
  const { autoClickLevel, autoClickCps, autoClickNextCost, autoClickNextCps, isBuying, buyAutoClick } = useTreeContext()
  const canAffordAutoClick = totalClicks >= autoClickNextCost
  const [transform, setTransform] = useState(centeredView)
  const [showAutoClickModal, setShowAutoClickModal] = useState(false)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  )

  const clampScale = (scale: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))

  const handlePointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: transform.x,
      originY: transform.y,
    }
  }, [transform.x, transform.y])

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    setTransform((prev) => ({
      ...prev,
      x: drag.originX + (e.clientX - drag.startX),
      y: drag.originY + (e.clientY - drag.startY),
    }))
  }, [])

  const endDrag = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null
  }, [])

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

  const nodeById = Object.fromEntries(NODES.map((n) => [n.id, n]))
  // Recomputed each render off the real autoClickLevel — cheap for a graph
  // this small, and keeps the reveal rule as the single source of truth
  // instead of duplicating "what's visible" as separate state.
  const revealStateById: Record<string, RevealState> = Object.fromEntries(
    NODES.filter((n) => n.id !== 'root').map((n) => [n.id, getRevealState(DISTANCE_FROM_ROOT[n.id], autoClickLevel)]),
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
              return (
                <motion.line
                  key={`${from}-${to}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={3}
                  strokeDasharray="6 6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: revealDelay(b, a.x, a.y), ease: 'easeOut' }}
                />
              )
            })}
          </svg>

          {NODES.filter((node) => node.id !== 'root' && revealStateById[node.id] !== 'hidden').map((node) => {
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
                  className={`flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-full border text-center shadow-lg ${NODE_STYLES[revealState]}`}
                >
                  {revealState === 'locked' ? (
                    <Lock size={20} />
                  ) : (
                    <Sparkles size={20} className="text-violet-300" />
                  )}
                  <span className="whitespace-nowrap text-xs font-semibold">{node.label}</span>
                </motion.div>
              </div>
            )
          })}

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
    </div>
  )
}
