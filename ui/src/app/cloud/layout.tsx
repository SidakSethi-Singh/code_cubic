"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import PresenterStrip from "@/components/PresenterStrip";
import CloudPasswordGate from "@/components/CloudPasswordGate";
import { useApp } from "@/lib/context";
import {
  isCloudConsoleAuthenticated,
  CLOUD_AUTH_EVENT_NAME,
} from "@/lib/cloud-auth";

export default function CloudLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOffline } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  useEffect(() => {
    // Initial check from sessionStorage
    const verifySession = () => {
      setIsAuthenticated(isCloudConsoleAuthenticated());
      setIsCheckingSession(false);
    };

    verifySession();

    // Listen to custom cloud auth events (login/lock) and cross-tab storage events
    window.addEventListener(CLOUD_AUTH_EVENT_NAME, verifySession);
    window.addEventListener("storage", verifySession);

    return () => {
      window.removeEventListener(CLOUD_AUTH_EVENT_NAME, verifySession);
      window.removeEventListener("storage", verifySession);
    };
  }, []);

  // Prevent flicker of protected console while reading sessionStorage
  if (isCheckingSession) {
    return <div className="h-screen w-screen bg-[var(--color-bg)]" />;
  }

  // Route Protection: Unauthenticated requests render full-screen password gate
  if (!isAuthenticated) {
    return (
      <CloudPasswordGate
        onSuccess={() => {
          setIsAuthenticated(true);
        }}
      />
    );
  }

  // Authenticated Cloud Console layout
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
