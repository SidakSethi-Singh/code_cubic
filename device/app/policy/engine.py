"""device/app/policy/engine.py — THE DIFFERENTIATOR. Pure function, no deps."""
from .rules import apply_hard_rules
from .factors import soft_score

SHARE_THRESHOLD = 0.55
HOLD_THRESHOLD = 0.30

def decide(mem_id: str, text: str, kind: str, existing_texts: list[str] | None = None,
           user_override: str | None = None) -> dict:
    existing_texts = existing_texts or []

    if user_override in {"local_only", "share", "hold"}:
        return {
            "mem_id": mem_id, "outcome": user_override, "score": None,
            "factors": {"user_override": True},
            "reason": f"User explicitly set this to '{user_override}'.",
        }

    hard = apply_hard_rules(text)
    if hard:
        return {"mem_id": mem_id, **hard}

    score, factors = soft_score(text, kind, existing_texts)

    if factors["near_duplicate"]:
        outcome = "hold"
        reason = f"Near-duplicate of existing memory (novelty={factors['novelty']}) — held, not synced."
    elif score >= SHARE_THRESHOLD:
        outcome = "share"
        reason = (f"High shareability (score={score}): authority={factors['authority']}, "
                   f"novelty={factors['novelty']} — worth syncing to the fleet.")
    elif score >= HOLD_THRESHOLD:
        outcome = "hold"
        reason = f"Borderline shareability (score={score}) — held pending more signal."
    else:
        outcome = "local_only"
        reason = f"Low shareability (score={score}) — kept on-device."

    return {"mem_id": mem_id, "outcome": outcome, "score": score, "factors": factors, "reason": reason}