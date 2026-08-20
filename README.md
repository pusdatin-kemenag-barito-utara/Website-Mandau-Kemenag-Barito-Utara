# SI MANDAU — E-Surat Kemenag Barito Utara

Monorepo aplikasi Sistem Informasi Manajemen Persuratan Elektronik (E-Surat).

## Arsitektur

| Bagian | Teknologi | Lokasi |
|--------|-----------|--------|
| **Frontend** | Astro 7 + React 19 (islands) + Tailwind CSS v4 | `frontend/` |
| **Backend** | Golang (Fiber) — full REST API | `backend/` |
| **Database** | PostgreSQL (Supabase instance PTSP Kemenag) | — |
| **Storage** | Cloudflare R2 (lampiran PDF) | — |

Frontend bersifat FE-only: seluruh logika bisnis, database, dan integrasi eksternal
(Turnstile, audit, storage) ditangani backend Go. Akses data lewat same-origin
proxy `/api/v1/*` (`frontend/src/pages/api/[...path].ts`) yang meneruskan ke Go
(`GO_API_URL`, default `http://127.0.0.1:8080`).

## Struktur Backend (Go Fiber)

```
backend/
├── main.go                # Init config + app + routes.Setup
├── config/                # Init DB pool (PostgreSQL) & R2 client
├── routes/routes.go       # Registrasi semua rute API v1
├── middleware/            # AuthRequired (JWT + cookie)
├── handlers/              # Lapisan HTTP tipis (parse → service → response)
├── services/              # Logika bisnis (auth, surat, master option, storage, audit)
├── repositories/          # SQL murni + sentinel error (ErrNotFound, ErrDuplicate)
├── models/                # Domain + request/response
└── pkg/response/          # Helper respons JSON terpusat (OK/Error/BadRequest dll.)
```

- Handler tipis: validasi form/JSON → panggil service → `pkg/response`.
- `repositories` menangani SQL; pembuatan nomor eksternal `SM-/SK-` dilindungi
  `pg_advisory_xact_lock` agar tidak duplikat saat request bersamaan.
- Semua respons memakai envelope `models.APIResponse` (tidak ada `fiber.Map` campuran).

## Struktur Frontend (Astro)

```
frontend/src/
├── middleware.ts        # Auth guard (cookie → /auth/me), super-admin guard, security headers
├── env.d.ts             # Tipe Astro.locals (authToken, user)
├── layouts/             # RootLayout, AdminLayout
├── pages/               # index, login, unauthorized, maintenance, surat-masuk/keluar, manajemen-surat
│   └── api/             # [...path].ts (reverse proxy ke Go), health.ts
├── components/          # React islands (client:load) + komponen statis
└── lib/                 # api-client (createApiClient), constants, utils, validations
```

- `createApiClient(token)` — klien server dengan token dari `Astro.locals.authToken`;
  `apiClient` default untuk komponen client (token dari `document.cookie`).
- Semua mutasi data lewat REST API Go; tidak ada server actions / koneksi DB di FE.

## Perintah

| Command | Keterangan |
|---------|------------|
| `npm run dev` | Jalankan Go (8080, hot-reload **Air**) + Astro dev (3000) bersamaan |
| `npm run dev:backend` | Backend Go dengan hot-reload Air (rebuild + restart otomatis saat `.go` berubah) |
| `npm run dev:backend:go` | Backend Go tanpa Air (`go run`) — fallback bila Air belum terinstal |
| `npm run dev:frontend` | Astro dev saja (port 3000) |
| `npm run build:backend` | Build Go → `api-mandau` |
| `npm run build:frontend` | Build Astro (SSR, node adapter standalone) → `frontend/dist` |
| `cd frontend && npm run check` | `astro check` (type check) |

> **Hot-reload backend**: instal Air sekali (`go install github.com/air-verse/air@latest`).
> Konfigurasi di `backend/.air.toml` — build ke `backend/tmp/` (di-ignore git),
> restart otomatis setiap file `.go` disimpan.

## Env (`frontend/.env.local` di root monorepo)

- `PUBLIC_API_URL` — base API dari sisi browser (default `/api/v1`, same-origin proxy)
- `GO_API_URL` — base Go untuk proxy & middleware (server-side)
- `PUBLIC_PUSDATIN_URL`, `PUBLIC_TURNSTILE_SITE_KEY` — integrasi Pusdatin & Turnstile
- `SUPER_ADMIN_EMAIL` — akun super admin (server-side)
- `TURNSTILE_SECRET_KEY`, `DATABASE_URL`, `R2_*` — dipakai backend Go
- `GO_ENV=production` — set cookie auth `Secure` di produksi (set di `docker-compose.yml`, jangan di `.env.local` agar dev lokal tetap HTTP)

## Docker

Root `Dockerfile` membangun Go + Astro ke satu image; `docker-compose.yml`
menjalankan backend dan frontend sebagai dua service terpisah.