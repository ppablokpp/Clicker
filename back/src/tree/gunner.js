/**
 * Artillero — Drones buscadores' second child, mirroring Frecuencia across the
 * branch (Frecuencia goes up-right, this goes up-left).
 *
 * Each level parks one more gunner on Home, aimed at the asteroid and firing
 * from both cannons (see front/src/components/HomeGunner.tsx), and adds its
 * own production. They hold station in a fan derived from the count, so the
 * cap here is an economic choice rather than a number of drawn positions.
 *
 * The rare unit: six of them across the whole game against dozens of drones,
 * which only works if each one is worth a great deal — hence the 100/s base
 * rate (see gunnerRate.js) against a drone's 1.
 */
export const GUNNER_NODE_ID = 'gunner'

/**
 * A single gunner for the first two asteroids, then one more per asteroid:
 * 1 on Amatista and Platino, 2 on Zafiro, 3 on Esmeralda, up to 6 on
 * Diamante.
 *
 * Holding at one across Amatista AND Platino is what makes the second one an
 * event. Under the old ladder you could own two before leaving the first
 * asteroid, which spent the "a new craft joins the formation" moment on the
 * tier where it means least.
 *
 * The only cap in the tree that grows by a flat step rather than by
 * TIERED_LEVELS_PER_PRESTIGE, and the only one that binds in practice —
 * every other node's cost curve stops you long before its ceiling does.
 * That is the point here: the fleet's other two units are things you own
 * dozens of, and this one is meant to be counted on one hand and to visibly
 * gain a craft each time you move asteroid.
 *
 * Prices are untouched: gunnerCost is indexed by level, so the Nth gunner
 * costs what it always did — this only changes how far up the ladder a given
 * asteroid lets you climb. Anyone already over the new ceiling keeps every
 * gunner they own; the cap is only ever read to decide whether the NEXT one
 * is for sale.
 */
export function gunnerMaxLevel(prestigeTier) {
  return Math.max(1, Number(prestigeTier))
}

/**
 * 20M puts the first gunner at twice Amatista's goal — reachable there only
 * by deliberately farming well past the prestige, which is the point — and at
 * a tenth of Platino's, where it becomes a normal purchase.
 */
export const GUNNER_BASE_COST = 20_000_000
export const GUNNER_COST_RATIO = 2

/**
 * How much the base price rises per prestige, and the one number here worth
 * arguing about.
 *
 * It has to rise at all because the ladder is short: left flat, maxing every
 * gunner costs 0.0% of Diamante's goal and the rare unit becomes something
 * you buy without noticing. But it must rise slower than the goal (x21.5 a
 * tier) or the opposite happens — an earlier attempt used 39 and by Diamante
 * the FIRST gunner cost seven times that tier's entire goal, which is worse
 * than free: a node nobody can ever buy is worth less than one that gets
 * cheap.
 *
 * At 3 the full ladder runs 210% of Platino's goal, 54% of Zafiro's, 17% of
 * Esmeralda's and 0.4% of Diamante's. Expensive enough to be a project for
 * the first half of the game, cheap enough by the end to never be a wall.
 */
export const GUNNER_COST_PER_PRESTIGE = 3

export function gunnerCost(level, prestigeTier = 0) {
  if (level >= gunnerMaxLevel(prestigeTier)) return null
  return Math.ceil(
    GUNNER_BASE_COST * GUNNER_COST_PER_PRESTIGE ** Number(prestigeTier) * GUNNER_COST_RATIO ** level,
  )
}
