-- Tracks how many clicks have actually rolled a Destello (the Suerte/
-- Telescopio proc, see Home.tsx's isLucky) — the roll itself happens
-- client-side per tap for responsiveness, same trust model as realClicks:
-- reported and clamped alongside it in incrementClicks. Needed for the
-- "Encuentra destellos" onboarding task.
ALTER TABLE users ADD COLUMN lucky_clicks_found INTEGER NOT NULL DEFAULT 0;
