import { useCallback, useMemo, useState } from 'react'
import { useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CockpitPanel } from '../components/home/CockpitPanel'
import { HeatGauge } from '../components/home/HeatGauge'
import { HudLeftButtons, HudRightButtons } from '../components/home/HudFlankingButtons'
import { InventoryModal } from '../components/home/InventoryModal'
import { LogModal } from '../components/home/LogModal'
import { PlatinoScreen } from '../components/home/PlatinoScreen'
import { ProductionGauge } from '../components/home/ProductionGauge'
import { ShipModal } from '../components/home/ShipModal'
import { TapShootLayer } from '../components/home/TapShootLayer'
import { TasksModal } from '../components/home/TasksModal'
import { Starfield } from '../components/Starfield'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useGemUpgradesContext } from '../context/GemUpgradesContext'
import { useLanguage } from '../context/LanguageContext'
import { useTasksContext } from '../context/TasksContext'
import { useTreeContext } from '../context/TreeContext'
import { useMissions } from '../hooks/useMissions'
import { formatPlatino } from '../lib/formatPlatino'
import { MATERIAL_ABBREVIATIONS } from '../lib/materialTiers'
import { playLaserShot } from '../lib/sounds'
import { computePrestigeProgress } from '../lib/trajectory'

// Home's own header, styled as the top instrument panel of a ship (pilot's-
// eye view of the asteroid below) — mirrors front/src/pages/Home.tsx, split
// into CockpitPanel/HeatGauge/ProductionGauge/PlatinoScreen/TapShootLayer
// instead of one large inline component. TapShootLayer owns the *entire*
// tap-to-shoot surface (header included, same as the web's own
// containerRef), not just a zone around the asteroid — see its own comment
// for why that doesn't also fire when tapping an actual button. All 4
// flanking modals exist now; Log is fully real (only reads
// prestigeTier/lifetimePlatino). Command Center and Tasks show a
// placeholder until Tree/Missions are ported to mobile; Inventory shows
// the same empty state the web shows when you genuinely own nothing, until
// Inventory/Powerup/Magnet contexts are ported.
export function HomeScreen() {
  const { strings, language } = useLanguage()
  const { totalClicks, lifetimePlatino, clicksPerSecond, prestigeTier, registerClick } = useClickCounterContext()
  const {
    autoClickLevel,
    autoClickCps,
    scoutDroneLevel,
    scoutDroneCps,
    multiplierValue,
    tapMultiplierValue,
    multiShotValue,
    luckChance,
    luckMultiplier,
  } = useTreeContext()
  const { bestOwned } = useGemUpgradesContext()
  const { claimed: claimedTasks } = useTasksContext()
  const missions = useMissions()
  const { width, height } = useWindowDimensions()
  const [showShip, setShowShip] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [showTasks, setShowTasks] = useState(false)
  const [showLog, setShowLog] = useState(false)

  // Stable references — HudLeftButtons/HudRightButtons are memoized so they
  // don't re-render on every tap (see HudFlankingButtons.tsx's own
  // comment), which only actually holds if these callbacks aren't a fresh
  // inline arrow function every single HomeScreen render (the same
  // memo-defeating mistake the drone swarm had earlier).
  const handleShowShip = useCallback(() => setShowShip(true), [])
  const handleShowInventory = useCallback(() => setShowInventory(true), [])
  const handleShowTasks = useCallback(() => setShowTasks(true), [])
  const handleShowLog = useCallback(() => setShowLog(true), [])

  const currentTierIndex = prestigeTier
  const currentMaterialName = strings.home.trajectoryTierNames[currentTierIndex]
  const cpsUnit = `${MATERIAL_ABBREVIATIONS[currentTierIndex]}/s`

  const prestige = useMemo(
    () => computePrestigeProgress(currentTierIndex, lifetimePlatino),
    [currentTierIndex, lifetimePlatino],
  )
  const moneyMultiplier = bestOwned?.multiplier ?? 1
  // Matches front/src/pages/Home.tsx's own header formula
  // (`autoClickCps + scoutDroneCps + clicksPerSecond * totalMultiplier`).
  // The web's `totalMultiplier` also folds in an active click-multiplier
  // powerup and the Milestones bonus/heat-legendary combo bonus — none of
  // those are ported to mobile yet (no Store, no Stats), so this is
  // everything real that's already here: the tree's own tap multipliers
  // plus the gem-bought permanent multiplier.
  const totalMultiplier = multiplierValue * tapMultiplierValue * moneyMultiplier
  const production = autoClickCps + scoutDroneCps + clicksPerSecond * totalMultiplier
  const hasClaimableTask = missions.some((mission) =>
    mission.tiers.some((tier) => mission.progressValue >= tier.required && !claimedTasks.has(tier.id)),
  )

  // Called once per finger-down (TapShootLayer supports up to multiShotValue
  // simultaneous shots). Stripped down while debugging the sustained-tapping
  // lag/warning: no "+N" popup, no isLucky ripple color — just the real
  // score update (still exact, multiplier+luck included) and the shot
  // sound. See TapShootLayer's own comment for what else got stripped and
  // why.
  const handleTap = useCallback(() => {
    const hasLuck = luckChance > 0
    const rolledLuckMultiplier = hasLuck && Math.random() < luckChance ? luckMultiplier : 1
    const isLucky = rolledLuckMultiplier > 1
    const amount = totalMultiplier * rolledLuckMultiplier

    registerClick(amount, isLucky)
    playLaserShot()
  }, [totalMultiplier, luckChance, luckMultiplier, registerClick])

  return (
    <SafeAreaView className="flex-1 bg-[#08080c]">
      <Starfield width={width} height={height} />

      <TapShootLayer
        tierIndex={currentTierIndex}
        pct={prestige.pct}
        isMaxed={prestige.readyToPrestige}
        autoClickLevel={autoClickLevel}
        scoutDroneLevel={scoutDroneLevel}
        multiShotValue={multiShotValue}
        onTap={handleTap}
      >
        <View className="px-3 pt-2">
          <CockpitPanel>
            <View className="flex-row gap-2">
              <HeatGauge clicksPerSecond={clicksPerSecond} />
              <ProductionGauge production={production} cpsUnit={cpsUnit} />
            </View>
            <View className="flex-row items-stretch gap-2">
              <HudLeftButtons onShip={handleShowShip} onInventory={handleShowInventory} />
              <PlatinoScreen
                label={strings.home.hudPlatinoLabel(currentMaterialName)}
                value={formatPlatino(totalClicks, language)}
              />
              <HudRightButtons onTasks={handleShowTasks} onLog={handleShowLog} hasClaimableTask={hasClaimableTask} />
            </View>
          </CockpitPanel>
        </View>

        <ShipModal visible={showShip} onClose={() => setShowShip(false)} />
        <InventoryModal visible={showInventory} onClose={() => setShowInventory(false)} />
        <TasksModal visible={showTasks} onClose={() => setShowTasks(false)} />
        <LogModal
          visible={showLog}
          onClose={() => setShowLog(false)}
          currentTierIndex={currentTierIndex}
          lifetimePlatino={lifetimePlatino}
        />
      </TapShootLayer>
    </SafeAreaView>
  )
}
