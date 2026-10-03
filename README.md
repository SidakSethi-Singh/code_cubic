# EdgeMind: Offline-First Industrial AI Memory & Smart P2P Routing

> **Zero-Egress On-Device Vector Memory, Anti-Data Breach Policy Shield, and 3-Tier Peer Mesh for Critical Edge Infrastructure.**

---

## ⚡ Executive Summary

Modern industrial facilities, field operations, and privacy-sensitive small businesses cannot afford cloud latency or data breach liability. **EdgeMind** delivers an air-gapped, offline-first AI memory system that runs 100% locally on edge devices (turbines, factory hubs, robotics, field laptops) with **0 external network sockets** during routine operations.

When edge devices need broader intelligence, EdgeMind's **Smart Query Router** coordinates peer-to-peer over local WiFi subnet meshes before ever escalating to central fleet clouds—guaranteeing sub-5ms query resolution, zero cloud data leaks, and 99.2% bandwidth compression.

---

## 🏛 The 6 Architectural Pillars

Directly implementing the EdgeMind industrial blueprint:

```
                      +-----------------------------+
                      |       Field Operator        |
                      +-----------------------------+
                                     │ (Natural Language Search)
                                     ▼
                      +─────────────────────────────+
                      │   SMART QUERY ROUTER        │
                      +─────────────────────────────+
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
   ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
   │    TIER 1     │         │    TIER 2     │         │    TIER 3     │
   │  Local Shard  │         │ WiFi P2P Mesh │         │  Fleet Cloud  │
   │  Qdrant Edge  │         │ (Subnet Peer) │         │ (Only Online) │
   └───────┬───────┘         └───────┬───────┘         └───────┬───────┘
           │                         │                         │
     0.00ms RTT                1-3ms LAN RTT             Cloud Escalate
     0B Outbound               0B Internet Egress        Strict Policy
     Air-Gapped                Local Subnet Only         Admin Audited
```

1. **Local Extractive Synthesis Brain:** Deterministic, hallucination-free answer composer citing exact on-device manuals and incident reports without external LLM API dependencies.
2. **Embedded Edge Shard (Qdrant Edge):** Native Rust embedded vector database running in-process with WAL durability directly on device disk.
3. **Offline Hybrid RAG:** Dense embeddings (`FastEmbed BAAI/bge-small-en-v1.5`) + Sparse lexical (`Qdrant BM25`) fused via Reciprocal Rank Fusion ($k=60$).
4. **SQLite WAL Memory Ledger:** ACID-compliant state machine tracking memory lifecycles, outbox queues, cryptographic SHA-256 hashes, and audit decisions.
5. **Selective CRDT Replication:** Bandwidth-optimized delta synchronization with C1–C4 authority arbitration (Authority > Version > Time > Human).
6. **Smart Query Router (Multi-Tier Dispatch):** Dynamically dispatches queries across Tier 1 (Local), Tier 2 (WiFi P2P Subnet Peer), and Tier 3 (Central Fleet Hub).

---

## 🛰 Network Topology & Service Matrix

EdgeMind operates 4 coordinated topology services:

| Node | Service | Port | Role | Air-Gap Status |
| :--- | :--- | :--- | :--- | :--- |
| **Console** | Next.js Industrial UI | `3000` | Real-time industrial telemetry, hop visualizer, conflict diff bar | Local UI |
| **Hub** | Fleet Control Plane | `8000` | Global fleet knowledge catalog, node heartbeats, sync inbox | Central Sync |
| **Device A** | Edge Node (Plant North) | `8001` | P-204 Slurry Pump local memory, policy triage, smart router | **AIR-GAPPED (0 Egress)** |
| **Device B** | Edge Node (Plant South) | `8002` | T-34 Turbine / C-102 Compressor memory, WiFi P2P mesh peer | **AIR-GAPPED (0 Egress)** |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python:** 3.11+ (Python 3.11 – 3.14 verified)
- **Node.js:** 20+ and npm

### 1. Installation
Clone the repository and install backend and frontend dependencies:
```bash
# Clone repository
git clone https://github.com/SidakSethi-Singh/code_cubic.git
cd code_cubic

# Install Python requirements
pip install -r requirements.txt

# Install UI packages
cd ui
npm install
cd ..
```

### 2. Launch All Services (One Command)
Run the master topology launcher to start all 4 services concurrently:
```bash
python scripts/run_project.py
```

All 4 services will boot and connect:
- **Telemetry UI:** [http://localhost:3000](http://localhost:3000)
- **Device A API & Docs:** [http://localhost:8001/docs](http://localhost:8001/docs)
- **Device B API & Docs:** [http://localhost:8002/docs](http://localhost:8002/docs)
- **Fleet Central Hub API & Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🎬 Live Demo Walkthrough (The 6 Demo Beats)

Open **[http://localhost:3000/device/device-a](http://localhost:3000/device/device-a)** in your browser:

### Beat 1: Air-Gapped Search & 0-Egress Invariant
1. Inspect the glowing top header badge: `AIR-GAP INVARIANT: 0 OUTBOUND SOCKETS, RTT: 0.00ms`.
2. Click the green preset: **`Tier 1 (Local)`** (`P-204 grinding noise at high load`).
3. Click **Search**:
   - Query resolves in **~4.2ms**.
   - **Smart Query Routing Engine** highlights `Tier 1: Local Qdrant Shard`.
   - `Internet Egress: 0 Bytes` verified.
   - Extractive synthesis synthesizes verified procedures from manuals `[M-0871]` and `[M-1042]`.

### Beat 2: P2P WiFi Mesh Query (Anti-Data Breach Routing)
1. Click the amber preset: **`Tier 2 (WiFi P2P)`** (`C-102 gas compressor cavitation`).
2. Click **Search**:
   - Device A detects low local confidence and dispatches over the local WiFi subnet to **Device B (Plant South)**.
   - Hop chain illuminates `Tier 2 (WiFi P2P)`.
   - Resolves Device B's compressor maintenance standard without touching the internet.

### Beat 3: Knowledge Gap Detection (No Hallucinations)
1. Click the preset: **`Tier 0 (Gap)`** (`unknown turbine seal leak`).
2. Click **Search**:
   - The engine detects zero matching vectors.
   - Rather than hallucinating, it renders an air-gapped **Knowledge Gap Ticket** (`GAP-ID: GAP-2026-081`) registered into the SQLite WAL for hub engineering triage upon reconnect.

### Beat 4: Field Note Ingestion & PII Shield
1. Navigate to **Capture Note** (`/device/device-a/activity`).
2. Paste field observations containing sensitive data (e.g., technician phone numbers, credit card tokens, or internal API keys).
3. The **Policy Engine** flags PII, redacts sensitive tokens, and locks synchronization state to `local_only`.

### Beat 5: Conflict Arbitration & Parametric Delta Diff
1. Navigate to **Conflicts** (`/device/device-a/conflicts`).
2. Open conflict **`CONF-P204-01`** (P-204 Coupling Torquing Calibration Standard).
3. Inspect the side-by-side diff:
   - Field observation: `210 Nm` (Over-torqued report).
   - Baseline manual: `145 Nm` (Fleet Engineering Authority 3).
4. Drag the **Parametric Delta Slider** and click **Arbitrate by Authority Rule**.
5. Click **Resolve Conflict** to commit the cryptographic resolution into the SQLite ledger.

### Beat 6: Fleet Hub Control Plane & Proof Benchmarks
1. Open **Fleet Hub** (`/cloud`): Inspect live node heartbeats, sync inboxes, and global manuals.
2. Open **Proof Benchmarks** (`/results`): Verify latency comparisons (4.2ms vs. 1,420ms cloud), 99.2% sync compression, and energy metrics.

---

## 🔒 Security & Policy Invariants

EdgeMind enforces three immutable safety invariants:

| Invariant | Mechanism | Enforcement |
| :--- | :--- | :--- |
| **Anti-Data Breach** | Regex PII Detector + Token Masker | Any record containing PII is automatically assigned `sync_state: local_only` and blocked from cloud replication. |
| **Cryptographic Provenance** | SHA-256 Content Hashing | Every memory payload is hashed at ingest. Mutated records trigger automatic version vector branch detection. |
| **Deterministic Arbitration** | C1–C4 Hierarchical Rule Engine | Conflicts are resolved by: 1) Engineering Authority $\rightarrow$ 2) Version Vector $\rightarrow$ 3) Lamport Timestamp $\rightarrow$ 4) Human Sign-Off. |

---

## 📊 Proof & Performance Benchmarks

```
[Search Latency]
  EdgeMind (Qdrant Edge Local):  ██ 4.2ms
  Cloud LLM RAG (OpenAI / AWS):  ████████████████████████████████████ 1,420.0ms  (338x Faster)

[Network Egress per Query]
  EdgeMind (Air-Gapped Shard):   0 Bytes  (100% Leak Proof)
  Cloud RAG Provider:            ~3.8 KB

[Replication Bandwidth]
  Raw Vector Retransmission:     1.24 MB
  EdgeMind Delta CRDT Sync:      9.80 KB  (99.2% Bandwidth Saved)
```

---

## 🛠 Tech Stack

- **Edge Runtime:** Python 3.11+, FastAPI, Uvicorn, Pydantic v2
- **Vector Engine:** Qdrant Edge (`qdrant-edge-py` embedded Rust engine)
- **Embeddings:** FastEmbed (`BAAI/bge-small-en-v1.5` dense + `Qdrant BM25` sparse)
- **Ledger:** SQLite 3 WAL (Write-Ahead Logging)
- **P2P Networking:** HTTPX async mesh client
- **Frontend Console:** Next.js 16 (Turbopack), TypeScript, Tailwind CSS, Lucide Icons, Recharts

---

## 🧪 Testing & Verification

Run the automated test suite verifying edge memory store, hybrid fusion, policy engine, and CRDT sync:
```bash
python -m pytest device/tests/
```

Verify Next.js production build:
```bash
cd ui && npm run build
```

---

## 📄 License & Attribution

Designed and engineered for **Advanced Industrial Edge AI & Zero-Trust Infrastructure**. Open-source under the Apache 2.0 License.
