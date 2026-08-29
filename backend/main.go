package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"e-surat-backend/config"
	"e-surat-backend/routes"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/compress"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env.local file from root directory or current directory
	_ = godotenv.Load("../.env.local")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env.local")
	_ = godotenv.Load(".env")

	// Initialize Database Pool & Storage Client
	config.InitDB()
	config.InitStorage()

	app := fiber.New(fiber.Config{
		AppName:         "SI MANDAU E-Surat Backend (Golang Fiber v3)",
		BodyLimit:       50 * 1024 * 1024, // 50MB max body limit for PDF uploads
		ReadBufferSize:  128 * 1024,       // 128KB buffer size for large headers/cookies
		WriteBufferSize: 128 * 1024,
		ServerHeader:    "GoFiber/v3",
	})

	// Global Middlewares
	app.Use(recover.New())
	app.Use(compress.New(compress.Config{
		Level: compress.LevelBestSpeed,
	}))

	// Informative Terminal Request Logger (Menampilkan Waktu, Status, Kecepatan/Latency, Endpoint, IP)
	app.Use(logger.New(logger.Config{
		Format:     "[${time}] ${status} | ⚡ ${latency} | 📍 ${method} ${path} | 👤 ${ip} ${error}\n",
		TimeFormat: "15:04:05",
		TimeZone:   "Local",
	}))

	// Enterprise HTTP/3 & Security Headers Middleware
	app.Use(func(c fiber.Ctx) error {
		c.Set("Alt-Svc", `h3=":443"; ma=86400, h3-29=":443"; ma=86400`)
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "SAMEORIGIN")
		c.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
		c.Set("X-DNS-Prefetch-Control", "on")
		c.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()")
		return c.Next()
	})

	allowedOriginsRaw := os.Getenv("CORS_ALLOWED_ORIGINS")
	var allowedOrigins []string
	if allowedOriginsRaw != "" {
		for _, o := range strings.Split(allowedOriginsRaw, ",") {
			trimmed := strings.TrimSpace(o)
			if trimmed != "" {
				allowedOrigins = append(allowedOrigins, trimmed)
			}
		}
	}
	if len(allowedOrigins) == 0 {
		allowedOrigins = []string{
			"http://localhost:3000",
			"http://127.0.0.1:3000",
			"https://surat.kemenag-baritoutara.com",
		}
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowCredentials: true,
	}))

	// Register all routes
	routes.Setup(app)

	port := os.Getenv("GO_PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🚀 Golang API Backend Server (Fiber v3) is running on http://localhost:%s\n", port)
	log.Fatal(app.Listen(":" + port))
}