// Draws the two splash pictures from assets/icon-only.png:
//
//  - android/app/src/main/res/drawable-nodpi/splash_icon.png — what the
//    Android 12+ system splash shows. That splash is a flat colour with a
//    circle-masked icon in the middle, nothing more, so the picture is the
//    planet on that same flat colour, its stars faded out before the mask
//    edge: the circle has nothing to cut and can't be seen.
//  - assets/splash.png (+ splash-dark.png) — the full-bleed picture the
//    Capacitor splash plugin shows right after, until the web view paints:
//    the same planet at the same size, now with the whole sky behind it.
//    `npm run assets` turns it into the per-density drawables.
//
// Run: node scripts/splash.mjs
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const BG = { r: 18, g: 13, b: 34 } // the icon's own sky at its edge (#120d22)
const BG_HEX = '#120d22'

// The system splash draws the icon at 288dp, masked to a 192dp circle
// (2/3). The planet has to sit inside that circle with room to spare.
const ICON_CANVAS = 1152 // 288dp @ 4x
const ICON_PLANET = 690 // the artwork's box; its rings span ~84% of it
const FADE_IN = 150 // stars and glow fully there inside this radius…
const FADE_OUT = 370 // …and gone by here (the mask is at 384)

// Full-bleed: 2732 square, centre-cropped on the device. The planet box is
// sized so its on-screen width is about the system splash's.
const SPLASH = 2732
const SPLASH_PLANET = 720

function radialFade(size, inner, outer) {
  // an alpha mask: 255 inside `inner`, 0 past `outer`, smooth between
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <defs><radialGradient id="g" cx="50%" cy="50%" r="50%">
      <stop offset="${(inner / (size / 2)) * 100}%" stop-color="#fff" stop-opacity="1"/>
      <stop offset="${(outer / (size / 2)) * 100}%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient></defs>
    <rect width="${size}" height="${size}" fill="url(#g)"/></svg>`
  return sharp(Buffer.from(svg)).ensureAlpha().extractChannel('alpha').toBuffer()
}

async function planet(box, canvas, fadeIn, fadeOut) {
  // the artwork scaled into `box`, on a `canvas` square, stars fading to
  // nothing between the two radii
  const art = await sharp('assets/icon-only.png').resize(box, box).ensureAlpha().toBuffer()
  const pad = Math.round((canvas - box) / 2)
  // on the sky colour, flattened, and only then given the fade as its
  // alpha (joinChannel adds a channel; it does not replace one)
  const onCanvas = await sharp({ create: { width: canvas, height: canvas, channels: 4, background: { ...BG, alpha: 1 } } })
    .composite([{ input: art, left: pad, top: pad }])
    .removeAlpha()
    .png()
    .toBuffer()
  const mask = await radialFade(canvas, fadeIn, fadeOut)
  return sharp(onCanvas).joinChannel(mask).png().toBuffer()
}

function stars(size, count, seed) {
  // a fixed sky: same stars every run, so the two pictures agree
  let s = seed
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32)
  let out = ''
  for (let i = 0; i < count; i++) {
    const x = (rnd() * size).toFixed(1)
    const y = (rnd() * size).toFixed(1)
    const r = (0.8 + rnd() * 2.6).toFixed(2)
    const o = (0.25 + rnd() * 0.7).toFixed(2)
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity="${o}"/>`
    if (i % 23 === 0) {
      // the odd four-point twinkle, like the icon's
      const l = 8 + rnd() * 10
      out += `<path d="M${x} ${y - l}v${2 * l}M${x - l} ${y}h${2 * l}" stroke="#fff" stroke-opacity="${o}" stroke-width="2"/>`
    }
  }
  return out
}

async function main() {
  mkdirSync('android/app/src/main/res/drawable-nodpi', { recursive: true })

  // 1. the system splash's icon
  const icon = await planet(ICON_PLANET, ICON_CANVAS, FADE_IN, FADE_OUT)
  await sharp({ create: { width: ICON_CANVAS, height: ICON_CANVAS, channels: 4, background: { ...BG, alpha: 1 } } })
    .composite([{ input: icon }])
    .png()
    .toFile('android/app/src/main/res/drawable-nodpi/splash_icon.png')

  // 2. the full-bleed splash: sky, faint glow, the planet
  const sky = `<svg xmlns="http://www.w3.org/2000/svg" width="${SPLASH}" height="${SPLASH}">
    <defs><radialGradient id="glow" cx="50%" cy="50%" r="40%">
      <stop offset="0%" stop-color="#2a1d4d" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${BG_HEX}" stop-opacity="0"/>
    </radialGradient></defs>
    <rect width="${SPLASH}" height="${SPLASH}" fill="${BG_HEX}"/>
    ${stars(SPLASH, 900, 7)}
    <rect width="${SPLASH}" height="${SPLASH}" fill="url(#glow)"/>
  </svg>`
  const big = await planet(SPLASH_PLANET, SPLASH, 150, 380)
  const splash = await sharp(Buffer.from(sky)).composite([{ input: big }]).png().toBuffer()
  await sharp(splash).toFile('assets/splash.png')
  await sharp(splash).toFile('assets/splash-dark.png')
  console.log('splash pictures written')
}

main()
