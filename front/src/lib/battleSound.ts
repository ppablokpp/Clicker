/**
 * Laser blaster shot — synthesized with the Web Audio API, same approach as
 * caseSound.ts. A duel can run at 40-50 taps/second; without a rate limiter
 * that many overlapping oscillators would clip into distorted noise, so
 * calls that land faster than MIN_SHOT_INTERVAL are silently dropped
 * instead of queued.
 */

let ctx: AudioContext | null = null
let masterOutput: DynamicsCompressorNode | null = null
let lastShotAt = 0
const MIN_SHOT_INTERVAL = 0.035

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtor) return null
  if (!ctx) ctx = new AudioCtor()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function getMasterOutput(audioCtx: AudioContext): AudioNode {
  if (!masterOutput) {
    masterOutput = audioCtx.createDynamicsCompressor()
    masterOutput.threshold.value = -20
    masterOutput.knee.value = 12
    masterOutput.ratio.value = 10
    masterOutput.attack.value = 0.002
    masterOutput.release.value = 0.08
    masterOutput.connect(audioCtx.destination)
  }
  return masterOutput
}

/** Classic descending laser-pistol "pew" — called once per shot. */
export function playLaserShot() {
  const audioCtx = getContext()
  if (!audioCtx) return
  try {
    const now = audioCtx.currentTime
    if (now - lastShotAt < MIN_SHOT_INTERVAL) return
    lastShotAt = now

    const output = getMasterOutput(audioCtx)

    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(1900 + Math.random() * 200, now)
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.09)
    gain.gain.setValueAtTime(0.001, now)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
    osc.connect(gain).connect(output)
    osc.start(now)
    osc.stop(now + 0.11)

    // A thin high harmonic layered on top gives it a bit more "zap" bite.
    const harmonic = audioCtx.createOscillator()
    const harmonicGain = audioCtx.createGain()
    harmonic.type = 'square'
    harmonic.frequency.setValueAtTime(2800, now)
    harmonic.frequency.exponentialRampToValueAtTime(650, now + 0.07)
    harmonicGain.gain.setValueAtTime(0.001, now)
    harmonicGain.gain.exponentialRampToValueAtTime(0.045, now + 0.004)
    harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    harmonic.connect(harmonicGain).connect(output)
    harmonic.start(now)
    harmonic.stop(now + 0.09)
  } catch {
    // Audio is a nice-to-have — never let it break the duel.
  }
}
