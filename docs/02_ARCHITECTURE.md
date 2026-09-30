# 02_ARCHITECTURE

## 4. Edge Vector Engine & Storage Architecture

### 4.1 Two-Shard Layout
Edge devices maintain two distinct Qdrant Edge shards:
1. `device_memory` (Mutable, P0):
   - Holds all locally authored memories, notes, incident fixes, and telemetry captures.
   - Holds records pulled from the fleet and accepted into local runtime.
   - Backed by an on-disk Qdrant Edge shard at `data/shards/device_memory`.
2. `fleet_mirror` (Immutable, P1):
   - Holds baseline authoritative manuals, OEM engineering directives, and fleet baseline knowledge snapshots.
   - Backed by an on-disk Qdrant Edge shard at `data/shards/fleet_mirror`.

### 4.2 Multi-Vector Specification
- **Dense Vector**:
  - Model: `BAAI/bge-small-en-v1.5` (via `fastembed.TextEmbedding`).
  - Dimension: 384.
  - Metric: Cosine Distance.
  - Documents embedded via `embed()`, queries via `query_embed()`.
- **Sparse Vector (BM25)**:
  - Model: `Qdrant/bm25` (via `fastembed.SparseTextEmbedding`).
  - Metric: Dot product with IDF modifier.
  - Preserves exact technical terms, asset codes (e.g. `P-204`, `SKF-7314`, `145 Nm`).

### 4.3 Search & Reciprocal Rank Fusion
1. Prefetch Top-K from Dense (`Query.Nearest(dense_vector, using="dense")`).
2. Prefetch Top-K from Sparse (`Query.Nearest(sparse_vector, using="bm25")`).
3. Reciprocal Rank Fusion:
   $$RRF\_Score = \sum \frac{1}{60 + rank}$$
4. Rerank by Authority and Recency:
   $$Final\_Score = RRF\_Score \times (1.0 + 0.15 \times authority) \times recency\_decay$$
5. Deduplication across shards prioritizing `device_memory` over `fleet_mirror`.

## 5. Policy Engine & Selective Replication Architecture

### 5.1 Hard Rules vs Soft Factors
- **Hard Rules**:
  - PII Detection: Any memory containing telephone numbers, emails, employee IDs, or credentials is fixed as `local_only`.
  - Byte Budget: Any payload exceeding the configured threshold (e.g. >25KB note or >2MB raw sensor telemetry) is forced to `hold` or `local_only`.
- **Soft Factors**:
  - Duplication Factor: High penalty (-0.4) if content hash or near-duplicate matches existing synced records.
  - Authority Factor: Positive bonus (+0.3) if authority >= 2.
  - Novelty Factor: Positive bonus (+0.2) for unique failure patterns or assets.
  - Information Density Factor: Penalty (-0.3) for short or vague logs lacking structured claims.
- **Explainability**: Every decision records all active factor weights, rule matches, and human-readable justification.

### 5.2 Outbox & Pull State Machine
- SQLite WAL mode ensures transactional durability across outbox status changes: `NEW` -> `PENDING` -> `SYNCED` | `FAILED`.
- Crash safety invariant: Write outbox entry in state `NEW` before disk mutations. Boot reconciliation (`reconcile()`) safely resumes uncommitted records.

## 8. Conflict Arbitration & CRDT Lineage

### 8.1 Resolution Rules (C1-C4)
- **C1 (Identity Conflict)**: Same `mem_id`, divergent content -> Highest authority wins. If equal, highest version wins. If equal, newest timestamp wins. If identical, human triage required.
- **C2 (Contradictory Claims)**: Divergent specification claims across different records (e.g., 40 Nm vs 45 Nm torque on P-204) -> Highest authority supersedes; lower authority item transitions to `disputed` status and is added to the plant review queue.
- **C3 (Tombstone vs Live)**: Tombstone deletion wins if tombstone authority >= live authority.
- **C4 (Official Immutability)**: Local edits to official records (authority >= 2) are strictly forbidden; field devices may only create linked child annotations.

### 8.2 Invariants
- **I1 (No Leakage)**: PII or `local_only` items never transmit across the network.
- **I2 (Idempotency)**: Replaying an outbox sync batch yields an identical system state.
- **I3 (Profile Freshness)**: Pull guarantees the edge device converges to the latest authoritative version relevant to its asset profile.
- **I6 (Air-Gap Testability)**: When link state is `offline`, zero network connections or sockets are attempted.
- **I7 (Authority Monotonicity)**: Lower authority records can never silently overwrite higher authority records.
