-- Onboarding tasks — same shape as user_milestone_claims (migration 005):
-- a row means "already paid out", blocking a double-claim. Task
-- definitions/rewards live in back/src/tasks/config.js, not in the DB.
CREATE TABLE user_task_claims (
  user_id TEXT NOT NULL REFERENCES users(id),
  task_id TEXT NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, task_id)
);
