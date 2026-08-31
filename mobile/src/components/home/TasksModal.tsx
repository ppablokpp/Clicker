import { ClipboardList } from 'lucide-react-native'
import { View } from 'react-native'
import { useClickCounterContext } from '../../context/ClickCounterContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTasksContext } from '../../context/TasksContext'
import { useMissions } from '../../hooks/useMissions'
import { GraphPaperTexture } from '../GraphPaperTexture'
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
      {/* `position: 'relative'` via inline style, not className — if that
          specific utility silently didn't apply (same failure mode as
          several others found on this screen), the texture below would
          resolve its absolute positioning against some ancestor much
          further up the tree instead of this box, rendering it somewhere
          off-screen or behind other content instead of behind the list. */}
      <View style={{ position: 'relative', gap: 12 }}>
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <GraphPaperTexture />
        </View>
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
