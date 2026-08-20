import { useState, useCallback, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { loginSchema } from "@/lib/validations/auth";
import { LoginTurnstile } from "@/components/auth/_components/login-turnstile";
import { ErrorBoundary } from "@/components/auth/error-boundary";
import { LoginCardMotion, LoginBgMotion } from "@/components/auth/login-card";
import { ParticleCanvas } from "@/components/auth/particle-canvas";
import {
  Loader2,
  Mail,
  Key,
  Eye,
  EyeOff,
  ArrowRight,
  FileText,
  Calendar,
  ShieldCheck,
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
      <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-between overflow-y-auto bg-gradient-to-br from-[#f8fafc] via-[#e6fcf5] to-[#f8fafc] p-4 sm:p-6 lg:p-10">
        {/* Subtle particle canvas */}
        <ParticleCanvas />

        {/* Animated background blobs */}
        <LoginBgMotion />

        {/* Spacer top */}
        <div className="w-full h-1 sm:h-4" />

        {/* Main 2-Panel Content Card */}
        <div className="relative z-10 w-full max-w-5xl my-auto py-2 sm:py-0">
          <LoginCardMotion className="w-full">
            <div className="rounded-3xl bg-white/85 backdrop-blur-2xl shadow-2xl shadow-emerald-950/10 border border-white/90 overflow-hidden ring-1 ring-slate-200/60 grid grid-cols-1 lg:grid-cols-12">
              
              {/* LEFT PANEL: Branding & Info */}
              <div className="lg:col-span-5 relative bg-gradient-to-br from-emerald-900/95 via-emerald-800/90 to-teal-950/95 p-5 sm:p-8 lg:p-10 flex flex-col justify-between text-white overflow-hidden">
                {/* Decorative background circle shapes inside left panel */}
                <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.07] pointer-events-none" />

                <div className="relative z-10">
                  {/* Header Badge */}
                  <m.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/30 text-emerald-200 text-[10px] sm:text-[11px] font-semibold tracking-wide backdrop-blur-md mb-3 sm:mb-6"
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Kemenag Barito Utara</span>
                  </m.div>

                  {/* Logo & Title Section */}
                  <div className="flex lg:flex-col items-center lg:items-start gap-3.5 sm:gap-4">
                    <m.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="relative w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 drop-shadow-md shrink-0 bg-white/10 rounded-2xl p-1.5 lg:p-0 flex items-center justify-center"
                    >
                      <img
                        src="/mandau.png"
                        alt="Logo Resmi SI MANDAU Kemenag Barito Utara"
                        width={96}
                        height={96}
                        loading="eager"
                        fetchPriority="high"
                        className="object-contain w-full h-full"
                      />
                    </m.div>

                    <div>
                      <m.h1
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="text-xl sm:text-2xl lg:text-4xl font-black tracking-tight text-white leading-tight"
                      >
                        SI MANDAU
                      </m.h1>
                      <m.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="text-xs sm:text-xs lg:text-sm font-medium text-emerald-100/90 leading-snug lg:leading-relaxed mt-0.5"
                      >
                        Sistem Informasi Manajemen Agenda Naskah Dinas & Administrasi Umum
                      </m.p>
                    </div>
                  </div>

                  {/* Description & Feature Highlights (Desktop only) */}
                  <m.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="mt-8 space-y-3 hidden lg:block"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-emerald-50 hover:bg-white/15 transition-colors">
                      <div className="p-2 rounded-xl bg-emerald-500/30 text-emerald-300 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Persuratan & Naskah Digital</p>
                        <p className="text-[11px] text-emerald-200/80">Pengelolaan agenda & naskah dinas terpadu</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-emerald-50 hover:bg-white/15 transition-colors">
                      <div className="p-2 rounded-xl bg-teal-500/30 text-teal-300 shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Manajemen Agenda Terstruktur</p>
                        <p className="text-[11px] text-emerald-200/80">Penjadwalan & tracking tugas efisien</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-emerald-50 hover:bg-white/15 transition-colors">
                      <div className="p-2 rounded-xl bg-emerald-500/30 text-emerald-300 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Akses Aman & Terverifikasi</p>
                        <p className="text-[11px] text-emerald-200/80">Keamanan data terjamin & terlindungi</p>
                      </div>
                    </div>
                  </m.div>
                </div>

                {/* Left Panel Footer (Desktop only) */}
                <div className="relative z-10 mt-6 pt-4 border-t border-emerald-700/50 hidden lg:flex items-center justify-between text-[11px] text-emerald-200/70">
                  <span>Kantor Kemenag Barito Utara</span>
                  <span className="font-semibold text-emerald-300">v2.0</span>
                </div>
              </div>

              {/* RIGHT PANEL: Login Form */}
              <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white/70">
                <div className="max-w-md mx-auto w-full space-y-4 sm:space-y-6">
                  
                  {/* Form Title */}
                  <div>
                    <h2 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">
                      Masuk ke Akun
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                      Silakan masukkan email admin dan kata sandi Anda.
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
                  <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-4">
                    
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

                </div>
              </div>

            </div>
          </LoginCardMotion>
        </div>

        {/* Footer text */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="relative z-10 py-3 sm:py-2 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase text-center w-full shrink-0"
        >
          &copy; {new Date().getFullYear()} SI MANDAU KEMENAG BARITO UTARA
        </m.div>
      </div>
    </FramerProvider>
  );
}
