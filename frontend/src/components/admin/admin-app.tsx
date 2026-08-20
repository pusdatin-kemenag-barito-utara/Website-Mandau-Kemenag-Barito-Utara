import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { FramerProvider } from "@/components/providers/framer-provider";
import { AdminShell } from "@/components/admin/admin-shell";
import { IdleLockout } from "@/components/admin/idle-lockout";

export function AdminApp({
  children,
  userEmail,
  userName,
  userRole,
  userAvatar,
  isSuperAdmin = false,
}: {
  children: ReactNode;
  userEmail: string;
  userName?: string;
  userRole?: string;
  userAvatar?: string | null;
  isSuperAdmin?: boolean;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <FramerProvider>
        <AdminShell
          userEmail={userEmail}
          userName={userName}
          userRole={userRole}
          userAvatar={userAvatar}
          isSuperAdmin={isSuperAdmin}
        >
          {children}
        </AdminShell>
        <IdleLockout />
      </FramerProvider>
    </ThemeProvider>
  );
}