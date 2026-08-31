import { LinearGradient } from 'expo-linear-gradient'
import { X } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
// The whole app runs inside a GestureHandlerRootView (needed for React
// Navigation) — a plain `ScrollView` from 'react-native' inside that
// context is a known source of exactly this kind of unreliable/fighting
// scroll gesture recognition. react-native-gesture-handler ships its own
// drop-in `ScrollView` that integrates with the same gesture system
// properly.
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler'
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
  const { height: windowHeight } = useWindowDimensions()

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* RN's `Modal` renders into its own separate native root, disconnected
          from the app's top-level GestureHandlerRootView (see App.tsx) — the
          gesture-handler ScrollView below needs its own here, or its pan
          gesture doesn't get captured correctly inside the modal's window and
          instead reads as an erratic scroll on whatever's underneath (Home's
          own screen visibly shifting while "scrolling" a modal with nothing
          to scroll). Documented gesture-handler requirement, not a guess. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Pressable className="flex-1 items-center justify-center bg-black/70 px-6" onPress={onClose}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-sm border border-white/10"
            // A real *number* maxHeight (from useWindowDimensions), not a
            // percentage string — a percentage still needs its parent to have
            // already resolved to a definite height for Yoga to compute
            // against, and something in that chain (Modal -> backdrop
            // Pressable -> this card) wasn't giving it one: with
            // `maxHeight: '80%'` the ScrollView below collapsed to 0 height
            // instead of the header-only content just overflowing, hiding the
            // whole modal body. An explicit pixel number needs no such
            // resolution and can't hit that ambiguity.
            style={{
              maxHeight: windowHeight * 0.8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.5,
              shadowRadius: 30,
            }}
          >
            <LinearGradient colors={['#15151d', '#0e0e15', '#0a0a10']} style={StyleSheet.absoluteFill} />

            {/* Corner rivets sit at the base layer, but the scanline needs an
                explicit `zIndex` to paint *above* the header and scrollable
                content below — on the web this is a `position` + `z-10`
                element, which CSS stacks above its plain, non-positioned
                siblings regardless of DOM order; React Native has no such
                rule; it just paints in JSX order unless zIndex says
                otherwise. Without this, the scanline sat behind everything,
                instead of translucently over the mission cards the way the
                web's does. */}
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

            {/* Padding belongs on `contentContainerStyle`, not the ScrollView's
                own `style`/className — that pads the fixed scrollable
                viewport, not the actual scrolling content edges, which read
                as content jammed against the modal's sides no matter what
                padding value was set. */}
            {/* `flex: 1` so this actually gets a *bounded* height (whatever's
                left under the header, within the card's own maxHeight) for
                content taller than that to scroll within — without it, a
                ScrollView's height is just "however tall its content is",
                which has nothing to scroll. */}
            {/* `flexShrink: 1` (not `flex: 1`) deliberately — `flex: 1` implies
                `flexBasis: 0%`, which needs a *definite* height on this
                auto-sized-but-capped card to mean anything, and resolved to
                a collapsed 0-height ScrollView instead (the whole modal body
                disappeared, header only). `flexShrink` starts from this
                view's natural content size and only shrinks it once the
                card's own maxHeight constraint actually bites — no definite
                parent height required for that to resolve correctly. */}
            <ScrollView style={{ flexShrink: 1, minHeight: 0 }} contentContainerStyle={{ padding: 20, gap: 10 }}>
              {children}
            </ScrollView>

            {/* Rendered last (paints on top of the header + scroll content),
                matching the web's own z-10 scanline overlay — this is what
                actually makes it read as translucent lines drawn over the
                mission cards, not just texture sitting in the gaps behind
                them. */}
            <ScanlineTexture />
          </Pressable>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  )
}
