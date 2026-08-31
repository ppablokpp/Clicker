import { StyleSheet } from 'react-native'
import Svg, { Defs, Pattern, Rect } from 'react-native-svg'

// The Tasks board's graph-paper backdrop — mirrors front/src/pages/Home.tsx's
// showTasks panel background (two overlaid `repeating-linear-gradient`s, one
// per axis, a 1px line every 22px) as two separately-tiled SVG patterns
// (one rotated 90° via `patternTransform`) instead of trying to pack both
// axes into a single pattern tile — same reasoning as ScanlineTexture: a
// pattern tiles to fill any container size exactly, instead of guessing how
// many lines to stack, and keeping the two axes as separate, independently
// proven patterns is more robust than one compound tile.
export function GraphPaperTexture({ opacity = 0.05 }: { opacity?: number }) {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <Pattern id="graphPaperH" patternUnits="userSpaceOnUse" width={22} height={22}>
          <Rect x={0} y={0} width={22} height={1} fill="#fff" />
        </Pattern>
        <Pattern id="graphPaperV" patternUnits="userSpaceOnUse" width={22} height={22} patternTransform="rotate(90)">
          <Rect x={0} y={0} width={22} height={1} fill="#fff" />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#graphPaperH)" opacity={opacity} />
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#graphPaperV)" opacity={opacity} />
    </Svg>
  )
}
