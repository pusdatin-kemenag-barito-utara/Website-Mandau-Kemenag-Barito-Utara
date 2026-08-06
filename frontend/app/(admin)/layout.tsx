import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { AdminShell } from "@/components/admin/admin-shell";
import { IdleLockout } from "@/components/admin/idle-lockout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const meRes = await apiClient.auth.getMe();

  if (!meRes.success || !meRes.data) {
    redirect("/login");
  }

  const user = meRes.data as {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    is_super_admin?: boolean;
    isSuper?: boolean;
  };

  const userEmail = user.email || "";
  const userName = user.name || "Admin";
  const userRole = user.role || "Admin Surat";
  const userAvatar = user.avatar || null;
  const isSuperAdmin = Boolean(
    user.is_super_admin ||
      user.isSuper ||
      user.role === "super_admin" ||
      userEmail === process.env.SUPER_ADMIN_EMAIL,
  );

  return (
    <AdminShell
      userEmail={userEmail}
      userName={userName}
      userRole={userRole}
      userAvatar={userAvatar}
      isSuperAdmin={isSuperAdmin}
    >
      <IdleLockout />
      {children}
    </AdminShell>
  );
}
