import { Joystick } from 'lucide-react-native'
import { useLanguage } from '../../context/LanguageContext'
import { AppText } from '../AppText'
import { CockpitModal } from '../modals/CockpitModal'

// Ported from front/src/pages/Home.tsx's showShip panel (Centro de mando) —
// a read-only summary of your Tree upgrades (ship power/multi-shot/luck,
// fleet drone production/count). That data all comes from TreeContext,
// which is the biggest remaining port (Phase 4 of the plan, deliberately
// last) — until it exists, this shows a placeholder like the web's own
// "coming soon" state elsewhere.
export function ShipModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { strings } = useLanguage()

  return (
    <CockpitModal
      visible={visible}
      onClose={onClose}
      icon={<Joystick size={19} color="#c4b5fd" />}
      iconBackground={['rgba(167,139,250,0.3)', 'rgba(217,70,239,0.2)']}
      iconColor="#c4b5fd"
      glowColor="rgba(168,85,247,0.35)"
      title={strings.home.commandCenterTitle}
    >
      <AppText className="py-6 text-center text-sm text-neutral-500">{strings.home.trajectoryComingSoon}</AppText>
    </CockpitModal>
  )
}
