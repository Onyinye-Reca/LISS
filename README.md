# LISS11' Alumni Website

Monorepo (npm workspaces) for the LISS11' alumni site. Frontend and backend are
separate apps; a shared package holds the typed contract between them.

```
liss11/
  packages/shared   # Role enum + Zod DTOs, imported by both apps
  apps/api          # Express + InversifyJS + Prisma (Postgres)
  apps/web          # Vite + React + Tailwind (brand tokens preloaded)
```

## Stack

- **API** — Express, InversifyJS (DI), Prisma, JWT in an httpOnly cookie,
  bcrypt (cost 12), Zod validation, helmet, CORS locked to the web origin,
  login rate limiting. Layered controller → service → repository.
- **Web** — Vite + React + TypeScript + Tailwind, PRD brand tokens
  (Maroon `#76301F`, Gold `#C08D33`, Inter, 8px grid).
- **DB** — Postgres. Core tables: members, elections, positions, candidates,
  the INSERT-only votes table, payments. The votes table's immutability is
  enforced by a DB trigger (`apps/api/prisma/votes_immutability.sql`).

## Prerequisites

- Node 18.18+ (CI uses Node 20)
- Postgres — either Docker (`docker compose up -d`) or a local install

## Setup

```bash
# 1. install everything
npm install

# 2. build the shared package (both apps import its types)
npm run build:shared

# 3. start Postgres (skip if you have your own)
docker compose up -d

# 4. configure the API
cd apps/api
cp .env.example .env          # set JWT_SECRET; DATABASE_URL works as-is with docker compose
npm run prisma:generate
npm run prisma:migrate -- --name init

# 5. (optional) apply the votes immutability trigger
#    psql "$DATABASE_URL" -f prisma/votes_immutability.sql

# 6. configure the web app
cd ../web
cp .env.example .env
```

## Run

Two terminals from the repo root:

```bash
npm run dev:api    # http://localhost:4000
npm run dev:web    # http://localhost:5173
```

Open http://localhost:5173. A **green status dot** means both apps are running
and talking across origins — Sprint 0 is done.

## Smoke-test auth

Mutating routes require a CSRF token (double-submit cookie). The web app's
`apiFetch` helper handles this automatically; with curl, fetch a token first and
reuse one cookie jar. The browser/`apiFetch` flow does not need these manual
steps — they're only for raw curl testing.

```bash
# get a CSRF token + cookie (jar shared across the calls below)
TOKEN=$(curl -s -c cookies.txt http://localhost:4000/csrf | sed 's/.*"csrfToken":"\([^"]*\)".*/\1/')

# register
curl -i -b cookies.txt -X POST http://localhost:4000/auth/register \
  -H 'Content-Type: application/json' -H "X-CSRF-Token: $TOKEN" \
  -d '{"fullName":"Test User","email":"test@example.com","password":"password123"}'

# verify via the link printed in the API console, then log in
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' -H "X-CSRF-Token: $TOKEN" \
  -d '{"email":"test@example.com","password":"password123"}'

# authenticated route (GET — no CSRF header needed)
curl -i -b cookies.txt http://localhost:4000/auth/me
```

> Note: `/health/secure` requires an ADMIN/SUPER_ADMIN role. Promote a member in
> the DB (or via Prisma Studio) to test the role guard.

## Notes

- `apps/api/src/repositories/member.repository.ts` imports types from
  `@prisma/client`, which only exist after `prisma generate` (step 4). A red
  squiggle there before that step is expected.
- Email links are logged by `ConsoleEmailService` when `RESEND_API_KEY` is
  blank. For temporary Resend testing, set `RESEND_API_KEY` and keep
  `EMAIL_FROM="LISS11' Alumni <onboarding@resend.dev>"`; Resend only allows
  that sender to email the Resend account's own address. For production, replace
  `EMAIL_FROM` with a sender on a verified domain, such as
  `LISS11' Alumni <no-reply@liss11alumni.org>`.
