# EdgeMind Agent Instructions & Collaboration Contract

## Roles & Domain Boundaries
1. **EDGE Role**:
   - Owns: `device/app/memory/`, `device/app/embed/`, `device/app/ingest/`, `device/app/api/search*`.
   - Sole owner of `qdrant_edge` import (`device/app/memory/store.py`).
   - Embedding models (FastEmbed BAAI/bge-small-en-v1.5 dense + Qdrant BM25 sparse).
   - Ingest pipeline with entity/claim/PII extraction, chunking, content hash.
   - Extractive answer synthesis with citations and confidence scoring.
   - 100% offline-first execution with 0 external network egress.

2. **SYNC Role**:
   - Owns: `device/app/policy/`, `device/app/sync/`, `device/app/conflicts/`, `device/app/ledger/`.
   - SQLite WAL state machine (outbox, events, decisions, conflicts, cursors, usage).
   - Policy engine (Hard rules: PII, size limit -> local_only / hold; Soft factors: authority, dedupe, novelty).
   - Conflict arbitration (C1-C4 rules: authority > version > time > human).
   - Selective CRDT-style replication & bandwidth saving metrics.

3. **UI Role**:
   - Owns: `ui/` (Next.js, TypeScript, Tailwind CSS, Recharts, TanStack Query).
   - Pixel-perfect recreation of high-contrast flat industrial telemetry console.
   - Live interaction with Device A (8001), Device B (8002), and Hub (8000).
   - All 6 demo beats: Offline search, capture + policy triage, sync reconnection, conflict arbitration, fleet learning, proof benchmarks.

## Code Standards
- Zero dummy data / zero demo placeholders in real workflows: actual vector similarity, real SQLite state, real hashes, real citations.
- Typed Python 3.11+ using Pydantic v2 models.
- Deterministic fallback for all extractive/synthesis operations.
