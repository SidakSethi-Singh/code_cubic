"use client";

import { useState, useCallback, useEffect } from "react";
import { useApp } from "@/lib/context";
import { runSync, getSyncStatus, getOutbox } from "@/lib/api";
import type { SyncReport, OutboxEntry } from "@/lib/types";
import { MOCK_SYNC_REPORT, MOCK_OUTBOX } from "@/lib/mocks/fixtures";
import StatusBadge from "@/components/StatusBadge";
import {
  GlassCard,
  GradientBadge,
  PageHeader,
} from "@/components/shared";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  ArrowUpRight,
  Pause,
  ArrowDownLeft,
  HardDrive,
} from "lucide-react";
import { motion } from "framer-motion";

export default function SyncPage() {
  const { deviceId, isOffline, toggleLink } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [report, setReport] = useState<SyncReport>(MOCK_SYNC_REPORT);
  const [outbox, setOutbox] = useState<OutboxEntry[]>(MOCK_OUTBOX);
  const [lastSyncTime, setLastSyncTime] = useState("Just now");

  const loadData = useCallback(async () => {
    try {
      const [entries, status] = await Promise.all([
        getOutbox(deviceId),
        getSyncStatus(deviceId),
      ]);
      if (entries && entries.length > 0) {
        setOutbox(entries);
      }
      if (status?.last_sync) {
        setLastSyncTime(status.last_sync);
      }
    } catch (e) {
      console.warn("SyncPage fetch error:", e);
    }
  }, [deviceId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    const interval = setInterval(loadData, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadData]);

  const pendingCount = outbox.filter((o) => o.state === "pending").length;

  const handleSyncNow = useCallback(async () => {
    if (isOffline || syncing) return;
    setSyncing(true);
    try {
      const rep = await runSync(deviceId);
      setReport(rep);
      setLastSyncTime("Just now");
      setOutbox((prev) =>
        prev.map((o) =>
          o.state === "pending"
            ? { ...o, state: "synced", next_retry: "Done" }
            : o
        )
      );
      setTimeout(loadData, 800);
    } catch {
      // Handled by API fallback
    } finally {
      setSyncing(false);
    }
  }, [deviceId, isOffline, syncing, loadData]);

  const formatBytes = (bytes: number) => {
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(2)} MB`;
    if (bytes >= 1000) return `${(bytes / 1000).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        category="CRDT Replication &amp; Air-Gap Policy Engine"
        title="Sync Center"
        subtitle="Selective CRDT replication with local policy gating and bandwidth reduction"
        badge={
          <GradientBadge variant="neutral" size="sm">
            Crash-Safe WAL: {pendingCount} Pending
          </GradientBadge>
        }
      />

      {/* Control Bar: Link Toggle + Sync Action + Last Sync */}
      <GlassCard className="p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Link Toggle Button */}
          <button
            onClick={toggleLink}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-semibold text-xs transition-all duration-150 cursor-pointer ${
              isOffline
                ? "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                : "bg-emerald-50 border border-emerald-300 text-emerald-800"
            }`}
          >
            {isOffline ? (
              <WifiOff className="w-4 h-4" strokeWidth={2} />
            ) : (
              <Wifi className="w-4 h-4 text-emerald-600" strokeWidth={2} />
            )}
            <span>{isOffline ? "Air-Gapped (Isolated)" : "Peer Mesh Online"}</span>
          </button>

          <div className="w-[1px] h-6 bg-slate-200 hidden sm:block" />

          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Replication State
            </span>
            <span className="text-xs font-semibold text-slate-900 mt-0.5">
              {isOffline ? "Air-Gapped Local-Only" : "Peer Mesh Ready"}
            </span>
          </div>

          <div className="w-[1px] h-6 bg-slate-200 hidden sm:block" />

          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Pending Outbox
            </span>
            <span className="text-xs font-semibold text-sky-700 font-mono mt-0.5">
              {pendingCount} operations
            </span>
          </div>

          <div className="w-[1px] h-6 bg-slate-200 hidden sm:block" />

          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Last Sync
            </span>
            <span className="text-xs text-slate-500 font-mono mt-0.5">
              {lastSyncTime}
            </span>
          </div>
        </div>

        {/* Sync Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncNow}
            disabled={isOffline || syncing}
            className={`flex items-center justify-center gap-2 h-10 px-5 rounded-lg font-semibold text-xs transition-all shadow-xs cursor-pointer ${
              isOffline
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                : "bg-sky-700 hover:bg-sky-800 text-white"
            }`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`}
              strokeWidth={2}
            />
            <span>{syncing ? "Synchronizing..." : "Sync Now"}</span>
          </button>
        </div>
      </GlassCard>

      {/* Hero Stat: Bandwidth Saved Comparison */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Efficiency Metric
            </span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Bandwidth Conservation
            </h3>
          </div>
          <GradientBadge variant="neutral" size="sm">
            Batch #{report.id} ({report.duration_ms}ms RTT)
          </GradientBadge>
        </div>

        <div className="flex items-baseline gap-3 mb-5">
          <span className="text-5xl font-bold tracking-tight font-mono text-emerald-700">
            {report.saved_pct}%
          </span>
          <span className="text-sm text-slate-500">
            bandwidth reduction vs naive flood replication
          </span>
        </div>

        {/* Comparison Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className="text-slate-900 font-semibold">
                Selective Policy Replication (Actual Egress)
              </span>
              <span className="text-emerald-700 font-mono font-bold">
                {formatBytes(report.bytes_sent)}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
              <motion.div
                className="h-full rounded-full bg-emerald-600"
                initial={{ width: 0 }}
                animate={{
                  width: `${(report.bytes_sent / report.bytes_baseline) * 100}%`,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className="text-slate-500">
                Sync-Everything Baseline (Naive Transfer)
              </span>
              <span className="text-slate-600 font-mono">
                {formatBytes(report.bytes_baseline)}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
              <div className="h-full bg-slate-300 rounded-full w-full" />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Three Columns: Pushed / Held / Pulled */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PUSHED Column */}
        <GlassCard className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Pushed (Local)
                </span>
              </div>
              <GradientBadge variant="tier1" size="sm">
                {report.pushed.length} items
              </GradientBadge>
            </div>

            <div className="space-y-2">
              {report.pushed.map((item) => (
                <div
                  key={item.mem_id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-700">
                      {item.mem_id}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {item.reason}
                  </p>
                  <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span className="uppercase">{item.kind}</span>
                    <span>{formatBytes(item.bytes)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* HELD Column */}
        <GlassCard className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                  <Pause className="w-3.5 h-3.5 text-amber-700" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Held (Policy)
                </span>
              </div>
              <GradientBadge variant="warning" size="sm">
                {report.held.length} items
              </GradientBadge>
            </div>

            <div className="space-y-2">
              {report.held.map((item) => (
                <div
                  key={item.mem_id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-700">
                      {item.mem_id}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {item.reason}
                  </p>
                  <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span className="uppercase">{item.kind}</span>
                    <span>{formatBytes(item.bytes)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* PULLED Column */}
        <GlassCard className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-sky-100 flex items-center justify-center">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-sky-700" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Pulled (Hub)
                </span>
              </div>
              <GradientBadge variant="tier2" size="sm">
                {report.pulled.length} items
              </GradientBadge>
            </div>

            <div className="space-y-2">
              {report.pulled.map((item) => (
                <div
                  key={item.mem_id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-sky-700">
                      {item.mem_id}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {item.reason}
                  </p>
                  <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span className="uppercase">{item.kind}</span>
                    <span>{formatBytes(item.bytes)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Outbox Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
              Ledger Outbox Queue
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Persisted in SQLite WAL
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
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
                  className="border-b border-slate-100 text-xs h-11 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-2 px-3 font-mono font-bold text-sky-700">
                    {op.op_id}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">
                        {op.title}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {op.mem_id}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <StatusBadge status={op.state} />
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-600">
                    {op.attempts}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-600">
                    {op.next_retry}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-900 font-semibold">
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
