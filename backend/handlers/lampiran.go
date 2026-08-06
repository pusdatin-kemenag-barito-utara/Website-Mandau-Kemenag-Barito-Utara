package handlers

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"e-surat-backend/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
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

// readR2Object fetches an R2 object and reads it fully into memory.
// Always closes the body before returning — safe to use with c.Send().
func readR2Object(key string) ([]byte, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	obj, err := config.S3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(config.R2Bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, "", err
	}
	defer obj.Body.Close() // safe: we read everything before returning

	data, err := io.ReadAll(obj.Body)
	if err != nil {
		return nil, "", fmt.Errorf("read R2 body: %w", err)
	}

	contentType := "application/pdf"
	if obj.ContentType != nil && *obj.ContentType != "" {
		contentType = *obj.ContentType
	}
	return data, contentType, nil
}

// GetLampiranProxyHandler proxies a PDF file from Cloudflare R2.
// Falls back to prefix search then Supabase Storage if the exact key is missing.
// Reads the entire body into memory before sending (avoids defer-close race with Fiber).
func GetLampiranProxyHandler(c *fiber.Ctx) error {
	key := c.Params("*")
	if key == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "File key is required",
		})
	}

	// Normalise key — keep only the lampiran-xxx/... portion
	if idx := strings.Index(key, "lampiran-"); idx >= 0 {
		key = key[idx:]
	}

	if config.S3Client != nil {
		// ── 1a. Exact key lookup ───────────────────────────────────────────
		data, ct, err := readR2Object(key)
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

			listCtx, listCancel := context.WithTimeout(context.Background(), 8*time.Second)
			defer listCancel()

			listed, listErr := config.S3Client.ListObjectsV2(listCtx, &s3.ListObjectsV2Input{
				Bucket: aws.String(config.R2Bucket),
				Prefix: aws.String(prefix),
			})
			if listErr == nil && listed.KeyCount != nil && *listed.KeyCount > 0 {
				foundKey := *listed.Contents[0].Key
				fmt.Printf("📂 [R2 Prefix Found]: '%s' → '%s'\n", prefix, foundKey)

				data2, ct2, err2 := readR2Object(foundKey)
				if err2 == nil {
					setIframeHeaders(c, ct2)
					return c.Send(data2)
				}
			}
		}
		fmt.Printf("⚠️ [R2 Miss]: '%s' not found in R2 → fallback to Supabase\n", key)
	}

	// ── 2. Supabase Storage fallback ──────────────────────────────────────
	subPath := strings.TrimPrefix(strings.TrimPrefix(key, "lampiran-masuk/"), "lampiran-keluar/")
	supabaseURL := fmt.Sprintf(
		"https://db.kemenag-baritoutara.com/storage/v1/object/public/surat-lampiran/masuk/%s",
		subPath,
	)
	fmt.Printf("📥 [Supabase Fallback]: %s\n", supabaseURL)

	client := &http.Client{Timeout: 15 * time.Second}
	req, _ := http.NewRequest("GET", supabaseURL, nil)
	resp, errFetch := client.Do(req)
	if errFetch == nil && resp.StatusCode == 200 {
		defer resp.Body.Close()
		data, _ := io.ReadAll(resp.Body)
		fmt.Printf("✅ [Supabase Hit]: %d bytes\n", len(data))
		setIframeHeaders(c, "application/pdf")
		return c.Send(data)
	}

	fmt.Printf("❌ [GetLampiranProxy]: '%s' not found in R2 or Supabase\n", key)
	return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
		"success": false,
		"error":   "File lampiran tidak ditemukan.",
	})
}

// DeleteLampiranHandler removes the attachment file from R2 and sets lampiran column to empty in DB
func DeleteLampiranHandler(c *fiber.Ctx) error {
	tipe := c.Query("type") // "masuk" or "keluar"
	id := c.Params("id")

	if id == "" || (tipe != "masuk" && tipe != "keluar") {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "ID dan type (masuk/keluar) wajib diisi.",
		})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	table := "kemenag_surat.surat_masuk"
	if tipe == "keluar" {
		table = "kemenag_surat.surat_keluar"
	}

	var existingLampiran string
	err := config.DB.QueryRow(ctx, fmt.Sprintf(`SELECT COALESCE(lampiran, '') FROM %s WHERE external_id = $1 AND deleted_at IS NULL`, table), id).Scan(&existingLampiran)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "Data surat tidak ditemukan.",
		})
	}

	if existingLampiran != "" {
		_ = config.DeleteLampiranFromR2(ctx, existingLampiran)
	}

	userID, _ := c.Locals("userID").(string)
	updateQuery := fmt.Sprintf(`UPDATE %s SET lampiran = '', updated_by = $1, updated_at = NOW() WHERE external_id = $2`, table)
	_, err = config.DB.Exec(ctx, updateQuery, userID, id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Gagal menghapus data lampiran dari database.",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "File lampiran berhasil dihapus.",
	})
}

