"""Sync-side tables. Prefixed sync_* so they never collide with your ledger tables."""
import json
import sqlite3
import time

SCHEMA = """
CREATE TABLE IF NOT EXISTS sync_outbox (
    idem_key   TEXT PRIMARY KEY,
    mem_id     TEXT NOT NULL,
    text       TEXT NOT NULL,
    reason     TEXT,
    status     TEXT NOT NULL DEFAULT 'pending',   -- pending | synced
    attempts   INTEGER NOT NULL DEFAULT 0,
    created_at REAL NOT NULL,
    synced_at  REAL
);
CREATE TABLE IF NOT EXISTS sync_cursors (
    name TEXT PRIMARY KEY, value INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sync_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL, kind TEXT NOT NULL, payload TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sync_learned (
    version     INTEGER PRIMARY KEY,
    mem_id      TEXT NOT NULL,
    text        TEXT NOT NULL,
    source      TEXT NOT NULL,
    provenance  TEXT NOT NULL,
    learned_at  REAL NOT NULL
);
"""


def connect(path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    return conn


def log_event(conn, kind: str, **payload) -> None:
    conn.execute("INSERT INTO sync_events(ts, kind, payload) VALUES (?,?,?)",
                 (time.time(), kind, json.dumps(payload)))
    conn.commit()


def get_cursor(conn, name: str) -> int:
    row = conn.execute("SELECT value FROM sync_cursors WHERE name=?", (name,)).fetchone()
    return row["value"] if row else 0


def set_cursor(conn, name: str, value: int) -> None:
    conn.execute("INSERT INTO sync_cursors(name,value) VALUES (?,?) "
                 "ON CONFLICT(name) DO UPDATE SET value=excluded.value", (name, value))
    conn.commit()