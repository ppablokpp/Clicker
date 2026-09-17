import { useRef, type PointerEvent } from 'react'

/**
 * A tap, not a drag, for the things on the station's stage. The press goes
 * on up to the stage too, which pans with it if it travels (and takes the
 * pointer over once it does); a press that stayed put comes back here on
 * pointerup and counts as a tap.
 */
export function useTap(onTap: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null)
  return {
    onPointerDown: (e: PointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY }
    },
    onPointerUp: (e: PointerEvent) => {
      const s = start.current
      start.current = null
      if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) < 8) onTap()
    },
  }
}
