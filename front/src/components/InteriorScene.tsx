import type { CSSProperties, ReactNode } from 'react'

/**
 * The frame the ship's rooms are drawn in: a portrait canvas of
 * SCENE_W × SCENE_H units, scaled to cover the viewport the way
 * `background-size: cover` would — never letterboxed, cropped at the
 * sides on a wide screen, at the top and bottom on a squat one, centred
 * either way. Fixed, behind the screen's content.
 *
 * The room itself is one still SVG filling the frame, drawn dim: it is the
 * place, not the point — the core in the middle of the screen is the only
 * thing that shines. Anything that moves (a lamp, ore in a pipe, heat off
 * a crucible) is a span placed in the same units through `at()`, so it
 * lands on the drawing exactly and animates on the compositor without the
 * SVG being repainted — the rule every building outside follows too.
 */
export const SCENE_W = 400
export const SCENE_H = 860
/** How much of the room shows: it stays back. */
export const ROOM_OPACITY = 0.55

/** A point in scene units as a percentage position inside the frame. */
export const at = (x: number, y: number): CSSProperties => ({
  left: `${(x / SCENE_W) * 100}%`,
  top: `${(y / SCENE_H) * 100}%`,
})

export const HULL = { lit: '#5a5f6d', mid: '#2b2e38', shade: '#15171e', edge: '#7d8290', deep: '#0c0d12' }
export const SAND = '#e5cf8a'

export function InteriorScene({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
      style={{
        // cover: as wide as the viewport, or as wide as the height needs
        width: `max(100vw, calc(100dvh * ${SCENE_W} / ${SCENE_H}))`,
        height: `max(100dvh, calc(100vw * ${SCENE_H} / ${SCENE_W}))`,
      }}
    >
      {children}
    </div>
  )
}

/** The wall every room shares: the plates' seams, faint. */
export function RoomWall({ deckY }: { deckY: number }) {
  return (
    <>
      <rect width={SCENE_W} height={SCENE_H} fill="url(#roomWall)" />
      <g stroke="#ffffff" strokeOpacity={0.035} strokeWidth={1}>
        {[80, 160, 240, 320].map((x) => (
          <line key={x} x1={x} y1={0} x2={x} y2={deckY} />
        ))}
        {[150, 230, 310, 390, 470, 550].map((y) => (
          <line key={y} x1={0} y1={y} x2={SCENE_W} y2={y} />
        ))}
      </g>
    </>
  )
}

/** The deck every room shares: a horizon, and the grating running away. */
export function RoomDeck({ deckY }: { deckY: number }) {
  return (
    <>
      <rect x={0} y={deckY} width={SCENE_W} height={SCENE_H - deckY} fill="url(#roomDeck)" />
      <rect x={0} y={deckY - 3} width={SCENE_W} height={6} fill={HULL.mid} />
      <line x1={0} y1={deckY - 3} x2={SCENE_W} y2={deckY - 3} stroke={HULL.edge} strokeOpacity={0.6} strokeWidth={1} />
      <g stroke="#ffffff" strokeOpacity={0.05} strokeWidth={1}>
        {[-3, -2, -1, 0, 1, 2, 3].map((k) => (
          <line key={k} x1={SCENE_W / 2 + k * 42} y1={deckY} x2={SCENE_W / 2 + k * 150} y2={SCENE_H} />
        ))}
        {[deckY + 24, deckY + 60, deckY + 110, deckY + 175, deckY + 248].map((y) => (
          <line key={y} x1={0} y1={y} x2={SCENE_W} y2={y} />
        ))}
      </g>
    </>
  )
}

/** The gradients the wall and deck use — put once in each room's defs. */
export function RoomDefs() {
  return (
    <>
      <linearGradient id="roomWall" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#101118" />
        <stop offset="0.5" stopColor="#0b0b10" />
        <stop offset="1" stopColor="#08080c" />
      </linearGradient>
      <linearGradient id="roomDeck" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#0d0d13" />
        <stop offset="1" stopColor="#07070a" />
      </linearGradient>
      <linearGradient id="roomPipeV" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor={HULL.shade} />
        <stop offset="0.3" stopColor={HULL.lit} />
        <stop offset="0.6" stopColor={HULL.mid} />
        <stop offset="1" stopColor={HULL.shade} />
      </linearGradient>
      <linearGradient id="roomPipeH" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={HULL.shade} />
        <stop offset="0.3" stopColor={HULL.lit} />
        <stop offset="0.6" stopColor={HULL.mid} />
        <stop offset="1" stopColor={HULL.shade} />
      </linearGradient>
      <linearGradient id="roomPlate" x1="0" x2="0.4" y1="0" y2="1">
        <stop offset="0" stopColor={HULL.lit} />
        <stop offset="0.35" stopColor={HULL.mid} />
        <stop offset="1" stopColor={HULL.shade} />
      </linearGradient>
      <linearGradient id="roomGlass" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
        <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.03" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.1" />
      </linearGradient>
    </>
  )
}
