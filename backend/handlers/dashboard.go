package handlers

import (
	"context"
	"time"

	"e-surat-backend/pkg/response"
	"e-surat-backend/services"

	"github.com/gofiber/fiber/v3"
)

func GetDashboardStatsHandler(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	stats, err := services.GetDashboardStats(ctx)
	if err != nil {
		return response.Internal(c, "Gagal mengambil data statistik dashboard.")
	}
	return response.OK(c, stats)
}