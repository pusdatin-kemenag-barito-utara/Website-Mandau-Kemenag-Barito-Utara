import { Building2, Users, ArrowRight, ShieldCheck } from "lucide-react";
import { MasterSectionCard } from "./master-section-card";

export function OpsiUnitKerjaView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Kolom Kiri: Kartu Kelola Unit Kerja */}
      <div className="lg:col-span-7">
        <MasterSectionCard
          kategori="unit_kerja"
          title="Unit Kerja / Seksi Penerbit"
          subtitle="Daftar seksi atau penyelenggara di lingkungan Kemenag Barito Utara"
          icon={Building2}
          accent="amber"
          badgeLabel="Unit Kerja"
          infoNote="Unit kerja yang Anda kelola di sini otomatis tersinkronisasi sebagai pilihan bidang saat menambah Admin Bidang pada Manajemen Pengguna."
        />
      </div>

      {/* Kolom Kanan: Panduan & Integrasi Manajemen Pengguna */}
      <div className="lg:col-span-5 space-y-4">
        {/* Guideline Card */}
        <div className="p-5 bg-white dark:bg-[#1a1d24] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-500/20 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Sinkronisasi Manajemen Pengguna
              </h4>
              <p className="text-[11px] text-slate-400">
                Terhubung otomatis dengan role Admin Bidang
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Setiap unit kerja yang terdaftar di sistem ini otomatis menjadi pilihan seksi/bidang saat Super Admin menetapkan penugasan pengguna.
          </p>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
              <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                1
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                <strong>Opsi Form Pengguna:</strong> Dropdown pilihan bidang akun staf mengambil data langsung dari daftar unit kerja ini.
              </p>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
              <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                2
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                <strong>Penerbit Surat Keluar:</strong> Digunakan untuk menandai seksi asal yang menerbitkan naskah dinas keluar.
              </p>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
              <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                3
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                <strong>Konsistensi Hak Akses:</strong> Mencegah perbedaan penamaan seksi antar modul sistem.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-white/5">
            <a
              href="/manajemen-pengguna"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group"
            >
              <span>Buka Manajemen Pengguna</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* Integration Status Card */}
        <div className="p-5 bg-gradient-to-br from-amber-900/[0.03] to-slate-50 dark:from-amber-950/20 dark:to-transparent border border-amber-500/20 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Status Sinkronisasi Sistem
            </span>
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#181b22] border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Database Unit Kerja Aktif & Tersinkronisasi
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Perubahan nama atau penambahan unit kerja di halaman ini akan langsung berdampak pada opsi registrasi surat keluar dan pilihan bidang pengguna.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
