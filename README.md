# backend-practice

A learning-focused full-stack project built with **Next.js 14**, **TypeScript**, **Prisma**, and **PostgreSQL**.

**Goals:** learn database connections, REST APIs, production deployments, automated routines, and real-world security practices.

---

## Stack

| Technology | Role |
|-----------|------|
| Next.js 14 (App Router) | Full-stack framework |
| TypeScript (strict) | Static typing |
| Prisma | ORM + migrations |
| PostgreSQL | Database (Docker locally, Neon in production) |
| Vercel | Deploy + cron jobs |
| Resend | Transactional emails |
| Zod | Runtime schema validation |
| Upstash Redis | Serverless rate limiting |
| Docker | Local environment + production containerization |
| Tailwind CSS | Styling |

---

## Local Setup

### Option A — Docker (recommended, zero local dependencies)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/backend-practice
cd backend-practice

# 2. Copy environment variables
cp .env.example .env.local
# Edit .env.local — only DATABASE_URL is required for Docker:
#   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/backend_practice"

# 3. Start everything (PostgreSQL + Next.js app)
docker compose up

# 4. In a separate terminal, run migrations and seed
docker compose exec app npx prisma migrate dev --name init
docker compose exec app npx prisma db seed
```

App available at http://localhost:3000

### Option B — Local Node.js

```bash
# Prerequisites: Node.js 20+, PostgreSQL running locally

# 1. Clone and install
git clone https://github.com/your-username/backend-practice
cd backend-practice
npm install

# 2. Copy and fill environment variables
cp .env.example .env.local
# Required: DATABASE_URL pointing to your local PostgreSQL

# 3. Run database migrations
npx prisma migrate dev --name init

# 4. (Optional) Seed with example data
npx prisma db seed

# 5. Start the dev server
npm run dev
```

App available at http://localhost:3000

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values.

| Variable | Required | Description |
|---------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `RESEND_API_KEY` | For emails | Get at resend.com |
| `EMAIL_FROM` | For emails | Verified sender address |
| `EMAIL_TO` | For emails | Report recipient |
| `CRON_SECRET` | For cron | Random secret — `openssl rand -hex 32` |
| `UPSTASH_REDIS_REST_URL` | For rate limiting | Get at upstash.com |
| `UPSTASH_REDIS_REST_TOKEN` | For rate limiting | Get at upstash.com |
| `NEXT_PUBLIC_APP_URL` | For emails | Full URL of the deployed app |

---

## API Reference

All endpoints accept and return `application/json`.

### Tasks

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tasks` | List all tasks |
| `GET` | `/api/tasks?status=PENDING` | Filter by status |
| `POST` | `/api/tasks` | Create a task |
| `GET` | `/api/tasks/:id` | Get a task |
| `PUT` | `/api/tasks/:id` | Update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task |

**POST /api/tasks**
```json
{
  "title": "Learn Docker",
  "description": "Optional description",
  "userId": "optional-user-cuid"
}
```

**PUT /api/tasks/:id**
```json
{
  "title": "Updated title",
  "status": "IN_PROGRESS"
}
```

### Users

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/users` | List all users (with task count) |
| `POST` | `/api/users` | Create a user |
| `GET` | `/api/users/:id` | Get user with their tasks |
| `PUT` | `/api/users/:id` | Update a user |
| `DELETE` | `/api/users/:id` | Delete a user |

### Cron Jobs

| Method | Path | Trigger |
|--------|------|---------|
| `POST` | `/api/cron/weekly-report` | Every Monday 9:00 AM UTC (Vercel) |

Test the cron manually:
```bash
curl -X POST http://localhost:3000/api/cron/weekly-report \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Error Responses

All errors follow this shape:
```json
{
  "error": "Human-readable message",
  "details": { "field": ["validation error"] }
}
```

HTTP status codes used:
- `400` Bad Request — validation errors
- `401` Unauthorized — missing or invalid auth
- `404` Not Found — resource doesn't exist
- `409` Conflict — duplicate unique field (e.g., email)
- `429` Too Many Requests — rate limit exceeded
- `500` Internal Server Error — unexpected server error

---

## Security

This project implements several security layers as a learning exercise:

| Layer | Implementation | Purpose |
|-------|---------------|---------|
| **Security headers** | `src/middleware.ts` | Prevent XSS, clickjacking, MIME sniffing |
| **Content Security Policy** | `src/middleware.ts` | Control what resources can load |
| **Rate limiting** | Upstash Redis (Edge) | Block API abuse |
| **Input validation** | Zod schemas | Reject malformed or malicious input |
| **Cron auth** | Bearer token check | Prevent unauthorized job triggers |
| **No secret leakage** | `.env.local` + `.gitignore` | Secrets never reach git |
| **Non-root Docker** | `Dockerfile` | Limit container blast radius |
| **HSTS** | `Strict-Transport-Security` header | Force HTTPS |

---

## Deploy to Vercel

```bash
# 1. Push to GitHub
git push origin main
```

2. Go to [vercel.com](https://vercel.com) → Import repository
3. Add all environment variables from `.env.example`
4. In **Build & Development Settings**, set Build Command to:
   ```
   npx prisma generate && next build
   ```
5. Deploy

Cron jobs activate automatically once the project is deployed (see `vercel.json`).

---

## Useful Commands

```bash
# Development
npm run dev                           # Start dev server with hot reload

# Database
npx prisma migrate dev --name name   # Create and apply a migration
npx prisma migrate deploy            # Apply pending migrations (production)
npx prisma db seed                   # Seed the database
npx prisma studio                    # Open Prisma Studio (visual DB browser)
npx prisma generate                  # Regenerate the Prisma Client

# Docker
docker compose up                    # Start all services
docker compose up --build            # Rebuild before starting
docker compose down                  # Stop and remove containers
docker compose down -v               # Stop and remove containers + volumes (wipe DB)
docker compose exec app sh           # Shell into the running app container

# Production build
npm run build                        # Build for production
npm run start                        # Start production server
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── tasks/           # GET, POST /api/tasks
│   │   │   └── [id]/        # GET, PUT, DELETE /api/tasks/:id
│   │   ├── users/           # GET, POST /api/users
│   │   │   └── [id]/        # GET, PUT, DELETE /api/users/:id
│   │   └── cron/
│   │       └── weekly-report/  # POST — weekly email report
│   ├── tasks/               # Frontend task CRUD page
│   ├── users/               # Frontend user CRUD page
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── prisma.ts            # Prisma Client singleton
│   ├── validations.ts       # Zod schemas
│   ├── email.ts             # Resend email utilities
│   └── api-helpers.ts       # Response helpers + error handler
├── middleware.ts             # Security headers + rate limiting
└── types/
    └── index.ts             # Global TypeScript types
prisma/
├── schema.prisma            # Database schema
└── seed.ts                  # Example data
```

---

## Next Steps

- [ ] Add authentication with [NextAuth.js](https://next-auth.js.org/)
- [ ] Add pagination (`skip`/`take` in Prisma)
- [ ] Write unit tests with [Vitest](https://vitest.dev/)
- [ ] Add structured logging with [Pino](https://getpino.io/)
- [ ] Implement full-text search with Postgres `tsvector`
- [ ] Add a webhook endpoint that receives external events
- [ ] Set up GitHub Actions CI pipeline
