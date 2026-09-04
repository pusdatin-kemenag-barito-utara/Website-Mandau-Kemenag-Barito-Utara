package services

import (
	"context"

	"e-surat-backend/models"
	"e-surat-backend/repositories"
)

func ListMasterOptions(ctx context.Context) ([]models.MasterOption, error) {
	return repositories.ListMasterOptions(ctx)
}

func CreateMasterOption(ctx context.Context, category, name, badgeColor string, sortOrder int, userEmail, ip string) (string, error) {
	if badgeColor == "" {
		badgeColor = "emerald"
	}

	newID, err := repositories.CreateMasterOption(ctx, category, name, badgeColor, sortOrder)
	if err != nil {
		return "", err
	}

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
	CreateAuditLog(ctx, userEmail, "UPDATE", "MASTER_OPTION", id, ip, nil)
	return nil
}

func DeleteMasterOption(ctx context.Context, id, userEmail, ip string) error {
	if err := repositories.DeleteMasterOption(ctx, id); err != nil {
		return err
	}
	CreateAuditLog(ctx, userEmail, "DELETE", "MASTER_OPTION", id, ip, nil)
	return nil
}

func ReorderMasterOptions(ctx context.Context, items []repositories.ReorderOptionItem, userEmail, ip string) error {
	if err := repositories.ReorderMasterOptions(ctx, items); err != nil {
		return err
	}
	CreateAuditLog(ctx, userEmail, "REORDER", "MASTER_OPTION", "bulk", ip, map[string]interface{}{
		"count": len(items),
	})
	return nil
}