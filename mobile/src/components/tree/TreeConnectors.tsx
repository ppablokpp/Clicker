import Svg, { Line } from 'react-native-svg'
import { LINE_COLOR_LOCKED, LINE_COLOR_UNLOCKED, TREE_EDGES, TREE_NODES, type RevealState } from '../../lib/treeNodes'

// The tree's branch lines — ported from front/src/pages/Tree.tsx's inline
// SVG `<line>` per edge: straight lines only, solid violet once the target
// node is unlocked, dashed near-invisible white otherwise. Only edges where
// BOTH endpoints are currently visible (not 'hidden') are drawn, same as
// the web.
export function TreeConnectors({
  width,
  height,
  revealStateById,
}: {
  width: number
  height: number
  revealStateById: Record<string, RevealState>
}) {
  const nodesById = Object.fromEntries(TREE_NODES.map((n) => [n.id, n]))

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      {TREE_EDGES.map((edge) => {
        const a = nodesById[edge.from]
        const b = nodesById[edge.to]
        if (!a || !b) return null
        if (revealStateById[edge.from] === 'hidden' || revealStateById[edge.to] === 'hidden') return null
        const isUnlocked = revealStateById[edge.to] === 'available'
        return (
          <Line
            key={`${edge.from}-${edge.to}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={isUnlocked ? LINE_COLOR_UNLOCKED : LINE_COLOR_LOCKED}
            strokeWidth={3}
            strokeDasharray={isUnlocked ? undefined : '6,6'}
          />
        )
      })}
    </Svg>
  )
}
