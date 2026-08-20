import { ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export function UnauthorizedPage() {
  const handleLogout = () => {
    document.cookie = "sb-esurat-auth-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    localStorage.removeItem("last_activity_time");
    apiClient.auth.logout().catch(() => {});
    window.location.replace("/login");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg border border-slate-100">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Akses Ditolak
        </h1>
        <p className="mb-8 text-sm text-slate-500">
          Anda tidak memiliki hak akses untuk masuk ke aplikasi SI MANDAU.
          Silakan hubungi Super Admin untuk meminta akses.
        </p>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Halaman Login
          </button>
        </div>
      </div>
    </div>
  );
}