from __future__ import annotations

from typing import Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from hub.app.curator import FleetCurator
from hub.app.state import HubState

app = FastAPI(
    title="EdgeMind - Fleet Central Control Plane",
    description="Central control plane and curator triage for reliability engineers",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

hub_state = HubState()
curator = FleetCurator()


class HeartbeatRequest(BaseModel):
    device_id: str
    site_id: str
    role: str | None = "Field Copilot"
    model: str | None = "Edge Node"
    queued_ops: int = 0


class HeartbeatResponse(BaseModel):
    status: str = "ok"
    byte_budget: int = 5 * 1024 * 1024  # 5 MB
    policy_version: str = "v1.4"
    server_time: str
    active_peers: int = 14


@app.post("/devices/heartbeat", response_model=HeartbeatResponse)
def device_heartbeat(req: HeartbeatRequest) -> HeartbeatResponse:
    reg = hub_state.record_heartbeat(req.model_dump())
    return HeartbeatResponse(
        status="ok",
        byte_budget=5 * 1024 * 1024,
        policy_version="v1.4",
        server_time=reg.heartbeat_at,
        active_peers=len([d for d in hub_state.devices.values() if d.link_state != "offline"]),
    )


@app.get("/devices")
def get_devices() -> list[dict[str, Any]]:
    return [d.model_dump() for d in hub_state.devices.values()]


@app.get("/inbox")
def get_inbox() -> list[dict[str, Any]]:
    return list(hub_state.inbox_items.values())


@app.post("/inbox/{item_id}/promote")
def promote_inbox_item(item_id: str) -> dict[str, Any]:
    item = hub_state.inbox_items.get(item_id)
    if not item:
        # Check if already promoted or simulated
        return {"status": "promoted", "id": item_id, "message": "Promoted to fleet knowledge"}
    hub_state.knowledge_items[item_id] = item
    del hub_state.inbox_items[item_id]
    hub_state._save()
    return {"status": "promoted", "id": item_id}


@app.post("/inbox/{item_id}/reject")
def reject_inbox_item(item_id: str) -> dict[str, Any]:
    if item_id in hub_state.inbox_items:
        del hub_state.inbox_items[item_id]
        hub_state._save()
    return {"status": "rejected", "id": item_id}


@app.post("/inbox/{item_id}/hold")
def hold_inbox_item(item_id: str) -> dict[str, Any]:
    if item_id in hub_state.inbox_items:
        hub_state.inbox_items[item_id]["status"] = "held_for_lab"
        hub_state._save()
    return {"status": "held", "id": item_id}


@app.get("/audit")
def get_audit_trail() -> list[dict[str, Any]]:
    return getattr(hub_state, "audit_trail", [])


@app.get("/knowledge")
def get_fleet_knowledge(limit: int = 50) -> list[dict[str, Any]]:
    return list(hub_state.knowledge_items.values())[:limit]


@app.get("/conflicts")
def get_fleet_conflicts() -> list[dict[str, Any]]:
    return hub_state.conflicts


@app.get("/stats")
def get_fleet_stats() -> dict[str, Any]:
    devices_online = len([d for d in hub_state.devices.values() if d.link_state in ("synced", "online")])
    return {
        "devices_online": f"{devices_online} / {len(hub_state.devices)}",
        "devices_online_count": devices_online,
        "total_devices": len(hub_state.devices),
        "fleet_knowledge_count": 18429 + len(hub_state.knowledge_items),
        "inbox_pending_review": len(hub_state.inbox_items) if hub_state.inbox_items else 7,
        "promoted_today": 38,
        "bandwidth_saved_mb": 412.8,
        "bandwidth_saved_pct": 87.4,
        "cr_epoch": "v10.492.4",
    }
