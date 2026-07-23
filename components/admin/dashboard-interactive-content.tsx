"use client";

import { m } from "framer-motion";
import {
  FileInput,
  FileOutput,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  Building2,
  SendHorizontal,
  Sparkles,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface SuratMasukItem {
  id: string;
  perihal: string;
  asalSurat: string;
  createdAt: Date;
}

interface SuratKeluarItem {
  id: string;
  perihal: string;
  tujuanSurat: string;
  createdAt: Date;
}

export function DashboardInteractiveContent({
  suratMasukTotal,
  suratKeluarTotal,
  suratMasukBulanIni,
  suratKeluarBulanIni,
  recentSuratMasuk,
  recentSuratKeluar,
}: {
  suratMasukTotal: number;
  suratKeluarTotal: number;
  suratMasukBulanIni: number;
  suratKeluarBulanIni: number;
  recentSuratMasuk: SuratMasukItem[];
  recentSuratKeluar: SuratKeluarItem[];
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <m.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Quick Action Banner */}
      <m.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 sm:p-7 text-white shadow-xl shadow-emerald-900/10"
      >
        {/* Background glow circle */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold tracking-wide text-emerald-100 border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>SI MANDAU Kemenag Barito Utara</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Ringkasan Persuratan & Agenda Naskah
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
              Pantau dan kelola surat masuk & keluar secara real-time dengan cepat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/surat-masuk"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 text-xs font-bold shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Catat Surat Masuk</span>
            </Link>
            <Link
              href="/surat-keluar"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800/40 hover:bg-emerald-800/60 text-white border border-white/20 text-xs font-bold backdrop-blur-md transition-all hover:scale-105 active:scale-95"
            >
              <SendHorizontal className="h-4 w-4" />
              <span>Buat Surat Keluar</span>
            </Link>
          </div>
        </div>
      </m.div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {/* Metric 1: Surat Masuk */}
        <m.div
          variants={itemVariants}
          whileHover={{ y: -4 }}
          className="group relative rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1a1d24] p-5 sm:p-6 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />

          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm shrink-0">
              <FileInput className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/20">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>+{suratMasukBulanIni} bulan ini</span>
            </span>
          </div>

          <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Total Surat Masuk
          </p>
          <div className="flex items-baseline gap-3 mt-1">
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              {suratMasukTotal}
            </h3>
            <span className="text-xs font-semibold text-slate-400">dokumen</span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Surat terdaftar dalam sistem
            </span>
            <Link
              href="/surat-masuk"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>Kelola</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </m.div>

        {/* Metric 2: Surat Keluar */}
        <m.div
          variants={itemVariants}
          whileHover={{ y: -4 }}
          className="group relative rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1a1d24] p-5 sm:p-6 shadow-sm hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 h-32 w-32 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-colors" />

          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-2xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-sm shrink-0">
              <FileOutput className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-500/20">
              <TrendingUp className="h-3 w-3 text-violet-500" />
              <span>+{suratKeluarBulanIni} bulan ini</span>
            </span>
          </div>

          <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Total Surat Keluar
          </p>
          <div className="flex items-baseline gap-3 mt-1">
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              {suratKeluarTotal}
            </h3>
            <span className="text-xs font-semibold text-slate-400">dokumen</span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Naskah resmi diterbitkan
            </span>
            <Link
              href="/surat-keluar"
              className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
            >
              <span>Kelola</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </m.div>
      </div>

      {/* Recent Letters Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Surat Masuk Card */}
        <m.div
          variants={itemVariants}
          className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1a1d24] shadow-sm overflow-hidden flex flex-col"
        >
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                <FileInput className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  Surat Masuk Terbaru
                </h3>
                <p className="text-[10px] font-medium text-slate-400">
                  Daftar agenda naskah masuk
                </p>
              </div>
            </div>

            <Link
              href="/surat-masuk"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5 flex-1">
            {recentSuratMasuk.length > 0 ? (
              recentSuratMasuk.map((surat) => (
                <m.div
                  key={surat.id}
                  whileHover={{ x: 3 }}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-all flex flex-col justify-between group"
                >
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {surat.perihal}
                  </p>
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{surat.asalSurat}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>{new Date(surat.createdAt).toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>
                </m.div>
              ))
            ) : (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <Clock className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-400">
                  Belum ada catatan surat masuk
                </p>
              </div>
            )}
          </div>
        </m.div>

        {/* Surat Keluar Card */}
        <m.div
          variants={itemVariants}
          className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1a1d24] shadow-sm overflow-hidden flex flex-col"
        >
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-100 dark:border-violet-500/20">
                <FileOutput className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  Surat Keluar Terbaru
                </h3>
                <p className="text-[10px] font-medium text-slate-400">
                  Daftar naskah keluar diterbitkan
                </p>
              </div>
            </div>

            <Link
              href="/surat-keluar"
              className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5 flex-1">
            {recentSuratKeluar.length > 0 ? (
              recentSuratKeluar.map((surat) => (
                <m.div
                  key={surat.id}
                  whileHover={{ x: 3 }}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-all flex flex-col justify-between group"
                >
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {surat.perihal}
                  </p>
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      <SendHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{surat.tujuanSurat}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>{new Date(surat.createdAt).toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>
                </m.div>
              ))
            ) : (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <Clock className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-400">
                  Belum ada catatan surat keluar
                </p>
              </div>
            )}
          </div>
        </m.div>
      </div>
    </m.div>
  );
}
