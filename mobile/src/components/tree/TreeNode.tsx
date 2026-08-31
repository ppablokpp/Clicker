import { Lock } from 'lucide-react-native'
import { memo } from 'react'
import { Pressable, Text, View } from 'react-native'
import { FAMILY_STYLES, LOCKED_STYLE, type RevealState, type TreeNodeDef } from '../../lib/treeNodes'
import { TreeNodeIcon } from './TreeNodeIcon'

const NODE_SIZE = 80

// One tree node button — ported from front/src/pages/Tree.tsx's node
// markup: an 80px circle, family-tinted once available, dashed grey while
// locked, with a lock badge overlay. Memoized with only primitive/simple
// props — a node's own level changing after a buy shouldn't force all the
// *other* ~20 nodes to re-render too.
function TreeNodeImpl({
  node,
  level,
  levelLabel,
  revealState,
  onPress,
}: {
  node: TreeNodeDef
  level: number
  levelLabel: string
  revealState: RevealState
  onPress: () => void
}) {
  if (revealState === 'hidden') return null

  const isLocked = revealState === 'locked'
  const style = isLocked ? LOCKED_STYLE : FAMILY_STYLES[node.family]

  return (
    <Pressable
      onPress={onPress}
      style={{
        position: 'absolute',
        left: node.x - NODE_SIZE / 2,
        top: node.y - NODE_SIZE / 2,
        width: NODE_SIZE,
        height: NODE_SIZE,
        borderRadius: NODE_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: isLocked ? 2 : 1,
        borderStyle: isLocked ? 'dashed' : 'solid',
        borderColor: style.border,
        backgroundColor: style.background,
      }}
    >
      <TreeNodeIcon node={node} size={20} color={style.iconColor} />
      {!isLocked && (
        <Text style={{ fontSize: 12, fontWeight: '600', color: style.iconColor }}>
          {levelLabel} {level}
        </Text>
      )}
      {isLocked && (
        <View
          style={{
            position: 'absolute',
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
          }}
        >
          <Lock size={14} color="#e5e5e5" />
        </View>
      )}
    </Pressable>
  )
}

export const TreeNode = memo(TreeNodeImpl)
