-- Cosmetics won from the style chests.
--
-- One row per piece a user owns. The customization screen still offers every
-- piece to everyone for now, so this is a record of what's been won rather
-- than a gate on what can be worn — the gate comes later, and it comes for
-- free once this table has been filling up in the meantime.
--
-- (slot, item_id) rather than a single id because ids repeat across slots
-- ('estandar' is an antenna, a pack, a helmet, a suit and a boot), and the
-- primary key is what makes a duplicate win impossible to record twice.
CREATE TABLE user_cosmetics (
  user_id TEXT NOT NULL REFERENCES users(id),
  slot TEXT NOT NULL,
  item_id TEXT NOT NULL,
  won_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, slot, item_id)
);
