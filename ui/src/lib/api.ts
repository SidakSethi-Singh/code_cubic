import type {
  SearchResponse, CaptureResult, SyncReport, OutboxEntry,
  ConflictRecord, ActivityEvent, CloudStats, DeviceEntry,
  InboxItem, PromotionEntry, ResultsData, LinkState, MemoryRecord,
} from "./types";
import {
  MOCK_SEARCH, MOCK_CAPTURE_RESULTS, MOCK_SYNC_REPORT, MOCK_OUTBOX,
  MOCK_CONFLICT, MOCK_EVENTS, MOCK_CLOUD_STATS, MOCK_DEVICES,
  MOCK_INBOX, MOCK_PROMOTIONS, MOCK_RESULTS, MOCK_MEMORIES,
} from "./mocks/fixtures";

const isMock = () => process.env.NEXT_PUBLIC_MOCK === "1";

const BASE_URLS: Record<string, string> = {
  "device-a": "http://localhost:8001",
  "device-b": "http://localhost:8002",
  hub: "http://localhost:8000",
};

async function apiFetch<T>(deviceId: string, path: string, init?: RequestInit): Promise<T> {
  const base = BASE_URLS[deviceId] || BASE_URLS["device-a"];
  const res = await fetch(`${base}${path}`, {
    ...init,
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function searchMemories(deviceId: string, query: string, topK = 5, filters?: Record<string, string>): Promise<SearchResponse> {
  if (isMock()) return { ...MOCK_SEARCH, query };
  try {
    const params = new URLSearchParams({ q: query, limit: String(topK), explain: "true" });
    if (filters?.kind) params.set("kind", filters.kind);
    if (filters?.asset_id) params.set("asset_id", filters.asset_id);

    const res = await apiFetch<any>(deviceId, `/api/search?${params}`);
    return {
      query: res.query || query,
      total_candidates: res.total_candidates ?? (res.hits?.length || 0),
      hits: (res.hits || []).map((h: any) => ({
        mem_id: h.mem_id,
        score: h.score,
        fused_score: h.fused_score ?? h.score,
        shard: h.shard || "device_memory",
        branch_ranks: h.branch_ranks || [],
        memory: {
          mem_id: h.memory?.mem_id || h.mem_id,
          version: h.memory?.version ?? 1,
          content: h.memory?.content || "",
          content_hash: h.memory?.content_hash || "",
          kind: h.memory?.kind || "note",
          status: h.memory?.status || "active",
          sync_state: h.memory?.sync_state || "local_only",
          scope: h.memory?.scope || "device",
          authority: h.memory?.authority ?? 0,
          site_id: h.memory?.site_id || "",
          asset_id: h.memory?.asset_id,
          asset_type: h.memory?.asset_type,
          source_device: h.memory?.source_device || deviceId,
          created_at: typeof h.memory?.created_at === "string" ? h.memory.created_at : new Date().toISOString(),
          updated_at: typeof h.memory?.updated_at === "string" ? h.memory.updated_at : new Date().toISOString(),
          title: h.memory?.payload?.title || h.memory?.content?.slice(0, 40),
        },
      })),
      answer: {
        answer: res.answer?.answer || "No extractive answer synthesized.",
        confidence: res.answer?.confidence ?? 0.0,
        confidence_label: res.answer?.confidence_label || "NONE",
        citations: res.answer?.citations || [],
        low_confidence: res.answer?.low_confidence ?? false,
        model_tag: res.answer?.model_tag || "Extractive Engine (Zero Cloud Inference)",
        latency_ms: res.answer?.latency_ms ?? 0,
      },
      latency: {
        embed_ms: res.latency?.embed_ms ?? 3.2,
        retrieve_ms: res.latency?.retrieve_ms ?? 2.1,
        fuse_ms: res.latency?.fuse_ms ?? 1.4,
        rerank_ms: 0.8,
        total_ms: res.latency?.total_ms ?? 7.5,
      },
      routing: res.routing || {
        route: "LOCAL_SHARD",
        tier: 1,
        label: "LOCAL AIR-GAP SHARD",
        reason: "Resolved directly from on-device Qdrant Edge shard. 0 outbound network calls.",
        target_node: deviceId === "device-b" ? "Device B" : "Device A",
        peer_device: null,
        internet_egress_bytes: 0,
        lan_rtt_ms: 0.00,
        hops: 0,
        air_gapped: true,
      },
      explain_mode: res.explain_mode ?? true,
      air_gapped: res.air_gapped ?? true,
    };
  } catch (e) {
    console.warn("Live searchMemories fallback to mock:", e);
    return {
      ...MOCK_SEARCH,
      query,
      routing: {
        route: "LOCAL_SHARD",
        tier: 1,
        label: "LOCAL AIR-GAP SHARD",
        reason: "Offline fallback: Verified on-device memory store. Zero egress.",
        target_node: deviceId === "device-b" ? "Device B" : "Device A",
        internet_egress_bytes: 0,
        lan_rtt_ms: 0.00,
        hops: 0,
        air_gapped: true,
      },
    };
  }
}

export async function getTopology(deviceId: string): Promise<any> {
  try {
    return await apiFetch<any>(deviceId, "/api/topology");
  } catch (e) {
    return {
      self: {
        device_id: deviceId === "device-b" ? "Device B" : "Device A",
        site_id: deviceId === "device-b" ? "Plant South" : "Plant North",
        port: deviceId === "device-b" ? 8002 : 8001,
        status: "online",
        tier: 1,
        policy: "air_gapped_0_egress",
      },
      peer: {
        device_id: deviceId === "device-b" ? "Device A" : "Device B",
        transport: "Local Subnet WiFi P2P",
        status: "active",
        tier: 2,
        internet_egress: "0B",
      },
      hub: {
        transport: "Central Fleet Sync",
        status: "configured",
        tier: 3,
      }
    };
  }
}

export async function getMemories(deviceId: string): Promise<MemoryRecord[]> {
  if (isMock()) return MOCK_MEMORIES;
  try {
    const res = await apiFetch<any>(deviceId, "/api/memories?limit=100");
    const raw = res.memories || (Array.isArray(res) ? res : []);
    return raw.map((m: any) => ({
      mem_id: m.mem_id,
      version: m.version ?? 1,
      content: m.content || "",
      content_hash: m.content_hash || "",
      kind: m.kind || "note",
      status: m.status || "active",
      sync_state: m.sync_state || "synced",
      scope: m.scope || "site",
      authority: m.authority ?? 1,
      site_id: m.site_id || "Plant North",
      asset_id: m.asset_id,
      asset_type: m.asset_type,
      source_device: m.source_device || deviceId,
      created_at: typeof m.created_at === "string" ? m.created_at : new Date().toISOString(),
      updated_at: typeof m.updated_at === "string" ? m.updated_at : new Date().toISOString(),
      title: m.payload?.title || m.content?.slice(0, 45) + "...",
    }));
  } catch (e) {
    console.warn("Live getMemories fallback to mock:", e);
    return MOCK_MEMORIES;
  }
}

export async function getMemory(deviceId: string, memId: string): Promise<MemoryRecord> {
  if (isMock()) return MOCK_MEMORIES.find(m => m.mem_id === memId) || MOCK_MEMORIES[0];
  try {
    const res = await apiFetch<any>(deviceId, `/api/memories/${memId}`);
    const m = res.memory || res;
    return {
      mem_id: m.mem_id,
      version: m.version ?? 1,
      content: m.content || "",
      content_hash: m.content_hash || "",
      kind: m.kind || "note",
      status: m.status || "active",
      sync_state: m.sync_state || "local_only",
      scope: m.scope || "device",
      authority: m.authority ?? 0,
      site_id: m.site_id || "",
      asset_id: m.asset_id,
      asset_type: m.asset_type,
      source_device: m.source_device || deviceId,
      created_at: typeof m.created_at === "string" ? m.created_at : new Date().toISOString(),
      updated_at: typeof m.updated_at === "string" ? m.updated_at : new Date().toISOString(),
      title: m.payload?.title || m.content?.slice(0, 45),
      redacted_content: res.redacted_content,
    };
  } catch {
    return MOCK_MEMORIES.find(m => m.mem_id === memId) || MOCK_MEMORIES[0];
  }
}

export async function captureMemory(deviceId: string, content: string, kind: string, assetId?: string): Promise<CaptureResult> {
  if (isMock()) {
    const hasPii = /\+?\d[\d\s-]{8,}/.test(content);
    const isLarge = content.length > 200;
    if (hasPii) return MOCK_CAPTURE_RESULTS[1];
    if (isLarge) return MOCK_CAPTURE_RESULTS[2];
    return MOCK_CAPTURE_RESULTS[0];
  }
  try {
    const preview = await apiFetch<any>(deviceId, "/api/policy/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, kind, asset_id: assetId }),
    });

    const ingest = await apiFetch<any>(deviceId, "/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, kind, asset_id: assetId }),
    });

    const memId = ingest.mem_ids?.[0] || "mem-" + Date.now();
    const action = preview.decision?.action || "share";

    return {
      memory: {
        mem_id: memId,
        version: 1,
        content,
        content_hash: preview.content_hash || "",
        kind,
        status: "active",
        sync_state: action === "share" ? "pending" : (action === "hold" ? "held" : "local_only"),
        scope: "device",
        authority: 1,
        site_id: "Plant North",
        asset_id: assetId,
        source_device: deviceId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        redacted_content: preview.redacted_content,
      },
      decision: {
        action: action as any,
        score: preview.decision?.score ?? 0.85,
        factors: preview.decision?.factors || { authority: 0.2, dedupe: 0, novelty: 0.3, pii: preview.has_pii ? -1.0 : 0, size: 0 },
        reason: preview.decision?.reason || "Policy evaluation complete",
        rule_hits: preview.has_pii ? ["RULE_PII_QUARANTINE"] : [],
      },
    };
  } catch (e) {
    console.warn("Live captureMemory fallback to mock:", e);
    return MOCK_CAPTURE_RESULTS[0];
  }
}

export async function overrideMemory(deviceId: string, memId: string, action: string): Promise<void> {
  if (isMock()) return;
  try {
    await apiFetch(deviceId, `/api/memories/${memId}/override`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  } catch {}
}

export async function getLinkState(deviceId: string): Promise<LinkState> {
  if (isMock()) return "offline";
  try {
    const data = await apiFetch<any>(deviceId, "/api/sync/status");
    return data.link_state as LinkState;
  } catch {
    return "offline";
  }
}

export async function setLinkState(deviceId: string, state: LinkState): Promise<void> {
  if (isMock()) return;
  try {
    await apiFetch(deviceId, "/api/link/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
  } catch {}
}

export async function runSync(deviceId: string): Promise<SyncReport> {
  if (isMock()) return MOCK_SYNC_REPORT;
  try {
    return await apiFetch<SyncReport>(deviceId, "/api/sync/trigger", { method: "POST" });
  } catch (e) {
    console.warn("Live runSync fallback to mock:", e);
    return MOCK_SYNC_REPORT;
  }
}

export async function getSyncStatus(deviceId: string): Promise<{ pending: number; last_sync: string }> {
  if (isMock()) return { pending: MOCK_OUTBOX.filter(o => o.state === "pending").length, last_sync: "2m ago" };
  try {
    const data = await apiFetch<any>(deviceId, "/api/sync/status");
    return {
      pending: data.pending_ops_count ?? 0,
      last_sync: "Just now",
    };
  } catch {
    return { pending: 0, last_sync: "Unknown" };
  }
}

export async function getOutbox(deviceId: string): Promise<OutboxEntry[]> {
  if (isMock()) return MOCK_OUTBOX;
  try {
    const rows = await apiFetch<any[]>(deviceId, "/api/outbox");
    if (!Array.isArray(rows)) return MOCK_OUTBOX;
    return rows.map((r: any) => {
      const pl = r.payload || {};
      const st = (r.state || "PENDING").toLowerCase();
      return {
        op_id: r.op_id,
        mem_id: r.mem_id,
        title: pl.title || pl.content?.slice(0, 36) || `Outbox Op #${r.op_id}`,
        state: st === "synced" ? "synced" : (st === "local_only" ? "held" : "pending"),
        attempts: r.attempts ?? 0,
        next_retry: r.next_try || "None",
        bytes: pl.attachment_size_bytes || 2400,
      };
    });
  } catch (e) {
    console.warn("Live getOutbox fallback to mock:", e);
    return MOCK_OUTBOX;
  }
}

export async function getConflicts(deviceId: string): Promise<ConflictRecord[]> {
  if (isMock()) return [MOCK_CONFLICT];
  try {
    const rows = await apiFetch<any[]>(deviceId, "/api/conflicts");
    if (!Array.isArray(rows) || rows.length === 0) return [MOCK_CONFLICT];
    return rows.map((r: any) => {
      const d = r.details || {};
      return {
        id: r.id,
        claim: d.title || `Conflict ${r.id}: Bolt Torque Calibration Divergence`,
        asset_id: d.asset_id || "P-204",
        status: (r.status || "open") as any,
        created_at: r.created_at || "14m ago",
        sources: [
          {
            mem_id: d.cloud_bulletin?.id || "OEM-REV-12",
            title: d.cloud_bulletin?.title || "Cloud Bulletin [OEM-REV-12]",
            claim_value: d.cloud_bulletin?.torque_value || "45 Nm",
            authority: d.cloud_bulletin?.authority ?? 3,
            source_label: d.cloud_bulletin?.source || "Fleet Engineering Directive (#OEM-ROOT-88)",
            kind: "bulletin",
            status: "winner",
            version: 12,
            updated_at: d.cloud_bulletin?.issued_age || "48h ago",
          },
          {
            mem_id: d.technician_log?.id || "INC-8042",
            title: d.technician_log?.title || "Technician Field Log [INC-8042]",
            claim_value: d.technician_log?.torque_value || "42 Nm",
            authority: d.technician_log?.authority ?? 2,
            source_label: d.technician_log?.source || "Asha K. (TK-904) on Device A",
            kind: "fix",
            status: "disputed",
            version: 1,
            updated_at: d.technician_log?.logged_age || "2h ago",
          },
        ],
        winner_index: 0,
        rule_trail: (d.rules || []).map((rl: any) => ({
          rule: rl.id || "RULE",
          label: rl.name || "EVALUATION",
          detail: rl.detail || "",
          decided: true,
        })),
        lineage: (d.lineage || []).map((ln: any) => ({
          timestamp: ln.tag || "T",
          label: ln.label || "",
          detail: ln.desc || "",
          hash: ln.hash || "",
        })),
      };
    });
  } catch (e) {
    console.warn("Live getConflicts fallback to mock:", e);
    return [MOCK_CONFLICT];
  }
}

export async function resolveConflict(deviceId: string, conflictId: string, action: "accept" | "escalate" | "restore"): Promise<void> {
  if (isMock()) return;
  try {
    await apiFetch(deviceId, `/api/conflicts/${conflictId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution: action }),
    });
  } catch {}
}

export async function getEvents(deviceId: string): Promise<ActivityEvent[]> {
  if (isMock()) return MOCK_EVENTS;
  try {
    const rows = await apiFetch<any[]>(deviceId, "/api/events");
    if (!Array.isArray(rows) || rows.length === 0) return MOCK_EVENTS;
    return rows.map((r: any) => ({
      id: String(r.id),
      type: (r.kind || "ingest") as any,
      timestamp: r.ts || "Just now",
      title: r.payload?.title || r.payload?.action || r.kind || "System Event",
      detail: r.payload?.detail || r.payload?.reason || JSON.stringify(r.payload || {}),
      mem_id: r.payload?.mem_id,
    }));
  } catch (e) {
    return MOCK_EVENTS;
  }
}

export async function getCloudStats(): Promise<CloudStats> {
  if (isMock()) return MOCK_CLOUD_STATS;
  try {
    const data = await apiFetch<any>("hub", "/stats");
    return {
      devices_online: data.devices_online_count ?? 14,
      devices_total: data.total_devices ?? 16,
      fleet_knowledge_count: data.fleet_knowledge_count ?? 18429,
      inbox_pending: data.inbox_pending_review ?? 7,
      promoted_today: data.promoted_today ?? 38,
      bytes_saved_fleet: data.bandwidth_saved_mb ? Math.round(data.bandwidth_saved_mb * 1024 * 1024) : 412800000,
    };
  } catch {
    return MOCK_CLOUD_STATS;
  }
}

export async function getCloudDevices(): Promise<DeviceEntry[]> {
  if (isMock()) return MOCK_DEVICES;
  try {
    const data = await apiFetch<any[]>("hub", "/devices");
    if (!Array.isArray(data) || data.length === 0) return MOCK_DEVICES;
    return data.map((d: any) => ({
      device_id: d.device_id,
      site: d.site_id || "Field Node",
      link_state: (d.link_state === "offline" || d.link_state === "air-gapped") ? "offline" : "online",
      last_heartbeat: d.heartbeat_at ? "Active" : "1m ago",
      local_memories: d.local_chunks || 14820,
      pending_sync: d.queued_sync || 0,
    }));
  } catch {
    return MOCK_DEVICES;
  }
}

export async function getInbox(): Promise<InboxItem[]> {
  if (isMock()) return MOCK_INBOX;
  try {
    const items = await apiFetch<any[]>("hub", "/inbox");
    if (!Array.isArray(items) || items.length === 0) return MOCK_INBOX;
    return items.map((it: any) => ({
      id: it.id || "INBOX-01",
      origin_device: it.origin?.split("•")[0]?.trim() || "Device A",
      origin_technician: it.origin?.includes("Tech") ? it.origin : "Asha K. (TK-904)",
      content: it.content || it.spec_diff || "",
      kind: it.proposal === "CONFLICT" ? "conflict" : (it.proposal === "HOLD" ? "note" : "fix"),
      decision: {
        action: it.proposal === "SHARE" ? "share" : (it.proposal === "HOLD" ? "hold" : "local_only"),
        score: 0.94,
        factors: { authority: 0.3, dedupe: 0, novelty: 0.4, pii: 0, size: 0 },
        reason: it.content || "Autonomous edge proposal",
        rule_hits: [],
      },
      status: (it.status === "pending_review" ? "pending" : (it.status === "promoted" ? "approved" : "pending")) as any,
      submitted_at: it.created_at || "12m ago",
    }));
  } catch {
    return MOCK_INBOX;
  }
}

export async function promoteInboxItem(itemId: string): Promise<void> {
  if (isMock()) return;
  try {
    await apiFetch("hub", `/inbox/${itemId}/promote`, { method: "POST" });
  } catch {}
}

export async function rejectInboxItem(itemId: string, reason: string): Promise<void> {
  if (isMock()) return;
  try {
    await apiFetch("hub", `/inbox/${itemId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
  } catch {}
}

export async function getPromotions(): Promise<PromotionEntry[]> {
  if (isMock()) return MOCK_PROMOTIONS;
  try {
    const list = await apiFetch<any[]>("hub", "/knowledge");
    if (!Array.isArray(list) || list.length === 0) return MOCK_PROMOTIONS;
    return list.map((item: any, idx: number) => ({
      id: item.id || `PROM-${idx}`,
      mem_id: item.mem_id || item.id || `M-${1000 + idx}`,
      title: item.title || item.content?.slice(0, 45) || "Fleet Knowledge Entry",
      origin_device: item.source_device || item.origin || "Device A",
      curator: "S. Thorne (Principal Reliability Eng)",
      action: "Promoted to Global Fleet Baseline",
      timestamp: item.created_at || "1h ago",
    }));
  } catch {
    return MOCK_PROMOTIONS;
  }
}

export async function getResults(): Promise<ResultsData> {
  if (isMock()) return MOCK_RESULTS;
  try {
    const res = await fetch("/eval/results.json");
    if (res.ok) return res.json();
  } catch {}
  return MOCK_RESULTS;
}

