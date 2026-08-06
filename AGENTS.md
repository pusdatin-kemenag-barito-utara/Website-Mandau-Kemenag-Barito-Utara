# E-Surat Kemenag — Agent Guide

## Commands

| Command | What |
|---------|------|
| `npm run dev` | next dev |
| `npm run build` | next build |
| `npm run typecheck` | tsc --noEmit |
| `npm run db:push` | drizzle-kit push |
| `npm run db:generate` | drizzle-kit generate |

## Architecture

- **Next.js 16 App Router** + React 19, TypeScript, Tailwind CSS v4
- **Supabase** (Auth + PostgreSQL)
- **Drizzle ORM** with node-postgres
- **Database**: Same Supabase instance as PTSP Kemenag
- **Supabase clients**: `lib/supabase/client.ts` (browser), `server.ts` (server component with admin client), `middleware.ts` (session refresh helper)
- **Edge middleware**: `proxy.ts` (named export `proxy`) — handles session refresh, auth guard, security headers. Do NOT rename to `middleware.ts`.
- **Server actions**: `lib/actions/admin-persuratan.ts`
- **Auth**: `lib/auth.ts` — `requireAuth()` for all server actions
- **Roles**: Not implemented; all authenticated users get full access

## Rules

1. Never execute terminal commands yourself — always ask the user
2. For Supabase Storage operations, use `createAdminClient()` (service_role)
3. `sonner` for toasts, `lucide-react` for icons, `framer-motion` for animations
4. Jangan pernah menjalankan perintah `npm run typecheck` atau perintah pengecekan secara otomatis/mandiri — selalu tunggu arahan dan instruksi langsung dari user.
