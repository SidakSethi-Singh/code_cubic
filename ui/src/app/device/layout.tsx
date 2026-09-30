"use client";

import { AppProvider, useApp } from "@/lib/context";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import PresenterStrip from "@/components/PresenterStrip";

function DeviceShell({ children }: { children: React.ReactNode }) {
  const { isOffline } = useApp();

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${isOffline ? "offline" : ""}`}>
      <PresenterStrip />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-[var(--color-bg)] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DeviceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DeviceShell>{children}</DeviceShell>;
}
