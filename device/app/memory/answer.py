"""device/app/memory/answer.py — Extractive answer composer. No LLM needed."""

import re
from device.app.memory.models import Hit, Memory

class AnswerComposer:
    def compose(self, query: str, hits: list[Hit], memories: dict[str, Memory]) -> tuple[str, list[dict], float]:
        if not hits:
            return "No relevant memories found.", [], 0.0

        query_words = set(re.findall(r'\w+', query.lower()))
        best_sentences = []
        citations = []
        
        for hit in hits[:3]:
            mem = memories.get(hit.mem_id)
            if not mem:
                continue
                
            sentences = [s.strip() for s in re.split(r'[.!?]+', mem.content) if s.strip()]
            if not sentences:
                sentences = [mem.content]
                
            best_sentence = ""
            best_overlap = -1
            
            for sentence in sentences:
                sentence_words = set(re.findall(r'\w+', sentence.lower()))
                overlap = len(query_words.intersection(sentence_words))
                if overlap > best_overlap:
                    best_overlap = overlap
                    best_sentence = sentence
                    
            if not best_sentence:
                best_sentence = mem.content[:200]
                
            best_sentences.append(best_sentence)
            citations.append({
                "mem_id": hit.mem_id,
                "snippet": best_sentence,
                "authority": hit.authority,
                "kind": hit.kind
            })
            
        answer_text = " | ".join(best_sentences)
        
        # Calculate confidence
        top_score = hits[0].score if hits else 0.0
        expected_max = 0.5  # arbitrary reference max for normalisation
        c_top = min(1.0, top_score / expected_max)
        
        c_gap = 0.0
        if len(hits) > 1 and top_score > 0:
            c_gap = (top_score - hits[1].score) / top_score
            
        c_count = min(1.0, len(hits) / 3.0)
        
        confidence = (0.5 * c_top) + (0.3 * c_gap) + (0.2 * c_count)
        
        return answer_text, citations, max(0.0, min(1.0, confidence))
