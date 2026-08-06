const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export interface MasterOptionRaw {
  id: number;
  category: string;
  code: string;
  name: string;
  badge_color?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface DashboardStatsData {
  totalSuratMasuk: number;
  totalSuratKeluar: number;
  suratMasukBulanIni: number;
  suratKeluarBulanIni: number;
  recentSuratMasuk: unknown[];
  recentSuratKeluar: unknown[];
}

export async function getAuthToken(): Promise<string | undefined> {
  if (typeof window !== "undefined") {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("sb-esurat-auth-token="))
      ?.split("=")[1];
  }
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return cookieStore.get("sb-esurat-auth-token")?.value;
  } catch {
    return undefined;
  }
}

export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; total?: number; error?: string; message?: string }> {
  try {
    const token = await getAuthToken();

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    const text = await res.text();
    let json: Record<string, unknown> = {};
    try {
      json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      return {
        success: false,
        error: text || `HTTP ${res.status}: Terjadi kesalahan pada server.`,
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error:
          (json.error as string) ||
          (json.message as string) ||
          `HTTP ${res.status}: Terjadi kesalahan pada server.`,
      };
    }
    return json as { success: boolean; data?: T; total?: number; error?: string; message?: string };
  } catch (err: unknown) {
    console.error("[fetchAPI Error]:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal terhubung ke Golang API Backend.",
    };
  }
}

export const apiClient = {
  dashboard: {
    getStats: () => fetchAPI<DashboardStatsData>("/dashboard/stats"),
  },
  auth: {
    login: (email: string, pass: string, turnstileToken?: string) =>
      fetchAPI<{ token: string; user: unknown }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: pass, turnstile_token: turnstileToken }),
      }),
    getMe: () => fetchAPI<unknown>("/auth/me"),
    logout: () => fetchAPI<unknown>("/auth/logout", { method: "POST" }),
  },
  suratMasuk: {
    list: (page = 1, pageSize = 5000) =>
      fetchAPI<unknown[]>(`/surat-masuk?page=${page}&pageSize=${pageSize}`),
    save: (formData: FormData, isUpdate: boolean, id?: string) =>
      fetchAPI<unknown>(isUpdate ? `/surat-masuk/${id}` : "/surat-masuk", {
        method: isUpdate ? "PUT" : "POST",
        body: formData,
      }),
    delete: (id: string) =>
      fetchAPI<unknown>(`/surat-masuk/${id}`, { method: "DELETE" }),
    archive: (id: string, isArchived: boolean) =>
      fetchAPI<unknown>(`/surat-masuk/${id}/archive`, {
        method: "PUT",
        body: JSON.stringify({ is_archived: isArchived }),
      }),
  },
  suratKeluar: {
    list: (page = 1, pageSize = 5000) =>
      fetchAPI<unknown[]>(`/surat-keluar?page=${page}&pageSize=${pageSize}`),
    save: (formData: FormData, isUpdate: boolean, id?: string) =>
      fetchAPI<unknown>(isUpdate ? `/surat-keluar/${id}` : "/surat-keluar", {
        method: isUpdate ? "PUT" : "POST",
        body: formData,
      }),
    delete: (id: string) =>
      fetchAPI<unknown>(`/surat-keluar/${id}`, { method: "DELETE" }),
    archive: (id: string, isArchived: boolean) =>
      fetchAPI<unknown>(`/surat-keluar/${id}/archive`, {
        method: "PUT",
        body: JSON.stringify({ is_archived: isArchived }),
      }),
  },
  masterOptions: {
    list: () => fetchAPI<MasterOptionRaw[]>("/master-options"),
    create: (data: unknown) =>
      fetchAPI<unknown>("/master-options", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string | number, data: unknown) =>
      fetchAPI<unknown>(`/master-options/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string | number) =>
      fetchAPI<unknown>(`/master-options/${id}`, { method: "DELETE" }),
  },
  lampiran: {
    delete: (id: string, type: "masuk" | "keluar") =>
      fetchAPI<unknown>(`/lampiran/${id}?type=${type}`, { method: "DELETE" }),
  },
};
