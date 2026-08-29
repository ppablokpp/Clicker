-- Tracks how many Anomalía challenges a player has actually won (see
-- eventsRepository.claimReward) — needed for the "Neutraliza anomalías"
-- onboarding task, which is a running count rather than a tree-node level
-- like every other task so far.
ALTER TABLE users ADD COLUMN anomalies_neutralized INTEGER NOT NULL DEFAULT 0;
