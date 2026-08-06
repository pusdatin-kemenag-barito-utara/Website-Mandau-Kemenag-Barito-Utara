"use client";

import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  variant?: "danger" | "warning" | "info";
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = "danger",
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  loading = false,
  onConfirm,
}: AlertDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-[#1a1d24] shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden p-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div
            className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center border",
              variant === "danger" && "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20",
              variant === "warning" && "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20",
              variant === "info" && "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
            )}
          >
            {variant === "danger" && <AlertTriangle className="h-6 w-6" />}
            {variant === "warning" && <ShieldAlert className="h-6 w-6" />}
            {variant === "info" && <Info className="h-6 w-6" />}
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : variant === "warning" ? "secondary" : "default"}
            onClick={onConfirm}
            disabled={loading}
            className="flex-1"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
