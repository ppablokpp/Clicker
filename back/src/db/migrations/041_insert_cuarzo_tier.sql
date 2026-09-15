-- Cuarzo joins the Trayectoria ladder at index 4, between Esmeralda and Rubí.
-- Everything from Rubí up therefore shifts by one, and prestige_tier is a
-- stored column — so without this every player at Rubí or above would wake
-- up mining a different material than the one they earned (a Rubí account,
-- still stored as 4, would render as Cuarzo).
--
--   0 Amatista   (unchanged)
--   1 Platino    (unchanged)
--   2 Zafiro     (unchanged)
--   3 Esmeralda  (unchanged)
--   old 4 Rubí     -> 5 Rubí
--   old 5 Oro      -> 6 Oro
--   old 6 Diamante -> 7 Diamante
--
-- A single CASE rather than three UPDATEs, for the same reason as 038:
-- sequential updates would catch the rows they had just moved (4->5 then
-- 5->6 would carry the Rubí players on to Oro), and this way the whole remap
-- is one atomic pass.
--
-- Their goals get steeper, not easier, this time (see the ladder in
-- back/src/game/trajectory.js): a Rubí account keeps its material and its
-- multipliers rise one step with the index, but the ceiling it is climbing
-- towards moves from 50T to 1Qa, Oro's from 1Qa to 3Qi, and Diamante's from
-- 1Qa to 100Sx.
-- Nobody is pushed back a tier and nobody loses progress; some now have
-- further to go.
UPDATE users
SET prestige_tier = CASE prestige_tier
  WHEN 4 THEN 5
  WHEN 5 THEN 6
  WHEN 6 THEN 7
  ELSE prestige_tier
END
WHERE prestige_tier >= 4;
