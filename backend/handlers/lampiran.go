package handlers

import (
	"context"
	"fmt"
	"strings"
	"time"

	"e-surat-backend/config"
	"e-surat-backend/pkg/response"
	"e-surat-backend/repositories"
	"e-surat-backend/services"

	"github.com/gofiber/fiber/v2"
)

// setIframeHeaders sets headers that allow the PDF to be embedded safely
func setIframeHeaders(c *fiber.Ctx, contentType string) {
	c.Set("Content-Type", contentType)
	c.Set("Content-Disposition", "inline")
	c.Set("Cache-Control", "public, max-age=3600")
	c.Set("X-Frame-Options", "ALLOWALL")
	c.Set("Access-Control-Allow-Origin", "*")
}

// GetLampiranProxyHandler proxies a PDF file from Cloudflare R2.
// Reads the entire body into memory before sending (avoids defer-close race with Fiber).
func GetLampiranProxyHandler(c *fiber.Ctx) error {
	key := c.Params("*")
	if key == "" {
		return response.BadRequest(c, "File key is required")
	}

	// Normalise key — keep only the lampiran-xxx/... portion
	if idx := strings.Index(key, "lampiran-"); idx >= 0 {
		key = key[idx:]
	}

	if config.S3Client == nil {
		return response.NotFound(c, "File lampiran tidak ditemukan.")
	}

	// ── 1a. Exact key lookup ───────────────────────────────────────────
	data, ct, err := services.ReadLampiran(key)
	if err == nil {
		fmt.Printf("✅ [R2 Hit]: key='%s' (%d bytes)\n", key, len(data))
		setIframeHeaders(c, ct)
		return c.Send(data)
	}
	fmt.Printf("⚠️ [R2 Exact Miss]: key='%s' → trying prefix search...\n", key)

	// ── 1b. Prefix search (handles timestamp mismatch in key name) ─────
	parts := strings.Split(key, "/")
	if len(parts) >= 2 {
		prefix := strings.Join(parts[:len(parts)-1], "/") + "/"

		foundKey, findErr := services.FindLampiranByPrefix(prefix)
		if findErr == nil {
			fmt.Printf("📂 [R2 Prefix Found]: '%s' → '%s'\n", prefix, foundKey)

			data2, ct2, err2 := services.ReadLampiran(foundKey)
			if err2 == nil {
				setIframeHeaders(c, ct2)
				return c.Send(data2)
			}
		}
	}

	fmt.Printf("❌ [GetLampiranProxy]: '%s' not found in R2\n", key)
	return response.NotFound(c, "File lampiran tidak ditemukan.")
}

// DeleteLampiranHandler removes the attachment file from R2 and sets lampiran column to empty in DB
func DeleteLampiranHandler(c *fiber.Ctx) error {
	tipe := c.Query("type") // "masuk" or "keluar"
	id := c.Params("id")

	if id == "" || (tipe != "masuk" && tipe != "keluar") {
		return response.BadRequest(c, "ID dan type (masuk/keluar) wajib diisi.")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var existingLampiran string
	var err error
	if tipe == "masuk" {
		existingLampiran, err = repositories.GetSuratMasukLampiran(ctx, id)
	} else {
		existingLampiran, err = repositories.GetSuratKeluarLampiran(ctx, id)
	}
	if err != nil {
		return response.NotFound(c, "Data surat tidak ditemukan.")
	}

	if existingLampiran != "" {
		_ = services.DeleteLampiran(ctx, existingLampiran)
	}

	userID, _ := c.Locals("userID").(string)
	if tipe == "masuk" {
		err = repositories.ClearSuratMasukLampiran(ctx, id, userID)
	} else {
		err = repositories.ClearSuratKeluarLampiran(ctx, id, userID)
	}
	if err != nil {
		return response.Internal(c, "Gagal menghapus data lampiran dari database.")
	}

	return response.Message(c, "File lampiran berhasil dihapus.")
}