-- Reverts 023: Sobrecarga went back to being a plain formula-based
-- multiplier (order doesn't matter, same as every other node) instead of
-- an order-dependent running total, so this column is dead weight now.
ALTER TABLE user_permanent_upgrades
  DROP COLUMN production;
