import { Bookmark, Sparkles, ShieldCheck } from "lucide-react";
import { MasterSectionCard } from "./master-section-card";

export function AgendaSuratView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Kolom Kiri: Kartu Kelola Agenda Surat Terpadu */}
      <div className="lg:col-span-7">
        <MasterSectionCard
          kategori="agenda"
          title="Jenis Agenda Surat"
          subtitle="Klasifikasi jenis naskah dinas resmi pada tata persuratan"
          icon={Bookmark}
          accent="emerald"
          badgeLabel="Agenda Resmi"
          infoNote="Opsi jenis agenda di atas digunakan untuk klasifikasi naskah dinas resmi di lingkungan Kantor Kementerian Agama Kabupaten Barito Utara."
        />
      </div>

      {/* Kolom Kanan: Panduan & Pratinjau Form */}
      <div className="lg:col-span-5 space-y-4">
        {/* Guideline Card */}
        <div className="p-5 bg-white dark:bg-[#1a1d24] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Standarisasi Agenda Surat
              </h4>
              <p className="text-[11px] text-slate-400">
                Penerapan klasifikasi naskah dinas terpadu
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Opsi <strong>Jenis Agenda</strong> digunakan untuk mengelompokkan naskah dinas resmi berdasarkan peraturan tata persuratan yang berlaku (KMA No. 32 Tahun 2024).
          </p>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                1
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                <strong>Klasifikasi Resmi:</strong> Membedakan jenis naskah seperti Surat Dinas, Surat Keputusan (SK), Surat Undangan, Surat Tugas, dan lainnya.
              </p>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                2
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                <strong>Drag & Drop Urutan:</strong> Urutan tampilan dapat diubah dengan menyeret ikon grip titik enam dan otomatis tersimpan ke sistem.
              </p>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                3
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                <strong>Laporan & Rekapitulasi:</strong> Mempermudah filter dan pembukuan agenda tahunan saat diekspor ke Excel dan PDF.
              </p>
            </div>
          </div>
        </div>

        {/* Simulated Preview Card */}
        <div className="p-5 bg-gradient-to-br from-emerald-900/[0.03] to-slate-50 dark:from-emerald-950/20 dark:to-transparent border border-emerald-500/20 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Contoh Klasifikasi Agenda
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#181b22] border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                B-105/Kk.17.05/1/BA.01/01/2026
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                Surat Dinas
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Kementerian Agama Kabupaten Barito Utara
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
              Petunjuk Teknis Tata Naskah Dinas Elektronik
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgendaSuratView;
