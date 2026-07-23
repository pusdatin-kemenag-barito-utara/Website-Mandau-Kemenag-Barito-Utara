import { getSuratMasukAction } from "@/lib/actions/admin-persuratan";

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
  const result = await getSuratMasukAction(1, 1000);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surat Masuk"
        description="Kelola surat masuk Kemenag Barito Utara"
        icon={Inbox}
        externalLink="https://docs.google.com/spreadsheets/d/1C8OanScMPs45xNcWHfEldzOjVGLcKQiSL8TZdrxryg8"
      />
      <SuratMasukManager
        initialData={result.success ? (result.data as SuratMasuk[]) : []}
        initialTotal={result.success ? result.total || 0 : 0}
      />
    </div>
  );
}
