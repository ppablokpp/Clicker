// Pre-renders the exact same synthesized "laser shot" sound the web
// version plays on every click (front/src/lib/battleSound.ts's
// playLaserShot) as a static WAV file — RN has no Web Audio
// AudioContext/OscillatorNode equivalent to synthesize it live, so this
// computes the identical waveform sample-by-sample offline instead (same
// oscillator types, frequencies, and gain envelopes, just rendered once
// instead of per-tap; the one difference is the web version randomizes its
// starting frequency 1900-2100Hz per shot, fixed here at 2000Hz since a
// static file can't re-roll that per play).
//
// Run with: node scripts/generate-laser-shot.js
const fs = require('fs')
const path = require('path')

const SAMPLE_RATE = 44100
const DURATION = 0.13 // covers both oscillators' full envelope plus a hair of tail

function expRamp(v0, v1, t0, t1, t) {
  if (t <= t0) return v0
  if (t >= t1) return v1
  return v0 * Math.pow(v1 / v0, (t - t0) / (t1 - t0))
}

const sampleCount = Math.ceil(DURATION * SAMPLE_RATE)
const samples = new Float32Array(sampleCount)

let sawPhase = 0
let squarePhase = 0

for (let i = 0; i < sampleCount; i++) {
  const t = i / SAMPLE_RATE

  // Primary oscillator — sawtooth, 2000Hz -> 320Hz over 90ms, silent after 110ms.
  let osc = 0
  if (t < 0.11) {
    const freq = expRamp(2000, 320, 0, 0.09, t)
    sawPhase = (sawPhase + freq / SAMPLE_RATE) % 1
    const sawValue = 2 * sawPhase - 1
    const gain =
      t < 0.006 ? expRamp(0.001, 0.12, 0, 0.006, t) : expRamp(0.12, 0.001, 0.006, 0.1, Math.min(t, 0.1))
    osc = sawValue * gain
  }

  // High harmonic — square, 2800Hz -> 650Hz over 70ms, silent after 90ms.
  let harmonic = 0
  if (t < 0.09) {
    const freq = expRamp(2800, 650, 0, 0.07, t)
    squarePhase = (squarePhase + freq / SAMPLE_RATE) % 1
    const squareValue = squarePhase < 0.5 ? 1 : -1
    const gain =
      t < 0.004 ? expRamp(0.001, 0.045, 0, 0.004, t) : expRamp(0.045, 0.001, 0.004, 0.08, Math.min(t, 0.08))
    harmonic = squareValue * gain
  }

  samples[i] = osc + harmonic
}

// Normalize headroom slightly and convert to 16-bit PCM.
let peak = 0
for (let i = 0; i < sampleCount; i++) peak = Math.max(peak, Math.abs(samples[i]))
const scale = peak > 0 ? Math.min(1, 0.9 / peak) : 1

const pcm = Buffer.alloc(sampleCount * 2)
for (let i = 0; i < sampleCount; i++) {
  const v = Math.max(-1, Math.min(1, samples[i] * scale))
  pcm.writeInt16LE(Math.round(v * 32767), i * 2)
}

const byteRate = SAMPLE_RATE * 2
const header = Buffer.alloc(44)
header.write('RIFF', 0)
header.writeUInt32LE(36 + pcm.length, 4)
header.write('WAVE', 8)
header.write('fmt ', 12)
header.writeUInt32LE(16, 16)
header.writeUInt16LE(1, 20) // PCM
header.writeUInt16LE(1, 22) // mono
header.writeUInt32LE(SAMPLE_RATE, 24)
header.writeUInt32LE(byteRate, 28)
header.writeUInt16LE(2, 32) // block align
header.writeUInt16LE(16, 34) // bits per sample
header.write('data', 36)
header.writeUInt32LE(pcm.length, 40)

const outDir = path.join(__dirname, '..', 'assets', 'sounds')
fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, 'laser-shot.wav')
fs.writeFileSync(outPath, Buffer.concat([header, pcm]))
console.log('wrote', outPath, pcm.length + 44, 'bytes')
