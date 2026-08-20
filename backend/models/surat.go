package models

import "time"

type SuratMasuk struct {
	ID            string    `json:"id"`
	NomorSurat    string    `json:"nomor_surat"`
	TanggalSurat  string    `json:"tanggal_surat"`
	TanggalTerima string    `json:"tanggal_terima"`
	AsalSurat     string    `json:"asal_surat"`
	Perihal       string    `json:"perihal"`
	Agenda        string    `json:"agenda"`
	Status        string    `json:"status"`
	Lampiran      string    `json:"lampiran"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type SuratKeluar struct {
	ID           string    `json:"id"`
	NomorSurat   string    `json:"nomor_surat"`
	TanggalSurat string    `json:"tanggal_surat"`
	TujuanSurat  string    `json:"tujuan_surat"`
	Perihal      string    `json:"perihal"`
	Agenda       string    `json:"agenda"`
	UnitKerja    string    `json:"unit_kerja"`
	Status       string    `json:"status"`
	Lampiran     string    `json:"lampiran"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type MasterOption struct {
	ID         string    `json:"id"`
	Category   string    `json:"category"`
	Code       string    `json:"code"`
	Name       string    `json:"name"`
	BadgeColor string    `json:"badge_color"`
	SortOrder  int       `json:"sort_order"`
	IsActive   bool      `json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type User struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Role    string `json:"role"`
	Avatar  string `json:"avatar"`
	IsSuper bool   `json:"is_super_admin"`
}

type LoginRequest struct {
	Email          string `json:"email"`
	Password       string `json:"password"`
	TurnstileToken string `json:"turnstile_token,omitempty"`
}

type APIResponse struct {
	Success  bool        `json:"success"`
	Message  string      `json:"message,omitempty"`
	Error    string      `json:"error,omitempty"`
	Data     interface{} `json:"data,omitempty"`
	Total    int         `json:"total,omitempty"`
	Page     int         `json:"page,omitempty"`
	PageSize int         `json:"pageSize,omitempty"`
}

type DashboardStats struct {
	TotalSuratMasuk     int          `json:"totalSuratMasuk"`
	TotalSuratKeluar    int          `json:"totalSuratKeluar"`
	SuratMasukBulanIni  int          `json:"suratMasukBulanIni"`
	SuratKeluarBulanIni int          `json:"suratKeluarBulanIni"`
	RecentSuratMasuk    []SuratMasuk `json:"recentSuratMasuk"`
	RecentSuratKeluar   []SuratKeluar `json:"recentSuratKeluar"`
}