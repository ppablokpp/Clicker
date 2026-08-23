-- Prestige: reset your current run (platino + every regular tree level)
-- in exchange for permanent points, spent on a separate, never-reset
-- upgrade tree. `prestige_points` lives on `users` since it's a simple
-- lifetime counter. Prestige upgrade levels live in their own table
-- (mirroring user_permanent_upgrades' shape) specifically so the reset
-- can safely `DELETE FROM user_permanent_upgrades` without any risk of
-- also wiping permanent prestige progress — the two are physically
-- separate rather than relying on excluding specific rows.
ALTER TABLE users
  ADD COLUMN prestige_points INT NOT NULL DEFAULT 0;

CREATE TABLE user_prestige_upgrades (
  user_id TEXT NOT NULL REFERENCES users(id),
  upgrade_id TEXT NOT NULL,
  level INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, upgrade_id)
);
