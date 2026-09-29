"""device/app/policy/factors.py — SOFT scoring, word-overlap, no embeddings needed."""

AUTHORITY_MAP = {"bulletin": 3, "manual": 2, "incident": 1, "fix": 1, "note": 0, "sensor": 0}

def authority_score(kind: str) -> float:
    return AUTHORITY_MAP.get(kind, 0)

def _tokenize(text: str) -> set[str]:
    return set(w.lower().strip(".,!?") for w in text.split() if len(w) > 2)

def novelty_score(text: str, existing_texts: list[str]) -> float:
    if not existing_texts:
        return 1.0
    tokens = _tokenize(text)
    if not tokens:
        return 1.0
    best_overlap = 0.0
    for other in existing_texts:
        other_tokens = _tokenize(other)
        if not other_tokens:
            continue
        overlap = len(tokens & other_tokens) / len(tokens | other_tokens)
        best_overlap = max(best_overlap, overlap)
    return round(1.0 - best_overlap, 3)

def is_near_duplicate(text: str, existing_texts: list[str], threshold: float = 0.85) -> bool:
    return novelty_score(text, existing_texts) < (1 - threshold)

def vagueness_penalty(text: str) -> float:
    words = text.split()
    if len(words) < 6:
        return 0.5
    if len(words) < 12:
        return 0.2
    return 0.0

def soft_score(text: str, kind: str, existing_texts: list[str]) -> tuple[float, dict]:
    auth = authority_score(kind)
    nov = novelty_score(text, existing_texts)
    vague = vagueness_penalty(text)
    score = round(min(1.0, max(0.0, 0.4 * (auth / 3) + 0.4 * nov - vague)), 3)
    factors = {
        "authority": auth, "novelty": nov,
        "vagueness_penalty": vague, "near_duplicate": nov < 0.15,
    }
    return score, factors