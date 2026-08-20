package repositories

import (
	"context"
	"errors"

	"e-surat-backend/config"

	"github.com/jackc/pgx/v5"
)

func GetUserCredentials(ctx context.Context, email string) (id, passwordHash string, err error) {
	err = config.DB.QueryRow(ctx, `SELECT id, encrypted_password FROM auth.users WHERE email = $1 LIMIT 1`, email).Scan(&id, &passwordHash)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", "", ErrNotFound
	}
	return id, passwordHash, err
}

func GetUserProfile(ctx context.Context, email string) (name, role, avatar string, err error) {
	err = config.DB.QueryRow(ctx, `SELECT name, role, COALESCE(avatar, '') FROM kemenag_pusdatin.profiles WHERE email = $1 LIMIT 1`, email).Scan(&name, &role, &avatar)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", "", "", ErrNotFound
	}
	return name, role, avatar, err
}