"use client";

import React from "react";
import { motion } from "framer-motion";

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string = string> {
  options: (SegmentOption<T> | T)[];
  value: T;
  onChange: (value: T) => void;
  id?: string;
  size?: "sm" | "md";
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  id = "segmented-control",
  size = "md",
  className = "",
}: SegmentedControlProps<T>) {
  const normalizedOptions: SegmentOption<T>[] = options.map((opt) =>
    typeof opt === "string"
      ? { value: opt as T, label: opt.toUpperCase() }
      : opt
  );

  const containerPadding = size === "sm" ? "p-0.5" : "p-1";
  const itemPadding = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs";

  return (
    <div
      className={`relative inline-flex items-center rounded-lg bg-slate-100 border border-slate-200 ${containerPadding} ${className}`}
      role="tablist"
    >
      {normalizedOptions.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(opt.value)}
            className={`relative z-10 inline-flex items-center gap-1.5 rounded-md font-medium transition-colors duration-150 select-none ${itemPadding} ${
              isSelected
                ? "text-slate-900 font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId={`segment-thumb-${id}`}
                className="absolute inset-0 rounded-md bg-white border border-slate-200/90 shadow-xs"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 35,
                }}
              />
            )}
            <span className="relative z-20 flex items-center gap-1.5">
              {opt.icon && <span className="shrink-0">{opt.icon}</span>}
              <span>{opt.label}</span>
              {typeof opt.count === "number" && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected
                      ? "bg-slate-100 text-slate-800"
                      : "bg-slate-200/60 text-slate-600"
                  }`}
                >
                  {opt.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
