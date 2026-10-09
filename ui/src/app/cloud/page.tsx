"use client";

import { useState } from "react";
import {
  MOCK_CLOUD_STATS,
  MOCK_DEVICES,
  MOCK_INBOX,
  MOCK_PROMOTIONS,
} from "@/lib/mocks/fixtures";
import type { InboxItem, PromotionEntry } from "@/lib/types";
import {
  GradientBadge,
  PageHeader,
  StatTile,
} from "@/components/shared";
import {
  Cloud,
  Check,
  X,
  Radio,
  Layers,
  HardDrive,
  Sparkles,
  Server,
} from "lucide-react";

export default function CloudConsolePage() {
  const [stats] = useState(MOCK_CLOUD_STATS);
  const [devices] = useState(MOCK_DEVICES);
  const [inbox, setInbox] = useState<InboxItem[]>(MOCK_INBOX);
  const [promotions, setPromotions] = useState<PromotionEntry[]>(MOCK_PROMOTIONS);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  const handleApprove = (item: InboxItem) => {
    setInbox((prev) => prev.filter((i) => i.id !== item.id));
    const newPromo: PromotionEntry = {
      id: `P-${item.id}`,
      mem_id: `M-${item.id}`,
      title: item.content.slice(0, 38) + "...",
      origin_device: item.origin_device,
      curator: "Meera S.",
      action: "Promoted to Fleet Baseline v12.1",
      timestamp: "Just now",
    };
    setPromotions((prev) => [newPromo, ...prev]);
  };

  const handleRejectSubmit = (itemId: string) => {
    if (!rejectReason.trim()) return;
    setInbox((prev) => prev.filter((i) => i.id !== itemId));
    setRejectId(null);
    setRejectReason("");
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    return `${(bytes / 1000).toFixed(1)} KB`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        category="Central Control Plane • Hub :8000"
        title="Fleet Control Plane"
        subtitle="Fleet-wide knowledge synthesis, device telemetry, and curator review queue"
        badge={
          <div className="flex items-center gap-2">
            <GradientBadge variant="tier3" size="sm" dot>
              HUB :8000 ONLINE
            </GradientBadge>
            <GradientBadge variant="neutral" size="sm">
              Curator: Meera S. (Reliability Desk)
            </GradientBadge>
          </div>
        }
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs">
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-500">Sync Mesh:</span>
            <span className="text-emerald-700 font-bold font-mono">ACTIVE</span>
          </div>
        }
      />

      {/* 5 Flat Stat Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatTile
          label="Devices Online"
          value={`${stats.devices_online}/${stats.devices_total}`}
          sublabel="2 air-gapped / field"
          icon={<Server className="w-3.5 h-3.5 text-emerald-600" />}
        />
        <StatTile
          label="Fleet Knowledge"
          value={stats.fleet_knowledge_count}
          sublabel="vectors cataloged"
          icon={<Layers className="w-3.5 h-3.5 text-sky-600" />}
        />
        <StatTile
          label="Inbox Pending"
          value={inbox.length}
          sublabel="awaiting curator"
          isGradientText
          icon={<Cloud className="w-3.5 h-3.5 text-amber-600" />}
        />
        <StatTile
          label="Promoted Today"
          value={stats.promoted_today}
          sublabel="fleet directives"
          icon={<Sparkles className="w-3.5 h-3.5 text-purple-600" />}
        />
        <StatTile
          label="Bytes Saved"
          value={formatBytes(stats.bytes_saved_fleet)}
          sublabel="82% fleet average"
          icon={<HardDrive className="w-3.5 h-3.5 text-emerald-600" />}
        />
      </div>

      {/* Fleet Mesh Devices Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
              Fleet Mesh Devices
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Auto-discovery via mDNS &amp; SQLite WAL replication
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                <th className="py-2.5 px-3">Device ID</th>
                <th className="py-2.5 px-3">Site / Deployment</th>
                <th className="py-2.5 px-3">Link State</th>
                <th className="py-2.5 px-3">Last Heartbeat</th>
                <th className="py-2.5 px-3 text-right">Local Vectors</th>
                <th className="py-2.5 px-3 text-right">Outbox Pending</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr
                  key={d.device_id}
                  className="border-b border-slate-100 text-xs h-11 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-2 px-3 font-mono font-bold text-sky-700">
                    {d.device_id}
                  </td>
                  <td className="py-2 px-3 text-slate-900 font-medium">
                    {d.site}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border ${
                        d.link_state === "online"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : d.link_state === "syncing"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          d.link_state === "online"
                            ? "bg-emerald-600"
                            : d.link_state === "syncing"
                            ? "bg-amber-600 animate-pulse"
                            : "bg-slate-400"
                        }`}
                      />
                      {d.link_state.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-500">
                    {d.last_heartbeat}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-800">
                    {d.local_memories.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    <span
                      className={
                        d.pending_sync > 0
                          ? "text-amber-700 font-bold"
                          : "text-slate-400"
                      }
                    >
                      {d.pending_sync}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Section: Inbox Review Queue & Promotion Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* INBOX REVIEW QUEUE (2 Cols) */}
        <div className="lg:col-span-2 rounded-xl bg-white border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-700" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                Curator Inbox Review Queue ({inbox.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Candidate memories shared by edge devices
            </span>
          </div>

          {inbox.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">
              All candidate items reviewed. Curator inbox is empty.
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {inbox.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-sky-700">
                        {item.id}
                      </span>
                      <span className="text-slate-300 text-xs">•</span>
                      <span className="text-xs font-semibold text-slate-900">
                        {item.origin_device}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({item.origin_technician})
                      </span>
                      <GradientBadge variant="neutral" size="sm">
                        {item.kind.toUpperCase()}
                      </GradientBadge>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {item.submitted_at}
                    </span>
                  </div>

                  <p className="text-sm text-slate-800 leading-relaxed">
                    {item.content}
                  </p>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="text-sky-800 font-semibold">
                        Policy Triage:
                      </span>
                      <span>{item.decision.reason}</span>
                    </div>
                    <span className="text-slate-900 font-semibold">
                      Score: {item.decision.score.toFixed(2)}
                    </span>
                  </div>

                  {rejectId === item.id ? (
                    <div className="mt-2 p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                      <span className="text-xs text-slate-500">
                        Provide a reason for rejection:
                      </span>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. Needs OEM lab verification, duplicate finding..."
                        className="w-full h-8 px-2.5 rounded-md border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setRejectId(null);
                            setRejectReason("");
                          }}
                          className="px-2.5 py-1 rounded-md text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRejectSubmit(item.id)}
                          disabled={!rejectReason.trim()}
                          className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setRejectId(item.id)}
                        className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleApprove(item)}
                        className="px-3.5 py-1.5 rounded-md bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>Approve &amp; Broadcast</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PROMOTION FEED TIMELINE (1 Col) */}
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-700" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                Promotion Feed
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Fleet Corpus
            </span>
          </div>

          <div className="relative pl-5 space-y-4 flex-1">
            <div className="absolute left-[5px] top-2 bottom-2 w-[1.5px] bg-slate-200" />

            {promotions.map((p) => (
              <div key={p.id} className="relative flex items-start gap-2 text-xs">
                <div className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-purple-600" />
                <div className="flex-1">
                  <div className="text-[11px] text-slate-400 font-mono mb-0.5">
                    {p.timestamp}
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900">
                    {p.title}
                  </h4>
                  <div className="text-xs text-purple-700 font-mono mt-0.5">
                    {p.origin_device} → verified by {p.curator}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {p.action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
