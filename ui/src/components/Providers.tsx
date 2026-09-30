"use client";

import { AppProvider } from "@/lib/context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
