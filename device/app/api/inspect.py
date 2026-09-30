"""device/app/api/inspect.py — Inspection endpoints: decisions, conflicts, events, facets."""
import json
from fastapi import APIRouter, Request, HTTPException
from typing import Optional, List, Dict, Any

from device.app.ledger.db import get_conn

router = APIRouter(tags=["inspect"])


@router.get("/decisions")
def list_decisions(mem_id: Optional[str] = None, limit: int = 50):
    try:
        with get_conn() as conn:
            if mem_id:
                cursor = conn.execute(
                    "SELECT id, mem_id, outcome, score, factors, reason, created_at "
                    "FROM decisions WHERE mem_id=? ORDER BY created_at DESC LIMIT ?",
                    (mem_id, limit),
                )
            else:
                cursor = conn.execute(
                    "SELECT id, mem_id, outcome, score, factors, reason, created_at "
                    "FROM decisions ORDER BY created_at DESC LIMIT ?",
                    (limit,),
                )
            rows = cursor.fetchall()
            results = []
            for r in rows:
                factors_raw = r["factors"]
                factors = json.loads(factors_raw) if factors_raw else {}
                results.append({
                    "id": r["id"],
                    "mem_id": r["mem_id"],
                    "outcome": r["outcome"],
                    "score": r["score"],
                    "factors": factors,
                    "reason": r["reason"],
                    "created_at": r["created_at"],
                })
            return {"decisions": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conflicts")
def list_conflicts(status: Optional[str] = None, limit: int = 50):
    try:
        with get_conn() as conn:
            if status:
                cursor = conn.execute(
                    "SELECT id, mem_id_a, mem_id_b, conflict_type, resolution, status, lineage, created_at "
                    "FROM conflicts WHERE status=? ORDER BY created_at DESC LIMIT ?",
                    (status, limit),
                )
            else:
                cursor = conn.execute(
                    "SELECT id, mem_id_a, mem_id_b, conflict_type, resolution, status, lineage, created_at "
                    "FROM conflicts ORDER BY created_at DESC LIMIT ?",
                    (limit,),
                )
            rows = cursor.fetchall()
            results = []
            for r in rows:
                lineage_raw = r["lineage"]
                lineage = json.loads(lineage_raw) if lineage_raw else {}
                results.append({
                    "id": r["id"],
                    "mem_id_a": r["mem_id_a"],
                    "mem_id_b": r["mem_id_b"],
                    "conflict_type": r["conflict_type"],
                    "resolution": r["resolution"],
                    "status": r["status"],
                    "lineage": lineage,
                    "created_at": r["created_at"],
                })
            return {"conflicts": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events")
def list_events(kind: Optional[str] = None, limit: int = 50):
    try:
        with get_conn() as conn:
            if kind:
                cursor = conn.execute(
                    "SELECT id, kind, payload, created_at FROM events WHERE kind=? ORDER BY created_at DESC LIMIT ?",
                    (kind, limit),
                )
            else:
                cursor = conn.execute(
                    "SELECT id, kind, payload, created_at FROM events ORDER BY created_at DESC LIMIT ?",
                    (limit,),
                )
            rows = cursor.fetchall()
            results = []
            for r in rows:
                payload_raw = r["payload"]
                payload = json.loads(payload_raw) if payload_raw else {}
                results.append({
                    "id": r["id"],
                    "kind": r["kind"],
                    "payload": payload,
                    "created_at": r["created_at"],
                })
            return {"events": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/facets/{key}")
def get_facets(request: Request, key: str):
    try:
        store = request.app.state.store
        if hasattr(store, "facets"):
            return store.facets(key)
        return {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
