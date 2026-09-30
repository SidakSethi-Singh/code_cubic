# EdgeMind — AI-Powered Edge Memory & Intelligence Platform

> Offline-first AI memory for field devices with intelligent sync, conflict resolution, and fleet learning.

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+ (for UI, optional)

### Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Check environment
make doctor

# Generate seed data
make seed
```

### Run
```bash
# Terminal 1: Start Cloud Hub
make hub

# Terminal 2: Start Device A
make device-a

# Terminal 3: Start Device B (optional)
make device-b
```

### Demo
```bash
# Run the full sync demo (no UI needed)
make demo
```

### API
- Device A: http://localhost:8001/docs
- Device B: http://localhost:8002/docs
- Cloud Hub: http://localhost:8765/docs

## Architecture
Three layers:
1. **Edge Memory** — Qdrant Edge shard: dense + BM25 hybrid search, offline-first
2. **Memory Control Plane** — Policy engine, outbox, conflict resolution, decision logging
3. **Fleet Cloud** — Qdrant Server + FastAPI hub with curator

## Team
- **Edge** (Dhruv): Memory store, embeddings, hybrid search, ingest, answer composer
- **Sync**: Policy engine, outbox/push/pull, conflict resolution, cloud hub
- **UI**: Device dashboard, cloud console, scenario runner
