import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
  );
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function getStatusTone(status: string): "success" | "danger" | "warning" | "info" | "muted" {
  const tones: Record<string, "success" | "danger" | "warning" | "info" | "muted"> = {
    published: "success",
    draft: "info",
    archived: "muted",
    completed: "success",
    rejected: "danger",
    pending: "warning",
  };
  return tones[status] || "info";
}

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  published: "Terbit",
  draft: "Draf",
  archived: "Arsip",
  completed: "Selesai",
  rejected: "Ditolak",
  pending: "Menunggu",
  approved: "Disetujui",
  submitted: "Terkirim",
  under_review: "Ditinjau",
  revision_required: "Revisi",
  spam: "Spam",
};
