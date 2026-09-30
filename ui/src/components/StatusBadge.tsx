"use client";

import { ArrowUpRight, Pause, Lock, Clock, Check, GitBranch, Split } from "lucide-react";

type StatusType = "share" | "hold" | "local_only" | "pending" | "synced" | "conflict" | "superseded" | "disputed" | "active" | "open" | "resolved" | "escalated" | "failed";

const CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  className: string;
}> = {
  share: {
    icon: ArrowUpRight,
    className: "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border-[var(--color-accent)]",
  },
  hold: {
    icon: Pause,
    className: "bg-transparent text-[var(--color-accent)] border-[var(--color-accent)]",
  },
  local_only: {
    icon: Lock,
    className: "bg-transparent text-[var(--color-muted)] border-[var(--color-muted)]",
  },
  pending: {
    icon: Clock,
    className: "bg-transparent text-[var(--color-accent)] border-[var(--color-accent)] border-dashed",
  },
  synced: {
    icon: Check,
    className: "bg-[var(--color-accent-dim)] text-[var(--color-accent)] border-transparent",
  },
  conflict: {
    icon: GitBranch,
    className: "bg-[var(--color-accent-dim)] text-[var(--color-accent)] border-l-[3px] border-l-[var(--color-accent)] border-t-0 border-r-0 border-b-0",
  },
  superseded: {
    icon: Check,
    className: "bg-transparent text-[var(--color-muted)] border-transparent line-through",
  },
  disputed: {
    icon: Split,
    className: "bg-transparent text-[var(--color-accent)] border-[var(--color-accent)]",
  },
  active: {
    icon: Check,
    className: "bg-[var(--color-accent-dim)] text-[var(--color-accent)] border-transparent",
  },
  open: {
    icon: Clock,
    className: "bg-transparent text-[var(--color-accent)] border-[var(--color-accent)]",
  },
  resolved: {
    icon: Check,
    className: "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border-[var(--color-accent)]",
  },
  escalated: {
    icon: ArrowUpRight,
    className: "bg-transparent text-[var(--color-accent)] border-[var(--color-accent)] border-dashed",
  },
  failed: {
    icon: Pause,
    className: "bg-transparent text-[var(--color-muted)] border-[var(--color-muted)]",
  },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = CONFIG[status] || CONFIG["active"];
  const Icon = config.icon;
  const displayLabel = label || status.replace(/_/g, " ").toUpperCase();

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono font-bold transition-colors duration-120 accent-text accent-border ${config.className}`}>
      <Icon className="w-3 h-3" strokeWidth={1.5} />
      {displayLabel}
    </span>
  );
}
