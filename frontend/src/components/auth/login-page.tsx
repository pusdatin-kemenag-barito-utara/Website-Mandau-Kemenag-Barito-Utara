import { useState, useCallback, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { loginSchema } from "@/lib/validations/auth";
import { LoginTurnstile, type LoginTurnstileRef } from "@/components/auth/_components/login-turnstile";
import { ErrorBoundary } from "@/components/auth/error-boundary";
import {
  Loader2,
  Mail,
  Key,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { m, AnimatePresence } from "framer-motion";
import { FramerProvider } from "@/components/providers/framer-provider";

interface LoginPageProps {
  turnstileSiteKey?: string;
}

export function LoginPage({ turnstileSiteKey }: LoginPageProps = {}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<LoginTurnstileRef>(null);
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
          turnstileRef.current?.reset();
          setTurnstileToken(null);
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
        turnstileRef.current?.reset();
        setTurnstileToken(null);
      } finally {
        setLoading(false);
      }
    },
    [email, password, turnstileToken, rememberMe],
  );

  return (
    <FramerProvider>
      <div className="relative w-full min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] grid grid-cols-1 lg:grid-cols-12 overflow-x-hidden lg:overflow-hidden bg-white">
        
        {/* SISI KIRI: Tampilan Elegan & Terpusat SI MANDAU */}
        <div className="relative z-10 lg:col-span-7 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/40 to-slate-100/80 min-h-[420px] lg:h-full lg:min-h-0 border-b lg:border-b-0 lg:border-r border-slate-200/80">
          
          {/* Subtle background decorative grid pattern & glowing orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07]" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full bg-emerald-200/35 blur-[100px]" />
            <div className="absolute bottom-10 left-1/3 w-72 h-72 rounded-full bg-teal-200/25 blur-[90px]" />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full p-8 sm:p-12 lg:p-16">
            {/* Top Area: Badge Kemenag Elegan Terpusat */}
            <div className="flex justify-center">
              <m.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-xs backdrop-blur-md"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Kantor Kementerian Agama Kabupaten Barito Utara</span>
              </m.div>
            </div>

            {/* Center: Identitas Aplikasi Ditengah (Center Aligned) */}
            <div className="my-auto py-8 flex flex-col items-center text-center max-w-md mx-auto">
              {/* Logo Card dengan Ring & Shadow Berlapis */}
              <m.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
                className="relative mb-6"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-4 shadow-xl shadow-emerald-950/5 border border-emerald-100/90 flex items-center justify-center ring-8 ring-emerald-500/10 backdrop-blur-sm">
                  <img
                    src="/mandau.png"
                    alt="Logo Resmi SI MANDAU"
                    width={112}
                    height={112}
                    loading="eager"
                    fetchPriority="high"
                    className="object-contain w-full h-full drop-shadow-sm"
                  />
                </div>
              </m.div>

              {/* Teks Judul & Subtitle */}
              <m.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="space-y-2 flex flex-col items-center"
              >
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                  SI MANDAU
                </h1>
                
                <p className="text-base sm:text-lg font-bold text-emerald-800 tracking-normal">
                  Sistem Tata Kelola Persuratan Digital
                </p>

                {/* Aksen Garis Halus */}
                <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full my-2" />

                <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xs leading-relaxed">
                  Layanan administrasi persuratan dinas dan agenda pimpinan terintegrasi.
                </p>
              </m.div>
            </div>

            {/* Footer Sisi Kiri Terpusat & Rapi */}
            <div className="pt-6 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
              <span>&copy; {new Date().getFullYear()} Kemenag Barito Utara</span>
              <span className="font-medium text-emerald-700/80 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/50">
                Versi 2.0
              </span>
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
                className="w-full py-1"
              >
                <ErrorBoundary>
                  <LoginTurnstile
                    ref={turnstileRef}
                    mounted={mounted}
                    onTokenChange={setTurnstileToken}
                    siteKey={turnstileSiteKey}
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
