package repositories

import (
	"context"

	"e-surat-backend/config"
	"e-surat-backend/models"
)

func GetDashboardStats(ctx context.Context) (models.DashboardStats, error) {
	var stats models.DashboardStats

	// 1. Fetch all 4 counts in 1 single roundtrip query
	row := config.DB.QueryRow(ctx, `
		SELECT 
			(SELECT COUNT(*) FROM kemenag_surat.surat_masuk),
			(SELECT COUNT(*) FROM kemenag_surat.surat_keluar),
			(SELECT COUNT(*) FROM kemenag_surat.surat_masuk 
			 WHERE created_at >= date_trunc('month', NOW())),
			(SELECT COUNT(*) FROM kemenag_surat.surat_keluar 
			 WHERE created_at >= date_trunc('month', NOW()))
	`)
	if err := row.Scan(
		&stats.TotalSuratMasuk,
		&stats.TotalSuratKeluar,
		&stats.SuratMasukBulanIni,
		&stats.SuratKeluarBulanIni,
	); err != nil {
		return stats, err
	}

	// 2. Fetch recent surat masuk & keluar in parallel
	type resultMasuk struct {
		list []models.SuratMasuk
		err  error
	}
	type resultKeluar struct {
		list []models.SuratKeluar
		err  error
	}

	chMasuk := make(chan resultMasuk, 1)
	chKeluar := make(chan resultKeluar, 1)

	go func() {
		list, err := ListSuratMasuk(ctx, 5, 0)
		chMasuk <- resultMasuk{list: list, err: err}
	}()

	go func() {
		list, err := ListSuratKeluar(ctx, 5, 0)
		chKeluar <- resultKeluar{list: list, err: err}
	}()

	resM := <-chMasuk
	if resM.err != nil {
		return stats, resM.err
	}
	stats.RecentSuratMasuk = resM.list

	resK := <-chKeluar
	if resK.err != nil {
		return stats, resK.err
	}
	stats.RecentSuratKeluar = resK.list

	return stats, nil
}