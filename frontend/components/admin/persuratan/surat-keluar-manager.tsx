"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Filter,
  Eye,
  Trash2,
  Upload,
  X,
  Loader2,
  FileText,
  FileSpreadsheet,
  SquarePen,
  Paperclip,
  FileOutput,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Archive,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";
import { ModernSelect } from "@/components/ui/modern-select";
import { m, AnimatePresence } from "framer-motion";
import { toTitleCase } from "@/lib/utils";
import { toast } from "sonner";
import { STATUS_OPTIONS } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/badge";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { PdfViewerModal } from "./pdf-viewer-modal";

import { BADGE_COLOR_MAP } from "@/lib/constants";

const getPaginationRange = (current: number, total: number) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

export interface SuratKeluar {
  id: string;
  nomor_surat: string;
  tanggal_surat: string;
  tujuan_surat: string;
  perihal: string;
  unit_kerja: string;
  agenda: string;
  status?: string;
  lampiran?: string;
}

export function SuratKeluarManager({
  initialData = [],
  initialAgendaOptions = [],
  initialUnitKerjaOptions = [],
  agendaColors = {},
  unitKerjaColors = {},
}: {
  initialData?: SuratKeluar[];
  initialTotal?: number;
  initialAgendaOptions?: string[];
  initialUnitKerjaOptions?: string[];
  agendaColors?: Record<string, string>;
  unitKerjaColors?: Record<string, string>;
}) {
  const [items, setItems] = useState<SuratKeluar[]>(initialData);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [pdfViewerTitle, setPdfViewerTitle] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let ignore = false;
    async function loadFreshData() {
      try {
        const res = await apiClient.suratKeluar.list(1, 5000);
        if (ignore) return;
        if (res.success && Array.isArray(res.data)) {
          setItems(res.data as SuratKeluar[]);
        }
      } catch (e) {
        console.error("Failed to load fresh surat keluar:", e);
      }
    }
    loadFreshData();
    return () => {
      ignore = true;
    };
  }, []);

  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAgenda, setFilterAgenda] = useState("");
  const [filterUnitKerja, setFilterUnitKerja] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<SuratKeluar | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    nomor_surat: "",
    tanggal_surat: "",
    tujuan_surat: "",
    perihal: "",
    unit_kerja: initialUnitKerjaOptions[0] || "",
    agenda: initialAgendaOptions[0] || "",
    status: "published",
    lampiran: "",
  });
  const [lampiranFile, setLampiranFile] = useState<File | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [initialFormJson, setInitialFormJson] = useState("");
  const [deletingLampiran, setDeletingLampiran] = useState(false);
  const [showDeleteLampiranConfirm, setShowDeleteLampiranConfirm] = useState(false);

  const confirmDeleteLampiran = () => {
    if (!editingId || !formData.lampiran) return;
    setShowDeleteLampiranConfirm(true);
  };

  const handleDeleteLampiran = async () => {
    if (!editingId || !formData.lampiran) return;

    setDeletingLampiran(true);
    try {
      const res = await apiClient.lampiran.delete(editingId, "keluar");
      if (res.success) {
        toast.success("File lampiran berhasil dihapus dari sistem");
        setFormData((prev) => ({ ...prev, lampiran: "" }));
        setItems((prev) =>
          prev.map((it) => (it.id === editingId ? { ...it, lampiran: "" } : it))
        );
        setShowDeleteLampiranConfirm(false);
      } else {
        toast.error(res.error || "Gagal menghapus lampiran");
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan saat menghapus lampiran");
    } finally {
      setDeletingLampiran(false);
    }
  };

  const isFormDirty = useMemo(() => {
    if (!showForm) return false;
    return JSON.stringify(formData) !== initialFormJson;
  }, [formData, showForm, initialFormJson]);

  useEffect(() => {
    if (!showForm || !isFormDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [showForm, isFormDirty]);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await apiClient.suratKeluar.list(1, 10000);
      if (res.success) {
        setItems((res.data ?? []) as SuratKeluar[]);
      } else {
        setFetchError(res.error || "Gagal memuat data");
      }
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = items;

    if (debouncedSearch.trim()) {
      const keywords = debouncedSearch.toLowerCase().trim().split(/\s+/);
      result = result.filter((item) => {
        const fullText = `${item.nomor_surat} ${item.tujuan_surat} ${item.perihal} ${item.agenda} ${item.unit_kerja}`.toLowerCase();
        return keywords.every((kw) => fullText.includes(kw));
      });
    }

    if (filterStartDate) {
      const startDate = new Date(filterStartDate);
      startDate.setHours(0, 0, 0, 0);
      result = result.filter((item) => new Date(item.tanggal_surat) >= startDate);
    }
    if (filterEndDate) {
      const endDate = new Date(filterEndDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter((item) => new Date(item.tanggal_surat) <= endDate);
    }
    if (filterStatus) {
      result = result.filter((item) => item.status === filterStatus);
    }
    if (filterAgenda) {
      result = result.filter((item) => item.agenda === filterAgenda);
    }
    if (filterUnitKerja) {
      result = result.filter((item) => item.unit_kerja === filterUnitKerja);
    }

    // Ensure primary ordering by tanggal_surat DESC (newest letter date first)
    return [...result].sort((a, b) => {
      const timeA = a.tanggal_surat ? new Date(a.tanggal_surat).getTime() : 0;
      const timeB = b.tanggal_surat ? new Date(b.tanggal_surat).getTime() : 0;
      return timeB - timeA;
    });
  }, [
    items,
    debouncedSearch,
    filterStartDate,
    filterEndDate,
    filterStatus,
    filterAgenda,
    filterUnitKerja,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterStartDate) count++;
    if (filterEndDate) count++;
    if (filterStatus) count++;
    if (filterAgenda) count++;
    if (filterUnitKerja) count++;
    return count;
  }, [filterStartDate, filterEndDate, filterStatus, filterAgenda, filterUnitKerja]);

  const applyPresetFilter = (preset: "this-month" | "last-7-days") => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    if (preset === "this-month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayStr = firstDay.toISOString().slice(0, 10);
      setFilterStartDate(firstDayStr);
      setFilterEndDate(todayStr);
    } else if (preset === "last-7-days") {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      const pastStr = past.toISOString().slice(0, 10);
      setFilterStartDate(pastStr);
      setFilterEndDate(todayStr);
    }
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  const handlePageChange = (newPage: number) => {
    const validPage = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(validPage);
  };

  const openCreate = () => {
    setEditingId(null);
    const defaultData = {
      nomor_surat: "",
      tanggal_surat: "",
      tujuan_surat: "",
      perihal: "",
      agenda: initialAgendaOptions[0] || "",
      unit_kerja: initialUnitKerjaOptions[0] || "",
      status: "published",
      lampiran: "",
    };
    setFormData(defaultData);
    setInitialFormJson(JSON.stringify(defaultData));
    setLampiranFile(null);
    setShowForm(true);
  };

  const openEdit = (item: SuratKeluar) => {
    setEditingId(item.id);
    const editData = {
      nomor_surat: item.nomor_surat,
      tanggal_surat: item.tanggal_surat,
      tujuan_surat: item.tujuan_surat,
      perihal: item.perihal,
      agenda: item.agenda,
      unit_kerja: item.unit_kerja,
      status: item.status || "published",
      lampiran: item.lampiran || "",
    };
    setFormData(editData);
    setInitialFormJson(JSON.stringify(editData));
    setLampiranFile(null);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (editingId) fd.set("id", editingId);
      fd.set("nomor_surat", formData.nomor_surat);
      fd.set("tanggal_surat", formData.tanggal_surat);
      fd.set("tujuan_surat", formData.tujuan_surat);
      fd.set("perihal", formData.perihal);
      fd.set("agenda", formData.agenda);
      fd.set("unit_kerja", formData.unit_kerja);
      fd.set("status", formData.status);
      if (lampiranFile) fd.set("lampiran_file", lampiranFile);

      const res = await apiClient.suratKeluar.save(fd, !!editingId, editingId || undefined);
      if (res.success) {
        toast.success(res.message || "Berhasil disimpan");
        setShowForm(false);
        fetchData();
      } else {
        toast.error(res.error || "Gagal menyimpan");
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
      const res = await apiClient.suratKeluar.delete(deletingId);
      if (res.success) {
        toast.success(res.message || "Berhasil dihapus");
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchData();
      } else {
        toast.error(res.error || "Gagal menghapus");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: string, isCurrentlyArchived: boolean) => {
    try {
      const res = await apiClient.suratKeluar.archive(id, !isCurrentlyArchived);
      if (res.success) {
        toast.success(res.message || "Status arsip diperbarui");
        fetchData();
      } else {
        toast.error(res.error || "Gagal mengarsipkan");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    }
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");

    const titleRow1 = ["KEMENTERIAN AGAMA REPUBLIK INDONESIA"];
    const titleRow2 = ["KANTOR KEMENTERIAN AGAMA KABUPATEN BARITO UTARA"];
    const titleRow3 = ["BUKU AGENDA REGISTER SURAT KELUAR"];
    const titleRow4 = [`Tanggal Ekspor: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`];
    const emptyRow: string[] = [];

    const headers = [
      "No",
      "Nomor Surat",
      "Tanggal Surat",
      "Klasifikasi / Agenda",
      "Unit Kerja / Pengirim",
      "Tujuan Surat / Penerima",
      "Perihal",
      "Status",
    ];

    const rows = filtered.map((item, index) => [
      index + 1,
      item.nomor_surat,
      formatDate(item.tanggal_surat),
      item.agenda || "-",
      item.unit_kerja || "-",
      item.tujuan_surat,
      item.perihal,
      item.status === "published" ? "Terbit" : item.status === "draft" ? "Konsep" : "Terbit",
    ]);

    const aoaData = [
      titleRow1,
      titleRow2,
      titleRow3,
      titleRow4,
      emptyRow,
      headers,
      ...rows,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

    worksheet["!cols"] = [
      { wch: 6 },   // No
      { wch: 34 },  // Nomor Surat
      { wch: 16 },  // Tanggal Surat
      { wch: 24 },  // Agenda
      { wch: 32 },  // Unit Kerja
      { wch: 38 },  // Tujuan Surat
      { wch: 60 },  // Perihal
      { wch: 14 },  // Status
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Surat Keluar");
    XLSX.writeFile(workbook, `Buku_Agenda_Surat_Keluar_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text("BUKU AGENDA SURAT KELUAR", 14, 15);
    doc.setFontSize(10);
    doc.text(`Kemenag Kabupaten Barito Utara - Dicetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 22);

    const headers = [
      [
        "No",
        "Nomor Surat",
        "Tgl Surat",
        "Agenda",
        "Unit Kerja",
        "Tujuan Surat",
        "Perihal",
        "Status",
      ],
    ];

    const data = filtered.map((item, index) => [
      index + 1,
      item.nomor_surat,
      formatDate(item.tanggal_surat),
      item.agenda,
      item.unit_kerja,
      item.tujuan_surat,
      item.perihal,
      item.status === "published" ? "Terbit" : "Konsep",
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [5, 150, 105] },
    });

    doc.save(`Buku_Agenda_Surat_Keluar_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
  };

  return (
    <div className="space-y-4">
      {/* Modern Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input Bar with Clear X */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor, tujuan, perihal..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-[#1a1d24] border border-slate-200/80 dark:border-white/10 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none shadow-2xs"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-all"
              title="Bersihkan pencarian"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Button Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all border shadow-2xs ${
              showFilters || activeFilterCount > 0
                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : "bg-white dark:bg-[#1a1d24] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
            }`}
          >
            <Filter className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Export Excel */}
          <button
            type="button"
            onClick={exportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-white dark:bg-[#1a1d24] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-2xs"
            title="Ekspor ke Excel"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Excel</span>
          </button>

          {/* Export PDF */}
          <button
            type="button"
            onClick={exportPDF}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-white dark:bg-[#1a1d24] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-2xs"
            title="Ekspor ke PDF"
          >
            <FileText className="h-4 w-4 text-red-500 dark:text-red-400" />
            <span>PDF</span>
          </button>

          {/* Primary Create Button */}
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Surat</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <m.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="z-10 relative"
          >
            <div className="p-4 sm:p-5 bg-white dark:bg-[#1a1d24] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-md space-y-3">
              {/* Quick Date Presets */}
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">
                  Pilihan Cepat:
                </span>
                <button
                  type="button"
                  onClick={() => applyPresetFilter("this-month")}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10 transition-all"
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetFilter("last-7-days")}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10 transition-all"
                >
                  7 Hari Terakhir
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <ModernDatePicker
                  label="Dari Tanggal"
                  value={filterStartDate}
                  onChange={(v) => {
                    setFilterStartDate(v);
                    setCurrentPage(1);
                  }}
                />
                <ModernDatePicker
                  label="Sampai Tanggal"
                  value={filterEndDate}
                  onChange={(v) => {
                    setFilterEndDate(v);
                    setCurrentPage(1);
                  }}
                />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 block">
                    Status Surat
                  </label>
                  <ModernSelect
                    name="filterStatus"
                    options={[
                      { value: "", label: "Semua Status" },
                      ...STATUS_OPTIONS,
                    ]}
                    value={filterStatus}
                    onChange={(val) => {
                      setFilterStatus(val);
                      setCurrentPage(1);
                    }}
                    placeholder="Semua Status"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 block">
                    Agenda Surat
                  </label>
                  <ModernSelect
                    name="filterAgenda"
                    options={[
                      { value: "", label: "Semua Agenda" },
                      ...initialAgendaOptions.map((opt) => ({
                        value: opt,
                        label: opt,
                      })),
                    ]}
                    value={filterAgenda}
                    onChange={(val) => {
                      setFilterAgenda(val);
                      setCurrentPage(1);
                    }}
                    placeholder="Semua Agenda"
                    enableSearch
                    searchPlaceholder="Cari agenda..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 block">
                    Unit Kerja
                  </label>
                  <ModernSelect
                    name="filterUnitKerja"
                    options={[
                      { value: "", label: "Semua Unit Kerja" },
                      ...initialUnitKerjaOptions.map((opt) => ({
                        value: opt,
                        label: opt,
                      })),
                    ]}
                    value={filterUnitKerja}
                    onChange={(val) => {
                      setFilterUnitKerja(val);
                      setCurrentPage(1);
                    }}
                    placeholder="Semua Unit Kerja"
                    enableSearch
                    searchPlaceholder="Cari unit..."
                  />
                </div>
              </div>

              {(filterStartDate || filterEndDate || filterStatus || filterAgenda || filterUnitKerja || search) && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStartDate("");
                      setFilterEndDate("");
                      setFilterStatus("");
                      setFilterAgenda("");
                      setFilterUnitKerja("");
                      setSearch("");
                      setCurrentPage(1);
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    Reset Filter & Pencarian
                  </button>
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {fetchError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 flex items-center justify-between">
          <span className="font-semibold">{fetchError}</span>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 rounded-lg text-xs font-bold transition-all"
          >
            Muat Ulang
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Table */}
      {!loading && !fetchError && (
        <div ref={tableRef} className="bg-white dark:bg-[#1a1d24] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden scroll-mt-20">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-100/60 dark:bg-white/[0.03]">
                  <th className="text-center px-4 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-12">
                    No
                  </th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Nomor Surat
                  </th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Tanggal
                  </th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Agenda
                  </th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Unit Kerja
                  </th>
                  <th className="text-center px-4 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Tujuan & Perihal
                  </th>
                  <th className="text-center px-4 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-28">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-16 text-center text-sm text-slate-400 font-semibold"
                    >
                      Belum ada data surat keluar
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-4 py-4 text-center">
                        {(() => {
                          const hasLampiran = Boolean(item.lampiran && item.lampiran.trim() !== "");
                          return (
                            <span
                              title={hasLampiran ? "Berkas lampiran PDF tersedia" : "Belum ada lampiran"}
                              className={`inline-flex items-center justify-center gap-1 h-6 min-w-6 px-2 rounded-lg font-extrabold text-[11px] transition-all ${
                                hasLampiran
                                  ? "bg-emerald-600 text-white shadow-xs shadow-emerald-200 dark:shadow-emerald-900/40 border border-emerald-500"
                                  : "bg-slate-100 dark:bg-white/5 text-slate-500"
                              }`}
                            >
                              {(currentPage - 1) * rowsPerPage + idx + 1}
                              {hasLampiran && <Paperclip className="w-2.5 h-2.5 text-emerald-100 shrink-0" />}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-white/10 inline-block shadow-2xs">
                          {item.nomor_surat}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {formatDate(item.tanggal_surat)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-[10px] font-bold rounded-lg border ${
                            (agendaColors[item.agenda]
                              ? BADGE_COLOR_MAP[agendaColors[item.agenda]]
                              : null) ||
                            "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
                          }`}
                        >
                          {item.agenda}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-[10px] font-bold rounded-lg border ${
                            (unitKerjaColors[item.unit_kerja]
                              ? BADGE_COLOR_MAP[
                                  unitKerjaColors[item.unit_kerja]
                                ]
                              : null) ||
                            "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
                          }`}
                        >
                          {item.unit_kerja}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={item.status || "draft"} />
                      </td>
                      <td className="px-4 py-4 max-w-xs sm:max-w-md">
                        <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {item.tujuan_surat}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                          {item.perihal}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5 p-1 rounded-xl w-fit mx-auto">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/25 hover:scale-105 transition-all shadow-2xs"
                            title="Detail Surat"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {item.lampiran && (
                            <button
                              type="button"
                              onClick={() => {
                                setPdfViewerUrl(item.lampiran!);
                                setPdfViewerTitle(item.perihal || item.nomor_surat || "Lampiran PDF");
                              }}
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 hover:scale-105 transition-all shadow-2xs"
                              title="Lihat Lampiran PDF"
                            >
                              <Paperclip className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/25 hover:scale-105 transition-all shadow-2xs"
                            title="Edit Surat"
                          >
                            <SquarePen className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleArchive(item.id, item.status === "archived")}
                            className={`p-1.5 rounded-lg border hover:scale-105 transition-all shadow-2xs ${
                              item.status === "archived"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-500/20 hover:bg-emerald-100"
                                : "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200/80 dark:border-purple-500/20 hover:bg-purple-100"
                            }`}
                            title={item.status === "archived" ? "Pulihkan dari Arsip" : "Arsipkan Surat"}
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingId(item.id);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/25 hover:scale-105 transition-all shadow-2xs"
                            title="Hapus Surat"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/5 select-none">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400">
                  Baris per halaman:
                </span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    handlePageChange(1);
                  }}
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 outline-none cursor-pointer"
                >
                  {[10, 25, 50, 100, 200].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] font-semibold text-slate-400 ml-2">
                  {filtered.length} total
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* First Page Button */}
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(1)}
                  className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1d24] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer"
                  title="Halaman Pertama"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                {/* Previous Page Button */}
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1d24] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page Number Buttons */}
                {getPaginationRange(currentPage, totalPages).map((pageNum, idx) => {
                  if (pageNum === "...") {
                    return (
                      <span key={`dots-${idx}`} className="px-1.5 text-slate-400 font-extrabold text-xs">
                        ...
                      </span>
                    );
                  }
                  const targetPage = Number(pageNum);
                  return (
                    <button
                      key={`page-${targetPage}-${idx}`}
                      type="button"
                      onClick={() => handlePageChange(targetPage)}
                      className={`h-8 min-w-8 px-2.5 flex items-center justify-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        currentPage === targetPage
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20"
                          : "bg-white dark:bg-[#1a1d24] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      {targetPage}
                    </button>
                  );
                })}

                {/* Next Page Button */}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1d24] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Last Page Button */}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(totalPages)}
                  className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1d24] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer"
                  title="Halaman Terakhir"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-4xl bg-white dark:bg-[#181b22] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 max-h-[92vh] overflow-y-auto custom-scrollbar flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-100 dark:border-violet-500/20 shadow-2xs">
                    <FileOutput className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      {editingId ? "Edit Surat Keluar" : "Terbitkan Surat Keluar Baru"}
                    </h2>
                    <p className="text-[11px] font-medium text-slate-400">
                      Isi rincian naskah surat keluar di bawah ini
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Nomor Surat <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-mono"
                      placeholder="B-___/Kk.17.05/1/BA.01/__/2026"
                      value={formData.nomor_surat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nomor_surat: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Status Publikasi
                    </label>
                    <ModernSelect
                      name="status"
                      options={STATUS_OPTIONS}
                      value={formData.status}
                      onChange={(val) =>
                        setFormData({ ...formData, status: val })
                      }
                    />
                  </div>
                </div>

                <ModernDatePicker
                  required
                  name="tanggal_surat"
                  label="Tanggal Surat"
                  value={formData.tanggal_surat}
                  onChange={(val) =>
                    setFormData({ ...formData, tanggal_surat: val })
                  }
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Jenis Agenda <span className="text-red-500">*</span>
                    </label>
                    <ModernSelect
                      name="agenda"
                      options={initialAgendaOptions}
                      value={formData.agenda}
                      onChange={(val) =>
                        setFormData({ ...formData, agenda: val })
                      }
                      enableSearch
                      searchPlaceholder="Cari agenda..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Unit Kerja Pengirim <span className="text-red-500">*</span>
                    </label>
                    <ModernSelect
                      name="unit_kerja"
                      options={initialUnitKerjaOptions}
                      value={formData.unit_kerja}
                      onChange={(val) =>
                        setFormData({ ...formData, unit_kerja: val })
                      }
                      enableSearch
                      searchPlaceholder="Cari unit kerja..."
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Tujuan Surat / Penerima <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    placeholder="Contoh: Kepala KPPN Buntok / Bupati Barito Utara"
                    value={formData.tujuan_surat}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        tujuan_surat: e.target.value,
                      });
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setFormData({
                          ...formData,
                          tujuan_surat: toTitleCase(val),
                        });
                      }
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Perihal Surat <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none"
                    placeholder="Tulis perihal atau inti isi surat keluar..."
                    value={formData.perihal}
                    onChange={(e) =>
                      setFormData({ ...formData, perihal: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  {formData.lampiran && !lampiranFile && (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 text-xs font-semibold text-emerald-900 dark:text-emerald-200 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Paperclip className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate font-medium">Lampiran PDF tersimpan saat ini</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setPdfViewerUrl(formData.lampiran);
                            setPdfViewerTitle(formData.perihal || "Lampiran PDF");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-all inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat File</span>
                        </button>
                        <button
                          type="button"
                          onClick={confirmDeleteLampiran}
                          disabled={deletingLampiran}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-[11px] font-bold shadow-2xs transition-all inline-flex items-center gap-1.5"
                        >
                          {deletingLampiran ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>Hapus File</span>
                        </button>
                      </div>
                    </div>
                  )}
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Upload Lampiran PDF{" "}
                    <span className="text-slate-400 dark:text-slate-500 font-normal normal-case">
                      ({formData.lampiran ? "opsional, unggah untuk mengganti file" : "opsional, maks 2MB"})
                    </span>
                  </label>
                  <label
                    className={`flex items-center justify-between px-4 py-3 bg-slate-50/80 dark:bg-white/[0.02] border border-dashed rounded-2xl cursor-pointer transition-all
                      ${isDraggingFile ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10" : "border-slate-300 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5"}
                    `}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const file = e.dataTransfer.files[0];
                        if (file.type !== "application/pdf") {
                          toast.error("Hanya file PDF yang diperbolehkan");
                          return;
                        }
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error("Ukuran file maksimal 2 MB");
                          return;
                        }
                        setLampiranFile(file);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                        <Upload className="h-4 w-4" />
                      </div>
                      <span
                        className={`text-xs font-semibold ${isDraggingFile ? "text-emerald-600" : "text-slate-600 dark:text-slate-300"}`}
                      >
                        {lampiranFile
                          ? lampiranFile.name
                          : isDraggingFile
                            ? "Lepaskan file di sini"
                            : "Klik atau seret file PDF di sini"}
                      </span>
                    </div>

                    {lampiranFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setLampiranFile(null);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600"
                        title="Hapus pilihan file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}

                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.type !== "application/pdf") {
                            toast.error("Hanya file PDF yang diperbolehkan");
                            e.target.value = "";
                            return;
                          }
                          if (file.size > 2 * 1024 * 1024) {
                            toast.error("Ukuran file maksimal 2 MB");
                            e.target.value = "";
                            return;
                          }
                          setLampiranFile(file);
                        } else {
                          setLampiranFile(null);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02] shrink-0">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-emerald-600/20 active:scale-95"
                >
                  {submitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span>{editingId ? "Simpan Perubahan" : "Simpan & Terbitkan"}</span>
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailItem && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-xl bg-white dark:bg-[#181b22] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-100 dark:border-violet-500/20">
                    <FileOutput className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      Detail Surat Keluar
                    </h2>
                    <p className="text-[11px] font-medium text-slate-400">
                      Informasi lengkap naskah keluar
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailItem(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Nomor & Status Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      Nomor Surat
                    </p>
                    <p className="font-mono text-sm sm:text-base font-black text-violet-700 dark:text-violet-400">
                      {detailItem.nomor_surat}
                    </p>
                  </div>
                  <div className="self-start sm:self-center">
                    <StatusBadge status={detailItem.status || "published"} />
                  </div>
                </div>

                {/* Dates & Badges Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Tanggal Surat
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      {formatDate(detailItem.tanggal_surat)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Kategori Agenda & Unit
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <span
                        className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-lg border ${
                          (agendaColors[detailItem.agenda]
                            ? BADGE_COLOR_MAP[agendaColors[detailItem.agenda]]
                            : null) ||
                          "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
                        }`}
                      >
                        {detailItem.agenda}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-lg border ${
                          (unitKerjaColors[detailItem.unit_kerja]
                            ? BADGE_COLOR_MAP[
                                unitKerjaColors[detailItem.unit_kerja]
                              ]
                            : null) ||
                          "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
                        }`}
                      >
                        {detailItem.unit_kerja}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tujuan Surat */}
                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Tujuan Surat / Penerima
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {detailItem.tujuan_surat}
                  </p>
                </div>

                {/* Perihal */}
                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Perihal Surat
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {detailItem.perihal}
                  </p>
                </div>

                {/* Lampiran File */}
                {detailItem.lampiran && (
                  <div className="p-4 rounded-2xl bg-violet-50/60 dark:bg-violet-500/10 border border-violet-200/60 dark:border-violet-500/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-violet-900 dark:text-violet-200 truncate">
                          Berkas Lampiran PDF
                        </p>
                        <p className="text-[10px] font-medium text-violet-700/80 dark:text-violet-400 truncate">
                          File dokumen terlampir
                        </p>
                      </div>
                    </div>
                    <a
                      href={detailItem.lampiran}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm transition-all shrink-0 inline-flex items-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Buka File</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                <button
                  onClick={() => {
                    const itemToEdit = detailItem;
                    setDetailItem(null);
                    openEdit(itemToEdit);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all border border-violet-200/60 dark:border-violet-500/20"
                >
                  Edit Surat
                </button>
                <button
                  onClick={() => setDetailItem(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/10 bg-slate-100 dark:bg-white/5 transition-all"
                >
                  Tutup
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
        title="Hapus Surat Keluar?"
        description="Data yang dihapus akan dipindahkan ke arsip. Anda dapat memulihkannya kembali jika diperlukan."
        variant="danger"
        confirmLabel="Hapus"
        loading={submitting}
        onConfirm={handleDelete}
      />

      <AlertDialog
        open={showDeleteLampiranConfirm}
        onOpenChange={setShowDeleteLampiranConfirm}
        title="Hapus Lampiran PDF?"
        description="Berkas lampiran PDF ini akan dihapus secara permanen dari server Cloudflare R2 dan database."
        variant="danger"
        confirmLabel="Hapus Lampiran"
        loading={deletingLampiran}
        onConfirm={handleDeleteLampiran}
      />

      {/* Floating PDF Viewer Modal */}
      <PdfViewerModal
        url={pdfViewerUrl}
        title={pdfViewerTitle}
        onClose={() => setPdfViewerUrl(null)}
      />
    </div>
  );
}
