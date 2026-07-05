"use server";

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusdatinUsers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateOwnProfileAction(nama: string) {
  const user = await requireAuth();
  try {
    if (!nama || nama.trim() === "") {
      return { success: false, error: "Nama tidak boleh kosong" };
    }
    
    if (!user.email) throw new Error("Email tidak ditemukan");

    await db
      .update(pusdatinUsers)
      .set({ name: nama, updatedAt: sql`now()` })
      .where(eq(pusdatinUsers.email, user.email));
    
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengubah profil" };
  }
}
