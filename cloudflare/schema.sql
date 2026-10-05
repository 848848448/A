-- D1 schema for the Music Directory.

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'performer',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS performers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name  TEXT    NOT NULL,
  categories    TEXT    NOT NULL DEFAULT '',
  bio           TEXT    NOT NULL DEFAULT '',
  phone         TEXT    NOT NULL DEFAULT '',
  public_email  TEXT    NOT NULL DEFAULT '',
  website       TEXT    NOT NULL DEFAULT '',
  location      TEXT    NOT NULL DEFAULT '',
  price_from    TEXT    NOT NULL DEFAULT '',
  photo         TEXT    NOT NULL DEFAULT '',
  featured      INTEGER NOT NULL DEFAULT 0,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS availability (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  performer_id  INTEGER NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  date          TEXT    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'available',
  note          TEXT    NOT NULL DEFAULT '',
  UNIQUE(performer_id, date)
);

CREATE TABLE IF NOT EXISTS bookings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  performer_id    INTEGER NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  requester_name  TEXT    NOT NULL,
  requester_phone TEXT    NOT NULL DEFAULT '',
  requester_email TEXT    NOT NULL DEFAULT '',
  event_date      TEXT    NOT NULL,
  event_type      TEXT    NOT NULL DEFAULT '',
  location        TEXT    NOT NULL DEFAULT '',
  message         TEXT    NOT NULL DEFAULT '',
  status          TEXT    NOT NULL DEFAULT 'pending',
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires    INTEGER NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_avail_perf ON availability(performer_id);
CREATE INDEX IF NOT EXISTS idx_book_perf  ON bookings(performer_id);
CREATE INDEX IF NOT EXISTS idx_sess_user  ON sessions(user_id);
