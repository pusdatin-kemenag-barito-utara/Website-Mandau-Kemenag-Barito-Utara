import { useState, useEffect } from "react";
import {
  LayoutGrid,
  FileInput,
  FileOutput,
  FolderKanban,
  ChevronRight,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { m } from "framer-motion";
import { SystemHealthBadge } from "@/components/admin/system-health-badge";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: string;
  superAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutGrid, group: "Utama" },
  {
    label: "Surat Masuk",
    href: "/surat-masuk",
    icon: FileInput,
    group: "Tata Naskah",
  },
  {
    label: "Surat Keluar",
    href: "/surat-keluar",
    icon: FileOutput,
    group: "Tata Naskah",
  },
  {
    label: "Manajemen Surat",
    href: "/manajemen-surat",
    icon: FolderKanban,
    group: "Sistem",
    superAdminOnly: true,
  },
];

const GROUP_ORDER = ["Utama", "Tata Naskah", "Sistem"];

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
  const [pathname, setPathname] = useState("");

  useEffect(() => {
    const updatePath = () => setPathname(window.location.pathname);
    updatePath();
    document.addEventListener("astro:page-load", updatePath);
    window.addEventListener("popstate", updatePath);
    return () => {
      document.removeEventListener("astro:page-load", updatePath);
      window.removeEventListener("popstate", updatePath);
    };
  }, []);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.superAdminOnly || isSuperAdmin,
  );

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: visibleItems.filter((item) => item.group === group),
  }));

  return (
    <div
      className={`relative flex flex-col h-full bg-[#0f131a] border-r border-white/5 transition-all duration-300 ease-in-out ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Floating Edge Toggle Button on Sidebar Border */}
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -right-3.5 top-5 z-40 h-7 w-7 rounded-full bg-[#1a1e29] border border-white/15 text-slate-300 hover:text-white hover:bg-emerald-600 hover:border-emerald-500 shadow-md flex items-center justify-center transition-all duration-200"
          title={collapsed ? "Buka Sidebar" : "Tutup Sidebar"}
        >
          <ChevronLeft
            className={`h-4 w-4 transition-transform duration-300 ${
              collapsed ? "rotate-180 text-emerald-400" : ""
            }`}
          />
        </button>
      )}
      {/* Logo & Branding */}
      <div
        className={`flex items-center h-16 border-b border-white/5 shrink-0 ${
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
          <div className="relative w-8 h-8 shrink-0 flex items-center justify-center drop-shadow-md group-hover/logo:scale-105 transition-transform">
            <img
              src="/mandau.png"
              alt="Logo SI MANDAU"
              width={32}
              height={32}
              className="object-contain w-full h-full"
            />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex flex-col justify-center">
              <p className="text-[14px] font-black text-white tracking-wide truncate leading-tight group-hover/logo:text-emerald-300 transition-colors">
                SI MANDAU
              </p>
              <p className="text-[9.5px] font-extrabold text-emerald-400/90 uppercase tracking-wider truncate leading-tight mt-0.5">
                Kemenag Barito Utara
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5 custom-scrollbar">
        {grouped.map(({ group, items }) =>
          items.length > 0 ? (
            <div key={group}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-extrabold text-slate-400/50 uppercase tracking-widest">
                  {group}
                </p>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      data-astro-prefetch="hover"
                      onClick={onLinkClick}
                      className={`group relative flex items-center py-2.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
                        collapsed ? "justify-center px-0" : "gap-3 px-3.5"
                      } ${
                        isActive
                          ? "text-emerald-300 font-bold"
                          : "text-slate-300/70 hover:text-white"
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      {/* Active Motion Background Pill */}
                      {isActive && (
                        <m.div
                          layoutId="active-sidebar-pill"
                          className="absolute inset-0 bg-emerald-500/10 ring-1 ring-emerald-500/30 rounded-xl"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}

                      {/* Active Left Indicator */}
                      {isActive && !collapsed && (
                        <m.div
                          layoutId="active-sidebar-line"
                          className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-r-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}

                      {/* Hover subtle background */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-200" />
                      )}

                      {/* Animated Icon */}
                      <m.div
                        whileHover={{ scale: 1.12, rotate: 2 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative z-10 shrink-0"
                      >
                        <Icon
                          className={`h-[18px] w-[18px] transition-colors duration-200 ${
                            isActive
                              ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                              : "text-slate-400 group-hover:text-emerald-400"
                          }`}
                        />
                      </m.div>

                      {/* Label & Active Chevron */}
                      {!collapsed && (
                        <>
                          <span className="truncate relative z-10 tracking-tight flex-1">
                            {item.label}
                          </span>
                          {isActive && (
                            <ChevronRight className="h-3.5 w-3.5 text-emerald-400 shrink-0 relative z-10 opacity-80" />
                          )}
                        </>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null,
        )}
      </nav>

      {/* System health badge */}
      <SystemHealthBadge collapsed={collapsed} />
    </div>
  );
}
