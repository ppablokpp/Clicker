-- Tracks whether a player has finished (or skipped) the onboarding
-- tutorial — gates the auto-start on login and is idempotent to re-set on
-- every manual replay (see routes/users.js POST /tutorial-complete).
ALTER TABLE users ADD COLUMN tutorial_completed BOOLEAN NOT NULL DEFAULT false;
