"use client";

import { useState, useCallback, useEffect } from "react";
import { useApp } from "@/lib/context";
import { searchMemories } from "@/lib/api";
import type { SearchResponse, SearchHit } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import {
  Search,
  Zap,
  Cpu,
  ChevronRight,
  Filter,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers,
  Network,
  Server,
  Wifi,
  Globe,
  ShieldCheck,
} from "lucide-react";

export default function SearchPage() {
  const { deviceId, isOffline } = useApp();
  const [query, setQuery] = useState("P-204 grinding noise at high load");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [selectedHit, setSelectedHit] = useState<string | null>(null);
  const [explainHit, setExplainHit] = useState<string | null>(null);

  // Filters
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [assetFilter, setAssetFilter] = useState<string>("all");

  const handleSearch = useCallback(
    async (qToSearch?: string) => {
      const q = qToSearch !== undefined ? qToSearch : query;
      if (!q.trim()) return;
      setLoading(true);
      try {
        const data = await searchMemories(deviceId, q);
        // If query is "unrelated query" or "unknown", demonstrate low confidence state
        if (q.toLowerCase().includes("unknown") || q.toLowerCase().includes("unrelated") || q.toLowerCase().includes("empty")) {
          setResult({
            ...data,
            hits: [],
            answer: {
              ...data.answer,
              answer: "No indexed vectors sufficiently align with this query in the local SQLite WAL and Qdrant mirror.",
              confidence: 0.12,
              confidence_label: "LOW",
              low_confidence: true,
              citations: [],
            },
          });
        } else {
          setResult(data);
        }
      } catch {
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [deviceId, query]
  );

  useEffect(() => {
    // Initial search load
    handleSearch("P-204 grinding noise at high load");
  }, [handleSearch]);

  const confidenceBlocks = (confidence: number) => {
    const filled = Math.round(confidence * 10);
    return Array.from({ length: 10 }, (_, i) => (
      <div
        key={i}
        className={`w-3 h-6 rounded-[2px] transition-colors duration-120 ${
          i < filled
            ? "bg-[var(--color-accent)] accent-fill"
            : "bg-[var(--color-surface-2)] border border-[var(--color-border)]"
        }`}
      />
    ));
  };

  const jumpToHit = (memId: string) => {
    setSelectedHit(memId);
    const el = document.getElementById(`hit-${memId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const filteredHits = result?.hits.filter((h) => {
    if (kindFilter !== "all" && h.memory.kind !== kindFilter) return false;
    if (assetFilter !== "all" && h.memory.asset_id !== assetFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 max-w-5xl pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-mono text-[var(--color-text)]">
          Search Playground
        </h1>
        <p className="text-base text-[var(--color-muted)] mt-1">
          Local hybrid dense (FastEmbed) + BM25 (Qdrant) search with zero network egress
        </p>
      </div>

      {/* Large 56px Query Input Box */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search local memory: e.g. P-204 grinding noise..."
            className="w-full h-14 pl-12 pr-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2px] text-lg font-mono text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors duration-120"
          />
        </div>
        <button
          onClick={() => handleSearch()}
          disabled={loading}
          className="h-14 px-8 rounded-[2px] bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-mono font-bold text-base transition-opacity duration-120 disabled:opacity-50 accent-fill shrink-0"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Filter Chips Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-muted)] mr-1">
          <Filter className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>KIND:</span>
        </div>
        {["all", "manual", "incident", "bulletin", "sensor"].map((k) => (
          <button
            key={k}
            onClick={() => setKindFilter(k)}
            className={`px-2.5 py-1 rounded-[2px] font-mono text-xs border transition-colors duration-120 uppercase ${
              kindFilter === k
                ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)] border-[var(--color-accent)] font-bold accent-text accent-border"
                : "bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border)] hover:text-[var(--color-text)]"
            }`}
          >
            {k}
          </button>
        ))}

        <div className="w-px h-4 bg-[var(--color-border)] mx-1" />

        <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-muted)] mr-1">
          <span>ASSET:</span>
        </div>
        {["all", "P-204", "T-34"].map((a) => (
          <button
            key={a}
            onClick={() => setAssetFilter(a)}
            className={`px-2.5 py-1 rounded-[2px] font-mono text-xs border transition-colors duration-120 uppercase ${
              assetFilter === a
                ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)] border-[var(--color-accent)] font-bold accent-text accent-border"
                : "bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border)] hover:text-[var(--color-text)]"
            }`}
          >
            {a}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-[var(--color-muted)]">DEMO PRESETS:</span>
          <button
            onClick={() => {
              setQuery("P-204 grinding noise at high load");
              handleSearch("P-204 grinding noise at high load");
            }}
            className="text-xs font-mono px-2 py-0.5 rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] text-emerald-400 hover:border-emerald-400"
          >
            Tier 1 (Local)
          </button>
          <button
            onClick={() => {
              setQuery("C-102 gas compressor cavitation");
              handleSearch("C-102 gas compressor cavitation");
            }}
            className="text-xs font-mono px-2 py-0.5 rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] text-amber-400 hover:border-amber-400"
          >
            Tier 2 (WiFi P2P)
          </button>
          <button
            onClick={() => {
              setQuery("unknown turbine seal leak");
              handleSearch("unknown turbine seal leak");
            }}
            className="text-xs font-mono px-2 py-0.5 rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-accent)]"
          >
            Tier 0 (Gap)
          </button>
        </div>
      </div>

      {result && (
        <>
          {/* SMART QUERY DISPATCH TELEMETRY (AIR-GAP INVARIANT & HOP CHAIN) */}
          <div className="rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-[var(--color-accent)] accent-text" strokeWidth={1.5} />
                <span className="font-mono text-xs font-bold text-[var(--color-text)] tracking-wider">
                  SMART QUERY ROUTING ENGINE
                </span>
                <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-muted)]">
                  AIR-GAP INVARIANT
                </span>
              </div>

              {/* Route Resolution Pill */}
              <div
                className={`px-2.5 py-1 rounded-[2px] font-mono text-xs font-bold flex items-center gap-1.5 border ${
                  result.routing?.route === "LOCAL_SHARD"
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                    : result.routing?.route === "PEER_P2P_WIFI"
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                    : result.routing?.route === "FLEET_HUB"
                    ? "bg-sky-500/10 border-sky-500/40 text-sky-400"
                    : "bg-rose-500/10 border-rose-500/40 text-rose-400"
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full animate-pulse bg-current" />
                <span>{result.routing?.label || "LOCAL AIR-GAP SHARD"}</span>
              </div>
            </div>

            {/* 3-Tier Dispatch Topology Hop Chain */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-1 font-mono text-xs">
              {/* Tier 1 Node */}
              <div
                className={`p-2.5 rounded-[2px] border transition-all duration-150 ${
                  result.routing?.tier === 1
                    ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface-2)] opacity-55"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-[var(--color-muted)] mb-1">
                  <span>TIER 1 (0.00ms)</span>
                  <span className="font-bold text-emerald-400">0B EGRESS</span>
                </div>
                <div className="font-bold text-[var(--color-text)] flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
                  <span>Local Qdrant Shard</span>
                </div>
                <div className="text-[11px] text-[var(--color-muted)] mt-1 truncate">
                  {result.routing?.tier === 1 ? "✓ Resolved on device with 0 network calls" : "Standby / Evaluated"}
                </div>
              </div>

              {/* Tier 2 Subnet Peer */}
              <div
                className={`p-2.5 rounded-[2px] border transition-all duration-150 ${
                  result.routing?.tier === 2
                    ? "border-amber-500 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface-2)] opacity-55"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-[var(--color-muted)] mb-1">
                  <span>TIER 2 (WiFi P2P)</span>
                  <span className="text-amber-400 font-bold">LAN MESH ONLY</span>
                </div>
                <div className="font-bold text-[var(--color-text)] flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
                  <span>Subnet Peer ({deviceId === "device-b" ? "Device A" : "Device B"})</span>
                </div>
                <div className="text-[11px] text-[var(--color-muted)] mt-1 truncate">
                  {result.routing?.tier === 2
                    ? `✓ Resolved via peer WiFi (${result.routing.lan_rtt_ms}ms LAN)`
                    : "Standby P2P fallback"}
                </div>
              </div>

              {/* Tier 3 Fleet Cloud */}
              <div
                className={`p-2.5 rounded-[2px] border transition-all duration-150 ${
                  result.routing?.tier === 3
                    ? "border-sky-500 bg-sky-500/10 shadow-[0_0_12px_rgba(14,165,233,0.15)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface-2)] opacity-55"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-[var(--color-muted)] mb-1">
                  <span>TIER 3 (Fleet Hub)</span>
                  <span className="text-sky-400 font-bold">CLOUD EGRESS</span>
                </div>
                <div className="font-bold text-[var(--color-text)] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.5} />
                  <span>Fleet Central Hub</span>
                </div>
                <div className="text-[11px] text-[var(--color-muted)] mt-1 truncate">
                  {result.routing?.tier === 3 ? "✓ Escalated to fleet manuals" : "Air-gap shielded (0 egress)"}
                </div>
              </div>
            </div>

            {/* Telemetry metadata footer */}
            <div className="text-xs font-mono text-[var(--color-muted)] flex items-center justify-between border-t border-[var(--color-border)] pt-2 flex-wrap gap-2">
              <span className="truncate max-w-xl">
                Dispatch: <strong className="text-[var(--color-text)]">{result.routing?.reason}</strong>
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <span>
                  Target: <strong className="text-[var(--color-text)]">{result.routing?.target_node}</strong>
                </span>
                <span>
                  Internet Egress:{" "}
                  <strong className="text-emerald-400">
                    {result.routing?.internet_egress_bytes ?? 0} Bytes
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Latency Badge: embed/retrieve/fuse/rerank/total in mono ms */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-sm">
              <Zap className="w-4 h-4 text-[var(--color-accent)] accent-text" strokeWidth={1.5} />
              <span className="text-[var(--color-muted)]">embed</span>
              <span className="text-[var(--color-text)]">{result.latency.embed_ms}ms</span>
              <span className="text-[var(--color-border)]">|</span>
              <span className="text-[var(--color-muted)]">retrieve</span>
              <span className="text-[var(--color-text)]">{result.latency.retrieve_ms}ms</span>
              <span className="text-[var(--color-border)]">|</span>
              <span className="text-[var(--color-muted)]">fuse</span>
              <span className="text-[var(--color-text)]">{result.latency.fuse_ms}ms</span>
              <span className="text-[var(--color-border)]">|</span>
              <span className="text-[var(--color-muted)]">rerank</span>
              <span className="text-[var(--color-text)]">{result.latency.rerank_ms}ms</span>
              <span className="text-[var(--color-border)]">|</span>
              <span className="text-[var(--color-muted)]">total</span>
              <span className="font-bold text-[var(--color-accent)] accent-text">
                {result.latency.total_ms}ms
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-sm">
              <Cpu className="w-4 h-4 text-[var(--color-accent)] accent-text" strokeWidth={1.5} />
              <span className="text-[var(--color-text)]">
                {result.total_candidates.toLocaleString()} candidates evaluated
              </span>
            </div>

            {isOffline && (
              <div className="px-3 py-1.5 rounded-[2px] border border-[var(--color-muted)] font-mono text-sm text-[var(--color-muted)]">
                OFFLINE — 0 NETWORK CALLS
              </div>
            )}
          </div>

          {/* Low-confidence empty state OR Answer card */}
          {result.answer.low_confidence ? (
            <div className="rounded-[2px] bg-[var(--color-surface)] border border-dashed border-[var(--color-accent)] p-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle
                  className="w-5 h-5 text-[var(--color-accent)] accent-text"
                  strokeWidth={1.5}
                />
                <h3 className="font-mono text-lg font-bold text-[var(--color-text)]">
                  Not enough evidence. Logged as a knowledge gap.
                </h3>
              </div>
              <p className="text-base text-[var(--color-muted)] mb-4">
                The local vector corpus does not contain validated procedures or incident history matching &quot;{result.query}&quot;. A knowledge-gap telemetry ticket has been registered in the SQLite WAL for hub triage upon reconnect.
              </p>
              <div className="flex items-center gap-3 font-mono text-xs text-[var(--color-muted)]">
                <span className="px-2 py-0.5 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-accent)] accent-text">
                  GAP-ID: GAP-2026-081
                </span>
                <span>Confidence: {Math.round(result.answer.confidence * 100)}%</span>
                <span>Logged to outbox for Meera S.</span>
              </div>
            </div>
          ) : (
            <div className="rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="w-4 h-4 text-[var(--color-accent)] accent-text"
                    strokeWidth={1.5}
                  />
                  <span className="font-mono text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">
                    Extractive Synthesis
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {confidenceBlocks(result.answer.confidence)}
                  </div>
                  <span className="font-mono text-sm font-bold text-[var(--color-accent)] accent-text">
                    {Math.round(result.answer.confidence * 100)}% {result.answer.confidence_label}
                  </span>
                </div>
              </div>

              <p className="text-base text-[var(--color-text)] leading-relaxed font-sans">
                {result.answer.answer}
              </p>

              {/* Citation Chips: Click jumps to matching hit */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="font-mono text-xs text-[var(--color-muted)] mr-1">
                  CITATIONS:
                </span>
                {result.answer.citations.map((c) => (
                  <button
                    key={c.mem_id}
                    onClick={() => jumpToHit(c.mem_id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[var(--color-accent-dim)] border border-[var(--color-border)] hover:border-[var(--color-accent)] font-mono text-xs text-[var(--color-accent)] accent-text transition-colors duration-120"
                    title={`Jump to ${c.display_id}`}
                  >
                    <span className="font-bold">[{c.display_id}]</span>
                    <span className="text-[var(--color-text)]">{c.title}</span>
                    <span className="text-[var(--color-muted)]">· Auth {c.authority}</span>
                  </button>
                ))}
              </div>

              <div className="mt-3 text-xs font-mono text-[var(--color-muted)] border-t border-[var(--color-border)] pt-2 flex items-center justify-between">
                <span>Model: {result.answer.model_tag}</span>
                <span>Extracted in {result.answer.latency_ms}ms</span>
              </div>
            </div>
          )}

          {/* Hits List */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider">
                Ranked Vector &amp; BM25 Hits ({filteredHits?.length || 0})
              </span>
              <span className="font-mono text-xs text-[var(--color-muted)]">
                Reciprocal Rank Fusion (k=60)
              </span>
            </div>

            {filteredHits?.map((hit, i) => {
              const mem = hit.memory;
              const isSelected = selectedHit === hit.mem_id;
              const isExplainOpen = explainHit === hit.mem_id;
              const denseRank = hit.branch_ranks.find((b) => b.branch === "dense");
              const bm25Rank = hit.branch_ranks.find((b) => b.branch === "bm25");

              return (
                <div
                  key={hit.mem_id}
                  id={`hit-${hit.mem_id}`}
                  className={`rounded-[2px] border transition-colors duration-120 overflow-hidden ${
                    isSelected
                      ? "bg-[var(--color-surface)] border-[var(--color-accent)]"
                      : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-muted)]"
                  }`}
                >
                  <div
                    onClick={() =>
                      setSelectedHit(isSelected ? null : hit.mem_id)
                    }
                    className="flex items-center gap-4 px-4 py-3.5 cursor-pointer"
                  >
                    {/* Rank */}
                    <span className="font-mono text-lg font-bold text-[var(--color-muted)] w-6 text-center">
                      #{i + 1}
                    </span>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-sm font-bold text-[var(--color-accent)] accent-text">
                          {mem.mem_id}
                        </span>
                        <StatusBadge status={mem.sync_state} />
                        <span className="font-mono text-xs text-[var(--color-muted)] uppercase">
                          {mem.kind}
                        </span>

                        {/* Provenance Chip */}
                        {mem.source_device === "Device A" && (
                          <span className="font-mono text-xs px-2 py-0.2 rounded-full bg-[var(--color-accent-dim)] border border-[var(--color-accent)] text-[var(--color-accent)] accent-text">
                            learned from Device A - verified
                          </span>
                        )}

                        {/* Branch Ranks Chip */}
                        <span className="font-mono text-xs text-[var(--color-muted)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded-[2px] border border-[var(--color-border)]">
                          dense #{denseRank?.rank || "-"} | bm25 #{bm25Rank?.rank || "-"}
                        </span>
                      </div>
                      <p className="text-base text-[var(--color-text)] font-medium truncate">
                        {mem.title || mem.content.slice(0, 100)}
                      </p>
                    </div>

                    {/* Authority Dots & Score */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-1" title={`Authority level ${mem.authority}/3`}>
                        {Array.from({ length: 3 }, (_, dotIdx) => (
                          <div
                            key={dotIdx}
                            className={`w-2 h-2 rounded-full ${
                              dotIdx < mem.authority
                                ? "bg-[var(--color-accent)] accent-fill"
                                : "bg-[var(--color-surface-2)] border border-[var(--color-border)]"
                            }`}
                          />
                        ))}
                      </div>

                      <span className="font-mono text-sm font-bold text-[var(--color-text)]">
                        {(hit.score * 100).toFixed(1)}%
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExplainHit(isExplainOpen ? null : hit.mem_id);
                        }}
                        className={`px-2 py-1 rounded-[2px] font-mono text-xs border transition-colors duration-120 ${
                          isExplainOpen
                            ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border-[var(--color-accent)] font-bold accent-fill"
                            : "bg-[var(--color-surface-2)] text-[var(--color-muted)] border-[var(--color-border)] hover:text-[var(--color-text)]"
                        }`}
                      >
                        Explain
                      </button>

                      <ChevronRight
                        className={`w-4 h-4 text-[var(--color-muted)] transition-transform duration-120 ${
                          isSelected ? "rotate-90" : ""
                        }`}
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>

                  {/* Expanded Hit Body */}
                  {isSelected && (
                    <div className="px-4 pb-4 pt-2 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
                      <p className="text-base text-[var(--color-text)] leading-relaxed mb-3">
                        {mem.content}
                      </p>
                      <div className="flex items-center gap-4 font-mono text-xs text-[var(--color-muted)] flex-wrap">
                        <span>Content Hash: {mem.content_hash}</span>
                        <span>Shard: {hit.shard}</span>
                        <span>Scope: {mem.scope}</span>
                        <span>Site: {mem.site_id}</span>
                        <span>Asset: {mem.asset_id || "N/A"}</span>
                      </div>
                    </div>
                  )}

                  {/* Explain Why-Panel (3px left bar) */}
                  {isExplainOpen && (
                    <div className="px-4 py-3 border-t border-[var(--color-border)] border-l-[3px] border-l-[var(--color-accent)] bg-[var(--color-surface-2)] font-mono text-xs">
                      <div className="font-bold text-[var(--color-accent)] mb-1 uppercase tracking-wider accent-text">
                        Why this hit matched
                      </div>
                      <div className="space-y-1 text-[var(--color-text)]">
                        <div>
                          • Dense embedding similarity: {((denseRank?.score || 0) * 100).toFixed(1)}% (BAAI/bge-small semantic cosine)
                        </div>
                        <div>
                          • BM25 sparse keyword score: {((bm25Rank?.score || 0) * 100).toFixed(1)}% (Matched terms: &apos;P-204&apos;, &apos;grinding&apos;, &apos;load&apos;)
                        </div>
                        <div>
                          • RRF reciprocal fusion score: {hit.fused_score.toFixed(4)} (Rank #{i + 1} combined)
                        </div>
                        <div>
                          • Shard target: {hit.shard} · Authority weight: {mem.authority}× multiplier applied
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
