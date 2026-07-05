import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";

export async function createAuditLog({
  adminId,
  action,
  entityType,
  entityId,
  details,
}: {
  adminId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    const headerList = await headers();
    const rawIp = headerList.get("x-forwarded-for") || "";
    const ip = rawIp.split(",")[0]?.trim() || "unknown";

    const target = `${entityType || "unknown"}:${entityId || "unknown"}`;

    await db.execute(sql`
      INSERT INTO kemenag_pusdatin.audit_logs (action, target, target_schema, performed_by, after_state, ip)
      SELECT 
        ${action}, 
        ${target}, 
        'e-surat-kemenag', 
        COALESCE((SELECT email FROM kemenag_pusdatin.users WHERE id::varchar = ${adminId}), ${adminId}), 
        ${JSON.stringify(details || {})}::jsonb, 
        ${ip}
    `);
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
