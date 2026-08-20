package services

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"e-surat-backend/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func sanitizeFileName(name string) string {
	reg := regexp.MustCompile(`[^a-zA-Z0-9.-]`)
	clean := reg.ReplaceAllString(name, "-")
	regDash := regexp.MustCompile(`-+`)
	return regDash.ReplaceAllString(clean, "-")
}

// BuildLampiranPublicURL returns a browser-accessible URL for a lampiran key.
// A custom-domain R2_PUBLIC_URL wins; otherwise a same-origin path is returned
// that works through the frontend /api/v1 proxy in both dev and production.
func BuildLampiranPublicURL(key string) string {
	if config.R2PublicURL != "" && !strings.Contains(config.R2PublicURL, "r2.dev") {
		return fmt.Sprintf("%s/%s", strings.TrimRight(config.R2PublicURL, "/"), key)
	}
	return fmt.Sprintf("/api/v1/lampiran/%s", key)
}

func UploadLampiran(ctx context.Context, fileHeader *multipart.FileHeader, prefix, suratID string) (string, error) {
	if config.S3Client == nil {
		return "", fmt.Errorf("Cloudflare R2 client is not initialized")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer file.Close()

	buf := bytes.NewBuffer(nil)
	if _, err := io.Copy(buf, file); err != nil {
		return "", err
	}

	cleanName := sanitizeFileName(fileHeader.Filename)
	timestamp := time.Now().UnixNano() / int64(time.Millisecond)
	key := fmt.Sprintf("lampiran-%s/%s/%d-%s", prefix, suratID, timestamp, cleanName)

	contentType := fileHeader.Header.Get("Content-Type")
	if contentType == "" {
		ext := strings.ToLower(filepath.Ext(cleanName))
		if ext == ".pdf" {
			contentType = "application/pdf"
		} else {
			contentType = "application/octet-stream"
		}
	}

	_, err = config.S3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:             aws.String(config.R2Bucket),
		Key:                aws.String(key),
		Body:               bytes.NewReader(buf.Bytes()),
		ContentType:        aws.String(contentType),
		ContentDisposition: aws.String("inline"),
		CacheControl:       aws.String("public, max-age=31536000, immutable"),
	})
	if err != nil {
		return "", fmt.Errorf("R2 upload error: %w", err)
	}

	return BuildLampiranPublicURL(key), nil
}

func DeleteLampiran(ctx context.Context, rawURL string) error {
	if config.S3Client == nil || rawURL == "" {
		return nil
	}

	key := rawURL
	if strings.HasPrefix(rawURL, "/api/v1/lampiran/") {
		key = strings.TrimPrefix(rawURL, "/api/v1/lampiran/")
	} else if strings.HasPrefix(rawURL, config.R2PublicURL) {
		key = strings.TrimPrefix(rawURL, config.R2PublicURL+"/")
	} else if strings.Contains(rawURL, "/data-surat/") {
		parts := strings.Split(rawURL, "/data-surat/")
		if len(parts) > 1 {
			key = parts[1]
		}
	}

	if key == "" {
		return nil
	}

	_, err := config.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(config.R2Bucket),
		Key:    aws.String(key),
	})
	return err
}

func ReadLampiran(key string) ([]byte, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	obj, err := config.S3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(config.R2Bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, "", err
	}
	defer obj.Body.Close()

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

func FindLampiranByPrefix(prefix string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	listed, err := config.S3Client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
		Bucket: aws.String(config.R2Bucket),
		Prefix: aws.String(prefix),
	})
	if err != nil {
		return "", err
	}
	if listed.KeyCount == nil || *listed.KeyCount == 0 {
		return "", fmt.Errorf("no objects found for prefix %q", prefix)
	}
	return *listed.Contents[0].Key, nil
}