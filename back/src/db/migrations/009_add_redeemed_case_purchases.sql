CREATE TABLE redeemed_case_purchases (
  transaction_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  prize_id TEXT NOT NULL,
  prize_amount BIGINT NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
