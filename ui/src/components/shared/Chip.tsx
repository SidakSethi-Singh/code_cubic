"use client";

import React from "react";

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "default" | "brand" | "tier1" | "tier2" | "tier3";
  size?: "sm" | "md";
}

export function Chip({
  active = false,
  children,
  icon,
  variant = "default",
  size = "md",
  className = "",
  ...props
}: ChipProps) {
  let activeStyle = "";

  if (active) {
    switch (variant) {
      case "brand":
        activeStyle = "bg-sky-100 border-sky-400 text-sky-800 shadow-xs";
        break;
      case "tier1":
        activeStyle = "bg-emerald-100 border-emerald-400 text-emerald-800 shadow-xs";
        break;
      case "tier2":
        activeStyle = "bg-blue-100 border-blue-400 text-blue-800 shadow-xs";
        break;
      case "tier3":
        activeStyle = "bg-purple-100 border-purple-400 text-purple-800 shadow-xs";
        break;
      default:
        activeStyle = "bg-slate-900 border-slate-900 text-white shadow-xs";
    }
  } else {
    activeStyle =
      "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300";
  }

  const sizeClasses =
    size === "sm"
      ? "px-2.5 py-1 text-xs"
      : "px-3 py-1.5 text-xs font-medium";

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-lg border transition-all duration-150 active:scale-95 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 cursor-pointer ${sizeClasses} ${activeStyle} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
