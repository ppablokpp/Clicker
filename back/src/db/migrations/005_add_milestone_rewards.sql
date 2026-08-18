ALTER TABLE users
  ADD COLUMN milestone_bonus_multiplier REAL NOT NULL DEFAULT 1;

CREATE TABLE user_milestone_claims (
  user_id TEXT NOT NULL REFERENCES users(id),
  category_key TEXT NOT NULL,
  milestone INT NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category_key, milestone)
);
