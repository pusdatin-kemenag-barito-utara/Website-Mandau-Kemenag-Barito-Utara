package repositories

import (
	"context"
	"fmt"

	"e-surat-backend/config"
	"e-surat-backend/models"
)

func getTargetTable(category string) string {
	switch category {
	case "unit_kerja":
		return "kemenag_surat.opsi_unit_kerja"
	default:
		// Unified agenda options: "agenda", "agenda_surat", "agenda_masuk", "agenda_keluar"
		return "kemenag_surat.opsi_agenda_surat"
	}
}

func ListMasterOptions(ctx context.Context) ([]models.MasterOption, error) {
	rows, err := config.DB.Query(ctx, `
		SELECT id::text, 'agenda' AS kategori, 'agenda' AS code, label, warna, sort_order, is_active
		FROM kemenag_surat.opsi_agenda_surat
		UNION ALL
		SELECT id::text, 'unit_kerja' AS kategori, 'unit_kerja' AS code, label, warna, sort_order, is_active
		FROM kemenag_surat.opsi_unit_kerja
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
	targetTable := getTargetTable(category)
	var newID string
	query := fmt.Sprintf(`
		INSERT INTO %s (label, warna, sort_order)
		VALUES ($1, $2, $3)
		RETURNING id
	`, targetTable)
	err := config.DB.QueryRow(ctx, query, name, badgeColor, sortOrder).Scan(&newID)
	return newID, err
}

func UpdateMasterOption(ctx context.Context, id, category, name, badgeColor string, sortOrder int, isActive bool) error {
	targetTable := getTargetTable(category)
	query := fmt.Sprintf(`
		UPDATE %s
		SET label = $1, warna = $2, sort_order = $3, is_active = $4, updated_at = NOW()
		WHERE id = $5
	`, targetTable)
	res, err := config.DB.Exec(ctx, query, name, badgeColor, sortOrder, isActive, id)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		// Fallback check across other option tables if category was not provided
		tables := []string{
			"kemenag_surat.opsi_agenda_surat",
			"kemenag_surat.opsi_unit_kerja",
		}
		for _, tbl := range tables {
			if tbl == targetTable {
				continue
			}
			fallbackQuery := fmt.Sprintf(`
				UPDATE %s
				SET label = $1, warna = $2, sort_order = $3, is_active = $4, updated_at = NOW()
				WHERE id = $5
			`, tbl)
			fRes, _ := config.DB.Exec(ctx, fallbackQuery, name, badgeColor, sortOrder, isActive, id)
			if fRes.RowsAffected() > 0 {
				return nil
			}
		}
	}
	return nil
}

func DeleteMasterOption(ctx context.Context, id string) error {
	tables := []string{
		"kemenag_surat.opsi_agenda_surat",
		"kemenag_surat.opsi_unit_kerja",
	}
	for _, tbl := range tables {
		query := fmt.Sprintf(`DELETE FROM %s WHERE id = $1`, tbl)
		res, err := config.DB.Exec(ctx, query, id)
		if err != nil {
			return err
		}
		if res.RowsAffected() > 0 {
			return nil
		}
	}
	return nil
}

type ReorderOptionItem struct {
	ID        string `json:"id"`
	SortOrder int    `json:"sort_order"`
}

func ReorderMasterOptions(ctx context.Context, items []ReorderOptionItem) error {
	tx, err := config.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	tables := []string{
		"kemenag_surat.opsi_agenda_surat",
		"kemenag_surat.opsi_unit_kerja",
	}

	for _, item := range items {
		for _, tbl := range tables {
			query := fmt.Sprintf(`
				UPDATE %s
				SET sort_order = $1, updated_at = NOW()
				WHERE id = $2
			`, tbl)
			res, err := tx.Exec(ctx, query, item.SortOrder, item.ID)
			if err != nil {
				return err
			}
			if res.RowsAffected() > 0 {
				break
			}
		}
	}
	return tx.Commit(ctx)
}