import { useState, useEffect } from "react";
import { UserPlus, Edit2, ShieldAlert, Crown, Eye, EyeOff, Loader2, X } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import type { UserAccount, UserFormData } from "./types";

interface UserFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  user: UserAccount | null;
  bidangOptions: string[];
  loadingBidang: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (formData: UserFormData) => void;
}

export function UserFormModal({
  open,
  mode,
  user,
  bidangOptions,
  loadingBidang,
  submitting,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"super_admin" | "admin" | "admin_bidang">("admin");
  const [bidang, setBidang] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open) {
      if (mode === "edit" && user) {
        setName(user.name);
        setEmail(user.email);
        setPassword("");
        setShowPassword(false);
        setRole(user.role);
        setBidang(user.bidang || "");
        setPhone(user.phone || "");
        setIsActive(user.is_active);
      } else {
        setName("");
        setEmail("");
        setPassword("");
        setShowPassword(false);
        setRole("admin");
        setBidang(bidangOptions.length > 0 ? bidangOptions[0] : "");
        setPhone("");
        setIsActive(true);
      }
    }
  }, [open, mode, user, bidangOptions]);

  if (!open) return null;

  const isEditingSuperAdmin = mode === "edit" && user?.role === "super_admin";

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      email,
      password: password ? password : undefined,
      role,
      bidang: role === "admin_bidang" ? bidang : "",
      phone,
      isActive,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => !submitting && onClose()}
        />

        <m.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#181c26] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/80 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                {mode === "create" ? <UserPlus className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {mode === "create" ? "Tambah Pengguna Baru" : "Edit Data Pengguna"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {mode === "create"
                    ? "Daftarkan akun admin persuratan Kemenag Barito Utara"
                    : `Perbarui informasi akun ${user?.email}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Warning jika Super Admin */}
            {isEditingSuperAdmin && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <b className="font-bold">Akun Super Admin Utama (Sistem Tunggal)</b>
                  <p className="mt-0.5 text-[11px] text-amber-700/80 dark:text-amber-300/80">
                    Tingkatan akun Super Admin dilindungi permanen. Role tidak dapat diturunkan dan akun tidak dapat dinonaktifkan.
                  </p>
                </div>
              </div>
            )}

            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Muhammad Ilham, S.Ag"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#12151e] border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Alamat Email Kemenag <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@kemenag.go.id"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#12151e] border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {mode === "create" ? "Kata Sandi (Password)" : "Ubah Kata Sandi"}
                  {mode === "create" && <span className="text-red-500"> *</span>}
                </label>
                {mode === "edit" && (
                  <span className="text-[10px] text-slate-400">Kosongkan jika tidak diubah</span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required={mode === "create"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "create"
                      ? "Minimal 6 karakter"
                      : "Masukkan kata sandi baru untuk mengganti"
                  }
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#12151e] border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tingkatan Akun / Role <span className="text-red-500">*</span>
              </label>
              {isEditingSuperAdmin ? (
                <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  Super Admin (Sistem Tunggal - Terkunci)
                </div>
              ) : (
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "admin_bidang")}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#12151e] border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="admin" className="dark:bg-[#12151e]">
                    Admin Surat (Tata Usaha Umum)
                  </option>
                  <option value="admin_bidang" className="dark:bg-[#12151e]">
                    Admin Bidang (Khusus Seksi / Unit Kerja)
                  </option>
                </select>
              )}
              <p className="mt-1 text-[11px] text-slate-400">
                {role === "admin"
                  ? "Mengelola seluruh surat masuk dan keluar umum tata usaha."
                  : "Akses naskah dinas dikhususkan untuk unit kerja / seksi terpilih."}
              </p>
            </div>

            {/* Unit Kerja / Seksi Bidang (Dinamis dari Master Options) */}
            {role === "admin_bidang" && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Unit Kerja / Seksi Bidang <span className="text-red-500">*</span>
                  </label>
                  {loadingBidang && (
                    <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Memuat unit kerja...
                    </span>
                  )}
                </div>

                {bidangOptions.length === 0 && !loadingBidang ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                    Belum ada opsi Unit Kerja pada sistem. Tambahkan pilihan unit kerja terlebih dahulu di menu <b>Manajemen Surat</b>.
                  </div>
                ) : (
                  <select
                    value={bidang}
                    onChange={(e) => setBidang(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#12151e] border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="" disabled className="dark:bg-[#12151e]">
                      -- Pilih Unit Kerja / Bidang --
                    </option>
                    {bidangOptions.map((opt) => (
                      <option key={opt} value={opt} className="dark:bg-[#12151e]">
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </m.div>
            )}

            {/* Nomor Telepon / WA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nomor Telepon / WhatsApp <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#12151e] border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Status Keaktifan */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  disabled={isEditingSuperAdmin}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Status Akun Aktif
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Akun aktif dapat masuk dan menggunakan seluruh fitur sesuai kewenangannya.
                  </p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>{mode === "create" ? "Simpan Pengguna" : "Perbarui Akun"}</span>
                )}
              </button>
            </div>
          </form>
        </m.div>
      </div>
    </AnimatePresence>
  );
}
