import { Users, Crown, ShieldCheck, FileText, Building2, UserCheck } from "lucide-react";
import type { UserStats } from "./types";

interface UserStatsCardsProps {
  stats: UserStats;
}

export function UserStatsCards({ stats }: UserStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {/* Card 1: Total Pengguna */}
      <div className="bg-white dark:bg-[#151922] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-300 dark:hover:border-white/20 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Akun</span>
          <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {stats.total}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Semua tingkatan</p>
        </div>
      </div>

      {/* Card 2: Super Admin */}
      <div className="bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Crown className="h-3.5 w-3.5 text-amber-500" /> Super Admin
          </span>
          <div className="h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-300 tracking-tight">
              {stats.superAdmin}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
              Tunggal
            </span>
          </div>
          <p className="text-[11px] text-amber-700/70 dark:text-amber-400/70 mt-0.5">Otoritas tertinggi</p>
        </div>
      </div>

      {/* Card 3: Admin Surat */}
      <div className="bg-white dark:bg-[#151922] border border-emerald-500/20 dark:border-emerald-500/20 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Admin Surat</span>
          <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <FileText className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {stats.admin}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Tata Usaha umum</p>
        </div>
      </div>

      {/* Card 4: Admin Bidang */}
      <div className="bg-white dark:bg-[#151922] border border-sky-500/20 dark:border-sky-500/20 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-sky-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">Admin Bidang</span>
          <div className="h-8 w-8 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Building2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {stats.adminBidang}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Per Seksi / Unit</p>
        </div>
      </div>

      {/* Card 5: Akun Aktif */}
      <div className="bg-white dark:bg-[#151922] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm relative overflow-hidden col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Akun Aktif</span>
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <UserCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {stats.active}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Dapat login</p>
        </div>
      </div>
    </div>
  );
}
