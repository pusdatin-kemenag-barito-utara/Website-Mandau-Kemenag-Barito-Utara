package config

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var (
	S3Client    *s3.Client
	R2Bucket    string
	R2PublicURL string
)

func InitStorage() {
	R2Bucket = os.Getenv("R2_BUCKET_SURAT")
	R2PublicURL = os.Getenv("R2_PUBLIC_URL")
	endpoint := os.Getenv("R2_ENDPOINT_URL")
	accessKey := os.Getenv("R2_ACCESS_KEY_ID")
	secretKey := os.Getenv("R2_SECRET_ACCESS_KEY")

	if R2Bucket == "" || endpoint == "" || accessKey == "" || secretKey == "" {
		fmt.Println("⚠️ Cloudflare R2 credentials missing or partially set.")
		return
	}

	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL:               endpoint,
			HostnameImmutable: true,
		}, nil
	})

	cfg, err := awsconfig.LoadDefaultConfig(context.TODO(),
		awsconfig.WithEndpointResolverWithOptions(customResolver),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
		awsconfig.WithRegion("auto"),
	)
	if err != nil {
		fmt.Printf("❌ Failed to load Cloudflare R2 AWS Config: %v\n", err)
		return
	}

	S3Client = s3.NewFromConfig(cfg)
	fmt.Println("✅ Successfully initialized Cloudflare R2 Storage Client!")
}

func SanitizeFileName(name string) string {
	reg := regexp.MustCompile(`[^a-zA-Z0-9.-]`)
	clean := reg.ReplaceAllString(name, "-")
	regDash := regexp.MustCompile(`-+`)
	return regDash.ReplaceAllString(clean, "-")
}

func UploadLampiranToR2(ctx context.Context, fileHeader *multipart.FileHeader, prefix string, suratID string) (string, error) {
	if S3Client == nil {
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

	cleanName := SanitizeFileName(fileHeader.Filename)
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

	cacheControl := "public, max-age=31536000, immutable"
	contentDisposition := "inline"

	_, err = S3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:             aws.String(R2Bucket),
		Key:                aws.String(key),
		Body:               bytes.NewReader(buf.Bytes()),
		ContentType:        aws.String(contentType),
		ContentDisposition: aws.String(contentDisposition),
		CacheControl:       aws.String(cacheControl),
	})
	if err != nil {
		return "", fmt.Errorf("R2 upload error: %w", err)
	}

	apiURL := os.Getenv("NEXT_PUBLIC_API_URL")
	if apiURL == "" {
		apiURL = "http://localhost:8080/api/v1"
	}
	if R2PublicURL != "" && !strings.Contains(R2PublicURL, "r2.dev") {
		return fmt.Sprintf("%s/%s", strings.TrimRight(R2PublicURL, "/"), key), nil
	}
	publicURL := fmt.Sprintf("%s/lampiran/%s", strings.TrimRight(apiURL, "/"), key)
	return publicURL, nil
}

func DeleteLampiranFromR2(ctx context.Context, rawURL string) error {
	if S3Client == nil || rawURL == "" {
		return nil
	}

	key := rawURL
	if strings.HasPrefix(rawURL, R2PublicURL) {
		key = strings.TrimPrefix(rawURL, R2PublicURL+"/")
	} else if strings.Contains(rawURL, "/data-surat/") {
		parts := strings.Split(rawURL, "/data-surat/")
		if len(parts) > 1 {
			key = parts[1]
		}
	}

	if key == "" {
		return nil
	}

	_, err := S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(R2Bucket),
		Key:    aws.String(key),
	})
	return err
}
