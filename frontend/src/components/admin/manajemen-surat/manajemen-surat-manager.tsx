import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  Loader2,
  Edit2,
  Trash2,
  GripVertical,
  Check,
} from "lucide-react";
import { apiClient, type MasterOptionRaw } from "@/lib/api-client";
import { COLOR_SWATCHES, COLOR_MAP } from "@/lib/constants";
import { m, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { FramerProvider } from "@/components/providers/framer-provider";

interface MasterOption {
  id: string;
  kategori: string;
  label: string;
  warna: string;
  sortOrder: number;
  isActive: boolean;
}

function OptionCard({
  option,
  onEdit,
  onDelete,
}: {
  option: MasterOption;
  onEdit: (o: MasterOption) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#1a1d24] border border-slate-100 dark:border-white/5 rounded-xl hover:border-slate-200 dark:hover:border-white/10 transition-all group">
      <GripVertical className="h-4 w-4 text-slate-300 dark:text-slate-600 cursor-grab shrink-0" />
      <div
        className={`h-3 w-3 rounded-full shrink-0 ${COLOR_MAP[option.warna] || "bg-slate-400"}`}
      />
      <span className="flex-1 text-xs font-bold text-slate-800 dark:text-slate-200">
        {option.label}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(option)}
          className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
          title="Edit"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(option.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-all"
          title="Hapus"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function MasterList({
  kategori,
  title,
  items,
  onRefresh,
}: {
  kategori: string;
  title: string;
  items: MasterOption[];
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterOption | null>(null);
  const [label, setLabel] = useState("");
  const [warna, setWarna] = useState("emerald");
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
          toast.success(res.message || "Berhasil diperbarui");
          setShowForm(false);
          onRefresh();
        } else {
          toast.error(res.error || "Gagal");
        }
      } else {
        const res = await apiClient.masterOptions.create({
          category: kategori,
          name: label.trim(),
          badge_color: warna,
        });
        if (res.success) {
          toast.success(res.message || "Berhasil ditambahkan");
          setShowForm(false);
          onRefresh();
        } else {
          toast.error(res.error || "Gagal");
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
        toast.success(res.message || "Berhasil dihapus");
        setShowDeleteConfirm(false);
        setDeletingId(null);
        onRefresh();
      } else {
        toast.error(res.error || "Gagal");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h3>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Tambah
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            Belum ada data
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <OptionCard
              key={item.id}
              option={item}
              onEdit={openEdit}
              onDelete={(id) => {
                setDeletingId(id);
                setShowDeleteConfirm(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40"
          >
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white dark:bg-[#1a1d24] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingItem ? "Edit" : "Tambah"} {title.slice(0, -1)}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Label
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    placeholder="Nama opsi..."
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Warna
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setWarna(c)}
                        className={`h-7 w-7 rounded-lg transition-all ${
                          COLOR_MAP[c]
                        } ${
                          warna === c
                            ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                            : "hover:scale-110"
                        }`}
                      >
                        {warna === c && (
                          <Check className="h-3.5 w-3.5 text-white mx-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !label.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
                >
                  {submitting && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {editingItem ? "Simpan" : "Tambah"}
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
        description="Data yang dihapus tidak dapat dikembalikan."
        variant="danger"
        confirmLabel="Hapus"
        loading={submitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export function ManajemenSuratManager() {
  const [activeTab, setActiveTab] = useState<"surat-masuk" | "surat-keluar">(
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
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      const res = await apiClient.masterOptions.list();
      if (ignore) return;
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
      setLoading(false);
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const tabs = [
    { key: "surat-masuk" as const, label: "Surat Masuk" },
    { key: "surat-keluar" as const, label: "Surat Keluar" },
  ];

  return (
    <FramerProvider>
      <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-white/10 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.key
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeTab === "surat-masuk" && (
            <>
              <div className="col-span-1 lg:col-span-2">
                <MasterList
                  kategori="agenda"
                  title="Jenis Agenda"
                  items={agendaItems}
                  onRefresh={reload}
                />
              </div>
            </>
          )}

          {activeTab === "surat-keluar" && (
            <>
              <MasterList
                kategori="agenda"
                title="Jenis Agenda"
                items={agendaItems}
                onRefresh={reload}
              />
              <MasterList
                kategori="unit_kerja"
                title="Unit Kerja"
                items={unitKerjaItems}
                onRefresh={reload}
              />
            </>
          )}
        </div>
      )}
    </div>
    </FramerProvider>
  );
}

export type { MasterOption };
