"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { LinkState } from "@/lib/types";

interface AppState {
  deviceId: string;
  setDeviceId: (id: string) => void;
  linkState: LinkState;
  setLinkState: (s: LinkState) => void;
  isOffline: boolean;
  toggleLink: () => void;
  presenterMode: boolean;
  setPresenterMode: (v: boolean) => void;
  presenterBeat: number;
  setPresenterBeat: (b: number) => void;
  nextBeat: () => void;
  prevBeat: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

const BEAT_ROUTES = [
  "/device/device-a",
  "/device/device-a/memory",
  "/device/device-a/sync",
  "/device/device-a/conflicts",
  "/cloud",
  "/results",
];

export const BEAT_LABELS = [
  "Offline Search",
  "Capture + Policy",
  "Reconnect & Sync",
  "Conflict Arbitration",
  "Fleet Learning",
  "Proof & Results",
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [deviceId, setDeviceId] = useState("device-a");
  const [linkState, setLinkState] = useState<LinkState>("offline");
  const [presenterMode, setPresenterMode] = useState(false);
  const [presenterBeat, setPresenterBeat] = useState(0);

  const isOffline = linkState === "offline";

  const toggleLink = useCallback(() => {
    setLinkState(s => s === "offline" ? "online" : "offline");
  }, []);

  const nextBeat = useCallback(() => {
    setPresenterBeat(b => Math.min(b + 1, 5));
  }, []);

  const prevBeat = useCallback(() => {
    setPresenterBeat(b => Math.max(b - 1, 0));
  }, []);

  useEffect(() => {
    if (!presenterMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowRight") { e.preventDefault(); nextBeat(); }
      if (e.key === "b" || e.key === "B" || e.key === "ArrowLeft") { e.preventDefault(); prevBeat(); }
      if (e.key === "p" || e.key === "P") { e.preventDefault(); setPresenterMode(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [presenterMode, nextBeat, prevBeat]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P") {
        if (!presenterMode && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          setPresenterMode(true);
        }
      }
    };
    if (!presenterMode) {
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [presenterMode]);

  return (
    <AppContext.Provider value={{
      deviceId, setDeviceId,
      linkState, setLinkState,
      isOffline, toggleLink,
      presenterMode, setPresenterMode,
      presenterBeat, setPresenterBeat,
      nextBeat, prevBeat,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export { BEAT_ROUTES };
