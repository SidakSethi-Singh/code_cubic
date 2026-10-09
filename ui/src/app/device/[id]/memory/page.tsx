"use client";

import { useState, useCallback } from "react";
import { useApp } from "@/lib/context";
import { captureMemory, overrideMemory } from "@/lib/api";
import type { MemoryRecord, CaptureResult } from "@/lib/types";
import { MOCK_MEMORIES } from "@/lib/mocks/fixtures";
import StatusBadge from "@/components/StatusBadge";
import {
  GlassCard,
  PageHeader,
  Chip,
} from "@/components/shared";
import {
  Plus,
  Send,
  X,
  ArrowUpRight,
  Lock,
  Pause,
  History,
  Paperclip,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MemoryPage() {
  const { deviceId } = useApp();
  const [memories, setMemories] = useState<MemoryRecord[]>(MOCK_MEMORIES);
  const [composerOpen, setComposerOpen] = useState(true);
  const [content, setContent] = useState("");
  const [kind, setKind] = useState("fix");
  const [assetId, setAssetId] = useState("P-204");
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [selectedMem, setSelectedMem] = useState<string | null>(null);

  // Override note dialog state
  const [overrideAction, setOverrideAction] = useState<string | null>(null);
  const [overrideNote, setOverrideNote] = useState<string>("");
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);

  const handleCapture = useCallback(async () => {
    if (!content.trim()) return;
    const result = await captureMemory(deviceId, content, kind, assetId);
    setCaptureResult(result);
    setMemories((prev) => [result.memory, ...prev]);
  }, [deviceId, content, kind, assetId]);

  const handleAttachSensorDump = () => {
    setContent(
      "Raw vibration dump from ACCEL-Z sensor on P-204, 48MB binary payload, high-load sweep 0-2000 RPM. Frequency sweep captures spike at 1,780 RPM matching 142.3 Hz acoustic resonance."
    );
    setKind("sensor");
    setAssetId("P-204");
  };

  const handleOverrideSubmit = async () => {
    if (!selectedMem || !overrideAction || !overrideNote.trim()) return;
    await overrideMemory(deviceId, selectedMem, overrideAction);

    setMemories((prev) =>
      prev.map((m) =>
        m.mem_id === selectedMem
          ? {
              ...m,
              sync_state:
                overrideAction === "share"
                  ? "pending"
                  : overrideAction === "local"
                  ? "local_only"
                  : "hold",
            }
          : m
      )
    );

    setOverrideSuccess(
      `Override to ${overrideAction.toUpperCase()} logged with note: "${overrideNote}"`
    );
    setOverrideAction(null);
    setOverrideNote("");
    setTimeout(() => setOverrideSuccess(null), 4000);
  };

  const selected = memories.find((m) => m.mem_id === selectedMem);

  const factorBar = (label: string, value: number) => {
    const isRisk = label.toLowerCase().includes("risk") || label.toLowerCase().includes("cost");
    const barColor = isRisk && value > 0.5 ? "bg-amber-600" : "bg-emerald-600";

    return (
      <div key={label} className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-slate-500">
          <span className="font-medium text-[11px] uppercase tracking-wider">{label}</span>
          <span className="font-mono text-[11px] text-slate-800 font-semibold">{(value * 100).toFixed(0)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
          <motion.div
            className={`h-full rounded-full ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(value * 100, 100)}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        category="On-Device Vector Catalog &amp; Triage"
        title="Memory Inspector"
        subtitle="Local vector records, triage policies, PII redactions, and manual overrides"
        actions={
          <button
            onClick={() => {
              setComposerOpen(!composerOpen);
              setCaptureResult(null);
            }}
            className="h-10 px-4 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-semibold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>New Capture</span>
          </button>
        }
      />

      {/* Override Success Toast */}
      <AnimatePresence>
        {overrideSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 shadow-2xs"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{overrideSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capture Composer Drawer */}
      <AnimatePresence>
        {composerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-sky-700 text-white flex items-center justify-center shadow-2xs">
                    <Plus className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                    Capture Composer
                  </h3>
                </div>
                <button
                  onClick={() => setComposerOpen(false)}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>

              {/* Controls Row */}
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">Kind:</span>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                    className="h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-sky-600"
                  >
                    <option value="fix">FIX (Remediation)</option>
                    <option value="note">NOTE (Technician Observation)</option>
                    <option value="incident">INCIDENT (Structural Defect)</option>
                    <option value="sensor">SENSOR (Telemetry Stream)</option>
                    <option value="bulletin">BULLETIN (Engineering Note)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">Asset:</span>
                  <select
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    className="h-8 px-2.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-sky-600"
                  >
                    <option value="P-204">P-204 (Slurry Pump)</option>
                    <option value="T-34">T-34 (Cooling Tower)</option>
                    <option value="V-109">V-109 (Gate Valve)</option>
                    <option value="GEN-01">GEN-01 (General)</option>
                  </select>
                </div>

                <button
                  onClick={handleAttachSensorDump}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 transition-all ml-auto cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.8} />
                  <span>Attach Sensor Dump</span>
                </button>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter field note, torque measurement, or observation..."
                rows={3}
                className="w-full bg-white border border-slate-300 rounded-xl p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 resize-none leading-relaxed shadow-2xs"
              />

              {/* Policy Rule Quick Test Presets */}
              <div className="flex items-center gap-2 mt-3 mb-4 flex-wrap">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Policy Test Presets:
                </span>
                <Chip
                  size="sm"
                  variant="brand"
                  onClick={() => {
                    setContent("Paytm Merchant note: Card 4111-2222-3333-4444 charged ₹2,500. Call manager Vikram on +91 98765 43210 for reconciliation.");
                    setKind("note");
                    setAssetId("POS-402");
                  }}
                >
                  💳 Paytm PII Note (Card &amp; Phone)
                </Chip>
                <Chip
                  size="sm"
                  variant="tier1"
                  onClick={() => {
                    setContent("Confirmed: 145 Nm cross-pattern tightening eliminates P-204 grinding noise. Verified on 3 pumps.");
                    setKind("fix");
                  }}
                >
                  Share (Safe fix)
                </Chip>
                <Chip
                  size="sm"
                  variant="brand"
                  onClick={() => {
                    setContent("Asha K. phone +49 171 555 0192 for emergency callout at Plant North.");
                    setKind("note");
                  }}
                >
                  Local-only (PII phone)
                </Chip>
                <Chip
                  size="sm"
                  variant="default"
                  onClick={handleAttachSensorDump}
                >
                  Hold (48MB size limit)
                </Chip>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  onClick={handleCapture}
                  disabled={!content.trim()}
                  className="h-9 px-5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold shadow-xs disabled:opacity-40 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>Submit Capture</span>
                </button>
              </div>

              {/* Resulting Decision Card */}
              {captureResult && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <StatusBadge status={captureResult.decision.action} />
                      <span className="text-xs text-slate-500 font-mono">
                        Score: {captureResult.decision.score.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-sky-800 font-semibold">
                      MEM-ID: {captureResult.memory.mem_id}
                    </span>
                  </div>

                  <p className="text-sm text-slate-900 font-medium leading-relaxed">
                    Reason: {captureResult.decision.reason}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-200">
                    {factorBar("Authority", captureResult.decision.factors.authority)}
                    {factorBar("Dedupe", captureResult.decision.factors.dedupe)}
                    {factorBar("Novelty", captureResult.decision.factors.novelty)}
                    {factorBar("PII Risk", captureResult.decision.factors.pii)}
                    {factorBar("Size Cost", captureResult.decision.factors.size)}
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      Rule Hits:
                    </span>
                    {captureResult.decision.rule_hits.map((rh) => (
                      <span
                        key={rh}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold"
                      >
                        {rh}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Table + Row Detail Inspector */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Memory Records Table */}
        <div className="w-full flex-1 rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                  <th className="py-3 px-3.5">ID</th>
                  <th className="py-3 px-3.5">Preview</th>
                  <th className="py-3 px-3.5">Kind</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5">Sync State</th>
                  <th className="py-3 px-3.5">Auth</th>
                  <th className="py-3 px-3.5">Ver</th>
                  <th className="py-3 px-3.5">Updated</th>
                </tr>
              </thead>
              <tbody>
                {memories.map((mem) => {
                  const isSelected = selectedMem === mem.mem_id;
                  return (
                    <tr
                      key={mem.mem_id}
                      onClick={() => setSelectedMem(isSelected ? null : mem.mem_id)}
                      className={`border-b border-slate-100 cursor-pointer transition-colors duration-100 h-12 text-xs ${
                        isSelected
                          ? "bg-sky-50 text-slate-900"
                          : "hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <td className="py-2.5 px-3.5 font-mono font-bold text-sky-700">
                        {mem.mem_id}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-900 font-medium max-w-xs truncate">
                        {mem.title || mem.content}
                      </td>
                      <td className="py-2.5 px-3.5 uppercase text-[11px] font-mono">
                        {mem.kind}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <StatusBadge status={mem.status} />
                      </td>
                      <td className="py-2.5 px-3.5">
                        <StatusBadge status={mem.sync_state} />
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 3 }, (_, i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${
                                i < mem.authority
                                  ? "bg-emerald-600"
                                  : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-slate-400">
                        v{mem.version}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-400">
                        {new Date(mem.updated_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Row Detail Inspector */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="w-full lg:w-[460px] rounded-xl bg-white border border-slate-200 shadow-xl p-5 shrink-0 flex flex-col gap-4 text-slate-900"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-sky-700">
                    {selected.mem_id}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    v{selected.version}
                  </span>
                  <StatusBadge status={selected.sync_state} />
                </div>
                <button
                  onClick={() => setSelectedMem(null)}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>

              {/* Redaction Inspection */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Content &amp; Redaction Inspection
                </span>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] text-slate-500">Original Payload:</div>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {selected.content}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Export Payload:</span>
                    {selected.pii_spans && selected.pii_spans.length > 0 && (
                      <span className="text-rose-700 font-semibold font-mono text-[10px]">
                        PII DETECTED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {selected.redacted_content ? (
                      selected.redacted_content
                    ) : selected.pii_spans && selected.pii_spans.length > 0 ? (
                      <span>
                        {selected.content.slice(0, selected.pii_spans[0].start)}
                        <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md border border-amber-300 font-mono text-[11px] font-bold">
                          [REDACTED_PHONE]
                        </span>
                        {selected.content.slice(selected.pii_spans[0].end)}
                      </span>
                    ) : (
                      selected.content
                    )}
                  </p>
                </div>
              </div>

              {/* Policy Evaluation Card */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Policy Evaluation
                  </span>
                  <StatusBadge status={selected.sync_state} />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selected.sync_state === "local_only"
                    ? "Contains personal phone number. Restricted to local storage under fleet privacy policy §4.1."
                    : selected.sync_state === "hold"
                    ? "Raw telemetry payload exceeds 25 MB mesh transfer limit. Held for dock sync."
                    : "Verified technical remediation procedure. Approved for selective mesh replication."}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  {factorBar("Authority Weight", selected.authority / 3)}
                  {factorBar("Dedupe Score", 0.15)}
                  {factorBar("Novelty Metric", 0.88)}
                  {factorBar("PII Risk", selected.pii_spans?.length ? 1.0 : 0.0)}
                  {factorBar("Transfer Cost", selected.kind === "sensor" ? 0.95 : 0.08)}
                </div>
              </div>

              {/* Lineage Timeline */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Lineage Timeline
                  </span>
                </div>

                <div className="relative pl-5 space-y-2 text-xs">
                  <div className="absolute left-[5px] top-1.5 bottom-1.5 w-[1.5px] bg-slate-200" />
                  <div className="relative flex items-start gap-2">
                    <div className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-emerald-600" />
                    <div>
                      <div className="font-semibold text-slate-900">
                        Captured by {selected.source_device}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Hash: {selected.content_hash}
                      </div>
                    </div>
                  </div>

                  <div className="relative flex items-start gap-2">
                    <div className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-sky-600" />
                    <div>
                      <div className="font-semibold text-slate-900">
                        Policy Triage: {selected.sync_state.toUpperCase()}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Committed to SQLite WAL
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operator Overrides */}
              <div className="pt-3 border-t border-slate-200">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Operator Policy Overrides
                </span>

                {overrideAction ? (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-semibold text-sky-800">
                      Override to: {overrideAction.toUpperCase()}
                    </div>
                    <input
                      type="text"
                      value={overrideNote}
                      onChange={(e) => setOverrideNote(e.target.value)}
                      placeholder="Justification note for audit ledger..."
                      className="w-full h-8 px-2.5 rounded-md border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setOverrideAction(null)}
                        className="px-2.5 py-1 rounded-md text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleOverrideSubmit}
                        disabled={!overrideNote.trim()}
                        className="px-3 py-1 rounded-md bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        Confirm Override
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setOverrideAction("share")}
                      className="py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Share</span>
                    </button>
                    <button
                      onClick={() => setOverrideAction("local")}
                      className="py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Local</span>
                    </button>
                    <button
                      onClick={() => setOverrideAction("hold")}
                      className="py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5 text-amber-600" />
                      <span>Hold</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
