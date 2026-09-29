"""Fleet Cloud hub + curator. Run: uvicorn hub.app.main:app --port 8765"""
import os
import sqlite3
import time

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

DB = os.environ.get("HUB_DB", "hub.db")
app = FastAPI(title="EdgeMind Fleet Hub")


def db():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    return c


with db() as _c:
    _c.executescript("""
    CREATE TABLE IF NOT EXISTS fleet_inbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idem_key TEXT UNIQUE NOT NULL, device_id TEXT NOT NULL,
        mem_id TEXT NOT NULL, text TEXT NOT NULL, reason TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        curator_note TEXT, received_at REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS fleet_knowledge (
        version INTEGER PRIMARY KEY AUTOINCREMENT,
        inbox_id INTEGER NOT NULL, source_device TEXT NOT NULL,
        mem_id TEXT NOT NULL, text TEXT NOT NULL, curated_at REAL NOT NULL
    );
    """)


class PushItem(BaseModel):
    idem_key: str
    device_id: str
    mem_id: str
    text: str
    reason: str | None = None


class Curate(BaseModel):
    decision: str  # approve | reject
    note: str | None = None


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/push")
def push(item: PushItem):
    with db() as c:
        cur = c.execute(
            "INSERT OR IGNORE INTO fleet_inbox(idem_key, device_id, mem_id, text, reason, received_at) "
            "VALUES (?,?,?,?,?,?)",
            (item.idem_key, item.device_id, item.mem_id, item.text, item.reason, time.time()))
        return {"accepted": True, "duplicate": cur.rowcount == 0}


@app.get("/inbox")
def inbox(status: str = "pending"):
    with db() as c:
        return {"items": [dict(r) for r in
                          c.execute("SELECT * FROM fleet_inbox WHERE status=?", (status,))]}


@app.post("/curate/{inbox_id}")
def curate(inbox_id: int, body: Curate):
    if body.decision not in ("approve", "reject"):
        raise HTTPException(400, "decision must be approve or reject")
    with db() as c:
        row = c.execute("SELECT * FROM fleet_inbox WHERE id=?", (inbox_id,)).fetchone()
        if not row:
            raise HTTPException(404, "not found")
        if row["status"] != "pending":
            return {"status": row["status"], "note": "already curated"}
        status = "approved" if body.decision == "approve" else "rejected"
        c.execute("UPDATE fleet_inbox SET status=?, curator_note=? WHERE id=?",
                  (status, body.note, inbox_id))
        if status == "approved":
            c.execute("INSERT INTO fleet_knowledge(inbox_id, source_device, mem_id, text, curated_at) "
                      "VALUES (?,?,?,?,?)",
                      (inbox_id, row["device_id"], row["mem_id"], row["text"], time.time()))
        return {"status": status}


@app.post("/curate-auto")
def curate_auto():
    """Rule-based curator (no LLM): reject empty/duplicate text, approve the rest."""
    out = {"approved": 0, "rejected": 0}
    with db() as c:
        for r in c.execute("SELECT * FROM fleet_inbox WHERE status='pending'").fetchall():
            dup = c.execute("SELECT 1 FROM fleet_knowledge WHERE text=?", (r["text"],)).fetchone()
            if not r["text"].strip() or dup:
                c.execute("UPDATE fleet_inbox SET status='rejected', curator_note=? WHERE id=?",
                          ("empty or duplicate", r["id"]))
                out["rejected"] += 1
            else:
                c.execute("UPDATE fleet_inbox SET status='approved', curator_note='auto: passed rules' WHERE id=?",
                          (r["id"],))
                c.execute("INSERT INTO fleet_knowledge(inbox_id, source_device, mem_id, text, curated_at) "
                          "VALUES (?,?,?,?,?)",
                          (r["id"], r["device_id"], r["mem_id"], r["text"], time.time()))
                out["approved"] += 1
    return out


@app.get("/pull")
def pull(since: int = 0, device_id: str = ""):
    with db() as c:
        latest = c.execute("SELECT COALESCE(MAX(version),0) m FROM fleet_knowledge").fetchone()["m"]
        rows = c.execute("SELECT * FROM fleet_knowledge WHERE version>? AND source_device!=? ORDER BY version",
                         (since, device_id)).fetchall()
        return {"items": [dict(r) for r in rows], "latest_version": latest}