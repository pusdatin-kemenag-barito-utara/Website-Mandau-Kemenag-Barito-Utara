package repositories

import (
	"context"

	"e-surat-backend/config"
	"e-surat-backend/models"
)

func ListMasterOptions(ctx context.Context) ([]models.MasterOption, error) {
	rows, err := config.DB.Query(ctx, `
		SELECT id::text, kategori, kategori, label, warna, sort_order, is_active
		FROM kemenag_surat.surat_master_options
		ORDER BY sort_order ASC, label ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []models.MasterOption{}
	for rows.Next() {
		var opt models.MasterOption
		if err := rows.Scan(
			&opt.ID, &opt.Category, &opt.Code, &opt.Name,
			&opt.BadgeColor, &opt.SortOrder, &opt.IsActive,
		); err != nil {
			return nil, err
		}
		list = append(list, opt)
	}
	return list, rows.Err()
}

func CreateMasterOption(ctx context.Context, category, name, badgeColor string, sortOrder int) (string, error) {
	var newID string
	err := config.DB.QueryRow(ctx, `
		INSERT INTO kemenag_surat.surat_master_options (kategori, label, warna, sort_order)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, category, name, badgeColor, sortOrder).Scan(&newID)
	return newID, err
}

func UpdateMasterOption(ctx context.Context, id, category, name, badgeColor string, sortOrder int, isActive bool) error {
	_, err := config.DB.Exec(ctx, `
		UPDATE kemenag_surat.surat_master_options
		SET kategori = $1, label = $2, warna = $3, sort_order = $4, is_active = $5, updated_at = NOW()
		WHERE id = $6
	`, category, name, badgeColor, sortOrder, isActive, id)
	return err
}

func DeleteMasterOption(ctx context.Context, id string) error {
	_, err := config.DB.Exec(ctx, `DELETE FROM kemenag_surat.surat_master_options WHERE id = $1`, id)
	return err
}