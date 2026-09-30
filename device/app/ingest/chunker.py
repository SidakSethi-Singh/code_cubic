"""device/app/ingest/chunker.py — Text chunking for ingestion."""

import re

class Chunker:
    def __init__(self, max_chars: int = 800, overlap_chars: int = 100):
        self.max_chars = max_chars
        self.overlap_chars = overlap_chars

    def chunk(self, text: str, kind: str = "manual") -> list[str]:
        if kind in ["bulletin", "fix", "incident", "note"] and len(text) <= self.max_chars:
            return [text]
        
        # Split on double newlines (paragraphs)
        paragraphs = re.split(r'\n\n+', text)
        chunks = []
        current_chunk = ""

        for p in paragraphs:
            if not p.strip():
                continue
            
            # If adding this paragraph exceeds max, start a new chunk
            if len(current_chunk) + len(p) + 2 > self.max_chars and current_chunk:
                chunks.append(current_chunk.strip())
                # Add overlap
                overlap_text = current_chunk[-self.overlap_chars:]
                # Try to break at a sentence in overlap
                last_period = overlap_text.rfind('. ')
                if last_period != -1:
                    current_chunk = overlap_text[last_period+2:]
                else:
                    current_chunk = overlap_text
            
            # If paragraph itself is too large, split by sentences
            if len(p) > self.max_chars:
                sentences = re.split(r'(?<=\. )|(?<=\n)', p)
                for s in sentences:
                    if len(current_chunk) + len(s) > self.max_chars and current_chunk:
                        chunks.append(current_chunk.strip())
                        overlap_text = current_chunk[-self.overlap_chars:]
                        last_period = overlap_text.rfind('. ')
                        if last_period != -1:
                            current_chunk = overlap_text[last_period+2:]
                        else:
                            current_chunk = overlap_text
                    current_chunk += s
            else:
                current_chunk += p + "\n\n"
        
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
            
        return chunks

    def chunk_with_metadata(self, text: str, kind: str, base_metadata: dict) -> list[dict]:
        chunks = self.chunk(text, kind)
        result = []
        total = len(chunks)
        for i, c in enumerate(chunks):
            result.append({
                "content": c,
                "chunk_index": i,
                "total_chunks": total,
                **base_metadata
            })
        return result
