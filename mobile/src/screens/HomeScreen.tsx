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
import { useLanguage } from '../context/LanguageContext'
import { useTreeContext } from '../context/TreeContext'
import { formatPlatino } from '../lib/formatPlatino'
import { getHeatLevel } from '../lib/heat'
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
  const { autoClickLevel, autoClickCps, scoutDroneLevel, scoutDroneCps, multiplierValue, tapMultiplierValue } =
    useTreeContext()
  const { width, height } = useWindowDimensions()
  const [showShip, setShowShip] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [showTasks, setShowTasks] = useState(false)
  const [showLog, setShowLog] = useState(false)

  const currentTierIndex = prestigeTier
  const currentMaterialName = strings.home.trajectoryTierNames[currentTierIndex]
  const cpsUnit = `${MATERIAL_ABBREVIATIONS[currentTierIndex]}/s`

  const prestige = useMemo(
    () => computePrestigeProgress(currentTierIndex, lifetimePlatino),
    [currentTierIndex, lifetimePlatino],
  )
  const heat = getHeatLevel(clicksPerSecond)
  // Matches front/src/pages/Home.tsx's own header formula
  // (`autoClickCps + scoutDroneCps + clicksPerSecond * totalMultiplier`).
  // `totalMultiplier` there also folds in GemUpgradesContext's
  // moneyMultiplier, an active powerup's multiplier, and the heat/legendary
  // combo bonus — none of those are ported to mobile yet, so this is the
  // real fleet rate plus manual output at the tree's own tap multipliers,
  // not the full formula.
  const totalMultiplier = multiplierValue * tapMultiplierValue
  const production = autoClickCps + scoutDroneCps + clicksPerSecond * totalMultiplier

  const handleTap = useCallback(() => {
    registerClick(1)
    playLaserShot()
  }, [registerClick])

  return (
    <SafeAreaView className="flex-1 bg-[#08080c]">
      <Starfield width={width} height={height} />

      <TapShootLayer
        tierIndex={currentTierIndex}
        pct={prestige.pct}
        isMaxed={prestige.readyToPrestige}
        rippleColor={heat.ripple}
        autoClickLevel={autoClickLevel}
        scoutDroneLevel={scoutDroneLevel}
        onTap={handleTap}
      >
        <View className="px-3 pt-2">
          <CockpitPanel>
            <View className="flex-row gap-2">
              <HeatGauge clicksPerSecond={clicksPerSecond} />
              <ProductionGauge production={production} cpsUnit={cpsUnit} />
            </View>
            <View className="flex-row items-stretch gap-2">
              <HudLeftButtons onShip={() => setShowShip(true)} onInventory={() => setShowInventory(true)} />
              <PlatinoScreen
                label={strings.home.hudPlatinoLabel(currentMaterialName)}
                value={formatPlatino(totalClicks, language)}
              />
              <HudRightButtons onTasks={() => setShowTasks(true)} onLog={() => setShowLog(true)} />
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
