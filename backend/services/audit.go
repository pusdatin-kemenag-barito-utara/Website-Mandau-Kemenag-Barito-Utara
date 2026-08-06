package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"e-surat-backend/config"
)

func CreateAuditLog(ctx context.Context, adminID string, action string, entityType string, entityID string, ip string, details map[string]interface{}) {
	if config.DB == nil {
		return
	}

	target := fmt.Sprintf("%s:%s", entityType, entityID)
	detailsJSON, _ := json.Marshal(details)

	query := `
		INSERT INTO kemenag_pusdatin.audit_logs (action, target, target_schema, performed_by, after_state, ip)
		SELECT 
			$1, 
			$2, 
			'kemenag_surat', 
			COALESCE((SELECT email FROM kemenag_pusdatin.profiles WHERE id::varchar = $3), $3), 
			$4::jsonb, 
			$5
	`

	ctxTimeout, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	_, err := config.DB.Exec(ctxTimeout, query, action, target, adminID, string(detailsJSON), ip)
	if err != nil {
		fmt.Printf("⚠️ Audit log record error: %v\n", err)
	}
}
