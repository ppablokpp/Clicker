import Svg, { Line } from 'react-native-svg'

// A horizontal dashed rule — RN's own `borderStyle: 'dashed'` renders as a
// dense row of tiny, tightly-packed dashes on both iOS and Android (a
// known, long-standing RN limitation, nothing like a browser's own
// `border-dashed`). An SVG line with a real `strokeDasharray` doesn't have
// that problem and gives full control over the dash/gap length.
export function DashedLine({ color = 'rgba(255,255,255,0.15)' }: { color?: string }) {
  // `flex: 1` alone sizes this within a row of siblings (the "RECOMPENSAS"
  // label between two of these) — an explicit `width="100%"` prop here
  // fought that sizing (each line trying to claim the *whole* row's width
  // instead of its own flexed share), which was squeezing the label down
  // to nothing.
  return (
    <Svg height={1} viewBox="0 0 100 1" preserveAspectRatio="none" style={{ flex: 1 }}>
      <Line x1={0} y1={0.5} x2={100} y2={0.5} stroke={color} strokeWidth={1} vectorEffect="non-scaling-stroke" strokeDasharray="5,4" />
    </Svg>
  )
}
