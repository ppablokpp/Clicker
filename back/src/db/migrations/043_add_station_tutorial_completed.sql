-- The second tutorial: the one that walks the player out of the ship to
-- the station and through their first capsule at the Refinería, fired the
-- moment the fifth drone is bought on the first asteroid. Once, like the
-- onboarding one.
ALTER TABLE users ADD COLUMN station_tutorial_completed BOOLEAN NOT NULL DEFAULT false;
