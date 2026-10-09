"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import MemoryPage from "../memory/page";

export default function CaptureRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string || "device-a";

  useEffect(() => {
    // Also update URL cleanly to /memory
    router.replace(`/device/${id}/memory`);
  }, [id, router]);

  // Render MemoryPage directly in case redirection takes a tick
  return <MemoryPage />;
}
