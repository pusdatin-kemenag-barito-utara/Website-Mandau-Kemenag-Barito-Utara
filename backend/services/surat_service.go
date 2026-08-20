package services

import (
	"context"
	"fmt"
	"mime/multipart"

	"e-surat-backend/models"
	"e-surat-backend/repositories"
)

type SuratMasukInput struct {
	NomorSurat    string
	TanggalSurat  string
	TanggalTerima string
	AsalSurat     string
	Perihal       string
	Agenda        string
	Status        string
	LampiranFile  *multipart.FileHeader
	UserID        string
	UserEmail     string
	IP            string
}

type SuratKeluarInput struct {
	NomorSurat   string
	TanggalSurat string
	TujuanSurat  string
	Perihal      string
	Agenda       string
	UnitKerja    string
	Status       string
	LampiranFile *multipart.FileHeader
	UserID       string
	UserEmail    string
	IP           string
}

// ─────────── Surat Masuk ───────────

func ListSuratMasuk(ctx context.Context, page, pageSize int) ([]models.SuratMasuk, int, error) {
	offset := (page - 1) * pageSize
	list, err := repositories.ListSuratMasuk(ctx, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	total, err := repositories.CountSuratMasuk(ctx)
	if err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func GetSuratMasukDetail(ctx context.Context, id string) (models.SuratMasuk, error) {
	return repositories.GetSuratMasukByID(ctx, id)
}

func CreateSuratMasuk(ctx context.Context, in SuratMasukInput) (string, error) {
	var resolveLampiran func(ctx context.Context, externalID string) (string, error)
	if in.LampiranFile != nil {
		resolveLampiran = func(ctx context.Context, externalID string) (string, error) {
			url, err := UploadLampiran(ctx, in.LampiranFile, "masuk", externalID)
			if err != nil {
				return "", fmt.Errorf("%w: %v", ErrUpload, err)
			}
			return url, nil
		}
	}

	externalID, err := repositories.CreateSuratMasuk(ctx, in.NomorSurat, in.TanggalSurat, in.TanggalTerima, in.AsalSurat, in.Perihal, in.Agenda, in.Status, in.UserID, resolveLampiran)
	if err != nil {
		return "", err
	}

	InvalidateDashboardCache()

	CreateAuditLog(ctx, in.UserEmail, "CREATE", "SURAT_MASUK", externalID, in.IP, map[string]interface{}{
		"nomor_surat": in.NomorSurat,
		"perihal":     in.Perihal,
	})
	return externalID, nil
}

func UpdateSuratMasuk(ctx context.Context, id string, in SuratMasukInput) error {
	existing, err := repositories.GetSuratMasukLampiran(ctx, id)
	if err != nil {
		return err
	}

	lampiranURL := existing
	if in.LampiranFile != nil {
		if existing != "" {
			_ = DeleteLampiran(ctx, existing)
		}
		url, err := UploadLampiran(ctx, in.LampiranFile, "masuk", id)
		if err != nil {
			return fmt.Errorf("%w: %v", ErrUpload, err)
		}
		lampiranURL = url
	}

	if err := repositories.UpdateSuratMasuk(ctx, id, in.NomorSurat, in.TanggalSurat, in.TanggalTerima, in.AsalSurat, in.Perihal, in.Agenda, in.Status, lampiranURL, in.UserID); err != nil {
		return err
	}

	InvalidateDashboardCache()

	CreateAuditLog(ctx, in.UserEmail, "UPDATE", "SURAT_MASUK", id, in.IP, map[string]interface{}{
		"nomor_surat": in.NomorSurat,
	})
	return nil
}

func DeleteSuratMasuk(ctx context.Context, id, userEmail, ip string) error {
	if err := repositories.DeleteSuratMasuk(ctx, id); err != nil {
		return err
	}
	InvalidateDashboardCache()
	CreateAuditLog(ctx, userEmail, "DELETE", "SURAT_MASUK", id, ip, nil)
	return nil
}

func ArchiveSuratMasuk(ctx context.Context, id string, isArchived bool, userID, userEmail, ip string) error {
	newStatus := "archived"
	action := "ARCHIVE"
	if !isArchived {
		newStatus = "published"
		action = "UNARCHIVE"
	}

	if err := repositories.SetSuratMasukStatus(ctx, id, newStatus, userID); err != nil {
		return err
	}
	InvalidateDashboardCache()
	CreateAuditLog(ctx, userEmail, action, "SURAT_MASUK", id, ip, nil)
	return nil
}

// ─────────── Surat Keluar ───────────

func ListSuratKeluar(ctx context.Context, page, pageSize int) ([]models.SuratKeluar, int, error) {
	offset := (page - 1) * pageSize
	list, err := repositories.ListSuratKeluar(ctx, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	total, err := repositories.CountSuratKeluar(ctx)
	if err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func GetSuratKeluarDetail(ctx context.Context, id string) (models.SuratKeluar, error) {
	return repositories.GetSuratKeluarByID(ctx, id)
}

func CreateSuratKeluar(ctx context.Context, in SuratKeluarInput) (string, error) {
	var resolveLampiran func(ctx context.Context, externalID string) (string, error)
	if in.LampiranFile != nil {
		resolveLampiran = func(ctx context.Context, externalID string) (string, error) {
			url, err := UploadLampiran(ctx, in.LampiranFile, "keluar", externalID)
			if err != nil {
				return "", fmt.Errorf("%w: %v", ErrUpload, err)
			}
			return url, nil
		}
	}

	externalID, err := repositories.CreateSuratKeluar(ctx, in.NomorSurat, in.TanggalSurat, in.TujuanSurat, in.Perihal, in.Agenda, in.UnitKerja, in.Status, in.UserID, resolveLampiran)
	if err != nil {
		return "", err
	}

	InvalidateDashboardCache()

	CreateAuditLog(ctx, in.UserEmail, "CREATE", "SURAT_KELUAR", externalID, in.IP, map[string]interface{}{
		"nomor_surat": in.NomorSurat,
		"perihal":     in.Perihal,
	})
	return externalID, nil
}

func UpdateSuratKeluar(ctx context.Context, id string, in SuratKeluarInput) error {
	existing, err := repositories.GetSuratKeluarLampiran(ctx, id)
	if err != nil {
		return err
	}

	lampiranURL := existing
	if in.LampiranFile != nil {
		if existing != "" {
			_ = DeleteLampiran(ctx, existing)
		}
		url, err := UploadLampiran(ctx, in.LampiranFile, "keluar", id)
		if err != nil {
			return fmt.Errorf("%w: %v", ErrUpload, err)
		}
		lampiranURL = url
	}

	if err := repositories.UpdateSuratKeluar(ctx, id, in.NomorSurat, in.TanggalSurat, in.TujuanSurat, in.Perihal, in.Agenda, in.UnitKerja, in.Status, lampiranURL, in.UserID); err != nil {
		return err
	}

	InvalidateDashboardCache()

	CreateAuditLog(ctx, in.UserEmail, "UPDATE", "SURAT_KELUAR", id, in.IP, map[string]interface{}{
		"nomor_surat": in.NomorSurat,
	})
	return nil
}

func DeleteSuratKeluar(ctx context.Context, id, userEmail, ip string) error {
	if err := repositories.DeleteSuratKeluar(ctx, id); err != nil {
		return err
	}
	InvalidateDashboardCache()
	CreateAuditLog(ctx, userEmail, "DELETE", "SURAT_KELUAR", id, ip, nil)
	return nil
}

func ArchiveSuratKeluar(ctx context.Context, id string, isArchived bool, userID, userEmail, ip string) error {
	newStatus := "archived"
	action := "ARCHIVE"
	if !isArchived {
		newStatus = "published"
		action = "UNARCHIVE"
	}

	if err := repositories.SetSuratKeluarStatus(ctx, id, newStatus, userID); err != nil {
		return err
	}
	InvalidateDashboardCache()
	CreateAuditLog(ctx, userEmail, action, "SURAT_KELUAR", id, ip, nil)
	return nil
}