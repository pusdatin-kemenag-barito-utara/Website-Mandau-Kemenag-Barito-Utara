import { pgSchema, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const pusdatinSchema = pgSchema("kemenag_pusdatin");

export const pusdatinProfiles = pusdatinSchema.table("profiles", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
