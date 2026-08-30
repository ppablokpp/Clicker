/**
 * Case-opening sound effects — synthesized with the Web Audio API instead of
 * shipping audio files (nothing to license or host): a metallic tick per
 * item the reel passes, and a whoosh + chime reward sting on reveal, in the
 * same spirit as CS:GO case openings without using any of their assets.
 */

let ctx: AudioContext | null = null
let noiseBuffer: AudioBuffer | null = null
let masterOutput: DynamicsCompressorNode | null = null
let lastTickAt = 0
// A fast manual drag can cross many items per animation frame — without a
// floor, each one queues its own tick and they pile up into distorted noise.
// This caps how often a tick can actually fire, no matter the source.
const MIN_TICK_INTERVAL = 0.04

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtor) return null
  if (!ctx) ctx = new AudioCtor()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

// Every sound routes through this instead of straight to destination — a
// fast drag can still overlap several ticks even with the rate limit above,
// and without a limiter their summed peaks clip into a distorted crunch.
function getMasterOutput(audioCtx: AudioContext): AudioNode {
  if (!masterOutput) {
    masterOutput = audioCtx.createDynamicsCompressor()
    masterOutput.threshold.value = -18
    masterOutput.knee.value = 12
    masterOutput.ratio.value = 8
    masterOutput.attack.value = 0.002
    masterOutput.release.value = 0.1
    masterOutput.connect(audioCtx.destination)
  }
  return masterOutput
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
    if (now - lastTickAt < MIN_TICK_INTERVAL) return
    lastTickAt = now

    const output = getMasterOutput(audioCtx)

    const noise = audioCtx.createBufferSource()
    noise.buffer = getNoiseBuffer(audioCtx)
    const bandpass = audioCtx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.setValueAtTime(2200 + Math.random() * 500, now)
    bandpass.Q.value = 5
    const noiseGain = audioCtx.createGain()
    noiseGain.gain.setValueAtTime(0.15, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.024)
    noise.connect(bandpass).connect(noiseGain).connect(output)
    noise.start(now)
    noise.stop(now + 0.026)

    const osc = audioCtx.createOscillator()
    const oscGain = audioCtx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(1100, now)
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.028)
    oscGain.gain.setValueAtTime(0.07, now)
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.028)
    osc.connect(oscGain).connect(output)
    osc.start(now)
    osc.stop(now + 0.03)
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
    const output = getMasterOutput(audioCtx)

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
      gain.connect(output)
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
      gain.connect(output)
      gain.connect(delay)
      osc.start(start)
      osc.stop(start + 0.57)
    }
  } catch {
    // Same — silently skip on any Web Audio failure.
  }
}

/**
 * Punchy cash-register "cha-ching" — plays when a chest is bought. A quick
 * upward swoosh kicks it off, then a bright ascending three-note arpeggio
 * (each note with an inharmonic overtone for a metallic register-bell
 * ring), capped with a scatter of coin clinks — closer to the jingly
 * "purchase confirmed" stings mobile games use than a plain two-note ding.
 */
export function playChestPurchase() {
  const audioCtx = getContext()
  if (!audioCtx) return
  try {
    const now = audioCtx.currentTime
    const output = getMasterOutput(audioCtx)

    const swoosh = audioCtx.createBufferSource()
    swoosh.buffer = getNoiseBuffer(audioCtx)
    const swooshFilter = audioCtx.createBiquadFilter()
    swooshFilter.type = 'bandpass'
    swooshFilter.Q.value = 0.7
    swooshFilter.frequency.setValueAtTime(600, now)
    swooshFilter.frequency.exponentialRampToValueAtTime(5000, now + 0.09)
    const swooshGain = audioCtx.createGain()
    swooshGain.gain.setValueAtTime(0.001, now)
    swooshGain.gain.exponentialRampToValueAtTime(0.1, now + 0.03)
    swooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
    swoosh.connect(swooshFilter).connect(swooshGain).connect(output)
    swoosh.start(now)
    swoosh.stop(now + 0.11)

    const notes = [784, 988, 1568] // G5, B5, G6 — bright ascending coin-jingle triad
    notes.forEach((freq, i) => {
      const start = now + 0.08 + i * 0.06

      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.26, start + 0.006)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3)
      osc.connect(gain).connect(output)
      osc.start(start)
      osc.stop(start + 0.31)

      // Inharmonic overtone is what makes it read as a bell instead of a
      // plain synth tone — a real bell's partials aren't clean octaves.
      const overtone = audioCtx.createOscillator()
      const overtoneGain = audioCtx.createGain()
      overtone.type = 'sine'
      overtone.frequency.setValueAtTime(freq * 2.41, start)
      overtoneGain.gain.setValueAtTime(0.0001, start)
      overtoneGain.gain.exponentialRampToValueAtTime(0.09, start + 0.004)
      overtoneGain.gain.exponentialRampToValueAtTime(0.001, start + 0.18)
      overtone.connect(overtoneGain).connect(output)
      overtone.start(start)
      overtone.stop(start + 0.19)
    })

    // A quick scatter of coin clinks right as the arpeggio lands.
    const sparkleStart = now + 0.08 + notes.length * 0.06
    for (let i = 0; i < 3; i++) {
      const start = sparkleStart + i * 0.035
      const clink = audioCtx.createBufferSource()
      clink.buffer = getNoiseBuffer(audioCtx)
      const bandpass = audioCtx.createBiquadFilter()
      bandpass.type = 'bandpass'
      bandpass.frequency.setValueAtTime(5000 + Math.random() * 1500, start)
      bandpass.Q.value = 10
      const clinkGain = audioCtx.createGain()
      clinkGain.gain.setValueAtTime(0.08 - i * 0.015, start)
      clinkGain.gain.exponentialRampToValueAtTime(0.001, start + 0.05)
      clink.connect(bandpass).connect(clinkGain).connect(output)
      clink.start(start)
      clink.stop(start + 0.06)
    }
  } catch {
    // Audio is a nice-to-have — never let it break the purchase flow.
  }
}

/**
 * Quick three-note ascending sparkle — plays when a magnet powerup grants a
 * key or a gem. Pitched slightly differently per currency (warmer/lower for
 * keys, brighter/higher for gems) with a light shimmer via feedback delay,
 * same trick as playCaseReveal but shorter and snappier since this can fire
 * repeatedly during an active magnet.
 */
export function playMagnetProc(currency: 'keys' | 'gems') {
  const audioCtx = getContext()
  if (!audioCtx) return
  try {
    const now = audioCtx.currentTime
    const output = getMasterOutput(audioCtx)

    const delay = audioCtx.createDelay()
    delay.delayTime.value = 0.015
    const feedback = audioCtx.createGain()
    feedback.gain.value = 0.22
    delay.connect(feedback).connect(delay)

    const base = currency === 'keys' ? 880 : 1175
    const notes = [base, base * 1.5, base * 2]
    notes.forEach((freq, i) => {
      const start = now + i * 0.045
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.16, start + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22)
      osc.connect(gain)
      gain.connect(output)
      gain.connect(delay)
      osc.start(start)
      osc.stop(start + 0.23)
    })
  } catch {
    // Audio is a nice-to-have — never let it break anything.
  }
}

/**
 * "Bill flick" — two quick overlapping paper-rustle bursts (the
 * characteristic "which-which" of riffling a bill between fingers) plus a
 * soft landing snap, played when a tree upgrade is bought. Louder and more
 * textured than the first pass at this (which turned out too quiet to
 * actually hear), but still nowhere near playChestPurchase's full
 * cha-ching — this fires constantly while grinding upgrades.
 */
export function playTreeUpgrade() {
  const audioCtx = getContext()
  if (!audioCtx) return
  try {
    const now = audioCtx.currentTime
    const output = getMasterOutput(audioCtx)

    const rustleOffsets = [0, 0.035]
    rustleOffsets.forEach((offset, i) => {
      const start = now + offset
      const rustle = audioCtx.createBufferSource()
      rustle.buffer = getNoiseBuffer(audioCtx)
      const bandpass = audioCtx.createBiquadFilter()
      bandpass.type = 'bandpass'
      bandpass.frequency.setValueAtTime(2600 + i * 900, start)
      bandpass.frequency.exponentialRampToValueAtTime(1500 + i * 500, start + 0.05)
      bandpass.Q.value = 0.9
      const rustleGain = audioCtx.createGain()
      rustleGain.gain.setValueAtTime(0.001, start)
      rustleGain.gain.exponentialRampToValueAtTime(0.12 - i * 0.02, start + 0.006)
      rustleGain.gain.exponentialRampToValueAtTime(0.001, start + 0.06)
      rustle.connect(bandpass).connect(rustleGain).connect(output)
      rustle.start(start)
      rustle.stop(start + 0.07)
    })

    // A soft snap right as the bill lands.
    const tick = audioCtx.createOscillator()
    const tickGain = audioCtx.createGain()
    tick.type = 'sine'
    tick.frequency.setValueAtTime(1500, now + 0.05)
    tickGain.gain.setValueAtTime(0.001, now + 0.05)
    tickGain.gain.exponentialRampToValueAtTime(0.065, now + 0.054)
    tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)
    tick.connect(tickGain).connect(output)
    tick.start(now + 0.05)
    tick.stop(now + 0.1)
  } catch {
    // Audio is a nice-to-have — never let it break a purchase.
  }
}

let lastRobotBeepAt = 0
// Same overlap guard as playCaseTick's own MIN_TICK_INTERVAL — the tutorial
// typewriter can reveal several characters within one animation frame on a
// slow device, and without a floor those would all fire at once into noise.
const MIN_ROBOT_BEEP_INTERVAL = 0.05

/**
 * Single "beep" or "boop" — called once per revealed character of the
 * tutorial robot's typewriter text. `index` just alternates the pitch
 * (even/odd) so a run of characters reads as "beep-boop-beep-boop" instead
 * of one flat repeated tone, the classic sci-fi-robot-talking cliché.
 */
export function playRobotBeep(index: number) {
  const audioCtx = getContext()
  if (!audioCtx) return
  try {
    const now = audioCtx.currentTime
    if (now - lastRobotBeepAt < MIN_ROBOT_BEEP_INTERVAL) return
    lastRobotBeepAt = now

    const output = getMasterOutput(audioCtx)
    const base = index % 2 === 0 ? 740 : 550

    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(base, now)
    osc.frequency.exponentialRampToValueAtTime(base * 1.15, now + 0.03)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045)
    osc.connect(gain).connect(output)
    osc.start(now)
    osc.stop(now + 0.05)
  } catch {
    // Audio is a nice-to-have — never let it break the tutorial.
  }
}
