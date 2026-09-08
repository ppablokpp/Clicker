-- Style chests granted directly to a player, outside the key economy.
--
-- Same shape as owned_click_chests / owned_gem_chests, which already do this
-- for the other two chest types: a plain counter on the user, decremented
-- when one is spent. Reusing the pattern rather than inventing a table means
-- the anonymous-account merge (see claimAnonymousProgress) already carries
-- them over, which a new table would have had to be remembered for.
--
-- Only these two exist because only these two are giftable: the material and
-- gem chests pay out currency, and handing those out directly would be the
-- same as editing someone's balance.
ALTER TABLE users ADD COLUMN owned_style_chests INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN owned_style_rare_chests INTEGER NOT NULL DEFAULT 0;
