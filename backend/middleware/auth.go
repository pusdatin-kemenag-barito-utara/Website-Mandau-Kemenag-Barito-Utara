package middleware

import (
	"os"
	"strings"

	"e-surat-backend/models"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

var JWTSecret = []byte(getJWTSecret())

func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "super-secret-mandau-kemenag-key-2026"
	}
	return secret
}

func AuthRequired(c fiber.Ctx) error {
	tokenString := c.Cookies("sb-esurat-auth-token")

	if tokenString == "" {
		authHeader := c.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if tokenString == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIResponse{
			Success: false,
			Error:   "Sesi login tidak valid atau telah berakhir.",
		})
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fiber.ErrUnauthorized
		}
		return JWTSecret, nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIResponse{
			Success: false,
			Error:   "Sesi autentikasi telah kadaluarsa. Silakan login kembali.",
		})
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIResponse{
			Success: false,
			Error:   "Token klaim tidak valid.",
		})
	}

	c.Locals("userID", claims["sub"])
	c.Locals("userEmail", claims["email"])
	c.Locals("userRole", claims["role"])

	return c.Next()
}