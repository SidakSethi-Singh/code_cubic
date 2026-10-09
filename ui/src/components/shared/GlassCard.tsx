"use client";

import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  variant?: "default" | "subtle" | "tinted";
}

export function GlassCard({
  children,
  className = "",
  interactive = false,
  variant = "default",
  ...props
}: GlassCardProps) {
  const baseClasses =
    variant === "subtle"
      ? "bg-slate-50 border border-slate-200"
      : "bg-white border border-slate-200 shadow-sm";

  const interactiveClasses = interactive
    ? "transition-all duration-200 ease-out hover:border-slate-300 hover:shadow-md cursor-pointer"
    : "";

  return (
    <div
      className={`rounded-2xl p-6 relative overflow-hidden text-slate-900 ${baseClasses} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
