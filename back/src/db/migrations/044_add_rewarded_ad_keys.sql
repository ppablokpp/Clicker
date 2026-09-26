-- Keys earned by watching a rewarded ad, rationed per day the same way the
-- free daily key is: a date and a count, so the allowance resets by itself
-- at the day's turn with no job to run. Kept on the user rather than in a
-- log because nothing needs the history — only "how many today".
--
-- The count lives here and not on the phone on purpose: reinstalling the
-- app, or clearing its data, must not hand anyone a fresh allowance.
ALTER TABLE users ADD COLUMN ad_keys_date DATE;
ALTER TABLE users ADD COLUMN ad_keys_today SMALLINT NOT NULL DEFAULT 0;
