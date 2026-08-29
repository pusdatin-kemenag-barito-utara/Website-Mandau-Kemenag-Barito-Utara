package handlers

import (
	"context"
	"errors"
	"fmt"
	"time"

	"e-surat-backend/pkg/response"
	"e-surat-backend/repositories"
	"e-surat-backend/services"

	"github.com/gofiber/fiber/v3"
)

func GetSuratMasukListHandler(c fiber.Ctx) error {
	page, pageSize := parsePagination(c)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	list, total, err := services.ListSuratMasuk(ctx, page, pageSize)
	if err != nil {
		return response.Internal(c, "Gagal mengambil data surat masuk.")
	}
	return response.OKWithTotal(c, list, total, page, pageSize)
}

func GetSuratMasukDetailHandler(c fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return response.BadRequest(c, "ID surat masuk wajib diisi.")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	item, err := services.GetSuratMasukDetail(ctx, id)
	if err != nil {
		if errors.Is(err, repositories.ErrNotFound) {
			return response.NotFound(c, "Surat masuk tidak ditemukan.")
		}
		return response.Internal(c, "Gagal mengambil detail surat masuk.")
	}

	return response.OK(c, item)
}

func CreateSuratMasukHandler(c fiber.Ctx) error {
	in := services.SuratMasukInput{
		NomorSurat:    c.FormValue("nomor_surat"),
		TanggalSurat:  c.FormValue("tanggal_surat"),
		TanggalTerima: c.FormValue("tanggal_terima"),
		AsalSurat:     c.FormValue("asal_surat"),
		Perihal:       c.FormValue("perihal"),
		Agenda:        c.FormValue("agenda"),
		Status:        c.FormValue("status"),
	}
	if in.Status == "" {
		in.Status = "published"
	}

	if in.NomorSurat == "" || in.TanggalSurat == "" || in.TanggalTerima == "" || in.AsalSurat == "" || in.Perihal == "" {
		return response.BadRequest(c, "Semua bidang bertanda bintang wajib diisi.")
	}
	if in.TanggalTerima < in.TanggalSurat {
		return response.BadRequest(c, "Tanggal terima tidak boleh sebelum tanggal surat.")
	}

	in.LampiranFile, _ = c.FormFile("lampiran_file")
	in.UserID, _ = c.Locals("userID").(string)
	in.UserEmail, _ = c.Locals("userEmail").(string)
	in.IP = c.IP()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := services.CreateSuratMasuk(ctx, in)
	if err != nil {
		switch {
		case errors.Is(err, repositories.ErrDuplicate):
			return response.BadRequest(c, fmt.Sprintf("Nomor surat \"%s\" sudah terdaftar.", in.NomorSurat))
		case errors.Is(err, services.ErrUpload):
			return response.Internal(c, "Gagal mengunggah berkas PDF.")
		default:
			return response.Internal(c, "Gagal menyimpan surat masuk.")
		}
	}

	return response.Created(c, "Surat masuk berhasil dicatat.", fiber.Map{"id": id})
}

func UpdateSuratMasukHandler(c fiber.Ctx) error {
	id := c.Params("id")

	in := services.SuratMasukInput{
		NomorSurat:    c.FormValue("nomor_surat"),
		TanggalSurat:  c.FormValue("tanggal_surat"),
		TanggalTerima: c.FormValue("tanggal_terima"),
		AsalSurat:     c.FormValue("asal_surat"),
		Perihal:       c.FormValue("perihal"),
		Agenda:        c.FormValue("agenda"),
		Status:        c.FormValue("status"),
	}
	in.LampiranFile, _ = c.FormFile("lampiran_file")
	in.UserID, _ = c.Locals("userID").(string)
	in.UserEmail, _ = c.Locals("userEmail").(string)
	in.IP = c.IP()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := services.UpdateSuratMasuk(ctx, id, in)
	switch {
	case errors.Is(err, repositories.ErrNotFound):
		return response.NotFound(c, "Data surat tidak ditemukan.")
	case errors.Is(err, services.ErrUpload):
		return response.Internal(c, "Gagal memperbarui berkas PDF.")
	case err != nil:
		return response.Internal(c, "Gagal memperbarui data surat.")
	}

	return response.Message(c, "Surat masuk berhasil diperbarui.")
}

func DeleteSuratMasukHandler(c fiber.Ctx) error {
	id := c.Params("id")
	userEmail, _ := c.Locals("userEmail").(string)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := services.DeleteSuratMasuk(ctx, id, userEmail, c.IP()); err != nil {
		return response.Internal(c, "Gagal menghapus data surat.")
	}
	return response.Message(c, "Surat masuk berhasil dihapus.")
}

func ArchiveSuratMasukHandler(c fiber.Ctx) error {
	id := c.Params("id")
	var req struct {
		IsArchived bool `json:"is_archived"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return response.BadRequest(c, "Format request tidak valid.")
	}

	userID, _ := c.Locals("userID").(string)
	userEmail, _ := c.Locals("userEmail").(string)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := services.ArchiveSuratMasuk(ctx, id, req.IsArchived, userID, userEmail, c.IP()); err != nil {
		return response.Internal(c, "Gagal mengarsipkan surat.")
	}
	return response.Message(c, "Status arsip surat berhasil diperbarui.")
}