import type { UserAccount } from "@/lib/api-client";

export type { UserAccount };

export interface UserStats {
  total: number;
  superAdmin: number;
  admin: number;
  adminBidang: number;
  active: number;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: "super_admin" | "admin" | "admin_bidang";
  bidang: string;
  phone: string;
  isActive: boolean;
}
