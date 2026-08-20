package config

import (
	"context"
	"fmt"
	"os"

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