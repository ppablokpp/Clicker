import { LinearGradient } from 'expo-linear-gradient'
import { useEffect } from 'react'
import { Text, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { DisplayText } from '../AppText'

// Fine scanline sweep across the screen — a looping translateY, same 3.4s
// linear pass as the web version's motion.div.
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

// The ship's main readout — mirrors front/src/pages/Home.tsx's "screen" panel:
// corner brackets + a slow scanline sweep sell the "active display" feel.
export function PlatinoScreen({ label, value }: { label: string; value: string }) {
  return (
    <View className="relative flex-1 overflow-hidden rounded-[3px] border border-white/10 bg-black/40 px-3 py-2.5">
      <View className="absolute left-1 top-1 h-2 w-2 border-l border-t border-violet-400/40" />
      <View className="absolute right-1 top-1 h-2 w-2 border-r border-t border-violet-400/40" />
      <View className="absolute bottom-1 left-1 h-2 w-2 border-b border-l border-violet-400/40" />
      <View className="absolute bottom-1 right-1 h-2 w-2 border-b border-r border-violet-400/40" />
      <ScanlineSweep />
      <View className="items-center gap-1">
        <Text className="font-mono text-[9px] font-semibold uppercase tracking-[3px] text-neutral-500">{label}</Text>
        <DisplayText
          weight="bold"
          className="text-white"
          style={{ fontVariant: ['tabular-nums'], fontSize: 42, lineHeight: 46 }}
        >
          {value}
        </DisplayText>
      </View>
    </View>
  )
}
