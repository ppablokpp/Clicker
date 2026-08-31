import { createAudioPlayer } from 'expo-audio'

// The web version fires a new Web Audio oscillator per tap (see
// front/src/lib/battleSound.ts's playLaserShot), so fast tapping naturally
// layers several overlapping "pew" sounds. expo-audio's AudioPlayer has no
// live-synthesis equivalent — see scripts/generate-laser-shot.js for how
// assets/sounds/laser-shot.wav was pre-rendered to match that oscillator's
// exact waveform/envelope. A single reused player can't overlap itself
// (retriggering it just restarts/cuts off the sound), so this round-robins
// a small pool of players instead, mirroring the web's own 35ms
// min-interval-between-shots throttle (MIN_SHOT_INTERVAL) for how much
// overlap is realistically needed.
const POOL_SIZE = 4
const players = Array.from({ length: POOL_SIZE }, () => createAudioPlayer(require('../../assets/sounds/laser-shot.wav')))
let nextPlayerIndex = 0

let lastShotAt = 0
const MIN_SHOT_INTERVAL_MS = 35

export function playLaserShot() {
  const now = Date.now()
  if (now - lastShotAt < MIN_SHOT_INTERVAL_MS) return
  lastShotAt = now

  const player = players[nextPlayerIndex]
  nextPlayerIndex = (nextPlayerIndex + 1) % POOL_SIZE
  player.seekTo(0)
  player.play()
}
