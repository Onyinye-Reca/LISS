# Deployment

This repo has two deployable apps:

- `apps/web`: Vite/React static site.
- `apps/api`: long-running Express API with Prisma/PostgreSQL.

## Recommended Production Setup

Use Netlify for the web app, a Node host for the API, and managed Postgres for data.

- Web: Netlify
- API: Render, Railway, Fly.io, or another Node service host
- Database: Supabase Postgres or Neon Postgres
- Data management: Supabase Table Editor plus Prisma Studio for schema-aware edits

This keeps the current Express server model intact and avoids reshaping the API into serverless functions before the product needs that.

## Staging Environment

Yes: before production, create a staging environment that mirrors production but uses separate resources.

- Staging web: Netlify deploy preview, branch deploy, or a separate Netlify site such as `liss11.netlify.app`
- Staging API: separate service such as `liss11-api-staging`
- Staging database: separate Supabase/Neon Postgres database
- Production web: `https://liss11.org`
- Production API: `https://api.liss11.org`
- Production database: separate production Postgres database

Never point staging at the production database. The whole point is to test migrations, auth cookies, CORS, and data workflows without risking live alumni data.

Suggested staging URLs:

```bash
WEB_ORIGIN=https://liss11.netlify.app
VITE_API_BASE=https://api-staging.liss11.org
```

Suggested production URLs:

```bash
WEB_ORIGIN=https://liss11.org
VITE_API_BASE=https://api.liss11.org
```

### Staging Checklist

1. Create a separate staging Postgres database.
2. Deploy a separate staging API service.
3. Set the staging API env vars from `apps/api/.env.staging.example`.
4. Run production-style migrations against staging:

```bash
npm run db:migrate:deploy
```

5. Deploy the web app to a Netlify branch deploy, deploy preview, or staging site.
6. Set the staging web env vars from `apps/web/.env.staging.example`.
7. Test the full flow:

- `GET /health/` returns `{ ok: true }`
- Register a test member
- Log in and confirm the auth cookie is set
- Hit `GET /health/secure` with an admin-role account
- Confirm CORS works from the staging web domain
- Confirm Prisma Studio or the database dashboard can see the test records
- Confirm migrations did not fail and the votes trigger exists

When staging passes, promote the same commit to production and run `npm run db:migrate:deploy` against the production database.

### One-Click Staging API On Render

This repo includes `render.yaml`, which defines:

- `liss11-api-staging`: staging Node web service
- `liss11-staging-db`: staging Postgres database
- generated `JWT_SECRET`
- `DATABASE_URL` wired from the staging database
- `preDeployCommand` running `npm run db:migrate:deploy`

To create it:

1. Push this repo to GitHub.
2. In Render, create a new Blueprint from the repo.
3. Review the generated staging service and database.
4. Confirm the `basic-256mb` staging database plan, or switch to Supabase/Neon and set `DATABASE_URL` manually instead.
5. Leave `SENTRY_DSN` blank unless you already have a Sentry project.
6. Deploy.

After it deploys, test the API:

```bash
API_BASE=https://liss11-api-staging.onrender.com npm run smoke:api
```

If you add a custom domain such as `https://api-staging.liss11.org`, update DNS and use:

```bash
API_BASE=https://api-staging.liss11.org npm run smoke:api
```

### Netlify Staging

The root `netlify.toml` now sets:

- production API base: `https://api.liss11.org`
- deploy preview API base: `https://api-staging.liss11.org`
- branch deploy API base: `https://api-staging.liss11.org`
- `staging` branch API base: `https://api-staging.liss11.org`

To test the web before production:

1. Push a `staging` branch or open a PR.
2. Let Netlify create the branch deploy or deploy preview.
3. Confirm the staging web points at the staging API.
4. Run through register, login, secure health check, and database visibility.

## Web On Netlify

The root `netlify.toml` deploys the Vite app:

```bash
npm run build:shared && npm run build:web
```

Netlify settings:

- Build command: `npm run build:shared && npm run build:web`
- Publish directory: `apps/web/dist`
- Node version: `20`

Set this environment variable in Netlify:

```bash
VITE_API_BASE=https://api.liss11.org
```

If the API is served behind the same Netlify domain later, use:

```bash
VITE_API_BASE=/api
```

## API On A Node Host

Deploy `apps/api` as a Node service.

Build command:

```bash
npm ci --include=dev
npm run build:shared
npm run build:api
npm run db:migrate:deploy
```

Start command:

```bash
npm run start --workspace apps/api
```

Production environment variables:

```bash
NODE_ENV=production
PORT=4000
WEB_ORIGIN=https://liss11.org
API_BASE_URL=https://api.liss11.org
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
JWT_SECRET=replace-with-a-long-random-secret
COOKIE_SECURE=true
SENTRY_DSN=

# Email: production sends from lissclass11@gmail.com via Gmail SMTP.
# SMTP_PASS is a Google App Password for that account (2-Step Verification
# required), not the login password. Staging uses emove.nig@gmail.com instead.
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=lissclass11@gmail.com
SMTP_PASS=replace-with-lissclass11-app-password
EMAIL_FROM=LISS11' Alumni <lissclass11@gmail.com>
```

Use `prisma migrate deploy` in production. Do not use `prisma migrate dev` against the production database.

## Production Data Management

For the first production release, use Supabase Postgres. It gives you:

- Hosted Postgres compatible with Prisma
- Dashboard table editor for controlled manual fixes
- Backups and connection details
- SQL editor for one-off operational queries

You can also manage data locally through Prisma Studio against production when needed:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public" npm run prisma:studio --workspace apps/api
```

Treat production edits as admin operations:

- Prefer app/admin workflows for routine changes.
- Use Supabase Table Editor or Prisma Studio only for controlled support tasks.
- Avoid editing `Vote` rows manually; the database trigger intentionally blocks vote updates and deletes.
- Take a backup before bulk edits.

For staging data, it is fine to create fake alumni/member/payment/election records and reset the staging database whenever needed.

## If You Still Want The API On Netlify

Netlify can host Node serverless functions, but this API is currently a normal Express server that calls `app.listen(...)`. To run it on Netlify Functions, the API should be refactored to export the Express app separately from the listener, then wrapped by a function handler.

That path also needs extra attention for Prisma connection pooling, cold starts, function timeouts, and route prefixes. It is doable, but the Node-service deployment above is the cleaner first production deployment for this codebase.
