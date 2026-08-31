import { LinearGradient } from 'expo-linear-gradient'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

// A round icon badge — used for every "icon in a tinted circle" spot in the
// app (modal header icons, Command Center stat card icons, and any new one
// going forward). The circle's size is always `iconSize + padding*2`,
// computed explicitly, rather than picking some fixed circle size that
// happens to leave a bit of room around a smaller icon — the latter is how
// the Command Center's stat cards ended up looking like the icon had no
// breathing room around it even though the ratio matched other badges
// elsewhere: at a small absolute size, an implicit ratio reads as "no
// padding" even when the math says otherwise. Standing convention: always
// use this component for icon-in-circle badges, don't hand-roll a new one.
export function IconBadge({
  icon,
  iconSize = 16,
  padding = 10,
  background,
  gradientColors,
  borderColor,
  rounded = 'full',
}: {
  icon: ReactNode
  iconSize?: number
  padding?: number
  background?: string
  gradientColors?: [string, string]
  borderColor?: string
  /** 'full' for a circle (most badges), a number for a rounded square (e.g. mission badges use the web's `rounded-lg`, 8). */
  rounded?: 'full' | number
}) {
  const size = iconSize + padding * 2
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: rounded === 'full' ? size / 2 : rounded,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: background,
        borderWidth: borderColor ? 1 : 0,
        borderColor,
      }}
    >
      {gradientColors && (
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      )}
      {icon}
    </View>
  )
}
