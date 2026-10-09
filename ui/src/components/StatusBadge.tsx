"use client";

import React from "react";
import {
  ArrowUpRight,
  Pause,
  Lock,
  Clock,
  Check,
  GitBranch,
  Split,
  AlertTriangle,
} from "lucide-react";
import { GradientBadge, BadgeVariant } from "./shared/GradientBadge";

const STATUS_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    variant: BadgeVariant;
    label: string;
    dot?: boolean;
  }
> = {
  share: {
    icon: ArrowUpRight,
    variant: "brand",
    label: "SHARE",
  },
  hold: {
    icon: Pause,
    variant: "warning",
    label: "HOLD",
  },
  local_only: {
    icon: Lock,
    variant: "neutral",
    label: "LOCAL ONLY",
  },
  pending: {
    icon: Clock,
    variant: "warning",
    label: "PENDING",
    dot: true,
  },
  synced: {
    icon: Check,
    variant: "tier1",
    label: "SYNCED",
  },
  conflict: {
    icon: GitBranch,
    variant: "danger",
    label: "CONFLICT",
    dot: true,
  },
  superseded: {
    icon: Check,
    variant: "neutral",
    label: "SUPERSEDED",
  },
  disputed: {
    icon: Split,
    variant: "warning",
    label: "DISPUTED",
  },
  active: {
    icon: Check,
    variant: "tier1",
    label: "ACTIVE",
  },
  open: {
    icon: AlertTriangle,
    variant: "danger",
    label: "OPEN",
    dot: true,
  },
  resolved: {
    icon: Check,
    variant: "tier1",
    label: "RESOLVED",
  },
  escalated: {
    icon: ArrowUpRight,
    variant: "warning",
    label: "ESCALATED",
  },
  failed: {
    icon: Pause,
    variant: "danger",
    label: "FAILED",
  },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: "sm" | "md";
}

export default function StatusBadge({
  status,
  label,
  size = "sm",
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    icon: Check,
    variant: "neutral" as BadgeVariant,
    label: status.replace(/_/g, " ").toUpperCase(),
  };

  const Icon = config.icon;
  const displayLabel = label || config.label;

  return (
    <GradientBadge
      variant={config.variant}
      size={size}
      dot={config.dot}
      icon={<Icon className="w-3 h-3" strokeWidth={1.7} />}
    >
      <span className="font-mono">{displayLabel}</span>
    </GradientBadge>
  );
}
