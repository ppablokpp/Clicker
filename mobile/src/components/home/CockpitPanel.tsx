import { LinearGradient } from 'expo-linear-gradient'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { ScanlineTexture } from '../ScanlineTexture'

// The cockpit console's outer chrome — mirrors front/src/pages/Home.tsx's
// HUD panel background: gradient body, a violet top edge light strip, a
// very-low-opacity scanline texture, corner rivets, and a drop shadow.
// Purely decorative; screen content (gauges, the platino display) is
// passed in as children.
export function CockpitPanel({ children }: { children: ReactNode }) {
  return (
    <View
      className="relative overflow-hidden rounded-sm border border-white/10"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
      }}
    >
      <LinearGradient colors={['#15151d', '#0e0e15', '#0a0a10']} style={StyleSheet.absoluteFill} />
      <View className="h-px bg-violet-400/40" />
      <ScanlineTexture />
      <View className="absolute left-1.5 top-1.5 h-1 w-1 rounded-full bg-white/25" />
      <View className="absolute right-1.5 top-1.5 h-1 w-1 rounded-full bg-white/25" />
      <View className="flex-col gap-2 p-2.5">{children}</View>
    </View>
  )
}
