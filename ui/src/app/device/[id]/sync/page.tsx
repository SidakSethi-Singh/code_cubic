"use client";

import { useState, useCallback, useEffect } from "react";
import { useApp } from "@/lib/context";
import { runSync, getSyncStatus, getOutbox } from "@/lib/api";
import type { SyncReport, OutboxEntry } from "@/lib/types";
import { MOCK_SYNC_REPORT, MOCK_OUTBOX } from "@/lib/mocks/fixtures";
import StatusBadge from "@/components/StatusBadge";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  ShieldCheck,
  ArrowUpRight,
  Pause,
  ArrowDownLeft,
  CheckCircle2,
  HardDrive,
  Info,
} from "lucide-react";

export default function SyncPage() {
  const { deviceId, isOffline, toggleLink } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [report, setReport] = useState<SyncReport>(MOCK_SYNC_REPORT);
  const [outbox, setOutbox] = useState<OutboxEntry[]>(MOCK_OUTBOX);
  const [lastSyncTime, setLastSyncTime] = useState("2m ago");

  const pendingCount = outbox.filter((o) => o.state === "pending").length;

  const handleSyncNow = useCallback(async () => {
    if (isOffline || syncing) return;
    setSyncing(true);
    try {
      const rep = await runSync(deviceId);
      setReport(rep);
      setLastSyncTime("Just now");
      // Update outbox entries as synced
      setOutbox((prev) =>
        prev.map((o) =>
          o.state === "pending"
            ? { ...o, state: "synced", next_retry: "-" }
            : o
        )
      );
    } catch {
      // Mock fallback already handles this
    } finally {
      setSyncing(false);
    }
  }, [deviceId, isOffline, syncing]);

  const formatBytes = (bytes: number) => {
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(2)} MB`;
    if (bytes >= 1000) return `${(bytes / 1000).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl pb-10">
      {/* Title & Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono text-[var(--color-text)]">
            Sync Center
          </h1>
          <p className="text-base text-[var(--color-muted)] mt-1">
            Selective CRDT replication with local policy gating
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-sm">
            <ShieldCheck
              className="w-4 h-4 text-[var(--color-accent)] accent-text"
              strokeWidth={1.5}
            />
            <span className="text-[var(--color-muted)]">Crash-safe WAL:</span>
            <span className="font-bold text-[var(--color-accent)] accent-text">
              {pendingCount} uncommitted
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Link Toggle + Sync Action + Last Sync */}
      <div className="rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {/* Big Link Toggle */}
          <button
            onClick={toggleLink}
            className={`flex items-center gap-3 px-5 py-3 rounded-[2px] font-mono font-bold text-base transition-colors duration-120 border ${
              isOffline
                ? "border-[var(--color-muted)] text-[var(--color-muted)] bg-transparent hover:border-[var(--color-text)]"
                : "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border-[var(--color-accent)] accent-fill"
            }`}
          >
            {isOffline ? (
              <WifiOff className="w-5 h-5" strokeWidth={1.5} />
            ) : (
              <Wifi className="w-5 h-5" strokeWidth={1.5} />
            )}
            <span>{isOffline ? "LINK: OFFLINE" : "LINK: ONLINE"}</span>
          </button>

          <div className="flex flex-col font-mono text-sm">
            <span className="text-[var(--color-muted)]">Replication State</span>
            <span className="text-[var(--color-text)] font-bold">
              {isOffline ? "Air-Gapped Local-Only" : "Peer Mesh Ready"}
            </span>
          </div>

          <div className="w-px h-8 bg-[var(--color-border)] mx-2" />

          <div className="flex flex-col font-mono text-sm">
            <span className="text-[var(--color-muted)]">Pending Sync</span>
            <span className="text-[var(--color-accent)] font-bold accent-text">
              {pendingCount} ops in outbox
            </span>
          </div>

          <div className="w-px h-8 bg-[var(--color-border)] mx-2" />

          <div className="flex flex-col font-mono text-sm">
            <span className="text-[var(--color-muted)]">Last Sync</span>
            <span className="text-[var(--color-text)]">{lastSyncTime}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <button
              onClick={handleSyncNow}
              disabled={isOffline || syncing}
              className={`flex items-center gap-2 h-12 px-6 rounded-[2px] font-mono font-bold text-base transition-all duration-120 ${
                isOffline
                  ? "bg-[var(--color-surface-2)] text-[var(--color-muted)] border border-[var(--color-border)] cursor-not-allowed opacity-60"
                  : "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border border-[var(--color-accent)] accent-fill"
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
                strokeWidth={1.5}
              />
              <span>{syncing ? "Syncing..." : "Sync Now"}</span>
            </button>
            {isOffline && (
              <div className="absolute right-0 top-full mt-2 hidden group-hover:block w-56 p-2 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-muted)] z-20">
                Disabled while air-gapped. Toggle Link online to sync.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Stat: BANDWIDTH SAVED */}
      <div className="rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="font-mono text-sm text-[var(--color-muted)] uppercase tracking-wider">
              Efficiency Metric
            </span>
            <h2 className="font-mono text-lg font-bold text-[var(--color-text)]">
              BANDWIDTH SAVED
            </h2>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-muted)]">
            Batch #{report.id} ({report.duration_ms}ms)
          </span>
        </div>

        <div className="flex items-baseline gap-4 mb-6">
          <span className="font-mono text-6xl font-bold text-[var(--color-accent)] accent-text">
            {report.saved_pct}%
          </span>
          <span className="font-mono text-base text-[var(--color-muted)]">
            reduction vs naive replication
          </span>
        </div>

        {/* Flat Comparison Bars */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between font-mono text-sm mb-1.5">
              <span className="text-[var(--color-text)] font-bold">
                Selective Policy Replication (Actual)
              </span>
              <span className="text-[var(--color-accent)] font-bold accent-text">
                {formatBytes(report.bytes_sent)}
              </span>
            </div>
            <div className="h-6 w-full rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)] transition-all duration-120 accent-fill"
                style={{
                  width: `${(report.bytes_sent / report.bytes_baseline) * 100}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-mono text-sm mb-1.5">
              <span className="text-[var(--color-muted)]">
                Sync-Everything Baseline (Naive Sync)
              </span>
              <span className="text-[var(--color-muted)]">
                {formatBytes(report.bytes_baseline)}
              </span>
            </div>
            <div className="h-6 w-full rounded-[2px] bg-transparent border border-[var(--color-accent)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent-dim)]"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Three Equal Columns: PUSHED / HELD / PULLED */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PUSHED Column */}
        <div className="rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <ArrowUpRight
                className="w-4 h-4 text-[var(--color-accent)] accent-text"
                strokeWidth={1.5}
              />
              <span className="font-mono font-bold text-base text-[var(--color-text)]">
                PUSHED
              </span>
            </div>
            <span className="font-mono text-sm text-[var(--color-accent)] font-bold accent-text">
              {report.pushed.length} items
            </span>
          </div>

          <div className="space-y-2.5 flex-1">
            {report.pushed.map((item) => (
              <div
                key={item.mem_id}
                className="p-3 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-[var(--color-accent)] accent-text">
                    {item.mem_id}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-base text-[var(--color-text)] font-medium">
                  {item.title}
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  {item.reason}
                </p>
                <div className="mt-1 flex items-center justify-between font-mono text-xs text-[var(--color-muted)]">
                  <span className="uppercase">{item.kind}</span>
                  <span>{formatBytes(item.bytes)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HELD Column */}
        <div className="rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Pause
                className="w-4 h-4 text-[var(--color-accent)] accent-text"
                strokeWidth={1.5}
              />
              <span className="font-mono font-bold text-base text-[var(--color-text)]">
                HELD (POLICY)
              </span>
            </div>
            <span className="font-mono text-sm text-[var(--color-muted)] font-bold">
              {report.held.length} items
            </span>
          </div>

          <div className="space-y-2.5 flex-1">
            {report.held.map((item) => (
              <div
                key={item.mem_id}
                className="p-3 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-[var(--color-muted)]">
                    {item.mem_id}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-base text-[var(--color-text)] font-medium">
                  {item.title}
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  {item.reason}
                </p>
                <div className="mt-1 flex items-center justify-between font-mono text-xs text-[var(--color-muted)]">
                  <span className="uppercase">{item.kind}</span>
                  <span>{formatBytes(item.bytes)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PULLED Column */}
        <div className="rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <ArrowDownLeft
                className="w-4 h-4 text-[var(--color-accent)] accent-text"
                strokeWidth={1.5}
              />
              <span className="font-mono font-bold text-base text-[var(--color-text)]">
                PULLED (HUB)
              </span>
            </div>
            <span className="font-mono text-sm text-[var(--color-accent)] font-bold accent-text">
              {report.pulled.length} items
            </span>
          </div>

          <div className="space-y-2.5 flex-1">
            {report.pulled.map((item) => (
              <div
                key={item.mem_id}
                className="p-3 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-[var(--color-accent)] accent-text">
                    {item.mem_id}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-base text-[var(--color-text)] font-medium">
                  {item.title}
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  {item.reason}
                </p>
                <div className="mt-1 flex items-center justify-between font-mono text-xs text-[var(--color-muted)]">
                  <span className="uppercase">{item.kind}</span>
                  <span>{formatBytes(item.bytes)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Outbox Table */}
      <div className="rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <HardDrive
              className="w-5 h-5 text-[var(--color-muted)]"
              strokeWidth={1.5}
            />
            <h3 className="font-mono font-bold text-lg text-[var(--color-text)]">
              Ledger Outbox Queue
            </h3>
          </div>
          <span className="font-mono text-xs text-[var(--color-muted)]">
            Persisted in SQLite WAL
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left font-mono text-xs text-[var(--color-muted)] uppercase">
                <th className="py-2.5 px-3">Op ID</th>
                <th className="py-2.5 px-3">Memory</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Attempts</th>
                <th className="py-2.5 px-3">Next Retry</th>
                <th className="py-2.5 px-3 text-right">Bytes</th>
              </tr>
            </thead>
            <tbody>
              {outbox.map((op) => (
                <tr
                  key={op.op_id}
                  className="border-b border-[var(--color-border)] font-mono text-sm h-12 hover:bg-[var(--color-surface-2)] transition-colors duration-120"
                >
                  <td className="py-2 px-3 font-bold text-[var(--color-accent)] accent-text">
                    {op.op_id}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-[var(--color-text)] font-sans text-base">
                        {op.title}
                      </span>
                      <span className="text-xs text-[var(--color-muted)]">
                        {op.mem_id}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <StatusBadge status={op.state} />
                  </td>
                  <td className="py-2 px-3 text-[var(--color-muted)]">
                    {op.attempts}
                  </td>
                  <td className="py-2 px-3 text-[var(--color-muted)]">
                    {op.next_retry}
                  </td>
                  <td className="py-2 px-3 text-right text-[var(--color-text)]">
                    {formatBytes(op.bytes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
