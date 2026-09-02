// A small quadcopter silhouette (four arms + rotor hubs + a body + a
// blinking light), shared between Home's orbiting swarm, the tree's Drones
// node, and Home's own "Auto" pill. `currentColor` throughout so the
// wrapper's text color tints the whole drone.
//
// Used to take an `animated` prop gating a fast (0.16s) opacity flicker on
// the rotor-blur circles, reserved for the orbiting swarm. Removed: that
// swarm sits inside a `filter: drop-shadow` wrapper (the glow), and even
// though the wrapper itself is static, the browser still has to re-trace
// the whole filtered subtree's alpha silhouette every time anything inside
// it changes — so this one drone's-worth flicker was forcing a full
// drop-shadow recompute ~6 times a second, *per drone*, uncapped. Fine at
// 1-2 drones, but 15-20 of them turned into 100+ forced re-rasters/second,
// which is exactly the kind of thing that cooks a phone. The swarm still
// has plenty of life from the orbit spin + pulse scale alone.
export function DroneIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <g stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" opacity={0.85}>
        <line x1="16" y1="16" x2="6" y2="6" />
        <line x1="16" y1="16" x2="26" y2="6" />
        <line x1="16" y1="16" x2="6" y2="26" />
        <line x1="16" y1="16" x2="26" y2="26" />
      </g>
      <g fill="currentColor" opacity={0.15}>
        <circle cx="6" cy="6" r="4.5" />
        <circle cx="26" cy="6" r="4.5" />
        <circle cx="6" cy="26" r="4.5" />
        <circle cx="26" cy="26" r="4.5" />
      </g>
      <g fill="currentColor">
        <circle cx="6" cy="6" r="1.3" />
        <circle cx="26" cy="6" r="1.3" />
        <circle cx="6" cy="26" r="1.3" />
        <circle cx="26" cy="26" r="1.3" />
      </g>
      <rect x="11" y="11" width="10" height="10" rx="2.5" fill="currentColor" />
      <circle cx="16" cy="16" r="1.6" fill="#fff" />
    </svg>
  )
}
