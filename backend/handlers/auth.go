package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"time"

	"e-surat-backend/config"
	"e-surat-backend/middleware"
	"e-surat-backend/models"
	"e-surat-backend/services"

	"github.com/gofiber/fiber/v2"
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

func LoginHandler(c *fiber.Ctx) error {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("🔥 CRITICAL LOGIN PANIC RECOVERED: %v\n", r)
		}
	}()
	clientIP := c.IP()
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIResponse{
			Success: false,
			Error:   "Format masukan email atau kata sandi tidak valid.",
		})
	}

	if req.TurnstileToken != "" && !verifyCloudflareTurnstile(req.TurnstileToken, clientIP) {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIResponse{
			Success: false,
			Error:   "Verifikasi anti-bot Cloudflare gagal. Silakan coba lagi.",
		})
	}

	if config.DB == nil {
		fmt.Println("⚠️ config.DB is NIL in LoginHandler!")
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIResponse{
			Success: false,
			Error:   "Koneksi database belum terinisialisasi.",
		})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var userID, encryptedPassword string
	query := `SELECT id, encrypted_password FROM auth.users WHERE email = $1 LIMIT 1`
	err := config.DB.QueryRow(ctx, query, req.Email).Scan(&userID, &encryptedPassword)
	if err != nil {
		fmt.Printf("⚠️ Login DB Query Error for %s: %v\n", req.Email, err)
		email := req.Email
		go services.CreateAuditLog(context.Background(), email, "LOGIN_FAILED", "AUTH", email, clientIP, map[string]interface{}{
			"status": "FAILED",
			"reason": "Email not found",
		})
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIResponse{
			Success: false,
			Error:   "Email atau kata sandi yang Anda masukkan salah.",
		})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(encryptedPassword), []byte(req.Password)); err != nil {
		fmt.Printf("⚠️ Login Bcrypt Password Mismatch for %s: %v\n", req.Email, err)
		email := req.Email
		go services.CreateAuditLog(context.Background(), email, "LOGIN_FAILED", "AUTH", email, clientIP, map[string]interface{}{
			"status": "FAILED",
			"reason": "Invalid password",
		})
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIResponse{
			Success: false,
			Error:   "Email atau kata sandi yang Anda masukkan salah.",
		})
	}

	superAdminEmail := os.Getenv("SUPER_ADMIN_EMAIL")
	isSuper := req.Email == superAdminEmail

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":            userID,
		"email":          req.Email,
		"role":           "admin",
		"is_super_admin": isSuper,
		"exp":            time.Now().Add(7 * 24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString(middleware.JWTSecret)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIResponse{
			Success: false,
			Error:   "Gagal menerbitkan token sesi autentikasi.",
		})
	}

	c.Cookie(&fiber.Cookie{
		Name:     "sb-esurat-auth-token",
		Value:    tokenString,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HTTPOnly: true,
		Path:     "/",
		SameSite: "Lax",
		Secure:   os.Getenv("NODE_ENV") == "production",
	})

	email := req.Email
	go services.CreateAuditLog(context.Background(), email, "LOGIN_SUCCESS", "AUTH", email, clientIP, map[string]interface{}{
		"status": "SUCCESS",
	})

	return c.JSON(models.APIResponse{
		Success: true,
		Message: "Berhasil masuk",
		Data: fiber.Map{
			"token": tokenString,
			"user": models.User{
				ID:      userID,
				Email:   req.Email,
				IsSuper: isSuper,
			},
		},
	})
}

func GetMeHandler(c *fiber.Ctx) error {
	userEmail, _ := c.Locals("userEmail").(string)
	userID, _ := c.Locals("userID").(string)

	superAdminEmail := os.Getenv("SUPER_ADMIN_EMAIL")

	var name, role, avatar string
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	query := `SELECT name, role, COALESCE(avatar, '') FROM kemenag_pusdatin.profiles WHERE email = $1 LIMIT 1`
	err := config.DB.QueryRow(ctx, query, userEmail).Scan(&name, &role, &avatar)
	if err != nil {
		name = "Admin"
		role = "Admin Surat"
	}

	isSuper := userEmail == superAdminEmail || role == "super_admin"

	return c.JSON(models.APIResponse{
		Success: true,
		Data: models.User{
			ID:      userID,
			Name:    name,
			Email:   userEmail,
			Role:    role,
			Avatar:  avatar,
			IsSuper: isSuper,
		},
	})
}

func LogoutHandler(c *fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     "sb-esurat-auth-token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		HTTPOnly: true,
		Path:     "/",
		SameSite: "Lax",
	})
	return c.JSON(models.APIResponse{
		Success: true,
		Message: "Berhasil keluar",
	})
}
