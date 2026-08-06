import { pgSchema, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const authSchema = pgSchema("auth");

export const users = authSchema.table("users", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
