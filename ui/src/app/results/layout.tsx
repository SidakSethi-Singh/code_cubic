"use client";

import PresenterStrip from "@/components/PresenterStrip";
import { useApp } from "@/lib/context";

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOffline } = useApp();

  return (
    <div className={`min-h-screen w-screen flex flex-col ${isOffline ? "airgap-active" : ""}`}>
      <PresenterStrip />
      <div className="flex-1 flex flex-col overflow-auto">
        {children}
      </div>
    </div>
  );
}
