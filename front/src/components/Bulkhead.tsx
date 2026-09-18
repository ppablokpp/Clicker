import type { MaterialTierColors } from '../lib/materialTiers'

/**
 * The back wall the Refinería settled on: a pool of light at the top in
 * whatever is being mined, over a faint plate grid.
 *
 * Two layers, because they belong to different things. The grid is the
 * wall itself, fixed, so it stays put under whatever scrolls over it. The
 * light is a lamp over the top of the page: absolute, so it scrolls away
 * with the page's head the way a lamp on a wall would — a light that
 * followed the viewport down would read as a spotlight following you.
 * (A screen that is itself fixed, like the tree's canvas, has no scroll
 * and gets both absolute.)
 *
 * Two things the screen that uses it has to do. Put a `bulkhead` class on
 * its content: index.css turns every faint card tint under that class
 * opaque, so the grid shows only between the cards. And make that content
 * positioned (`relative`): these layers are positioned, and a positioned
 * element paints over any in-flow sibling whatever the DOM order — content
 * that isn't positioned would have the grid drawn on top of it.
 */
export function Bulkhead({ tier, fixed = true }: { tier: MaterialTierColors; fixed?: boolean }) {
  return (
    <>
      <span
        className={`pointer-events-none ${fixed ? 'fixed' : 'absolute'} inset-0`}
        style={{
          background: `repeating-linear-gradient(90deg, rgba(255,255,255,.02) 0 1px, transparent 1px 68px), repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 68px)`,
        }}
      />
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-[42vh]"
        style={{ background: `radial-gradient(60% 70% at 50% -10%, ${tier.fill}2b, transparent 70%)` }}
      />
    </>
  )
}
