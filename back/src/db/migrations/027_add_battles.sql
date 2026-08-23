-- Click battles: challenge another player, both play a timed round on their
-- own schedule (not simultaneously), whoever gets more taps wins the pot.
-- State machine: awaiting_challenger (challenger paid, hasn't played yet)
-- -> awaiting_opponent (challenger's score is in, visible to the opponent)
-- -> opponent_accepted (opponent paid, hasn't played yet)
-- -> completed (opponent's score is in, winner resolved).
CREATE TABLE battles (
  id SERIAL PRIMARY KEY,
  challenger_id TEXT NOT NULL REFERENCES users(id),
  opponent_id TEXT NOT NULL REFERENCES users(id),
  wager INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_challenger',
  challenger_taps INT,
  opponent_taps INT,
  winner_id TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX battles_opponent_status_idx ON battles (opponent_id, status);
CREATE INDEX battles_challenger_status_idx ON battles (challenger_id, status);
