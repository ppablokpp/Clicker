// The airlock buttons' glyphs, drawn like the tab bar's: filled silhouettes,
// no outlines. Exit is an arrow leaving a doorframe; enter is the same
// arrow going into one.

export function ExitGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {/* the frame, open on the right */}
      <path d="M3 3h9v3.2H6.2v11.6H12V21H3z" />
      {/* the arrow, out through the opening */}
      <path d="M9.5 10.3h6.3V6.8L22 12l-6.2 5.2v-3.5H9.5z" />
    </svg>
  )
}

export function EnterGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {/* the frame, open on the left */}
      <path d="M21 3h-9v3.2h5.8v11.6H12V21h9z" />
      {/* the arrow, in through the opening */}
      <path d="M2 10.3h6.3V6.8l6.2 5.2-6.2 5.2v-3.5H2z" />
    </svg>
  )
}
