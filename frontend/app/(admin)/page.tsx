import { apiClient } from "@/lib/api-client";
import {
  DashboardInteractiveContent,
  type SuratMasukItem,
  type SuratKeluarItem,
} from "@/components/admin/dashboard-interactive-content";

export default async function DashboardPage() {
  const res = await apiClient.dashboard.getStats();
  const stats = res.data || {
    totalSuratMasuk: 0,
    totalSuratKeluar: 0,
    suratMasukBulanIni: 0,
    suratKeluarBulanIni: 0,
    recentSuratMasuk: [],
    recentSuratKeluar: [],
  };

  return (
    <DashboardInteractiveContent
      suratMasukTotal={stats.totalSuratMasuk || 0}
      suratKeluarTotal={stats.totalSuratKeluar || 0}
      suratMasukBulanIni={stats.suratMasukBulanIni || 0}
      suratKeluarBulanIni={stats.suratKeluarBulanIni || 0}
      recentSuratMasuk={(stats.recentSuratMasuk as unknown as SuratMasukItem[]) || []}
      recentSuratKeluar={(stats.recentSuratKeluar as unknown as SuratKeluarItem[]) || []}
    />
  );
}
