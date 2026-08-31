import { ClipboardList } from 'lucide-react-native'
import { View } from 'react-native'
import { useClickCounterContext } from '../../context/ClickCounterContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTasksContext } from '../../context/TasksContext'
import { useMissions } from '../../hooks/useMissions'
import { CockpitModal } from '../modals/CockpitModal'
import { MissionCard } from './MissionCard'

// Ported from front/src/pages/Home.tsx's showTasks panel (Tareas) — the
// mission board. Now fully real: TasksContext (claim/claimed state) +
// useMissions (progress values pulled from TreeContext/ClickCounterContext).
export function TasksModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { strings } = useLanguage()
  const { prestigeTier } = useClickCounterContext()
  const { claimed, claimingId, claim } = useTasksContext()
  const missions = useMissions()

  const completedCount = missions.filter((m) => m.tiers.every((tier) => claimed.has(tier.id))).length

  return (
    <CockpitModal
      visible={visible}
      onClose={onClose}
      icon={<ClipboardList size={19} color="#6ee7b7" />}
      iconBackground={['rgba(52,211,153,0.3)', 'rgba(20,184,166,0.2)']}
      iconColor="#6ee7b7"
      glowColor="rgba(52,211,153,0.35)"
      title={strings.home.tasksTitle}
      subtitle={strings.home.tasksProgress(String(completedCount), String(missions.length))}
    >
      <View className="gap-3">
        {missions.map((mission, i) => (
          <MissionCard
            key={mission.missionId}
            mission={mission}
            index={i}
            currentMaterialTierIndex={prestigeTier}
            claimedTasks={claimed}
            claimingTaskId={claimingId}
            onClaim={claim}
          />
        ))}
      </View>
    </CockpitModal>
  )
}
