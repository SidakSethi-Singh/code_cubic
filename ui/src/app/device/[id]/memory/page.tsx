"use client";

import { useState, useCallback } from "react";
import { useApp } from "@/lib/context";
import { captureMemory, overrideMemory } from "@/lib/api";
import type { MemoryRecord, CaptureResult, PolicyDecision } from "@/lib/types";
import { MOCK_MEMORIES, MOCK_CAPTURE_RESULTS } from "@/lib/mocks/fixtures";
import StatusBadge from "@/components/StatusBadge";
import {
  Plus,
  Send,
  X,
  FileCode,
  ArrowUpRight,
  Lock,
  Pause,
  Clock,
  History,
  ShieldCheck,
  Paperclip,
  Check,
} from "lucide-react";

export default function MemoryPage() {
  const { deviceId } = useApp();
  const [memories, setMemories] = useState<MemoryRecord[]>(MOCK_MEMORIES);
  const [composerOpen, setComposerOpen] = useState(false);
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
    // Add memory to list immediately so technician sees it
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

    // Update memory sync_state locally
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

  const factorBar = (label: string, value: number) => (
    <div key={label} className="flex flex-col gap-1">
      <div className="flex justify-between font-mono text-xs text-[var(--color-muted)]">
        <span className="uppercase">{label}</span>
        <span>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full rounded-[2px] bg-[var(--color-bg)] border border-[var(--color-border)] overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)] accent-fill"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 h-full max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono text-[var(--color-text)]">
            Memory Inspector
          </h1>
          <p className="text-base text-[var(--color-muted)] mt-1">
            Local vector records, triage policies, PII redactions, and manual overrides
          </p>
        </div>
        <button
          onClick={() => {
            setComposerOpen(!composerOpen);
            setCaptureResult(null);
          }}
          className="flex items-center gap-2 h-10 px-5 rounded-[2px] bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-mono font-bold text-base accent-fill hover:opacity-90 transition-opacity duration-120"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          <span>New Capture</span>
        </button>
      </div>

      {overrideSuccess && (
        <div className="p-3 rounded-[2px] bg-[var(--color-accent-dim)] border border-[var(--color-accent)] text-[var(--color-accent)] font-mono text-sm accent-text accent-border">
          {overrideSuccess}
        </div>
      )}

      {/* Capture Composer at top */}
      {composerOpen && (
        <div className="rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[var(--color-accent)] accent-text" strokeWidth={1.5} />
              <span className="font-mono text-sm font-bold text-[var(--color-text)] uppercase tracking-wider">
                Capture Composer
              </span>
            </div>
            <button
              onClick={() => setComposerOpen(false)}
              className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* Controls: Kind select, Asset select, Attach Sensor Dump */}
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[var(--color-muted)]">KIND:</span>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="h-9 px-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[2px] font-mono text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="fix">FIX (Remediation)</option>
                <option value="note">NOTE (Technician Observation)</option>
                <option value="incident">INCIDENT (Structural Defect)</option>
                <option value="sensor">SENSOR (Telemetry Stream)</option>
                <option value="bulletin">BULLETIN (Engineering Note)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[var(--color-muted)]">ASSET:</span>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="h-9 px-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[2px] font-mono text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="P-204">P-204 (Slurry Pump)</option>
                <option value="T-34">T-34 (Cooling Tower)</option>
                <option value="V-109">V-109 (Gate Valve)</option>
                <option value="GEN-01">GEN-01 (General)</option>
              </select>
            </div>

            <button
              onClick={handleAttachSensorDump}
              className="flex items-center gap-1.5 h-9 px-3 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)] font-mono text-xs text-[var(--color-text)] hover:border-[var(--color-accent)] transition-colors duration-120 ml-auto"
            >
              <Paperclip className="w-3.5 h-3.5 text-[var(--color-accent)] accent-text" strokeWidth={1.5} />
              <span>Attach Sensor Dump</span>
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter field note, torque measurement, or observation..."
            rows={3}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[2px] p-3 text-base font-mono text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors duration-120 resize-none"
          />

          {/* Quick presets for testing all policy rules */}
          <div className="flex items-center gap-2 mt-2 mb-4 flex-wrap">
            <span className="text-xs text-[var(--color-muted)] font-mono">Quick test presets:</span>
            <button
              onClick={() => {
                setContent("Confirmed: 145 Nm cross-pattern tightening eliminates P-204 grinding noise. Verified on 3 pumps.");
                setKind("fix");
              }}
              className="px-2 py-0.5 rounded-[2px] border border-[var(--color-border)] text-xs font-mono text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Share (Safe fix)
            </button>
            <button
              onClick={() => {
                setContent("Asha K. phone +49 171 555 0192 for emergency callout at Plant North.");
                setKind("note");
              }}
              className="px-2 py-0.5 rounded-[2px] border border-[var(--color-border)] text-xs font-mono text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Local-only (PII phone)
            </button>
            <button
              onClick={handleAttachSensorDump}
              className="px-2 py-0.5 rounded-[2px] border border-[var(--color-border)] text-xs font-mono text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Hold (48MB size limit)
            </button>
          </div>

          <button
            onClick={handleCapture}
            disabled={!content.trim()}
            className="flex items-center gap-2 h-10 px-6 rounded-[2px] bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-mono font-bold text-base disabled:opacity-40 transition-opacity duration-120 accent-fill"
          >
            <Send className="w-4 h-4" strokeWidth={1.5} />
            <span>Submit</span>
          </button>

          {/* RESULTING DECISION CARD IMMEDIATELY (no page reload) */}
          {captureResult && (
            <div className="mt-5 p-4 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-accent)] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <StatusBadge status={captureResult.decision.action} />
                  <span className="font-mono text-sm text-[var(--color-muted)]">
                    Score: {captureResult.decision.score.toFixed(2)}
                  </span>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded-[2px] bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-accent)] accent-text">
                  MEM-ID: {captureResult.memory.mem_id}
                </span>
              </div>

              <div className="font-sans text-base text-[var(--color-text)] font-medium">
                Reason: {captureResult.decision.reason}
              </div>

              {/* Factor bars */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-[var(--color-border)]">
                {factorBar("Authority", captureResult.decision.factors.authority)}
                {factorBar("Dedupe", captureResult.decision.factors.dedupe)}
                {factorBar("Novelty", captureResult.decision.factors.novelty)}
                {factorBar("PII Risk", captureResult.decision.factors.pii)}
                {factorBar("Size Cost", captureResult.decision.factors.size)}
              </div>

              {/* Rule hits */}
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs text-[var(--color-muted)]">Rule Hits:</span>
                {captureResult.decision.rule_hits.map((rh) => (
                  <span
                    key={rh}
                    className="font-mono text-xs px-2 py-0.5 rounded-[2px] bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-accent)] accent-text"
                  >
                    {rh}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Table + Row Detail Drawer */}
      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
        {/* Table below */}
        <div className="flex-1 rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] font-mono text-xs text-[var(--color-muted)] uppercase text-left sticky top-0">
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Text Preview</th>
                <th className="py-2.5 px-3">Kind</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Sync State</th>
                <th className="py-2.5 px-3">Auth</th>
                <th className="py-2.5 px-3">Ver</th>
                <th className="py-2.5 px-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {memories.map((mem) => {
                const isSelected = selectedMem === mem.mem_id;
                return (
                  <tr
                    key={mem.mem_id}
                    onClick={() => setSelectedMem(isSelected ? null : mem.mem_id)}
                    className={`border-b border-[var(--color-border)] cursor-pointer transition-colors duration-120 h-12 font-mono text-sm ${
                      isSelected
                        ? "bg-[var(--color-accent-dim)] border-[var(--color-accent)]"
                        : "hover:bg-[var(--color-surface-2)]"
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-[var(--color-accent)] accent-text">
                      {mem.mem_id}
                    </td>
                    <td className="py-2 px-3 font-sans text-base text-[var(--color-text)] max-w-xs truncate">
                      {mem.title || mem.content}
                    </td>
                    <td className="py-2 px-3 uppercase text-xs text-[var(--color-muted)]">
                      {mem.kind}
                    </td>
                    <td className="py-2 px-3">
                      <StatusBadge status={mem.status} />
                    </td>
                    <td className="py-2 px-3">
                      <StatusBadge status={mem.sync_state} />
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 3 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < mem.authority
                                ? "bg-[var(--color-accent)] accent-fill"
                                : "bg-[var(--color-surface-2)] border border-[var(--color-border)]"
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-[var(--color-muted)]">
                      v{mem.version}
                    </td>
                    <td className="py-2 px-3 text-[var(--color-muted)] text-xs">
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

        {/* ROW CLICK OPENS DRAWER */}
        {selected && (
          <div className="w-[480px] rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] overflow-auto p-5 shrink-0 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-[var(--color-accent)] accent-text">
                  {selected.mem_id}
                </span>
                <span className="font-mono text-xs text-[var(--color-muted)]">
                  v{selected.version}
                </span>
                <StatusBadge status={selected.sync_state} />
              </div>
              <button
                onClick={() => setSelectedMem(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Full text next to redacted text with PII spans highlighted in dim amber */}
            <div>
              <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider block mb-2">
                Content &amp; Redaction Inspection
              </span>

              <div className="space-y-3">
                {/* Full Original Text */}
                <div className="p-3 rounded-[2px] bg-[var(--color-bg)] border border-[var(--color-border)]">
                  <div className="font-mono text-xs text-[var(--color-muted)] mb-1">
                    Original Local Payload
                  </div>
                  <p className="font-mono text-sm text-[var(--color-text)] leading-relaxed">
                    {selected.content}
                  </p>
                </div>

                {/* Redacted Payload */}
                <div className="p-3 rounded-[2px] bg-[var(--color-bg)] border border-[var(--color-border)]">
                  <div className="font-mono text-xs text-[var(--color-muted)] mb-1 flex items-center justify-between">
                    <span>Export / Redacted Payload</span>
                    {selected.pii_spans && selected.pii_spans.length > 0 && (
                      <span className="text-[var(--color-accent)] font-bold accent-text">
                        PII SPANS DETECTED
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-sm text-[var(--color-text)] leading-relaxed">
                    {selected.redacted_content ? (
                      selected.redacted_content
                    ) : selected.pii_spans && selected.pii_spans.length > 0 ? (
                      <span>
                        {selected.content.slice(0, selected.pii_spans[0].start)}
                        <span className="bg-[var(--color-accent-dim)] text-[var(--color-accent)] px-1 rounded-[2px] border border-[var(--color-accent)] font-bold accent-border accent-text">
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
            </div>

            {/* Decision Card with factor bars and rule hits */}
            <div className="p-4 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider">
                  Policy Evaluation
                </span>
                <StatusBadge status={selected.sync_state} />
              </div>
              <p className="font-sans text-sm text-[var(--color-text)] mb-3">
                {selected.sync_state === "local_only"
                  ? "Contains personal phone number. Restricted to local storage under fleet privacy policy §4.1."
                  : selected.sync_state === "hold"
                  ? "Raw telemetry payload exceeds 25 MB mesh transfer limit. Held for dock sync."
                  : "Verified technical remediation procedure. Approved for selective mesh replication."}
              </p>

              <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                {factorBar("Authority Weight", selected.authority / 3)}
                {factorBar("Dedupe Score", 0.15)}
                {factorBar("Novelty Metric", 0.88)}
                {factorBar("PII Risk", selected.pii_spans?.length ? 1.0 : 0.0)}
                {factorBar(
                  "Transfer Size Cost",
                  selected.kind === "sensor" ? 0.95 : 0.08
                )}
              </div>
            </div>

            {/* Lineage Timeline (1px vertical line, square nodes) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-[var(--color-muted)]" strokeWidth={1.5} />
                <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider">
                  Lineage Timeline
                </span>
              </div>

              <div className="relative pl-6 space-y-4 font-mono text-xs">
                <div className="absolute left-[9px] top-1.5 bottom-1.5 w-px bg-[var(--color-border)]" />
                <div className="relative flex items-start gap-2">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-[2px] bg-[var(--color-accent)] border border-[var(--color-accent)] accent-fill" />
                  <div>
                    <span className="font-bold text-[var(--color-text)]">
                      Captured by {selected.source_device}
                    </span>
                    <div className="text-[var(--color-muted)] mt-0.5">
                      Hash: {selected.content_hash}
                    </div>
                  </div>
                </div>

                <div className="relative flex items-start gap-2">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-[2px] bg-[var(--color-accent)] border border-[var(--color-accent)] accent-fill" />
                  <div>
                    <span className="font-bold text-[var(--color-text)]">
                      Policy Engine Triage: {selected.sync_state.toUpperCase()}
                    </span>
                    <div className="text-[var(--color-muted)] mt-0.5">
                      Committed to SQLite WAL
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Override Buttons: Force share / Keep local / Hold, each asks for a note and logs it */}
            <div className="pt-3 border-t border-[var(--color-border)]">
              <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider block mb-2">
                Operator Policy Overrides
              </span>

              {overrideAction ? (
                <div className="p-3 rounded-[2px] bg-[var(--color-bg)] border border-[var(--color-border)] space-y-2">
                  <div className="font-mono text-xs text-[var(--color-accent)] font-bold accent-text">
                    Override to: {overrideAction.toUpperCase()}
                  </div>
                  <input
                    type="text"
                    value={overrideNote}
                    onChange={(e) => setOverrideNote(e.target.value)}
                    placeholder="Enter justification note for audit ledger..."
                    className="w-full h-9 px-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2px] font-mono text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setOverrideAction(null)}
                      className="px-3 py-1 rounded-[2px] font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleOverrideSubmit}
                      disabled={!overrideNote.trim()}
                      className="px-3 py-1 rounded-[2px] bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-mono text-xs font-bold disabled:opacity-40 accent-fill"
                    >
                      Confirm Override
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOverrideAction("share")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm font-mono text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors duration-120"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Force Share</span>
                  </button>
                  <button
                    onClick={() => setOverrideAction("local")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm font-mono text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors duration-120"
                  >
                    <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Keep Local</span>
                  </button>
                  <button
                    onClick={() => setOverrideAction("hold")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm font-mono text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors duration-120"
                  >
                    <Pause className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Hold</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
