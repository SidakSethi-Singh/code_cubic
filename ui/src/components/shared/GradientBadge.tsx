"use client";

import React from "react";

export type BadgeVariant =
  | "brand"
  | "tier1"
  | "tier2"
  | "tier3"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

interface GradientBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md";
  dot?: boolean;
}

export function GradientBadge({
  children,
  variant = "neutral",
  className = "",
  icon,
  size = "md",
  dot = false,
}: GradientBadgeProps) {
  let badgeStyle = "bg-slate-100 border-slate-200 text-slate-700";
  let dotColor = "bg-slate-500";

  switch (variant) {
    case "brand":
      badgeStyle = "bg-sky-50 border-sky-200 text-sky-700";
      dotColor = "bg-sky-600";
      break;
    case "tier1":
    case "success":
      badgeStyle = "bg-emerald-50 border-emerald-200 text-emerald-700";
      dotColor = "bg-emerald-600";
      break;
    case "tier2":
      badgeStyle = "bg-blue-50 border-blue-200 text-blue-700";
      dotColor = "bg-blue-600";
      break;
    case "tier3":
      badgeStyle = "bg-purple-50 border-purple-200 text-purple-700";
      dotColor = "bg-purple-600";
      break;
    case "warning":
      badgeStyle = "bg-amber-50 border-amber-200 text-amber-800";
      dotColor = "bg-amber-600";
      break;
    case "danger":
      badgeStyle = "bg-red-50 border-red-200 text-red-700";
      dotColor = "bg-red-600";
      break;
    case "neutral":
    default:
      badgeStyle = "bg-slate-100 border-slate-200 text-slate-700";
      dotColor = "bg-slate-500";
      break;
  }

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] font-medium"
      : "px-2.5 py-1 text-xs font-semibold";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors tracking-wide ${sizeClasses} ${badgeStyle} ${className}`}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor}`} />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
