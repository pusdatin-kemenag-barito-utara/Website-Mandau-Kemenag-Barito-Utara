import { useState, useCallback, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { loginSchema } from "@/lib/validations/auth";
import { LoginTurnstile } from "@/components/auth/_components/login-turnstile";
import { ErrorBoundary } from "@/components/auth/error-boundary";
import { LoginBgMotion } from "@/components/auth/login-card";
import { ParticleCanvas } from "@/components/auth/particle-canvas";
import {
  Loader2,
  Mail,
  Key,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { m, AnimatePresence } from "framer-motion";
import { FramerProvider } from "@/components/providers/framer-provider";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const mounted = true;
  const [error, setError] = useState("");
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Load saved email on mount & auto focus password if email is remembered
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setTimeout(() => {
        setEmail(savedEmail);
        setRememberMe(true);
        passwordInputRef.current?.focus();
      }, 50);
    }
  }, []);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      // 1. Zod input validation
      const validation = loginSchema.safeParse({ email, password });
      if (!validation.success) {
        const firstErr = validation.error.issues[0]?.message || "Input tidak valid";
        setError(firstErr);
        return;
      }

      // 2. Turnstile token check
      if (!turnstileToken) {
        setError("Verifikasi keamanan diperlukan.");
        return;
      }

      setLoading(true);

      try {
        const authRes = await apiClient.auth.login(
          validation.data.email,
          validation.data.password,
          turnstileToken,
        );

        if (!authRes.success) {
          const msg = authRes.error || "Gagal masuk. Periksa kembali email dan kata sandi.";
          setError(msg);
          toast.error(msg);
        } else {
          setError("");
          if (authRes.data && (authRes.data as { token?: string }).token) {
            const token = (authRes.data as { token: string }).token;
            document.cookie = `sb-esurat-auth-token=${token}; path=/; max-age=604800; SameSite=Lax`;
          }
          if (rememberMe) {
            localStorage.setItem("rememberedEmail", validation.data.email);
          } else {
            localStorage.removeItem("rememberedEmail");
          }
          toast.success("Berhasil masuk, mengalihkan...");
          window.location.replace("/");
        }
      } catch (err: unknown) {
        console.error("Login client error:", err);
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [email, password, turnstileToken, rememberMe],
  );

  return (
    <FramerProvider>
      <div className="relative w-full min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] grid grid-cols-1 lg:grid-cols-12 overflow-x-hidden lg:overflow-hidden bg-white">
        
        {/* SISI KIRI: Tampilan Pengenalan Aplikasi SI MANDAU (Dengan Bubbles & Partikel) */}
        <div className="relative z-10 lg:col-span-7 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#f8fafc] via-[#e6fcf5] to-[#f8fafc] min-h-[480px] lg:h-full lg:min-h-0">
          {/* Subtle particle canvas scoped ONLY to left panel */}
          <ParticleCanvas />

          {/* Animated background blobs scoped ONLY to left panel */}
          <LoginBgMotion />

          <div className="relative z-10 flex flex-col justify-between h-full p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto">
            {/* Top Badge */}
            <div>
              <m.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-600/10 border border-emerald-600/20 text-emerald-800 text-xs font-semibold backdrop-blur-md"
              >
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>Kantor Kementerian Agama Kabupaten Barito Utara</span>
              </m.div>
            </div>

            {/* Center: Info Aplikasi */}
            <div className="my-auto py-8 sm:py-10 max-w-xl">
              <m.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 mb-6 drop-shadow-xl bg-white/90 rounded-3xl p-3 border border-emerald-100 shadow-xl shadow-emerald-900/5 backdrop-blur-md flex items-center justify-center ring-4 ring-emerald-500/10"
              >
                <img
                  src="/mandau.png"
                  alt="Logo Resmi SI MANDAU Kemenag Barito Utara"
                  width={112}
                  height={112}
                  loading="eager"
                  fetchPriority="high"
                  className="object-contain w-full h-full"
                />
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-100/70 text-emerald-800 text-[11px] font-bold tracking-wider uppercase mb-3">
                  Portal Resmi Persuratan & Agenda
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                  SI MANDAU
                </h1>
                <p className="text-sm sm:text-base font-semibold text-emerald-700 mt-2 tracking-wide uppercase">
                  Sistem Informasi Manajemen Agenda Naskah Dinas & Administrasi Umum
                </p>
                <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mt-4 max-w-lg">
                  Platform digital tata kelola persuratan dinas, registrasi penomoran naskah, disposisi elektronik, serta agenda pimpinan secara terintegrasi di lingkungan Kantor Kementerian Agama Kabupaten Barito Utara.
                </p>
              </m.div>

              {/* Fitur Ringkas */}
              <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex flex-wrap gap-2.5 mt-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-emerald-200/80 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Registrasi & Penomoran Naskah
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-emerald-200/80 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Disposisi Surat Elektronik
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-emerald-200/80 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Agenda Pimpinan Terpadu
                </div>
              </m.div>
            </div>

            {/* Footer Sisi Kiri */}
            <div className="pt-6 border-t border-emerald-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
              <span>&copy; {new Date().getFullYear()} Kantor Kementerian Agama Kabupaten Barito Utara</span>
              <span className="font-semibold text-emerald-700">Versi 2.0</span>
            </div>
          </div>
        </div>

        {/* SISI KANAN: Khusus Form Login (Murni Putih Solid, Tanpa Partikel/Bubbles) */}
        <div className="relative z-20 lg:col-span-5 flex flex-col justify-center items-center h-full min-h-[520px] lg:min-h-0 p-6 sm:p-10 lg:p-12 xl:p-16 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 shadow-xl overflow-y-auto">
          <div className="w-full max-w-md space-y-5 sm:space-y-6 my-auto">
            
            {/* Form Title */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Masuk ke Akun
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">
                Silakan masukkan email admin dan kata sandi Anda untuk mengakses dashboard.
              </p>
            </div>

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <m.div
                  role="alert"
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="px-4 py-2.5 bg-red-50/90 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl flex items-center gap-2"
                >
                  <span>{error}</span>
                </m.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Email Input */}
              <m.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-1.5"
              >
                <label
                  htmlFor="admin-email"
                  className="text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-1 cursor-pointer"
                >
                  Email Admin
                </label>
                <div className={`relative flex items-center h-11 sm:h-12 rounded-xl sm:rounded-2xl border transition-all shadow-sm ${email ? "bg-white border-emerald-500/50 ring-2 ring-emerald-500/10" : "bg-white border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10"}`}>
                  <div className={`pl-4 pr-3 ${email ? "text-emerald-600" : "text-slate-400"}`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    required
                    aria-required="true"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@kemenag.go.id"
                    className="w-full h-full pr-4 bg-transparent text-xs sm:text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
              </m.div>

              {/* Password Input */}
              <m.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-1.5"
              >
                <label
                  htmlFor="admin-password"
                  className="text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-1 cursor-pointer"
                >
                  Password
                </label>
                <div className={`relative flex items-center h-11 sm:h-12 rounded-xl sm:rounded-2xl border transition-all shadow-sm ${password ? "bg-white border-emerald-500/50 ring-2 ring-emerald-500/10" : "bg-white border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10"}`}>
                  <div className={`pl-4 pr-3 ${password ? "text-emerald-600" : "text-slate-400"}`}>
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    ref={passwordInputRef}
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    aria-required="true"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-full pr-10 bg-transparent text-xs sm:text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 tracking-wider"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-emerald-600 transition-colors p-1.5 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </m.div>

              {/* Remember Me Switch */}
              <m.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2.5 py-1"
              >
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    rememberMe ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                  role="switch"
                  aria-checked={rememberMe}
                  aria-label="Ingat email saya"
                >
                  <span className="sr-only">Ingat Saya</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      rememberMe ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
                <label
                  htmlFor="admin-email"
                  className="text-[11px] font-bold tracking-wider text-slate-600 uppercase cursor-pointer select-none"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  Ingat Saya
                </label>
              </m.div>

              {/* Cloudflare Turnstile Verification */}
              <m.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex w-full items-center justify-center py-1 origin-center scale-95 sm:scale-100"
              >
                <ErrorBoundary>
                  <LoginTurnstile
                    mounted={mounted}
                    onTokenChange={setTurnstileToken}
                  />
                </ErrorBoundary>
              </m.div>

              {/* Submit Button */}
              <m.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="pt-1"
              >
                <button
                  type="submit"
                  disabled={loading || !turnstileToken}
                  className="group relative inline-flex h-11 sm:h-12 w-full items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] px-6 text-xs sm:text-sm font-bold tracking-wider text-white uppercase shadow-lg shadow-emerald-600/25 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:pointer-events-none disabled:opacity-60"
                >
                  <span className="relative flex items-center gap-2">
                    {loading && (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    )}
                    {loading ? "Memproses..." : "Masuk Ke Dashboard"}
                    {!loading && (
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    )}
                  </span>
                </button>
              </m.div>
            </form>

            {/* Sub-footer inside right panel */}
            <div className="pt-2 text-center text-[11px] text-slate-400 font-medium">
              SI MANDAU • Pusat Data dan Informasi Kemenag Barito Utara
            </div>

          </div>
        </div>
      </div>
    </FramerProvider>
  );
}
