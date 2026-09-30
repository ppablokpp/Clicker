// App Store listing screenshots, rendered from the game itself:
//   node store/shoot-ios.mjs
// Needs the Vite dev server on :5173 (npm run dev in front/) and the back
// on :3001. Writes store/out-ios/<locale>/<size>/shot-N-<name>.png, and the
// bare captures to store/raw-ios/<locale>/.
//
// Two sizes because App Store Connect keeps a slot per device class and
// rejects anything that is not the exact pixel size: 6.9" is 1320×2868 and
// 6.5" is 1242×2688. Two locales because the listing is published in
// Spanish and English, and a screenshot has to be in the language of the
// listing it sits under — so the game itself is switched over before the
// capture, not just the line beside the phone.
//
// The store slide is taken with `?ads=1`, which is a dev-only switch that
// draws the rewarded-ad card the browser cannot otherwise show (see
// front/src/lib/ads.ts): on a phone that card is there, so the listing
// should show it.
//
// Every name that comes from the database is swapped for a placeholder
// before the capture.
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(HERE, 'out-ios')
const RAW = path.join(HERE, 'raw-ios')

const FRONT = 'http://localhost:5173'
const API = 'http://localhost:3001'
const GUEST = 'anon_11111111-2222-3333-4444-555555555555'
const PLACEHOLDERS = ['nova_7', 'astro_lu', 'kepler', 'orbita', 'mina_9', 'stardust', 'pilot_x', 'quasar', 'rocket_kid', 'luna', 'vega', 'cometa', 'sol_3', 'draco', 'eris', 'titan', 'lyra', 'io', 'ceres', 'atlas']

// One slide per screen: where it lives, what colour it is lit in, and the
// line beside the phone in each language.
const SLIDES = [
  {
    name: 'home',
    route: '/',
    accent: '#a78bfa',
    glow: 'rgba(167,139,250,.38)',
    tilt: '-3deg',
    es: { kicker: 'Minería espacial', title: 'ClankUp' },
    en: { kicker: 'Space mining', title: 'ClankUp' },
  },
  {
    name: 'tree',
    route: '/arbol',
    accent: '#67e8f9',
    glow: 'rgba(103,232,249,.30)',
    tilt: '3deg',
    es: { kicker: 'Mejoras', title: 'Mejora la nave y deja de picar' },
    en: { kicker: 'Upgrades', title: 'Upgrade the ship, stop digging' },
  },
  {
    name: 'ranking',
    route: '/clasificacion',
    accent: '#fbbf24',
    glow: 'rgba(251,191,36,.30)',
    tilt: '-3deg',
    es: { kicker: 'Clasificación', title: 'Compite con el mundo entero' },
    en: { kicker: 'Leaderboard', title: 'Compete with the whole world' },
  },
  {
    name: 'store',
    route: '/tienda?ads=1',
    accent: '#f0abfc',
    glow: 'rgba(240,171,252,.30)',
    tilt: '3deg',
    es: { kicker: 'Cofres', title: 'Abre cofres, gana premios' },
    en: { kicker: 'Chests', title: 'Open chests, win prizes' },
  },
  {
    name: 'locker',
    route: '/personalizar',
    accent: '#6ee7b7',
    glow: 'rgba(110,231,183,.30)',
    tilt: '-3deg',
    es: { kicker: 'Vestuario', title: 'Viste a tu astronauta' },
    en: { kicker: 'Locker', title: 'Dress your astronaut' },
  },
  {
    name: 'diary',
    route: '/',
    diary: true,
    accent: '#e5cf8a',
    glow: 'rgba(229,207,138,.30)',
    tilt: '3deg',
    es: { kicker: 'Diario', title: 'Ocho minerales por descubrir' },
    en: { kicker: 'Diary', title: 'Eight minerals to discover' },
  },
  {
    name: 'fleet',
    route: '/',
    keepModal: true,
    accent: '#a78bfa',
    glow: 'rgba(167,139,250,.38)',
    tilt: '-3deg',
    es: { kicker: 'Flota', title: 'Tu flota extrae mientras duermes' },
    en: { kicker: 'Fleet', title: 'Your fleet mines while you sleep' },
  },
]

const LOCALES = [
  { id: 'es', foot: 'ClankUp · minería espacial' },
  { id: 'en', foot: 'ClankUp · space mining' },
]

// What the app is captured on. The iPad slot has to show the app as an
// iPad runs it, not a phone shot inside a tablet-shaped frame, so it gets
// its own pass at an iPad's own viewport. The insets are each device's:
// an iPhone's notch and home indicator, an iPad's thinner pair.
const DEVICES = [
  { id: 'phone', vw: 393, vh: 852, dsf: 3, top: 59, bottom: 34 },
  { id: 'pad', vw: 1032, vh: 1376, dsf: 2, top: 24, bottom: 20 },
]

const SIZES = [
  { dir: '6.9', w: 660, h: 1434, device: 'phone' }, // 1320×2868 — iPhone 16 Pro Max and friends
  { dir: '6.5', w: 621, h: 1344, device: 'phone' }, // 1242×2688 — iPhone 11 Pro Max and friends
  { dir: '13', w: 1032, h: 1376, device: 'pad', pad: true }, // 2064×2752 — 13" iPad
]

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9398
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run', '--user-data-dir=' + process.env.TEMP + '/clankup-store-ios', 'about:blank'], { stdio: 'ignore' })
const json = async (p) => (await fetch(`http://127.0.0.1:${PORT}${p}`)).json()
let ws
for (let i = 0; i < 80; i++) { try { ws = (await json('/json/version')).webSocketDebuggerUrl; break } catch { await sleep(250) } }
const sock = new WebSocket(ws)
let id = 0; const pending = new Map()
const send = (m, p = {}, s) => new Promise((r) => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method: m, params: p, sessionId: s })) })
await new Promise((r) => (sock.onopen = r))
sock.onmessage = (e) => { const msg = JSON.parse(e.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id) } }
const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
await send('Runtime.enable', {}, sessionId); await send('Page.enable', {}, sessionId)
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }, sessionId)).result?.value
const shot = async (file, clip) => {
  const r = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip } : {}) }, sessionId)
  writeFileSync(file, Buffer.from(r.data, 'base64'))
}
const fileUrl = (p) => 'file:///' + p.replace(/\\/g, '/')

// the names in the database, longest first so one never eats another
const real = (await (await fetch(`${API}/api/leaderboard?sortBy=clicks`)).json())
  .map((e) => e.username)
  .filter(Boolean)
  .sort((a, b) => b.length - a.length)
const swapNames = `(() => {
  const real = ${JSON.stringify(real)}
  const fake = ${JSON.stringify(PLACEHOLDERS)}
  const map = new Map(real.map((n, i) => [n, fake[i % fake.length]]))
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let node
  while ((node = walker.nextNode())) {
    let t = node.nodeValue
    for (const [from, to] of map) if (t.includes(from)) t = t.split(from).join(to)
    if (t !== node.nodeValue) node.nodeValue = t
  }
})()`

// The diary is opened by its own button, whose label is translated; the
// aria-label is what the app puts on it, so it is matched per locale.
const DIARY_LABEL = { es: 'Diario', en: 'Diary' }

for (const locale of LOCALES) {
  const rawDir = path.join(RAW, locale.id)
  rmSync(rawDir, { recursive: true, force: true })
  mkdirSync(rawDir, { recursive: true })

  for (const device of DEVICES) {
  mkdirSync(path.join(rawDir, device.id), { recursive: true })
  await send('Emulation.setDeviceMetricsOverride', { width: device.vw, height: device.vh, deviceScaleFactor: device.dsf, mobile: true }, sessionId)
  await send('Page.navigate', { url: FRONT + '/' }, sessionId); await sleep(3000)
  await ev(`localStorage.setItem('clankup_anon_id', '${GUEST}'); localStorage.setItem('clicker:language', '${locale.id}')`)

  // The capture is framed as a phone, so it is taken as one: the app's own
  // native class plus an iPhone's insets, which is what keeps the header
  // clear of the island drawn over it and lifts the tab bar off the
  // bottom edge. Without them the page runs edge to edge and the tab bar
  // ends up under the frame's rounded corner, looking clipped.
  const asPhone = `(() => {
    const r = document.documentElement
    r.classList.add('native')
    r.style.setProperty('--safe-area-inset-top', '${device.top}px')
    r.style.setProperty('--safe-area-inset-bottom', '${device.bottom}px')
  })()`

  for (const s of SLIDES) {
    await send('Page.navigate', { url: FRONT + s.route }, sessionId); await sleep(9000)
    if (!s.keepModal) {
      // The fleet report is real and arrives with its own fetch, after the
      // page. Dismissed a few times over a few seconds rather than once,
      // or it lands on top of the shot with the game blurred out behind
      // it. The fleet slide is the one where it belongs.
      for (let k = 0; k < 4; k++) {
        await ev(`[...document.querySelectorAll('button')].find(b => /^(aceptar|accept|ok)$/i.test((b.textContent || '').trim()))?.click()`)
        await sleep(1200)
      }
    }
    if (s.diary) {
      const label = DIARY_LABEL[locale.id]
      await ev(`[...document.querySelectorAll('button[aria-label]')].find(b => b.getAttribute('aria-label') === '${label}')?.click()`); await sleep(1200)
      await ev(`document.querySelector('button[aria-label="route"]')?.click()`); await sleep(1500)
    }
    await ev(asPhone)
    await ev(swapNames); await sleep(300)
    await shot(path.join(rawDir, device.id, `${s.name}.png`))
  }
  }

  // the slides: each capture inside the phone, on the sky, with its line
  for (const size of SIZES) {
    const dir = path.join(OUT, locale.id, size.dir)
    mkdirSync(dir, { recursive: true })
    await send('Emulation.setDeviceMetricsOverride', { width: size.w, height: size.h, deviceScaleFactor: 2, mobile: false }, sessionId)
    for (const [i, s] of SLIDES.entries()) {
      if (!existsSync(path.join(rawDir, size.device, `${s.name}.png`))) continue
      const q = new URLSearchParams({
        shot: `raw-ios/${locale.id}/${size.device}/${s.name}.png`,
        kicker: s[locale.id].kicker,
        title: s[locale.id].title,
        accent: s.accent,
        glow: s.glow,
        tilt: s.tilt,
        foot: locale.foot,
        ...(size.pad ? { pad: '1' } : {}),
        w: String(size.w),
        h: String(size.h),
      })
      await send('Page.navigate', { url: fileUrl(path.join(HERE, 'frame-ios.html')) + '?' + q }, sessionId)
      await sleep(2200)
      await shot(path.join(dir, `shot-${i + 1}-${s.name}.png`), { x: 0, y: 0, width: size.w, height: size.h, scale: 1 })
    }
  }
}

chrome.kill(); process.exit(0)
