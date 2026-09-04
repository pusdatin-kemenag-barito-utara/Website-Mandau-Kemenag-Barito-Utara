package models

import "time"

type UserAccount struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Email       string     `json:"email"`
	Role        string     `json:"role"`
	Bidang      string     `json:"bidang"`
	Avatar      string     `json:"avatar"`
	Phone       string     `json:"phone"`
	IsActive    bool       `json:"is_active"`
	LastLoginAt *time.Time `json:"last_login_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type CreateUserRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
	Bidang   string `json:"bidang"`
	Phone    string `json:"phone"`
	IsActive *bool  `json:"is_active"`
}

type UpdateUserRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password,omitempty"`
	Role     string `json:"role"`
	Bidang   string `json:"bidang"`
	Phone    string `json:"phone"`
	IsActive *bool  `json:"is_active"`
}
