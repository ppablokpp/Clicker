import { Lock, Route } from 'lucide-react-native'
import { Text, View } from 'react-native'
import { AppText } from '../AppText'
import { CockpitModal } from '../modals/CockpitModal'
import { useLanguage } from '../../context/LanguageContext'
import { formatPlatino } from '../../lib/formatPlatino'
import { MATERIAL_TIER_COLORS } from '../../lib/materialTiers'
import { TRAJECTORY_TIER_THRESHOLDS } from '../../lib/trajectory'
import { MiniAsteroid } from './MiniAsteroid'

// Trayectoria's roadmap — every material tier, current/locked/cleared.
// Ported from front/src/pages/Home.tsx's showLog panel; fully self-contained
// (no new context needed) since it only reads prestigeTier/lifetimePlatino,
// both already exposed by ClickCounterContext.
export function LogModal({
  visible,
  onClose,
  currentTierIndex,
  lifetimePlatino,
}: {
  visible: boolean
  onClose: () => void
  currentTierIndex: number
  lifetimePlatino: number
}) {
  const { strings, language } = useLanguage()

  return (
    <CockpitModal
      visible={visible}
      onClose={onClose}
      icon={<Route size={19} color="#7dd3fc" />}
      iconBackground={['rgba(56,189,248,0.3)', 'rgba(6,182,212,0.2)']}
      iconColor="#7dd3fc"
      glowColor="rgba(56,189,248,0.35)"
      title={strings.home.logTitle}
    >
      {MATERIAL_TIER_COLORS.map((tier, i) => {
        const isCurrent = i === currentTierIndex
        const isLocked = i > currentTierIndex
        const tierCeiling = TRAJECTORY_TIER_THRESHOLDS[i + 1]
        const extractionText = isLocked
          ? strings.home.trajectoryExtractionUnknown
          : strings.home.trajectoryExtraction(
              formatPlatino(isCurrent ? lifetimePlatino : Math.min(lifetimePlatino, tierCeiling), language),
              formatPlatino(tierCeiling, language),
            )

        return (
          <View
            key={i}
            className={`relative flex-row items-center gap-3 overflow-hidden rounded-[3px] border p-3 ${
              isCurrent ? 'border-white/15 bg-white/[0.04]' : 'border-white/5 bg-white/[0.02]'
            }`}
            style={isCurrent ? { borderColor: tier.glow } : undefined}
          >
            <MiniAsteroid tierIndex={i} dimmed={isLocked} />
            <View className="min-w-0 flex-1 gap-0.5">
              <View className="flex-row flex-wrap items-center gap-1.5">
                <AppText weight="semibold" className={`text-sm ${isLocked ? 'text-neutral-500' : 'text-white'}`}>
                  {strings.home.trajectoryTierNames[i]}
                </AppText>
                {isCurrent && (
                  <View className="rounded-full border px-1.5 py-0.5" style={{ borderColor: tier.glow }}>
                    <Text className="font-mono text-[8px] font-bold uppercase tracking-widest" style={{ color: tier.fill }}>
                      {strings.home.trajectoryCurrent}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="font-mono text-[10px] text-neutral-500">{extractionText}</Text>
            </View>
            {isLocked && <Lock size={14} color="#525252" />}
          </View>
        )
      })}

      <View className="items-center justify-center rounded-[3px] border border-dashed border-white/10 py-3">
        <Text className="font-mono text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
          {strings.home.trajectoryComingSoon}
        </Text>
      </View>
    </CockpitModal>
  )
}
