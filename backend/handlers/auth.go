package handlers

import (
	"context"
	"errors"
	"fmt"
	"os"
	"time"

	"e-surat-backend/models"
	"e-surat-backend/pkg/response"
	"e-surat-backend/services"

	"github.com/gofiber/fiber/v3"
)

func LoginHandler(c fiber.Ctx) error {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("🔥 CRITICAL LOGIN PANIC RECOVERED: %v\n", r)
		}
	}()

	var req models.LoginRequest
	if err := c.Bind().Body(&req); err != nil {
		return response.BadRequest(c, "Format masukan email atau kata sandi tidak valid.")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	tokenString, user, err := services.Login(ctx, req.Email, req.Password, req.TurnstileToken, c.IP())
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidCredentials):
			return response.Unauthorized(c, "Email atau kata sandi yang Anda masukkan salah.")
		case errors.Is(err, services.ErrTurnstile):
			return response.BadRequest(c, "Verifikasi anti-bot Cloudflare gagal. Silakan coba lagi.")
		case errors.Is(err, services.ErrDatabase):
			return response.Internal(c, "Koneksi database belum terinisialisasi.")
		default:
			return response.Internal(c, "Gagal menerbitkan token sesi autentikasi.")
		}
	}

	c.Cookie(&fiber.Cookie{
		Name:     "sb-esurat-auth-token",
		Value:    tokenString,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HTTPOnly: true,
		Path:     "/",
		SameSite: "Lax",
		Secure:   os.Getenv("GO_ENV") == "production",
	})

	return response.Created(c, "Berhasil masuk", fiber.Map{
		"token": tokenString,
		"user":  user,
	})
}

func GetMeHandler(c fiber.Ctx) error {
	userEmail, _ := c.Locals("userEmail").(string)
	userID, _ := c.Locals("userID").(string)

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	user := services.GetMe(ctx, userEmail)
	user.ID = userID
	return response.OK(c, user)
}

func LogoutHandler(c fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     "sb-esurat-auth-token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		HTTPOnly: true,
		Path:     "/",
		SameSite: "Lax",
		Secure:   os.Getenv("GO_ENV") == "production",
	})
	return response.Message(c, "Berhasil keluar")
}