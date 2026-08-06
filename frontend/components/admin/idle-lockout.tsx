"use client";

import { useState, useEffect, useCallback } from "react";
import { Lock, ShieldAlert, KeyRound } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function IdleLockout() {
  const [isLocked, setIsLocked] = useState(false);

  const resetTimer = useCallback(() => {
    if (isLocked) return;
    localStorage.setItem("last_activity_time", Date.now().toString());
  }, [isLocked]);

  useEffect(() => {
    const checkIdleStatus = () => {
      const lastActivity = localStorage.getItem("last_activity_time");
      if (!lastActivity) {
        localStorage.setItem("last_activity_time", Date.now().toString());
        return;
      }
      const elapsed = Date.now() - parseInt(lastActivity, 10);
      if (elapsed >= IDLE_TIMEOUT_MS) {
        setIsLocked(true);
      }
    };

    // Initial check
    checkIdleStatus();

    // Event listeners to track activity
    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleUserActivity = () => resetTimer();

    activityEvents.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));
    
    // Interval check every 30 seconds
    const interval = setInterval(checkIdleStatus, 30000);

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      clearInterval(interval);
    };
  }, [resetTimer, isLocked]);

  const handleUnlock = () => {
    localStorage.setItem("last_activity_time", Date.now().toString());
    setIsLocked(false);
  };

  return (
    <AnimatePresence>
      {isLocked && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        >
          <m.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-white dark:bg-[#181b22] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5"
          >
            <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-md">
              <Lock className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Sesi Terkunci Otomatis
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                Demi keamanan data kearsipan Kemenag, layar dikunci karena tidak ada aktivitas selama 30 menit.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/5 flex items-center gap-3 text-left">
              <ShieldAlert className="h-5 w-5 text-emerald-500 shrink-0" />
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Semua data dan draf pekerjaan Anda tetap tersimpan dengan aman.
              </p>
            </div>

            <button
              onClick={handleUnlock}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="h-4 w-4" />
              Buka Kunci Sesi
            </button>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
