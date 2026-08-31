import { useMemo, useState } from 'react'
import { useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TreeCanvas } from '../components/tree/TreeCanvas'
import { TreeConnectors } from '../components/tree/TreeConnectors'
import { TreeNode } from '../components/tree/TreeNode'
import { TreeNodeModal } from '../components/tree/TreeNodeModal'
import { useLanguage } from '../context/LanguageContext'
import { useTreeContext } from '../context/TreeContext'
import { CENTER, getRevealState, TREE_NODES, type TreeNodeDef } from '../lib/treeNodes'

const WORLD_SIZE = 1000
// Matches front/src/pages/Tree.tsx's DEFAULT_SCALE — the tree starts
// zoomed out a bit rather than at 1:1.
const DEFAULT_SCALE = 0.68

// Ported from front/src/pages/Tree.tsx — a pannable, pinch-zoomable canvas
// of upgrade nodes. See lib/treeNodes.ts for the exact node positions/
// colors/graph shape, TreeCanvas.tsx for the pan/zoom gesture mechanics,
// TreeNodeModal.tsx for the (currently generic, not yet per-node-bespoke)
// buy flow.
export function TreeScreen() {
  const { strings } = useLanguage()
  const { width, height } = useWindowDimensions()
  const tree = useTreeContext()
  const [selectedNode, setSelectedNode] = useState<TreeNodeDef | null>(null)

  const levelById = useMemo(() => {
    const map: Record<string, number> = {}
    for (const node of TREE_NODES) {
      if (node.levelField) map[node.id] = Number((tree as unknown as Record<string, number>)[node.levelField] ?? 0)
    }
    return map
  }, [tree])

  const revealStateById = useMemo(() => {
    const map: Record<string, ReturnType<typeof getRevealState>> = {}
    for (const node of TREE_NODES) map[node.id] = getRevealState(node.id, levelById)
    return map
  }, [levelById])

  return (
    <SafeAreaView className="flex-1 bg-[#08080c]" edges={['left', 'right']}>
      <TreeCanvas
        contentWidth={WORLD_SIZE}
        contentHeight={WORLD_SIZE}
        initialScale={DEFAULT_SCALE}
        initialFocus={{ x: CENTER, y: CENTER, viewportWidth: width, viewportHeight: height }}
      >
        <TreeConnectors width={WORLD_SIZE} height={WORLD_SIZE} revealStateById={revealStateById} />
        {TREE_NODES.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            level={levelById[node.id] ?? 0}
            levelLabel={strings.tree.level}
            revealState={revealStateById[node.id]}
            onPress={() => setSelectedNode(node)}
          />
        ))}
      </TreeCanvas>

      <TreeNodeModal node={selectedNode} visible={selectedNode !== null} onClose={() => setSelectedNode(null)} />
    </SafeAreaView>
  )
}
