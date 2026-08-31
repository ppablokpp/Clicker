import { Package } from 'lucide-react-native'
import { memo } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { AppText } from '../AppText'
import { CockpitModal } from '../modals/CockpitModal'

// Ported from front/src/pages/Home.tsx's showInventory panel. The web
// version lists owned cases/powerups/luck-powerups/magnets, each behind its
// own context (InventoryContext, PowerupContext, TimedLuckPowerupContext,
// MagnetContext, GemChestContext, ClickPacksContext) that aren't ported to
// mobile yet — until they are, this always renders the same empty state the
// web shows when you genuinely own nothing (`isInventoryEmpty`).
function InventoryModalImpl({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { strings } = useLanguage()

  if (!visible) return null

  return (
    <CockpitModal
      visible={visible}
      onClose={onClose}
      icon={<Package size={19} color="#fcd34d" />}
      iconBackground={['rgba(251,191,36,0.3)', 'rgba(249,115,22,0.2)']}
      iconColor="#fcd34d"
      glowColor="rgba(251,191,36,0.35)"
      title={strings.home.inventoryTitle}
    >
      <AppText className="py-6 text-center text-sm text-neutral-500">{strings.home.inventoryEmpty}</AppText>
    </CockpitModal>
  )
}

export const InventoryModal = memo(InventoryModalImpl)
