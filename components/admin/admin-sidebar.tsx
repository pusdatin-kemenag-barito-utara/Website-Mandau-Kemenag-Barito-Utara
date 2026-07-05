"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Send,
  Settings2,
  type LucideIcon,
  ChevronRight,
} from "lucide-react";
import { SystemHealthBadge } from "@/components/admin/system-health-badge";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: string;
  superAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, group: "Utama" },
  {
    label: "Surat Masuk",
    href: "/surat-masuk",
    icon: Inbox,
    group: "Tata Naskah",
  },
  {
    label: "Surat Keluar",
    href: "/surat-keluar",
    icon: Send,
    group: "Tata Naskah",
  },

  {
    label: "Manajemen Surat",
    href: "/manajemen-surat",
    icon: Settings2,
    group: "Sistem",
    superAdminOnly: true,
  },
];

const GROUP_ORDER = ["Utama", "Tata Naskah", "Sistem"];

export function AdminSidebar({
  collapsed,
  isSuperAdmin = false,
  onLinkClick,
}: {
  collapsed: boolean;
  isSuperAdmin?: boolean;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.superAdminOnly || isSuperAdmin,
  );

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: visibleItems.filter((item) => item.group === group),
  }));

  return (
    <div
      className={`flex flex-col h-full bg-[#0f1117] transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0 relative overflow-hidden p-1.5">
          <Image
            src="/copy.png"
            alt="Logo E-Surat"
            fill
            className="object-contain p-1.5"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[15px] font-black text-white tracking-wide truncate">
              SI MANDAU
            </p>
            <p className="text-[9px] font-bold text-emerald-400/90 uppercase tracking-[0.05em] truncate leading-tight">
              Kemenag Barito Utara
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6 custom-scrollbar">
        {grouped.map(({ group, items }) =>
          items.length > 0 ? (
            <div key={group}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-extrabold text-white/20 uppercase tracking-widest">
                  {group}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onLinkClick}
                      className={`group/link flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[13px] uppercase tracking-wider font-bold transition-all duration-300 relative overflow-hidden ${
                        isActive
                          ? "text-emerald-400 shadow-sm ring-1 ring-emerald-500/20 bg-emerald-500/10"
                          : "text-white/60 hover:text-white hover:translate-x-1"
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      {/* Hover Background Animation */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-white/5 translate-y-full group-hover/link:translate-y-0 transition-transform duration-300 ease-out rounded-xl z-0" />
                      )}

                      {/* Active Indicator Bar */}
                      {isActive && !collapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-3/4 bg-emerald-400 rounded-r-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      )}

                      <item.icon
                        className={`h-5 w-5 shrink-0 transition-transform duration-300 relative z-10 ${
                          isActive
                            ? "text-emerald-400 scale-110 drop-shadow-md"
                            : "text-white/40 group-hover/link:text-emerald-400/80 group-hover/link:scale-110"
                        }`}
                      />
                      {!collapsed && (
                        <>
                          <span className="truncate relative z-10 tracking-wide">
                            {item.label}
                          </span>
                          {isActive && (
                            <ChevronRight className="h-4 w-4 ml-auto text-emerald-400 shrink-0 relative z-10 drop-shadow-md" />
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null,
        )}
      </nav>

      {/* System health */}
      <SystemHealthBadge />
    </div>
  );
}
