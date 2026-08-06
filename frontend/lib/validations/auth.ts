import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .toLowerCase()
    .email("Format email tidak valid")
    .max(255, "Email terlalu panjang"),
  password: z
    .string()
    .min(1, "Password wajib diisi")
    .min(6, "Password minimal 6 karakter")
    .max(128, "Password terlalu panjang"),
});

export type LoginInput = z.infer<typeof loginSchema>;
