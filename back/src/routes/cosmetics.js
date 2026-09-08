import { Router } from 'express'
import { getAuth } from '../auth/getAuth.js'
import { usersRepository } from '../db/usersRepository.js'
import {
  COSMETIC_GEM_PRICES,
  COSMETIC_ITEMS,
  canEquip,
  getCosmetic,
} from '../store/cosmetics.js'

export const cosmeticsRouter = Router()

/**
 * The catalogue and its prices. Public and unauthenticated — it's a shop
 * window, and the client already ships its own copy of this table to draw the
 * cards. Serving it anyway means a price change is a backend deploy rather
 * than a frontend one, and the client can trust this over its own copy.
 */
cosmeticsRouter.get('/', (_req, res) => {
  res.json({
    prices: COSMETIC_GEM_PRICES,
    items: COSMETIC_ITEMS.map((i) => ({
      slot: i.slot,
      itemId: i.itemId,
      rarity: i.rarity,
      price: COSMETIC_GEM_PRICES[i.rarity],
    })),
  })
})

/** What this player owns. The stock kit is never in here — it's free. */
cosmeticsRouter.get('/me', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.json({ owned: [] })
  res.json({ owned: await usersRepository.getOwnedCosmetics(userId) })
})

/**
 * Buys a basket of cosmetics with gems and equips them.
 *
 * The body carries the pieces and, optionally, the full style the player has
 * on screen — the detail page shows the piece already worn, so the purchase
 * is what turns that into the saved outfit. The style is still filtered
 * against ownership before it's written (see below): the basket is trusted to
 * say what's being *bought*, never what's allowed to be worn.
 */
cosmeticsRouter.post('/buy', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const raw = req.body?.items
  if (!Array.isArray(raw) || raw.length === 0) return res.status(400).json({ error: 'no-items' })
  if (raw.length > 16) return res.status(400).json({ error: 'too-many-items' })

  // Resolve each entry against the catalogue rather than trusting its shape:
  // this is what rejects a made-up id and a stock-kit piece someone tried to
  // be charged nothing for.
  const items = []
  const seen = new Set()
  for (const entry of raw) {
    const item = getCosmetic(entry?.slot, entry?.itemId)
    if (!item) return res.status(400).json({ error: 'unknown-item' })
    const key = `${item.slot}:${item.itemId}`
    if (seen.has(key)) return res.status(400).json({ error: 'duplicate-item' })
    seen.add(key)
    items.push({ slot: item.slot, itemId: item.itemId, rarity: item.rarity })
  }

  const totalCost = items.reduce((sum, item) => sum + COSMETIC_GEM_PRICES[item.rarity], 0)

  // The style the player wants left on, filtered down to what they'll own
  // once this purchase lands. Anything they don't own — a piece still being
  // tried on that isn't in this basket, or a plain forgery — falls back to
  // whatever they already have saved rather than being written.
  let styleUpdate = null
  const wanted = req.body?.style
  if (wanted && typeof wanted === 'object' && !Array.isArray(wanted)) {
    const ownedAfter = new Set([
      ...(await usersRepository.getOwnedCosmetics(userId)),
      ...items.map((item) => `${item.slot}:${item.itemId}`),
    ])
    const current = (await usersRepository.getById(userId))?.astronaut_style ?? {}
    styleUpdate = {}
    for (const [slot, id] of Object.entries(wanted)) {
      if (typeof id !== 'string') continue
      styleUpdate[slot] = canEquip(slot, id, ownedAfter) ? id : current[slot]
      if (styleUpdate[slot] === undefined) delete styleUpdate[slot]
    }
  }

  try {
    const result = await usersRepository.buyCosmetics(userId, items, totalCost, styleUpdate)
    if (!result.ok) return res.status(400).json({ error: result.reason })
    res.json({
      gems: result.gems,
      owned: result.owned,
      astronautStyle: result.astronautStyle,
      spent: totalCost,
    })
  } catch (err) {
    console.error('Error buying cosmetics', err)
    res.status(500).json({ error: 'buy-failed' })
  }
})
