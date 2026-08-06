import { Client } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log("Terhubung ke database.");

    // Copy surat_masuk
    console.log("Memulai migrasi data surat_masuk...");
    const resMasuk = await client.query(`
      INSERT INTO kemenag_surat.surat_masuk 
        (id, external_id, nomor_surat, tanggal_surat, tanggal_terima, asal_surat, perihal, agenda, status, lampiran, created_by, updated_by, deleted_at, created_at, updated_at)
      SELECT 
        id, external_id, nomor_surat, tanggal_surat, tanggal_terima, asal_surat, perihal, agenda, status, lampiran, created_by, updated_by, deleted_at, created_at, updated_at
      FROM kemenag_ptsp.ptsp_surat_masuk
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log(`Berhasil menyalin ${resMasuk.rowCount} baris ke kemenag_surat.surat_masuk.`);

    // Copy surat_keluar
    console.log("Memulai migrasi data surat_keluar...");
    const resKeluar = await client.query(`
      INSERT INTO kemenag_surat.surat_keluar 
        (id, external_id, nomor_surat, tanggal_surat, agenda, tujuan_surat, perihal, unit_kerja, status, lampiran, created_by, updated_by, deleted_at, created_at, updated_at)
      SELECT 
        id, external_id, nomor_surat, tanggal_surat, agenda, tujuan_surat, perihal, unit_kerja, status, lampiran, created_by, updated_by, deleted_at, created_at, updated_at
      FROM kemenag_ptsp.ptsp_surat_keluar
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log(`Berhasil menyalin ${resKeluar.rowCount} baris ke kemenag_surat.surat_keluar.`);

    console.log("Migrasi selesai!");
  } catch (error) {
    console.error("Terjadi kesalahan saat migrasi:", error);
  } finally {
    await client.end();
  }
}

main();
