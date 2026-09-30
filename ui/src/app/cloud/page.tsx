"use client";

import { useState } from "react";
import {
  MOCK_CLOUD_STATS,
  MOCK_DEVICES,
  MOCK_INBOX,
  MOCK_PROMOTIONS,
} from "@/lib/mocks/fixtures";
import type { InboxItem, PromotionEntry } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import {
  Cloud,
  Check,
  X,
  Radio,
  Clock,
  Layers,
  HardDrive,
  Sparkles,
  ArrowUpRight,
  Send,
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
      id: `P-${Date.now().toString().slice(-4)}`,
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
    <div className="flex flex-col gap-6 max-w-6xl pb-12">
      {/* Title & Hub Status */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs px-2 py-0.5 rounded-[2px] bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)] font-bold accent-text accent-border">
              HUB :8000
            </span>
            <span className="font-mono text-xs text-[var(--color-muted)]">
              Curator: Meera S. (Reliability Desk)
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-[var(--color-text)]">
            Fleet Control Plane
          </h1>
          <p className="text-base text-[var(--color-muted)] mt-1">
            Fleet-wide knowledge synthesis, device telemetry, and curator review queue
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-sm px-3 py-1.5 rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)]">
          <Radio className="w-4 h-4 text-[var(--color-accent)] accent-text" strokeWidth={1.5} />
          <span className="text-[var(--color-muted)]">Sync Mesh:</span>
          <span className="text-[var(--color-accent)] font-bold accent-text">ACTIVE</span>
        </div>
      </div>

      {/* STAT ROW: 5 big mono stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col">
          <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider">
            Devices Online
          </span>
          <span className="font-mono text-3xl md:text-4xl font-bold text-[var(--color-accent)] mt-2 accent-text">
            {stats.devices_online}/{stats.devices_total}
          </span>
          <span className="font-mono text-xs text-[var(--color-muted)] mt-1">
            2 air-gapped / field
          </span>
        </div>

        <div className="p-4 rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col">
          <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider">
            Fleet Knowledge
          </span>
          <span className="font-mono text-3xl md:text-4xl font-bold text-[var(--color-text)] mt-2">
            {stats.fleet_knowledge_count.toLocaleString()}
          </span>
          <span className="font-mono text-xs text-[var(--color-muted)] mt-1">
            vectors indexed
          </span>
        </div>

        <div className="p-4 rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col">
          <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider">
            Inbox Pending
          </span>
          <span className="font-mono text-3xl md:text-4xl font-bold text-[var(--color-accent)] mt-2 accent-text">
            {inbox.length}
          </span>
          <span className="font-mono text-xs text-[var(--color-muted)] mt-1">
            awaiting approval
          </span>
        </div>

        <div className="p-4 rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col">
          <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider">
            Promoted Today
          </span>
          <span className="font-mono text-3xl md:text-4xl font-bold text-[var(--color-text)] mt-2">
            {stats.promoted_today}
          </span>
          <span className="font-mono text-xs text-[var(--color-muted)] mt-1">
            fleet directives
          </span>
        </div>

        <div className="p-4 rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col col-span-2 md:col-span-1">
          <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider">
            Bytes Saved
          </span>
          <span className="font-mono text-3xl md:text-4xl font-bold text-[var(--color-accent)] mt-2 accent-text">
            {formatBytes(stats.bytes_saved_fleet)}
          </span>
          <span className="font-mono text-xs text-[var(--color-muted)] mt-1">
            fleet-wide (82% avg)
          </span>
        </div>
      </div>

      {/* DEVICES TABLE */}
      <div className="rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[var(--color-muted)]" strokeWidth={1.5} />
            <h3 className="font-mono font-bold text-base text-[var(--color-text)] uppercase tracking-wider">
              Fleet Mesh Devices
            </h3>
          </div>
          <span className="font-mono text-xs text-[var(--color-muted)]">
            Auto-discovery via mDNS &amp; SQLite WAL replication
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-muted)] uppercase">
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
                  className="border-b border-[var(--color-border)] h-12 hover:bg-[var(--color-surface-2)] transition-colors duration-120"
                >
                  <td className="py-2 px-3 font-bold text-[var(--color-accent)] accent-text">
                    {d.device_id}
                  </td>
                  <td className="py-2 px-3 text-[var(--color-text)] font-sans">
                    {d.site}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                        d.link_state === "online"
                          ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)] border-transparent"
                          : d.link_state === "syncing"
                          ? "bg-transparent text-[var(--color-accent)] border-[var(--color-accent)] border-dashed"
                          : "bg-transparent text-[var(--color-muted)] border-[var(--color-muted)]"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          d.link_state === "online"
                            ? "bg-[var(--color-accent)] accent-fill"
                            : d.link_state === "syncing"
                            ? "bg-[var(--color-accent)] animate-pulse accent-fill"
                            : "bg-[var(--color-muted)]"
                        }`}
                      />
                      {d.link_state.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[var(--color-muted)]">
                    {d.last_heartbeat}
                  </td>
                  <td className="py-2 px-3 text-right text-[var(--color-text)]">
                    {d.local_memories.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span
                      className={
                        d.pending_sync > 0
                          ? "text-[var(--color-accent)] font-bold accent-text"
                          : "text-[var(--color-muted)]"
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

      {/* TWO-COLUMN LOWER SECTION: INBOX REVIEW QUEUE & PROMOTION FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* INBOX REVIEW QUEUE (2 Cols) */}
        <div className="lg:col-span-2 rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[var(--color-accent)] accent-text" strokeWidth={1.5} />
              <h3 className="font-mono font-bold text-base text-[var(--color-text)] uppercase tracking-wider">
                Curator Inbox Review Queue ({inbox.length})
              </h3>
            </div>
            <span className="font-mono text-xs text-[var(--color-muted)]">
              Candidate memories shared by edge devices
            </span>
          </div>

          {inbox.length === 0 ? (
            <div className="py-12 text-center font-mono text-sm text-[var(--color-muted)]">
              All items reviewed. Inbox is empty.
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {inbox.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--color-accent)] accent-text">
                        {item.id}
                      </span>
                      <span className="text-[var(--color-border)]">·</span>
                      <span className="font-mono text-xs text-[var(--color-text)] font-bold">
                        {item.origin_device}
                      </span>
                      <span className="font-mono text-xs text-[var(--color-muted)]">
                        ({item.origin_technician})
                      </span>
                      <span className="px-2 py-0.5 rounded-[2px] bg-[var(--color-bg)] text-xs font-mono text-[var(--color-muted)] border border-[var(--color-border)] uppercase">
                        {item.kind}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[var(--color-muted)]">
                      {item.submitted_at}
                    </span>
                  </div>

                  <p className="font-sans text-base text-[var(--color-text)] leading-relaxed">
                    {item.content}
                  </p>

                  <div className="p-2.5 rounded-[2px] bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-between font-mono text-xs text-[var(--color-muted)]">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-accent)] font-bold accent-text">
                        Policy Triage:
                      </span>
                      <span>{item.decision.reason}</span>
                    </div>
                    <span className="text-[var(--color-text)]">
                      Score: {item.decision.score.toFixed(2)}
                    </span>
                  </div>

                  {rejectId === item.id ? (
                    <div className="mt-2 p-3 rounded-[2px] bg-[var(--color-bg)] border border-[var(--color-border)] space-y-2">
                      <span className="font-mono text-xs text-[var(--color-muted)]">
                        Provide a reason for rejection:
                      </span>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. Needs OEM lab verification, duplicate finding..."
                        className="w-full h-9 px-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2px] font-mono text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setRejectId(null);
                            setRejectReason("");
                          }}
                          className="px-3 py-1 rounded-[2px] font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRejectSubmit(item.id)}
                          disabled={!rejectReason.trim()}
                          className="px-3 py-1 rounded-[2px] bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-mono text-xs font-bold disabled:opacity-40 accent-fill"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setRejectId(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-transparent border border-[var(--color-border)] font-mono text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-muted)] transition-colors duration-120"
                      >
                        <X className="w-4 h-4" strokeWidth={1.5} />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleApprove(item)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-[2px] bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-mono text-sm font-bold transition-opacity duration-120 hover:opacity-90 accent-fill"
                      >
                        <Check className="w-4 h-4" strokeWidth={1.5} />
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
        <div className="rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--color-accent)] accent-text" strokeWidth={1.5} />
              <h3 className="font-mono font-bold text-base text-[var(--color-text)] uppercase tracking-wider">
                Promotion Feed
              </h3>
            </div>
            <span className="font-mono text-xs text-[var(--color-muted)]">
              Fleet Corpus
            </span>
          </div>

          <div className="relative pl-6 space-y-6 flex-1">
            {/* Vertical timeline line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--color-border)]" />

            {promotions.map((p) => (
              <div key={p.id} className="relative flex items-start gap-3 font-mono text-sm">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-[2px] bg-[var(--color-accent)] border border-[var(--color-accent)] accent-fill" />
                <div className="flex-1">
                  <div className="text-xs text-[var(--color-muted)] mb-0.5">
                    {p.timestamp}
                  </div>
                  <h4 className="font-sans font-bold text-base text-[var(--color-text)]">
                    {p.title}
                  </h4>
                  <div className="text-xs text-[var(--color-accent)] font-mono mt-1 accent-text">
                    {p.origin_device} &rarr; verified by {p.curator}
                  </div>
                  <div className="text-xs text-[var(--color-muted)] mt-0.5">
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
