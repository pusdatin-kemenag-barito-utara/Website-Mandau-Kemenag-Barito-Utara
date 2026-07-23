import { db } from "@/lib/db";
import { suratMasuk, suratKeluar } from "@/lib/db/schema";
import { isNull, count, sql } from "drizzle-orm";
import { DashboardInteractiveContent } from "@/components/admin/dashboard-interactive-content";

export default async function DashboardPage() {
  const [
    [suratMasukCount],
    [suratKeluarCount],
    [suratMasukBulanIni],
    [suratKeluarBulanIni],
    recentSuratMasuk,
    recentSuratKeluar,
  ] = await Promise.all([
    db
      .select({ total: count() })
      .from(suratMasuk)
      .where(isNull(suratMasuk.deletedAt)),
    db
      .select({ total: count() })
      .from(suratKeluar)
      .where(isNull(suratKeluar.deletedAt)),
    db
      .select({ total: count() })
      .from(suratMasuk)
      .where(
        sql`${isNull(suratMasuk.deletedAt)} AND EXTRACT(MONTH FROM ${suratMasuk.createdAt}) = EXTRACT(MONTH FROM NOW())`,
      ),
    db
      .select({ total: count() })
      .from(suratKeluar)
      .where(
        sql`${isNull(suratKeluar.deletedAt)} AND EXTRACT(MONTH FROM ${suratKeluar.createdAt}) = EXTRACT(MONTH FROM NOW())`,
      ),
    db
      .select()
      .from(suratMasuk)
      .where(isNull(suratMasuk.deletedAt))
      .orderBy(sql`${suratMasuk.createdAt} DESC`)
      .limit(5),
    db
      .select()
      .from(suratKeluar)
      .where(isNull(suratKeluar.deletedAt))
      .orderBy(sql`${suratKeluar.createdAt} DESC`)
      .limit(5),
  ]);

  return (
    <DashboardInteractiveContent
      suratMasukTotal={suratMasukCount?.total || 0}
      suratKeluarTotal={suratKeluarCount?.total || 0}
      suratMasukBulanIni={suratMasukBulanIni?.total || 0}
      suratKeluarBulanIni={suratKeluarBulanIni?.total || 0}
      recentSuratMasuk={recentSuratMasuk}
      recentSuratKeluar={recentSuratKeluar}
    />
  );
}
