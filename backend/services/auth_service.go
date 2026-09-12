package services

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
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

	formData := url.Values{
		"secret":   {secretKey},
		"response": {token},
	}

	// Jangan kirim remoteip jika loopback (127.0.0.1 / ::1) atau private IP karena Cloudflare akan menolak dengan error "invalid-remoteip"
	isLoopbackOrPrivate := clientIP == "" || clientIP == "127.0.0.1" || clientIP == "::1" ||
		strings.HasPrefix(clientIP, "192.168.") || strings.HasPrefix(clientIP, "10.") || strings.HasPrefix(clientIP, "172.")
	if !isLoopbackOrPrivate {
		formData.Set("remoteip", clientIP)
	}

	resp, err := http.PostForm("https://challenges.cloudflare.com/turnstile/v0/siteverify", formData)
	if err != nil {
		fmt.Printf("⚠️ Turnstile HTTP error: %v\n", err)
		return true // Fail open on network error to avoid locking out users
	}
	defer resp.Body.Close()

	var result struct {
		Success    bool     `json:"success"`
		ErrorCodes []string `json:"error-codes"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		fmt.Printf("⚠️ Turnstile JSON decode error: %v\n", err)
		return true
	}

	if !result.Success {
		fmt.Printf("❌ Turnstile verification failed: error-codes=%v (clientIP: %s, isLocal: %v)\n", result.ErrorCodes, clientIP, isLoopbackOrPrivate)
		// Jika pengujian di localhost/development dan gagal karena domain/IP, izinkan agar tidak terblokir saat dev
		if os.Getenv("GO_ENV") != "production" && (clientIP == "127.0.0.1" || clientIP == "::1") {
			fmt.Println("ℹ️ Mengabaikan kegagalan Turnstile pada environment development / localhost")
			return true
		}
		return false
	}
	return true
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
	jwtSecret := middleware.GetJWTSecret()
	if len(jwtSecret) == 0 {
		return "", models.User{}, fmt.Errorf("JWT_SECRET environment variable is not configured")
	}
	tokenString, err := token.SignedString(jwtSecret)
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

type cachedUserProfile struct {
	user      models.User
	expiresAt time.Time
}

var (
	userProfileCache   = make(map[string]cachedUserProfile)
	userProfileCacheMu sync.RWMutex
)

// InvalidateUserProfileCache evicts user cache on update/delete
func InvalidateUserProfileCache(emails ...string) {
	userProfileCacheMu.Lock()
	defer userProfileCacheMu.Unlock()
	if len(emails) > 0 {
		for _, em := range emails {
			if em != "" {
				delete(userProfileCache, em)
			}
		}
	} else {
		userProfileCache = make(map[string]cachedUserProfile)
	}
}

func GetMe(ctx context.Context, email string) models.User {
	userProfileCacheMu.RLock()
	if item, ok := userProfileCache[email]; ok && time.Now().Before(item.expiresAt) {
		cached := item.user
		userProfileCacheMu.RUnlock()
		return cached
	}
	userProfileCacheMu.RUnlock()

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

	userProfileCacheMu.Lock()
	userProfileCache[email] = cachedUserProfile{
		user:      user,
		expiresAt: time.Now().Add(2 * time.Minute),
	}
	userProfileCacheMu.Unlock()

	return user
}