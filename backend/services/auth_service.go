package services

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"os"
	"time"

	"e-surat-backend/config"
	"e-surat-backend/middleware"
	"e-surat-backend/models"
	"e-surat-backend/repositories"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func verifyCloudflareTurnstile(token, clientIP string) bool {
	secretKey := os.Getenv("TURNSTILE_SECRET_KEY")
	if secretKey == "" || token == "" {
		return true // Skip verification if not set or local test
	}

	resp, err := http.PostForm("https://challenges.cloudflare.com/turnstile/v0/siteverify", url.Values{
		"secret":   {secretKey},
		"response": {token},
		"remoteip": {clientIP},
	})
	if err != nil {
		return true
	}
	defer resp.Body.Close()

	var result struct {
		Success bool `json:"success"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return true
	}
	return result.Success
}

func Login(ctx context.Context, email, password, turnstileToken, clientIP string) (string, models.User, error) {
	if config.DB == nil {
		return "", models.User{}, ErrDatabase
	}

	if turnstileToken != "" && !verifyCloudflareTurnstile(turnstileToken, clientIP) {
		return "", models.User{}, ErrTurnstile
	}

	userID, encryptedPassword, role, err := repositories.GetUserCredentials(ctx, email)
	if err != nil {
		go CreateAuditLog(context.Background(), email, "LOGIN_FAILED", "AUTH", email, clientIP, map[string]interface{}{
			"status": "FAILED",
			"reason": "Email not found",
		})
		return "", models.User{}, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(encryptedPassword), []byte(password)); err != nil {
		go CreateAuditLog(context.Background(), email, "LOGIN_FAILED", "AUTH", email, clientIP, map[string]interface{}{
			"status": "FAILED",
			"reason": "Invalid password",
		})
		return "", models.User{}, ErrInvalidCredentials
	}

	isSuper := role == "super_admin" || email == os.Getenv("SUPER_ADMIN_EMAIL")

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":            userID,
		"email":          email,
		"role":           role,
		"is_super_admin": isSuper,
		"exp":            time.Now().Add(7 * 24 * time.Hour).Unix(),
	})
	tokenString, err := token.SignedString(middleware.JWTSecret)
	if err != nil {
		return "", models.User{}, err
	}

	go func() {
		_ = repositories.UpdateUserLastLogin(context.Background(), userID)
	}()

	go CreateAuditLog(context.Background(), email, "LOGIN_SUCCESS", "AUTH", email, clientIP, map[string]interface{}{
		"status": "SUCCESS",
	})

	return tokenString, models.User{ID: userID, Email: email, Role: role, IsSuper: isSuper}, nil
}

func GetMe(ctx context.Context, email string) models.User {
	user := models.User{
		Email:   email,
		Name:    "Pengguna",
		Role:    "admin",
		IsSuper: email == os.Getenv("SUPER_ADMIN_EMAIL"),
	}

	name, role, avatar, _, err := repositories.GetUserProfile(ctx, email)
	if err == nil {
		user.Name = name
		user.Role = role
		user.Avatar = avatar
	}
	if role == "super_admin" {
		user.IsSuper = true
	}
	return user
}