"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/context";
import {
  Search,
  Database,
  RefreshCw,
  GitBranch,
  Activity,
  Cloud,
  BarChart3,
} from "lucide-react";

const NAV_ITEMS = [
  {
    href: (id: string) => `/device/${id}`,
    label: "Search & Voice",
    icon: Search,
    iconColor: "text-sky-600",
    iconBg: "bg-sky-50 border-sky-100",
  },
  {
    href: (id: string) => `/device/${id}/memory`,
    label: "Memory Store",
    icon: Database,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50 border-emerald-100",
  },
  {
    href: (id: string) => `/device/${id}/sync`,
    label: "Sync Center",
    icon: RefreshCw,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50 border-blue-100",
  },
  {
    href: (id: string) => `/device/${id}/conflicts`,
    label: "Conflicts & Audit",
    icon: GitBranch,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50 border-rose-100",
    countKey: "conflicts" as const,
  },
  {
    href: (id: string) => `/device/${id}/activity`,
    label: "Telemetry Log",
    icon: Activity,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50 border-indigo-100",
  },
];

const SECONDARY_ITEMS = [
  {
    href: () => "/cloud",
    label: "Fleet Cloud Hub",
    icon: Cloud,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50 border-violet-100",
  },
  {
    href: () => "/results",
    label: "Proof Benchmarks",
    icon: BarChart3,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50 border-amber-100",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { deviceId } = useApp();
  const conflictCount = 1;

  return (
    <>
      {/* Desktop Flat Enterprise Sidebar */}
      <aside className="hidden md:flex w-64 p-3 shrink-0 select-none z-30">
        <div className="w-full h-full rounded-2xl bg-white border border-slate-200 shadow-xs p-3 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Device Section */}
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Edge Terminal
              </div>

              <nav className="flex flex-col gap-1 mt-1">
                {NAV_ITEMS.map((item) => {
                  const href = item.href(deviceId);
                  const isActive =
                    pathname === href ||
                    (item.label.startsWith("Search") && pathname === `/device/${deviceId}`);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={href}
                      className={`relative flex items-center justify-between h-10 px-3 rounded-lg transition-all duration-150 group cursor-pointer ${
                        isActive
                          ? "bg-slate-100 text-slate-900 font-semibold border border-slate-200 shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${item.iconBg}`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${item.iconColor}`} strokeWidth={2} />
                        </div>
                        <span className="text-xs font-medium">{item.label}</span>
                      </div>

                      {item.countKey === "conflicts" && conflictCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500 text-white">
                          {conflictCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Inset Hairline Divider */}
            <div className="mx-2 h-[1px] bg-slate-100" />

            {/* Fleet Section */}
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Fleet Management
              </div>

              <nav className="flex flex-col gap-1 mt-1">
                {SECONDARY_ITEMS.map((item) => {
                  const href = item.href();
                  const isActive = pathname === href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={href}
                      className={`relative flex items-center justify-between h-10 px-3 rounded-lg transition-all duration-150 group cursor-pointer ${
                        isActive
                          ? "bg-slate-100 text-slate-900 font-semibold border border-slate-200 shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${item.iconBg}`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${item.iconColor}`} strokeWidth={2} />
                        </div>
                        <span className="text-xs font-medium">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Bottom Security Capsule */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-[11px] font-semibold text-slate-700">v10.492</span>
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              AIR-GAP ON-SOIL
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Flat Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-2 left-2 right-2 z-40 h-14 rounded-xl bg-white border border-slate-200 shadow-lg flex items-center justify-around px-1">
        {NAV_ITEMS.map((item) => {
          const href = item.href(deviceId);
          const isActive =
            pathname === href ||
            (item.label.startsWith("Search") && pathname === `/device/${deviceId}`);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all ${
                isActive ? "text-sky-700 font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              <span className="text-[10px] mt-0.5">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
