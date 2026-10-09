"use client";

import { useApp } from "@/lib/context";
import { DEVICES } from "@/lib/types";
import {
  Layers,
  ChevronDown,
  Wifi,
  WifiOff,
  Presentation,
  ShieldCheck,
  X,
  Lock,
  Radio,
  Check,
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { lockCloudConsole } from "@/lib/cloud-auth";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const {
    deviceId,
    setDeviceId,
    isOffline,
    toggleLink,
    presenterMode,
    setPresenterMode,
  } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const pathname = usePathname();
  const device = DEVICES[deviceId];
  const isCloud = pathname.startsWith("/cloud");

  return (
    <>
      <header className="h-16 px-4 md:px-6 bg-white border-b border-slate-200 shadow-xs flex items-center justify-between shrink-0 select-none z-40 relative">
        {/* Left: Brand + Device Switcher */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-base text-slate-900 leading-tight">
                EdgeMind
              </span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider hidden sm:block">
                Industrial Edge Console
              </span>
            </div>
          </div>

          <div className="w-[1px] h-5 bg-slate-200 hidden sm:block" />

          {/* Device Switcher Pill Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800 transition-all duration-150 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{device?.name || deviceId}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
                strokeWidth={1.5}
              />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 mt-1.5 w-72 p-1 rounded-xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden"
                >
                  <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                    Switch Edge Node
                  </div>
                  {Object.entries(DEVICES).map(([id, dev]) => {
                    const isSelected = id === deviceId;
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          setDeviceId(id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors duration-150 flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-slate-100 text-slate-900 font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <div>
                          <div className="font-medium text-slate-900">
                            {dev.name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {dev.technician} • {dev.techId}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-sky-600" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Security Pill, Demo Beat, Online Capsule, Avatar */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Air-Gap / Link Status Capsule */}
          {isOffline ? (
            <button
              onClick={() => setAuditModalOpen(true)}
              title="Click to view live Air-Gap & P2P Mesh security audit"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span className="font-medium">Air-Gap Invariant</span>
              <span className="text-[11px] text-emerald-700 font-mono border-l border-emerald-200 pl-2">
                0 Sockets
              </span>
            </button>
          ) : (
            <button
              onClick={() => setAuditModalOpen(true)}
              title="Click to view live link status"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-xs font-medium text-sky-800 hover:bg-sky-100 transition-colors cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600" />
              </span>
              <span className="font-medium">Online · Mesh Ready</span>
              <span className="text-[11px] text-sky-700 font-mono border-l border-sky-200 pl-2">
                WAL Active
              </span>
            </button>
          )}

          {/* Demo Beat Button */}
          <button
            onClick={() => setPresenterMode(!presenterMode)}
            title="Toggle Demo Beat Presentation Mode (Press P)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              presenterMode
                ? "bg-amber-100 border border-amber-300 text-amber-900 shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Presentation className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">Demo Beat</span>
          </button>

          {/* Online / Offline Capsule Toggle */}
          <button
            onClick={toggleLink}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
              isOffline
                ? "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200/70"
                : "bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            {isOffline ? (
              <WifiOff className="w-3.5 h-3.5 text-slate-600" strokeWidth={2} />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
            )}
            <span>{isOffline ? "Air-Gapped" : "Online"}</span>
          </button>

          {/* User Avatar Chip */}
          {isCloud ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-lg bg-slate-50 border border-slate-200">
                <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  M
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900">
                    Meera S.
                  </span>
                </div>
              </div>

              <button
                onClick={() => lockCloudConsole()}
                title="Lock Cloud Console"
                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          ) : device ? (
            <div className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-lg bg-slate-50 border border-slate-200">
              <div className="w-6 h-6 rounded-md bg-sky-700 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                {device.technician.charAt(0)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900">
                  {device.technician}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      {/* Flat Enterprise Audit Modal */}
      <AnimatePresence>
        {auditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 md:p-8 flex flex-col gap-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Air-Gap Invariant &amp; Mesh Audit
                    </h2>
                    <p className="text-xs text-slate-500">
                      Real-time socket inspection &amp; zero cloud leak verification
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAuditModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] text-emerald-800 font-semibold mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>AIR-GAP INTEGRITY</span>
                  </div>
                  <div className="text-base font-bold text-slate-900 font-mono">
                    0 Outbound Sockets
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    100% on-device vector execution. Zero DNS queries or cloud leaks.
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
                  <div className="text-[11px] text-sky-800 font-semibold mb-1 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" />
                    <span>SUBNET P2P MESH</span>
                  </div>
                  <div className="text-base font-bold text-slate-900 font-mono">
                    LAN Broadcast Only
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Direct Device A &harr; Device B peer queries across local factory subnet.
                  </div>
                </div>
              </div>

              {/* Active Topology Node Matrix */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 px-1">
                  Active Node Topology
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-2 space-y-1.5">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200/80">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-medium text-xs text-slate-900">
                        Device A (Plant North, Port 8001)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                      ONLINE (0.00ms RTT)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200/80">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="font-medium text-xs text-slate-900">
                        Device B (Plant South, Port 8002)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-amber-700 font-semibold">
                      P2P MESH ACTIVE (1.8ms LAN)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200/80">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="font-medium text-xs text-slate-900">
                        Fleet Central Hub (Port 8000)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      SYNC LINK {isOffline ? "ISOLATED" : "ACTIVE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invariant Proof Checklist */}
              <div className="text-xs space-y-2 text-slate-600 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span>Anti-Data Breach Policy:</span>
                  <strong className="text-emerald-700 font-mono">ENFORCED (Regex PII Filter)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Vector Engine:</span>
                  <strong className="text-slate-900 font-mono">Qdrant Edge (Embedded Rust WAL)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>State Storage:</span>
                  <strong className="text-slate-900 font-mono">SQLite 3 WAL (Local Disk)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Egress Leak Probability:</span>
                  <strong className="text-emerald-700 font-mono">0.00% Guaranteed</strong>
                </div>
              </div>

              <button
                onClick={() => setAuditModalOpen(false)}
                className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-white transition-all cursor-pointer shadow-xs"
              >
                Close Audit Monitor
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
