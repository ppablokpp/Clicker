-- Trayectoria's own progress driver — cumulative platino ever earned,
-- separate from `total_clicks` (spendable currency, which drops on every
-- purchase) for the same reason `objects_broken` is: a tier-progress stat
-- should only ever go up. Credited alongside every `total_clicks` increase
-- — manual clicks, auto-click accrual, milestone bonuses, chest/gem-pack
-- platino, and battle wager payouts/refunds all count.
ALTER TABLE users ADD COLUMN lifetime_platino DOUBLE PRECISION NOT NULL DEFAULT 0;
