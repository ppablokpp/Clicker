/**
 * Case-opening sound effects — synthesized with the Web Audio API instead of
 * shipping audio files (nothing to license or host): a metallic tick per
 * item the reel passes, and a whoosh + chime reward sting on reveal, in the
 * same spirit as CS:GO case openings without using any of their assets.
 */

let ctx: AudioContext | null = null
let noiseBuffer: AudioBuffer | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtor) return null
  if (!ctx) ctx = new AudioCtor()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** One second of white noise, reused (played back through filters) for both the tick's clack and the reveal whoosh. */
function getNoiseBuffer(audioCtx: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const length = audioCtx.sampleRate
    noiseBuffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  }
  return noiseBuffer
}

/** Short metallic clack — called once per item the reel scrolls past. */
export function playCaseTick() {
  const audioCtx = getContext()
  if (!audioCtx) return
  try {
    const now = audioCtx.currentTime

    const noise = audioCtx.createBufferSource()
    noise.buffer = getNoiseBuffer(audioCtx)
    const bandpass = audioCtx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.setValueAtTime(2200 + Math.random() * 500, now)
    bandpass.Q.value = 5
    const noiseGain = audioCtx.createGain()
    noiseGain.gain.setValueAtTime(0.18, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035)
    noise.connect(bandpass).connect(noiseGain).connect(audioCtx.destination)
    noise.start(now)
    noise.stop(now + 0.04)

    const osc = audioCtx.createOscillator()
    const oscGain = audioCtx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(1100, now)
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.04)
    oscGain.gain.setValueAtTime(0.08, now)
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
    osc.connect(oscGain).connect(audioCtx.destination)
    osc.start(now)
    osc.stop(now + 0.05)
  } catch {
    // Audio is a nice-to-have — never let it break the reveal flow.
  }
}

/** Clean two-note reveal ding — brighter the higher the prize tier (0 = common … 5 = legendary). Deliberately minimal: no whoosh, no thud, just the notes. */
export function playCaseReveal(tier: number) {
  const audioCtx = getContext()
  if (!audioCtx) return
  try {
    const now = audioCtx.currentTime

    // A little shimmer via feedback delay, not a wall of layers.
    const delay = audioCtx.createDelay()
    delay.delayTime.value = 0.02
    const feedback = audioCtx.createGain()
    feedback.gain.value = 0.18
    delay.connect(feedback).connect(delay)

    const base = 523 + tier * 40
    const notes = [base, base * 1.5]
    notes.forEach((freq, i) => {
      const start = now + i * 0.12
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      gain.connect(delay)
      osc.start(start)
      osc.stop(start + 0.52)
    })

    // A single extra high note on rare tiers — the only "extra", kept minimal.
    if (tier >= 4) {
      const start = now + 0.24
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(base * 2, start)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(tier >= 5 ? 0.12 : 0.08, start + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      gain.connect(delay)
      osc.start(start)
      osc.stop(start + 0.57)
    }
  } catch {
    // Same — silently skip on any Web Audio failure.
  }
}
