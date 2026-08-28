-- Home's random "Anomalía" event — a client-spawned, client-timed mini
-- challenge (100 taps in 10s) with no per-tap server round trip, so the
-- only thing the backend can actually enforce is "not too often": this
-- timestamp gates back-to-back claims so a client can't just call the
-- claim endpoint repeatedly without a real event ever having spawned.
ALTER TABLE users ADD COLUMN last_event_reward_at TIMESTAMPTZ;
