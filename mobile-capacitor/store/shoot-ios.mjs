// App Store listing screenshots, rendered from the game itself:
//   node store/shoot-ios.mjs
// Needs the Vite dev server on :5173 (npm run dev in front/) and the back
// on :3001. Writes store/out-ios/shot-N-<name>.png at 1320×2868, the 6.9"
// size App Store Connect asks for (deviceScaleFactor 2 over a 660×1434
// page, captured at clip scale 1 — Apple rejects anything that is not that
// size to the pixel), and the bare captures to store/raw-ios/.
//
// The sibling of shoot.mjs (Play, 1080×1920). Two differences beyond the
// size: the captures are taken at an iPhone's own 393×852 so nothing is
// cropped inside the phone frame, and the profile and fleet slides are
// reused from store/raw/ rather than re-captured — both relied on dev-only
// mocks (`?mock`, `?mockaway`) that no longer exist in the app.
//
// Every name that comes from the database is swapped for a placeholder
// before the capture.
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync, copyFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(HERE, 'out-ios')
const RAW = path.join(HERE, 'raw-ios')
const OLD_RAW = path.join(HERE, 'raw')
mkdirSync(OUT, { recursive: true })
mkdirSync(RAW, { recursive: true })

const FRONT = 'http://localhost:5173'
const API = 'http://localhost:3001'
const GUEST = 'anon_11111111-2222-3333-4444-555555555555'
const PLACEHOLDERS = ['nova_7', 'astro_lu', 'kepler', 'orbita', 'mina_9', 'stardust', 'pilot_x', 'quasar', 'rocket_kid', 'luna', 'vega', 'cometa', 'sol_3', 'draco', 'eris', 'titan', 'lyra', 'io', 'ceres', 'atlas']

// the slides: route, file, and the words beside the phone. `reuse` marks
// the two whose capture comes from the Play run.
const SLIDES = [
  { route: '/', name: 'home', kicker: 'Minería espacial', title: 'ClankUp', accent: '#a78bfa', glow: 'rgba(167,139,250,.38)', tilt: '-3deg' },
  { route: '/arbol', name: 'tree', kicker: 'Mejoras', title: 'Mejora tu nave', accent: '#67e8f9', glow: 'rgba(103,232,249,.30)', tilt: '3deg' },
  { route: '/clasificacion', name: 'ranking', kicker: 'Clasificación', title: 'Compite con otros jugadores', accent: '#fbbf24', glow: 'rgba(251,191,36,.30)', tilt: '-3deg' },
  { route: '/tienda', name: 'store', kicker: 'Tienda', title: 'Abre cofres y gana premios', accent: '#f0abfc', glow: 'rgba(240,171,252,.30)', tilt: '3deg' },
  { name: 'profile', reuse: true, kicker: 'Perfil', title: 'Personaliza tu astronauta', accent: '#6ee7b7', glow: 'rgba(110,231,183,.30)', tilt: '-3deg' },
  { route: '/', name: 'diary', kicker: 'Diario', title: 'Sigue tu viaje por los asteroides', accent: '#e5cf8a', glow: 'rgba(229,207,138,.30)', tilt: '3deg', diary: true },
  { name: 'fleet', reuse: true, kicker: 'Flota', title: 'Tu flota trabaja mientras descansas', accent: '#a78bfa', glow: 'rgba(167,139,250,.38)', tilt: '-3deg' },
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

// the bare captures, at an iPhone 15 Pro's 393×852 css at 3x
await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 3, mobile: true }, sessionId)
await send('Page.navigate', { url: FRONT + '/' }, sessionId); await sleep(3000)
await ev(`localStorage.setItem('clankup_anon_id', '${GUEST}')`)
for (const s of SLIDES) {
  // Re-rendering the frames is cheap; re-capturing the game is not, so a
  // capture already on disk is kept. Delete store/raw-ios to refresh them.
  const target = path.join(RAW, `${s.name}.png`)
  if (existsSync(target)) continue
  if (s.reuse) {
    copyFileSync(path.join(OLD_RAW, `${s.name}.png`), target)
    continue
  }
  await send('Page.navigate', { url: FRONT + s.route }, sessionId); await sleep(9000)
  // The fleet report is real now (the `?mockaway` mock is gone), so it
  // turns up whenever the guest has been away — and it arrives with its own
  // fetch, not with the page. Dismissed a few times over a few seconds
  // rather than once, or it lands on top of the shot with the game blurred
  // out behind it. Slide 7 is where that modal is supposed to be.
  for (let k = 0; k < 4; k++) {
    await ev(`[...document.querySelectorAll('button')].find(b => /aceptar/i.test(b.textContent))?.click()`)
    await sleep(1200)
  }
  if (s.diary) {
    await ev(`[...document.querySelectorAll('button[aria-label]')].find(b => b.getAttribute('aria-label') === 'Diario')?.click()`); await sleep(1200)
    await ev(`document.querySelector('button[aria-label="route"]')?.click()`); await sleep(1500)
  }
  await ev(swapNames); await sleep(300)
  await shot(target)
}

// The slides: each capture inside the phone, on the sky, with its line.
// One folder per device class, because App Store Connect keeps a separate
// slot for each and rejects anything that is not the exact pixel size.
const SIZES = [
  { dir: '6.9', w: 660, h: 1434 }, // 1320×2868 — iPhone 16 Pro Max and friends
  { dir: '6.5', w: 621, h: 1344 }, // 1242×2688 — iPhone 11 Pro Max and friends
]
for (const size of SIZES) {
  const dir = path.join(OUT, size.dir)
  mkdirSync(dir, { recursive: true })
  await send('Emulation.setDeviceMetricsOverride', { width: size.w, height: size.h, deviceScaleFactor: 2, mobile: false }, sessionId)
  for (const [i, s] of SLIDES.entries()) {
    if (!existsSync(path.join(RAW, `${s.name}.png`))) continue
    const q = new URLSearchParams({
      shot: `raw-ios/${s.name}.png`,
      kicker: s.kicker,
      title: s.title,
      accent: s.accent,
      glow: s.glow,
      tilt: s.tilt,
      n: String(i + 1).padStart(2, '0'),
      w: String(size.w),
      h: String(size.h),
    })
    await send('Page.navigate', { url: fileUrl(path.join(HERE, 'frame-ios.html')) + '?' + q }, sessionId)
    await sleep(2200)
    await shot(path.join(dir, `shot-${i + 1}-${s.name}.png`), { x: 0, y: 0, width: size.w, height: size.h, scale: 1 })
  }
}

chrome.kill(); process.exit(0)
