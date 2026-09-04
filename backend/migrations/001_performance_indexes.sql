-- Migration: 001_performance_indexes.sql
-- Optimasi performa navigasi dan query Tata Naskah (Surat Masuk & Surat Keluar)

-- Composite Index untuk Query Surat Masuk:
-- Query: SELECT ... FROM kemenag_surat.surat_masuk ORDER BY tanggal_terima DESC, created_at DESC LIMIT $1 OFFSET $2;
CREATE INDEX IF NOT EXISTS idx_surat_masuk_composite_sort 
ON kemenag_surat.surat_masuk (tanggal_terima DESC, created_at DESC);

-- Composite Index untuk Query Surat Keluar:
-- Query: SELECT ... FROM kemenag_surat.surat_keluar ORDER BY tanggal_surat DESC, created_at DESC LIMIT $1 OFFSET $2;
CREATE INDEX IF NOT EXISTS idx_surat_keluar_composite_sort 
ON kemenag_surat.surat_keluar (tanggal_surat DESC, created_at DESC);
