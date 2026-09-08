-- Zafiro and Rubí join the Trayectoria ladder, at index 2 (between Platino
-- and Esmeralda) and index 4 (between Esmeralda and Oro). Everything from
-- Esmeralda up therefore shifts, and prestige_tier is a stored column — so
-- without this every player above Platino would silently wake up mining a
-- different material than the one they earned.
--
--   old 0 Amatista  -> 0 Amatista   (unchanged)
--   old 1 Platino   -> 1 Platino    (unchanged)
--   old 2 Esmeralda -> 3 Esmeralda
--   old 3 Oro       -> 5 Oro
--   old 4 Diamante  -> 6 Diamante
--
-- A single CASE rather than three UPDATEs on purpose: sequential updates
-- would collide with each other (2->3 then 3->5 would catch the rows it had
-- just moved), and this way the whole remap is one atomic pass.
--
-- Their goals get easier, not harder: old Esmeralda asked 841B and the new
-- one asks 100B. The prestige multipliers rise with the index (a player at
-- Esmeralda goes from 5^2 to 5^3 on production and on fixed-node costs),
-- which is correct — the material keeps its identity and its rung's
-- economics move with it.
UPDATE users
SET prestige_tier = CASE prestige_tier
  WHEN 2 THEN 3
  WHEN 3 THEN 5
  WHEN 4 THEN 6
  ELSE prestige_tier
END
WHERE prestige_tier >= 2;
