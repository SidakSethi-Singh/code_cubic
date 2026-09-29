"""device/app/conflicts/engine.py — C1, authority > version > time > human."""
from ..policy.factors import AUTHORITY_MAP

def _authority_of(memory: dict) -> int:
    return AUTHORITY_MAP.get(memory.get("kind", ""), 0)

def detect_conflict(mem_a: dict, mem_b: dict, tolerance: float = 1e-6) -> bool:
    if mem_a.get("asset_id") != mem_b.get("asset_id"):
        return False
    if mem_a.get("claim_type") != mem_b.get("claim_type"):
        return False
    va, vb = mem_a.get("claim_value"), mem_b.get("claim_value")
    if va is None or vb is None:
        return False
    return abs(float(va) - float(vb)) > tolerance

def resolve(mem_a: dict, mem_b: dict) -> dict:
    auth_a, auth_b = _authority_of(mem_a), _authority_of(mem_b)

    if auth_a != auth_b:
        winner, loser = (mem_a, mem_b) if auth_a > auth_b else (mem_b, mem_a)
        rule = "authority"
        reason = (f"'{winner['mem_id']}' (authority={_authority_of(winner)}) outranks "
                  f"'{loser['mem_id']}' (authority={_authority_of(loser)}).")
    elif mem_a.get("version", 0) != mem_b.get("version", 0):
        winner, loser = (mem_a, mem_b) if mem_a.get("version", 0) > mem_b.get("version", 0) else (mem_b, mem_a)
        rule = "version"
        reason = f"Same authority — '{winner['mem_id']}' has the newer version."
    elif mem_a.get("created_at", 0) != mem_b.get("created_at", 0):
        winner, loser = (mem_a, mem_b) if mem_a.get("created_at", 0) > mem_b.get("created_at", 0) else (mem_b, mem_a)
        rule = "time"
        reason = f"Same authority + version — '{winner['mem_id']}' is more recent."
    else:
        winner, loser = mem_a, mem_b
        rule = "human"
        reason = "Tied on authority, version and time — flagged for human review."

    loser_new_status = "disputed" if rule == "human" else "superseded"
    lineage = {"winner": winner["mem_id"], "loser": loser["mem_id"], "rule_used": rule,
               "winner_value": winner.get("claim_value"), "loser_value": loser.get("claim_value")}

    return {"winner_id": winner["mem_id"], "loser_id": loser["mem_id"],
            "loser_new_status": loser_new_status, "rule_used": rule,
            "reason": reason, "lineage": lineage}