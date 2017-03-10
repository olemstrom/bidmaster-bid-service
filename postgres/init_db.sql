CREATE TABLE items (
  id          varchar(10) PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  current_price INT DEFAULT 0,
  estimated_close DATE DEFAULT now(),
  state TEXT
);

CREATE TABLE categories (
  name TEXT PRIMARY KEY
);

CREATE TABLE categories_in_items (
  category_id TEXT REFERENCES categories (name) ON UPDATE CASCADE ON DELETE CASCADE,
  item_id TEXT REFERENCES items (id) ON UPDATE CASCADE ON DELETE CASCADE
)