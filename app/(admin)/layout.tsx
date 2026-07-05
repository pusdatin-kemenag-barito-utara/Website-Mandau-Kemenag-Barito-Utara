import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isSuperAdmin = user.email === process.env.SUPER_ADMIN_EMAIL;

  // Ambil data dari pusdatin.users berdasarkan email
  let userName = "Admin";
  let userRole = "Admin Surat";
  let userAvatar: string | null = null;

  let shouldRedirect = false;

  try {
    const rows = await db.execute<{
      name: string;
      role: string;
      avatar: string | null;
      app_role: string | null;
    }>(sql`
      SELECT u.name, u.role, u.avatar, p.role as app_role
      FROM kemenag_pusdatin.users u
      LEFT JOIN kemenag_pusdatin.app_permissions p 
        ON p.user_id = u.id AND p.app_id = 'e-surat-kemenag'
      WHERE u.email = ${user.email}
      LIMIT 1
    `);

    const _rows = rows as unknown as { name: string; role: string; avatar: string | null; app_role: string | null }[] | { rows: { name: string; role: string; avatar: string | null; app_role: string | null }[] };
    const pusdatinUser = Array.isArray(_rows) ? _rows[0] : _rows.rows?.[0];

    if (pusdatinUser) {
      const isSystemSuperAdmin = pusdatinUser.role === "super_admin" || isSuperAdmin;
      const hasAppAccess = pusdatinUser.app_role && pusdatinUser.app_role !== "none";

      if (!isSystemSuperAdmin && !hasAppAccess) {
        shouldRedirect = true;
      } else {
        userName = pusdatinUser.name || userName;
        userAvatar = pusdatinUser.avatar || null;
        userRole = pusdatinUser.role === "super_admin" ? "Super Admin" : "Admin Surat";
      }
    } else if (isSuperAdmin) {
      userName = "Super Admin";
      userRole = "Super Admin";
    } else {
      shouldRedirect = true;
    }
  } catch {
    // fallback jika pusdatin tidak dapat diakses
    if (isSuperAdmin) {
      userName = "Super Admin";
      userRole = "Super Admin";
    } else {
      shouldRedirect = true;
    }
  }

  if (shouldRedirect) {
    redirect("/unauthorized");
  }

  return (
    <AdminShell
      userEmail={user.email || "User"}
      userName={userName}
      userRole={userRole}
      userAvatar={userAvatar}
      isSuperAdmin={isSuperAdmin}
    >
      {children}
    </AdminShell>
  );
}
