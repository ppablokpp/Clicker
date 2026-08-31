import { ClipboardList } from 'lucide-react-native'
import { useLanguage } from '../../context/LanguageContext'
import { AppText } from '../AppText'
import { CockpitModal } from '../modals/CockpitModal'

// Ported from front/src/pages/Home.tsx's showTasks panel (Tareas) — the
// mission board, driven by TasksContext plus stats aggregated from several
// other contexts. Not ported to mobile yet, so this shows a placeholder for
// now, same as the web's own "coming soon" state elsewhere.
export function TasksModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { strings } = useLanguage()

  return (
    <CockpitModal
      visible={visible}
      onClose={onClose}
      icon={<ClipboardList size={19} color="#6ee7b7" />}
      iconBackground={['rgba(52,211,153,0.3)', 'rgba(20,184,166,0.2)']}
      iconColor="#6ee7b7"
      glowColor="rgba(52,211,153,0.35)"
      title={strings.home.tasksTitle}
    >
      <AppText className="py-6 text-center text-sm text-neutral-500">{strings.home.trajectoryComingSoon}</AppText>
    </CockpitModal>
  )
}
