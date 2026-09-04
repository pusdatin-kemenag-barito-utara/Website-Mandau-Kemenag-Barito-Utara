function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return import.meta.env.PUBLIC_API_URL || "/api/v1";
  }
  const goApi = process.env.GO_API_URL || "http://127.0.0.1:8080";
  return `${goApi.replace(/\/+$/, "")}/api/v1`;
}

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

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  is_super_admin?: boolean;
  isSuper?: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "admin_bidang";
  bidang: string;
  avatar?: string;
  phone?: string;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: "admin" | "admin_bidang";
  bidang?: string;
  phone?: string;
  is_active?: boolean;
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  password?: string;
  role: "super_admin" | "admin" | "admin_bidang";
  bidang?: string;
  phone?: string;
  is_active?: boolean;
}

export function getAuthToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("sb-esurat-auth-token="))
    ?.split("=")[1];
}

export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
): Promise<{ success: boolean; data?: T; total?: number; error?: string; message?: string }> {
  try {
    const authToken = token ?? getAuthToken();
    const baseUrl = getBaseUrl();

    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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
      if (res.status === 401) {
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          document.cookie = "sb-esurat-auth-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
          window.location.replace("/login");
        }
      }
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

export function createApiClient(token?: string) {
  const call = <T>(endpoint: string, options?: RequestInit) =>
    fetchAPI<T>(endpoint, options, token);

  return {
    dashboard: {
      getStats: () => call<DashboardStatsData>("/dashboard/stats"),
    },
    auth: {
      login: (email: string, pass: string, turnstileToken?: string) =>
        call<{ token: string; user: unknown }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password: pass, turnstile_token: turnstileToken }),
        }),
      getMe: () => call<AuthUser>("/auth/me"),
      logout: () => call<unknown>("/auth/logout", { method: "POST" }),
    },
    suratMasuk: {
      list: (page = 1, pageSize = 5000) =>
        call<unknown[]>(`/surat-masuk?page=${page}&pageSize=${pageSize}`),
      get: (id: string) => call<unknown>(`/surat-masuk/${id}`),
      save: (formData: FormData, isUpdate: boolean, id?: string) =>
        call<unknown>(isUpdate ? `/surat-masuk/${id}` : "/surat-masuk", {
          method: isUpdate ? "PUT" : "POST",
          body: formData,
        }),
      delete: (id: string) =>
        call<unknown>(`/surat-masuk/${id}`, { method: "DELETE" }),
      archive: (id: string, isArchived: boolean) =>
        call<unknown>(`/surat-masuk/${id}/archive`, {
          method: "PUT",
          body: JSON.stringify({ is_archived: isArchived }),
        }),
    },
    suratKeluar: {
      list: (page = 1, pageSize = 5000) =>
        call<unknown[]>(`/surat-keluar?page=${page}&pageSize=${pageSize}`),
      get: (id: string) => call<unknown>(`/surat-keluar/${id}`),
      save: (formData: FormData, isUpdate: boolean, id?: string) =>
        call<unknown>(isUpdate ? `/surat-keluar/${id}` : "/surat-keluar", {
          method: isUpdate ? "PUT" : "POST",
          body: formData,
        }),
      delete: (id: string) =>
        call<unknown>(`/surat-keluar/${id}`, { method: "DELETE" }),
      archive: (id: string, isArchived: boolean) =>
        call<unknown>(`/surat-keluar/${id}/archive`, {
          method: "PUT",
          body: JSON.stringify({ is_archived: isArchived }),
        }),
    },
    masterOptions: {
      list: () => call<MasterOptionRaw[]>("/master-options"),
      create: (data: unknown) =>
        call<unknown>("/master-options", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string | number, data: unknown) =>
        call<unknown>(`/master-options/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      reorder: (items: { id: string; sort_order: number }[]) =>
        call<unknown>("/master-options/reorder", {
          method: "PUT",
          body: JSON.stringify({ items }),
        }),
      delete: (id: string | number) =>
        call<unknown>(`/master-options/${id}`, { method: "DELETE" }),
    },
    lampiran: {
      delete: (id: string, type: "masuk" | "keluar") =>
        call<unknown>(`/lampiran/${id}?type=${type}`, { method: "DELETE" }),
    },
    users: {
      list: (search = "", role = "all") => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (role && role !== "all") params.append("role", role);
        const query = params.toString() ? `?${params.toString()}` : "";
        return call<UserAccount[]>(`/users${query}`);
      },
      get: (id: string) => call<UserAccount>(`/users/${id}`),
      create: (data: CreateUserPayload) =>
        call<UserAccount>("/users", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateUserPayload) =>
        call<UserAccount>(`/users/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        call<unknown>(`/users/${id}`, { method: "DELETE" }),
    },
  };
}

export const apiClient = createApiClient();