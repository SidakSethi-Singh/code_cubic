"use client";

import { useApp } from "@/lib/context";
import { DEVICES } from "@/lib/types";
import { Layers, ChevronDown, Wifi, WifiOff, Presentation } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const { deviceId, setDeviceId, isOffline, toggleLink, presenterMode, setPresenterMode } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const device = DEVICES[deviceId];
  const isCloud = pathname.startsWith("/cloud");

  return (
    <header className="h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 shrink-0 select-none z-40">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[2px] bg-[var(--color-accent-dim)] border border-[var(--color-accent)] flex items-center justify-center accent-border accent-bg">
            <Layers className="w-4 h-4 text-[var(--color-accent)] accent-text" strokeWidth={1.5} />
          </div>
          <span className="font-mono font-bold tracking-wider text-base text-[var(--color-text)]">
            EDGEMIND
          </span>
        </div>

        <div className="w-px h-6 bg-[var(--color-border)]" />

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-base font-mono text-[var(--color-text)] transition-colors duration-120 hover:border-[var(--color-accent)]"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] accent-fill" />
            <span>{device?.name || deviceId}</span>
            <ChevronDown className="w-4 h-4 text-[var(--color-muted)]" strokeWidth={1.5} />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2px] z-50">
              {Object.entries(DEVICES).map(([id, dev]) => (
                <button
                  key={id}
                  onClick={() => { setDeviceId(id); setDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-base font-mono transition-colors duration-120 ${
                    id === deviceId
                      ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)] accent-text accent-bg"
                      : "text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                  }`}
                >
                  <div className="font-bold">{dev.name}</div>
                  <div className="text-sm text-[var(--color-muted)]">{dev.technician} — {dev.techId}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isOffline && (
          <div className="px-3 py-1 rounded-[2px] border border-[var(--color-muted)] text-[var(--color-muted)] font-mono text-sm">
            OFFLINE — 0 NETWORK CALLS
          </div>
        )}

        <button
          onClick={() => setPresenterMode(!presenterMode)}
          title="Toggle Presenter Mode (Press P)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] font-mono text-sm border transition-colors duration-120 ${
            presenterMode
              ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border-[var(--color-accent)] font-bold accent-fill"
              : "bg-[var(--color-surface-2)] text-[var(--color-muted)] border-[var(--color-border)] hover:text-[var(--color-text)]"
          }`}
        >
          <Presentation className="w-4 h-4" strokeWidth={1.5} />
          <span>Demo Beat</span>
        </button>

        <button
          onClick={toggleLink}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] font-mono text-base font-bold transition-colors duration-120 ${
            isOffline
              ? "border border-[var(--color-muted)] text-[var(--color-muted)] bg-transparent"
              : "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border border-[var(--color-accent)] accent-fill"
          }`}
        >
          {isOffline ? (
            <WifiOff className="w-4 h-4" strokeWidth={1.5} />
          ) : (
            <Wifi className="w-4 h-4" strokeWidth={1.5} />
          )}
          {isOffline ? "Offline" : "Online"}
        </button>

        {isCloud ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)]">
            <div className="w-7 h-7 rounded-[2px] bg-[var(--color-accent-dim)] flex items-center justify-center text-[var(--color-accent)] font-mono font-bold text-sm accent-text accent-bg">
              M
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[var(--color-text)]">Meera S.</span>
              <span className="text-xs font-mono text-[var(--color-muted)]">Fleet Reliability</span>
            </div>
          </div>
        ) : device ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[var(--color-surface-2)] border border-[var(--color-border)]">
            <div className="w-7 h-7 rounded-[2px] bg-[var(--color-accent-dim)] flex items-center justify-center text-[var(--color-accent)] font-mono font-bold text-sm accent-text accent-bg">
              {device.technician.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[var(--color-text)]">{device.technician}</span>
              <span className="text-xs font-mono text-[var(--color-muted)]">{device.techId}</span>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
