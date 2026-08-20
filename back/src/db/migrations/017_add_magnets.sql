ALTER TABLE users
  ADD COLUMN active_magnet TEXT,
  ADD COLUMN active_magnet_expires_at TIMESTAMPTZ,
  ADD COLUMN magnet_cooldown_until TIMESTAMPTZ;
