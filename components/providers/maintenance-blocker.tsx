"use client";

import { useState, useEffect } from "react";

export function MaintenanceBlocker() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const pusdatinUrl =
    process.env.NEXT_PUBLIC_PUSDATIN_URL || "http://localhost:3000";
  const appId = "e-surat-kemenag";

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const timestamp = new Date().getTime();
        const res = await fetch(
          `${pusdatinUrl}/api/public/apps/${appId}/status?t=${timestamp}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status === "maintenance") {
            setIsMaintenance(true);
            document.body.style.overflow = "hidden"; // Prevent scrolling behind iframe
          } else {
            setIsMaintenance(false);
            document.body.style.overflow = "";
          }
        }
      } catch (err) {
        // Use console.warn instead of console.error to prevent Next.js Dev Overlay from popping up
        console.warn(
          "Failed to check maintenance status (could be offline or CORS)",
          err,
        );
      }
    };

    // Check immediately on mount
    checkStatus();

    // Polling every 10 seconds to detect changes instantly
    const interval = setInterval(checkStatus, 10000);
    return () => {
      clearInterval(interval);
      document.body.style.overflow = "";
    };
  }, [pusdatinUrl]);

  if (!isMaintenance) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#f8fafc]">
      <iframe
        src={`${pusdatinUrl}/maintenance?app=Si+Mandau`}
        className="w-full h-full border-none"
        title="Maintenance"
      />
    </div>
  );
}
