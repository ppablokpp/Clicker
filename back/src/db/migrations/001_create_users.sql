CREATE TABLE users (
  id TEXT PRIMARY KEY,                 -- Clerk user id (user_xxx), not a serial: Clerk is the source of truth for identity
  email TEXT UNIQUE,
  username TEXT,
  avatar_url TEXT,
  total_clicks BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_total_clicks ON users (total_clicks DESC);
