"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { m, AnimatePresence } from "framer-motion";


export function AdminTopbar({
  onToggleSidebar,
  userEmail,
  userName,
  userRole,
  userAvatar,

}: {
  onToggleSidebar: () => void;
  userEmail: string;
  userName: string;
  userRole?: string;
  userAvatar?: string | null;

}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
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


    </>
  );
}
