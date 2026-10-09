"use client";

import { useApp } from "@/lib/context";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import PresenterStrip from "@/components/PresenterStrip";

function DeviceShell({ children }: { children: React.ReactNode }) {
  const { isOffline } = useApp();

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${isOffline ? "airgap-active" : ""}`}>
      <PresenterStrip />
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-12">
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
