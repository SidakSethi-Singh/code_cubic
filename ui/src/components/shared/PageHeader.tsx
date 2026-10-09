"use client";

import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  category?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  category,
  badge,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col gap-1.5 md:flex-row md:items-end md:justify-between pb-6 ${className}`}>
      <div className="space-y-1">
        {(category || badge) && (
          <div className="flex items-center gap-2 mb-1.5">
            {category && (
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {category}
              </span>
            )}
            {badge}
          </div>
        )}

        <h1 className="text-[30px] md:text-[34px] font-bold tracking-tight leading-tight text-slate-900">
          {title}
        </h1>

        {subtitle && (
          <p className="text-sm md:text-base text-slate-600 max-w-2xl font-normal leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 mt-3 md:mt-0 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
