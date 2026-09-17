-- The Refinería: each material's core in the ship's reactor, repaired one
-- small core at a time. One row per (user, tier); `repaired` counts the
-- small cores done, and `started_at` is set while one is being smelted —
-- the server finishes it whenever it next looks and the clock says so.
--
-- Keyed by tier rather than by material name so a tier inserted later
-- (see 038 and 041) is remapped like everything else that stores the index.
CREATE TABLE user_core_repairs (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier INT NOT NULL,
  repaired INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, tier)
);
