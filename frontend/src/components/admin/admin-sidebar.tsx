import { useState, useEffect } from "react";
import {
  LayoutGrid,
  FileInput,
  FileOutput,
  Building2,
  Users,
  ChevronLeft,
  Bookmark,
  type LucideIcon,
} from "lucide-react";
import { SystemHealthBadge } from "@/components/admin/system-health-badge";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  tooltip?: string;
}

export interface NavGroup {
  group: string;
  superAdminOnly?: boolean;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: "Utama",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutGrid, tooltip: "Dashboard Utama" },
    ],
  },
  {
    group: "Tata Naskah",
    items: [
      { label: "Surat Masuk", href: "/surat-masuk", icon: FileInput, tooltip: "Buku Agenda Surat Masuk" },
      { label: "Surat Keluar", href: "/surat-keluar", icon: FileOutput, tooltip: "Buku Agenda Surat Keluar" },
    ],
  },
  {
    group: "Manajemen Surat",
    superAdminOnly: true,
    items: [
      {
        label: "Agenda Surat",
        href: "/manajemen-surat/agenda",
        icon: Bookmark,
        tooltip: "Pengaturan Jenis Agenda Surat",
      },
      {
        label: "Unit Kerja",
        href: "/manajemen-surat/unit-kerja",
        icon: Building2,
        tooltip: "Pengaturan Unit Kerja & Seksi",
      },
    ],
  },
  {
    group: "Sistem",
    superAdminOnly: true,
    items: [
      {
        label: "Manajemen Pengguna",
        href: "/manajemen-pengguna",
        icon: Users,
        tooltip: "Kelola Akun & Hak Akses",
      },
    ],
  },
];

export function AdminSidebar({
  collapsed,
  isSuperAdmin = false,
  onLinkClick,
  onToggleCollapse,
}: {
  collapsed: boolean;
  isSuperAdmin?: boolean;
  onLinkClick?: () => void;
  onToggleCollapse?: () => void;
}) {
  const [pathname, setPathname] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "",
  );

  useEffect(() => {
    const updatePath = () => {
      setPathname(window.location.pathname);
    };
    updatePath();
    document.addEventListener("astro:page-load", updatePath);
    window.addEventListener("popstate", updatePath);
    return () => {
      document.removeEventListener("astro:page-load", updatePath);
      window.removeEventListener("popstate", updatePath);
    };
  }, []);

  const visibleGroups = NAV_GROUPS.filter(
    (group) => !group.superAdminOnly || isSuperAdmin,
  );

  const checkIsActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className={`relative flex flex-col h-full bg-white dark:bg-[#11141c] border-r border-slate-200/80 dark:border-white/10 transition-all duration-300 ease-in-out select-none shadow-xs ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Floating Edge Toggle Button on Sidebar Border */}
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -right-3 top-5 z-40 h-6 w-6 rounded-full bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-500 shadow-sm flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
          title={collapsed ? "Buka Sidebar" : "Tutup Sidebar"}
        >
          <ChevronLeft
            className={`h-3.5 w-3.5 transition-transform duration-300 ${
              collapsed ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
            }`}
          />
        </button>
      )}

      {/* Logo & Branding Header */}
      <div
        className={`relative flex items-center h-16 border-b border-slate-200/80 dark:border-white/10 shrink-0 ${
          collapsed ? "justify-center px-0" : "justify-between px-4"
        }`}
      >
        <div
          onClick={onToggleCollapse}
          className={`flex items-center gap-3 min-w-0 ${
            onToggleCollapse ? "cursor-pointer group/logo" : ""
          }`}
          title={onToggleCollapse ? (collapsed ? "Buka Sidebar" : "Tutup Sidebar") : undefined}
        >
          {/* Logo Container */}
          <div className="relative h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 shadow-xs group-hover/logo:border-emerald-300 dark:group-hover/logo:border-emerald-700 transition-all duration-200">
            <img
              src="/mandau.png"
              alt="Logo SI MANDAU"
              width={24}
              height={24}
              className="object-contain w-6 h-6 group-hover/logo:scale-105 transition-transform"
            />
          </div>

          {/* Title & Subtitle */}
          {!collapsed && (
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-extrabold text-slate-900 dark:text-white tracking-wide truncate leading-tight group-hover/logo:text-emerald-700 dark:group-hover/logo:text-emerald-400 transition-colors">
                  SI MANDAU
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-xs" />
              </div>
              <span className="text-[9.5px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider truncate leading-tight mt-0.5">
                Kemenag Barito Utara
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5 custom-scrollbar">
        {visibleGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            {!collapsed && (
              <div className="px-2.5 mb-1.5 flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  {group.group}
                </span>
                <div className="h-px flex-1 bg-slate-200/70 dark:bg-white/[0.06] ml-2.5" />
              </div>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = checkIsActive(item.href);

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    data-astro-prefetch="hover"
                    onClick={onLinkClick}
                    className={`group relative flex items-center py-2.5 rounded-xl text-[12.5px] transition-all duration-150 ${
                      collapsed ? "justify-center px-0" : "gap-3 px-3"
                    } ${
                      isActive
                        ? "text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/90 dark:border-emerald-500/30 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.05] border border-transparent font-medium"
                    }`}
                    title={collapsed ? (item.tooltip || item.label) : undefined}
                  >
                    {/* Active Accent Left Bar */}
                    {isActive && !collapsed && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-600 dark:bg-emerald-400 rounded-r-full shadow-xs" />
                    )}

                    {/* Icon */}
                    <div className="relative shrink-0">
                      <Icon
                        className={`h-[18px] w-[18px] transition-all duration-150 ${
                          isActive
                            ? "text-emerald-600 dark:text-emerald-400 scale-105"
                            : "text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 group-hover:scale-105"
                        }`}
                      />
                    </div>

                    {/* Label & Active Dot */}
                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="truncate tracking-tight">
                          {item.label}
                        </span>
                        {isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 ml-1.5 shrink-0" />
                        )}
                      </div>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* System Health Badge at Bottom */}
      <SystemHealthBadge collapsed={collapsed} />
    </aside>
  );
}
