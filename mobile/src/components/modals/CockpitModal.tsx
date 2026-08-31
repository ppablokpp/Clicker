import { LinearGradient } from 'expo-linear-gradient'
import { X } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { DisplayText } from '../AppText'
import { IconBadge } from '../IconBadge'
import { RadialGlow } from '../RadialGlow'
import { ScanlineTexture } from '../ScanlineTexture'

// Shared shell for Home's four cockpit-styled modals (Centro de mando,
// Inventario, Tareas, Bitácora) — mirrors front/src/pages/Home.tsx's
// CockpitModalChrome + the repeated modal wrapper markup all four shared
// there. Ported once here instead of copy-pasted per modal.
export function CockpitModal({
  visible,
  onClose,
  icon,
  iconBackground,
  iconColor,
  glowColor,
  title,
  subtitle,
  children,
}: {
  visible: boolean
  onClose: () => void
  icon: ReactNode
  iconBackground: [string, string]
  iconColor: string
  glowColor: string
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/70 px-6" onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="relative max-h-[80%] w-full max-w-sm overflow-hidden rounded-sm border border-white/10"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 30 }}
        >
          <LinearGradient colors={['#15151d', '#0e0e15', '#0a0a10']} style={StyleSheet.absoluteFill} />

          {/* scanline texture + corner rivets, same as the cockpit header */}
          <ScanlineTexture />
          <View className="absolute left-1.5 top-1.5 h-1 w-1 rounded-full bg-white/25" />
          <View className="absolute right-1.5 top-1.5 h-1 w-1 rounded-full bg-white/25" />

          <View className="relative overflow-hidden border-b border-white/5 px-6 pb-5 pt-6">
            {/* Centered via flexbox (alignItems), not percentage-based left/
                transform math — the latter measured out fine on paper but
                rendered off-center here, and flex centering can't drift the
                same way. */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill} className="items-center">
              <View style={{ transform: [{ translateY: -64 }] }}>
                <RadialGlow size={128} color={glowColor} />
              </View>
            </View>
            <Pressable onPress={onClose} accessibilityLabel="Close" className="absolute right-4 top-4">
              <X size={16} color="#737373" />
            </Pressable>
            <View className="relative flex-row items-center gap-2.5">
              <IconBadge icon={icon} iconSize={19} padding={10} gradientColors={iconBackground} borderColor={iconBackground[0]} />
              <View>
                <DisplayText weight="bold" className="text-base text-white">
                  {title}
                </DisplayText>
                {subtitle && (
                  <Text className="font-mono text-[9px] font-semibold uppercase tracking-widest" style={{ color: iconColor }}>
                    {subtitle}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <ScrollView className="p-5" contentContainerStyle={{ gap: 10 }}>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
