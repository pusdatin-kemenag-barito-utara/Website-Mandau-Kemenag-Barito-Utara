package handlers

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"e-surat-backend/config"
	"e-surat-backend/models"
	"e-surat-backend/services"

	"github.com/gofiber/fiber/v2"
)

func GetSuratMasukListHandler(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "5000"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 5000
	}
	offset := (page - 1) * pageSize

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT 
			external_id, nomor_surat, tanggal_surat, tanggal_terima, 
			asal_surat, perihal, COALESCE(agenda, ''), COALESCE(status, 'published'), 
			COALESCE(lampiran, ''), created_at, updated_at
		FROM kemenag_surat.surat_masuk
		WHERE deleted_at IS NULL
		ORDER BY tanggal_terima DESC, created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := config.DB.Query(ctx, query, pageSize, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIResponse{
			Success: false,
			Error:   fmt.Sprintf("Gagal mengambil data surat masuk: %v", err),
		})
	}
	defer rows.Close()

	var list []models.SuratMasuk
	for rows.Next() {
		var sm models.SuratMasuk
		if err := rows.Scan(
			&sm.ID, &sm.NomorSurat, &sm.TanggalSurat, &sm.TanggalTerima,
			&sm.AsalSurat, &sm.Perihal, &sm.Agenda, &sm.Status,
			&sm.Lampiran, &sm.CreatedAt, &sm.UpdatedAt,
		); err != nil {
			continue
		}
		list = append(list, sm)
	}

	var total int
	countQuery := `SELECT COUNT(*) FROM kemenag_surat.surat_masuk WHERE deleted_at IS NULL`
	_ = config.DB.QueryRow(ctx, countQuery).Scan(&total)

	return c.JSON(models.APIResponse{
		Success:  true,
		Data:     list,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

func CreateSuratMasukHandler(c *fiber.Ctx) error {
	nomorSurat := c.FormValue("nomor_surat")
	tanggalSurat := c.FormValue("tanggal_surat")
	tanggalTerima := c.FormValue("tanggal_terima")
	asalSurat := c.FormValue("asal_surat")
	perihal := c.FormValue("perihal")
	agenda := c.FormValue("agenda")
	status := c.FormValue("status")
	if status == "" {
		status = "published"
	}

	if nomorSurat == "" || tanggalSurat == "" || tanggalTerima == "" || asalSurat == "" || perihal == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIResponse{
			Success: false,
			Error:   "Semua bidang bertanda bintang wajib diisi.",
		})
	}

	if tanggalTerima < tanggalSurat {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIResponse{
			Success: false,
			Error:   "Tanggal terima tidak boleh sebelum tanggal surat.",
		})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check duplicate nomor surat
	var dupCount int
	err := config.DB.QueryRow(ctx, `SELECT COUNT(*) FROM kemenag_surat.surat_masuk WHERE nomor_surat = $1 AND deleted_at IS NULL`, nomorSurat).Scan(&dupCount)
	if err == nil && dupCount > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIResponse{
			Success: false,
			Error:   fmt.Sprintf("Nomor surat \"%s\" sudah terdaftar.", nomorSurat),
		})
	}

	// Generate next external ID: SM-2026-xxx
	year := time.Now().Format("2006")
	prefix := fmt.Sprintf("SM-%s-", year)
	var maxID string
	_ = config.DB.QueryRow(ctx, `SELECT MAX(external_id) FROM kemenag_surat.surat_masuk WHERE external_id LIKE $1`, prefix+"%").Scan(&maxID)

	var nextNum int = 1
	if maxID != "" {
		var currNum int
		fmt.Sscanf(maxID, "SM-%s-%d", &year, &currNum)
		nextNum = currNum + 1
	}
	externalID := fmt.Sprintf("SM-%s-%03d", year, nextNum)

	var lampiranURL string
	fileHeader, err := c.FormFile("lampiran_file")
	if err == nil && fileHeader != nil {
		uploadedURL, errUpload := config.UploadLampiranToR2(ctx, fileHeader, "masuk", externalID)
		if errUpload != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(models.APIResponse{
				Success: false,
				Error:   fmt.Sprintf("Gagal mengunggah berkas PDF: %v", errUpload),
			})
		}
		lampiranURL = uploadedURL
	}

	userID, _ := c.Locals("userID").(string)
	insertQuery := `
		INSERT INTO kemenag_surat.surat_masuk (
			external_id, nomor_surat, tanggal_surat, tanggal_terima, 
			asal_surat, perihal, agenda, status, lampiran, created_by
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err = config.DB.Exec(ctx, insertQuery, externalID, nomorSurat, tanggalSurat, tanggalTerima, asalSurat, perihal, agenda, status, lampiranURL, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIResponse{
			Success: false,
			Error:   fmt.Sprintf("Gagal menyimpan surat masuk: %v", err),
		})
	}

	userEmail, _ := c.Locals("userEmail").(string)
	services.CreateAuditLog(ctx, userEmail, "CREATE", "SURAT_MASUK", externalID, c.IP(), map[string]interface{}{
		"nomor_surat": nomorSurat,
		"perihal":     perihal,
	})

	return c.JSON(models.APIResponse{
		Success: true,
		Message: "Surat masuk berhasil dicatat.",
		Data:    fiber.Map{"id": externalID},
	})
}

func UpdateSuratMasukHandler(c *fiber.Ctx) error {
	id := c.Params("id")
	nomorSurat := c.FormValue("nomor_surat")
	tanggalSurat := c.FormValue("tanggal_surat")
	tanggalTerima := c.FormValue("tanggal_terima")
	asalSurat := c.FormValue("asal_surat")
	perihal := c.FormValue("perihal")
	agenda := c.FormValue("agenda")
	status := c.FormValue("status")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var existingLampiran string
	err := config.DB.QueryRow(ctx, `SELECT COALESCE(lampiran, '') FROM kemenag_surat.surat_masuk WHERE external_id = $1 AND deleted_at IS NULL`, id).Scan(&existingLampiran)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(models.APIResponse{
			Success: false,
			Error:   "Data surat tidak ditemukan.",
		})
	}

	lampiranURL := existingLampiran
	fileHeader, err := c.FormFile("lampiran_file")
	if err == nil && fileHeader != nil {
		if existingLampiran != "" {
			_ = config.DeleteLampiranFromR2(ctx, existingLampiran)
		}
		uploadedURL, errUpload := config.UploadLampiranToR2(ctx, fileHeader, "masuk", id)
		if errUpload != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(models.APIResponse{
				Success: false,
				Error:   fmt.Sprintf("Gagal memperbarui berkas PDF: %v", errUpload),
			})
		}
		lampiranURL = uploadedURL
	}

	userID, _ := c.Locals("userID").(string)
	updateQuery := `
		UPDATE kemenag_surat.surat_masuk
		SET nomor_surat = $1, tanggal_surat = $2, tanggal_terima = $3, 
		    asal_surat = $4, perihal = $5, agenda = $6, status = $7, 
		    lampiran = $8, updated_by = $9, updated_at = NOW()
		WHERE external_id = $10 AND deleted_at IS NULL
	`
	_, err = config.DB.Exec(ctx, updateQuery, nomorSurat, tanggalSurat, tanggalTerima, asalSurat, perihal, agenda, status, lampiranURL, userID, id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIResponse{
			Success: false,
			Error:   fmt.Sprintf("Gagal memperbarui data surat: %v", err),
		})
	}

	userEmail, _ := c.Locals("userEmail").(string)
	services.CreateAuditLog(ctx, userEmail, "UPDATE", "SURAT_MASUK", id, c.IP(), map[string]interface{}{
		"nomor_surat": nomorSurat,
	})

	return c.JSON(models.APIResponse{
		Success: true,
		Message: "Surat masuk berhasil diperbarui.",
	})
}

func DeleteSuratMasukHandler(c *fiber.Ctx) error {
	id := c.Params("id")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	userEmail, _ := c.Locals("userEmail").(string)

	query := `DELETE FROM kemenag_surat.surat_masuk WHERE external_id = $1`
	_, err := config.DB.Exec(ctx, query, id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIResponse{
			Success: false,
			Error:   "Gagal menghapus data surat.",
		})
	}

	services.CreateAuditLog(ctx, userEmail, "DELETE", "SURAT_MASUK", id, c.IP(), nil)

	return c.JSON(models.APIResponse{
		Success: true,
		Message: "Surat masuk berhasil dihapus.",
	})
}

func ArchiveSuratMasukHandler(c *fiber.Ctx) error {
	id := c.Params("id")
	var req struct {
		IsArchived bool `json:"is_archived"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIResponse{
			Success: false,
			Error:   "Format request tidak valid.",
		})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	newStatus := "archived"
	if !req.IsArchived {
		newStatus = "published"
	}

	userID, _ := c.Locals("userID").(string)
	userEmail, _ := c.Locals("userEmail").(string)

	query := `UPDATE kemenag_surat.surat_masuk SET status = $1, updated_by = $2, updated_at = NOW() WHERE external_id = $3`
	_, err := config.DB.Exec(ctx, query, newStatus, userID, id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIResponse{
			Success: false,
			Error:   "Gagal mengarsipkan surat.",
		})
	}

	action := "ARCHIVE"
	if !req.IsArchived {
		action = "UNARCHIVE"
	}
	services.CreateAuditLog(ctx, userEmail, action, "SURAT_MASUK", id, c.IP(), nil)

	return c.JSON(models.APIResponse{
		Success: true,
		Message: "Status arsip surat berhasil diperbarui.",
	})
}
