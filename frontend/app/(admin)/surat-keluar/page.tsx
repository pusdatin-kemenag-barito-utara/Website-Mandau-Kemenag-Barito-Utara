import { apiClient, type MasterOptionRaw } from "@/lib/api-client";
import { PageHeader } from "@/components/admin/page-header";
import {
  SuratKeluarManager,
  type SuratKeluar,
} from "@/components/admin/persuratan/surat-keluar-manager";
import { Send } from "lucide-react";

export const metadata = {
  title: "Surat Keluar",
};

export default async function SuratKeluarPage() {
  const [result, masterRes] = await Promise.all([
    apiClient.suratKeluar.list(1, 5000),
    apiClient.masterOptions.list(),
  ]);

  const rawMaster = (masterRes.data as MasterOptionRaw[]) || [];
  const agendaData = rawMaster.filter((m) => m.category === "agenda");
  const unitKerjaData = rawMaster.filter((m) => m.category === "unit_kerja");

  const agendaOptions = agendaData.map((o) => o.name);
  const unitKerjaOptions = unitKerjaData.map((o) => o.name);

  const agendaColors: Record<string, string> = {};
  agendaData.forEach((o) => {
    agendaColors[o.name] = o.badge_color || "emerald";
  });

  const unitKerjaColors: Record<string, string> = {};
  unitKerjaData.forEach((o) => {
    unitKerjaColors[o.name] = o.badge_color || "emerald";
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surat Keluar"
        description="Kelola dan registrasi naskah dinas keluar Kantor Kementerian Agama Kabupaten Barito Utara"
        icon={Send}
      />

      <SuratKeluarManager
        key={`surat-keluar-${result.total}-${(result.data as SuratKeluar[])?.length || 0}`}
        initialData={(result.data as SuratKeluar[]) || []}
        initialTotal={result.total || 0}
        initialAgendaOptions={agendaOptions}
        initialUnitKerjaOptions={unitKerjaOptions}
        agendaColors={agendaColors}
        unitKerjaColors={unitKerjaColors}
      />
    </div>
  );
}
