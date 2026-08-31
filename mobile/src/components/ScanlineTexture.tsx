import { StyleSheet } from 'react-native'
import Svg, { Defs, Pattern, Rect } from 'react-native-svg'

// The cockpit's fine scanline texture — mirrors the web version's
// `repeating-linear-gradient(180deg, #fff 0px, #fff 1px, transparent 1px,
// transparent 3px)` background-image (a 3px cycle: 1px line + 2px gap),
// which tiles infinitely to always fill its container exactly. Manually
// stacking a fixed number of 1px lines (the first version of this) stopped
// after a fixed height and left the rest of a taller container blank ("se
// cortan las líneas") — an SVG `<Pattern>` tiles the same way the CSS
// gradient does, so it always covers the whole surface regardless of how
// tall the container ends up being.
export function ScanlineTexture({ opacity = 0.04 }: { opacity?: number }) {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <Pattern id="scanlines" patternUnits="userSpaceOnUse" width={3} height={3}>
          <Rect x={0} y={0} width={3} height={1} fill="#fff" />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#scanlines)" opacity={opacity} />
    </Svg>
  )
}
