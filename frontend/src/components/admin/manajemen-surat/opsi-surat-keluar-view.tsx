import { Tag, Sparkles, ShieldCheck, Send } from "lucide-react";
import { MasterSectionCard } from "./master-section-card";

export function OpsiSuratKeluarView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Kolom Kiri: Kartu Kelola Agenda Surat Keluar */}
      <div className="lg:col-span-7">
        <MasterSectionCard
          kategori="agenda_keluar"
          title="Jenis Agenda Surat Keluar"
          subtitle="Klasifikasi penomoran naskah dinas keluar Kemenag Barito Utara"
          icon={Tag}
          accent="sky"
          badgeLabel="Naskah Keluar"
          infoNote="Opsi agenda ini digunakan saat meregistrasikan penomoran surat keluar (Surat Tugas, Surat Keputusan, Nota Dinas, dll.)."
        />
      </div>

      {/* Kolom Kanan: Panduan & Pratinjau Form */}
      <div className="lg:col-span-5 space-y-4">
        {/* Guideline Card */}
        <div className="p-5 bg-white dark:bg-[#1a1d24] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Integrasi Penomoran Surat Keluar
              </h4>
              <p className="text-[11px] text-slate-400">
                Penerapan opsi agenda pada registrasi nomor naskah keluar
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Setiap nomor surat keluar diklasifikasikan berdasarkan <strong>Jenis Agenda</strong> untuk menjamin tata naskah dinas Kemenag Barito Utara tertib dan terarsip dengan baik.
          </p>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
              <div className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                1
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                <strong>Form Penomoran:</strong> Petugas memilih jenis agenda saat membuat draf registrasi nomor surat keluar.
              </p>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
              <div className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                2
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                <strong>Format Kode Surat:</strong> Membantu penentuan kode klasifikasi tata naskah dinas resmi Kemenag.
              </p>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
              <div className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                3
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                <strong>Filter & Pencarian:</strong> Admin dapat memfilter buku agenda keluar berdasarkan jenis naskah secara akurat.
              </p>
            </div>
          </div>
        </div>

        {/* Simulated Preview Card */}
        <div className="p-5 bg-gradient-to-br from-sky-900/[0.03] to-slate-50 dark:from-sky-950/20 dark:to-transparent border border-sky-500/20 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-700 dark:text-sky-400">
              Contoh Tampilan Pada Surat Keluar
            </span>
            <Send className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#181b22] border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-500/20">
                B-320/Kk.17.05/1/KP.01.1/03/2026
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-200">
                Surat Tugas
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Tujuan: Seluruh Kepala KUA Kecamatan se-Kabupaten Barito Utara
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
              Tugas Koordinasi Penguatan Layanan KUA Ramah Umat Tahun 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
