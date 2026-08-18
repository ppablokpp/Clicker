ALTER TABLE users
  ADD COLUMN powerup_cooldown_until TIMESTAMPTZ,
  ADD COLUMN luck_powerup_cooldown_until TIMESTAMPTZ;
