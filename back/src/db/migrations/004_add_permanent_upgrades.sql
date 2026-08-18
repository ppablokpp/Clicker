CREATE TABLE user_permanent_upgrades (
  user_id TEXT NOT NULL REFERENCES users(id),
  upgrade_id TEXT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, upgrade_id)
);
