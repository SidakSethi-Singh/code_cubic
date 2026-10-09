"use client";

import React, { useEffect, useState } from "react";

interface StatTileProps {
  label: string;
  value: number | string;
  unit?: string;
  sublabel?: string;
  icon?: React.ReactNode;
  trend?: string;
  isGradientText?: boolean;
  className?: string;
  decimals?: number;
}

export function StatTile({
  label,
  value,
  unit,
  sublabel,
  icon,
  trend,
  isGradientText = false,
  className = "",
  decimals = 0,
}: StatTileProps) {
  const isNumeric = typeof value === "number";
  const [displayValue, setDisplayValue] = useState<number>(isNumeric ? 0 : 0);

  useEffect(() => {
    if (!isNumeric) return;

    const start = 0;
    const end = value as number;
    const duration = 600; // ms
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(end);
      }
    };

    const animFrame = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animFrame);
  }, [value, isNumeric]);

  const formattedValue = isNumeric
    ? displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : value;

  return (
    <div
      className={`rounded-xl p-4 bg-white border border-slate-200 shadow-sm flex flex-col justify-between transition-all duration-150 hover:border-slate-300 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          {label}
        </span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-1 my-1">
        <span
          className={`text-2xl md:text-3xl font-bold tracking-tight font-mono ${
            isGradientText
              ? "text-sky-700"
              : "text-slate-900"
          }`}
        >
          {formattedValue}
        </span>
        {unit && (
          <span className="text-sm font-medium text-slate-500 font-mono">{unit}</span>
        )}
      </div>

      {(sublabel || trend) && (
        <div className="flex items-center justify-between text-xs text-slate-500 mt-1 pt-1.5 border-t border-slate-100">
          {sublabel && <span className="truncate">{sublabel}</span>}
          {trend && (
            <span className="text-emerald-600 font-semibold font-mono text-[11px] shrink-0">
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
