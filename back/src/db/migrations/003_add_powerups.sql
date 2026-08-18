ALTER TABLE users
  ADD COLUMN active_powerup TEXT,
  ADD COLUMN active_powerup_expires_at TIMESTAMPTZ;
