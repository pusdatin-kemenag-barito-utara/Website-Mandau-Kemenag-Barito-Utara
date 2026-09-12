# E-Surat Kemenag — Agent Guide

## Commands

| Command | What |
|---|---|
| `npm run install:all` | Install semua dependensi root, frontend (npm), dan backend (`go mod download`) |
| `npm run dev` | concurrently: Go backend (8080, hot-reload via Air) + Astro frontend (3000) |
| `npm run dev:frontend` | Astro dev only (port 3000) |
| `npm run dev:backend` | Go backend via Air (auto rebuild + restart on `.go` save) |
| `npm run dev:backend:go` | Go backend plain `go run` (fallback tanpa Air) |
| `npm run build:frontend` | `astro build` → `frontend/dist` |
| `npm run build:backend` | `go build` → `api-mandau` |
| `cd frontend && npm run check` | `astro check` (type check) |

## Architecture

- **Monorepo**: `backend/` (Go Fiber REST API, port 8080) + `frontend/` (Astro 7 + React 19 islands, Tailwind v4)
- **Backend modular**: `routes/` (registrasi rute) → `handlers/` (tipis) → `services/` (bisnis) → `repositories/` (SQL + sentinel error `ErrNotFound`/`ErrDuplicate`); respons via `pkg/response`; ID surat pakai `pg_advisory_xact_lock` anti-race
- **Frontend is FE-only**: tidak ada server actions, tidak ada Drizzle/pg/Supabase di FE — semua data via REST API Go
- **API access**: same-origin reverse proxy `frontend/src/pages/api/[...path].ts` → `GO_API_URL` (default `http://127.0.0.1:8080/api/v1`)
- **Auth**: cookie `sb-esurat-auth-token`; `src/middleware.ts` memvalidasi via Go `/auth/me`, set `Astro.locals.user` + `Astro.locals.authToken`, guard super-admin di `/manajemen-surat`, dan pasang security headers (CSP dll.)
- **Server data fetching**: `createApiClient(token)` dari `src/lib/api-client.ts`; komponen client pakai `apiClient` (token dari `document.cookie`)
- **Deployment**: Node adapter standalone (`astro.config.mjs`), root `Dockerfile` build Go + Astro satu image

## Rules

1. Never execute terminal commands yourself — always ask the user
2. Jangan pernah menjalankan perintah `npm run typecheck` atau perintah pengecekan secara otomatis/mandiri — selalu tunggu arahan dan instruksi langsung dari user.
3. `sonner` untuk toasts, `lucide-react` untuk icons, `framer-motion` untuk animations
4. Komponen interaktif = React island (`client:load`); tambahkan `client:load` di `.astro` page
5. Env: `PUBLIC_*` untuk browser, `process.env.*` hanya di server (middleware/endpoints); `GO_ENV=production` (backend) untuk cookie `Secure`