import type { TreeBuyKey } from '../services/treeApi'

// Ported from front/src/pages/Tree.tsx's NODES/EDGES/style constants —
// same ids, same exact world-space coordinates (CENTER=500, resolved from
// the same CENTER±N formulas), same family colors, same graph shape.
export const CENTER = 500

export type NodeFamily = 'default' | 'premium' | 'luck' | 'legendary' | 'auto' | 'multishot' | 'anomaly'

export interface FamilyStyle {
  border: string
  background: string
  iconColor: string
}

// Exact RN equivalents of NODE_STYLES.available / PREMIUM_NODE_STYLE /
// LUCK_NODE_STYLE / LEGENDARY_NODE_STYLE / AUTO_LUCK_NODE_STYLE /
// MULTI_SHOT_NODE_STYLE / ANOMALY_NODE_STYLE (Tree.tsx).
export const FAMILY_STYLES: Record<NodeFamily, FamilyStyle> = {
  default: { border: 'rgba(167,139,250,0.2)', background: '#14101f', iconColor: '#c4b5fd' },
  premium: { border: 'rgba(129,140,248,0.25)', background: '#141a2e', iconColor: '#c7d2fe' },
  luck: { border: 'rgba(74,222,128,0.25)', background: '#0f1f16', iconColor: '#86efac' },
  legendary: { border: 'rgba(248,113,113,0.25)', background: '#1f0d0d', iconColor: '#fca5a5' },
  auto: { border: 'rgba(251,191,36,0.25)', background: '#1f1608', iconColor: '#fcd34d' },
  multishot: { border: 'rgba(34,211,238,0.25)', background: '#08191c', iconColor: '#67e8f9' },
  anomaly: { border: 'rgba(251,146,60,0.25)', background: '#1f1006', iconColor: '#fdba74' },
}

export const LOCKED_STYLE: FamilyStyle = { border: '#404040', background: '#171717', iconColor: '#525252' }

// front/src/pages/Tree.tsx's `.animate-ripple`-style unlock/lock line
// colors — see TreeConnectors.tsx.
export const LINE_COLOR_UNLOCKED = 'rgba(167,139,250,0.45)'
export const LINE_COLOR_LOCKED = 'rgba(255,255,255,0.06)'

export interface TreeNodeDef {
  id: string
  x: number
  y: number
  family: NodeFamily
  iconName:
    | 'drone'
    | 'sparkles'
    | 'telescope'
    | 'split'
    | 'gem'
    | 'atom'
    | 'radar'
    | 'radio'
    | 'moon'
    | 'orbit'
    | 'pickaxe'
    | 'timer'
    | 'crosshair'
    | 'zap'
    | 'gauge'
    | 'chevronsUp'
    | 'chevronsDown'
    | 'radiation'
  /** Field on TreeContext holding this node's owned level — undefined for pure placeholders (always locked). */
  levelField?: string
  /** Key into services/treeApi.ts's TREE_BUY_ENDPOINTS — undefined for nodes with no buy action yet (placeholders, premium). */
  buyKey?: TreeBuyKey
  /**
   * A real, interactive node whose buy flow doesn't go through TreeContext's
   * generic buy(key) — currently only c1 (the gem-multiplier node, which
   * spends gems via GemUpgradesContext instead of clicks via a
   * TREE_BUY_ENDPOINTS key). TreeScreen/TreeNode use this to treat it as
   * clickable even though it has no `buyKey`.
   */
  special?: 'premium'
}

export const TREE_NODES: TreeNodeDef[] = [
  { id: 'root', x: CENTER, y: CENTER, family: 'default', iconName: 'drone', levelField: 'autoClickLevel', buyKey: 'autoClick' },

  // Branch A — Suerte forks into Probabilidad (a2).
  { id: 'a1', x: CENTER + 140, y: CENTER - 100, family: 'luck', iconName: 'sparkles', levelField: 'luckLevel', buyKey: 'luck' },
  { id: 'a2', x: CENTER + 260, y: CENTER - 200, family: 'luck', iconName: 'telescope', levelField: 'luckChanceLevel', buyKey: 'luckChance' },
  { id: 'a2b', x: CENTER + 300, y: CENTER - 340, family: 'luck', iconName: 'sparkles' },
  { id: 'a3', x: CENTER + 400, y: CENTER - 240, family: 'luck', iconName: 'sparkles' },

  // Branch B — Multidisparo forking into two placeholders.
  { id: 'b1', x: CENTER - 170, y: CENTER + 70, family: 'multishot', iconName: 'split', levelField: 'multiShotLevel', buyKey: 'multiShot' },
  { id: 'b2a', x: CENTER - 320, y: CENTER - 10, family: 'multishot', iconName: 'sparkles' },
  { id: 'b2b', x: CENTER - 330, y: CENTER + 160, family: 'multishot', iconName: 'sparkles' },

  // Branch C — premium gem multiplier (GemUpgradesContext, not TreeContext
  // — not ported to mobile yet, so this stays permanently locked for now).
  { id: 'c1', x: CENTER + 20, y: CENTER + 175, family: 'premium', iconName: 'gem', special: 'premium' },

  // Branch F — Sobrecarga / Dron buscador / Frecuencia / Autonomía.
  { id: 'e2b', x: CENTER + 30, y: CENTER - 180, family: 'auto', iconName: 'atom', levelField: 'autoMultiplierLevel', buyKey: 'autoMultiplier' },
  { id: 'a1b', x: CENTER - 20, y: CENTER - 310, family: 'auto', iconName: 'radar', levelField: 'scoutDroneLevel', buyKey: 'scoutDrone' },
  { id: 'a1b1', x: CENTER + 100, y: CENTER - 440, family: 'auto', iconName: 'radio', levelField: 'scoutFrequencyLevel', buyKey: 'scoutFrequency' },
  { id: 'e2b1', x: CENTER + 140, y: CENTER - 290, family: 'auto', iconName: 'moon', levelField: 'offlineProductionLevel', buyKey: 'offlineProduction' },

  // Branch D — Anomalías forking into Extracción / Detección.
  { id: 'd1', x: CENTER - 120, y: CENTER - 115, family: 'anomaly', iconName: 'orbit', levelField: 'anomalyUnlockLevel', buyKey: 'anomalyUnlock' },
  { id: 'd2', x: CENTER - 276, y: CENTER - 172, family: 'anomaly', iconName: 'pickaxe', levelField: 'anomalyRewardLevel', buyKey: 'anomalyReward' },
  { id: 'd3', x: CENTER - 177, y: CENTER - 271, family: 'anomaly', iconName: 'timer', levelField: 'anomalyFrequencyLevel', buyKey: 'anomalyFrequency' },

  // Branch E — Multiplicador forking into Modo Legendario (+3 children) and Amplificador.
  { id: 'e1', x: CENTER + 150, y: CENTER + 110, family: 'legendary', iconName: 'crosshair', levelField: 'multiplierLevel', buyKey: 'multiplier' },
  { id: 'e2a0', x: 773, y: 524, family: 'legendary', iconName: 'zap', levelField: 'legendaryUnlockLevel', buyKey: 'legendaryUnlock' },
  { id: 'e2a', x: 865, y: 393, family: 'legendary', iconName: 'gauge', levelField: 'legendaryEaseLevel', buyKey: 'legendaryEase' },
  { id: 'e2a1', x: 928, y: 483, family: 'legendary', iconName: 'chevronsUp', levelField: 'legendaryGrowthLevel', buyKey: 'legendaryGrowth' },
  { id: 'e2a2', x: 918, y: 592, family: 'legendary', iconName: 'chevronsDown', levelField: 'legendaryThresholdLevel', buyKey: 'legendaryThreshold' },
  { id: 'e2c', x: CENTER + 275, y: CENTER + 205, family: 'legendary', iconName: 'radiation', levelField: 'tapMultiplierLevel', buyKey: 'tapMultiplier' },
]

export interface TreeEdge {
  from: string
  to: string
}

export const TREE_EDGES: TreeEdge[] = [
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

// BFS parent pointers from root — same algorithm as Tree.tsx's
// computeParentsFromRoot, the only graph info the reveal rule below needs.
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

export const PARENT_OF = computeParentsFromRoot(TREE_EDGES)

export type RevealState = 'hidden' | 'locked' | 'available'

// Same recursive rule as Tree.tsx's getRevealState. The one easy-to-miss
// part: a node's own 'available' bar is its *parent's* level, not its own
// — a node's OWN level only ever matters as the *next* node's parent
// check, one level down. That's what makes buying a node cascade into
// revealing/unlocking its child in one step: buy the parent (level goes
// from 0 to 1) and the child flips straight from 'locked' to 'available'
// without needing a level of its own yet.
//
// Root's direct children are a special case: always at least 'locked'
// (never 'hidden'), available once root's own level clears 0. Everything
// deeper is 'hidden' entirely until its parent is 'available'. Pure
// placeholder nodes (no levelField, so their level always reads 0 here)
// therefore stay 'locked' forever once revealed — they have no purchase to
// push them to 'available', same as the web's own unfinished branches.
export function getRevealState(nodeId: string, levelById: Record<string, number>): RevealState {
  if (nodeId === 'root') return 'available'
  const parentId = PARENT_OF[nodeId]
  if (parentId === 'root') {
    return (levelById.root ?? 0) > 0 ? 'available' : 'locked'
  }
  const parentState = getRevealState(parentId, levelById)
  if (parentState !== 'available') return 'hidden'
  return (levelById[parentId] ?? 0) > 0 ? 'available' : 'locked'
}
