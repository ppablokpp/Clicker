CREATE TABLE user_inventory (
  user_id TEXT NOT NULL REFERENCES users(id),
  item_id TEXT NOT NULL,
  quantity BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, item_id)
);
