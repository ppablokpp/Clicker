import { Orbit, Sparkles, Split, type LucideIcon } from 'lucide-react-native'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useLanguage } from '../context/LanguageContext'
import { useTasksContext } from '../context/TasksContext'
import { useTreeContext } from '../context/TreeContext'
import { DroneIcon } from '../components/home/DroneIcon'

export interface MissionTier {
  id: string
  name: string
  desc: string
  reward: number
  required: number
}

export interface Mission {
  missionId: string
  missionName: string
  icon: LucideIcon | typeof DroneIcon
  badgeColor: string
  progressValue: number
  tiers: MissionTier[]
}

// Ported from front/src/pages/Home.tsx's inline `MISSIONS` array — same 5
// missions, 3 escalating tiers each, same reward/required numbers. Progress
// sources: autoClickLevel/scoutDroneLevel/multiShotValue come from
// TreeContext (already ported), luckyClicksFound from ClickCounterContext
// (already ported), anomaliesNeutralized from TasksContext — that one stays
// 0 on mobile since the "Anomalía" shooting-star event isn't ported yet, so
// that single mission's progress is honestly 0 rather than faked.
export function useMissions(): Mission[] {
  const { strings } = useLanguage()
  const { luckyClicksFound } = useClickCounterContext()
  const { autoClickLevel, scoutDroneLevel, multiShotValue } = useTreeContext()
  const { anomaliesNeutralized } = useTasksContext()

  return [
    {
      missionId: 'drones',
      missionName: strings.home.missionDronesName,
      icon: DroneIcon,
      badgeColor: 'rgba(167,139,250,0.2)',
      progressValue: autoClickLevel,
      tiers: [
        { id: 'first_drone', name: strings.home.taskFirstDroneName, desc: strings.home.taskFirstDroneDesc, reward: 1_000, required: 1 },
        { id: 'drone_squadron', name: strings.home.taskDroneSquadronName, desc: strings.home.taskDroneSquadronDesc, reward: 2_000, required: 10 },
        { id: 'drone_swarm', name: strings.home.taskDroneSwarmName, desc: strings.home.taskDroneSwarmDesc, reward: 50_000, required: 30 },
      ],
    },
    {
      missionId: 'scout',
      missionName: strings.home.missionScoutName,
      icon: DroneIcon,
      badgeColor: 'rgba(251,191,36,0.2)',
      progressValue: scoutDroneLevel,
      tiers: [
        { id: 'first_scout_drone', name: strings.home.taskFirstScoutDroneName, desc: strings.home.taskFirstScoutDroneDesc, reward: 5_000, required: 1 },
        { id: 'scout_squad', name: strings.home.taskScoutSquadName, desc: strings.home.taskScoutSquadDesc, reward: 10_000, required: 10 },
        { id: 'scout_fleet', name: strings.home.taskScoutFleetName, desc: strings.home.taskScoutFleetDesc, reward: 100_000, required: 20 },
      ],
    },
    {
      missionId: 'lucky',
      missionName: strings.home.missionLuckyName,
      icon: Sparkles,
      badgeColor: 'rgba(34,197,94,0.2)',
      progressValue: luckyClicksFound,
      tiers: [
        { id: 'first_glimmers', name: strings.home.taskFirstGlimmersName, desc: strings.home.taskFirstGlimmersDesc, reward: 5_000, required: 100 },
        { id: 'glimmer_streak', name: strings.home.taskGlimmerStreakName, desc: strings.home.taskGlimmerStreakDesc, reward: 20_000, required: 1_000 },
        { id: 'glimmer_master', name: strings.home.taskGlimmerMasterName, desc: strings.home.taskGlimmerMasterDesc, reward: 100_000, required: 10_000 },
      ],
    },
    {
      missionId: 'multishot',
      missionName: strings.home.missionMultiShotName,
      icon: Split,
      badgeColor: 'rgba(6,182,212,0.2)',
      progressValue: multiShotValue,
      tiers: [
        { id: 'second_cannon', name: strings.home.taskSecondCannonName, desc: strings.home.taskSecondCannonDesc, reward: 2_000, required: 2 },
        { id: 'full_battery', name: strings.home.taskFullBatteryName, desc: strings.home.taskFullBatteryDesc, reward: 10_000, required: 5 },
        { id: 'total_arsenal', name: strings.home.taskTotalArsenalName, desc: strings.home.taskTotalArsenalDesc, reward: 100_000, required: 10 },
      ],
    },
    {
      missionId: 'anomaly',
      missionName: strings.home.missionAnomalyName,
      icon: Orbit,
      badgeColor: 'rgba(249,115,22,0.2)',
      progressValue: anomaliesNeutralized,
      tiers: [
        { id: 'first_anomaly', name: strings.home.taskFirstAnomalyName, desc: strings.home.taskFirstAnomalyDesc, reward: 5_000, required: 1 },
        { id: 'anomaly_hunter', name: strings.home.taskAnomalyHunterName, desc: strings.home.taskAnomalyHunterDesc, reward: 10_000, required: 5 },
        { id: 'sector_guardian', name: strings.home.taskSectorGuardianName, desc: strings.home.taskSectorGuardianDesc, reward: 20_000, required: 15 },
      ],
    },
  ]
}
