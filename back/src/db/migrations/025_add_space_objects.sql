-- The new Home centerpiece: a space object you break with clicks instead of
-- a raw click counter in a circle. `objects_broken` only ever increases
-- (it's the new prestige driver, replacing the old "reach 1,000,000 total
-- clicks" gate) and `object_progress` accumulates every click (auto and
-- manual alike) toward the *current* object, reset (with remainder carried
-- over) each time one breaks. Deliberately separate from `total_clicks`,
-- which is spendable currency and would make no sense as a progress
-- source (spending clicks would un-break objects otherwise).
ALTER TABLE users
  ADD COLUMN objects_broken INT NOT NULL DEFAULT 0,
  ADD COLUMN object_progress DOUBLE PRECISION NOT NULL DEFAULT 0;
