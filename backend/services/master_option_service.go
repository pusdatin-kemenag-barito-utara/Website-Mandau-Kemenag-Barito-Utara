package services

import (
	"context"
	"sync"
	"time"

	"e-surat-backend/models"
	"e-surat-backend/repositories"
)

var (
	masterOptionsCache     []models.MasterOption
	masterOptionsCacheMu   sync.RWMutex
	masterOptionsCacheTime time.Time
)

const masterOptionsTTL = 10 * time.Minute

// InvalidateMasterOptionsCache clears the in-memory cache when options are mutated
func InvalidateMasterOptionsCache() {
	masterOptionsCacheMu.Lock()
	masterOptionsCache = nil
	masterOptionsCacheMu.Unlock()
}

func ListMasterOptions(ctx context.Context) ([]models.MasterOption, error) {
	masterOptionsCacheMu.RLock()
	if masterOptionsCache != nil && time.Since(masterOptionsCacheTime) < masterOptionsTTL {
		cached := masterOptionsCache
		masterOptionsCacheMu.RUnlock()
		return cached, nil
	}
	masterOptionsCacheMu.RUnlock()

	masterOptionsCacheMu.Lock()
	defer masterOptionsCacheMu.Unlock()

	// Double check under write lock
	if masterOptionsCache != nil && time.Since(masterOptionsCacheTime) < masterOptionsTTL {
		return masterOptionsCache, nil
	}

	list, err := repositories.ListMasterOptions(ctx)
	if err != nil {
		return nil, err
	}

	masterOptionsCache = list
	masterOptionsCacheTime = time.Now()
	return list, nil
}

func CreateMasterOption(ctx context.Context, category, name, badgeColor string, sortOrder int, userEmail, ip string) (string, error) {
	if badgeColor == "" {
		badgeColor = "emerald"
	}

	newID, err := repositories.CreateMasterOption(ctx, category, name, badgeColor, sortOrder)
	if err != nil {
		return "", err
	}

	InvalidateMasterOptionsCache()

	CreateAuditLog(ctx, userEmail, "CREATE", "MASTER_OPTION", newID, ip, map[string]interface{}{
		"category": category,
		"name":     name,
	})
	return newID, nil
}

func UpdateMasterOption(ctx context.Context, id, category, name, badgeColor string, sortOrder int, isActive bool, userEmail, ip string) error {
	if err := repositories.UpdateMasterOption(ctx, id, category, name, badgeColor, sortOrder, isActive); err != nil {
		return err
	}

	InvalidateMasterOptionsCache()

	CreateAuditLog(ctx, userEmail, "UPDATE", "MASTER_OPTION", id, ip, nil)
	return nil
}

func DeleteMasterOption(ctx context.Context, id, userEmail, ip string) error {
	if err := repositories.DeleteMasterOption(ctx, id); err != nil {
		return err
	}

	InvalidateMasterOptionsCache()

	CreateAuditLog(ctx, userEmail, "DELETE", "MASTER_OPTION", id, ip, nil)
	return nil
}

func ReorderMasterOptions(ctx context.Context, items []repositories.ReorderOptionItem, userEmail, ip string) error {
	if err := repositories.ReorderMasterOptions(ctx, items); err != nil {
		return err
	}

	InvalidateMasterOptionsCache()

	CreateAuditLog(ctx, userEmail, "REORDER", "MASTER_OPTION", "bulk", ip, map[string]interface{}{
		"count": len(items),
	})
	return nil
}