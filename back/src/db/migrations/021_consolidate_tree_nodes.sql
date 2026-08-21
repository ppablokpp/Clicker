-- Superseded by reusing user_permanent_upgrades below — the old "permanent
-- upgrades" feature is being folded into tree nodes, so there's no need for
-- a separate storage table.
DROP TABLE user_tree_nodes;

-- Broadens user_permanent_upgrades from a one-time-per-tier ownership flag
-- into general tree-node storage: `level` counts repeatable purchases
-- (existing rows default to 1, preserving their old "owned" meaning),
-- `last_tick_at`/`remainder` are only used by production-type nodes (e.g.
-- auto-click) that accrue value over real time between reads.
ALTER TABLE user_permanent_upgrades
  ADD COLUMN level INT NOT NULL DEFAULT 1,
  ADD COLUMN last_tick_at TIMESTAMPTZ,
  ADD COLUMN remainder REAL NOT NULL DEFAULT 0;
