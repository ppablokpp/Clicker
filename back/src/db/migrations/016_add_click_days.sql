CREATE TABLE click_days (
  user_id TEXT NOT NULL REFERENCES users(id),
  click_date DATE NOT NULL,
  PRIMARY KEY (user_id, click_date)
);
