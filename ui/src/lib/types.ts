export interface SearchHit {
  mem_id: string;
  score: number;
  fused_score: number;
  shard: string;
  branch_ranks: { branch: string; rank: number; score: number }[];
  memory: MemoryRecord;
}

export interface SearchAnswer {
  answer: string;
  confidence: number;
  confidence_label: string;
  citations: Citation[];
  low_confidence: boolean;
  model_tag: string;
  latency_ms: number;
}

export interface Citation {
  mem_id: string;
  display_id: string;
  title: string;
  authority: number;
  source: string;
}

export interface RoutingDecision {
  route: "LOCAL_SHARD" | "PEER_P2P_WIFI" | "FLEET_HUB" | "KNOWLEDGE_GAP";
  tier: number;
  label: string;
  reason: string;
  target_node: string;
  peer_device?: string | null;
  internet_egress_bytes: number;
  lan_rtt_ms: number;
  hops: number;
  air_gapped: boolean;
}

export interface NodeTopologyInfo {
  device_id?: string;
  site_id?: string;
  port?: number;
  url?: string;
  transport?: string;
  status: string;
  tier: number;
  policy?: string;
  internet_egress?: string;
}

export interface TopologyData {
  self: NodeTopologyInfo;
  peer: NodeTopologyInfo;
  hub: NodeTopologyInfo;
}

export interface SearchResponse {
  query: string;
  total_candidates: number;
  hits: SearchHit[];
  answer: SearchAnswer;
  latency: {
    embed_ms: number;
    retrieve_ms: number;
    fuse_ms: number;
    rerank_ms: number;
    total_ms: number;
  };
  routing?: RoutingDecision;
  explain_mode: boolean;
  air_gapped: boolean;
}

export interface MemoryRecord {
  mem_id: string;
  version: number;
  content: string;
  content_hash: string;
  kind: string;
  status: string;
  sync_state: string;
  scope: string;
  authority: number;
  site_id: string;
  asset_id?: string;
  asset_type?: string;
  source_device: string;
  created_at: string;
  updated_at: string;
  title?: string;
  redacted_content?: string;
  pii_spans?: { start: number; end: number; type: string }[];
}

export interface PolicyDecision {
  action: "share" | "local_only" | "hold";
  score: number;
  factors: {
    authority: number;
    dedupe: number;
    novelty: number;
    pii: number;
    size: number;
  };
  reason: string;
  rule_hits: string[];
}

export interface CaptureResult {
  memory: MemoryRecord;
  decision: PolicyDecision;
}

export interface SyncReport {
  id: string;
  pushed: SyncItem[];
  held: SyncItem[];
  pulled: SyncItem[];
  bytes_sent: number;
  bytes_baseline: number;
  saved_pct: number;
  duration_ms: number;
}

export interface SyncItem {
  mem_id: string;
  title: string;
  kind: string;
  status: string;
  reason: string;
  bytes: number;
}

export interface OutboxEntry {
  op_id: string;
  mem_id: string;
  title: string;
  state: "pending" | "synced" | "failed" | "held";
  attempts: number;
  next_retry: string;
  bytes: number;
}

export interface ConflictRecord {
  id: string;
  claim: string;
  asset_id: string;
  sources: ConflictSource[];
  winner_index: number;
  rule_trail: RuleTrailStep[];
  lineage: LineageNode[];
  status: "open" | "resolved" | "escalated";
  created_at: string;
}

export interface ConflictSource {
  mem_id: string;
  title: string;
  claim_value: string;
  authority: number;
  source_label: string;
  kind: string;
  status: "winner" | "superseded" | "disputed";
  version: number;
  updated_at: string;
}

export interface RuleTrailStep {
  rule: string;
  label: string;
  detail: string;
  decided: boolean;
}

export interface LineageNode {
  timestamp: string;
  label: string;
  detail: string;
  hash: string;
}

export interface ActivityEvent {
  id: string;
  type: "ingest" | "decision" | "push" | "pull" | "conflict";
  timestamp: string;
  title: string;
  detail: string;
  mem_id?: string;
}

export interface CloudStats {
  devices_online: number;
  devices_total: number;
  fleet_knowledge_count: number;
  inbox_pending: number;
  promoted_today: number;
  bytes_saved_fleet: number;
}

export interface DeviceEntry {
  device_id: string;
  site: string;
  link_state: "online" | "offline" | "syncing";
  last_heartbeat: string;
  local_memories: number;
  pending_sync: number;
}

export interface InboxItem {
  id: string;
  origin_device: string;
  origin_technician: string;
  content: string;
  kind: string;
  decision: PolicyDecision;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
}

export interface PromotionEntry {
  id: string;
  mem_id: string;
  title: string;
  origin_device: string;
  curator: string;
  action: string;
  timestamp: string;
}

export interface ResultsData {
  latency_p50: number;
  latency_p95: number;
  pii_leaks: number;
  bandwidth_saved_pct: number;
  crash_tests_passed: number;
  crash_tests_total: number;
  recall_at_5: { hybrid: number; dense: number; bm25: number };
  mrr: { hybrid: number; dense: number; bm25: number };
}

export type LinkState = "online" | "offline";

export interface DeviceConfig {
  id: string;
  name: string;
  site: string;
  technician: string;
  techId: string;
}

export const DEVICES: Record<string, DeviceConfig> = {
  "device-a": {
    id: "device-a",
    name: "Device A - Plant North",
    site: "Plant North",
    technician: "Asha K.",
    techId: "TK-904",
  },
  "device-b": {
    id: "device-b",
    name: "Device B - Plant South",
    site: "Plant South",
    technician: "Ravi M.",
    techId: "TK-812",
  },
};
