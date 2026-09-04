package services

import (
	"context"
	"errors"
	"net/mail"
	"strings"

	"e-surat-backend/models"
	"e-surat-backend/repositories"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrCannotCreateSuperAdmin   = errors.New("tidak dapat membuat akun Super Admin baru. Sistem hanya mengizinkan 1 Super Admin tunggal")
	ErrCannotDeleteSuperAdmin   = errors.New("akun Super Admin utama dilindungi dan tidak dapat dihapus")
	ErrCannotDemoteSuperAdmin   = errors.New("tingkatan role Super Admin utama tidak dapat diturunkan")
	ErrCannotDeactivateSuperAdmin = errors.New("akun Super Admin utama tidak dapat dinonaktifkan")
	ErrCannotPromoteToSuperAdmin = errors.New("tidak dapat mengubah pengguna menjadi Super Admin. Sistem hanya mengizinkan 1 Super Admin")
	ErrInvalidRole              = errors.New("role tidak valid. Pilihan yang diizinkan: admin atau admin_bidang")
	ErrBidangRequired           = errors.New("unit kerja / bidang wajib diisi untuk role Admin Bidang")
	ErrInvalidEmail             = errors.New("format alamat email tidak valid")
	ErrPasswordTooShort         = errors.New("password minimal harus 6 karakter")
	ErrPasswordRequired        = errors.New("password wajib diisi untuk pengguna baru")
	ErrUserNotFound             = errors.New("pengguna tidak ditemukan")
	ErrDuplicateEmail           = errors.New("alamat email sudah terdaftar di sistem")
)

func ListUsers(ctx context.Context, search, roleFilter string) ([]models.UserAccount, error) {
	return repositories.ListUsers(ctx, search, roleFilter)
}

func GetUserByID(ctx context.Context, id string) (*models.UserAccount, error) {
	u, err := repositories.GetUserByID(ctx, id)
	if errors.Is(err, repositories.ErrNotFound) {
		return nil, ErrUserNotFound
	}
	return u, err
}

func CreateUser(ctx context.Context, req *models.CreateUserRequest) (*models.UserAccount, error) {
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Role = strings.TrimSpace(req.Role)
	req.Bidang = strings.TrimSpace(req.Bidang)

	if req.Name == "" {
		return nil, errors.New("nama lengkap wajib diisi")
	}

	if _, err := mail.ParseAddress(req.Email); err != nil {
		return nil, ErrInvalidEmail
	}

	if req.Role == "super_admin" {
		return nil, ErrCannotCreateSuperAdmin
	}

	if req.Role != "admin" && req.Role != "admin_bidang" {
		return nil, ErrInvalidRole
	}

	if req.Role == "admin_bidang" && req.Bidang == "" {
		return nil, ErrBidangRequired
	}

	if len(req.Password) < 6 {
		return nil, ErrPasswordTooShort
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	u, err := repositories.CreateUser(ctx, req, string(hashed))
	if errors.Is(err, repositories.ErrDuplicate) {
		return nil, ErrDuplicateEmail
	}
	return u, err
}

func UpdateUser(ctx context.Context, id string, req *models.UpdateUserRequest) (*models.UserAccount, error) {
	existing, err := repositories.GetUserByID(ctx, id)
	if errors.Is(err, repositories.ErrNotFound) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Role = strings.TrimSpace(req.Role)
	req.Bidang = strings.TrimSpace(req.Bidang)

	if req.Name == "" {
		return nil, errors.New("nama lengkap wajib diisi")
	}

	if _, err := mail.ParseAddress(req.Email); err != nil {
		return nil, ErrInvalidEmail
	}

	// Proteksi khusus Super Admin utama
	if existing.Role == "super_admin" {
		if req.Role != "super_admin" {
			return nil, ErrCannotDemoteSuperAdmin
		}
		if req.IsActive != nil && !*req.IsActive {
			return nil, ErrCannotDeactivateSuperAdmin
		}
	} else {
		// Pengguna biasa tidak boleh dinaikkan jadi super_admin
		if req.Role == "super_admin" {
			return nil, ErrCannotPromoteToSuperAdmin
		}
		if req.Role != "admin" && req.Role != "admin_bidang" {
			return nil, ErrInvalidRole
		}
		if req.Role == "admin_bidang" && req.Bidang == "" {
			return nil, ErrBidangRequired
		}
	}

	var newHash string
	if req.Password != "" {
		if len(req.Password) < 6 {
			return nil, ErrPasswordTooShort
		}
		h, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		newHash = string(h)
	}

	u, err := repositories.UpdateUser(ctx, id, req, newHash)
	if errors.Is(err, repositories.ErrNotFound) {
		return nil, ErrUserNotFound
	}
	if errors.Is(err, repositories.ErrDuplicate) {
		return nil, ErrDuplicateEmail
	}
	if err == nil {
		InvalidateUserProfileCache(existing.Email, req.Email)
	}
	return u, err
}

func DeleteUser(ctx context.Context, id string) error {
	existing, err := repositories.GetUserByID(ctx, id)
	if errors.Is(err, repositories.ErrNotFound) {
		return ErrUserNotFound
	}
	if err != nil {
		return err
	}

	if existing.Role == "super_admin" {
		return ErrCannotDeleteSuperAdmin
	}

	err = repositories.DeleteUser(ctx, id)
	if errors.Is(err, repositories.ErrNotFound) {
		return ErrUserNotFound
	}
	if err == nil {
		InvalidateUserProfileCache(existing.Email)
	}
	return err
}
