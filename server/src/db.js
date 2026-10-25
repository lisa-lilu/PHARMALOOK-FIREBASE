import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// The whole database is one file: server/data/pharmalook.db
const dir = path.resolve("data");
fs.mkdirSync(dir, { recursive: true });

const db = new Database(path.join(dir, "pharmalook.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('customer', 'pharmacy', 'admin')),
    name          TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pharmacies (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    location   TEXT NOT NULL,
    lat        REAL,
    lng        REAL,
    status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    logo_data  TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS medicines (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
    name        TEXT NOT NULL COLLATE NOCASE,
    price       REAL NOT NULL,
    dosage      TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    category    TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (pharmacy_id, name)
  );

  CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
`);

export default db;
