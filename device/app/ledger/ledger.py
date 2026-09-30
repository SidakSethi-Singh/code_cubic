from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class SQLiteLedger:
    def __init__(self, db_path: str | Path | None = None):
        self.db_path = Path(db_path) if db_path else Path("data/ledger.db")
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=10.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA busy_timeout=5000;")
        return conn

    def _init_db(self) -> None:
        with self._get_connection() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS outbox (
                    op_id TEXT PRIMARY KEY,
                    mem_id TEXT NOT NULL,
                    version INTEGER NOT NULL DEFAULT 1,
                    state TEXT NOT NULL DEFAULT 'NEW',
                    attempts INTEGER NOT NULL DEFAULT 0,
                    next_try TEXT,
                    payload TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS decisions (
                    mem_id TEXT PRIMARY KEY,
                    action TEXT NOT NULL,
                    score REAL NOT NULL,
                    factors_json TEXT NOT NULL,
                    reason TEXT NOT NULL,
                    override TEXT,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ts TEXT NOT NULL,
                    kind TEXT NOT NULL,
                    payload TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS conflicts (
                    id TEXT PRIMARY KEY,
                    mem_ids TEXT NOT NULL,
                    rule TEXT NOT NULL,
                    resolution TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'open',
                    details TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS cursors (
                    collection TEXT PRIMARY KEY,
                    cursor_value TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS usage (
                    mem_id TEXT PRIMARY KEY,
                    hit_count INTEGER NOT NULL DEFAULT 0,
                    last_hit TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_outbox_state ON outbox(state);
                CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
            """)

    def record_decision(
        self,
        mem_id: str,
        action: str,
        score: float,
        factors: dict[str, Any],
        reason: str,
        override: dict[str, Any] | None = None,
    ) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO decisions (mem_id, action, score, factors_json, reason, override, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(mem_id) DO UPDATE SET
                    action = excluded.action,
                    score = excluded.score,
                    factors_json = excluded.factors_json,
                    reason = excluded.reason,
                    override = excluded.override,
                    created_at = excluded.created_at
                """,
                (
                    mem_id,
                    action,
                    score,
                    json.dumps(factors),
                    reason,
                    json.dumps(override) if override else None,
                    now,
                ),
            )

    def get_decision(self, mem_id: str) -> dict[str, Any] | None:
        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM decisions WHERE mem_id = ?", (mem_id,)).fetchone()
            if not row:
                return None
            return {
                "mem_id": row["mem_id"],
                "action": row["action"],
                "score": float(row["score"]),
                "factors": json.loads(row["factors_json"]),
                "reason": row["reason"],
                "override": json.loads(row["override"]) if row["override"] else None,
                "created_at": row["created_at"],
            }

    def get_all_decisions(self, limit: int = 50) -> list[dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute("SELECT * FROM decisions ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
            return [
                {
                    "mem_id": r["mem_id"],
                    "action": r["action"],
                    "score": float(r["score"]),
                    "factors": json.loads(r["factors_json"]),
                    "reason": r["reason"],
                    "override": json.loads(r["override"]) if r["override"] else None,
                    "created_at": r["created_at"],
                }
                for r in rows
            ]

    def enqueue_outbox(
        self,
        op_id: str,
        mem_id: str,
        version: int,
        payload: dict[str, Any],
        state: str = "NEW",
    ) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO outbox (op_id, mem_id, version, state, attempts, next_try, payload, created_at)
                VALUES (?, ?, ?, ?, 0, ?, ?, ?)
                ON CONFLICT(op_id) DO UPDATE SET
                    state = excluded.state,
                    payload = excluded.payload
                """,
                (op_id, mem_id, version, state, now, json.dumps(payload), now),
            )

    def update_outbox_state(
        self,
        op_id: str,
        state: str,
        attempts: int | None = None,
        next_try: str | None = None,
    ) -> None:
        with self._get_connection() as conn:
            if attempts is not None and next_try is not None:
                conn.execute(
                    "UPDATE outbox SET state = ?, attempts = ?, next_try = ? WHERE op_id = ?",
                    (state, attempts, next_try, op_id),
                )
            elif attempts is not None:
                conn.execute(
                    "UPDATE outbox SET state = ?, attempts = ? WHERE op_id = ?",
                    (state, attempts, op_id),
                )
            else:
                conn.execute("UPDATE outbox SET state = ? WHERE op_id = ?", (state, op_id))

    def get_pending_outbox(self, limit: int = 50) -> list[dict[str, Any]]:
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM outbox
                WHERE (state = 'NEW' OR state = 'PENDING')
                  AND (next_try IS NULL OR next_try <= ?)
                ORDER BY created_at ASC
                LIMIT ?
                """,
                (now, limit),
            ).fetchall()
            return [
                {
                    "op_id": r["op_id"],
                    "mem_id": r["mem_id"],
                    "version": r["version"],
                    "state": r["state"],
                    "attempts": r["attempts"],
                    "next_try": r["next_try"],
                    "payload": json.loads(r["payload"]),
                    "created_at": r["created_at"],
                }
                for r in rows
            ]

    def get_all_outbox(self, limit: int = 50) -> list[dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute("SELECT * FROM outbox ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
            return [
                {
                    "op_id": r["op_id"],
                    "mem_id": r["mem_id"],
                    "version": r["version"],
                    "state": r["state"],
                    "attempts": r["attempts"],
                    "next_try": r["next_try"],
                    "payload": json.loads(r["payload"]),
                    "created_at": r["created_at"],
                }
                for r in rows
            ]

    def log_event(self, kind: str, payload: dict[str, Any]) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO events (ts, kind, payload) VALUES (?, ?, ?)",
                (now, kind, json.dumps(payload)),
            )

    def get_events(self, limit: int = 50) -> list[dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute("SELECT * FROM events ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
            return [
                {
                    "id": r["id"],
                    "ts": r["ts"],
                    "kind": r["kind"],
                    "payload": json.loads(r["payload"]),
                }
                for r in rows
            ]

    def record_conflict(
        self,
        conflict_id: str,
        mem_ids: list[str],
        rule: str,
        resolution: str,
        status: str = "open",
        details: dict[str, Any] | None = None,
    ) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO conflicts (id, mem_ids, rule, resolution, status, details, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    resolution = excluded.resolution,
                    status = excluded.status,
                    details = excluded.details
                """,
                (
                    conflict_id,
                    json.dumps(mem_ids),
                    rule,
                    resolution,
                    status,
                    json.dumps(details or {}),
                    now,
                ),
            )

    def get_conflicts(self, status: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
        with self._get_connection() as conn:
            if status:
                rows = conn.execute(
                    "SELECT * FROM conflicts WHERE status = ? ORDER BY created_at DESC LIMIT ?",
                    (status, limit),
                ).fetchall()
            else:
                rows = conn.execute("SELECT * FROM conflicts ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
            return [
                {
                    "id": r["id"],
                    "mem_ids": json.loads(r["mem_ids"]),
                    "rule": r["rule"],
                    "resolution": r["resolution"],
                    "status": r["status"],
                    "details": json.loads(r["details"]),
                    "created_at": r["created_at"],
                }
                for r in rows
            ]

    def resolve_conflict(self, conflict_id: str, resolution: str) -> None:
        with self._get_connection() as conn:
            conn.execute(
                "UPDATE conflicts SET status = 'resolved', resolution = ? WHERE id = ?",
                (resolution, conflict_id),
            )

    def get_cursor(self, collection: str) -> str | None:
        with self._get_connection() as conn:
            row = conn.execute("SELECT cursor_value FROM cursors WHERE collection = ?", (collection,)).fetchone()
            return row["cursor_value"] if row else None

    def set_cursor(self, collection: str, cursor_value: str) -> None:
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO cursors (collection, cursor_value) VALUES (?, ?)
                ON CONFLICT(collection) DO UPDATE SET cursor_value = excluded.cursor_value
                """,
                (collection, cursor_value),
            )

    def record_usage(self, mem_id: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO usage (mem_id, hit_count, last_hit) VALUES (?, 1, ?)
                ON CONFLICT(mem_id) DO UPDATE SET
                    hit_count = hit_count + 1,
                    last_hit = excluded.last_hit
                """,
                (mem_id, now),
            )

    def get_usage(self, mem_id: str) -> dict[str, Any] | None:
        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM usage WHERE mem_id = ?", (mem_id,)).fetchone()
            if not row:
                return None
            return {"mem_id": row["mem_id"], "hit_count": row["hit_count"], "last_hit": row["last_hit"]}

    def reconcile(self, store: Any | None = None) -> int:
        """
        Reconcile on boot: finds rows in state 'NEW'.
        Re-applies them to the memory store if missing, and moves them to 'PENDING'.
        Returns count of reconciled rows.
        """
        reconciled = 0
        with self._get_connection() as conn:
            rows = conn.execute("SELECT * FROM outbox WHERE state = 'NEW'").fetchall()
            for r in rows:
                op_id = r["op_id"]
                payload = json.loads(r["payload"])
                if store and hasattr(store, "upsert"):
                    try:
                        from device.app.memory.models import Memory
                        mem = Memory(**payload)
                        store.upsert(mem)
                    except Exception:
                        pass
                conn.execute("UPDATE outbox SET state = 'PENDING' WHERE op_id = ?", (op_id,))
                reconciled += 1
        return reconciled
