package handlers

import (
	"context"
	"time"

	"e-surat-backend/config"
	"e-surat-backend/models"

	"github.com/gofiber/fiber/v2"
)

type DashboardStats struct {
	TotalSuratMasuk     int                  `json:"totalSuratMasuk"`
	TotalSuratKeluar    int                  `json:"totalSuratKeluar"`
	SuratMasukBulanIni  int                  `json:"suratMasukBulanIni"`
	SuratKeluarBulanIni int                  `json:"suratKeluarBulanIni"`
	RecentSuratMasuk    []models.SuratMasuk  `json:"recentSuratMasuk"`
	RecentSuratKeluar   []models.SuratKeluar `json:"recentSuratKeluar"`
}

func GetDashboardStatsHandler(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var stats DashboardStats

	// 1. Total Surat Masuk
	_ = config.DB.QueryRow(ctx, `SELECT COUNT(*) FROM kemenag_surat.surat_masuk WHERE deleted_at IS NULL`).Scan(&stats.TotalSuratMasuk)

	// 2. Total Surat Keluar
	_ = config.DB.QueryRow(ctx, `SELECT COUNT(*) FROM kemenag_surat.surat_keluar WHERE deleted_at IS NULL`).Scan(&stats.TotalSuratKeluar)

	// 3. Surat Masuk Bulan Ini
	_ = config.DB.QueryRow(ctx, `
		SELECT COUNT(*) FROM kemenag_surat.surat_masuk 
		WHERE deleted_at IS NULL AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW()) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
	`).Scan(&stats.SuratMasukBulanIni)

	// 4. Surat Keluar Bulan Ini
	_ = config.DB.QueryRow(ctx, `
		SELECT COUNT(*) FROM kemenag_surat.surat_keluar 
		WHERE deleted_at IS NULL AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW()) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
	`).Scan(&stats.SuratKeluarBulanIni)

	// 5. Recent 5 Surat Masuk
	rowsSM, errSM := config.DB.Query(ctx, `
		SELECT external_id, nomor_surat, tanggal_surat, tanggal_terima, asal_surat, perihal, COALESCE(agenda, ''), COALESCE(status, 'published'), COALESCE(lampiran, ''), created_at, updated_at
		FROM kemenag_surat.surat_masuk WHERE deleted_at IS NULL
		ORDER BY tanggal_terima DESC, created_at DESC LIMIT 5
	`)
	if errSM == nil {
		for rowsSM.Next() {
			var sm models.SuratMasuk
			_ = rowsSM.Scan(&sm.ID, &sm.NomorSurat, &sm.TanggalSurat, &sm.TanggalTerima, &sm.AsalSurat, &sm.Perihal, &sm.Agenda, &sm.Status, &sm.Lampiran, &sm.CreatedAt, &sm.UpdatedAt)
			stats.RecentSuratMasuk = append(stats.RecentSuratMasuk, sm)
		}
		rowsSM.Close()
	}

	// 6. Recent 5 Surat Keluar
	rowsSK, errSK := config.DB.Query(ctx, `
		SELECT external_id, nomor_surat, tanggal_surat, tujuan_surat, perihal, COALESCE(agenda, ''), COALESCE(unit_kerja, ''), COALESCE(status, 'published'), COALESCE(lampiran, ''), created_at, updated_at
		FROM kemenag_surat.surat_keluar WHERE deleted_at IS NULL
		ORDER BY tanggal_surat DESC, created_at DESC LIMIT 5
	`)
	if errSK == nil {
		for rowsSK.Next() {
			var sk models.SuratKeluar
			_ = rowsSK.Scan(&sk.ID, &sk.NomorSurat, &sk.TanggalSurat, &sk.TujuanSurat, &sk.Perihal, &sk.Agenda, &sk.UnitKerja, &sk.Status, &sk.Lampiran, &sk.CreatedAt, &sk.UpdatedAt)
			stats.RecentSuratKeluar = append(stats.RecentSuratKeluar, sk)
		}
		rowsSK.Close()
	}

	return c.JSON(models.APIResponse{
		Success: true,
		Data:    stats,
	})
}
