-- Sobrecarga (auto_multiplier) doesn't work like every other node: instead
-- of a value derived from a formula, each purchase multiplies whatever
-- auto-click's production happens to be *at that moment* and bakes the
-- result in permanently — later auto-click levels only ever add their flat
-- per-level amount on top of that, they don't get multiplied again by a
-- Sobrecarga bought earlier. That makes production order-dependent, so it
-- has to be persisted directly rather than recomputed from level each time.
ALTER TABLE user_permanent_upgrades
  ADD COLUMN production REAL NOT NULL DEFAULT 0;

-- Backfill existing auto-click rows to match the levels already owned —
-- preserves current players' progress exactly (0.5 c/s per level was
-- already the formula in use before this column existed).
UPDATE user_permanent_upgrades
SET production = level * 0.5
WHERE upgrade_id = 'auto_click';
