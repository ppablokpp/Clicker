// The store products' icons for Play Console (512×512 PNG), one per pack,
// drawn by the game itself: front/store-icons.html mounts
// front/src/dev/storeIcons.tsx on the Vite dev server (npm run dev in
// front/). Run: node store/icons.mjs → store/out/product-<id>.png
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'out')
mkdirSync(OUT, { recursive: true })
const PACKS = [
  ['gems', 0, 'x1_gem'],
  ['gems', 1, 'x10_gems'],
  ['gems', 2, 'x50_gems'],
  ['gems', 3, 'x100_gems'],
  ['keys', 0, 'x5_keys'],
  ['keys', 1, 'x25_keys'],
  ['keys', 2, 'x50_keys'],
  ['keys', 3, 'x100_keys'],
]

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9399
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run', '--user-data-dir=' + process.env.TEMP + '/clankup-icons', 'about:blank'], { stdio: 'ignore' })
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
await send('Page.enable', {}, sessionId)
await send('Emulation.setDeviceMetricsOverride', { width: 512, height: 512, deviceScaleFactor: 1, mobile: false }, sessionId)
await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } }, sessionId)
for (const [contents, index, pid] of PACKS) {
  await send('Page.navigate', { url: `http://localhost:5173/store-icons.html?contents=${contents}&index=${index}` }, sessionId)
  await sleep(2500)
  const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 512, height: 512, scale: 1 } }, sessionId)
  writeFileSync(path.join(OUT, `product-${pid}.png`), Buffer.from(r.data, 'base64'))
}
chrome.kill(); process.exit(0)
