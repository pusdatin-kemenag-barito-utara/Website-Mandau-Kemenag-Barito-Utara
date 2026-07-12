"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export function AdminShell({
  children,
  userEmail,
  userName,
  userRole,
  userAvatar,
  isSuperAdmin = false,
}: {
  children: React.ReactNode;
  userEmail: string;
  userName?: string;
  userRole?: string;
  userAvatar?: string | null;
  isSuperAdmin?: boolean;
}) {
  const [sidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0f1117] fixed inset-0 w-full">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <AdminSidebar collapsed={sidebarCollapsed} isSuperAdmin={isSuperAdmin} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar 
          collapsed={false} 
          isSuperAdmin={isSuperAdmin} 
          onLinkClick={() => setMobileSidebarOpen(false)} 
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          userEmail={userEmail}
          userName={userName || userEmail}
          userRole={userRole}
          userAvatar={userAvatar}

        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
