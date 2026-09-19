import { SpaceObject } from './SpaceObject'

/**
 * A screen's own loading mark: the loading screen's rock, small, turning
 * its ring in the middle of the viewport while a page waits for its data
 * (the profile for who you are and what you wear, the ranking for its
 * rows). Fixed and centred, under the page's top chrome, so whatever
 * stays put around it — pills, gears — stays put.
 */
export function MiniLoader({ idPrefix }: { idPrefix: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center" aria-busy="true">
      <div style={{ transform: 'scale(0.7)' }}>
        <SpaceObject tierIndex={0} pct={0} isMaxed={false} paused={false} ringMode="orbit" idPrefix={idPrefix} />
      </div>
    </div>
  )
}
