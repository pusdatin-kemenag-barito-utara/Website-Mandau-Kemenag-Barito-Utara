package handlers

import (
	"context"
	"time"

	"e-surat-backend/pkg/response"
	"e-surat-backend/services"

	"github.com/gofiber/fiber/v2"
)

func GetMasterOptionsHandler(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	list, err := services.ListMasterOptions(ctx)
	if err != nil {
		return response.Internal(c, "Gagal mengambil opsi master.")
	}
	return response.OK(c, list)
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
		return response.BadRequest(c, "Kategori dan nama opsi master wajib diisi.")
	}

	userEmail, _ := c.Locals("userEmail").(string)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	newID, err := services.CreateMasterOption(ctx, req.Category, req.Name, req.BadgeColor, req.SortOrder, userEmail, c.IP())
	if err != nil {
		return response.Internal(c, "Gagal menambah opsi master.")
	}
	return response.Created(c, "Opsi master berhasil ditambahkan.", fiber.Map{"id": newID})
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
		return response.BadRequest(c, "Format masukan tidak valid.")
	}

	userEmail, _ := c.Locals("userEmail").(string)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := services.UpdateMasterOption(ctx, id, req.Category, req.Name, req.BadgeColor, req.SortOrder, req.IsActive, userEmail, c.IP()); err != nil {
		return response.Internal(c, "Gagal memperbarui opsi master.")
	}
	return response.Message(c, "Opsi master berhasil diperbarui.")
}

func DeleteMasterOptionHandler(c *fiber.Ctx) error {
	id := c.Params("id")
	userEmail, _ := c.Locals("userEmail").(string)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := services.DeleteMasterOption(ctx, id, userEmail, c.IP()); err != nil {
		return response.Internal(c, "Gagal menghapus opsi master.")
	}
	return response.Message(c, "Opsi master berhasil dihapus.")
}