package main

import (
	"fmt"
	"log"
	"os"

	"e-surat-backend/config"
	"e-surat-backend/handlers"
	"e-surat-backend/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
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
		AppName:         "SI MANDAU E-Surat Backend (Golang Fiber)",
		BodyLimit:       50 * 1024 * 1024,  // 50MB max body limit for PDF uploads
		ReadBufferSize:  128 * 1024,        // 128KB buffer size for large headers/cookies
		WriteBufferSize: 128 * 1024,
		ServerHeader:    "GoFiber",
	})

	// Global Middlewares
	app.Use(recover.New())
	app.Use(compress.New(compress.Config{
		Level: compress.LevelBestSpeed,
	}))
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${latency} ${method} ${path}\n",
	}))
	allowedOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:3000,http://127.0.0.1:3000,https://surat.kemenag-baritoutara.com"
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	// Health Check Endpoint
	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "healthy",
			"service": "SI MANDAU Golang Backend API",
			"version": "v2.0",
		})
	})

	// API Group v1
	v1 := app.Group("/api/v1")

	// Public Auth Endpoints
	v1.Post("/auth/login", handlers.LoginHandler)

	// Public Master Options GET (for form dropdowns)
	v1.Get("/master-options", handlers.GetMasterOptionsHandler)
	v1.Get("/master/options", handlers.GetMasterOptionsHandler)

	// Public File Lampiran Stream Proxy (Cloudflare R2 Direct Access)
	v1.Get("/lampiran/*", handlers.GetLampiranProxyHandler)

	// Protected Endpoints Middleware Wrapper
	auth := middleware.AuthRequired

	// File Lampiran Management (Delete requires auth)
	v1.Delete("/lampiran/:id", auth, handlers.DeleteLampiranHandler)

	// Dashboard Stats
	v1.Get("/dashboard/stats", auth, handlers.GetDashboardStatsHandler)

	// User Info & Logout
	v1.Get("/auth/me", auth, handlers.GetMeHandler)
	v1.Post("/auth/logout", auth, handlers.LogoutHandler)

	// Surat Masuk Routes
	v1.Get("/surat-masuk", auth, handlers.GetSuratMasukListHandler)
	v1.Post("/surat-masuk", auth, handlers.CreateSuratMasukHandler)
	v1.Put("/surat-masuk/:id", auth, handlers.UpdateSuratMasukHandler)
	v1.Delete("/surat-masuk/:id", auth, handlers.DeleteSuratMasukHandler)
	v1.Put("/surat-masuk/:id/archive", auth, handlers.ArchiveSuratMasukHandler)

	// Surat Keluar Routes
	v1.Get("/surat-keluar", auth, handlers.GetSuratKeluarListHandler)
	v1.Post("/surat-keluar", auth, handlers.CreateSuratKeluarHandler)
	v1.Put("/surat-keluar/:id", auth, handlers.UpdateSuratKeluarHandler)
	v1.Delete("/surat-keluar/:id", auth, handlers.DeleteSuratKeluarHandler)
	v1.Put("/surat-keluar/:id/archive", auth, handlers.ArchiveSuratKeluarHandler)

	// Master Options Mutations (Super Admin)
	v1.Post("/master-options", auth, handlers.CreateMasterOptionHandler)
	v1.Put("/master-options/:id", auth, handlers.UpdateMasterOptionHandler)
	v1.Delete("/master-options/:id", auth, handlers.DeleteMasterOptionHandler)

	v1.Post("/master/options", auth, handlers.CreateMasterOptionHandler)
	v1.Put("/master/options/:id", auth, handlers.UpdateMasterOptionHandler)
	v1.Delete("/master/options/:id", auth, handlers.DeleteMasterOptionHandler)

	port := os.Getenv("GO_PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🚀 Golang API Backend Server is running on http://localhost:%s\n", port)
	log.Fatal(app.Listen(":" + port))
}
