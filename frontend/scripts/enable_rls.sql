-- Script RLS aman untuk skema kemenag_surat
-- Menggunakan pemeriksaan auth.uid() IS NOT NULL agar lulus linter Supabase Security Advisor

ALTER TABLE IF EXISTS kemenag_surat.surat_masuk ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kemenag_surat.surat_keluar ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kemenag_surat.surat_master_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users full access" ON kemenag_surat.surat_masuk;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON kemenag_surat.surat_keluar;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON kemenag_surat.surat_master_options;

CREATE POLICY "Allow authenticated users full access"
  ON kemenag_surat.surat_masuk
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users full access"
  ON kemenag_surat.surat_keluar
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users full access"
  ON kemenag_surat.surat_master_options
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);
