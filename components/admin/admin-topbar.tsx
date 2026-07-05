"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, ChevronDown, LogOut, ShieldCheck, KeyRound, Eye, EyeOff, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { m, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function ChangePasswordModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Kalkulasi kekuatan password
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length >= 8) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(password);
  
  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-slate-200 dark:bg-slate-800";
    if (score === 1) return "bg-red-500";
    if (score === 2) return "bg-orange-500";
    if (score === 3) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return "";
    if (score === 1) return "Sangat Lemah";
    if (score === 2) return "Lemah";
    if (score === 3) return "Cukup Baik";
    return "Kuat";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password berhasil diubah");
      onOpenChange(false);
      setPassword("");
      setConfirm("");
      setShowPassword(false);
      setShowConfirm(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
              <KeyRound className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
            </div>
            <div>
              <DialogTitle>Ubah Password</DialogTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Masukkan password baru Anda
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                Password Baru
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="pr-10 bg-slate-50/50 dark:bg-slate-900/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="pt-1.5 px-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                          strength >= level ? getStrengthColor(strength) : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] font-bold text-right" style={{ color: strength >= 1 ? 'inherit' : 'transparent' }}>
                    <span className={
                      strength === 1 ? "text-red-500" :
                      strength === 2 ? "text-orange-500" :
                      strength === 3 ? "text-yellow-500" :
                      "text-emerald-500"
                    }>
                      {getStrengthText(strength)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Ulangi password"
                  className="pr-10 bg-slate-50/50 dark:bg-slate-900/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="flex-1"
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}



export function AdminTopbar({
  onToggleSidebar,
  userEmail,
  userName,
  userRole,
  userAvatar,
  isSuperAdmin = false,
}: {
  onToggleSidebar: () => void;
  userEmail: string;
  userName: string;
  userRole?: string;
  userAvatar?: string | null;
  isSuperAdmin?: boolean;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/login";
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-[#0f1117] border-b border-slate-200/80 dark:border-white/5 flex items-center justify-between px-4 lg:px-6 shrink-0 transition-colors duration-300">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-all lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb area */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span className="text-slate-600 dark:text-slate-300">Panel Admin</span>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 lg:gap-4">
          {isSuperAdmin && (
            <a
              href={process.env.NEXT_PUBLIC_PUSDATIN_URL || "http://localhost:3000"}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-all flex items-center justify-center"
              title="Kembali ke Portal Pusdatin"
            >
              <Globe className="h-5 w-5" />
            </a>
          )}
          <ThemeToggle />
          
          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          >
            <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 shadow-sm overflow-hidden shrink-0 p-1">
              {userAvatar ? (
                <Image src={userAvatar} alt="Avatar" width={24} height={24} className="object-cover w-full h-full rounded-full" />
              ) : (
                <Image src="/kemenag.svg" alt="Avatar" width={24} height={24} className="object-contain" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{userName}</p>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{userRole ?? userEmail}</p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <m.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 5, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1d24] p-2 shadow-xl z-50"
              >
                {/* User info */}
                <div className="px-3 py-3 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 shrink-0 p-1.5 overflow-hidden">
                      {userAvatar ? (
                        <Image src={userAvatar} alt="Avatar" width={32} height={32} className="object-cover w-full h-full rounded-full" />
                      ) : (
                        <Image src="/kemenag.svg" alt="Avatar" width={32} height={32} className="object-contain" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userName}</p>
                      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">{userEmail}</p>
                      {userRole && (
                        <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
                          userRole === "Super Admin"
                            ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20"
                            : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20"
                        }`}>
                          <ShieldCheck className="h-2.5 w-2.5" />
                          {userRole}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="pt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setShowChangePassword(true);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all"
                  >
                    <KeyRound className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    Ubah Password
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar Sesi
                  </button>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </header>

      <ChangePasswordModal
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />
    </>
  );
}
