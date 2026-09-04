import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Crown,
  Building2,
  FileText,
  Mail,
  Phone,
  Clock,
  Loader2,
  X,
} from "lucide-react";
import type { UserAccount } from "./types";

interface UserTableProps {
  users: UserAccount[];
  loading: boolean;
  totalCount: number;
  search: string;
  onSearchChange: (val: string) => void;
  roleFilter: string;
  onRoleFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  onRefresh: () => void;
  onCreateUser: () => void;
  onEditUser: (user: UserAccount) => void;
  onDeleteUser: (user: UserAccount) => void;
}

export function UserTable({
  users,
  loading,
  totalCount,
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  onCreateUser,
  onEditUser,
  onDeleteUser,
}: UserTableProps) {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Belum pernah login";
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#151922] border border-slate-200/80 dark:border-white/10 rounded-2xl p-3 sm:p-4 shadow-sm">
        {/* Left search & filters */}
        <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari nama, email, atau bidang..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => onRoleFilterChange(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none font-medium cursor-pointer"
            >
              <option value="all" className="dark:bg-[#1a1e29]">Semua Tingkatan</option>
              <option value="super_admin" className="dark:bg-[#1a1e29]">Super Admin</option>
              <option value="admin" className="dark:bg-[#1a1e29]">Admin Surat</option>
              <option value="admin_bidang" className="dark:bg-[#1a1e29]">Admin Bidang</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none font-medium cursor-pointer"
            >
              <option value="all" className="dark:bg-[#1a1e29]">Semua Status</option>
              <option value="active" className="dark:bg-[#1a1e29]">Aktif</option>
              <option value="inactive" className="dark:bg-[#1a1e29]">Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl transition-all flex items-center gap-1.5"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-500" : ""}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            type="button"
            onClick={onCreateUser}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Pengguna</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-[#151922] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-12">No</th>
                <th className="py-3.5 px-4 min-w-[240px]">Pengguna & Kontak</th>
                <th className="py-3.5 px-4 min-w-[170px]">Tingkatan / Role</th>
                <th className="py-3.5 px-4 min-w-[190px]">Unit Kerja / Bidang</th>
                <th className="py-3.5 px-4 text-center w-28">Status</th>
                <th className="py-3.5 px-4 min-w-[150px]">Terakhir Login</th>
                <th className="py-3.5 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
                      <span className="text-xs font-medium">Memuat data pengguna...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="h-9 w-9 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Tidak ada pengguna yang cocok
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {search
                          ? "Coba ubah kata kunci pencarian atau bersihkan filter."
                          : "Belum ada data pengguna yang terdaftar."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => {
                  const isSuper = user.role === "super_admin";
                  const isAdminBidang = user.role === "admin_bidang";

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors ${
                        isSuper ? "bg-amber-500/[0.02] dark:bg-amber-500/[0.02]" : ""
                      }`}
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Name & Account */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 shadow-xs overflow-hidden shrink-0 p-1">
                            <img
                              src="/kemenag.svg"
                              alt="Logo Kemenag"
                              width={24}
                              height={24}
                              className="object-contain"
                              loading="lazy"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isSuper && (
                                <span title="Super Admin Tunggal" className="inline-flex items-center">
                                  <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span className="flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                                {user.email}
                              </span>
                              {user.phone && (
                                <span className="hidden sm:flex items-center gap-1 text-slate-400">
                                  • <Phone className="h-2.5 w-2.5" /> {user.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-300 shadow-sm">
                            <Crown className="h-3 w-3 text-amber-500" />
                            Super Admin
                          </span>
                        ) : isAdminBidang ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 dark:bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-300">
                            <Building2 className="h-3 w-3 text-sky-500" />
                            Admin Bidang
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                            <FileText className="h-3 w-3 text-emerald-500" />
                            Admin Surat
                          </span>
                        )}
                      </td>

                      {/* Bidang / Unit Kerja */}
                      <td className="py-3.5 px-4">
                        {isSuper ? (
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 italic">
                            Semua Akses (Super Admin)
                          </span>
                        ) : isAdminBidang ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200">
                            {user.bidang || "Belum ditentukan"}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                            Tata Usaha (Umum)
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500">
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{formatDate(user.last_login_at)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditUser(user)}
                            className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/25 hover:scale-105 active:scale-95 transition-all shadow-2xs cursor-pointer"
                            title="Edit Pengguna"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {isSuper ? (
                            <button
                              type="button"
                              disabled
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 border border-slate-200/60 dark:border-white/5 cursor-not-allowed"
                              title="Akun Super Admin utama dilindungi dan tidak dapat dihapus"
                            >
                              <Lock className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onDeleteUser(user)}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/25 hover:scale-105 active:scale-95 transition-all shadow-2xs cursor-pointer"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Menampilkan <b>{users.length}</b> dari total <b>{totalCount}</b> pengguna
          </span>
          <span className="text-[11px] text-slate-400 italic">
            Super Admin dilindungi PostgreSQL partial unique constraint
          </span>
        </div>
      </div>
    </div>
  );
}
