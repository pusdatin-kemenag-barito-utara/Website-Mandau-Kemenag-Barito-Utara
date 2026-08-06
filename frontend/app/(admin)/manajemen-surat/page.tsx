import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/admin/page-header";
import { Settings2 } from "lucide-react";
import { ManajemenSuratManager } from "@/components/admin/manajemen-surat/manajemen-surat-manager";

export default async function ManajemenSuratPage() {
  const meRes = await apiClient.auth.getMe();

  if (!meRes.success || !meRes.data) {
    redirect("/login");
  }

  const user = meRes.data as {
    email: string;
    role: string;
    is_super_admin?: boolean;
    isSuper?: boolean;
  };

  const isSuperAdmin = Boolean(
    user.is_super_admin ||
      user.isSuper ||
      user.role === "super_admin" ||
      user.email === process.env.SUPER_ADMIN_EMAIL,
  );

  if (!isSuperAdmin) {
    redirect("/");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Manajemen Surat"
        description="Kelola opsi pilihan pada form surat masuk dan surat keluar"
        icon={Settings2}
      />
      <ManajemenSuratManager />
    </div>
  );
}
