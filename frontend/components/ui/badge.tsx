"use client";

import { cn, getStatusTone, REQUEST_STATUS_LABELS } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "info";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        variant === "default" && "bg-slate-50 text-slate-600 ring-slate-200",
        variant === "success" && "bg-emerald-50 text-emerald-700 ring-emerald-200",
        variant === "danger" && "bg-red-50 text-red-700 ring-red-200",
        variant === "warning" && "bg-amber-50 text-amber-700 ring-amber-200",
        variant === "info" && "bg-blue-50 text-blue-700 ring-blue-200",
        className,
      )}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const tone = getStatusTone(status);
  const label = REQUEST_STATUS_LABELS[status] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        tone === "success" && "bg-emerald-50 text-emerald-700 ring-emerald-200",
        tone === "danger" && "bg-red-50 text-red-700 ring-red-200",
        tone === "warning" && "bg-amber-50 text-amber-700 ring-amber-200",
        tone === "info" && "bg-blue-50 text-blue-700 ring-blue-200",
        tone === "muted" && "bg-slate-50 text-slate-500 ring-slate-200",
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "success" && "bg-emerald-500",
          tone === "danger" && "bg-red-500",
          tone === "warning" && "bg-amber-500",
          tone === "info" && "bg-blue-500",
          tone === "muted" && "bg-slate-400",
        )}
      />
      {label}
    </span>
  );
}
