import { apiClient } from "@/lib/api-client";
import { redirect } from "next/navigation";
import { cache } from "react";

export const getCurrentUser = cache(async () => {
  const meRes = await apiClient.auth.getMe();
  if (!meRes.success || !meRes.data) {
    return null;
  }
  return meRes.data as {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    is_super_admin?: boolean;
    isSuper?: boolean;
  };
});

export const requireAuth = cache(async () => {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
});

export const isSuperAdmin = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return false;
  return Boolean(
    user.is_super_admin ||
      user.isSuper ||
      user.role === "super_admin" ||
      user.email === process.env.SUPER_ADMIN_EMAIL,
  );
});

export const requireSuperAdmin = cache(async () => {
  const user = await requireAuth();
  const isSuper = Boolean(
    user.is_super_admin ||
      user.isSuper ||
      user.role === "super_admin" ||
      user.email === process.env.SUPER_ADMIN_EMAIL,
  );
  if (!isSuper) {
    throw new Error("Forbidden: only super admin can perform this action");
  }
  return user;
});
