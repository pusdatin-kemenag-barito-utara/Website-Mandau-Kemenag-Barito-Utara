import {
  uuid,
  text,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { suratSchema } from "./schema";

export const suratMasuk = suratSchema.table(
  "surat_masuk",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalId: text("external_id").notNull().unique(),
    nomorSurat: text("nomor_surat").notNull(),
    tanggalSurat: date("tanggal_surat").notNull(),
    tanggalTerima: date("tanggal_terima").notNull(),
    asalSurat: text("asal_surat").notNull(),
    perihal: text("perihal").notNull(),
    agenda: text("agenda"),
    status: text("status").notNull().default("published"),
    lampiran: text("lampiran"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_surat_masuk_nomor_surat").on(table.nomorSurat),
    index("idx_surat_masuk_tanggal_surat").on(table.tanggalSurat),
    index("idx_surat_masuk_tanggal_terima").on(table.tanggalTerima),
    index("idx_surat_masuk_asal_surat").on(table.asalSurat),
    index("idx_surat_masuk_perihal").on(table.perihal),
    index("idx_surat_masuk_status").on(table.status),
    index("idx_surat_masuk_deleted_at").on(table.deletedAt),
    index("idx_surat_masuk_created_at").on(table.createdAt),
    index("idx_surat_masuk_deleted_created").on(table.deletedAt, table.createdAt),
    sql`ALTER TABLE "surat_masuk" ADD CONSTRAINT "ck_surat_masuk_tanggal" CHECK ("tanggal_terima" >= "tanggal_surat")`,
    sql`ALTER TABLE "surat_masuk" ADD CONSTRAINT "ck_surat_masuk_status" CHECK ("status" IN ('draft', 'published', 'archived'))`,
  ],
);

export const suratKeluar = suratSchema.table(
  "surat_keluar",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalId: text("external_id").notNull().unique(),
    nomorSurat: text("nomor_surat").notNull(),
    tanggalSurat: date("tanggal_surat").notNull(),
    agenda: text("agenda"),
    tujuanSurat: text("tujuan_surat").notNull(),
    perihal: text("perihal").notNull(),
    unitKerja: text("unit_kerja").notNull(),
    status: text("status").notNull().default("published"),
    lampiran: text("lampiran"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_surat_keluar_nomor_surat").on(table.nomorSurat),
    index("idx_surat_keluar_tanggal_surat").on(table.tanggalSurat),
    index("idx_surat_keluar_tujuan_surat").on(table.tujuanSurat),
    index("idx_surat_keluar_unit_kerja").on(table.unitKerja),
    index("idx_surat_keluar_perihal").on(table.perihal),
    index("idx_surat_keluar_status").on(table.status),
    index("idx_surat_keluar_deleted_at").on(table.deletedAt),
    index("idx_surat_keluar_created_at").on(table.createdAt),
    index("idx_surat_keluar_deleted_created").on(table.deletedAt, table.createdAt),
    sql`ALTER TABLE "surat_keluar" ADD CONSTRAINT "ck_surat_keluar_status" CHECK ("status" IN ('draft', 'published', 'archived'))`,
  ],
);
