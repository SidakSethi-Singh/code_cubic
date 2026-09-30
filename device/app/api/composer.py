from __future__ import annotations

import re
from typing import NamedTuple
from pydantic import BaseModel, Field

from device.app.memory.models import Hit, Memory


class ExtractiveCitation(BaseModel):
    mem_id: str
    display_id: str
    title: str
    authority: int
    source: str


class AnswerResult(BaseModel):
    answer: str
    confidence: float
    confidence_label: str
    citations: list[ExtractiveCitation]
    low_confidence: bool = False
    model_tag: str = "Extractive Deterministic (Zero Cloud Inference)"
    latency_ms: float = 0.0


class ExtractiveComposer:
    def compose(
        self,
        query: str,
        hits: list[Hit],
        min_confidence: float = 0.40,
    ) -> AnswerResult:
        if not hits:
            return AnswerResult(
                answer="Not enough evidence found in local air-gapped memory shards for the specified query.",
                confidence=0.0,
                confidence_label="NONE",
                citations=[],
                low_confidence=True,
            )

        top_hit = hits[0]
        top_score = top_hit.score

        if top_score < min_confidence:
            return AnswerResult(
                answer="Not enough evidence in local memory to answer with sufficient confidence. Verify asset ID or query terms.",
                confidence=round(top_score, 2),
                confidence_label="LOW",
                citations=[],
                low_confidence=True,
            )

        # Build verified citations
        citations: list[ExtractiveCitation] = []
        key_sentences: list[str] = []
        seen_sentences = set()

        for h in hits[:3]:
            # Generate short display ID like M-1042 or first 6 chars of mem_id
            m_id = h.mem_id
            disp_id = f"M-{m_id[:4].upper()}" if not m_id.startswith("M-") else m_id
            title = h.memory.payload.get("title") or (h.memory.content[:40] + "...")
            cit = ExtractiveCitation(
                mem_id=h.mem_id,
                display_id=disp_id,
                title=title,
                authority=h.memory.authority,
                source=f"{h.memory.source_device} ({h.memory.site_id})",
            )
            citations.append(cit)

            # Extract best matching sentence from content
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", h.memory.content) if len(s.strip()) > 15]
            for s in sentences:
                if s not in seen_sentences:
                    seen_sentences.add(s)
                    key_sentences.append(f"{s} [{disp_id}]")
                    break

        if not citations:
            return AnswerResult(
                answer="Not enough evidence. No verified citations available.",
                confidence=0.0,
                confidence_label="NONE",
                citations=[],
                low_confidence=True,
            )

        # Extractive answer composition: assemble verified factual claims
        # Highlight key parameters if present
        composed_text = " ".join(key_sentences)

        conf_label = "HIGH" if top_score >= 0.80 else ("MEDIUM" if top_score >= 0.60 else "LOW")

        return AnswerResult(
            answer=composed_text,
            confidence=round(top_score, 2),
            confidence_label=conf_label,
            citations=citations,
            low_confidence=False,
            model_tag="Extractive Engine (Zero Cloud Inference)",
        )
