import { Stone, Zap } from 'lucide-react-native'
import { useCallback, useEffect, useMemo } from 'react'
import { Pressable, Text, useWindowDimensions, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ProgressRing, SpaceObject } from '../components/SpaceObject'
import { Starfield } from '../components/Starfield'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useLanguage } from '../context/LanguageContext'
import { formatPlatino } from '../lib/formatPlatino'
import { MATERIAL_ABBREVIATIONS } from '../lib/materialTiers'

// Same escalating "combo meter" as front/src/pages/Home.tsx's HEAT_LEVELS —
// the `legendary` tier is left out for now since it's gated behind the
// Umbral tree node, and TreeContext hasn't been ported to mobile yet.
type HeatKey = 'onFire' | 'unstoppable' | null

const HEAT_LEVELS: { min: number; key: HeatKey; badge: string; icon: string }[] = [
  { min: 0, key: null, badge: '#d4d4d4', icon: '#525252' },
  { min: 6, key: 'onFire', badge: '#fcd34d', icon: '#fbbf24' },
  { min: 10, key: 'unstoppable', badge: '#fdba74', icon: '#fb923c' },
]

function getHeatLevel(cps: number) {
  let level = HEAT_LEVELS[0]
  for (const l of HEAT_LEVELS) {
    if (cps >= l.min) level = l
  }
  return level
}

const TRAJECTORY_TIER_THRESHOLDS = [0, 10_000_000, 1_000_000_000, 100_000_000_000, 10_000_000_000_000, 1_000_000_000_000_000]

// Fine scanline sweep across the platino "screen" — a looping translateY,
// same 3.4s linear pass as the web version's motion.div.
function ScanlineSweep() {
  const y = useSharedValue(-40)
  useEffect(() => {
    y.value = withRepeat(withTiming(128, { duration: 3400, easing: Easing.linear }), -1)
  }, [y])
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }))
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, height: 40 }, style]}>
      <LinearGradient colors={['rgba(255,255,255,0.05)', 'transparent']} style={{ flex: 1 }} />
    </Animated.View>
  )
}

export function HomeScreen() {
  const { strings, language } = useLanguage()
  const { totalClicks, lifetimePlatino, clicksPerSecond, prestigeTier, registerClick } = useClickCounterContext()
  const { width, height } = useWindowDimensions()

  const currentTierIndex = prestigeTier
  const currentMaterialName = strings.home.trajectoryTierNames[currentTierIndex]
  const cpsUnit = `${MATERIAL_ABBREVIATIONS[currentTierIndex]}/s`
  const locale = language === 'en' ? 'en-US' : 'es-ES'

  const hasNextTier = currentTierIndex < TRAJECTORY_TIER_THRESHOLDS.length - 1
  const prestige = useMemo(() => {
    const tierFrom = TRAJECTORY_TIER_THRESHOLDS[currentTierIndex]
    const tierTo = TRAJECTORY_TIER_THRESHOLDS[currentTierIndex + 1]
    return {
      isMaxed: !hasNextTier,
      readyToPrestige: hasNextTier && lifetimePlatino >= tierTo,
      pct: tierTo ? Math.min(1, (lifetimePlatino - tierFrom) / (tierTo - tierFrom)) : 1,
    }
  }, [lifetimePlatino, currentTierIndex, hasNextTier])

  const heat = getHeatLevel(clicksPerSecond)
  const heatLabel = heat.key ? strings.home.heat[heat.key] : null

  const handleTap = useCallback(() => {
    registerClick(1)
  }, [registerClick])

  return (
    <SafeAreaView className="flex-1 bg-[#08080c]">
      <Starfield width={width} height={height} />

      {/* Cockpit console — mirrors front/src/pages/Home.tsx's HUD panel:
          twin gauges (heat/production) on row 1, the platino "screen" with
          corner brackets + scanline sweep on row 2. The four flanking
          icon buttons (command center, inventory, tasks, log) aren't
          ported yet — those need their own contexts/modals first. */}
      <View className="px-3 pt-2">
        <View
          className="overflow-hidden rounded-b-sm border border-white/10 bg-[#0e0e15]"
          style={{ borderTopWidth: 0 }}
        >
          <View className="h-px bg-violet-400/40" />
          <View className="flex-col gap-2 p-2.5">
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-[3px] border border-white/10 bg-black/30 px-2.5 py-1.5">
                <View className="flex-row items-center gap-1.5">
                  <Zap size={11} color={clicksPerSecond > 0 ? heat.icon : '#525252'} />
                  <Text className="font-mono text-[8px] font-semibold uppercase tracking-widest text-neutral-500">
                    {strings.home.hudHeatLabel}
                  </Text>
                  {heatLabel && (
                    <Text style={{ color: heat.badge }} className="text-[8px] font-bold uppercase tracking-wide">
                      {heatLabel}
                    </Text>
                  )}
                </View>
                <Text
                  style={{ color: clicksPerSecond > 0 ? heat.badge : '#d4d4d4' }}
                  className="mt-0.5 font-mono text-sm font-bold"
                >
                  {clicksPerSecond.toFixed(1)} {strings.home.tps}
                </Text>
              </View>

              <View className="flex-1 rounded-[3px] border border-violet-400/20 bg-violet-500/[0.06] px-2.5 py-1.5">
                <View className="flex-row items-center gap-1.5">
                  <Stone size={11} color="#c4b5fd" />
                  <Text className="font-mono text-[8px] font-semibold uppercase tracking-widest text-violet-400/70">
                    {strings.home.hudProdLabel}
                  </Text>
                </View>
                <Text className="mt-0.5 font-mono text-sm font-bold text-violet-200">
                  {clicksPerSecond.toFixed(1)} {cpsUnit}
                </Text>
              </View>
            </View>

            <View className="relative overflow-hidden rounded-[3px] border border-white/10 bg-black/40 px-3 py-2.5">
              <View className="absolute left-1 top-1 h-2 w-2 border-l border-t border-violet-400/40" />
              <View className="absolute right-1 top-1 h-2 w-2 border-r border-t border-violet-400/40" />
              <View className="absolute bottom-1 left-1 h-2 w-2 border-b border-l border-violet-400/40" />
              <View className="absolute bottom-1 right-1 h-2 w-2 border-b border-r border-violet-400/40" />
              <ScanlineSweep />
              <View className="items-center">
                <Text className="font-mono text-[9px] font-semibold uppercase tracking-[3px] text-neutral-500">
                  {strings.home.hudPlatinoLabel(currentMaterialName)}
                </Text>
                <Text className="text-4xl font-bold text-white" style={{ fontVariant: ['tabular-nums'] }}>
                  {formatPlatino(totalClicks, language)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <Pressable onPress={handleTap} className="flex-1 items-center justify-center active:opacity-90">
        <View className="relative h-72 w-72 items-center justify-center">
          <View style={{ position: 'absolute', width: '70%', height: '70%' }}>
            <ProgressRing pct={prestige.pct} isMaxed={prestige.readyToPrestige} />
          </View>
          <SpaceObject tierIndex={currentTierIndex} pct={prestige.pct} />
        </View>
      </Pressable>

      <Text className="pb-6 text-center text-[11px] text-neutral-600">{totalClicks.toLocaleString(locale)}</Text>
    </SafeAreaView>
  )
}
