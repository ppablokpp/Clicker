import { forwardRef, useImperativeHandle, type ReactNode } from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'

// Matches front/src/pages/Tree.tsx's own MIN_SCALE/MAX_SCALE exactly.
const MIN_SCALE = 0.5
const MAX_SCALE = 2.5

// A one-finger touch only actually claims the gesture (and blocks the node
// Pressable underneath) once it's moved this many px — otherwise a plain
// tap-and-release on a node would get swallowed by this Manual gesture
// activating on touch-down before the node's own onPress ever fires. A
// two-finger touch skips this: there's no tappable target that expects a
// second simultaneous finger, so it activates immediately, same as the web.
const PAN_ACTIVATE_DISTANCE = 4

export interface TreeCanvasHandle {
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
}

// A pannable, pinch-zoomable canvas — rebuilt from a `Gesture.Manual()`
// tracking raw touches directly (onTouchesDown/Move/Up), instead of
// composing gesture-handler's own Pan+Pinch recognizers together.
//
// Why: `Gesture.Simultaneous(Gesture.Pan(), Gesture.Pinch())` computes the
// Pan's translation from the *centroid* of however many fingers are down.
// The instant a second finger lands or the first of two lifts, that
// centroid jumps from "midpoint of two touches" to "the one remaining
// touch's raw position" in a single frame — which is exactly the "se mueve
// a esa posición un poco raro" glitch when releasing one finger mid-pinch.
//
// The web version (Tree.tsx's handlePointerDown/Move/endDrag) never has
// this problem because it manually tracks each pointer by id in a Map and
// explicitly recomputes a fresh pan/pinch anchor at the *current* transform
// every time the pointer set changes size — nothing is ever computed from
// a stale multi-finger average. That's the exact algorithm ported below,
// just against RNGH's raw touch events instead of the DOM Pointer Events
// API, and against shared values instead of refs (so every read inside the
// worklet is always the live value, sidestepping the stale-closure
// bookkeeping the web version needs `useCallback` deps arrays for).
export const TreeCanvas = forwardRef<
  TreeCanvasHandle,
  {
    contentWidth: number
    contentHeight: number
    /** Starting zoom level — matches the web's own DEFAULT_SCALE. */
    initialScale?: number
    /** The content-space point to center in the viewport on mount (e.g. the tree's root node), at initialScale. */
    initialFocus?: { x: number; y: number }
    children: ReactNode
  }
>(function TreeCanvas({ contentWidth, contentHeight, initialScale = 1, initialFocus, children }, ref) {
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions()

  const initialX = initialFocus ? viewportWidth / 2 - initialFocus.x * initialScale : 0
  const initialY = initialFocus ? viewportHeight / 2 - initialFocus.y * initialScale : 0

  const translateX = useSharedValue(initialX)
  const translateY = useSharedValue(initialY)
  const scale = useSharedValue(initialScale)

  // Which single touch is driving a pan, or which pair is driving a pinch —
  // mirrors the web's dragRef/pinchRef exactly. mode 0 = idle, 1 = pan, 2 = pinch.
  const mode = useSharedValue<0 | 1 | 2>(0)
  const primaryId = useSharedValue(-1)
  const primaryX = useSharedValue(0)
  const primaryY = useSharedValue(0)
  const secondaryId = useSharedValue(-1)
  const secondaryX = useSharedValue(0)
  const secondaryY = useSharedValue(0)

  const dragStartX = useSharedValue(0)
  const dragStartY = useSharedValue(0)
  const dragOriginX = useSharedValue(0)
  const dragOriginY = useSharedValue(0)

  const pinchStartDistance = useSharedValue(0)
  const pinchStartScale = useSharedValue(0)
  const pinchStartMidX = useSharedValue(0)
  const pinchStartMidY = useSharedValue(0)
  const pinchOriginX = useSharedValue(0)
  const pinchOriginY = useSharedValue(0)

  // Whether this gesture has actually claimed the touch stream yet (see
  // PAN_ACTIVATE_DISTANCE above) — reset on every fresh touch-down.
  const hasActivated = useSharedValue(false)

  const beginPan = (id: number, x: number, y: number) => {
    'worklet'
    mode.value = 1
    primaryId.value = id
    primaryX.value = x
    primaryY.value = y
    dragStartX.value = x
    dragStartY.value = y
    dragOriginX.value = translateX.value
    dragOriginY.value = translateY.value
  }

  const beginPinch = (idA: number, ax: number, ay: number, idB: number, bx: number, by: number) => {
    'worklet'
    mode.value = 2
    primaryId.value = idA
    primaryX.value = ax
    primaryY.value = ay
    secondaryId.value = idB
    secondaryX.value = bx
    secondaryY.value = by
    pinchStartDistance.value = Math.hypot(ax - bx, ay - by)
    pinchStartScale.value = scale.value
    pinchStartMidX.value = (ax + bx) / 2
    pinchStartMidY.value = (ay + by) / 2
    pinchOriginX.value = translateX.value
    pinchOriginY.value = translateY.value
  }

  const touch = Gesture.Manual()
    .onTouchesDown((e, manager) => {
      'worklet'
      manager.begin()
      if (e.numberOfTouches === 2) {
        const [a, b] = e.allTouches
        beginPinch(a.id, a.x, a.y, b.id, b.x, b.y)
        hasActivated.value = true
        manager.activate()
      } else if (e.numberOfTouches === 1) {
        const a = e.allTouches[0]
        beginPan(a.id, a.x, a.y)
        hasActivated.value = false
      }
    })
    .onTouchesMove((e, manager) => {
      'worklet'
      for (const touchPoint of e.allTouches) {
        if (touchPoint.id === primaryId.value) {
          primaryX.value = touchPoint.x
          primaryY.value = touchPoint.y
        } else if (touchPoint.id === secondaryId.value) {
          secondaryX.value = touchPoint.x
          secondaryY.value = touchPoint.y
        }
      }

      if (mode.value === 2) {
        const distance = Math.hypot(primaryX.value - secondaryX.value, primaryY.value - secondaryY.value)
        const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchStartScale.value * (distance / pinchStartDistance.value)))
        const ratio = nextScale / pinchStartScale.value
        const midX = (primaryX.value + secondaryX.value) / 2
        const midY = (primaryY.value + secondaryY.value) / 2
        scale.value = nextScale
        translateX.value = midX - (pinchStartMidX.value - pinchOriginX.value) * ratio
        translateY.value = midY - (pinchStartMidY.value - pinchOriginY.value) * ratio
      } else if (mode.value === 1) {
        if (!hasActivated.value) {
          const moved = Math.hypot(primaryX.value - dragStartX.value, primaryY.value - dragStartY.value)
          if (moved < PAN_ACTIVATE_DISTANCE) return
          hasActivated.value = true
          manager.activate()
        }
        translateX.value = dragOriginX.value + (primaryX.value - dragStartX.value)
        translateY.value = dragOriginY.value + (primaryY.value - dragStartY.value)
      }
    })
    .onTouchesUp((e, manager) => {
      'worklet'
      const liftedIds = e.changedTouches.map((t) => t.id)
      const remaining = e.allTouches.filter((t) => !liftedIds.includes(t.id))

      if (mode.value === 2 && (liftedIds.includes(primaryId.value) || liftedIds.includes(secondaryId.value))) {
        if (remaining.length >= 1) {
          // One finger of the pinch lifted — hand off to a fresh single-
          // finger pan anchored on the CURRENT transform and the remaining
          // finger's CURRENT position, so nothing jumps (same trick as the
          // web's own endDrag).
          const r = remaining[0]
          beginPan(r.id, r.x, r.y)
        } else {
          mode.value = 0
        }
      } else if (mode.value === 1 && liftedIds.includes(primaryId.value)) {
        mode.value = 0
      }

      if (remaining.length === 0) {
        mode.value = 0
        hasActivated.value = false
        manager.end()
      }
    })
    .onTouchesCancelled((_e, manager) => {
      'worklet'
      mode.value = 0
      hasActivated.value = false
      manager.end()
    })

  const contentStyle = useAnimatedStyle(() => ({
    transformOrigin: [0, 0, 0],
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }))

  const zoomAroundCenter = (nextScale: (current: number) => number) => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale(scale.value)))
    const ratio = clamped / scale.value
    const cx = viewportWidth / 2
    const cy = viewportHeight / 2
    translateX.value = cx - (cx - translateX.value) * ratio
    translateY.value = cy - (cy - translateY.value) * ratio
    scale.value = clamped
  }

  useImperativeHandle(ref, () => ({
    zoomIn: () => zoomAroundCenter((s) => s * 1.25),
    zoomOut: () => zoomAroundCenter((s) => s * 0.8),
    resetView: () => {
      translateX.value = initialX
      translateY.value = initialY
      scale.value = initialScale
    },
  }))

  return (
    <GestureDetector gesture={touch}>
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
})
