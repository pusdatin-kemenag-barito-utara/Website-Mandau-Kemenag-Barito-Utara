import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Sistem Sedang Pemeliharaan",
  },
  description: "Aplikasi SI MANDAU sedang dalam pemeliharaan sistem.",
};

export default function MaintenancePage() {
  const pusdatinUrl =
    process.env.NEXT_PUBLIC_PUSDATIN_URL || "https://pusdatin.kemenag-baritoutara.com";

  return (
    <main className="fixed inset-0 z-[99999] bg-[#f8fafc] w-screen h-screen">
      <iframe
        src={`${pusdatinUrl}/maintenance?app=Si+Mandau`}
        className="w-full h-full border-none"
        title="Sistem Sedang Pemeliharaan"
      />
    </main>
  );
}
