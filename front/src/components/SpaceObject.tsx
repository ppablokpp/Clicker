// The thing you're actually clicking — a slowly bobbing rock with its goal
// ring, coloured for whichever Trayectoria stop you're on.
//
// It lived inside Home.tsx until the loading screen needed the identical
// object: same size, same bob, same glow, same ring, so the cover lifting
// onto Home is the rock staying exactly where it was rather than one drawing
// being swapped for another. One component, two callers.

import { motion } from 'framer-motion'
import { Asteroid } from './Asteroid'
import { SaturnRing } from './SaturnRing'
import { MATERIAL_TIER_COLORS } from '../lib/materialTiers'

export function SpaceObject({
  tierIndex,
  pct,
  isMaxed,
  paused,
  ringMode = 'progress',
  idPrefix = 'home',
}: {
  tierIndex: number
  pct: number
  isMaxed: boolean
  paused: boolean
  /** Passed through to the ring: 'progress' fills it to `pct`, 'orbit' sends
   *  a lit arc round it instead (the loading screen). */
  ringMode?: 'progress' | 'orbit'
  /** Keeps SVG ids apart when two of these are mounted at once — the loader
   *  covers Home while Home is already mounting behind it. */
  idPrefix?: string
}) {
  const tier = MATERIAL_TIER_COLORS[tierIndex]
  return (
    <div className="pointer-events-none relative flex h-24 w-24 items-center justify-center sm:h-32 sm:w-32">
      {/* A radial-gradient glow instead of a blurred solid circle — some
          mobile Chromium builds flash the pre-filter unblurred shape (a
          hard-edged square, since `blur-lg` blurs the element's own box)
          before the `filter: blur()` layer finishes compositing. A gradient
          fades out on its own with no filter involved, so there's nothing
          to flash. */}
      <div
        className="absolute -inset-6 rounded-full transition-opacity duration-200"
        style={{
          background: `radial-gradient(circle, ${tier.glow} 0%, transparent 70%)`,
          opacity: 0.22 + pct * 0.5,
        }}
      />
      {/* The silhouette no longer rotates, and that's the whole change.
          Spinning an irregular outline is what a flat disc does; a sphere
          holds its outline still and lets the surface travel across it. So the
          rock keeps only its bob, and the craters scroll underneath (see
          .rock-surface in index.css). */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
      >
        {/* No `filter: drop-shadow()` here on purpose — same mobile
            Chromium flash-to-square bug as the old blurred glow div above,
            just triggered by this SVG's own filter instead. The ambient
            radial-gradient glow behind the rock already sells the "aura"
            without needing a second, shape-hugging filtered glow on top. */}
        {/* The goal ring is part of the rock — a planetary ring, one half
            drawn behind it and one in front, so it bobs with it and the rock
            occludes it. See SaturnRing for the drawing. */}
        <div className="relative">
          {/* The rock is `relative` for paint order alone: positioned boxes
              paint after in-flow ones whatever the tree order says, so a
              static rock would end up under BOTH halves and the back of the
              ring would show through it. */}
          <SaturnRing
            half="back"
            pct={pct}
            isMaxed={isMaxed}
            colors={tier}
            paused={paused}
            mode={ringMode}
            idPrefix={`${idPrefix}Ring`}
          />
          <Asteroid idPrefix={`${idPrefix}Rock`} size={76} colors={tier} paused={paused} className="relative" />
          <SaturnRing
            half="front"
            pct={pct}
            isMaxed={isMaxed}
            colors={tier}
            paused={paused}
            mode={ringMode}
            idPrefix={`${idPrefix}Ring`}
          />
        </div>
      </motion.div>
    </div>
  )
}
