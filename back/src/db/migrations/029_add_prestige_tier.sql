-- Trayectoria's own confirmed tier — separate from lifetime_platino (which
-- keeps climbing forever and drives the leaderboard/eligibility) so the
-- player's current asteroid/material only changes when they explicitly
-- confirm a prestige, not the instant lifetime_platino crosses the next
-- tier's threshold. See usersRepository.confirmPrestige.
ALTER TABLE users ADD COLUMN prestige_tier INTEGER NOT NULL DEFAULT 0;
