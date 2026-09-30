"""device/app/ingest/pii.py — PII detection for ingest pipeline.
Reuses patterns from policy.rules but adds span detection and redaction."""

import re

PII_PATTERNS = {
    "phone": r"\b(?:\+?91[-\s]?)?[6-9]\d{9}\b",
    "email": r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b",
    "api_key": r"\b(?:sk|api|key)[-_]?[A-Za-z0-9]{16,}\b",
    "employee_id": r"\bEMP-?\d{4,}\b"
}

def detect_pii(text: str) -> list[dict]:
    results = []
    for pii_type, pattern in PII_PATTERNS.items():
        for match in re.finditer(pattern, text):
            results.append({
                "type": pii_type,
                "value": match.group(0),
                "span": match.span()
            })
    return results

def has_pii(text: str) -> bool:
    return len(detect_pii(text)) > 0

def pii_flags(text: str) -> list[str]:
    flags = set()
    for pii_type, pattern in PII_PATTERNS.items():
        if re.search(pattern, text):
            flags.add(pii_type)
    return list(flags)

def redact(text: str) -> str:
    redacted_text = text
    for pii_type, pattern in PII_PATTERNS.items():
        redacted_text = re.sub(pattern, f"[REDACTED_{pii_type.upper()}]", redacted_text)
    return redacted_text
