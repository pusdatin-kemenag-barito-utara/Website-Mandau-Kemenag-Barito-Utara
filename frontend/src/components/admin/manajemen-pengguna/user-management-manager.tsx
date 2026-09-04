import { useState, useEffect, useMemo, useCallback } from "react";
import { apiClient, type MasterOptionRaw } from "@/lib/api-client";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { FramerProvider } from "@/components/providers/framer-provider";
import { toast } from "sonner";
import type { UserAccount, UserFormData, UserStats } from "./types";
import { UserStatsCards } from "./user-stats-cards";
import { UserTable } from "./user-table";
import { UserFormModal } from "./user-form-modal";

export function UserManagementManager() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidangOptions, setBidangOptions] = useState<string[]>([]);
  const [loadingBidang, setLoadingBidang] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Alert Dialog State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load dynamic unit kerja options from master_options (NO HARDCODED OPTIONS)
  const loadMasterOptions = useCallback(async () => {
    setLoadingBidang(true);
    try {
      const res = await apiClient.masterOptions.list();
      if (res.success && res.data) {
        // Ambil opsi yang berkategori unit_kerja dan berstatus aktif secara dinamis
        const dynamicUnits = res.data
          .filter((opt: MasterOptionRaw) => opt.category === "unit_kerja" && opt.is_active !== false)
          .map((opt: MasterOptionRaw) => opt.name);
        setBidangOptions(dynamicUnits);
      }
    } catch {
      console.error("[UserManagement] Gagal memuat daftar unit kerja dinamis.");
    } finally {
      setLoadingBidang(false);
    }
  }, []);

  // Load Users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.users.list();
      if (res.success && res.data) {
        setUsers(res.data);
      } else {
        toast.error(res.error || "Gagal memuat data pengguna.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    loadUsers();
    loadMasterOptions();
  }, [loadUsers, loadMasterOptions]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search.trim() ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.bidang && u.bidang.toLowerCase().includes(search.toLowerCase()));

      const matchRole = roleFilter === "all" || u.role === roleFilter;

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.is_active) ||
        (statusFilter === "inactive" && !u.is_active);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Statistics Calculation
  const stats: UserStats = useMemo(() => {
    const total = users.length;
    const superAdmin = users.filter((u) => u.role === "super_admin").length;
    const admin = users.filter((u) => u.role === "admin").length;
    const adminBidang = users.filter((u) => u.role === "admin_bidang").length;
    const active = users.filter((u) => u.is_active).length;
    return { total, superAdmin, admin, adminBidang, active };
  }, [users]);

  // Handlers for Modals
  const handleOpenCreate = () => {
    setModalMode("create");
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setModalMode("edit");
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (user: UserAccount) => {
    if (user.role === "super_admin") {
      toast.error("Akun Super Admin dilindungi sistem dan tidak dapat dihapus!");
      return;
    }
    setUserToDelete(user);
    setIsDeleteOpen(true);
  };

  // Submit Handler (Create / Update)
  const handleSubmitForm = async (formData: UserFormData) => {
    if (!formData.name.trim()) {
      toast.error("Nama lengkap wajib diisi.");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Alamat email wajib diisi.");
      return;
    }

    if (modalMode === "create") {
      if (!formData.password) {
        toast.error("Password wajib diisi untuk pengguna baru.");
        return;
      }
      if (formData.password.length < 6) {
        toast.error("Password minimal harus 6 karakter.");
        return;
      }
    } else if (formData.password && formData.password.length < 6) {
      toast.error("Password baru minimal harus 6 karakter.");
      return;
    }

    if (formData.role === "admin_bidang" && !formData.bidang.trim()) {
      toast.error("Silakan pilih unit kerja / bidang untuk Admin Bidang.");
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === "create") {
        const res = await apiClient.users.create({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password || "",
          role: formData.role as "admin" | "admin_bidang",
          bidang: formData.role === "admin_bidang" ? formData.bidang : "",
          phone: formData.phone.trim(),
          is_active: formData.isActive,
        });

        if (res.success && res.data) {
          toast.success("Pengguna baru berhasil ditambahkan.");
          setIsModalOpen(false);
          loadUsers();
        } else {
          toast.error(res.error || "Gagal menambahkan pengguna.");
        }
      } else if (selectedUser) {
        const res = await apiClient.users.update(selectedUser.id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password ? formData.password : undefined,
          role: formData.role,
          bidang: formData.role === "admin_bidang" ? formData.bidang : "",
          phone: formData.phone.trim(),
          is_active: formData.isActive,
        });

        if (res.success && res.data) {
          toast.success("Data pengguna berhasil diperbarui.");
          setIsModalOpen(false);
          loadUsers();
        } else {
          toast.error(res.error || "Gagal memperbarui pengguna.");
        }
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyimpan data pengguna.");
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const res = await apiClient.users.delete(userToDelete.id);
      if (res.success) {
        toast.success(`Pengguna ${userToDelete.name} berhasil dihapus.`);
        setIsDeleteOpen(false);
        setUserToDelete(null);
        loadUsers();
      } else {
        toast.error(res.error || "Gagal menghapus pengguna.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menghapus pengguna.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <FramerProvider>
      <div className="space-y-6">
        {/* Metric Cards Banner */}
        <UserStatsCards stats={stats} />

        {/* Data Table with Toolbar */}
        <UserTable
          users={filteredUsers}
          loading={loading}
          totalCount={users.length}
          search={search}
          onSearchChange={setSearch}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onRefresh={() => {
            loadUsers();
            loadMasterOptions();
          }}
          onCreateUser={handleOpenCreate}
          onEditUser={handleOpenEdit}
          onDeleteUser={handleOpenDelete}
        />

        {/* Create / Edit Form Modal */}
        <UserFormModal
          open={isModalOpen}
          mode={modalMode}
          user={selectedUser}
          bidangOptions={bidangOptions}
          loadingBidang={loadingBidang}
          submitting={submitting}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitForm}
        />

        {/* Delete Confirmation Alert Dialog */}
        <AlertDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title="Hapus Pengguna Ini?"
          description={`Apakah Anda yakin ingin menghapus akun ${userToDelete?.name} (${userToDelete?.email})? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Ya, Hapus Pengguna"
          cancelLabel="Batal"
          variant="danger"
          loading={deleting}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </FramerProvider>
  );
}
