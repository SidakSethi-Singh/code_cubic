"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

export interface GroupedListItemProps {
  id?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  value?: React.ReactNode;
  accessory?: React.ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  className?: string;
}

interface GroupedListProps {
  header?: string;
  footer?: string;
  items: GroupedListItemProps[];
  className?: string;
}

export function GroupedList({
  header,
  footer,
  items,
  className = "",
}: GroupedListProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {header && (
        <div className="px-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          {header}
        </div>
      )}

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {items.map((item, idx) => {
          const isClickable = Boolean(item.onClick);
          return (
            <div key={item.id || idx}>
              <div
                onClick={item.onClick}
                className={`flex items-center justify-between gap-3 px-5 py-3.5 transition-colors duration-150 ${
                  isClickable
                    ? "hover:bg-slate-50 cursor-pointer active:bg-slate-100"
                    : ""
                } ${item.className || ""}`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {item.icon && (
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-slate-200/80 ${
                        item.iconBg || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.icon}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {item.value && (
                    <div className="text-sm text-slate-500 font-mono">
                      {item.value}
                    </div>
                  )}
                  {item.accessory}
                  {(item.chevron || (isClickable && item.chevron !== false)) && (
                    <ChevronRight
                      className="w-4 h-4 text-slate-400"
                      strokeWidth={1.5}
                    />
                  )}
                </div>
              </div>

              {idx < items.length - 1 && (
                <div className="ml-16 mr-4 h-[1px] bg-slate-100" />
              )}
            </div>
          );
        })}
      </div>

      {footer && (
        <div className="px-2 text-xs text-slate-500 leading-relaxed">
          {footer}
        </div>
      )}
    </div>
  );
}
