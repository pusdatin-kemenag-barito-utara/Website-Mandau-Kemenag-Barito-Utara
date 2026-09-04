import type React from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";

export type ToastOptions = ExternalToast;
export type TitleT = Parameters<typeof sonnerToast.success>[0];

// Generate deduplication ID
function getDedupeId(message: TitleT, id?: string | number) {
  if (id !== undefined) return id;
  const str = typeof message === "string" ? message.slice(0, 30).replace(/\s+/g, "-") : "toast";
  return `mandau-toast-${str}-${Date.now()}`;
}

/**
 * Resilient Universal Toast Bridge for Astro Islands.
 * Calls Sonner directly AND dispatches window event to ensure
 * toasts reach the toaster across any island boundary.
 */
export const toast = {
  success(message: TitleT, options?: ExternalToast) {
    const toastId = getDedupeId(message, options?.id);
    const mergedOpts: ExternalToast = { ...options, id: toastId };
    try {
      sonnerToast.success(message, mergedOpts);
    } catch {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mandau:toast", {
          detail: { type: "success", message, options: mergedOpts },
        })
      );
    }
    return toastId;
  },

  error(message: TitleT, options?: ExternalToast) {
    const toastId = getDedupeId(message, options?.id);
    const mergedOpts: ExternalToast = { ...options, id: toastId };
    try {
      sonnerToast.error(message, mergedOpts);
    } catch {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mandau:toast", {
          detail: { type: "error", message, options: mergedOpts },
        })
      );
    }
    return toastId;
  },

  info(message: TitleT, options?: ExternalToast) {
    const toastId = getDedupeId(message, options?.id);
    const mergedOpts: ExternalToast = { ...options, id: toastId };
    try {
      sonnerToast.info(message, mergedOpts);
    } catch {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mandau:toast", {
          detail: { type: "info", message, options: mergedOpts },
        })
      );
    }
    return toastId;
  },

  warning(message: TitleT, options?: ExternalToast) {
    const toastId = getDedupeId(message, options?.id);
    const mergedOpts: ExternalToast = { ...options, id: toastId };
    try {
      sonnerToast.warning(message, mergedOpts);
    } catch {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mandau:toast", {
          detail: { type: "warning", message, options: mergedOpts },
        })
      );
    }
    return toastId;
  },

  message(message: TitleT, options?: ExternalToast) {
    const toastId = getDedupeId(message, options?.id);
    const mergedOpts: ExternalToast = { ...options, id: toastId };
    try {
      sonnerToast.message(message, mergedOpts);
    } catch {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mandau:toast", {
          detail: { type: "message", message, options: mergedOpts },
        })
      );
    }
    return toastId;
  },

  dismiss(id?: string | number) {
    try {
      sonnerToast.dismiss(id);
    } catch {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mandau:toast:dismiss", {
          detail: { id },
        })
      );
    }
  },
};

// Expose on window for easy developer/console usage
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__mandau_toast = toast;
}
