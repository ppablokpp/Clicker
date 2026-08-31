import { ChartNoAxesCombined, Crosshair, Joystick, Split, Sparkles } from 'lucide-react-native'
import { View } from 'react-native'
import { useClickCounterContext } from '../../context/ClickCounterContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTreeContext } from '../../context/TreeContext'
import { MATERIAL_ABBREVIATIONS } from '../../lib/materialTiers'
import { AppText } from '../AppText'
import { CockpitModal } from '../modals/CockpitModal'
import { DroneIcon } from './DroneIcon'
import { ShipStatCard, ShipStatLine } from './ShipStatCard'

// Ported from front/src/pages/Home.tsx's showShip panel (Centro de mando).
// Both sections now read real numbers straight from TreeContext — the
// "Tu nave" section's `shipPower`/`shipLuckChance` tiles are the one place
// this is an approximation rather than the exact web formula: the web
// multiplies in GemUpgradesContext's moneyMultiplier and an active timed
// powerup's own luck bonus, neither of which is ported to mobile yet, so
// those default to "not bought/active" (multiplier 1, no boost) rather
// than being left out.
export function ShipModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { strings, language } = useLanguage()
  const { prestigeTier } = useClickCounterContext()
  const {
    multiplierValue,
    tapMultiplierValue,
    multiShotValue,
    luckChance,
    luckMultiplier,
    autoClickCps,
    scoutDroneCps,
    autoClickLevel,
    autoMultiplierValue,
    scoutDroneLevel,
    scoutDroneRate,
    offlineProductionValue,
  } = useTreeContext()

  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const numberFmt = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 2 })
  const cpsUnit = `${MATERIAL_ABBREVIATIONS[prestigeTier]}/s`
  const currentMaterialName = strings.home.trajectoryTierNames[prestigeTier]

  const shipPowerValue = multiplierValue * tapMultiplierValue
  const hasLuck = luckChance > 0
  const totalDroneProduction = autoClickCps + scoutDroneCps

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
      <View className="gap-2.5">
        <AppText weight="semibold" className="mb-0.5 text-xs uppercase tracking-wide text-neutral-500">
          {strings.home.shipSection}
        </AppText>

        <ShipStatCard icon={<Crosshair size={14} color="#fca5a5" />} iconBg="rgba(239,68,68,0.2)" title={strings.home.shipPower}>
          <ShipStatLine label={strings.home.shipPowerDesc(currentMaterialName)} value={numberFmt(shipPowerValue)} />
        </ShipStatCard>

        <ShipStatCard icon={<Split size={14} color="#67e8f9" />} iconBg="rgba(6,182,212,0.2)" title={strings.home.shipMultiShot}>
          <ShipStatLine label={strings.home.shipMultiShotDesc} value={String(multiShotValue)} />
        </ShipStatCard>

        <ShipStatCard icon={<Sparkles size={14} color="#86efac" />} iconBg="rgba(34,197,94,0.2)" title={strings.home.shipLuckChance}>
          {hasLuck ? (
            <View className="gap-0.5">
              <ShipStatLine label={strings.home.shipLuckPowerDesc} value={numberFmt(luckMultiplier)} />
              <ShipStatLine label={strings.home.shipLuckChanceDesc} value={`${Math.round(luckChance * 100)}%`} />
            </View>
          ) : (
            <AppText className="text-xs font-medium text-neutral-600">{strings.home.shipNotInstalled}</AppText>
          )}
        </ShipStatCard>
      </View>

      <View className="gap-2.5">
        <AppText weight="semibold" className="mb-0.5 text-xs uppercase tracking-wide text-neutral-500">
          {strings.home.fleetSection}
        </AppText>

        <ShipStatCard
          icon={<ChartNoAxesCombined size={14} color="#d4d4d4" />}
          iconBg="rgba(113,113,122,0.2)"
          title={strings.home.shipDroneProduction}
        >
          <View className="gap-0.5">
            <ShipStatLine label={strings.home.shipDroneProductionDesc} value={numberFmt(totalDroneProduction)} unit={cpsUnit} />
            <ShipStatLine
              label={strings.home.shipOfflineProductionDesc}
              value={numberFmt(totalDroneProduction * offlineProductionValue)}
              unit={cpsUnit}
            />
          </View>
        </ShipStatCard>

        <ShipStatCard icon={<DroneIcon size={14} color="#c4b5fd" />} iconBg="rgba(167,139,250,0.2)" title={strings.home.shipDroneCount}>
          <View className="gap-0.5">
            <ShipStatLine label={strings.home.shipDroneCountDesc} value={String(autoClickLevel)} />
            <ShipStatLine label={strings.home.shipDronePerUnitDesc} value={numberFmt(autoMultiplierValue)} unit={cpsUnit} />
          </View>
        </ShipStatCard>

        <ShipStatCard icon={<DroneIcon size={14} color="#fcd34d" />} iconBg="rgba(251,191,36,0.2)" title={strings.home.shipScoutDrones}>
          {scoutDroneLevel > 0 ? (
            <View className="gap-0.5">
              <ShipStatLine label={strings.home.shipScoutDronesCountDesc} value={String(scoutDroneLevel)} />
              <ShipStatLine label={strings.home.shipScoutDronesPerUnitDesc} value={numberFmt(scoutDroneRate)} unit={cpsUnit} />
            </View>
          ) : (
            <AppText className="text-xs font-medium text-neutral-600">{strings.home.shipNotInstalled}</AppText>
          )}
        </ShipStatCard>
      </View>
    </CockpitModal>
  )
}
