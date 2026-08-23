// A small quadcopter silhouette (four arms + rotor hubs + a body + a
// blinking light), shared between Home's orbiting swarm, the tree's Drones
// node, and Home's own "Auto" pill. `currentColor` throughout so the
// wrapper's text color tints the whole drone. `animated` gates the
// rotor-blur flicker (.animate-rotor-blur, index.css) — reserved for the
// real orbiting drones on Home that actually fire; every other use is a
// static UI icon (tree node, modal, pill) and should hold still.
export function DroneIcon({ size = 22, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <g stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" opacity={0.85}>
        <line x1="16" y1="16" x2="6" y2="6" />
        <line x1="16" y1="16" x2="26" y2="6" />
        <line x1="16" y1="16" x2="6" y2="26" />
        <line x1="16" y1="16" x2="26" y2="26" />
      </g>
      <g className={animated ? 'animate-rotor-blur' : undefined} fill="currentColor" opacity={animated ? undefined : 0.15}>
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
