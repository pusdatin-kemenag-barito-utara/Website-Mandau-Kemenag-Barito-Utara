package services

import (
	"context"
	"sync"
	"time"

	"e-surat-backend/models"
	"e-surat-backend/repositories"
)

var (
	statsCache     models.DashboardStats
	statsCacheTime time.Time
	statsCacheMu   sync.RWMutex
	statsCacheTTL  = 10 * time.Second
)

// InvalidateDashboardCache clears the cached dashboard stats so the next fetch is fresh
func InvalidateDashboardCache() {
	statsCacheMu.Lock()
	statsCacheTime = time.Time{}
	statsCacheMu.Unlock()
}

func GetDashboardStats(ctx context.Context) (models.DashboardStats, error) {
	statsCacheMu.RLock()
	if time.Since(statsCacheTime) < statsCacheTTL && !statsCacheTime.IsZero() {
		cached := statsCache
		statsCacheMu.RUnlock()
		return cached, nil
	}
	statsCacheMu.RUnlock()

	stats, err := repositories.GetDashboardStats(ctx)
	if err != nil {
		return stats, err
	}

	statsCacheMu.Lock()
	statsCache = stats
	statsCacheTime = time.Now()
	statsCacheMu.Unlock()

	return stats, nil
}