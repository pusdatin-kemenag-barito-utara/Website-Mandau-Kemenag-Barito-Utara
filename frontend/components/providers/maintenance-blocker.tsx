"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function MaintenanceBlocker() {
  const [isMaintenance, setIsMaintenance] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("sys_maintenance") === "true";
    }
    return false;
  });
  const pathname = usePathname();
  const router = useRouter();
  const pusdatinUrl = process.env.NEXT_PUBLIC_PUSDATIN_URL || "";
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
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (data.status === "maintenance") {
              setIsMaintenance(true);
              sessionStorage.setItem("sys_maintenance", "true");
              document.cookie = "sys_maintenance=true; path=/; max-age=60";
              document.body.style.overflow = "hidden";
              document.title = "Sistem Sedang Pemeliharaan";
              if (pathname !== "/maintenance") {
                router.replace("/maintenance");
              }
            } else {
              setIsMaintenance(false);
              sessionStorage.removeItem("sys_maintenance");
              document.cookie = "sys_maintenance=; path=/; max-age=0";
              document.body.style.overflow = "";
              if (pathname === "/maintenance") {
                router.replace("/");
              }
            }
          }
        }
      } catch (err) {
        // Use console.warn instead of console.error to prevent Next.js Dev Overlay from popping up
        console.warn(
          "Failed to check maintenance status (could be offline or CORS)",
          err
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
  }, [pathname, pusdatinUrl, router]);

  // If on /maintenance page, the page itself renders the iframe.
  // Otherwise, render full screen overlay immediately when maintenance is true to prevent content flash while route is replacing.
  if (!isMaintenance || pathname === "/maintenance") return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#f8fafc]">
      <iframe
        src={`${pusdatinUrl}/maintenance?app=Si+Mandau`}
        className="w-full h-full border-none"
        title="Sistem Sedang Pemeliharaan"
      />
    </div>
  );
}
