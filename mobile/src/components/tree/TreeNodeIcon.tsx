import {
  Atom,
  ChevronsDown,
  ChevronsUp,
  Crosshair,
  Gauge,
  Gem,
  Moon,
  Orbit,
  Pickaxe,
  Radar,
  Radiation,
  Radio,
  Sparkles,
  Split,
  Telescope,
  Timer,
  Zap,
  type LucideIcon,
} from 'lucide-react-native'
import { DroneIcon } from '../home/DroneIcon'
import type { TreeNodeDef } from '../../lib/treeNodes'

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  telescope: Telescope,
  split: Split,
  gem: Gem,
  atom: Atom,
  radar: Radar,
  radio: Radio,
  moon: Moon,
  orbit: Orbit,
  pickaxe: Pickaxe,
  timer: Timer,
  crosshair: Crosshair,
  zap: Zap,
  gauge: Gauge,
  chevronsUp: ChevronsUp,
  chevronsDown: ChevronsDown,
  radiation: Radiation,
}

// A tree node's own icon, resolved from its `iconName` — shared by TreeNode
// (the canvas button) and TreeNodeModal (the buy modal header), so the two
// can never quietly drift to different icons for the same node.
export function TreeNodeIcon({ node, size = 20, color }: { node: TreeNodeDef; size?: number; color: string }) {
  if (node.iconName === 'drone') return <DroneIcon size={size} color={color} />
  const Icon = ICONS[node.iconName]
  return <Icon size={size} color={color} />
}
