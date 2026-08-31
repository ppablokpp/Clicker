import { Stone } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { useClickCounterContext } from '../../context/ClickCounterContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTreeContext } from '../../context/TreeContext'
import { FAMILY_STYLES, type TreeNodeDef } from '../../lib/treeNodes'
import { AppText } from '../AppText'
import { CockpitModal } from '../modals/CockpitModal'
import { TreeNodeIcon } from './TreeNodeIcon'

// A generic buy modal shared by every tree node — icon, level, next cost,
// buy button. The web has a bespoke modal per node (with node-specific
// flavor text/description); this first pass covers the shared mechanics
// (level, cost, affordability, buy action) accurately for all 19 buyable
// nodes at once rather than hand-building 19 bespoke layouts up front.
export function TreeNodeModal({
  node,
  visible,
  onClose,
}: {
  node: TreeNodeDef | null
  visible: boolean
  onClose: () => void
}) {
  const { strings, language } = useLanguage()
  const { totalClicks } = useClickCounterContext()
  const tree = useTreeContext()

  if (!node) return null

  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const level = node.levelField ? Number((tree as unknown as Record<string, number>)[node.levelField] ?? 0) : 0
  const costField = node.levelField?.replace(/Level$/, 'NextCost')
  const nextCost = costField ? ((tree as unknown as Record<string, number | null>)[costField] ?? null) : null
  const canAfford = nextCost !== null && totalClicks >= nextCost
  const isBuying = node.buyKey !== undefined && tree.buyingKey === node.buyKey
  const style = FAMILY_STYLES[node.family]

  const handleBuy = async () => {
    if (!node.buyKey) return
    await tree.buy(node.buyKey)
  }

  return (
    <CockpitModal
      visible={visible}
      onClose={onClose}
      icon={<TreeNodeIcon node={node} size={19} color={style.iconColor} />}
      iconBackground={[style.background, style.background]}
      iconColor={style.iconColor}
      glowColor={style.border}
      title={`${strings.tree.level} ${level}`}
    >
      {node.buyKey && nextCost !== null ? (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Stone size={16} color={canAfford ? style.iconColor : '#525252'} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: canAfford ? '#fff' : '#525252' }}>
              {nextCost.toLocaleString(locale)}
            </Text>
          </View>
          <Pressable
            onPress={handleBuy}
            disabled={!canAfford || isBuying}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: canAfford ? style.border : 'rgba(255,255,255,0.05)',
              backgroundColor: canAfford ? style.background : 'rgba(255,255,255,0.02)',
              opacity: isBuying ? 0.6 : 1,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: canAfford ? style.iconColor : '#525252' }}>
              {isBuying ? strings.tree.upgrading : strings.store.buy}
            </Text>
          </Pressable>
        </View>
      ) : (
        <AppText style={{ textAlign: 'center', fontSize: 13, color: '#737373' }}>{strings.home.trajectoryComingSoon}</AppText>
      )}
    </CockpitModal>
  )
}
