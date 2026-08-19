CREATE TABLE redeemed_key_purchases (
  transaction_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  pack_id TEXT NOT NULL,
  amount BIGINT NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE redeemed_gem_purchases (
  transaction_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  pack_id TEXT NOT NULL,
  amount BIGINT NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
