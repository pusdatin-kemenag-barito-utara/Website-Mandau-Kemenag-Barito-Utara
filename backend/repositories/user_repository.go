package repositories

import (
	"context"
	"errors"
	"strings"

	"e-surat-backend/config"
	"e-surat-backend/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

func GetUserCredentials(ctx context.Context, email string) (id, passwordHash, role string, err error) {
	err = config.DB.QueryRow(ctx, `
		SELECT id::text, password_hash, role 
		FROM kemenag_surat.users 
		WHERE LOWER(email) = LOWER($1) AND is_active = true 
		LIMIT 1
	`, email).Scan(&id, &passwordHash, &role)

	if errors.Is(err, pgx.ErrNoRows) {
		// Fallback ke auth.users jika akun belum ada di kemenag_surat.users
		var legacyID, legacyHash string
		errLegacy := config.DB.QueryRow(ctx, `SELECT id::text, encrypted_password FROM auth.users WHERE LOWER(email) = LOWER($1) LIMIT 1`, email).Scan(&legacyID, &legacyHash)
		if errLegacy == nil {
			return legacyID, legacyHash, "admin", nil
		}
		return "", "", "", ErrNotFound
	}
	return id, passwordHash, role, err
}

func GetUserProfile(ctx context.Context, email string) (name, role, avatar, bidang string, err error) {
	err = config.DB.QueryRow(ctx, `
		SELECT name, role, COALESCE(avatar, ''), COALESCE(bidang, '') 
		FROM kemenag_surat.users 
		WHERE LOWER(email) = LOWER($1) 
		LIMIT 1
	`, email).Scan(&name, &role, &avatar, &bidang)

	if errors.Is(err, pgx.ErrNoRows) {
		// Fallback ke kemenag_pusdatin.profiles
		errFallback := config.DB.QueryRow(ctx, `SELECT name, role, COALESCE(avatar, '') FROM kemenag_pusdatin.profiles WHERE LOWER(email) = LOWER($1) LIMIT 1`, email).Scan(&name, &role, &avatar)
		if errors.Is(errFallback, pgx.ErrNoRows) {
			return "", "", "", "", ErrNotFound
		}
		return name, role, avatar, "", nil
	}
	return name, role, avatar, bidang, err
}

func UpdateUserLastLogin(ctx context.Context, id string) error {
	_, err := config.DB.Exec(ctx, `UPDATE kemenag_surat.users SET last_login_at = NOW() WHERE id = $1`, id)
	return err
}

func ListUsers(ctx context.Context, search, roleFilter string) ([]models.UserAccount, error) {
	query := `
		SELECT id::text, name, email, role, COALESCE(bidang, ''), COALESCE(avatar, ''), COALESCE(phone, ''), is_active, last_login_at, created_at, updated_at
		FROM kemenag_surat.users
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	if strings.TrimSpace(search) != "" {
		s := "%" + strings.ToLower(strings.TrimSpace(search)) + "%"
		query += ` AND (LOWER(name) LIKE $` + string(rune('0'+argIdx)) + ` OR LOWER(email) LIKE $` + string(rune('0'+argIdx)) + ` OR LOWER(COALESCE(bidang, '')) LIKE $` + string(rune('0'+argIdx)) + `)`
		args = append(args, s)
		argIdx++
	}

	if strings.TrimSpace(roleFilter) != "" && roleFilter != "all" {
		query += ` AND role = $` + string(rune('0'+argIdx))
		args = append(args, roleFilter)
		argIdx++
	}

	query += `
		ORDER BY 
			CASE 
				WHEN role = 'super_admin' THEN 1 
				WHEN role = 'admin' THEN 2 
				ELSE 3 
			END, 
			name ASC
	`

	rows, err := config.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []models.UserAccount{}
	for rows.Next() {
		var u models.UserAccount
		if err := rows.Scan(
			&u.ID, &u.Name, &u.Email, &u.Role, &u.Bidang, &u.Avatar, &u.Phone,
			&u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, err
		}
		users = append(users, u)
	}

	return users, rows.Err()
}

func GetUserByID(ctx context.Context, id string) (*models.UserAccount, error) {
	var u models.UserAccount
	err := config.DB.QueryRow(ctx, `
		SELECT id::text, name, email, role, COALESCE(bidang, ''), COALESCE(avatar, ''), COALESCE(phone, ''), is_active, last_login_at, created_at, updated_at
		FROM kemenag_surat.users
		WHERE id = $1
		LIMIT 1
	`, id).Scan(
		&u.ID, &u.Name, &u.Email, &u.Role, &u.Bidang, &u.Avatar, &u.Phone,
		&u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func CreateUser(ctx context.Context, req *models.CreateUserRequest, passwordHash string) (*models.UserAccount, error) {
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	var u models.UserAccount
	err := config.DB.QueryRow(ctx, `
		INSERT INTO kemenag_surat.users (name, email, password_hash, role, bidang, phone, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id::text, name, email, role, COALESCE(bidang, ''), COALESCE(avatar, ''), COALESCE(phone, ''), is_active, last_login_at, created_at, updated_at
	`, req.Name, strings.ToLower(strings.TrimSpace(req.Email)), passwordHash, req.Role, req.Bidang, req.Phone, isActive).Scan(
		&u.ID, &u.Name, &u.Email, &u.Role, &u.Bidang, &u.Avatar, &u.Phone,
		&u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrDuplicate
		}
		return nil, err
	}

	return &u, nil
}

func UpdateUser(ctx context.Context, id string, req *models.UpdateUserRequest, newPasswordHash string) (*models.UserAccount, error) {
	var u models.UserAccount

	query := `
		UPDATE kemenag_surat.users
		SET name = $1, email = $2, role = $3, bidang = $4, phone = $5, updated_at = NOW()
	`
	args := []interface{}{req.Name, strings.ToLower(strings.TrimSpace(req.Email)), req.Role, req.Bidang, req.Phone}
	argIdx := 6

	if req.IsActive != nil {
		query += `, is_active = $` + string(rune('0'+argIdx))
		args = append(args, *req.IsActive)
		argIdx++
	}

	if newPasswordHash != "" {
		query += `, password_hash = $` + string(rune('0'+argIdx))
		args = append(args, newPasswordHash)
		argIdx++
	}

	query += ` WHERE id = $` + string(rune('0'+argIdx)) + `
		RETURNING id::text, name, email, role, COALESCE(bidang, ''), COALESCE(avatar, ''), COALESCE(phone, ''), is_active, last_login_at, created_at, updated_at
	`
	args = append(args, id)

	err := config.DB.QueryRow(ctx, query, args...).Scan(
		&u.ID, &u.Name, &u.Email, &u.Role, &u.Bidang, &u.Avatar, &u.Phone,
		&u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrDuplicate
		}
		return nil, err
	}

	return &u, nil
}

func DeleteUser(ctx context.Context, id string) error {
	ct, err := config.DB.Exec(ctx, `DELETE FROM kemenag_surat.users WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}