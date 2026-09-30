"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import { MOCK_CONFLICT } from "@/lib/mocks/fixtures";
import type { ConflictRecord } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import {
  GitBranch,
  Check,
  AlertTriangle,
  RotateCcw,
  ArrowUpRight,
  ShieldCheck,
  HelpCircle,
  Clock,
  User,
  Hash,
} from "lucide-react";

export default function ConflictsPage() {
  const { deviceId } = useApp();
  const [conflict, setConflict] = useState<ConflictRecord>(MOCK_CONFLICT);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleAction = (action: "accept" | "escalate" | "restore") => {
    if (action === "accept") {
      setConflict((prev) => ({ ...prev, status: "resolved" }));
      setActionNotice("Winner accepted: 45 Nm (Cloud Bulletin Rev 12) committed to local index.");
    } else if (action === "escalate") {
      setConflict((prev) => ({ ...prev, status: "escalated" }));
      setActionNotice("Escalated to Meera S. (Fleet Reliability Desk) for manual engineering arbitration.");
    } else {
      setConflict((prev) => ({ ...prev, status: "open" }));
      setActionNotice("Restored earlier revision fork for local testing.");
    }
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl pb-12">
      {/* Title & Badge */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs px-2 py-0.5 rounded-[2px] bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)] font-bold accent-text accent-border">
              {conflict.id}
            </span>
            <span className="font-mono text-xs text-[var(--color-muted)]">
              Asset: {conflict.asset_id}
            </span>
            <StatusBadge status={conflict.status} />
          </div>
          <h1 className="text-2xl font-bold font-mono text-[var(--color-text)]">
            Contested Claim Arbitration
          </h1>
          <p className="text-base text-[var(--color-muted)] mt-1">
            Deterministic C1–C4 resolution rules: Authority &gt; Version &gt; Time &gt; Human Override
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAction("accept")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[2px] bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-mono font-bold text-sm accent-fill transition-opacity duration-120 hover:opacity-90"
          >
            <Check className="w-4 h-4" strokeWidth={1.5} />
            <span>Accept Winner</span>
          </button>
          <button
            onClick={() => handleAction("escalate")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-mono text-sm hover:border-[var(--color-accent)] transition-colors duration-120"
          >
            <ArrowUpRight className="w-4 h-4 text-[var(--color-accent)]" strokeWidth={1.5} />
            <span>Escalate</span>
          </button>
          <button
            onClick={() => handleAction("restore")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] font-mono text-sm hover:text-[var(--color-text)] transition-colors duration-120"
          >
            <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
            <span>Restore</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-[2px] bg-[var(--color-accent-dim)] border border-[var(--color-accent)] text-[var(--color-accent)] font-mono text-sm accent-text accent-border">
          {actionNotice}
        </div>
      )}

      {/* Claim Banner */}
      <div className="rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-[var(--color-accent)] accent-text" strokeWidth={1.5} />
          <div>
            <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider">
              Contested Property
            </span>
            <div className="font-mono text-lg font-bold text-[var(--color-text)]">
              &quot;{conflict.claim}&quot;
            </div>
          </div>
        </div>
        <div className="font-mono text-sm text-[var(--color-muted)]">
          3 conflicting sources detected
        </div>
      </div>

      {/* Three-Column Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {conflict.sources.map((src, idx) => {
          const isWinner = src.status === "winner";
          const isSuperseded = src.status === "superseded";
          const isDisputed = src.status === "disputed";

          return (
            <div
              key={src.mem_id}
              className={`rounded-[2px] flex flex-col transition-colors duration-120 ${
                isWinner
                  ? "bg-[var(--color-surface)] border-2 border-[var(--color-accent)]"
                  : isDisputed
                  ? "bg-[var(--color-surface)] border border-dashed border-[var(--color-accent)]"
                  : "bg-[var(--color-surface)] border border-[var(--color-border)] opacity-75"
              }`}
            >
              {/* Column Header */}
              <div
                className={`p-3 border-b flex items-center justify-between ${
                  isWinner
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border-[var(--color-accent)] accent-fill"
                    : isDisputed
                    ? "bg-[var(--color-accent-dim)] border-[var(--color-border)] text-[var(--color-accent)] accent-text"
                    : "bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-muted)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">
                    {src.source_label}
                  </span>
                </div>
                {isWinner ? (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--color-accent-ink)] text-[var(--color-accent)]">
                    WINNER (ACTIVE)
                  </span>
                ) : isDisputed ? (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full border border-[var(--color-accent)]">
                    ROUTED TO REVIEW
                  </span>
                ) : (
                  <span className="font-mono text-xs text-[var(--color-muted)] line-through">
                    SUPERSEDED
                  </span>
                )}
              </div>

              {/* Column Body */}
              <div className="p-4 flex flex-col flex-1 justify-between gap-4">
                <div>
                  <div className="font-mono text-xs text-[var(--color-muted)] mb-1">
                    Claimed Value
                  </div>
                  <div
                    className={`font-mono text-4xl font-bold mb-3 ${
                      isWinner
                        ? "text-[var(--color-accent)] accent-text"
                        : isSuperseded
                        ? "text-[var(--color-muted)] line-through"
                        : "text-[var(--color-text)]"
                    }`}
                  >
                    {src.claim_value}
                  </div>

                  <h3
                    className={`font-sans font-bold text-base mb-1 ${
                      isSuperseded ? "text-[var(--color-muted)] line-through" : "text-[var(--color-text)]"
                    }`}
                  >
                    {src.title}
                  </h3>

                  <div className="font-mono text-xs text-[var(--color-muted)] space-y-1 mt-2">
                    <div>Mem ID: {src.mem_id}</div>
                    <div>Version: v{src.version}</div>
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-[var(--color-muted)]">Authority:</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 3 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2.5 h-2.5 rounded-full ${
                            i < src.authority
                              ? "bg-[var(--color-accent)] accent-fill"
                              : "bg-[var(--color-surface-2)] border border-[var(--color-border)]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <StatusBadge status={src.status} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* WHY-PANEL: Rule Trail in Mono */}
      <div className="rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] border-l-[3px] border-l-[var(--color-accent)] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--color-accent)] accent-text" strokeWidth={1.5} />
            <h3 className="font-mono font-bold text-base text-[var(--color-text)] uppercase tracking-wider">
              Rule Trail: Arbitration Reason
            </h3>
          </div>
          <span className="font-mono text-xs text-[var(--color-muted)]">
            Deterministic Engine C1–C4
          </span>
        </div>

        <p className="font-sans text-sm text-[var(--color-text)] mb-4">
          C1 Authority rule resolved the contested torque parameter. Cloud Engineering Directive (Auth 3) takes precedence over technician empirical note (Auth 2) and deprecated local manual (Auth 1). Asha&apos;s 42 Nm measurement has been preserved in a review fork.
        </p>

        <div className="space-y-2 font-mono text-sm">
          {conflict.rule_trail.map((step) => (
            <div
              key={step.rule}
              className={`p-3 rounded-[2px] flex items-start gap-3 border transition-colors duration-120 ${
                step.decided
                  ? "bg-[var(--color-accent-dim)] border-[var(--color-accent)] text-[var(--color-accent)] accent-border accent-text accent-bg"
                  : "bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-muted)]"
              }`}
            >
              <span className="font-bold px-1.5 py-0.5 rounded-[2px] bg-[var(--color-bg)] border border-[var(--color-border)] text-xs">
                {step.rule}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{step.label}</span>
                  {step.decided && (
                    <span className="text-xs px-2 py-0.2 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-bold accent-fill">
                      DECIDED
                    </span>
                  )}
                </div>
                <div className="text-xs opacity-90 mt-0.5">{step.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LINEAGE TIMELINE (1px vertical line, square nodes) */}
      <div className="rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-[var(--color-muted)]" strokeWidth={1.5} />
          <h3 className="font-mono font-bold text-base text-[var(--color-text)] uppercase tracking-wider">
            Lineage &amp; Fork History
          </h3>
        </div>

        <div className="relative pl-6 space-y-6">
          {/* Vertical 1px line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--color-border)]" />

          {conflict.lineage.map((node, i) => (
            <div key={i} className="relative flex items-start gap-3 font-mono text-sm">
              {/* Square Node */}
              <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-[2px] bg-[var(--color-accent)] border border-[var(--color-accent)] accent-fill" />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[var(--color-text)]">{node.label}</span>
                  <span className="text-xs text-[var(--color-muted)]">{node.hash}</span>
                </div>
                <div className="text-xs text-[var(--color-muted)] mt-0.5">{node.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
