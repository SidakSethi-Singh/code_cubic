"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { Search, Database, RefreshCw, GitBranch, Activity, Cloud, BarChart3 } from "lucide-react";

const NAV_ITEMS = [
  { href: (id: string) => `/device/${id}`, label: "Search", icon: Search },
  { href: (id: string) => `/device/${id}/memory`, label: "Memory", icon: Database },
  { href: (id: string) => `/device/${id}/sync`, label: "Sync Center", icon: RefreshCw },
  { href: (id: string) => `/device/${id}/conflicts`, label: "Conflicts", icon: GitBranch, countKey: "conflicts" as const },
  { href: (id: string) => `/device/${id}/activity`, label: "Activity", icon: Activity },
];

const SECONDARY_ITEMS = [
  { href: () => "/cloud", label: "Cloud Console", icon: Cloud },
  { href: () => "/results", label: "Results", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { deviceId, isOffline } = useApp();
  const conflictCount = 1;

  return (
    <aside className="w-60 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col shrink-0 select-none">
      <div className="py-4 flex flex-col flex-1">
        <div className="px-4 pb-2 text-xs font-mono tracking-wider text-[var(--color-muted)] uppercase">
          Device
        </div>

        <nav className="flex flex-col gap-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const href = item.href(deviceId);
            const isActive = pathname === href || (item.label === "Search" && pathname === `/device/${deviceId}`);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={href}
                className={`flex items-center justify-between px-3 py-2 rounded-[2px] text-base font-mono transition-colors duration-120 ${
                  isActive
                    ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)] accent-text accent-bg"
                    : "text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </div>
                {item.countKey === "conflicts" && conflictCount > 0 && (
                  <span className="rounded-full px-2 py-0.5 text-xs font-mono font-bold bg-[var(--color-accent)] text-[var(--color-accent-ink)] accent-fill">
                    {conflictCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mx-4 my-3 border-t border-[var(--color-border)]" />

        <div className="px-4 pb-2 text-xs font-mono tracking-wider text-[var(--color-muted)] uppercase">
          Fleet
        </div>

        <nav className="flex flex-col gap-0.5 px-2">
          {SECONDARY_ITEMS.map((item) => {
            const href = item.href();
            const isActive = pathname === href;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={href}
                className={`flex items-center justify-between px-3 py-2 rounded-[2px] text-base font-mono transition-colors duration-120 ${
                  isActive
                    ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)] accent-text accent-bg"
                    : "text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
