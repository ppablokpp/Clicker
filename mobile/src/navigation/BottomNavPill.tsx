import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { BarChart3, Network, Rocket, Store, Trophy } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScanlineTexture } from '../components/ScanlineTexture'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useLanguage } from '../context/LanguageContext'

const PILL_ITEMS = [
  { name: 'Tree', key: 'tree' as const, icon: Network },
  { name: 'Leaderboard', key: 'leaderboard' as const, icon: Trophy },
  { name: 'Home', key: 'home' as const, icon: Rocket },
  { name: 'Stats', key: 'stats' as const, icon: BarChart3 },
  { name: 'Store', key: 'store' as const, icon: Store },
]

// The pill's own material — blur + gradient + a faded hairline — clipped to
// the rounded shape in its own absolutely-filled layer. Kept separate from
// the nav row below it (see BottomNavPill) so that layer's overflow-hidden
// never also clips the raised Home button, which needs to poke out above
// and below the pill's own bounds.
function PillChrome() {
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden rounded-full">
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['#17171f', '#101017', '#0a0a10']} style={StyleSheet.absoluteFill} />
      <ScanlineTexture opacity={0.03} />
      <LinearGradient
        colors={['transparent', 'rgba(167,139,250,0.4)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', left: 12, right: 12, bottom: 0, height: 1 }}
      />
    </View>
  )
}

function PillTabButton({
  label,
  isActive,
  onPress,
  icon: Icon,
}: {
  label: string
  isActive: boolean
  onPress: () => void
  icon: typeof Network
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      className={`h-10 w-10 items-center justify-center rounded-full ${isActive ? 'bg-white/10' : ''}`}
    >
      <Icon size={17} color={isActive ? '#c4b5fd' : '#737373'} />
    </Pressable>
  )
}

// The center Home tab — raised above the pill in its own circle with a
// permanent violet glow border, matching the ClankUp wordmark. Rendered as
// a sibling of the clipped PillChrome layer (not inside it) so it's free to
// overflow past the pill's own top/bottom edge instead of being cropped.
function PillHomeButton({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) {
  return (
    <View className="h-10 w-16 items-center justify-center">
      <Pressable
        onPress={onPress}
        accessibilityLabel={label}
        className={`h-14 w-14 items-center justify-center rounded-full border ${
          isActive ? 'border-violet-400/50 bg-[#171224]' : 'border-violet-400/25 bg-[#12101a]'
        }`}
      >
        <Rocket size={22} color="#c4b5fd" style={{ opacity: isActive ? 1 : 0.8 }} />
      </Pressable>
    </View>
  )
}

// Ported from front/src/components/BottomNavPill.tsx — same floating pill
// (not a full-width bar), same raised violet-glow circle for the center
// Home tab, same scanline + hairline texture. Swapped in as the tab
// navigator's own `tabBar` render prop so React Navigation still drives
// focus/routing, only the chrome is custom.
export function BottomNavPill({ state, navigation }: BottomTabBarProps) {
  const { strings } = useLanguage()
  const { isSyncSuspended } = useClickCounterContext()
  const insets = useSafeAreaInsets()

  return (
    <View
      pointerEvents={isSyncSuspended ? 'none' : 'box-none'}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: insets.bottom + 12,
        alignItems: 'center',
        opacity: isSyncSuspended ? 0.4 : 1,
      }}
    >
      {/* No overflow-hidden here — PillChrome clips itself, but the raised
          Home button below needs to overflow past this container's own
          rounded edge. */}
      <View className="relative rounded-full border border-white/10">
        <PillChrome />
        <View className="relative flex-row items-center gap-0.5 p-1">
          {PILL_ITEMS.map(({ name, key, icon }) => {
            const routeIndex = state.routes.findIndex((r) => r.name === name)
            const isActive = state.index === routeIndex
            const label = strings.nav[key]
            const onPress = () => {
              if (!isActive) navigation.navigate(name)
            }

            if (key === 'home') {
              return <PillHomeButton key={name} label={label} isActive={isActive} onPress={onPress} />
            }
            return <PillTabButton key={name} label={label} isActive={isActive} onPress={onPress} icon={icon} />
          })}
        </View>
      </View>
    </View>
  )
}
