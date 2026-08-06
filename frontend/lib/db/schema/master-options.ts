import { suratSchema } from "./schema";
import { uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const masterOptions = suratSchema.table("surat_master_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  kategori: text("kategori").notNull(),
  label: text("label").notNull(),
  warna: text("warna").notNull().default("emerald"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
