from __future__ import annotations

import hashlib
import re
from pathlib import Path
from typing import Any
import yaml


class PatternExtractor:
    def __init__(self, domain_dir: str | Path | None = None):
        if domain_dir:
            self.domain_dir = Path(domain_dir)
        else:
            repo_root = Path(__file__).resolve().parent.parent.parent.parent
            candidate = repo_root / "data" / "domain"
            if candidate.exists():
                self.domain_dir = candidate
            else:
                self.domain_dir = Path("data/domain")
        self.claim_patterns = self._load_yaml(self.domain_dir / "claim_patterns.yaml")
        self.pii_patterns = self._load_yaml(self.domain_dir / "pii_patterns.yaml")

    def _load_yaml(self, path: Path) -> dict[str, Any]:
        if not path.exists():
            return {}
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}

    def extract_claims(self, text: str) -> dict[str, Any]:
        claims: dict[str, Any] = {}
        for name, spec in self.claim_patterns.items():
            pattern = spec.get("pattern")
            if not pattern:
                continue
            matches = re.findall(pattern, text)
            if matches:
                # Store extracted values and unit
                claims[name] = {
                    "property": spec.get("property", name),
                    "unit": spec.get("unit", ""),
                    "values": matches,
                }
        return claims

    def detect_pii(self, text: str) -> tuple[dict[str, list[str]], str, bool]:
        detected: dict[str, list[str]] = {}
        has_pii = False
        redacted_text = text

        for name, spec in self.pii_patterns.items():
            pattern = spec.get("pattern")
            if not pattern:
                continue
            matches = list(re.finditer(pattern, text))
            if matches:
                has_pii = True
                found_tokens = [m.group(0) for m in matches]
                detected[name] = found_tokens
                # Generate redacted replacement token
                for m in matches:
                    raw_val = m.group(0)
                    placeholder = f"[REDACTED_{name.upper()}_SEC4]"
                    redacted_text = redacted_text.replace(raw_val, placeholder)

        return detected, redacted_text, has_pii

    @staticmethod
    def compute_content_hash(text: str) -> str:
        norm = " ".join(text.strip().lower().split())
        return hashlib.sha256(norm.encode("utf-8")).hexdigest()
