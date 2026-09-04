import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  X,
  Loader2,
  Edit2,
  Trash2,
  GripVertical,
  Check,
  Inbox,
  Send,
  Building2,
  Tag,
  Search,
  Sparkles,
  Columns2,
  FileText,
  HelpCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { apiClient, type MasterOptionRaw } from "@/lib/api-client";
import { COLOR_SWATCHES, COLOR_MAP, BADGE_COLOR_MAP } from "@/lib/constants";
import { m, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { FramerProvider } from "@/components/providers/framer-provider";

export interface MasterOption {
  id: string;
  kategori: string;
  label: string;
  warna: string;
  sortOrder: number;
  isActive: boolean;
}

interface OptionCardProps {
  option: MasterOption;
  index: number;
  onEdit: (o: MasterOption) => void;
  onDelete: (id: string) => void;
  badgeLabel?: string;
}

function OptionCard({
  option,
  index,
  onEdit,
  onDelete,
  badgeLabel,
}: OptionCardProps) {
  const badgeStyle =
    BADGE_COLOR_MAP[option.warna] ||
    "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";

  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white dark:bg-[#181b22] border border-slate-200/80 dark:border-white/5 rounded-2xl hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:shadow-xs transition-all group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <GripVertical className="h-4 w-4 text-slate-300 dark:text-slate-600 cursor-grab shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
        
        <span className="flex items-center justify-center w-5 h-5 rounded-md bg-slate-100 dark:bg-white/5 text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 shrink-0">
          {index + 1}
        </span>

        <div className="relative shrink-0 flex items-center justify-center">
          <div
            className={`h-3 w-3 rounded-full ${COLOR_MAP[option.warna] || "bg-slate-400"} shadow-xs`}
          />
          <div
            className={`absolute inset-0 rounded-full ${COLOR_MAP[option.warna] || "bg-slate-400"} opacity-30 animate-ping`}
            style={{ animationDuration: "3s" }}
          />
        </div>

        <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
            {option.label}
          </span>
          {badgeLabel && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle} shrink-0`}
            >
              {badgeLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onEdit(option)}
          className="p-1.5 sm:p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/20 hover:scale-105 active:scale-95 transition-all shadow-2xs cursor-pointer"
          title="Edit opsi ini"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(option.id)}
          className="p-1.5 sm:p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:scale-105 active:scale-95 transition-all shadow-2xs cursor-pointer"
          title="Hapus opsi ini"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

interface MasterSectionCardProps {
  kategori: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  items: MasterOption[];
  onRefresh: () => void;
  accent?: "emerald" | "sky" | "amber" | "violet";
  infoNote?: string;
  badgeLabel?: string;
}

function MasterSectionCard({
  kategori,
  title,
  subtitle,
  icon: Icon,
  items,
  onRefresh,
  accent = "emerald",
  infoNote,
  badgeLabel,
}: MasterSectionCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterOption | null>(null);
  const [label, setLabel] = useState("");
  const [warna, setWarna] = useState("emerald");
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, search]);

  const openAdd = () => {
    setEditingItem(null);
    setLabel("");
    setWarna(COLOR_SWATCHES[items.length % COLOR_SWATCHES.length]);
    setShowForm(true);
  };

  const openEdit = (item: MasterOption) => {
    setEditingItem(item);
    setLabel(item.label);
    setWarna(item.warna);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!label.trim()) return;
    setSubmitting(true);
    try {
      if (editingItem) {
        const res = await apiClient.masterOptions.update(editingItem.id, {
          category: editingItem.kategori,
          name: label.trim(),
          badge_color: warna,
        });
        if (res.success) {
          toast.success(res.message || "Opsi berhasil diperbarui");
          setShowForm(false);
          onRefresh();
        } else {
          toast.error(res.error || "Gagal memperbarui opsi");
        }
      } else {
        const res = await apiClient.masterOptions.create({
          category: kategori,
          name: label.trim(),
          badge_color: warna,
        });
        if (res.success) {
          toast.success(res.message || "Opsi berhasil ditambahkan");
          setShowForm(false);
          onRefresh();
        } else {
          toast.error(res.error || "Gagal menambahkan opsi");
        }
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSubmitting(true);
    try {
      const res = await apiClient.masterOptions.delete(deletingId);
      if (res.success) {
        toast.success(res.message || "Opsi berhasil dihapus");
        setShowDeleteConfirm(false);
        setDeletingId(null);
        onRefresh();
      } else {
        toast.error(res.error || "Gagal menghapus opsi");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const accentStyles = {
    emerald: {
      badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-500/20",
      btn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
      counter: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/20",
      borderGlow: "group-hover:border-emerald-500/30",
    },
    sky: {
      badge: "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200/80 dark:border-sky-500/20",
      btn: "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20",
      counter: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-500/20",
      borderGlow: "group-hover:border-sky-500/30",
    },
    amber: {
      badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-500/20",
      btn: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
      counter: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-500/20",
      borderGlow: "group-hover:border-amber-500/30",
    },
    violet: {
      badge: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200/80 dark:border-violet-500/20",
      btn: "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20",
      counter: "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200/60 dark:border-violet-500/20",
      borderGlow: "group-hover:border-violet-500/30",
    },
  }[accent];

  return (
    <div className="bg-white dark:bg-[#1a1d24] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${accentStyles.badge}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {title}
                </h3>
                <span
                  className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${accentStyles.counter}`}
                >
                  {items.length} Opsi
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={openAdd}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 shrink-0 cursor-pointer ${accentStyles.btn}`}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </div>

        {/* Search Input Bar */}
        {items.length > 3 && (
          <div className="relative mt-3.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Cari opsi ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-emerald-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Card Body - List of Options */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {filteredItems.length === 0 ? (
          <div className="py-10 text-center flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mb-2">
              <Icon className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {search ? "Tidak ada opsi yang cocok" : "Belum ada opsi ditambahkan"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {search
                ? `Coba kata kunci lain untuk ${title.toLowerCase()}`
                : `Klik tombol "+ Tambah" di atas untuk menambahkan ${title.toLowerCase()}`}
            </p>
          </div>
        ) : (
          <div className="space-y-2 flex-1">
            {filteredItems.map((item, idx) => (
              <OptionCard
                key={item.id}
                option={item}
                index={idx}
                onEdit={openEdit}
                onDelete={(id) => {
                  setDeletingId(id);
                  setShowDeleteConfirm(true);
                }}
                badgeLabel={badgeLabel}
              />
            ))}
          </div>
        )}

        {/* Info Note footer if provided */}
        {infoNote && (
          <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              {infoNote}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          >
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-white dark:bg-[#1a1d24] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center border ${accentStyles.badge}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {editingItem ? "Edit" : "Tambah"} {title}
                  </h2>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block ml-1">
                    Label / Nama Opsi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                    placeholder={`Contoh nama ${title.toLowerCase()}...`}
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block ml-1">
                    Warna Indikator & Badge
                  </label>
                  <div className="flex flex-wrap gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5">
                    {COLOR_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setWarna(c)}
                        className={`h-7 w-7 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                          COLOR_MAP[c]
                        } ${
                          warna === c
                            ? "ring-2 ring-offset-2 ring-emerald-500 dark:ring-offset-[#1a1d24] scale-110 shadow-sm"
                            : "hover:scale-110 opacity-80 hover:opacity-100"
                        }`}
                        title={c}
                      >
                        {warna === c && (
                          <Check className="h-3.5 w-3.5 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Pratinjau Tampilan Badge:
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        BADGE_COLOR_MAP[warna] ||
                        "bg-emerald-50 text-emerald-600 border-emerald-200"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${COLOR_MAP[warna] || "bg-emerald-500"}`}
                      />
                      {label.trim() || "Nama Opsi"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02]">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !label.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                >
                  {submitting && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {editingItem ? "Simpan Perubahan" : "Simpan Opsi"}
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(v) => {
          setShowDeleteConfirm(v);
          if (!v) setDeletingId(null);
        }}
        title="Hapus opsi ini?"
        description="Data opsi ini akan dihapus dari sistem. Surat yang sudah menggunakan opsi ini akan tetap mempertahankan riwayat datanya."
        variant="danger"
        confirmLabel="Hapus Opsi"
        loading={submitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export function ManajemenSuratManager() {
  const [activeTab, setActiveTab] = useState<"surat-masuk" | "surat-keluar" | "split">(
    "surat-masuk",
  );
  const [agendaItems, setAgendaItems] = useState<MasterOption[]>([]);
  const [unitKerjaItems, setUnitKerjaItems] = useState<MasterOption[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await apiClient.masterOptions.list();
      if (res.success) {
        const rawData = (res.data ?? []) as MasterOptionRaw[];
        const mapped: MasterOption[] = rawData.map((item) => ({
          id: String(item.id),
          kategori: item.category,
          label: item.name,
          warna: item.badge_color || "emerald",
          sortOrder: item.sort_order || 0,
          isActive: item.is_active ?? true,
        }));
        setAgendaItems(mapped.filter((item) => item.kategori === "agenda"));
        setUnitKerjaItems(mapped.filter((item) => item.kategori === "unit_kerja"));
      }
    } catch (e: unknown) {
      console.error("Gagal memuat master options:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <FramerProvider>
      <div className="space-y-6">
        {/* Top Navigation & Quick Summary Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Segmented Tab Switcher */}
          <div className="inline-flex p-1.5 bg-slate-100/90 dark:bg-[#14161d] border border-slate-200/80 dark:border-white/10 rounded-2xl w-fit shadow-2xs">
            <button
              onClick={() => setActiveTab("surat-masuk")}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "surat-masuk"
                  ? "bg-white dark:bg-[#1e222d] text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200/60 dark:border-white/10"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5"
              }`}
            >
              <Inbox className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Surat Masuk</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100/70 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                {agendaItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("surat-keluar")}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "surat-keluar"
                  ? "bg-white dark:bg-[#1e222d] text-sky-700 dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-white/10"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5"
              }`}
            >
              <Send className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Surat Keluar</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100/70 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold">
                {agendaItems.length + unitKerjaItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("split")}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "split"
                  ? "bg-white dark:bg-[#1e222d] text-violet-700 dark:text-violet-400 shadow-sm border border-slate-200/60 dark:border-white/10"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5"
              }`}
            >
              <Columns2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span>Bagi 2 (Dua Kolom)</span>
            </button>
          </div>

          {/* Stat Indicators */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a1d24] border border-slate-200/80 dark:border-white/10 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Agenda Masuk: <span className="text-slate-900 dark:text-white font-extrabold">{agendaItems.length}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a1d24] border border-slate-200/80 dark:border-white/10 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Agenda Keluar: <span className="text-slate-900 dark:text-white font-extrabold">{agendaItems.length}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a1d24] border border-slate-200/80 dark:border-white/10 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Unit Kerja: <span className="text-slate-900 dark:text-white font-extrabold">{unitKerjaItems.length}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-24 bg-white dark:bg-[#1a1d24] border border-slate-200/80 dark:border-white/10 rounded-3xl">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-xs font-bold text-slate-500">Memuat opsi persuratan...</p>
            </div>
          </div>
        ) : (
          <div>
            {/* VIEW 1: SURAT MASUK */}
            {activeTab === "surat-masuk" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Agenda Surat Masuk Card */}
                <div className="lg:col-span-7">
                  <MasterSectionCard
                    kategori="agenda"
                    title="Jenis Agenda Surat Masuk"
                    subtitle="Pilihan klasifikasi naskah yang muncul pada form input surat masuk"
                    icon={Inbox}
                    accent="emerald"
                    items={agendaItems}
                    onRefresh={reload}
                    badgeLabel="Naskah Masuk"
                    infoNote="Setiap opsi agenda di atas dapat dipilih langsung saat staf mencatat naskah dinas masuk baru di formulir Surat Masuk."
                  />
                </div>

                {/* Right: Panduan & Pratinjau Form Card */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Guideline Card */}
                  <div className="p-5 bg-white dark:bg-[#1a1d24] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 shrink-0">
                        <Sparkles className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Integrasi Form Surat Masuk
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Panduan penerapan opsi pada operasional naskah masuk
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      Opsi <strong>Jenis Agenda</strong> di sebelah kiri digunakan sebagai klasifikasi kategori surat yang diterima dari pihak eksternal (Kanwil, Pemda, Madrasah, KUA, dll.).
                    </p>

                    <div className="space-y-2 pt-1">
                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          1
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                          <strong>Formulir Registrasi:</strong> Pilihan agenda langsung muncul di dropdown input surat masuk.
                        </p>
                      </div>

                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          2
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                          <strong>Lembar Disposisi:</strong> Agenda tercetak rapi pada lembar disposisi resmi untuk arahan pimpinan.
                        </p>
                      </div>

                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          3
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                          <strong>Ekspor Buku Agenda:</strong> Kolom klasifikasi agenda otomatis disertakan pada ekspor Excel & PDF.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Preview Card */}
                  <div className="p-5 bg-gradient-to-br from-emerald-900/[0.03] to-slate-50 dark:from-emerald-950/20 dark:to-transparent border border-emerald-500/20 rounded-3xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                        Contoh Tampilan Naskah Masuk
                      </span>
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#181b22] border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                          B-105/Kw.19.01/1/2026
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                          Surat Dinas
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Kanwil Kementerian Agama Prov. Kalteng
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        Penyampaian Petunjuk Teknis Tata Naskah Dinas Elektronik
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: SURAT KELUAR */}
            {activeTab === "surat-keluar" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <MasterSectionCard
                  kategori="agenda"
                  title="Jenis Agenda Surat Keluar"
                  subtitle="Klasifikasi penomoran naskah dinas keluar Kemenag Barito Utara"
                  icon={Tag}
                  accent="sky"
                  items={agendaItems}
                  onRefresh={reload}
                  badgeLabel="Naskah Keluar"
                  infoNote="Opsi agenda ini digunakan saat meregistrasikan penomoran surat keluar (Surat Tugas, Surat Keputusan, Nota Dinas, dll.)."
                />

                <MasterSectionCard
                  kategori="unit_kerja"
                  title="Unit Kerja / Seksi Penerbit"
                  subtitle="Daftar seksi atau penyelenggara di lingkungan Kemenag Barito Utara"
                  icon={Building2}
                  accent="amber"
                  items={unitKerjaItems}
                  onRefresh={reload}
                  badgeLabel="Seksi / Bidang"
                  infoNote="Penting: Daftar Unit Kerja di atas juga otomatis terintegrasi sebagai pilihan bidang saat Super Admin mengelola Admin Bidang di Manajemen Pengguna."
                />
              </div>
            )}

            {/* VIEW 3: DUA KOLOM (BAGI 2 / SPLIT VIEW) */}
            {activeTab === "split" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Panel Kiri: Surat Masuk */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 w-fit">
                    <Inbox className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Seksi Opsi Surat Masuk
                    </span>
                  </div>

                  <MasterSectionCard
                    kategori="agenda"
                    title="Jenis Agenda Surat Masuk"
                    subtitle="Klasifikasi naskah masuk yang tercatat pada buku register"
                    icon={Inbox}
                    accent="emerald"
                    items={agendaItems}
                    onRefresh={reload}
                    badgeLabel="Masuk"
                  />
                </div>

                {/* Panel Kanan: Surat Keluar */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-sky-50/80 dark:bg-sky-500/10 border border-sky-200/80 dark:border-sky-500/20 text-sky-800 dark:text-sky-300 w-fit">
                    <Send className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Seksi Opsi Surat Keluar
                    </span>
                  </div>

                  <MasterSectionCard
                    kategori="agenda"
                    title="Jenis Agenda Surat Keluar"
                    subtitle="Klasifikasi jenis naskah penomoran keluar"
                    icon={Tag}
                    accent="sky"
                    items={agendaItems}
                    onRefresh={reload}
                    badgeLabel="Keluar"
                  />

                  <MasterSectionCard
                    kategori="unit_kerja"
                    title="Unit Kerja / Seksi Penerbit"
                    subtitle="Pilihan seksi penomoran & Manajemen Pengguna"
                    icon={Building2}
                    accent="amber"
                    items={unitKerjaItems}
                    onRefresh={reload}
                    badgeLabel="Unit Kerja"
                    infoNote="Terhubung langsung dengan Manajemen Pengguna untuk pemilihan bidang akun Admin."
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </FramerProvider>
  );
}
