"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { verifyTurnstileAction } from "@/lib/actions/auth/login-helper";
import { LoginTurnstile } from "@/components/auth/_components/login-turnstile";
import { ErrorBoundary } from "@/components/auth/error-boundary";
import { LoginCardMotion, LoginBgMotion } from "@/components/auth/login-card";
import { ParticleCanvas } from "@/components/auth/particle-canvas";
import { Loader2, Mail, Key, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { m, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
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

      if (!turnstileToken) {
        setError("Verifikasi keamanan diperlukan.");
        return;
      }

      setLoading(true);

      try {
        const verify = await verifyTurnstileAction(turnstileToken);
        if (!verify.success) {
          setError(verify.error || "Verifikasi keamanan gagal.");
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(authError.message);
        } else {
          if (rememberMe) {
            localStorage.setItem("rememberedEmail", email);
          } else {
            localStorage.removeItem("rememberedEmail");
          }
          toast.success("Berhasil masuk");
          router.push("/");
          router.refresh();
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    },
    [email, password, turnstileToken, router, rememberMe],
  );

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-x-hidden bg-gradient-to-br from-[#f8fafc] via-[#e6fcf5] to-[#f8fafc] py-8 px-4 sm:py-12">
      {/* Subtle particle canvas */}
      <ParticleCanvas />

      {/* Animated background blobs */}
      <LoginBgMotion />

      {/* Main Content wrapper */}
      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center my-auto">
        {/* Header / Logo section */}
        <div className="mb-7 sm:mb-8 flex flex-col items-center text-center">
          <m.div
            initial={{ opacity: 0, y: -15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative w-20 h-20 sm:w-24 sm:h-24 mb-3 flex items-center justify-center drop-shadow-sm"
          >
            <Image
              src="/mandau.png"
              alt="Logo SI MANDAU"
              fill
              className="object-contain"
              priority
            />
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center gap-1.5 mt-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] sm:text-xs font-bold tracking-widest text-emerald-600 uppercase text-center leading-normal">
              Kementerian Agama Kabupaten Barito Utara
            </span>
          </m.div>

          <m.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-3 text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-none"
          >
            SI MANDAU
          </m.h1>

          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-3 space-y-1 px-2 text-center"
          >
            <p className="text-xs sm:text-[13px] font-medium text-slate-700 leading-normal">
              <span className="font-extrabold text-slate-900">S</span>istem{" "}
              <span className="font-extrabold text-slate-900">I</span>nformasi
            </p>
            <p className="text-xs sm:text-[13px] font-medium text-slate-700 leading-relaxed">
              <span className="font-extrabold text-slate-900">M</span>anajemen{" "}
              <span className="font-extrabold text-slate-900">A</span>genda{" "}
              <span className="font-extrabold text-slate-900">N</span>askah{" "}
              <span className="font-extrabold text-slate-900">D</span>inas dan{" "}
              <span className="font-extrabold text-slate-900">A</span>dministrasi{" "}
              <span className="font-extrabold text-slate-900">U</span>mum.
            </p>
          </m.div>
        </div>

        {/* Clean Login card */}
        <LoginCardMotion className="w-full">
          <div className="rounded-3xl bg-white/85 backdrop-blur-xl shadow-xl shadow-emerald-950/5 border border-white p-6 sm:p-8 ring-1 ring-slate-200/50">
            {/* Error message */}
            <AnimatePresence>
              {error && (
                <m.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="mb-4 px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl"
                >
                  {error}
                </m.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-4">
              <m.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-1.5"
              >
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-1">
                  Email Admin
                </label>
                <div className="relative flex items-center h-12 bg-slate-50 rounded-xl border border-slate-200 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <div className="pl-3.5 pr-2.5 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@kemenag.go.id"
                    className="w-full h-full pr-3 bg-transparent text-xs sm:text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
              </m.div>

              <m.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-1.5"
              >
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-1">
                  Password
                </label>
                <div className="relative flex items-center h-12 bg-slate-50 rounded-xl border border-slate-200 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <div className="pl-3.5 pr-2.5 text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-full pr-10 bg-transparent text-xs sm:text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-emerald-600 transition-colors p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2.5 py-0.5"
              >
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    rememberMe ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                  role="switch"
                  aria-checked={rememberMe}
                >
                  <span className="sr-only">Ingat Saya</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      rememberMe ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
                <span
                  className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-600 uppercase cursor-pointer select-none"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  Ingat Saya
                </span>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex w-full items-center justify-center py-0.5"
              >
                <ErrorBoundary>
                  <LoginTurnstile
                    mounted={mounted}
                    onTokenChange={setTurnstileToken}
                  />
                </ErrorBoundary>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <button
                  type="submit"
                  disabled={loading || !turnstileToken}
                  className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-emerald-600 px-6 text-xs sm:text-sm font-bold tracking-wider text-white uppercase shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-70"
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
        </LoginCardMotion>
      </div>

      {/* Footer text */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative z-10 mt-8 sm:mt-10 text-[9px] sm:text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase text-center w-full px-4 shrink-0"
      >
        &copy; {new Date().getFullYear()} SI MANDAU KEMENAG BARITO UTARA
      </m.div>
    </div>
  );
}
