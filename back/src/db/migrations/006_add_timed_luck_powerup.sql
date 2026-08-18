ALTER TABLE users
  ADD COLUMN active_luck_powerup TEXT,
  ADD COLUMN active_luck_powerup_expires_at TIMESTAMPTZ;
