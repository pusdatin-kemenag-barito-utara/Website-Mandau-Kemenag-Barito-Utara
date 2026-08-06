"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "default" &&
          "bg-[#059669] text-white shadow-sm shadow-emerald-500/20 hover:bg-[#047857] hover:shadow-md hover:shadow-emerald-500/25 focus-visible:ring-[#059669] active:scale-[0.98]",
        variant === "secondary" &&
          "bg-slate-800 dark:bg-slate-700 text-white shadow-sm hover:bg-slate-900 dark:hover:bg-slate-600 focus-visible:ring-slate-800 active:scale-[0.98]",
        variant === "danger" &&
          "bg-red-600 text-white shadow-sm shadow-red-500/20 hover:bg-red-700 hover:shadow-md hover:shadow-red-500/25 focus-visible:ring-red-600 active:scale-[0.98]",
        variant === "outline" &&
          "border border-slate-300 dark:border-white/20 bg-white dark:bg-transparent text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-white/30 focus-visible:ring-slate-400 active:scale-[0.98]",
        variant === "ghost" &&
          "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-slate-100 focus-visible:ring-slate-400",
        className,
      )}
      {...props}
    />
  );
}
