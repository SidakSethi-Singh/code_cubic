# 03_MEMORY_SYNC_SPEC

## 1. Memory Data Model & Store Protocol

### 1.1 Memory Model Specification
Every knowledge entity on an edge device or hub follows the exact canonical schema:

```python
class Memory:
    mem_id: str              # uuid4, stable across devices
    version: int              # starts at 1, increments on edit
    content: str
    content_hash: str         # sha256, for dedupe
    kind: str                 # note | manual | bulletin | incident | sensor | fix
    status: str                # active | superseded | disputed | tombstoned
    sync_state: str            # local_only | pending | held | synced | conflict
    scope: str                 # device | site | fleet
    authority: int             # 0=user note ... 3=official bulletin
    site_id: str
    asset_id: str | None
    asset_type: str | None
    source_device: str
    created_at: datetime
    updated_at: datetime
    expires_at: datetime | None
    payload: dict               # entities, claims, pii_flags, tags
    vectors: dict                # dense + bm25
```

### 1.2 Status vs Sync State (Independent Axes)
- `status`: Lifecycle validity in the local vector index (`active`, `superseded`, `disputed`, `tombstoned`).
- `sync_state`: Network distribution state (`local_only`, `pending`, `held`, `synced`, `conflict`).
- NEVER conflate status with sync_state. An item can be `active` locally while `held` or `local_only` by sync policy.

### 1.3 MemoryStore Protocol
```python
class MemoryStore(Protocol):
    def upsert(self, mem: Memory, *, only_if_older_than: int | None = None) -> None: ...
    def search(self, req: SearchRequest) -> list[Hit]: ...
    def get(self, ids: list[str]) -> list[Memory]: ...
    def set_status(self, ids: list[str], status: str, **extra: Any) -> None: ...
    def scan(self, flt: dict[str, Any], limit: int, offset: str | None = None) -> tuple[list[Memory], str | None]: ...
    def facets(self, key: str, flt: dict[str, Any] | None = None) -> dict[str, int]: ...
    def optimize(self) -> None: ...
```

## 2. SQLite Ledger Specification (WAL Mode)

Tables:
- `outbox(op_id TEXT PRIMARY KEY, mem_id TEXT, version INT, state TEXT, attempts INT, next_try TIMESTAMP, payload JSON, created_at TIMESTAMP)`
- `decisions(mem_id TEXT PRIMARY KEY, action TEXT, score REAL, factors_json JSON, reason TEXT, override JSON, created_at TIMESTAMP)`
- `events(id INTEGER PRIMARY KEY AUTOINCREMENT, ts TIMESTAMP, kind TEXT, payload JSON)`
- `conflicts(id TEXT PRIMARY KEY, mem_ids JSON, rule TEXT, resolution TEXT, status TEXT, created_at TIMESTAMP, details JSON)`
- `cursors(collection TEXT PRIMARY KEY, cursor_value TEXT)`
- `usage(mem_id TEXT PRIMARY KEY, hit_count INT, last_hit TIMESTAMP)`

WAL mode is enabled via `PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;`.
A crash between outbox write and Qdrant Edge write is recovered at boot via `reconcile()`.

## 3. Policy Decision Contract
Input: a `Memory` instance.
Output: `Decision {action, score, factors, reason}`.
- Actions: `local_only` | `share` | `hold`.
- Hard rules run first: PII -> `local_only`, size over budget -> `hold` or `local_only`.
- Soft factors calculate composite score:
  - Duplication penalty
  - Authority bonus
  - Semantic novelty
  - Brevity/vague penalty
- User override always wins and is logged.

## 4. Conflict Arbitration Engine (C1-C4)
- **C1**: Same `mem_id`, divergent content -> Higher authority wins, else higher version, else newer timestamp, else human review.
- **C2**: Contradictory claims -> Higher authority supersedes, loser becomes `disputed` + review queue.
- **C3**: Tombstone vs live -> Tombstone wins if authority >= local authority.
- **C4**: Local edit of official (authority >= 2) item is forbidden -> device may only annotate.
Lineage tracked as list of `{mem_id, version, action, reason, at}`.
