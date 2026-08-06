package handlers

import (
	"context"
	"fmt"
	"time"

	"e-surat-backend/config"
	"e-surat-backend/models"
	"e-surat-backend/services"

	"github.com/gofiber/fiber/v2"
)

func GetMasterOptionsHandler(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	query := `
		SELECT id::text, kategori, kategori, label, warna, sort_order, is_active
		FROM kemenag_surat.surat_master_options
		ORDER BY sort_order ASC, label ASC
	`

	rows, err := config.DB.Query(ctx, query)
	if err != nil {
		fmt.Printf("⚠️ [GetMasterOptions DB Error]: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIResponse{
			Success: false,
			Error:   "Gagal mengambil opsi master.",
		})
	}
	defer rows.Close()

	var list []models.MasterOption
	for rows.Next() {
		var opt models.MasterOption
		if err := rows.Scan(
			&opt.ID, &opt.Category, &opt.Code, &opt.Name,
			&opt.BadgeColor, &opt.SortOrder, &opt.IsActive,
		); err != nil {
			fmt.Printf("⚠️ [GetMasterOptions Scan Error]: %v\n", err)
			continue
		}
		list = append(list, opt)
	}

	if list == nil {
		list = []models.MasterOption{}
	}

	fmt.Printf("📦 [GetMasterOptions] Successfully fetched %d items from kemenag_surat.surat_master_options\n", len(list))

	return c.JSON(models.APIResponse{
		Success: true,
		Data:    list,
	})
}

func CreateMasterOptionHandler(c *fiber.Ctx) error {
	var req struct {
		Category   string `json:"category"`
		Code       string `json:"code"`
		Name       string `json:"name"`
		BadgeColor string `json:"badge_color"`
		SortOrder  int    `json:"sort_order"`
	}
	if err := c.BodyParser(&req); err != nil || req.Category == "" || req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIResponse{
			Success: false,
			Error:   "Kategori dan nama opsi master wajib diisi.",
		})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if req.BadgeColor == "" {
		req.BadgeColor = "emerald"
	}

	var newID string
	query := `
		INSERT INTO kemenag_surat.surat_master_options (kategori, label, warna, sort_order)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`
	err := config.DB.QueryRow(ctx, query, req.Category, req.Name, req.BadgeColor, req.SortOrder).Scan(&newID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIResponse{
			Success: false,
			Error:   fmt.Sprintf("Gagal menambah opsi master: %v", err),
		})
	}

	userEmail, _ := c.Locals("userEmail").(string)
	services.CreateAuditLog(ctx, userEmail, "CREATE", "MASTER_OPTION", newID, c.IP(), map[string]interface{}{
		"category": req.Category,
		"name":     req.Name,
	})

	return c.JSON(models.APIResponse{
		Success: true,
		Message: "Opsi master berhasil ditambahkan.",
		Data:    fiber.Map{"id": newID},
	})
}

func UpdateMasterOptionHandler(c *fiber.Ctx) error {
	id := c.Params("id")
	var req struct {
		Category   string `json:"category"`
		Code       string `json:"code"`
		Name       string `json:"name"`
		BadgeColor string `json:"badge_color"`
		SortOrder  int    `json:"sort_order"`
		IsActive   bool   `json:"is_active"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIResponse{
			Success: false,
			Error:   "Format masukan tidak valid.",
		})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE kemenag_surat.surat_master_options
		SET kategori = $1, label = $2, warna = $3, sort_order = $4, is_active = $5, updated_at = NOW()
		WHERE id = $6
	`
	_, err := config.DB.Exec(ctx, query, req.Category, req.Name, req.BadgeColor, req.SortOrder, req.IsActive, id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIResponse{
			Success: false,
			Error:   "Gagal memperbarui opsi master.",
		})
	}

	userEmail, _ := c.Locals("userEmail").(string)
	services.CreateAuditLog(ctx, userEmail, "UPDATE", "MASTER_OPTION", id, c.IP(), nil)

	return c.JSON(models.APIResponse{
		Success: true,
		Message: "Opsi master berhasil diperbarui.",
	})
}

func DeleteMasterOptionHandler(c *fiber.Ctx) error {
	id := c.Params("id")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `DELETE FROM kemenag_surat.surat_master_options WHERE id = $1`
	_, err := config.DB.Exec(ctx, query, id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIResponse{
			Success: false,
			Error:   "Gagal menghapus opsi master.",
		})
	}

	userEmail, _ := c.Locals("userEmail").(string)
	services.CreateAuditLog(ctx, userEmail, "DELETE", "MASTER_OPTION", id, c.IP(), nil)

	return c.JSON(models.APIResponse{
		Success: true,
		Message: "Opsi master berhasil dihapus.",
	})
}
