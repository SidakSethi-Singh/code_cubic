"use client";

import React from "react";
import { Check, Wifi, Globe, Server } from "lucide-react";
import { GradientBadge } from "./GradientBadge";

export interface TierTileProps {
  tierNumber: 1 | 2 | 3;
  title: string;
  subtitle: string;
  egressBadgeText: string;
  latencyText: string;
  isActive: boolean;
  statusText: string;
  className?: string;
}

export function TierTile({
  tierNumber,
  title,
  subtitle,
  egressBadgeText,
  latencyText,
  isActive,
  statusText,
  className = "",
}: TierTileProps) {
  const getTierIcon = () => {
    switch (tierNumber) {
      case 1:
        return <Server className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />;
      case 2:
        return <Wifi className="w-4 h-4 text-sky-600" strokeWidth={1.5} />;
      case 3:
        return <Globe className="w-4 h-4 text-indigo-600" strokeWidth={1.5} />;
    }
  };

  const getTierBorder = () => {
    if (!isActive) return "border-slate-200 bg-white opacity-65";

    switch (tierNumber) {
      case 1:
        return "border-emerald-500 bg-emerald-50/50 shadow-xs";
      case 2:
        return "border-sky-500 bg-sky-50/50 shadow-xs";
      case 3:
        return "border-indigo-500 bg-indigo-50/50 shadow-xs";
    }
  };

  const getBadgeVariant = () => {
    switch (tierNumber) {
      case 1:
        return "tier1";
      case 2:
        return "tier2";
      case 3:
        return "tier3";
    }
  };

  return (
    <div
      className={`relative rounded-xl p-4 border transition-all duration-200 flex flex-col justify-between overflow-hidden ${getTierBorder()} ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] font-semibold text-slate-500">
              TIER {tierNumber}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">({latencyText})</span>
          </div>

          <GradientBadge variant={getBadgeVariant()} size="sm">
            {egressBadgeText}
          </GradientBadge>
        </div>

        <div className="flex items-center justify-between gap-2 my-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
              {getTierIcon()}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
                {title}
              </h4>
              <p className="text-[11px] text-slate-500">{subtitle}</p>
            </div>
          </div>

          {isActive && (
            <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 font-mono truncate">
        {statusText}
      </div>
    </div>
  );
}
