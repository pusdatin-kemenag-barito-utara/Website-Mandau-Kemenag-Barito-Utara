import { useEffect, useRef } from "react";
import { Toaster, toast as sonnerToast, type ExternalToast } from "sonner";

interface ToastDetail {
  type?: "success" | "error" | "info" | "warning" | "message";
  message: string;
  options?: ExternalToast;
}

export function GlobalToaster() {
  const processedToasts = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const handleToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastDetail>).detail;
      if (!detail || !detail.message) return;

      const { type = "success", message, options = {} } = detail;
      const dedupeKey = `${type}:${message}:${options.description || ""}`;
      const now = Date.now();

      // Skip identical toast events fired within 300ms to eliminate duplicate calls
      const lastTime = processedToasts.current.get(dedupeKey) || 0;
      if (now - lastTime < 300) {
        return;
      }
      processedToasts.current.set(dedupeKey, now);

      // Periodically clean up old entries
      if (processedToasts.current.size > 50) {
        for (const [k, t] of processedToasts.current.entries()) {
          if (now - t > 10000) processedToasts.current.delete(k);
        }
      }

      const opts: ExternalToast = {
        ...options,
        duration: options.duration || (type === "error" ? 4000 : 2800),
      };

      try {
        switch (type) {
          case "success":
            sonnerToast.success(message, opts);
            break;
          case "error":
            sonnerToast.error(message, opts);
            break;
          case "warning":
            sonnerToast.warning(message, opts);
            break;
          case "info":
            sonnerToast.info(message, opts);
            break;
          default:
            sonnerToast.message(message, opts);
            break;
        }
      } catch (err) {
        console.warn("[GlobalToaster] Error invoking toast:", err);
      }
    };

    const handleDismiss = (e: Event) => {
      const { id } = (e as CustomEvent<{ id?: string | number }>).detail || {};
      sonnerToast.dismiss(id);
    };

    window.addEventListener("mandau:toast", handleToast);
    window.addEventListener("mandau:toast:dismiss", handleDismiss);

    return () => {
      window.removeEventListener("mandau:toast", handleToast);
      window.removeEventListener("mandau:toast:dismiss", handleDismiss);
    };
  }, []);

  return (
    <Toaster
      position="top-right"
      duration={2800}
      closeButton
      expand={false}
      visibleToasts={3}
      richColors={false}
      offset="20px"
    />
  );
}
