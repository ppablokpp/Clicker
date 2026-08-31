/**
 * iOS Safari's hardware silent switch mutes a normal HTML5 `<audio>`/`<video>`
 * element, but a page's Web Audio API output (what battleSound.ts and
 * caseSound.ts actually use) only escapes that switch once the page's audio
 * session has been "activated" by something audible actually starting to
 * play — which, on a cold page, hasn't happened yet even though an
 * AudioContext exists and its oscillators are firing normally. The fix is a
 * silent, looping `<audio>` element kept playing for the rest of the
 * session: starting it (from the same user-gesture click that triggers the
 * first game sound, since autoplay policies require one) puts the page into
 * that active audio state, and every AudioContext sound after that plays
 * through the speaker regardless of the switch.
 */
let unlockAttempted = false

export function unlockAudioSession() {
  if (unlockAttempted) return
  if (typeof Audio === 'undefined') return
  unlockAttempted = true

  const silent = new Audio('/silence.wav')
  silent.loop = true
  silent.volume = 0.01
  silent.play().catch(() => {
    // Not inside a real user gesture yet (or Autoplay was blocked) — let
    // the next call (from the next click) try again.
    unlockAttempted = false
  })
}
