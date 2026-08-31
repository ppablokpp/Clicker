import { BlurView } from 'expo-blur'
import { Minus, Plus, RotateCcw } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'

const BUTTON_SIZE = 36

// Ported from Tree.tsx's own floating zoom stack (bottom-24 right-4,
// h-9 w-9 circles, bg-black/40 backdrop-blur-xl border-white/10) — the
// tutorial-replay "?" button above it on web has no mobile equivalent
// (no tutorial system there yet), so this is just the 3 zoom buttons.
function ZoomButton({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={{ backgroundColor: 'rgba(0,0,0,0.4)', ...StyleSheet.absoluteFillObject }} />
      {children}
    </Pressable>
  )
}

export function TreeZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}) {
  return (
    <View style={{ position: 'absolute', bottom: 96, right: 16, gap: 6 }}>
      <ZoomButton onPress={onZoomIn}>
        <Plus size={16} color="#d4d4d4" />
      </ZoomButton>
      <ZoomButton onPress={onZoomOut}>
        <Minus size={16} color="#d4d4d4" />
      </ZoomButton>
      <ZoomButton onPress={onReset}>
        <RotateCcw size={14} color="#d4d4d4" />
      </ZoomButton>
    </View>
  )
}
