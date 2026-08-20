package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func parsePagination(c *fiber.Ctx) (page, pageSize int) {
	page, _ = strconv.Atoi(c.Query("page", "1"))
	pageSize, _ = strconv.Atoi(c.Query("pageSize", "5000"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 5000
	}
	return page, pageSize
}