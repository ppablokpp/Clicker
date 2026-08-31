import { Gem, X } from 'lucide-react-native'
import { useState } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import { useGemUpgradesContext } from '../../context/GemUpgradesContext'
import { useGemsContext } from '../../context/GemsContext'
import { useLanguage } from '../../context/LanguageContext'

const INDIGO = { border: 'rgba(129,140,248,0.3)', background: 'rgba(99,102,241,0.1)', text: '#c7d2fe' }
const FUCHSIA_MAXED = { border: 'rgba(232,121,249,0.2)', background: 'rgba(217,70,239,0.07)', text: '#f5d0fe' }

// The tree's c1 node — a permanent, gem-bought click multiplier
// (GemUpgradesContext). Ported from Tree.tsx's own showPremiumModal
// (:1890-1950): a separate bespoke modal from the generic TreeNodeModal
// since it spends gems through a different context/buy signature
// (`buy(upgrade)`, not `buy(key)`) rather than clicks.
export function PremiumNodeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { strings, language } = useLanguage()
  const { gems } = useGemsContext()
  const { catalog, owned, bestOwned, buyingId, buy } = useGemUpgradesContext()
  const [error, setError] = useState<string | null>(null)

  if (!visible) return null

  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const ownedCount = catalog.filter((u) => owned.has(u.id)).length
  const nextUpgrade = catalog[ownedCount]
  const isMaxed = !nextUpgrade
  const canAfford = nextUpgrade ? gems >= nextUpgrade.cost : false
  const isBuying = nextUpgrade ? buyingId === nextUpgrade.id : false

  const handleBuy = async () => {
    if (!nextUpgrade) return
    setError(null)
    const result = await buy(nextUpgrade)
    if (!result.ok && result.error !== 'not-signed-in') {
      setError(result.error === 'not-enough-gems' ? strings.store.notEnoughGems : strings.store.purchaseError)
    }
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
            overflow: 'hidden',
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
            <Gem size={18} color="#f0abfc" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>{strings.store.moneyUpgradesTitle}</Text>
          </View>

          <Text style={{ marginBottom: 16, fontSize: 13, lineHeight: 18, color: '#a3a3a3' }}>{strings.tree.premiumDesc}</Text>

          <View style={{ marginBottom: 16, gap: 4 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              <Text style={{ fontSize: 12, color: '#a3a3a3' }}>{strings.tree.currentMultiplier}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>
                {bestOwned ? `×${bestOwned.multiplier}` : strings.store.noUpgradeYet}
              </Text>
            </View>
            {!isMaxed && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                <Text style={{ fontSize: 12, color: '#a3a3a3' }}>{strings.tree.nextMultiplier}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>×{nextUpgrade.multiplier}</Text>
              </View>
            )}
          </View>

          {isMaxed ? (
            <View
              style={{
                borderRadius: 12,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: FUCHSIA_MAXED.border,
                backgroundColor: FUCHSIA_MAXED.background,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: FUCHSIA_MAXED.text }}>{strings.store.maxLevel}</Text>
            </View>
          ) : (
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
                borderColor: canAfford ? INDIGO.border : 'rgba(255,255,255,0.05)',
                backgroundColor: canAfford ? INDIGO.background : 'rgba(255,255,255,0.03)',
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
                    width: `${Math.min(100, (gems / nextUpgrade.cost) * 100)}%`,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                  }}
                />
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Gem size={14} color={canAfford ? INDIGO.text : 'rgba(115,115,115,0.7)'} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: canAfford ? INDIGO.text : '#737373' }}>
                  {isBuying ? strings.tree.upgrading : nextUpgrade.cost.toLocaleString(locale)}
                </Text>
              </View>
            </Pressable>
          )}

          {error && <Text style={{ marginTop: 8, fontSize: 12, color: '#fca5a5' }}>{error}</Text>}
        </Pressable>
      </Pressable>
    </Modal>
  )
}
