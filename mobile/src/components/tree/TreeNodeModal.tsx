import { Stone, X } from 'lucide-react-native'
import { Modal, Pressable, Text, View } from 'react-native'
import { useClickCounterContext } from '../../context/ClickCounterContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTreeContext } from '../../context/TreeContext'
import { MATERIAL_BUY_BUTTON_COLORS } from '../../lib/materialTiers'
import { getMaxedColors, getNodeModalContent } from '../../lib/treeNodeContent'
import { FAMILY_STYLES, type TreeNodeDef } from '../../lib/treeNodes'
import { TreeNodeIcon } from './TreeNodeIcon'

// Ported directly from Tree.tsx's own bespoke buy-modal markup (a plain
// fixed-inset backdrop + a small static card — no CockpitModalChrome glow,
// no scanline, no scroll: that shell belongs to Home's 4 cockpit modals
// only, the web's own tree modals never used it).
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
  const { totalClicks, prestigeTier } = useClickCounterContext()
  const tree = useTreeContext()

  if (!node) return null

  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const costField = node.levelField?.replace(/Level$/, 'NextCost')
  const nextCost = costField ? ((tree as unknown as Record<string, number | null>)[costField] ?? null) : null
  const isMaxed = node.buyKey !== undefined && nextCost === null
  const canAfford = nextCost !== null && totalClicks >= nextCost
  const isBuying = node.buyKey !== undefined && tree.buyingKey === node.buyKey
  const style = FAMILY_STYLES[node.family]
  const content = getNodeModalContent(node.id, tree, strings, locale, prestigeTier)
  // The buy button is always the current prestige tier's material color
  // (front/src/pages/Tree.tsx's TreeBuyButton reads MATERIAL_BUTTON_THEMES
  // itself) — never the node's own family color, which is reserved for the
  // node circle/icon only.
  const buttonColors = MATERIAL_BUY_BUTTON_COLORS[prestigeTier]

  const handleBuy = async () => {
    if (!node.buyKey) return
    await tree.buy(node.buyKey)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 24 }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 320,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            backgroundColor: '#0d0d14',
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.5,
            shadowRadius: 30,
          }}
        >
          <Pressable onPress={onClose} hitSlop={10} style={{ position: 'absolute', right: 12, top: 12, zIndex: 1 }}>
            <X size={16} color="#737373" />
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TreeNodeIcon node={node} size={18} color={style.iconColor} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>{content?.title}</Text>
          </View>

          {content && (
            <Text style={{ marginBottom: 16, fontSize: 13, lineHeight: 18, color: '#a3a3a3' }}>{content.description}</Text>
          )}

          {content && content.stats.length > 0 && (
            <View style={{ marginBottom: 16, gap: 4 }}>
              {content.stats.map((stat) => (
                <View key={stat.label} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  <Text style={{ fontSize: 12, color: '#a3a3a3' }}>{stat.label}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>{stat.value}</Text>
                </View>
              ))}
            </View>
          )}

          {node.buyKey && isMaxed ? (
            (() => {
              const maxedColors = getMaxedColors(node.id)
              return (
                <View
                  style={{
                    borderRadius: 12,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: maxedColors.border,
                    backgroundColor: maxedColors.background,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: maxedColors.text }}>{strings.store.maxLevel}</Text>
                </View>
              )
            })()
          ) : node.buyKey && nextCost !== null ? (
            // Just the icon + cost — no "Comprar"/"Buy" label — matching the
            // web's own TreeBuyButton exactly, including the subtle fill
            // showing progress toward affording it when you can't yet.
            <Pressable
              onPress={handleBuy}
              disabled={!canAfford || isBuying}
              style={{
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: canAfford ? buttonColors.border : 'rgba(255,255,255,0.05)',
                backgroundColor: canAfford ? buttonColors.background : 'rgba(255,255,255,0.03)',
                opacity: isBuying ? 0.6 : 1,
              }}
            >
              {!isBuying && !canAfford && (
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${Math.min(100, (totalClicks / nextCost) * 100)}%`,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                  }}
                />
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Stone size={17} color={canAfford ? buttonColors.text : 'rgba(115,115,115,0.7)'} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: canAfford ? buttonColors.text : '#737373' }}>
                  {isBuying ? strings.tree.upgrading : nextCost.toLocaleString(locale)}
                </Text>
              </View>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  )
}
