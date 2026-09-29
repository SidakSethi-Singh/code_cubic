"""device/app/policy/rules.py — HARD rules, run first, short-circuit scoring."""
import re

PII_PATTERNS = {
    "phone": re.compile(r"\b(?:\+?91[-\s]?)?[6-9]\d{9}\b"),
    "email": re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"),
    "api_key": re.compile(r"\b(?:sk|api|key)[-_]?[A-Za-z0-9]{16,}\b", re.I),
    "employee_id": re.compile(r"\bEMP-?\d{4,}\b", re.I),
}
MAX_SHAREABLE_CHARS = 4000
MAX_LOCAL_CHARS = 20000

def detect_pii(text: str) -> list[str]:
    return [name for name, p in PII_PATTERNS.items() if p.search(text)]

def size_verdict(text: str) -> str | None:
    n = len(text)
    if n > MAX_LOCAL_CHARS:
        return "local_only"
    if n > MAX_SHAREABLE_CHARS:
        return "hold"
    return None

def apply_hard_rules(text: str) -> dict | None:
    pii_hits = detect_pii(text)
    if pii_hits:
        return {
            "outcome": "local_only", "score": 0.0,
            "factors": {"pii_detected": pii_hits},
            "reason": f"Contains PII/secret pattern(s): {', '.join(pii_hits)} — kept on-device.",
        }
    size_hit = size_verdict(text)
    if size_hit:
        return {
            "outcome": size_hit, "score": 0.0,
            "factors": {"size_chars": len(text)},
            "reason": f"Content is {len(text)} chars — exceeds shareable size limit, set to '{size_hit}'.",
        }
    return None

    