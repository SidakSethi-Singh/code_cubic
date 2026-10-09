"use client";

import { useState } from "react";
import { MOCK_EVENTS } from "@/lib/mocks/fixtures";
import type { ActivityEvent } from "@/lib/types";
import {
  GradientBadge,
  PageHeader,
  SegmentedControl,
} from "@/components/shared";
import {
  Activity,
  Play,
  Pause,
  Database,
  Shield,
  ArrowUpRight,
  ArrowDownLeft,
  GitBranch,
} from "lucide-react";

export default function ActivityPage() {
  const [events] = useState<ActivityEvent[]>(MOCK_EVENTS);
  const [filter, setFilter] = useState<string>("all");
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const filteredEvents = events.filter((e) => {
    if (filter === "all") return true;
    return e.type === filter;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case "ingest":
        return {
          icon: <Database className="w-4 h-4 text-emerald-700" strokeWidth={2} />,
          bg: "bg-emerald-50 border border-emerald-200",
        };
      case "decision":
        return {
          icon: <Shield className="w-4 h-4 text-amber-700" strokeWidth={2} />,
          bg: "bg-amber-50 border border-amber-200",
        };
      case "push":
        return {
          icon: <ArrowUpRight className="w-4 h-4 text-sky-700" strokeWidth={2} />,
          bg: "bg-sky-50 border border-sky-200",
        };
      case "pull":
        return {
          icon: <ArrowDownLeft className="w-4 h-4 text-indigo-700" strokeWidth={2} />,
          bg: "bg-indigo-50 border border-indigo-200",
        };
      case "conflict":
        return {
          icon: <GitBranch className="w-4 h-4 text-rose-700" strokeWidth={2} />,
          bg: "bg-rose-50 border border-rose-200",
        };
      default:
        return {
          icon: <Activity className="w-4 h-4 text-slate-600" strokeWidth={2} />,
          bg: "bg-slate-100 border border-slate-200",
        };
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        category="Real-Time Node Telemetry"
        title="Activity Stream"
        subtitle="Real-time WAL events, policy decisions, and peer mesh replication"
        badge={
          <GradientBadge variant="neutral" size="sm" dot>
            WAL Observer Active
          </GradientBadge>
        }
        actions={
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`h-9 px-3.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isPaused
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700"
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Resume Stream</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Pause Stream</span>
              </>
            )}
          </button>
        }
      />

      {/* Filter Segmented Control */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Event Type
        </span>
        <SegmentedControl
          id="activity-filter"
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "ingest", label: "Ingest" },
            { value: "decision", label: "Decision" },
            { value: "push", label: "Push" },
            { value: "pull", label: "Pull" },
            { value: "conflict", label: "Conflict" },
          ]}
        />
      </div>

      {/* Timeline Stream */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            No activity events matching the current filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEvents.map((evt) => {
              const iconMeta = getEventIcon(evt.type);

              return (
                <div
                  key={evt.id}
                  className="flex items-start gap-3.5 p-4 md:p-4.5 hover:bg-slate-50 transition-colors"
                >
                  {/* Event Type Icon */}
                  <div
                    className={`w-8 h-8 rounded-lg ${iconMeta.bg} flex items-center justify-center shrink-0 shadow-2xs mt-0.5`}
                  >
                    {iconMeta.icon}
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold uppercase tracking-wider text-sky-800">
                        {evt.type}
                      </span>
                      <span className="text-slate-300 text-xs">•</span>
                      <span className="font-mono text-xs text-slate-400">
                        {evt.id}
                      </span>
                      {evt.mem_id && (
                        <>
                          <span className="text-slate-300 text-xs">•</span>
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                            {evt.mem_id}
                          </span>
                        </>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      {evt.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {evt.detail}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div className="font-mono text-xs text-slate-400 shrink-0 text-right">
                    {formatTimestamp(evt.timestamp)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
