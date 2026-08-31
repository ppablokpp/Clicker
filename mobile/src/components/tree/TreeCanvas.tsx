import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'

const MIN_SCALE = 0.45
const MAX_SCALE = 2

// A pannable, pinch-zoomable canvas — the Tree screen's own gesture surface.
// Ported conceptually from front/src/pages/Tree.tsx's pan/zoom (mouse
// drag + wheel + touch-pinch there), rebuilt from scratch here with
// react-native-gesture-handler's Pan+Pinch composed simultaneously, driving
// plain reanimated shared values (translateX/Y/scale) — matches the plan's
// own architecture note for this screen instead of trying to port any
// DOM/CSS-specific pan-zoom code, which wouldn't translate anyway.
//
// Zoom is anchored on the pinch's own focal point (not the canvas center) —
// without that, pinching near an edge visibly "swims" the content sideways
// instead of zooming in on what your fingers are actually over, which is
// what a first pass without focal-point math felt like.
export function TreeCanvas({
  contentWidth,
  contentHeight,
  initialScale = 1,
  initialFocus,
  children,
}: {
  contentWidth: number
  contentHeight: number
  /** Starting zoom level — matches the web's own DEFAULT_SCALE. */
  initialScale?: number
  /** The content-space point to center in the viewport on mount (e.g. the tree's root node), at initialScale. */
  initialFocus?: { x: number; y: number; viewportWidth: number; viewportHeight: number }
  children: ReactNode
}) {
  const initialX = initialFocus ? initialFocus.viewportWidth / 2 - initialFocus.x * initialScale : 0
  const initialY = initialFocus ? initialFocus.viewportHeight / 2 - initialFocus.y * initialScale : 0

  const translateX = useSharedValue(initialX)
  const translateY = useSharedValue(initialY)
  const scale = useSharedValue(initialScale)

  const startX = useSharedValue(0)
  const startY = useSharedValue(0)
  const startScale = useSharedValue(1)
  // Focal point of the pinch, in canvas-content space, captured once per
  // gesture — used to keep that exact content point under the fingers as
  // scale changes.
  const focalContentX = useSharedValue(0)
  const focalContentY = useSharedValue(0)

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value
      startY.value = translateY.value
    })
    .onUpdate((e) => {
      translateX.value = startX.value + e.translationX
      translateY.value = startY.value + e.translationY
    })
    .minPointers(1)
    .maxPointers(2)

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      startScale.value = scale.value
      startX.value = translateX.value
      startY.value = translateY.value
      // Convert the pinch's focal point (canvas-local coordinates) into
      // the untransformed content's own coordinate space, so it stays
      // fixed under the fingers regardless of the current pan/scale.
      focalContentX.value = (e.focalX - translateX.value) / scale.value
      focalContentY.value = (e.focalY - translateY.value) / scale.value
    })
    .onUpdate((e) => {
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, startScale.value * e.scale))
      scale.value = nextScale
      translateX.value = e.focalX - focalContentX.value * nextScale
      translateY.value = e.focalY - focalContentY.value * nextScale
    })

  const composed = Gesture.Simultaneous(pan, pinch)

  const contentStyle = useAnimatedStyle(() => ({
    // `transformOrigin` needs all 3 axes (x, y, z) — RN's default pivot
    // for `scale` is the view's own center, which makes "translate +
    // scale*point" math (what the focal-point-anchored pinch above
    // assumes) wrong by a constant offset unless the pivot is pinned to
    // the top-left first.
    transformOrigin: [0, 0, 0],
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }))

  return (
    <GestureDetector gesture={composed}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            { position: 'absolute', width: contentWidth, height: contentHeight, left: 0, top: 0 },
            contentStyle,
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </GestureDetector>
  )
}
