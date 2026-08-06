"use client";

import type { ReactNode, ElementType } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  description?: string;
  icon?: ElementType;
  className?: string;
  children: ReactNode;
}

export function Card({ title, description, icon: Icon, className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 overflow-hidden",
        className,
      )}
    >
      {(title || description) && (
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-100/50 shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-base font-bold text-slate-800 leading-tight">{title}</h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-500 leading-relaxed font-medium">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
