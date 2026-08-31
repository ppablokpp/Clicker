import { createAudioPlayer } from 'expo-audio'

// The web version fires a new Web Audio oscillator per tap (see
// front/src/lib/battleSound.ts's playLaserShot), so fast tapping naturally
// layers several overlapping "pew" sounds. expo-audio's AudioPlayer has no
// live-synthesis equivalent — see scripts/generate-laser-shot.js for how
// assets/sounds/laser-shot.wav was pre-rendered to match that oscillator's
// exact waveform/envelope.
//
// Every reasonable expo-audio configuration (seekTo vs. nothing,
// keepAudioSessionActive true/false, updateInterval on/off) was tried here
// and the result was the same every time: zero calls into expo-audio =
// perfectly smooth, ANY repeated play() = lag, the trackedTouchCount
// warning, occasional freezes. That's a strong enough, repeated enough
// signal to stop treating this as "wrong API options" and start treating
// it as a hard ceiling: this Expo Go environment cannot cleanly sustain
// audio calls at the same rate as Multidisparo's shot rate (up to ~28/s).
// So instead of matching the shot rate, sound is throttled far below it —
// completely independent of scoring/visuals, which stay at full speed no
// matter how many fingers are firing. You still hear a rapid rat-a-tat
// while tapping normally; what you *don't* get anymore is a real native
// audio call for every single one of dozens of near-simultaneous shots.
const POOL_SIZE = 4
const players = Array.from({ length: POOL_SIZE }, () =>
  createAudioPlayer(require('../../assets/sounds/laser-shot.wav'), {
    keepAudioSessionActive: true,
    updateInterval: 60_000,
  }),
)
let nextPlayerIndex = 0

let lastShotAt = 0
// Far below Multidisparo's real shot rate on purpose — see the file-level
// comment. ~8 sounds/sec is still a fast, satisfying rat-a-tat by ear.
const MIN_SHOT_INTERVAL_MS = 120

export function playLaserShot() {
  const now = Date.now()
  if (now - lastShotAt < MIN_SHOT_INTERVAL_MS) return
  lastShotAt = now

  const player = players[nextPlayerIndex]
  nextPlayerIndex = (nextPlayerIndex + 1) % POOL_SIZE
  player.seekTo(0)
  player.play()
}
