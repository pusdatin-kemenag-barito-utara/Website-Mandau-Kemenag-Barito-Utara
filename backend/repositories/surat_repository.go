package repositories

import (
	"context"
	"errors"
	"fmt"
	"time"

	"e-surat-backend/config"
	"e-surat-backend/models"

	"github.com/jackc/pgx/v5"
)

// ─────────── Surat Masuk ───────────

func CountSuratMasuk(ctx context.Context) (int, error) {
	var total int
	err := config.DB.QueryRow(ctx, `SELECT COUNT(*) FROM kemenag_surat.surat_masuk`).Scan(&total)
	return total, err
}

func CountSuratMasukBulanIni(ctx context.Context) (int, error) {
	var total int
	err := config.DB.QueryRow(ctx, `
		SELECT COUNT(*) FROM kemenag_surat.surat_masuk
		WHERE created_at >= date_trunc('month', NOW())
	`).Scan(&total)
	return total, err
}

func ListSuratMasuk(ctx context.Context, limit, offset int) ([]models.SuratMasuk, error) {
	rows, err := config.DB.Query(ctx, `
		SELECT external_id, nomor_surat, tanggal_surat::text, tanggal_terima::text,
		       asal_surat, perihal, COALESCE(agenda, ''), COALESCE(status, 'published'),
		       COALESCE(lampiran, ''), created_at, updated_at
		FROM kemenag_surat.surat_masuk
		ORDER BY tanggal_terima DESC, created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []models.SuratMasuk{}
	for rows.Next() {
		var sm models.SuratMasuk
		if err := rows.Scan(
			&sm.ID, &sm.NomorSurat, &sm.TanggalSurat, &sm.TanggalTerima,
			&sm.AsalSurat, &sm.Perihal, &sm.Agenda, &sm.Status,
			&sm.Lampiran, &sm.CreatedAt, &sm.UpdatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, sm)
	}
	return list, rows.Err()
}

func GetSuratMasukLampiran(ctx context.Context, id string) (string, error) {
	var lampiran string
	err := config.DB.QueryRow(ctx,
		`SELECT COALESCE(lampiran, '') FROM kemenag_surat.surat_masuk WHERE external_id = $1`, id,
	).Scan(&lampiran)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return lampiran, err
}

func GetSuratMasukByID(ctx context.Context, id string) (models.SuratMasuk, error) {
	var sm models.SuratMasuk
	err := config.DB.QueryRow(ctx, `
		SELECT external_id, nomor_surat, tanggal_surat::text, tanggal_terima::text,
		       asal_surat, perihal, COALESCE(agenda, ''), COALESCE(status, 'published'),
		       COALESCE(lampiran, ''), created_at, updated_at
		FROM kemenag_surat.surat_masuk
		WHERE external_id = $1
	`, id).Scan(
		&sm.ID, &sm.NomorSurat, &sm.TanggalSurat, &sm.TanggalTerima,
		&sm.AsalSurat, &sm.Perihal, &sm.Agenda, &sm.Status,
		&sm.Lampiran, &sm.CreatedAt, &sm.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return sm, ErrNotFound
	}
	return sm, err
}

// CreateSuratMasuk inserts a new surat masuk inside a transaction guarded by an
// advisory lock so external_id (SM-YYYY-NNN) is never duplicated under concurrency.
// resolveLampiran, when non-nil, is called inside the transaction with the
// generated external_id and returns the lampiran URL to persist.
func CreateSuratMasuk(ctx context.Context, nomorSurat, tanggalSurat, tanggalTerima, asalSurat, perihal, agenda, status, userID string, resolveLampiran func(ctx context.Context, externalID string) (string, error)) (string, error) {
	tx, err := config.DB.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)

	var dupCount int
	if err := tx.QueryRow(ctx, `SELECT COUNT(*) FROM kemenag_surat.surat_masuk WHERE nomor_surat = $1`, nomorSurat).Scan(&dupCount); err != nil {
		return "", err
	}
	if dupCount > 0 {
		return "", ErrDuplicate
	}

	if _, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtext($1))`, "surat-masuk-seq"); err != nil {
		return "", err
	}

	year := time.Now().Format("2006")
	prefix := "SM-" + year + "-"
	var maxID string
	if err := tx.QueryRow(ctx, `SELECT COALESCE(MAX(external_id), '') FROM kemenag_surat.surat_masuk WHERE external_id LIKE $1`, prefix+"%").Scan(&maxID); err != nil {
		return "", err
	}

	nextNum := 1
	if maxID != "" {
		var currYear, currNum int
		if _, err := fmt.Sscanf(maxID, "SM-%d-%d", &currYear, &currNum); err == nil {
			nextNum = currNum + 1
		}
	}
	externalID := fmt.Sprintf("SM-%s-%03d", year, nextNum)

	lampiranURL := ""
	if resolveLampiran != nil {
		lampiranURL, err = resolveLampiran(ctx, externalID)
		if err != nil {
			return "", err
		}
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO kemenag_surat.surat_masuk (
			external_id, nomor_surat, tanggal_surat, tanggal_terima,
			asal_surat, perihal, agenda, status, lampiran, created_by
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, externalID, nomorSurat, tanggalSurat, tanggalTerima, asalSurat, perihal, agenda, status, lampiranURL, userID)
	if err != nil {
		return "", err
	}

	if err := tx.Commit(ctx); err != nil {
		return "", err
	}
	return externalID, nil
}

func UpdateSuratMasuk(ctx context.Context, id, nomorSurat, tanggalSurat, tanggalTerima, asalSurat, perihal, agenda, status, lampiranURL, userID string) error {
	tag, err := config.DB.Exec(ctx, `
		UPDATE kemenag_surat.surat_masuk
		SET nomor_surat = $1, tanggal_surat = $2, tanggal_terima = $3,
		    asal_surat = $4, perihal = $5, agenda = $6, status = $7,
		    lampiran = $8, updated_by = $9, updated_at = NOW()
		WHERE external_id = $10
	`, nomorSurat, tanggalSurat, tanggalTerima, asalSurat, perihal, agenda, status, lampiranURL, userID, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func DeleteSuratMasuk(ctx context.Context, id string) error {
	_, err := config.DB.Exec(ctx, `DELETE FROM kemenag_surat.surat_masuk WHERE external_id = $1`, id)
	return err
}

func SetSuratMasukStatus(ctx context.Context, id, status, userID string) error {
	_, err := config.DB.Exec(ctx, `
		UPDATE kemenag_surat.surat_masuk SET status = $1, updated_by = $2, updated_at = NOW()
		WHERE external_id = $3
	`, status, userID, id)
	return err
}

func ClearSuratMasukLampiran(ctx context.Context, id, userID string) error {
	_, err := config.DB.Exec(ctx, `
		UPDATE kemenag_surat.surat_masuk SET lampiran = '', updated_by = $1, updated_at = NOW()
		WHERE external_id = $2
	`, userID, id)
	return err
}

// ─────────── Surat Keluar ───────────

func CountSuratKeluar(ctx context.Context) (int, error) {
	var total int
	err := config.DB.QueryRow(ctx, `SELECT COUNT(*) FROM kemenag_surat.surat_keluar`).Scan(&total)
	return total, err
}

func CountSuratKeluarBulanIni(ctx context.Context) (int, error) {
	var total int
	err := config.DB.QueryRow(ctx, `
		SELECT COUNT(*) FROM kemenag_surat.surat_keluar
		WHERE created_at >= date_trunc('month', NOW())
	`).Scan(&total)
	return total, err
}

func ListSuratKeluar(ctx context.Context, limit, offset int) ([]models.SuratKeluar, error) {
	rows, err := config.DB.Query(ctx, `
		SELECT external_id, nomor_surat, tanggal_surat::text, tujuan_surat,
		       perihal, COALESCE(agenda, ''), COALESCE(unit_kerja, ''), COALESCE(status, 'published'),
		       COALESCE(lampiran, ''), created_at, updated_at
		FROM kemenag_surat.surat_keluar
		ORDER BY tanggal_surat DESC, created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []models.SuratKeluar{}
	for rows.Next() {
		var sk models.SuratKeluar
		if err := rows.Scan(
			&sk.ID, &sk.NomorSurat, &sk.TanggalSurat, &sk.TujuanSurat,
			&sk.Perihal, &sk.Agenda, &sk.UnitKerja, &sk.Status,
			&sk.Lampiran, &sk.CreatedAt, &sk.UpdatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, sk)
	}
	return list, rows.Err()
}

func GetSuratKeluarLampiran(ctx context.Context, id string) (string, error) {
	var lampiran string
	err := config.DB.QueryRow(ctx,
		`SELECT COALESCE(lampiran, '') FROM kemenag_surat.surat_keluar WHERE external_id = $1`, id,
	).Scan(&lampiran)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return lampiran, err
}

func GetSuratKeluarByID(ctx context.Context, id string) (models.SuratKeluar, error) {
	var sk models.SuratKeluar
	err := config.DB.QueryRow(ctx, `
		SELECT external_id, nomor_surat, tanggal_surat::text, tujuan_surat,
		       perihal, COALESCE(agenda, ''), COALESCE(unit_kerja, ''), COALESCE(status, 'published'),
		       COALESCE(lampiran, ''), created_at, updated_at
		FROM kemenag_surat.surat_keluar
		WHERE external_id = $1
	`, id).Scan(
		&sk.ID, &sk.NomorSurat, &sk.TanggalSurat, &sk.TujuanSurat,
		&sk.Perihal, &sk.Agenda, &sk.UnitKerja, &sk.Status,
		&sk.Lampiran, &sk.CreatedAt, &sk.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return sk, ErrNotFound
	}
	return sk, err
}

// CreateSuratKeluar is the surat keluar counterpart of CreateSuratMasuk.
func CreateSuratKeluar(ctx context.Context, nomorSurat, tanggalSurat, tujuanSurat, perihal, agenda, unitKerja, status, userID string, resolveLampiran func(ctx context.Context, externalID string) (string, error)) (string, error) {
	tx, err := config.DB.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)

	var dupCount int
	if err := tx.QueryRow(ctx, `SELECT COUNT(*) FROM kemenag_surat.surat_keluar WHERE nomor_surat = $1`, nomorSurat).Scan(&dupCount); err != nil {
		return "", err
	}
	if dupCount > 0 {
		return "", ErrDuplicate
	}

	if _, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtext($1))`, "surat-keluar-seq"); err != nil {
		return "", err
	}

	year := time.Now().Format("2006")
	prefix := "SK-" + year + "-"
	var maxID string
	if err := tx.QueryRow(ctx, `SELECT COALESCE(MAX(external_id), '') FROM kemenag_surat.surat_keluar WHERE external_id LIKE $1`, prefix+"%").Scan(&maxID); err != nil {
		return "", err
	}

	nextNum := 1
	if maxID != "" {
		var currYear, currNum int
		if _, err := fmt.Sscanf(maxID, "SK-%d-%d", &currYear, &currNum); err == nil {
			nextNum = currNum + 1
		}
	}
	externalID := fmt.Sprintf("SK-%s-%03d", year, nextNum)

	lampiranURL := ""
	if resolveLampiran != nil {
		lampiranURL, err = resolveLampiran(ctx, externalID)
		if err != nil {
			return "", err
		}
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO kemenag_surat.surat_keluar (
			external_id, nomor_surat, tanggal_surat, tujuan_surat,
			perihal, agenda, unit_kerja, status, lampiran, created_by
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, externalID, nomorSurat, tanggalSurat, tujuanSurat, perihal, agenda, unitKerja, status, lampiranURL, userID)
	if err != nil {
		return "", err
	}

	if err := tx.Commit(ctx); err != nil {
		return "", err
	}
	return externalID, nil
}

func UpdateSuratKeluar(ctx context.Context, id, nomorSurat, tanggalSurat, tujuanSurat, perihal, agenda, unitKerja, status, lampiranURL, userID string) error {
	tag, err := config.DB.Exec(ctx, `
		UPDATE kemenag_surat.surat_keluar
		SET nomor_surat = $1, tanggal_surat = $2, tujuan_surat = $3,
		    perihal = $4, agenda = $5, unit_kerja = $6, status = $7,
		    lampiran = $8, updated_by = $9, updated_at = NOW()
		WHERE external_id = $10
	`, nomorSurat, tanggalSurat, tujuanSurat, perihal, agenda, unitKerja, status, lampiranURL, userID, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func DeleteSuratKeluar(ctx context.Context, id string) error {
	_, err := config.DB.Exec(ctx, `DELETE FROM kemenag_surat.surat_keluar WHERE external_id = $1`, id)
	return err
}

func SetSuratKeluarStatus(ctx context.Context, id, status, userID string) error {
	_, err := config.DB.Exec(ctx, `
		UPDATE kemenag_surat.surat_keluar SET status = $1, updated_by = $2, updated_at = NOW()
		WHERE external_id = $3
	`, status, userID, id)
	return err
}

func ClearSuratKeluarLampiran(ctx context.Context, id, userID string) error {
	_, err := config.DB.Exec(ctx, `
		UPDATE kemenag_surat.surat_keluar SET lampiran = '', updated_by = $1, updated_at = NOW()
		WHERE external_id = $2
	`, userID, id)
	return err
}