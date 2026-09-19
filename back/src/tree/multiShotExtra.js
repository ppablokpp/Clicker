/**
 * Sincronía — Multidisparo's other child: picks up where Multidisparo
 * stops (ten fingers) and takes the cap on to twenty, one finger a level.
 * Only opens once Multidisparo itself is maxed, so it reads as the second
 * half of the same ladder. Its own curve, not Multidisparo's continued:
 * that one triples per level and would be in the trillions by here; this
 * starts past Multidisparo's last price and grows 1.6x a level instead.
 */
import { MULTI_SHOT_MAX_LEVEL, multiShotValue } from './multiShot.js'

export const MULTI_SHOT_EXTRA_NODE_ID = 'multi_shot_extra'
export const MULTI_SHOT_EXTRA_MAX_LEVEL = 10

export const MULTI_SHOT_EXTRA_BASE_COST = 25_000_000
export const MULTI_SHOT_EXTRA_COST_RATIO = 1.6

export function multiShotExtraCost(level) {
  if (level >= MULTI_SHOT_EXTRA_MAX_LEVEL) return null
  return Math.ceil(MULTI_SHOT_EXTRA_BASE_COST * MULTI_SHOT_EXTRA_COST_RATIO ** level)
}

/** Whether Sincronía can be bought at all: Multidisparo has to be maxed. */
export function multiShotExtraUnlocked(multiShotLevel) {
  return multiShotLevel >= MULTI_SHOT_MAX_LEVEL
}

/** Fingers allowed at once, both ladders together. */
export function totalMultiShotValue(multiShotLevel, extraLevel) {
  return multiShotValue(multiShotLevel) + extraLevel
}
