"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";

export function SystemHealthBadge({ collapsed = false }: { collapsed?: boolean }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative px-3 py-3 border-t border-white/5">
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        className={`flex items-center gap-2.5 w-full py-1.5 rounded-lg hover:bg-white/5 transition-colors ${
          collapsed ? "justify-center px-0" : "px-2"
        }`}
        title={collapsed ? "Sistem Online" : undefined}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        {!collapsed && (
          <span className="text-[11px] font-bold text-white/50">Sistem Online</span>
        )}
      </button>

      <AnimatePresence>
        {showTooltip && (
          <m.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-2 mb-2 w-56 rounded-xl bg-slate-800 border border-white/10 shadow-2xl p-3"
          >
            <p className="text-[11px] font-bold text-white/80 mb-2">Status Sistem</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40">Database</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Terhubung
                </span>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
