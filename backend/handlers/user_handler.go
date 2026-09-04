package handlers

import (
	"context"
	"errors"
	"time"

	"e-surat-backend/models"
	"e-surat-backend/pkg/response"
	"e-surat-backend/services"

	"github.com/gofiber/fiber/v3"
)

func GetUsersHandler(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	search := c.Query("search")
	role := c.Query("role")

	users, err := services.ListUsers(ctx, search, role)
	if err != nil {
		return response.Internal(c, "Gagal memuat daftar pengguna.")
	}
	return response.OK(c, users)
}

func GetUserDetailHandler(c fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return response.BadRequest(c, "ID pengguna tidak valid.")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	u, err := services.GetUserByID(ctx, id)
	if err != nil {
		if errors.Is(err, services.ErrUserNotFound) {
			return response.NotFound(c, "Pengguna tidak ditemukan.")
		}
		return response.Internal(c, "Gagal mengambil data pengguna.")
	}
	return response.OK(c, u)
}

func CreateUserHandler(c fiber.Ctx) error {
	var req models.CreateUserRequest
	if err := c.Bind().Body(&req); err != nil {
		return response.BadRequest(c, "Format data tidak valid.")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	u, err := services.CreateUser(ctx, &req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Created(c, "Pengguna baru berhasil ditambahkan.", u)
}

func UpdateUserHandler(c fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return response.BadRequest(c, "ID pengguna tidak valid.")
	}

	var req models.UpdateUserRequest
	if err := c.Bind().Body(&req); err != nil {
		return response.BadRequest(c, "Format data tidak valid.")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	u, err := services.UpdateUser(ctx, id, &req)
	if err != nil {
		if errors.Is(err, services.ErrUserNotFound) {
			return response.NotFound(c, "Pengguna tidak ditemukan.")
		}
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, u)
}

func DeleteUserHandler(c fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return response.BadRequest(c, "ID pengguna tidak valid.")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := services.DeleteUser(ctx, id)
	if err != nil {
		if errors.Is(err, services.ErrUserNotFound) {
			return response.NotFound(c, "Pengguna tidak ditemukan.")
		}
		return response.BadRequest(c, err.Error())
	}
	return response.Message(c, "Pengguna berhasil dihapus.")
}
