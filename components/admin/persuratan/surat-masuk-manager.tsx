"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  X,
  Loader2,
  Eye,
  Upload,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getSuratMasukAction,
  saveSuratMasukAction,
  deleteSuratMasukAction,
} from "@/lib/actions/admin-persuratan";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";
import { m, AnimatePresence } from "framer-motion";
import { ModernSelect } from "@/components/ui/modern-select";
import { toTitleCase } from "@/lib/utils";
import { toast } from "sonner";
import { STATUS_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { AlertDialog } from "@/components/ui/alert-dialog";

const getPaginationRange = (current: number, total: number) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

export interface SuratMasuk {
  id: string;
  nomor_surat: string;
  tanggal_surat: string;
  tanggal_terima: string;
  asal_surat: string;
  perihal: string;
  agenda?: string;
  status?: string;
  lampiran?: string;
}

export function SuratMasukManager({
  initialData = [],
}: {
  initialData?: SuratMasuk[];
  initialTotal?: number;
}) {
  const [items, setItems] = useState<SuratMasuk[]>(initialData);
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

  const [filterSuratStart, setFilterSuratStart] = useState("");
  const [filterSuratEnd, setFilterSuratEnd] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<SuratMasuk | null>(null);

  const [formData, setFormData] = useState({
    nomor_surat: "",
    tanggal_surat: "",
    tanggal_terima: "",
    asal_surat: "",
    perihal: "",
    agenda: "",
    status: "published",
  });
  const [lampiranFile, setLampiranFile] = useState<File | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [initialFormJson, setInitialFormJson] = useState("");

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
      const res = await getSuratMasukAction(1, 10000);
      if (res.success) {
        setItems((res.data ?? []) as SuratMasuk[]);
      } else {
        setFetchError(res.error || "Gagal memuat data");
      }
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  // Client-side filter & pagination
  const filtered = useMemo(() => {
    let result = items;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (item) =>
          item.nomor_surat.toLowerCase().includes(q) ||
          item.asal_surat.toLowerCase().includes(q) ||
          item.perihal.toLowerCase().includes(q),
      );
    }

    if (filterSuratStart) {
      result = result.filter(
        (item) => new Date(item.tanggal_surat) >= new Date(filterSuratStart),
      );
    }
    if (filterSuratEnd) {
      result = result.filter(
        (item) => new Date(item.tanggal_surat) <= new Date(filterSuratEnd),
      );
    }
    if (filterStatus) {
      result = result.filter((item) => item.status === filterStatus);
    }


    return result;
  }, [
    items,
    debouncedSearch,
    filterSuratStart,
    filterSuratEnd,
    filterStatus,
  ]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const openCreate = () => {
    setEditingId(null);
    const defaultData = {
      nomor_surat: "",
      tanggal_surat: "",
      tanggal_terima: "",
      asal_surat: "",
      perihal: "",
      agenda: "",
      status: "published",
    };
    setFormData(defaultData);
    setInitialFormJson(JSON.stringify(defaultData));
    setLampiranFile(null);
    setShowForm(true);
  };

  const openEdit = (item: SuratMasuk) => {
    setEditingId(item.id);
    const editData = {
      nomor_surat: item.nomor_surat,
      tanggal_surat: item.tanggal_surat,
      tanggal_terima: item.tanggal_terima,
      asal_surat: item.asal_surat,
      perihal: item.perihal,
      agenda: item.agenda || "",
      status: item.status || "published",
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
      fd.set("tanggal_terima", formData.tanggal_terima);
      fd.set("asal_surat", formData.asal_surat);
      fd.set("perihal", formData.perihal);
      fd.set("agenda", formData.agenda);
      fd.set("status", formData.status);
      if (lampiranFile) fd.set("lampiran_file", lampiranFile);

      const res = await saveSuratMasukAction(fd);
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
      const res = await deleteSuratMasukAction(deletingId);
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

  const exportExcel = () => {
    const headers = [
      "No",
      "Nomor Surat",
      "Tanggal Surat",
      "Tanggal Terima",
      "Asal Surat",
      "Perihal",
      "Status",
    ];
    const data = filtered.map((item, index) => ({
      No: index + 1,
      "Nomor Surat": item.nomor_surat,
      "Tanggal Surat": item.tanggal_surat,
      "Tanggal Terima": item.tanggal_terima,
      "Asal Surat": item.asal_surat,
      Perihal: item.perihal,
      Status: item.status || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Surat Masuk");
    XLSX.writeFile(workbook, `Buku_Agenda_Surat_Masuk_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.text("Buku Agenda Surat Masuk", 14, 15);
    doc.setFontSize(10);
    doc.text(`Kemenag Kabupaten Barito Utara - Dicetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 22);

    const headers = [
      ["No", "Nomor Surat", "Tgl Surat", "Tgl Terima", "Asal Surat", "Perihal", "Status"],
    ];

    const data = filtered.map((item, index) => [
      index + 1,
      item.nomor_surat,
      item.tanggal_surat,
      item.tanggal_terima,
      item.asal_surat,
      item.perihal,
      item.status || "",
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [6, 78, 59] }, // emerald-900
    });

    doc.save(`Buku_Agenda_Surat_Masuk_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor, asal, atau perihal..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <m.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="z-10 relative"
          >
            <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-white/10 rounded-2xl">
              <div className="w-48">
                <ModernDatePicker
                  label="Dari Tgl Surat"
                  value={filterSuratStart}
                  onChange={(v) => {
                    setFilterSuratStart(v);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="w-48">
                <ModernDatePicker
                  label="Sampai Tgl Surat"
                  value={filterSuratEnd}
                  onChange={(v) => {
                    setFilterSuratEnd(v);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="w-48">
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
              {(filterSuratStart ||
                filterSuratEnd ||
                filterStatus) && (
                <button
                  onClick={() => {
                    setFilterSuratStart("");
                    setFilterSuratEnd("");
                    setFilterStatus("");
                  }}
                  className="self-end px-3 py-2 text-xs font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all h-[42px]"
                >
                  Reset Filter
                </button>
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
        <div className="bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider w-12">
                    No
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Info Surat
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Tgl Surat
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Tgl Terima
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Asal & Perihal
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider w-24">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-slate-400 font-semibold"
                    >
                      Belum ada data surat masuk
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-xs font-bold text-slate-400">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {item.nomor_surat}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {formatDate(item.tanggal_surat)}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {formatDate(item.tanggal_terima)}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {item.asal_surat}
                        </p>
                        <p className="text-[10px] text-slate-500 line-clamp-1">
                          {item.perihal}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status || "draft"} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                            title="Detail"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {item.lampiran && (
                            <a
                              href={item.lampiran}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                              title="Lihat Lampiran PDF"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingId(item.id);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400">
                  Baris per halaman:
                </span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 outline-none"
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
              <div className="flex items-center gap-1">
                {getPaginationRange(currentPage, totalPages || 1).map((pageNum, idx) => {
                  if (pageNum === "...") {
                    return (
                      <span key={`dots-${idx}`} className="px-2 text-slate-400 font-bold">
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum as number)}
                      className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg border transition-all ${
                        currentPage === pageNum
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-white dark:bg-[#1a1d24] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
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
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40"
          >
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-[#1a1d24] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingId ? "Edit Surat Masuk" : "Tambah Surat Masuk"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Nomor Surat
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                      placeholder="B-100/Kk.17.05/1/BA.01/01/2026"
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
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Status
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ModernDatePicker
                    required
                    name="tanggal_surat"
                    label="Tanggal Surat"
                    value={formData.tanggal_surat}
                    onChange={(val) =>
                      setFormData({ ...formData, tanggal_surat: val })
                    }
                  />
                  <ModernDatePicker
                    required
                    name="tanggal_terima"
                    label="Tanggal Terima"
                    value={formData.tanggal_terima}
                    onChange={(val) =>
                      setFormData({ ...formData, tanggal_terima: val })
                    }
                  />
                </div>



                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Asal Surat
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    placeholder="Instansi atau perorangan pengirim..."
                    value={formData.asal_surat}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, asal_surat: val });
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setFormData({
                          ...formData,
                          asal_surat: toTitleCase(val),
                        });
                      }
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Perihal
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none"
                    placeholder="Perihal surat..."
                    value={formData.perihal}
                    onChange={(e) =>
                      setFormData({ ...formData, perihal: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Lampiran{" "}
                    <span className="text-slate-400 dark:text-slate-500 font-normal lowercase">
                      (opsional, PDF maks 2MB)
                    </span>
                  </label>
                  <label
                    className={`flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-black/20 border border-dashed rounded-xl cursor-pointer transition-all
                      ${isDraggingFile ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10" : "border-slate-300 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5"}
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
                    <Upload
                      className={`h-4 w-4 ${isDraggingFile ? "text-emerald-500" : "text-slate-400 dark:text-slate-500"}`}
                    />
                    <span
                      className={`text-xs font-semibold ${isDraggingFile ? "text-emerald-600" : "text-slate-500 dark:text-slate-400"}`}
                    >
                      {lampiranFile
                        ? lampiranFile.name
                        : isDraggingFile
                          ? "Lepaskan file di sini"
                          : "Klik atau seret file ke sini"}
                    </span>
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

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
                >
                  {submitting && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {editingId ? "Simpan Perubahan" : "Simpan & Terbitkan"}
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
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40"
          >
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-white dark:bg-[#1a1d24] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Detail Surat Masuk
                </h2>
                <button
                  onClick={() => setDetailItem(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Nomor Surat
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {detailItem.nomor_surat}
                    </p>
                  </div>
                  <StatusBadge status={detailItem.status || "draft"} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Tanggal Surat
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatDate(detailItem.tanggal_surat)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Tanggal Terima
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatDate(detailItem.tanggal_terima)}
                    </p>
                  </div>
                </div>



                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Asal Surat
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {detailItem.asal_surat}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Perihal
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {detailItem.perihal}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                <button
                  onClick={() => setDetailItem(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"
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
        title="Hapus Surat Masuk?"
        description="Data yang dihapus akan dipindahkan ke arsip. Anda dapat memulihkannya kembali jika diperlukan."
        variant="danger"
        confirmLabel="Hapus"
        loading={submitting}
        onConfirm={handleDelete}
      />

    </div>
  );
}
