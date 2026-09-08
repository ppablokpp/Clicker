-- Grandfathers everyone into the cosmetics they're already wearing.
--
-- Until now the customization screen handed out every piece for free, so
-- user_cosmetics was a record of chest wins rather than a gate. Turning it
-- into the gate (see back/src/store/cosmetics.js) would otherwise strip
-- every existing player back to the stock kit the next time their style
-- saved — they'd open the screen, see their own outfit greyed out with a
-- price on it, and be entirely right to be annoyed.
--
-- So: whatever a user currently has equipped, they now own. One row per
-- non-default piece in their saved astronaut_style.
--
-- Everything else in the catalogue stays locked, which is the point of the
-- change. This only protects what someone had actually chosen.

-- First, a rename. The cyan colourway is now called `diamante`, after the
-- asteroid tier it always matched, on the helmet and on the three shared
-- accessory slots. A saved id that no longer exists resolves to the slot's
-- default (see `pick` in astronautStyles.ts), so without this everyone
-- wearing cyan would quietly turn violet — and then be grandfathered into
-- owning the wrong piece by the INSERT below, which reads these same rows.
-- Order matters: this has to land before that runs.
UPDATE users u
SET astronaut_style = (
  SELECT jsonb_object_agg(
    s.slot,
    CASE
      WHEN s.item_id = 'cian' AND s.slot IN ('helmet', 'bracelet', 'belt', 'accent')
      THEN 'diamante'
      ELSE s.item_id
    END
  )
  FROM jsonb_each_text(u.astronaut_style) AS s(slot, item_id)
)
WHERE u.astronaut_style IS NOT NULL
  AND jsonb_typeof(u.astronaut_style) = 'object'
  AND (
    u.astronaut_style->>'helmet' = 'cian'
    OR u.astronaut_style->>'bracelet' = 'cian'
    OR u.astronaut_style->>'belt' = 'cian'
    OR u.astronaut_style->>'accent' = 'cian'
  );

INSERT INTO user_cosmetics (user_id, slot, item_id)
SELECT DISTINCT
  u.id,
  -- The two shoulders are two separate purchases, so `pet2` is recorded as
  -- `pet2`: someone already wearing a droid on each side keeps both.
  s.slot,
  s.item_id
FROM users u
CROSS JOIN LATERAL jsonb_each_text(u.astronaut_style) AS s(slot, item_id)
WHERE u.astronaut_style IS NOT NULL
  AND jsonb_typeof(u.astronaut_style) = 'object'
  -- The stock kit is free and permanent and must never get a row: it isn't
  -- in the catalogue at all, so a row here would be an unlock for something
  -- that can't be bought, sold or rolled.
  AND (s.slot, s.item_id) NOT IN (
    ('helmet', 'estandar'),
    ('suit', 'estandar'),
    ('boots', 'estandar'),
    ('belt', 'violeta'),
    ('bracelet', 'violeta'),
    ('antenna', 'estandar'),
    ('pack', 'estandar'),
    ('trail', 'llama'),
    ('badge', 'planeta'),
    ('pet', 'ninguna'),
    ('pet2', 'ninguna'),
    ('accent', 'violeta'),
    ('visor', 'limpio'),
    ('background', 'estrellas')
  )
-- Catches the one collision left: a player who already won a piece they also
-- happen to be wearing.
ON CONFLICT (user_id, slot, item_id) DO NOTHING;
