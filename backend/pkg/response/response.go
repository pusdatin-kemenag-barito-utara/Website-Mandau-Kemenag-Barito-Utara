package response

import (
	"github.com/gofiber/fiber/v2"

	"e-surat-backend/models"
)

func OK(c *fiber.Ctx, data interface{}) error {
	return c.JSON(models.APIResponse{Success: true, Data: data})
}

func OKWithTotal(c *fiber.Ctx, data interface{}, total, page, pageSize int) error {
	return c.JSON(models.APIResponse{
		Success:  true,
		Data:     data,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

func Message(c *fiber.Ctx, msg string) error {
	return c.JSON(models.APIResponse{Success: true, Message: msg})
}

func Created(c *fiber.Ctx, msg string, data interface{}) error {
	return c.JSON(models.APIResponse{Success: true, Message: msg, Data: data})
}

func BadRequest(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusBadRequest).JSON(models.APIResponse{Success: false, Error: msg})
}

func Unauthorized(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusUnauthorized).JSON(models.APIResponse{Success: false, Error: msg})
}

func NotFound(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusNotFound).JSON(models.APIResponse{Success: false, Error: msg})
}

func Internal(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusInternalServerError).JSON(models.APIResponse{Success: false, Error: msg})
}

func Error(c *fiber.Ctx, status int, msg string) error {
	return c.Status(status).JSON(models.APIResponse{Success: false, Error: msg})
}