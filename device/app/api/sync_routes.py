import os
from pathlib import Path
from typing import Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from device.app.api.search_routes import _store, DATA_DIR, DEVICE_ID, SITE_ID, ASSET_ID
from device.app.conflicts.engine import ConflictEngine
from device.app.ledger.ledger import SQLiteLedger
from device.app.memory.models import Memory
from device.app.policy.engine import PolicyEngine
from device.app.sync.cloud_client import CloudClient
from device.app.sync.coordinator import SyncCoordinator
from device.app.sync.link_state import LinkState
from device.app.sync.pull_worker import PullWorker, SyncReport
from device.app.sync.push_worker import PushWorker

router = APIRouter(prefix="/api", tags=["sync_and_governance"])

# Singletons for device node configured to isolated directory
_ledger = SQLiteLedger(db_path=DATA_DIR / "ledger.db")
_link_state = LinkState(state_file=DATA_DIR / "link_state.json", ledger=_ledger)
_cloud_client = CloudClient(link_state=_link_state, hub_url=os.environ.get("HUB_URL", "http://localhost:8000"))
_policy_engine = PolicyEngine()
_conflict_engine = ConflictEngine()

_push_worker = PushWorker(ledger=_ledger, cloud_client=_cloud_client, store=_store)
_pull_worker = PullWorker(
    ledger=_ledger,
    cloud_client=_cloud_client,
    store=_store,
    conflict_engine=_conflict_engine,
    device_profile={"site_id": SITE_ID, "asset_id": ASSET_ID},
)
_coordinator = SyncCoordinator(
    push_worker=_push_worker,
    pull_worker=_pull_worker,
    ledger=_ledger,
    cloud_client=_cloud_client,
)


def _seed_initial_sync_state():
    try:
        conflicts = _ledger.get_conflicts()
        if not conflicts:
            _ledger.record_conflict(
                conflict_id="CR-4821",
                mem_ids=["10420000-0000-0000-0000-000000001042", "OEM-REV-12", "INC-8042"],
                rule="C2",
                resolution="accept_fleet",
                status="open",
                details={
                    "title": "CONFLICT #CR-4821: PUMP COUPLING TORQUE SPECIFICATION",
                    "asset_id": "P-204",
                    "asset_name": "SLURRY PUMP P-204 (NORTH PLANT - PIT 3)",
                    "asset_tag": "PMP-204-NX3",
                    "detected_at": "14m ago",
                    "crdt_clock": "v10.491.0",
                    "policy": "AUTONOMOUS_ARBITRATION",
                    "affected_peers": "14 ONLINE",
                    "local_cache": {
                        "id": "M-1042",
                        "title": "LOCAL MANUAL CACHE [M-1042]",
                        "torque_value": "40 Nm",
                        "authority": 1,
                        "source": "OEM Technical Manual Rev 2.1 (Local NVMe storage)",
                        "cached_age": "42 days ago",
                        "spec": "Specified bolt: M16 grade 8.8. Torque tolerance: ±3 Nm. Staged cross-tightening initial baseline.",
                        "status": "SUPERSEDED BY FLEET BULLETIN"
                    },
                    "cloud_bulletin": {
                        "id": "OEM-REV-12",
                        "title": "CLOUD BULLETIN [OEM-REV-12]",
                        "torque_value": "45 Nm",
                        "authority": 3,
                        "source": "Central Fleet Engineering Directive (Signed Key: #OEM-ROOT-88)",
                        "issued_age": "48h ago",
                        "mandate": "Revised torque specification: 45 Nm final. Cross-pattern tightening in 15 Nm increments to prevent asymmetric bearing preload under >1,750 RPM high slurry load.",
                        "status": "SYNCED • ACTIVE",
                        "is_system_choice": True
                    },
                    "technician_log": {
                        "id": "INC-8042",
                        "title": "TECHNICIAN FIELD LOG [INC-8042]",
                        "torque_value": "42 Nm",
                        "authority": 2,
                        "source": "Technician Asha K. (TK-904) on Device A (Plant North)",
                        "logged_age": "2h ago",
                        "observation": "45 Nm caused micro-galling on older flange #B-19. Settled on 42 Nm with Molykote paste to eliminate high-load grinding sound.",
                        "status": "DISPUTED: DIVERGES FROM OEM SPECIFICATION (+3 Nm OVER LOCAL, -3 Nm UNDER FLEET). HELD FOR AUDIT."
                    },
                    "rules": [
                        {"id": "RULE 01", "name": "AUTHORITY EVALUATION", "detail": "Cloud Bulletin (Auth 3) > Asha Note (Auth 2) > Local Manual (Auth 1)", "outcome": "WINNER CANDIDATE IDENTIFIED"},
                        {"id": "RULE 02", "name": "CRYPTOGRAPHIC SIGNATURE", "detail": "Valid OEM root signature (#OEM-ROOT-88) verified on-device via local pubkey ring", "outcome": "ED25519 VERIFIED"},
                        {"id": "RULE 03", "name": "VERSION & VECTOR RECENCY", "detail": "Rev 12 (t=48h) supersedes Rev 2.1 (t=42d) across 14 peer local indexes", "outcome": "VCLOCK DOMINANCE"},
                        {"id": "RULE 04", "name": "HUMAN-IN-THE-LOOP OVERRIDE EXCEPTION", "detail": "Asha K. field variance (+/- 3 Nm) logged as empirical exception; non-blocking for local consensus", "outcome": "TRIAGE QUEUED"}
                    ],
                    "lineage": [
                        {"tag": "ROOT • 42D", "label": "M-1042 INITIAL OEM BASELINE", "desc": "Target: 40 Nm • Factory Specs", "hash": "#7f8e...3a19", "status": ""},
                        {"tag": "COMM • 48H", "label": "FLEET DIRECTIVE REV 12", "desc": "Target: 45 Nm • Fleet Central Eng", "hash": "#9d1a...88e2", "status": "ACTIVE BROADCAST"},
                        {"tag": "FORK • 2H", "label": "FIELD VARIANCE #FL-2024-883", "desc": "Target: 42 Nm • Asha K. (TK-904)", "hash": "#3c44...019d", "status": "FORK DETECTED"},
                        {"tag": "ARBIT • 14M", "label": "LOCAL ARBITRATION EVENT #CR-4821", "desc": "45 Nm active locally; 42 Nm fork preserved", "hash": "", "status": "CRDT-CONVERGED"}
                    ]
                }
            )

        outbox = _ledger.get_all_outbox()
        if not outbox:
            samples = [
                ("OP-9041", "MEM-8845", 1, "PENDING", 1, 64 * 1024, 12.4, {"title": "Bearing replacement procedure", "asset": "P-204"}),
                ("OP-9040", "MEM-8844", 1, "PENDING", 1, 128 * 1024, 18.2, {"title": "Cavitation pressure sensor logs", "asset": "P-204"}),
                ("OP-9039", "MEM-8842", 1, "LOCAL_ONLY", 0, 18 * 1024, 0.0, {"title": "Technician contact notes (PII)", "asset": "P-204"}),
                ("OP-9038", "MEM-8839", 1, "SYNCED", 1, 256 * 1024, 4.1, {"title": "Flange torque calibration update", "asset": "P-204"}),
                ("OP-9037", "MEM-8836", 1, "SYNCED", 1, 82 * 1024, 5.0, {"title": "Seal flush schedule doc", "asset": "P-204"}),
            ]
            for op_id, mem_id, ver, state, att, bsz, lat, pl in samples:
                _ledger.enqueue_outbox(op_id=op_id, mem_id=mem_id, version=ver, payload=pl, state=state)
    except Exception as e:
        print(f"Warning: Failed to seed sync state: {e}")


_seed_initial_sync_state()


class LinkToggleRequest(BaseModel):
    state: str  # "online" | "offline"


class ResolveConflictRequest(BaseModel):
    resolution: str  # "accept_fleet" | "keep_local" | "escalate"


@router.get("/sync/status")
def get_sync_status() -> dict[str, Any]:
    pending_outbox = _ledger.get_pending_outbox(limit=100)
    all_outbox = _ledger.get_all_outbox(limit=100)
    decisions = _ledger.get_all_decisions(limit=100)
    conflicts = _ledger.get_conflicts(status="open")

    held_count = sum(1 for d in decisions if d["action"] in ("hold", "local_only"))
    synced_count = sum(1 for o in all_outbox if o["state"] == "SYNCED")

    return {
        "link_state": _link_state.get_state(),
        "is_online": _link_state.is_online(),
        "pending_ops_count": len(pending_outbox),
        "synced_ops_count": synced_count,
        "held_ops_count": held_count,
        "open_conflicts_count": len(conflicts),
        "total_decisions_count": len(decisions),
    }


@router.post("/sync/trigger", response_model=SyncReport)
def trigger_sync() -> SyncReport:
    return _coordinator.sync_cycle()


@router.post("/link/toggle")
def toggle_link(req: LinkToggleRequest) -> dict[str, Any]:
    _link_state.set_state(req.state)
    return {"status": "ok", "new_state": _link_state.get_state()}


@router.get("/decisions")
def get_decisions(limit: int = 50) -> list[dict[str, Any]]:
    return _ledger.get_all_decisions(limit=limit)


@router.get("/conflicts")
def get_conflicts(status: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
    return _ledger.get_conflicts(status=status, limit=limit)


@router.post("/conflicts/{conflict_id}/resolve")
def resolve_conflict(conflict_id: str, req: ResolveConflictRequest) -> dict[str, Any]:
    _ledger.resolve_conflict(conflict_id=conflict_id, resolution=req.resolution)
    return {"status": "resolved", "conflict_id": conflict_id, "resolution": req.resolution}


@router.get("/events")
def get_events(limit: int = 50) -> list[dict[str, Any]]:
    return _ledger.get_events(limit=limit)


@router.get("/outbox")
def get_outbox(limit: int = 50) -> list[dict[str, Any]]:
    return _ledger.get_all_outbox(limit=limit)
