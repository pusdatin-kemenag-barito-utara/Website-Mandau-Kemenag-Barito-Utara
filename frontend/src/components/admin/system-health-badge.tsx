import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Server, Database, Cloud, ShieldCheck } from "lucide-react";

export function SystemHealthBadge({ collapsed = false }: { collapsed?: boolean }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative border-t border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02]">
      {collapsed ? (
        <div className="p-2.5 flex justify-center">
          <button
            type="button"
            onClick={() => setShowTooltip(!showTooltip)}
            className="h-9 w-9 rounded-xl flex items-center justify-center bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-emerald-500/10 border border-slate-200/80 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all group shadow-xs cursor-pointer"
            title="Status Sistem Online (v3.0)"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs" />
            </span>
          </button>
        </div>
      ) : (
        <div className="p-3">
          <button
            type="button"
            onClick={() => setShowTooltip(!showTooltip)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.07] hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all text-left group shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-xs" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors truncate">
                  Sistem Aktif
                </p>
                <p className="text-[9.5px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  Kemenag Barito Utara
                </p>
              </div>
            </div>

            <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/80 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 tracking-tight shrink-0">
              v3.0
            </span>
          </button>
        </div>
      )}

      {/* Popover Status Details */}
      <AnimatePresence>
        {showTooltip && (
          <m.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={`absolute bottom-full mb-2 z-50 rounded-2xl bg-white dark:bg-[#141923] border border-slate-200 dark:border-white/10 shadow-xl p-3.5 backdrop-blur-xl ${
              collapsed ? "left-3 w-56" : "left-3 right-3"
            }`}
          >
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 dark:border-white/[0.07]">
              <span className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Status Server & Data
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-2 text-[10.5px]">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Database className="h-3 w-3 text-slate-400 dark:text-slate-500" /> PostgreSQL VPS
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">Terhubung</span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Server className="h-3 w-3 text-slate-400 dark:text-slate-500" /> Golang Fiber v3
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">Aktif</span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Cloud className="h-3 w-3 text-slate-400 dark:text-slate-500" /> Cloudflare R2
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">Siap</span>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
