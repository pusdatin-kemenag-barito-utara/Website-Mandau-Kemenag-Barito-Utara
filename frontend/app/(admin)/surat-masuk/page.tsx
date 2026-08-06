import { apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/admin/page-header";
import {
  SuratMasukManager,
  type SuratMasuk,
} from "@/components/admin/persuratan/surat-masuk-manager";
import { Inbox } from "lucide-react";

export const metadata = {
  title: "Surat Masuk",
};

export default async function SuratMasukPage() {
  const result = await apiClient.suratMasuk.list(1, 5000);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surat Masuk"
        description="Kelola dan catat naskah dinas masuk Kantor Kementerian Agama Kabupaten Barito Utara"
        icon={Inbox}
      />

      <SuratMasukManager
        key={`surat-masuk-${result.total}-${(result.data as SuratMasuk[])?.length || 0}`}
        initialData={(result.data as SuratMasuk[]) || []}
        initialTotal={result.total || 0}
      />
    </div>
  );
}
