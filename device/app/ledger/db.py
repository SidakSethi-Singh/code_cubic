"""
device/app/ledger/db.py
SQLite ledger — operational state store (NOT the vector shard).
WAL mode so reads/writes don't block each other. Zero external deps.
"""
import sqlite3, json, time
from pathlib import Path
from contextlib import contextmanager

DB_PATH = Path(__file__).resolve().parents[3] / "data" / "ledger.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

SCHEMA = """
CREATE TABLE IF NOT EXISTS decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mem_id TEXT NOT NULL, outcome TEXT NOT NULL, score REAL,
    factors TEXT, reason TEXT, created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    op_id TEXT UNIQUE NOT NULL, mem_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', bytes INTEGER DEFAULT 0,
    created_at REAL NOT NULL, synced_at REAL
);
CREATE TABLE IF NOT EXISTS conflicts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mem_id_a TEXT NOT NULL, mem_id_b TEXT NOT NULL, conflict_type TEXT NOT NULL,
    resolution TEXT, status TEXT NOT NULL DEFAULT 'open',
    lineage TEXT, created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL, payload TEXT, created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS cursors (
    stream TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at REAL NOT NULL
);
"""

@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

def init_db():
    with get_conn() as conn:
        conn.executescript(SCHEMA)

def log_event(kind: str, payload: dict):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO events (kind, payload, created_at) VALUES (?, ?, ?)",
            (kind, json.dumps(payload), time.time()),
        )

if __name__ == "__main__":
    init_db()
    print(f"Ledger initialised at {DB_PATH}") 