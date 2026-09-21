// Play Store listing graphics, rendered from the game itself:
//   node store/shoot.mjs
// Needs the Vite dev server on :5173 (npm run dev in front/) and the back
// on :3001. Writes to store/out/:
//   feature.png       1024×500   feature graphic
//   icon-512.png      512×512    store icon
//   shot-N.png        1080×1920  phone screenshots: the game inside a
//                                phone, a line beside it, the sky behind
// and the bare captures to store/raw/. Every name that comes from the
// database is swapped for a placeholder before the capture. The profile
// and fleet slides relied on dev-only mocks (`?mock`, `?mockaway`) that
// have since been removed from the app; re-add them to Profile.tsx and
// TreeContext.tsx if those two need regenerating.
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(HERE, 'out')
const RAW = path.join(HERE, 'raw')
mkdirSync(OUT, { recursive: true })
mkdirSync(RAW, { recursive: true })
copyFileSync(path.join(HERE, '..', 'assets', 'splash.png'), path.join(HERE, 'splash.png'))
copyFileSync(path.join(HERE, '..', 'assets', 'icon-only.png'), path.join(HERE, 'icon-only.png'))
copyFileSync(path.join(HERE, '..', '..', 'front', 'public', 'icons', 'icon-512.png'), path.join(OUT, 'icon-512.png'))

const FRONT = 'http://localhost:5173'
const API = 'http://localhost:3001'
const GUEST = 'anon_11111111-2222-3333-4444-555555555555'
const PLACEHOLDERS = ['nova_7', 'astro_lu', 'kepler', 'orbita', 'mina_9', 'stardust', 'pilot_x', 'quasar', 'rocket_kid', 'luna', 'vega', 'cometa', 'sol_3', 'draco', 'eris', 'titan', 'lyra', 'io', 'ceres', 'atlas']

// the slides: route, file, and the words beside the phone
const SLIDES = [
  { route: '/', name: 'home', kicker: 'Minería espacial', title: 'ClankUp', accent: '#a78bfa', glow: 'rgba(167,139,250,.38)', tilt: '-3deg' },
  { route: '/arbol', name: 'tree', kicker: 'Mejoras', title: 'Mejora tu nave', accent: '#67e8f9', glow: 'rgba(103,232,249,.30)', tilt: '3deg' },
  { route: '/clasificacion', name: 'ranking', kicker: 'Clasificación', title: 'Compite con otros jugadores', accent: '#fbbf24', glow: 'rgba(251,191,36,.30)', tilt: '-3deg' },
  { route: '/tienda', name: 'store', kicker: 'Tienda', title: 'Abre cofres y gana premios', accent: '#f0abfc', glow: 'rgba(240,171,252,.30)', tilt: '3deg' },
  { route: '/estadisticas?mock', name: 'profile', kicker: 'Perfil', title: 'Personaliza tu astronauta', accent: '#6ee7b7', glow: 'rgba(110,231,183,.30)', tilt: '-3deg' },
  { route: '/', name: 'diary', kicker: 'Diario', title: 'Sigue tu viaje por los asteroides', accent: '#e5cf8a', glow: 'rgba(229,207,138,.30)', tilt: '3deg', diary: true },
  { route: '/?mockaway=184300000', name: 'fleet', kicker: 'Flota', title: 'Tu flota trabaja mientras descansas', accent: '#a78bfa', glow: 'rgba(167,139,250,.38)', tilt: '-3deg', keepModal: true },
]

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9397
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run', '--user-data-dir=' + process.env.TEMP + '/clankup-store', 'about:blank'], { stdio: 'ignore' })
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

// the feature graphic
await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 500, deviceScaleFactor: 1, mobile: false }, sessionId)
await send('Page.navigate', { url: fileUrl(path.join(HERE, 'feature.html')) }, sessionId)
await sleep(2500)
await shot(path.join(OUT, 'feature.png'), { x: 0, y: 0, width: 1024, height: 500, scale: 1 })

// the bare captures: a tall phone, 368×770 css at 3x
await send('Emulation.setDeviceMetricsOverride', { width: 368, height: 770, deviceScaleFactor: 3, mobile: true }, sessionId)
await send('Page.navigate', { url: FRONT + '/' }, sessionId); await sleep(3000)
await ev(`localStorage.setItem('clankup_anon_id', '${GUEST}')`)
for (const s of SLIDES) {
  await send('Page.navigate', { url: FRONT + s.route }, sessionId); await sleep(9000)
  if (!s.keepModal) {
    await ev(`[...document.querySelectorAll('button')].find(b => /aceptar/i.test(b.textContent))?.click()`); await sleep(600)
  }
  if (s.diary) {
    await ev(`[...document.querySelectorAll('button[aria-label]')].find(b => b.getAttribute('aria-label') === 'Diario')?.click()`); await sleep(1200)
    await ev(`document.querySelector('button[aria-label="route"]')?.click()`); await sleep(1500)
  }
  await ev(swapNames); await sleep(300)
  await shot(path.join(RAW, `${s.name}.png`))
}

// the slides: each capture inside the phone, on the sky, with its line
await send('Emulation.setDeviceMetricsOverride', { width: 540, height: 960, deviceScaleFactor: 2, mobile: false }, sessionId)
for (const [i, s] of SLIDES.entries()) {
  const q = new URLSearchParams({
    shot: `raw/${s.name}.png`,
    kicker: s.kicker,
    title: s.title,
    accent: s.accent,
    glow: s.glow,
    tilt: s.tilt,
    n: String(i + 1).padStart(2, '0'),
  })
  await send('Page.navigate', { url: fileUrl(path.join(HERE, 'frame.html')) + '?' + q }, sessionId)
  await sleep(2200)
  await shot(path.join(OUT, `shot-${i + 1}-${s.name}.png`), { x: 0, y: 0, width: 540, height: 960, scale: 2 })
}

chrome.kill(); process.exit(0)
