import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  X,
  Loader2,
  Edit2,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Check,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { apiClient, type MasterOptionRaw } from "@/lib/api-client";
import { COLOR_SWATCHES, COLOR_MAP, BADGE_COLOR_MAP } from "@/lib/constants";
import { m, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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
  total: number;
  onEdit: (o: MasterOption) => void;
  onDelete: (id: string) => void;
  badgeLabel?: string;
  isDraggable: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent, idx: number) => void;
  onDragOver: (e: React.DragEvent, idx: number) => void;
  onDragEnter: (e: React.DragEvent, idx: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, idx: number) => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
}

function OptionCard({
  option,
  index,
  total,
  onEdit,
  onDelete,
  badgeLabel,
  isDraggable,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDragEnd,
  onDrop,
  onMoveUp,
  onMoveDown,
}: OptionCardProps) {
  const badgeStyle =
    BADGE_COLOR_MAP[option.warna] ||
    "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";

  return (
    <div
      draggable={isDraggable}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnter={(e) => onDragEnter(e, index)}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, index)}
      className={`relative flex items-center justify-between gap-3 px-3.5 sm:px-4 py-3 bg-white dark:bg-[#181b22] border rounded-2xl transition-all duration-200 group select-none ${
        isDragging
          ? "opacity-40 scale-[0.98] border-dashed border-emerald-500 bg-emerald-50/40 dark:bg-emerald-500/10 shadow-inner"
          : isDragOver
          ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/25 dark:bg-emerald-500/5 shadow-md -translate-y-0.5"
          : "border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 hover:shadow-xs"
      }`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        {/* Grip Handle & Quick Move Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <div
            className={`p-1 rounded-lg transition-colors ${
              isDraggable
                ? "cursor-grab active:cursor-grabbing text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-white/10"
                : "text-slate-300 dark:text-slate-600 opacity-40 cursor-not-allowed"
            }`}
            title={isDraggable ? "Tahan & geser untuk mengubah urutan" : undefined}
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Up & Down arrow buttons for instant 1-click reorder */}
          {isDraggable && (
            <div className="flex flex-col -space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => onMoveUp(index)}
                className="p-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                title="Pindah ke atas"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                disabled={index === total - 1}
                onClick={() => onMoveDown(index)}
                className="p-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                title="Pindah ke bawah"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Index Number Badge */}
        <span className="flex items-center justify-center w-5 h-5 rounded-md bg-slate-100 dark:bg-white/5 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 shrink-0">
          {index + 1}
        </span>

        {/* Color Indicator Dot */}
        <div className="relative shrink-0 flex items-center justify-center">
          <div
            className={`h-3 w-3 rounded-full ${COLOR_MAP[option.warna] || "bg-slate-400"} shadow-xs`}
          />
          <div
            className={`absolute inset-0 rounded-full ${COLOR_MAP[option.warna] || "bg-slate-400"} opacity-30 animate-ping`}
            style={{ animationDuration: "3s" }}
          />
        </div>

        {/* Option Name & Category Badge */}
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

      {/* Action Buttons: Pensil (Amber) & Hapus (Rose) langsung berwarna dan tegas */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(option)}
          className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/20 hover:scale-105 active:scale-95 transition-all shadow-2xs cursor-pointer"
          title="Edit opsi ini"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(option.id)}
          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:scale-105 active:scale-95 transition-all shadow-2xs cursor-pointer"
          title="Hapus opsi ini"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export interface MasterSectionCardProps {
  kategori: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent?: "emerald" | "sky" | "amber" | "violet";
  infoNote?: string;
  badgeLabel?: string;
}

export function MasterSectionCard({
  kategori,
  title,
  subtitle,
  icon: Icon,
  accent = "emerald",
  infoNote,
  badgeLabel,
}: MasterSectionCardProps) {
  const [items, setItems] = useState<MasterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterOption | null>(null);
  const [label, setLabel] = useState("");
  const [warna, setWarna] = useState("emerald");
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Reorder & Drag state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await apiClient.masterOptions.list();
      if (res.success) {
        const rawData = (res.data ?? []) as MasterOptionRaw[];
        const mapped: MasterOption[] = rawData
          .filter(
            (item) =>
              item.category === kategori ||
              (kategori === "agenda" &&
                (item.category === "agenda" ||
                  item.category === "agenda_masuk" ||
                  item.category === "agenda_keluar"))
          )
          .map((item) => ({
            id: String(item.id),
            kategori: item.category,
            label: item.name,
            warna: item.badge_color || "emerald",
            sortOrder: item.sort_order || 0,
            isActive: item.is_active ?? true,
          }));
        setItems(mapped);
      }
    } catch (e: unknown) {
      console.error("Gagal memuat opsi:", e);
    } finally {
      setLoading(false);
    }
  }, [kategori]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isFiltering = search.trim().length > 0;

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
          sort_order: editingItem.sortOrder,
        });
        if (res.success) {
          toast.success(res.message || "Opsi berhasil diperbarui");
          setShowForm(false);
          loadData();
        } else {
          toast.error(res.error || "Gagal memperbarui opsi");
        }
      } else {
        const res = await apiClient.masterOptions.create({
          category: kategori,
          name: label.trim(),
          badge_color: warna,
          sort_order: items.length + 1,
        });
        if (res.success) {
          toast.success(res.message || "Opsi berhasil ditambahkan");
          setShowForm(false);
          loadData();
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
        loadData();
      } else {
        toast.error(res.error || "Gagal menghapus opsi");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  // Drag and drop reordering handlers
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDragEnter = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const persistNewOrder = async (newItems: MasterOption[]) => {
    setIsSavingOrder(true);
    try {
      const payload = newItems.map((item, idx) => ({
        id: item.id,
        sort_order: idx + 1,
      }));
      const res = await apiClient.masterOptions.reorder(payload);
      if (res.success) {
        toast.success("Urutan berhasil diperbarui", { duration: 1500 });
      } else {
        toast.error(res.error || "Gagal memperbarui urutan");
        loadData();
      }
    } catch {
      toast.error("Gagal memperbarui urutan");
      loadData();
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    const updated = [...items];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, moved);

    const reindexed = updated.map((item, idx) => ({
      ...item,
      sortOrder: idx + 1,
    }));

    setItems(reindexed);
    setDraggedIdx(null);
    setDragOverIdx(null);
    persistNewOrder(reindexed);
  };

  const handleMoveItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);

    const reindexed = updated.map((item, idx) => ({
      ...item,
      sortOrder: idx + 1,
    }));

    setItems(reindexed);
    persistNewOrder(reindexed);
  };

  const accentStyles = {
    emerald: {
      badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-500/20",
      btn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
      counter: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/20",
    },
    sky: {
      badge: "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200/80 dark:border-sky-500/20",
      btn: "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20",
      counter: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-500/20",
    },
    amber: {
      badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-500/20",
      btn: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
      counter: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-500/20",
    },
    violet: {
      badge: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200/80 dark:border-violet-500/20",
      btn: "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20",
      counter: "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200/60 dark:border-violet-500/20",
    },
  }[accent];

  return (
    <FramerProvider>
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
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                    {title}
                  </h3>
                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${accentStyles.counter}`}
                  >
                    {items.length} Opsi
                  </span>
                  {isSavingOrder && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" /> Menyimpan urutan...
                    </span>
                  )}
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Card Body - List of Options */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col">
          {loading ? (
            <div className="py-12 text-center flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center flex-1 flex flex-col items-center justify-center">
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
                  total={filteredItems.length}
                  onEdit={openEdit}
                  onDelete={(id) => {
                    setDeletingId(id);
                    setShowDeleteConfirm(true);
                  }}
                  badgeLabel={badgeLabel}
                  isDraggable={!isFiltering}
                  isDragging={draggedIdx === idx}
                  isDragOver={dragOverIdx === idx && draggedIdx !== idx}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  onMoveUp={(i) => handleMoveItem(i, i - 1)}
                  onMoveDown={(i) => handleMoveItem(i, i + 1)}
                />
              ))}
            </div>
          )}

          {/* Info Note footer if provided */}
          {infoNote && (
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-start gap-2.5">
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
                      Pratinjau Tampilan
                    </p>
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-3 w-3 rounded-full ${COLOR_MAP[warna]} shadow-xs`}
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {label.trim() || "Nama opsi..."}
                      </span>
                      {badgeLabel && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            BADGE_COLOR_MAP[warna] || ""
                          }`}
                        >
                          {badgeLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02]">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || !label.trim()}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer ${accentStyles.btn}`}
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingItem ? "Simpan Perubahan" : "Tambahkan Opsi"}</span>
                  </button>
                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Alert */}
        <AlertDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Hapus Opsi Master?"
          description="Opsi yang dihapus tidak akan muncul lagi pada formulir naskah baru. Data persuratan lama yang sudah menggunakan opsi ini tetap aman."
          confirmLabel="Ya, Hapus Opsi"
          cancelLabel="Batal"
          variant="danger"
          loading={submitting}
          onConfirm={handleDelete}
        />
      </div>
    </FramerProvider>
  );
}
