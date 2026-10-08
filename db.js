'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'app.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'performer', -- 'admin' | 'performer'
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS performers (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name  TEXT    NOT NULL,
    categories    TEXT    NOT NULL DEFAULT '',  -- comma separated category keys
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
    date          TEXT    NOT NULL,                 -- YYYY-MM-DD
    status        TEXT    NOT NULL DEFAULT 'available', -- 'available' | 'unavailable' | 'booked'
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
    status          TEXT    NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'declined'
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_avail_perf ON availability(performer_id);
  CREATE INDEX IF NOT EXISTS idx_book_perf  ON bookings(performer_id);
`);

module.exports = db;
