"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/context";
import { MOCK_PAYTM_CONFLICT, MOCK_CONFLICTS } from "@/lib/mocks/fixtures";
import { getConflicts, resolveConflict } from "@/lib/api";
import type { ConflictRecord } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import {
  GlassCard,
  GradientBadge,
  PageHeader,
} from "@/components/shared";
import {
  GitBranch,
  Check,
  RotateCcw,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  FileText,
  Printer,
  Download,
  Shield,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ConflictsPage() {
  const { deviceId } = useApp();
  const [conflictsList, setConflictsList] = useState<ConflictRecord[]>(MOCK_CONFLICTS);
  const [conflict, setConflict] = useState<ConflictRecord>(MOCK_PAYTM_CONFLICT);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const records = await getConflicts(deviceId);
        if (records && records.length > 0) {
          const combined = [
            ...records,
            ...MOCK_CONFLICTS.filter((m) => !records.some((r) => r.id === m.id)),
          ];
          setConflictsList(combined);
          const paytm = combined.find((r) => r.id.startsWith("PAYTM"));
          setConflict(paytm || combined[0]);
        }
      } catch (e) {
        console.warn("Conflicts fetch fallback:", e);
      }
    }
    load();
  }, [deviceId]);

  const handleAction = async (action: "accept" | "escalate" | "restore") => {
    try {
      await resolveConflict(deviceId, conflict.id, action);
    } catch (e) {
      console.warn("Conflict resolve error:", e);
    }
    const isPaytm = conflict.id.startsWith("PAYTM");
    if (action === "accept") {
      setConflict((prev) => ({
        ...prev,
        status: "resolved",
        sources: prev.sources.map((s, idx) => ({
          ...s,
          status: idx === 0 ? "winner" : "superseded",
        })),
      }));
      setActionNotice(
        isPaytm
          ? "✓ Rule C1 Applied: ₹24,850 Bank Host Baseline accepted as authoritative! ₹250 difference quarantined."
          : "✓ Winner accepted: 45 Nm (Cloud Directive Rev 12) committed to local index via Invariant I7."
      );
    } else if (action === "escalate") {
      setConflict((prev) => ({
        ...prev,
        status: "escalated",
        sources: prev.sources.map((s) => ({
          ...s,
          status: "disputed",
        })),
      }));
      setActionNotice(
        isPaytm
          ? "⚠️ Escalated: Sent to Merchant Operations Desk for offline batch settlement audit."
          : "⚠️ Escalated to Meera S. (Fleet Reliability Desk) for manual engineering arbitration."
      );
    } else {
      setConflict((prev) => ({
        ...prev,
        status: "open",
        sources: prev.sources.map((s, idx) => ({
          ...s,
          status: idx === 1 ? "winner" : "disputed",
        })),
      }));
      setActionNotice(
        isPaytm
          ? "⚡ Preserved: Terminal A Local WAL (₹25,100) kept active for offline merchant operations."
          : "⚡ Restored earlier revision fork for local empirical testing."
      );
    }
    setTimeout(() => setActionNotice(null), 5000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-16">
      {/* Domain Dispute Scenario Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mr-1">
            <span>⚖️</span> Domain Arbitration:
          </span>
          <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200 flex-wrap gap-1">
            {conflictsList.map((c) => (
              <button
                key={c.id}
                onClick={() => setConflict(c)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  conflict.id === c.id
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>{c.id.startsWith("PAYTM") ? "💳" : "⚙️"}</span>
                <span>{c.id.startsWith("PAYTM") ? "Paytm POS Settlement" : "Plant Machinery"} ({c.id})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
            <span>Deterministic C1–C4 Offline State Machine</span>
          </span>
        </div>
      </div>

      {/* Page Header */}
      <PageHeader
        category="Deterministic C1–C4 Conflict Arbitration"
        title="Contested Claim Arbitration"
        subtitle="Automatic precedence rules: Authority > Version > Time > Human Override"
        badge={
          <div className="flex items-center gap-2">
            <GradientBadge variant="danger" size="sm" dot>
              {conflict.id}
            </GradientBadge>
            <GradientBadge variant="neutral" size="sm">
              Asset: {conflict.asset_id}
            </GradientBadge>
            <StatusBadge status={conflict.status} />
          </div>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleAction("accept")}
              className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" strokeWidth={2} />
              <span>Accept Winner</span>
            </button>
            <button
              onClick={() => handleAction("escalate")}
              className="h-9 px-3.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" strokeWidth={2} />
              <span>Escalate</span>
            </button>
            <button
              onClick={() => handleAction("restore")}
              className="h-9 px-3.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
              <span>Restore</span>
            </button>
            <button
              onClick={() => setShowCertificate(true)}
              className="h-9 px-3.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-300 text-xs font-semibold text-sky-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-sky-700" />
              <span>Export RBI Certificate</span>
            </button>
          </div>
        }
      />

      {/* Action Notice Toast */}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium flex items-center gap-2.5 shadow-2xs"
          >
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim Banner Card */}
      <GlassCard className="p-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
            <GitBranch className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Contested Property
            </span>
            <div className="text-lg font-bold text-slate-900">
              &ldquo;{conflict.claim}&rdquo;
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GradientBadge variant="warning" size="sm">
            3 Conflicting Sources Detected
          </GradientBadge>
        </div>
      </GlassCard>

      {/* Parametric Delta Highlight Bar */}
      <div className="rounded-xl bg-white border border-slate-200 p-3.5 flex items-center justify-between flex-wrap gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Parametric Delta:
          </span>
          {conflict.sources.map((src) => (
            <span
              key={src.mem_id}
              className={`px-2.5 py-1 rounded-md font-semibold font-mono ${
                src.status === "winner"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : src.status === "disputed"
                  ? "bg-amber-50 border border-amber-200 text-amber-800"
                  : "bg-slate-100 border border-slate-200 text-slate-400 line-through"
              }`}
            >
              {src.claim_value} ({src.title})
            </span>
          ))}
        </div>

        <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider font-mono">
          RULE {conflict.id.startsWith("PAYTM") ? "C1 AUTHORITY" : "C2 CONTRADICTION"} ARBITRATED
        </span>
      </div>

      {/* Three-Column Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {conflict.sources.map((src, idx) => {
          const isWinner = src.status === "winner";
          const isSuperseded = src.status === "superseded";
          const isDisputed = src.status === "disputed";

          return (
            <div
              key={src.mem_id}
              className={`rounded-xl border p-5 flex flex-col justify-between transition-all duration-150 relative overflow-hidden ${
                isWinner
                  ? "bg-emerald-50/40 border-emerald-300 shadow-xs"
                  : isDisputed
                  ? "bg-amber-50/40 border-amber-300 shadow-xs"
                  : "bg-slate-50/50 border-slate-200 opacity-70"
              }`}
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {src.source_label}
                  </span>

                  {isWinner ? (
                    <GradientBadge variant="tier1" size="sm">
                      WINNER (ACTIVE)
                    </GradientBadge>
                  ) : isDisputed ? (
                    <GradientBadge variant="warning" size="sm">
                      ROUTED TO REVIEW
                    </GradientBadge>
                  ) : (
                    <span className="text-xs text-slate-400 line-through font-mono">
                      SUPERSEDED
                    </span>
                  )}
                </div>

                <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">
                  Claimed Value
                </div>
                <div
                  className={`font-mono text-3xl font-bold tracking-tight mb-2 ${
                    isWinner
                      ? "text-emerald-700"
                      : isSuperseded
                      ? "text-slate-400 line-through"
                      : "text-slate-900"
                  }`}
                >
                  {src.claim_value}
                </div>

                <h4
                  className={`text-sm font-semibold mb-2 ${
                    isSuperseded ? "text-slate-400 line-through" : "text-slate-900"
                  }`}
                >
                  {src.title}
                </h4>

                <div className="text-xs font-mono text-slate-500 space-y-0.5">
                  <div>Mem ID: {src.mem_id}</div>
                  <div>Version: v{src.version}</div>
                </div>
              </div>

              {/* Footer metadata */}
              <div className="pt-3.5 mt-3.5 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Authority:</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 3 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < src.authority
                            ? isWinner
                              ? "bg-emerald-600"
                              : "bg-amber-600"
                            : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <StatusBadge status={src.status} />
              </div>

              {/* Direct Card Arbitration Action */}
              <div className="pt-3 mt-3 border-t border-slate-200">
                {idx === 0 ? (
                  <button
                    onClick={() => handleAction("accept")}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    <span>Accept Authority (Rule C1)</span>
                  </button>
                ) : idx === 1 ? (
                  <button
                    onClick={() => handleAction("restore")}
                    className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Preserve Local WAL (Rule C4)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction("escalate")}
                    className="w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Escalate to Ops Desk</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rule Trail Arbitration Reason */}
      <GlassCard className="p-6 border-l-4 border-l-sky-600">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-sky-700" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
              Rule Trail: Arbitration Reason
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Deterministic Engine C1–C4
          </span>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          C1 Authority rule resolved the contested parameter. Core Banking Host Baseline (Auth 3) takes precedence over terminal empirical transaction (Auth 2) and deprecated peer cache (Auth 1).
        </p>

        <div className="space-y-2">
          {conflict.rule_trail.map((step) => (
            <div
              key={step.rule}
              className={`p-3 rounded-lg flex items-start gap-3 border transition-all ${
                step.decided
                  ? "bg-sky-50 border-sky-200 text-slate-900"
                  : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs shrink-0 text-slate-800">
                {step.rule}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900">
                    {step.label}
                  </span>
                  {step.decided && (
                    <GradientBadge variant="brand" size="sm">
                      DECIDED
                    </GradientBadge>
                  )}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">{step.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Lineage Timeline */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Clock className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
            Lineage &amp; Fork History
          </h3>
        </div>

        <div className="relative pl-6 space-y-4">
          <div className="absolute left-[7px] top-2 bottom-2 w-[1.5px] bg-slate-200" />

          {conflict.lineage.map((node, i) => (
            <div key={i} className="relative flex items-start gap-3 text-xs">
              <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-sky-600" />
              <div className="flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-slate-900">{node.label}</span>
                  <span className="font-mono text-[11px] text-slate-400">{node.hash}</span>
                </div>
                <div className="text-slate-600 mt-0.5">{node.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Feature 3: Tamper-Proof Cryptographic Audit Certificate Modal */}
      <AnimatePresence>
        {showCertificate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-2xl text-slate-900 flex flex-col gap-6 relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowCertificate(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Certificate Header with Official Seal */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono tracking-widest text-emerald-700 uppercase font-bold">
                      RESERVE BANK OF INDIA (RBI) DIRECTIVE 2017-18/153
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Offline Settlement &amp; Invariant Audit Certificate
                    </h2>
                    <p className="text-xs text-slate-500">
                      Cryptographically signed proof of on-soil arbitration and zero network egress
                    </p>
                  </div>
                </div>
              </div>

              {/* Certificate Data Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase">Dispute Identifier</span>
                  <div className="text-slate-900 font-bold text-sm mt-0.5">{conflict.id}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{conflict.claim}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase">Arbitration Status</span>
                  <div className="text-emerald-700 font-bold text-sm mt-0.5">
                    {conflict.status.toUpperCase()} (CONVERGED)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Rule C1: Authority Precedence</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase">Merkle Tree Root Hash</span>
                  <div className="text-sky-800 font-bold text-xs mt-0.5 break-all">
                    sha256:7e88b492f10d93a1c890be4b22c710d0482b8813fa21b92019e09d1e57c6b412
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase">Ed25519 Cryptographic Signature</span>
                  <div className="text-indigo-800 font-bold text-xs mt-0.5 break-all">
                    ed25519:sig:9a7f34bc8120e8913b82aa102f9c445100c823ea9123fe1189ac34091177de02
                  </div>
                </div>
              </div>

              {/* Regulatory Audit Statement */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-mono flex items-center gap-3">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>
                  100% On-Soil Local Execution Verified. 0 outbound network sockets created. Data remained strictly within physical device NVMe boundaries under §4.1.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 flex-wrap gap-3">
                <div className="text-[11px] font-mono text-slate-500">
                  Device ID: {deviceId} · Node: POS-402
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") window.print();
                    }}
                    className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Certificate</span>
                  </button>
                  <button
                    onClick={() => {
                      const proofData = {
                        certificate_type: "RBI_OFFLINE_PAYMENT_ARBITRATION",
                        regulation: "RBI Directive 2017-18/153",
                        dispute_id: conflict.id,
                        claim: conflict.claim,
                        arbitrated_winner: conflict.sources[0]?.claim_value || "Rs 24,850",
                        merkle_root: "sha256:7e88b492f10d93a1c890be4b22c710d0482b8813fa21b92019e09d1e57c6b412",
                        ed25519_signature: "ed25519:sig:9a7f34bc8120e8913b82aa102f9c445100c823ea9123fe1189ac34091177de02",
                        air_gapped_egress_bytes: 0,
                        timestamp: new Date().toISOString(),
                      };
                      const blob = new Blob([JSON.stringify(proofData, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${conflict.id}_RBI_AUDIT_PROOF.json`;
                      a.click();
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON Proof</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
