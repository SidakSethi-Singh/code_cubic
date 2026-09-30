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
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function searchMemories(deviceId: string, query: string, topK = 5, filters?: Record<string, string>): Promise<SearchResponse> {
  if (isMock()) return { ...MOCK_SEARCH, query };
  const params = new URLSearchParams({ query, top_k: String(topK), ...filters });
  return apiFetch(deviceId, `/api/v1/search?${params}`);
}

export async function getMemories(deviceId: string): Promise<MemoryRecord[]> {
  if (isMock()) return MOCK_MEMORIES;
  return apiFetch(deviceId, "/api/v1/memories");
}

export async function getMemory(deviceId: string, memId: string): Promise<MemoryRecord> {
  if (isMock()) return MOCK_MEMORIES.find(m => m.mem_id === memId) || MOCK_MEMORIES[0];
  return apiFetch(deviceId, `/api/v1/memories/${memId}`);
}

export async function captureMemory(deviceId: string, content: string, kind: string, assetId?: string): Promise<CaptureResult> {
  if (isMock()) {
    const hasPii = /\+?\d[\d\s-]{8,}/.test(content);
    const isLarge = content.length > 200;
    if (hasPii) return MOCK_CAPTURE_RESULTS[1];
    if (isLarge) return MOCK_CAPTURE_RESULTS[2];
    return MOCK_CAPTURE_RESULTS[0];
  }
  return apiFetch(deviceId, "/api/v1/memories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, kind, asset_id: assetId }),
  });
}

export async function overrideMemory(deviceId: string, memId: string, action: string): Promise<void> {
  if (isMock()) return;
  await apiFetch(deviceId, `/api/v1/memories/${memId}/override`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
}

export async function getLinkState(deviceId: string): Promise<LinkState> {
  if (isMock()) return "offline";
  const data = await apiFetch<{ state: LinkState }>(deviceId, "/api/v1/link");
  return data.state;
}

export async function setLinkState(deviceId: string, state: LinkState): Promise<void> {
  if (isMock()) return;
  await apiFetch(deviceId, "/api/v1/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });
}

export async function runSync(deviceId: string): Promise<SyncReport> {
  if (isMock()) return MOCK_SYNC_REPORT;
  return apiFetch(deviceId, "/api/v1/sync/run", { method: "POST" });
}

export async function getSyncStatus(deviceId: string): Promise<{ pending: number; last_sync: string }> {
  if (isMock()) return { pending: MOCK_OUTBOX.filter(o => o.state === "pending").length, last_sync: "2m ago" };
  return apiFetch(deviceId, "/api/v1/sync/status");
}

export async function getOutbox(deviceId: string): Promise<OutboxEntry[]> {
  if (isMock()) return MOCK_OUTBOX;
  return apiFetch(deviceId, "/api/v1/sync/status");
}

export async function getConflicts(deviceId: string): Promise<ConflictRecord[]> {
  if (isMock()) return [MOCK_CONFLICT];
  return apiFetch(deviceId, "/api/v1/conflicts");
}

export async function resolveConflict(deviceId: string, conflictId: string, action: "accept" | "escalate" | "restore"): Promise<void> {
  if (isMock()) return;
  await apiFetch(deviceId, `/api/v1/conflicts/${conflictId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
}

export async function getEvents(deviceId: string): Promise<ActivityEvent[]> {
  if (isMock()) return MOCK_EVENTS;
  return apiFetch(deviceId, "/api/v1/events");
}

export async function getCloudStats(): Promise<CloudStats> {
  if (isMock()) return MOCK_CLOUD_STATS;
  return apiFetch("hub", "/api/v1/stats");
}

export async function getCloudDevices(): Promise<DeviceEntry[]> {
  if (isMock()) return MOCK_DEVICES;
  return apiFetch("hub", "/api/v1/devices");
}

export async function getInbox(): Promise<InboxItem[]> {
  if (isMock()) return MOCK_INBOX;
  return apiFetch("hub", "/api/v1/inbox");
}

export async function promoteInboxItem(itemId: string): Promise<void> {
  if (isMock()) return;
  await apiFetch("hub", `/api/v1/inbox/${itemId}/promote`, { method: "POST" });
}

export async function rejectInboxItem(itemId: string, reason: string): Promise<void> {
  if (isMock()) return;
  await apiFetch("hub", `/api/v1/inbox/${itemId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}

export async function getPromotions(): Promise<PromotionEntry[]> {
  if (isMock()) return MOCK_PROMOTIONS;
  return apiFetch("hub", "/api/v1/knowledge");
}

export async function getResults(): Promise<ResultsData> {
  if (isMock()) return MOCK_RESULTS;
  try {
    const res = await fetch("/eval/results.json");
    if (res.ok) return res.json();
  } catch {}
  return MOCK_RESULTS;
}
