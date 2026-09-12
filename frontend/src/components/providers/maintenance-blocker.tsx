import { useState, useEffect } from "react";

export function MaintenanceBlocker() {
  const [isMaintenance, setIsMaintenance] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("sys_maintenance") === "true";
    }
    return false;
  });
  const pusdatinUrl =
    (typeof window !== "undefined" &&
      (window as unknown as { __PUBLIC_CONFIG__?: { PUBLIC_PUSDATIN_URL?: string } }).__PUBLIC_CONFIG__?.PUBLIC_PUSDATIN_URL) ||
    import.meta.env.PUBLIC_PUSDATIN_URL ||
    "https://pusdatin.kemenag-baritoutara.com";
  const appId = "e-surat-kemenag";

  useEffect(() => {
    const checkStatus = async () => {
      if (!pusdatinUrl) return;
      try {
        const timestamp = Date.now();
        const res = await fetch(
          `${pusdatinUrl}/api/public/apps/${appId}/status?t=${timestamp}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            const currentPath = window.location.pathname;

            if (data.status === "maintenance") {
              setIsMaintenance(true);
              sessionStorage.setItem("sys_maintenance", "true");
              document.cookie = "sys_maintenance=true; path=/; max-age=86400; SameSite=Lax";
              document.body.style.overflow = "hidden";
              document.title = "Sistem Sedang Pemeliharaan";

              // Hanya redirect jika pengguna BELUM berada di halaman /maintenance
              if (currentPath !== "/maintenance") {
                window.location.replace("/maintenance");
              }
            } else {
              setIsMaintenance(false);
              sessionStorage.removeItem("sys_maintenance");
              document.cookie = "sys_maintenance=; path=/; max-age=0; SameSite=Lax";
              document.body.style.overflow = "";

              // Jika status pemeliharaan sudah selesai dan masih di /maintenance, kembalikan ke beranda
              if (currentPath === "/maintenance") {
                window.location.replace("/");
              }
            }
          }
        }
      } catch (err) {
        console.warn(
          "Failed to check maintenance status (could be offline or CORS)",
          err
        );
      }
    };

    // Cek segera saat komponen dimount
    checkStatus();

    // Polling berkala setiap 10 detik untuk mendeteksi perubahan status Pusdatin
    const interval = setInterval(checkStatus, 10000);
    return () => {
      clearInterval(interval);
      document.body.style.overflow = "";
    };
  }, [pusdatinUrl]);

  // Jika sedang di halaman /maintenance, halaman maintenance.astro sendiri yang merender iframe.
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
  if (!isMaintenance || currentPath === "/maintenance") return null;

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
