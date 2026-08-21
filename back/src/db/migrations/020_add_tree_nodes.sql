-- Generic level storage for the incremental upgrade tree — one row per
-- owned/leveled node. `last_tick_at`/`remainder` are only used by
-- production-type nodes (e.g. auto-click) that accrue value over real time;
-- other node types (click-power, luck, etc.) just use `level`.
CREATE TABLE user_tree_nodes (
  user_id TEXT NOT NULL REFERENCES users(id),
  node_id TEXT NOT NULL,
  level INT NOT NULL DEFAULT 0,
  last_tick_at TIMESTAMPTZ,
  remainder REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, node_id)
);
