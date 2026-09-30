"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import { MOCK_EVENTS } from "@/lib/mocks/fixtures";
import type { ActivityEvent } from "@/lib/types";
import {
  Activity,
  Play,
  Pause,
  Database,
  Shield,
  ArrowUpRight,
  ArrowDownLeft,
  GitBranch,
  Filter,
} from "lucide-react";

export default function ActivityPage() {
  const { deviceId } = useApp();
  const [events, setEvents] = useState<ActivityEvent[]>(MOCK_EVENTS);
  const [filter, setFilter] = useState<string>("all");
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const filteredEvents = events.filter((e) => {
    if (filter === "all") return true;
    return e.type === filter;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case "ingest":
        return <Database className="w-4 h-4 text-[var(--color-accent)] accent-text" strokeWidth={1.5} />;
      case "decision":
        return <Shield className="w-4 h-4 text-[var(--color-accent)] accent-text" strokeWidth={1.5} />;
      case "push":
        return <ArrowUpRight className="w-4 h-4 text-[var(--color-accent)] accent-text" strokeWidth={1.5} />;
      case "pull":
        return <ArrowDownLeft className="w-4 h-4 text-[var(--color-accent)] accent-text" strokeWidth={1.5} />;
      case "conflict":
        return <GitBranch className="w-4 h-4 text-[var(--color-accent)] accent-text" strokeWidth={1.5} />;
      default:
        return <Activity className="w-4 h-4 text-[var(--color-accent)] accent-text" strokeWidth={1.5} />;
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    } catch {
      return ts;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Title & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono text-[var(--color-text)]">
            Activity Stream
          </h1>
          <p className="text-base text-[var(--color-muted)] mt-1">
            Real-time WAL events, policy decisions, and mesh synchronization
          </p>
        </div>

        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] font-mono text-sm border transition-colors duration-120 ${
            isPaused
              ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border-[var(--color-accent)] font-bold accent-fill"
              : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-muted)]"
          }`}
        >
          {isPaused ? (
            <>
              <Play className="w-4 h-4" strokeWidth={1.5} />
              <span>Resume Stream</span>
            </>
          ) : (
            <>
              <Pause className="w-4 h-4" strokeWidth={1.5} />
              <span>Pause Stream</span>
            </>
          )}
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-[var(--color-muted)] mr-1" strokeWidth={1.5} />
        {["all", "ingest", "decision", "push", "pull", "conflict"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-[2px] font-mono text-sm transition-colors duration-120 border ${
              filter === f
                ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)] border-[var(--color-accent)] font-bold accent-border accent-bg accent-text"
                : "bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:border-[var(--color-muted)]"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      <div className="rounded-[2px] bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center font-mono text-sm text-[var(--color-muted)]">
            No events match the selected filter.
          </div>
        ) : (
          <div className="space-y-1">
            {filteredEvents.map((evt, idx) => (
              <div
                key={evt.id}
                className="flex items-start gap-4 p-3 rounded-[2px] hover:bg-[var(--color-surface-2)] transition-colors duration-120 border-b border-[var(--color-border)] last:border-b-0"
              >
                {/* Event Type Icon */}
                <div className="w-8 h-8 rounded-[2px] bg-[var(--color-accent-dim)] border border-[var(--color-border)] flex items-center justify-center shrink-0 mt-0.5 accent-bg">
                  {getEventIcon(evt.type)}
                </div>

                {/* Event Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] accent-text">
                      {evt.type}
                    </span>
                    <span className="text-[var(--color-border)]">·</span>
                    <span className="font-mono text-xs text-[var(--color-muted)]">
                      {evt.id}
                    </span>
                    {evt.mem_id && (
                      <>
                        <span className="text-[var(--color-border)]">·</span>
                        <span className="font-mono text-xs px-1.5 py-0.2 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)]">
                          {evt.mem_id}
                        </span>
                      </>
                    )}
                  </div>
                  <h4 className="font-sans font-bold text-base text-[var(--color-text)]">
                    {evt.title}
                  </h4>
                  <p className="font-sans text-sm text-[var(--color-muted)] mt-0.5">
                    {evt.detail}
                  </p>
                </div>

                {/* Timestamp */}
                <div className="font-mono text-xs text-[var(--color-muted)] shrink-0 text-right">
                  {formatTimestamp(evt.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
