"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { db, serializeBigInt } from "@/lib/db";
import { suratMasuk, suratKeluar } from "@/lib/db/schema";
import { eq, ne, like, desc, and, isNull, sql } from "drizzle-orm";
import {
  syncSuratMasukToSheet,
  syncSuratKeluarToSheet,
} from "@/lib/services/sync-sheets";
import {
  uploadLampiran,
  deleteLampiran,
  getLampiranUrl,
} from "@/lib/services/storage";
import { after } from "next/server";
import { createAuditLog } from "@/lib/audit";

export type ActionResult = {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
  total?: number;
  page?: number;
  pageSize?: number;
};

const MAX_PAGE_SIZE = 10000;
const DEFAULT_PAGE_SIZE = 5000;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const SuratMasukSchema = z
  .object({
    id: z.string().optional().or(z.literal("")),
    nomor_surat: z.string().min(1, "Nomor surat wajib diisi"),
    tanggal_surat: z
      .string()
      .regex(dateRegex, "Format tanggal harus YYYY-MM-DD"),
    tanggal_terima: z
      .string()
      .regex(dateRegex, "Format tanggal harus YYYY-MM-DD"),
    asal_surat: z.string().min(1, "Asal surat wajib diisi"),
    perihal: z.string().min(1, "Perihal wajib diisi"),
    agenda: z.string().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    lampiran: z.string().optional(),
    lampiran_file: z.custom<File | null>().optional(),
  })
  .refine((d) => d.tanggal_terima >= d.tanggal_surat, {
    message: "Tanggal terima tidak boleh sebelum tanggal surat",
    path: ["tanggal_terima"],
  });

const SuratKeluarSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  nomor_surat: z.string().min(1, "Nomor surat wajib diisi"),
  tanggal_surat: z.string().regex(dateRegex, "Format tanggal harus YYYY-MM-DD"),
  agenda: z.string().optional(),
  tujuan_surat: z.string().min(1, "Tujuan surat wajib diisi"),
  perihal: z.string().min(1, "Perihal wajib diisi"),
  unit_kerja: z.string().min(1, "Unit kerja wajib diisi"),
  status: z.enum(["draft", "published", "archived"]).optional(),
  lampiran: z.string().optional(),
  lampiran_file: z.any().optional(),
});

async function syncToSheetSafe(fn: () => Promise<void>, context: string) {
  after(async () => {
    try {
      await fn();
    } catch (error: unknown) {
      console.error(
        `[Sync Error] ${context}:`,
        error instanceof Error ? error.message : error,
      );
    }
  });
}

async function getNextExternalId(
  type: "SM" | "SK",
  maxRetries = 5,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${type}-${year}-`;
  const table = type === "SM" ? suratMasuk : suratKeluar;
  const idColumn = table.externalId;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await db
        .select({ maxId: sql<string>`MAX(${idColumn})` })
        .from(table)
        .where(like(idColumn, `${prefix}%`));

      const maxId = result[0]?.maxId;
      let maxNum = 0;
      if (maxId) {
        const match = maxId.match(new RegExp(`^${prefix}(\\d+)$`));
        if (match) maxNum = parseInt(match[1]);
      }

      const newId = `${prefix}${String(maxNum + 1).padStart(3, "0")}`;
      return newId;
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (
        err?.code === "23505" ||
        err?.message?.includes("unique") ||
        err?.message?.includes("duplicate")
      ) {
        if (attempt < maxRetries - 1) continue;
        throw new Error("Gagal generate ID unik setelah beberapa percobaan.");
      }
      throw error;
    }
  }
  throw new Error("Gagal generate ID unik.");
}

async function checkDuplicateNomorSurat(
  table: typeof suratMasuk | typeof suratKeluar,
  nomorSurat: string,
  excludeExternalId?: string,
): Promise<boolean> {
  const conditions = [
    eq(table.nomorSurat, nomorSurat),
    isNull(table.deletedAt),
  ];
  if (excludeExternalId) {
    conditions.push(ne(table.externalId, excludeExternalId));
  }
  const found = await db
    .select({ id: table.id })
    .from(table)
    .where(and(...conditions))
    .limit(1);
  return found.length > 0;
}

async function handleFileUpload(
  lampiranFile: FormDataEntryValue | null,
  existingLampiran: string | null,
  prefix: "masuk" | "keluar",
  suratId: string,
): Promise<string | null> {
  if (
    !lampiranFile ||
    !(lampiranFile instanceof File) ||
    lampiranFile.size === 0
  ) {
    return existingLampiran || null;
  }

  const predictedUrl = await getLampiranUrl(lampiranFile, prefix, suratId);

  after(async () => {
    if (existingLampiran && existingLampiran !== predictedUrl) {
      await deleteLampiran(existingLampiran).catch(() => {});
    }
    await uploadLampiran(lampiranFile, prefix, suratId).catch(console.error);
  });

  return predictedUrl;
}

// ── SURAT MASUK ──

export async function getSuratMasukAction(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<ActionResult> {
  await requireAuth();
  try {
    const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
    const offset = (Math.max(1, page) - 1) * safePageSize;

    const rows = await db
      .select({
        id: suratMasuk.id,
        externalId: suratMasuk.externalId,
        nomorSurat: suratMasuk.nomorSurat,
        tanggalSurat: suratMasuk.tanggalSurat,
        tanggalTerima: suratMasuk.tanggalTerima,
        asalSurat: suratMasuk.asalSurat,
        perihal: suratMasuk.perihal,
        agenda: suratMasuk.agenda,
        status: suratMasuk.status,
        lampiran: suratMasuk.lampiran,
        createdAt: suratMasuk.createdAt,
        updatedAt: suratMasuk.updatedAt,
        deletedAt: suratMasuk.deletedAt,
        createdBy: suratMasuk.createdBy,
        updatedBy: suratMasuk.updatedBy,
      })
      .from(suratMasuk)
      .where(isNull(suratMasuk.deletedAt))
      .orderBy(desc(suratMasuk.createdAt))
      .limit(safePageSize)
      .offset(offset);

    const total = rows.length;

    const data = rows.map((r) => ({
      id: r.externalId,
      nomor_surat: r.nomorSurat,
      tanggal_surat: r.tanggalSurat,
      tanggal_terima: r.tanggalTerima,
      asal_surat: r.asalSurat,
      perihal: r.perihal,
      agenda: r.agenda || "",
      status: r.status,
      lampiran: r.lampiran || "",
    }));

    return {
      success: true,
      data: serializeBigInt(data),
      total,
      page,
      pageSize: safePageSize,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mengambil data surat masuk",
    };
  }
}

export async function saveSuratMasukAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth();
  try {
    const validated = SuratMasukSchema.safeParse({
      id: formData.get("id")?.toString() || "",
      nomor_surat: formData.get("nomor_surat")?.toString() || "",
      tanggal_surat: formData.get("tanggal_surat")?.toString() || "",
      tanggal_terima: formData.get("tanggal_terima")?.toString() || "",
      asal_surat: formData.get("asal_surat")?.toString() || "",
      perihal: formData.get("perihal")?.toString() || "",
      agenda: formData.get("agenda")?.toString() || "",
      status: formData.get("status")?.toString() || undefined,
      lampiran: formData.get("lampiran")?.toString() || "",
      lampiran_file: formData.get("lampiran_file"),
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { id, lampiran_file, ...fields } = validated.data;
    const isUpdate = !!id && id.startsWith("SM-");

    if (isUpdate) {
      const existing = await db
        .select({
          externalId: suratMasuk.externalId,
          lampiran: suratMasuk.lampiran,
        })
        .from(suratMasuk)
        .where(and(eq(suratMasuk.externalId, id), isNull(suratMasuk.deletedAt)))
        .limit(1);

      if (existing.length === 0) {
        return { success: false, error: "Data surat tidak ditemukan." };
      }

      const isDuplicate = await checkDuplicateNomorSurat(
        suratMasuk,
        fields.nomor_surat,
        id,
      );
      if (isDuplicate) {
        return {
          success: false,
          error: `Nomor surat "${fields.nomor_surat}" sudah terdaftar.`,
        };
      }

      const lampiran = await handleFileUpload(
        lampiran_file ?? null,
        existing[0].lampiran,
        "masuk",
        id,
      );

      await db
        .update(suratMasuk)
        .set({
          nomorSurat: fields.nomor_surat,
          tanggalSurat: fields.tanggal_surat,
          tanggalTerima: fields.tanggal_terima,
          asalSurat: fields.asal_surat,
          perihal: fields.perihal,
          agenda: fields.agenda || null,
          status: fields.status || "published",
          lampiran: lampiran,
          updatedBy: user.id,
          updatedAt: sql`now()`,
        })
        .where(eq(suratMasuk.externalId, id));

      syncToSheetSafe(
        () => syncSuratMasukToSheet({ externalId: id, ...fields }, "update"),
        `update surat masuk ${id}`,
      );
    } else {
      const [isDuplicate, externalId] = await Promise.all([
        checkDuplicateNomorSurat(suratMasuk, fields.nomor_surat),
        getNextExternalId("SM"),
      ]);

      if (isDuplicate) {
        return {
          success: false,
          error: `Nomor surat "${fields.nomor_surat}" sudah terdaftar.`,
        };
      }

      const lampiran = await handleFileUpload(
        lampiran_file ?? null,
        null,
        "masuk",
        externalId,
      );

      await db.insert(suratMasuk).values({
        externalId,
        nomorSurat: fields.nomor_surat,
        tanggalSurat: fields.tanggal_surat,
        tanggalTerima: fields.tanggal_terima,
        asalSurat: fields.asal_surat,
        perihal: fields.perihal,
        agenda: fields.agenda || null,
        status: fields.status || "published",
        lampiran: lampiran,
        createdBy: user.id,
      });

      syncToSheetSafe(
        () => syncSuratMasukToSheet({ externalId, ...fields }, "create"),
        `create surat masuk ${externalId}`,
      );
    }

    await createAuditLog({
      adminId: user.id,
      action: isUpdate ? "UBAH_SURAT_MASUK" : "BUAT_SURAT_MASUK",
      entityType: "surat_masuk",
      entityId: isUpdate ? id : fields.nomor_surat,
      details: {
        nomor_surat: fields.nomor_surat,
        perihal: fields.perihal,
        asal_surat: fields.asal_surat,
      },
    });

    after(() => {
      revalidatePath("/surat-masuk");
    });
    return { success: true, message: "Surat masuk berhasil disimpan" };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal menyimpan data surat masuk",
    };
  }
}

export async function deleteSuratMasukAction(
  id: string,
): Promise<ActionResult> {
  const user = await requireAuth();
  try {
    if (!id) return { success: false, error: "ID tidak valid" };

    const existing = await db
      .select({ externalId: suratMasuk.externalId })
      .from(suratMasuk)
      .where(and(eq(suratMasuk.externalId, id), isNull(suratMasuk.deletedAt)))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: "Data surat tidak ditemukan." };
    }

    await db
      .update(suratMasuk)
      .set({ deletedAt: sql`now()` })
      .where(eq(suratMasuk.externalId, id));

    syncToSheetSafe(
      () =>
        syncSuratMasukToSheet(
          {
            externalId: id,
            nomor_surat: "",
            tanggal_surat: "",
            tanggal_terima: "",
            asal_surat: "",
            perihal: "",
          },
          "delete",
        ),
      `delete surat masuk ${id}`,
    );

    await createAuditLog({
      adminId: user.id,
      action: "HAPUS_SURAT_MASUK",
      entityType: "surat_masuk",
      entityId: id,
    });

    after(() => {
      revalidatePath("/surat-masuk");
    });
    return { success: true, message: "Surat masuk berhasil dihapus" };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal menghapus data surat masuk",
    };
  }
}

// ── SURAT KELUAR ──

export async function getSuratKeluarAction(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<ActionResult> {
  await requireAuth();
  try {
    const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
    const offset = (Math.max(1, page) - 1) * safePageSize;

    const rows = await db
      .select({
        id: suratKeluar.id,
        externalId: suratKeluar.externalId,
        nomorSurat: suratKeluar.nomorSurat,
        tanggalSurat: suratKeluar.tanggalSurat,
        agenda: suratKeluar.agenda,
        tujuanSurat: suratKeluar.tujuanSurat,
        perihal: suratKeluar.perihal,
        unitKerja: suratKeluar.unitKerja,
        status: suratKeluar.status,
        lampiran: suratKeluar.lampiran,
        createdAt: suratKeluar.createdAt,
        updatedAt: suratKeluar.updatedAt,
        deletedAt: suratKeluar.deletedAt,
        createdBy: suratKeluar.createdBy,
        updatedBy: suratKeluar.updatedBy,
      })
      .from(suratKeluar)
      .where(isNull(suratKeluar.deletedAt))
      .orderBy(desc(suratKeluar.createdAt))
      .limit(safePageSize)
      .offset(offset);

    const total = rows.length;

    const data = rows.map((r) => ({
      id: r.externalId,
      nomor_surat: r.nomorSurat,
      tanggal_surat: r.tanggalSurat,
      agenda: r.agenda || "",
      tujuan_surat: r.tujuanSurat,
      perihal: r.perihal,
      unit_kerja: r.unitKerja,
      status: r.status,
      lampiran: r.lampiran || "",
    }));

    return {
      success: true,
      data: serializeBigInt(data),
      total,
      page,
      pageSize: safePageSize,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mengambil data surat keluar",
    };
  }
}

export async function saveSuratKeluarAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth();
  try {
    const validated = SuratKeluarSchema.safeParse({
      id: formData.get("id")?.toString() || "",
      nomor_surat: formData.get("nomor_surat")?.toString() || "",
      tanggal_surat: formData.get("tanggal_surat")?.toString() || "",
      agenda: formData.get("agenda")?.toString() || "",
      tujuan_surat: formData.get("tujuan_surat")?.toString() || "",
      perihal: formData.get("perihal")?.toString() || "",
      unit_kerja: formData.get("unit_kerja")?.toString() || "",
      status: formData.get("status")?.toString() || undefined,
      lampiran: formData.get("lampiran")?.toString() || "",
      lampiran_file: formData.get("lampiran_file"),
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { id, lampiran_file, ...fields } = validated.data;
    const isUpdate = !!id && id.startsWith("SK-");

    if (isUpdate) {
      const existing = await db
        .select({
          externalId: suratKeluar.externalId,
          lampiran: suratKeluar.lampiran,
        })
        .from(suratKeluar)
        .where(
          and(eq(suratKeluar.externalId, id), isNull(suratKeluar.deletedAt)),
        )
        .limit(1);

      if (existing.length === 0) {
        return { success: false, error: "Data surat tidak ditemukan." };
      }

      const isDuplicate = await checkDuplicateNomorSurat(
        suratKeluar,
        fields.nomor_surat,
        id,
      );
      if (isDuplicate) {
        return {
          success: false,
          error: `Nomor surat "${fields.nomor_surat}" sudah terdaftar.`,
        };
      }

      const lampiran = await handleFileUpload(
        lampiran_file,
        existing[0].lampiran,
        "keluar",
        id,
      );

      await db
        .update(suratKeluar)
        .set({
          nomorSurat: fields.nomor_surat,
          tanggalSurat: fields.tanggal_surat,
          agenda: fields.agenda || null,
          tujuanSurat: fields.tujuan_surat,
          perihal: fields.perihal,
          unitKerja: fields.unit_kerja,
          status: fields.status || "published",
          lampiran: lampiran,
          updatedBy: user.id,
          updatedAt: sql`now()`,
        })
        .where(eq(suratKeluar.externalId, id));

      syncToSheetSafe(
        () => syncSuratKeluarToSheet({ externalId: id, ...fields }, "update"),
        `update surat keluar ${id}`,
      );
    } else {
      const [isDuplicate, externalId] = await Promise.all([
        checkDuplicateNomorSurat(suratKeluar, fields.nomor_surat),
        getNextExternalId("SK"),
      ]);

      if (isDuplicate) {
        return {
          success: false,
          error: `Nomor surat "${fields.nomor_surat}" sudah terdaftar.`,
        };
      }

      const lampiran = await handleFileUpload(
        lampiran_file,
        null,
        "keluar",
        externalId,
      );

      await db.insert(suratKeluar).values({
        externalId,
        nomorSurat: fields.nomor_surat,
        tanggalSurat: fields.tanggal_surat,
        agenda: fields.agenda || null,
        tujuanSurat: fields.tujuan_surat,
        perihal: fields.perihal,
        unitKerja: fields.unit_kerja,
        status: fields.status || "published",
        lampiran: lampiran,
        createdBy: user.id,
      });

      syncToSheetSafe(
        () => syncSuratKeluarToSheet({ externalId, ...fields }, "create"),
        `create surat keluar ${externalId}`,
      );
    }

    await createAuditLog({
      adminId: user.id,
      action: isUpdate ? "UBAH_SURAT_KELUAR" : "BUAT_SURAT_KELUAR",
      entityType: "surat_keluar",
      entityId: isUpdate ? id : fields.nomor_surat,
      details: {
        nomor_surat: fields.nomor_surat,
        perihal: fields.perihal,
        tujuan_surat: fields.tujuan_surat,
      },
    });

    after(() => {
      revalidatePath("/surat-keluar");
    });
    return { success: true, message: "Surat keluar berhasil disimpan" };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal menyimpan data surat keluar",
    };
  }
}

export async function deleteSuratKeluarAction(
  id: string,
): Promise<ActionResult> {
  const user = await requireAuth();
  try {
    if (!id) return { success: false, error: "ID tidak valid" };

    const existing = await db
      .select({ externalId: suratKeluar.externalId })
      .from(suratKeluar)
      .where(and(eq(suratKeluar.externalId, id), isNull(suratKeluar.deletedAt)))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: "Data surat tidak ditemukan." };
    }

    await db
      .update(suratKeluar)
      .set({ deletedAt: sql`now()` })
      .where(eq(suratKeluar.externalId, id));

    syncToSheetSafe(
      () =>
        syncSuratKeluarToSheet(
          {
            externalId: id,
            nomor_surat: "",
            tanggal_surat: "",
            agenda: "",
            tujuan_surat: "",
            perihal: "",
            unit_kerja: "",
          },
          "delete",
        ),
      `delete surat keluar ${id}`,
    );

    await createAuditLog({
      adminId: user.id,
      action: "HAPUS_SURAT_KELUAR",
      entityType: "surat_keluar",
      entityId: id,
    });

    after(() => {
      revalidatePath("/surat-keluar");
      revalidatePath("/");
    });
    return { success: true, message: "Surat keluar berhasil dihapus" };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal menghapus data surat keluar",
    };
  }
}

export async function archiveSuratMasukAction(
  id: string,
  archive: boolean = true,
): Promise<ActionResult> {
  const user = await requireAuth();
  try {
    if (!id) return { success: false, error: "ID tidak valid" };

    const newStatus = archive ? "archived" : "published";

    await db
      .update(suratMasuk)
      .set({
        status: newStatus,
        updatedBy: user.id,
        updatedAt: sql`now()`,
      })
      .where(and(eq(suratMasuk.externalId, id), isNull(suratMasuk.deletedAt)));

    await createAuditLog({
      adminId: user.id,
      action: archive ? "ARSIP_SURAT_MASUK" : "PULIHKAN_SURAT_MASUK",
      entityType: "surat_masuk",
      entityId: id,
    });

    after(() => {
      revalidatePath("/surat-masuk");
      revalidatePath("/");
    });

    return {
      success: true,
      message: archive
        ? "Surat masuk berhasil diarsipkan"
        : "Surat masuk berhasil dipulihkan dari arsip",
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mengarsipkan surat masuk",
    };
  }
}

export async function archiveSuratKeluarAction(
  id: string,
  archive: boolean = true,
): Promise<ActionResult> {
  const user = await requireAuth();
  try {
    if (!id) return { success: false, error: "ID tidak valid" };

    const newStatus = archive ? "archived" : "published";

    await db
      .update(suratKeluar)
      .set({
        status: newStatus,
        updatedBy: user.id,
        updatedAt: sql`now()`,
      })
      .where(and(eq(suratKeluar.externalId, id), isNull(suratKeluar.deletedAt)));

    await createAuditLog({
      adminId: user.id,
      action: archive ? "ARSIP_SURAT_KELUAR" : "PULIHKAN_SURAT_KELUAR",
      entityType: "surat_keluar",
      entityId: id,
    });

    after(() => {
      revalidatePath("/surat-keluar");
      revalidatePath("/");
    });

    return {
      success: true,
      message: archive
        ? "Surat keluar berhasil diarsipkan"
        : "Surat keluar berhasil dipulihkan dari arsip",
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mengarsipkan surat keluar",
    };
  }
}
