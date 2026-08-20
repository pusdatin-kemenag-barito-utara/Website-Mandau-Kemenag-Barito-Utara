package routes

import (
	"e-surat-backend/handlers"
	"e-surat-backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App) {
	// Health Check Endpoints (Root, /health, /api/health, /api/v1/health)
	healthHandler := func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "healthy",
			"service": "SI MANDAU Golang Backend API",
			"version": "v2.0",
		})
	}
	app.Get("/health", healthHandler)
	app.Get("/api/health", healthHandler)

	// API Group v1
	v1 := app.Group("/api/v1")
	v1.Get("/health", healthHandler)

	// Public Auth Endpoint
	v1.Post("/auth/login", handlers.LoginHandler)

	// Public Master Options GET (for form dropdowns)
	v1.Get("/master-options", handlers.GetMasterOptionsHandler)

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
	v1.Get("/surat-masuk/:id", auth, handlers.GetSuratMasukDetailHandler)
	v1.Post("/surat-masuk", auth, handlers.CreateSuratMasukHandler)
	v1.Put("/surat-masuk/:id", auth, handlers.UpdateSuratMasukHandler)
	v1.Delete("/surat-masuk/:id", auth, handlers.DeleteSuratMasukHandler)
	v1.Put("/surat-masuk/:id/archive", auth, handlers.ArchiveSuratMasukHandler)

	// Surat Keluar Routes
	v1.Get("/surat-keluar", auth, handlers.GetSuratKeluarListHandler)
	v1.Get("/surat-keluar/:id", auth, handlers.GetSuratKeluarDetailHandler)
	v1.Post("/surat-keluar", auth, handlers.CreateSuratKeluarHandler)
	v1.Put("/surat-keluar/:id", auth, handlers.UpdateSuratKeluarHandler)
	v1.Delete("/surat-keluar/:id", auth, handlers.DeleteSuratKeluarHandler)
	v1.Put("/surat-keluar/:id/archive", auth, handlers.ArchiveSuratKeluarHandler)

	// Master Options Mutations
	v1.Post("/master-options", auth, handlers.CreateMasterOptionHandler)
	v1.Put("/master-options/:id", auth, handlers.UpdateMasterOptionHandler)
	v1.Delete("/master-options/:id", auth, handlers.DeleteMasterOptionHandler)
}