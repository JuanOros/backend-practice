# Claude Code Prompt — backend-practice

> **How to use:** Place this file inside your `backend-practice/` directory, open Claude Code in that directory, and paste this entire file as your prompt. Claude Code will build the project incrementally, committing and branching as a real developer would.

---

## Project Overview

You are acting as a senior developer building a **learning-focused full-stack project** called `backend-practice` (the directory already exists and you are inside it).

The goal is **educational**: learn how to connect a database, build reusable REST APIs, deploy to production, configure automated routines (cron jobs), and apply real-world security practices. Code must be **heavily commented** explaining the "why" behind every decision.

The project includes a **simple frontend** to visually test the CRUD without needing Postman or curl.

---

## Rules you must follow

- **Everything in English** — all code, comments, commit messages, branch names, README
- **Commit early and often** — every logical unit of work gets its own commit
- **Follow conventional commits** — format: `type(scope): description` (e.g. `feat(api): add tasks CRUD endpoints`)
- **Use proper branching** — never commit features directly to `main`
- **Comment every non-trivial decision** — this is a learning project
- **Never commit secrets** — `.env` and `.env.local` must stay in `.gitignore`
- **Docker must work** — the full project must be runnable with `docker compose up`

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | Frontend + backend in one project |
| Language | TypeScript (strict mode) | Static typing for learning |
| ORM | Prisma | Migrations, auto-generated types, great DX |
| Database | PostgreSQL | Via Docker locally, Neon free tier in production |
| Deploy | Vercel (free tier) | Auto CI/CD, native cron job support |
| Email | Resend | Simple SDK, 3,000 emails/month free |
| Styling | Tailwind CSS | Utility-first, included in create-next-app |
| Validation | Zod | Schema validation with full TypeScript integration |
| Security | helmet-csp + custom middleware | HTTP headers, rate limiting, input sanitization |
| Rate limiting | Upstash Redis + @upstash/ratelimit | Serverless-compatible rate limiting |

---

## Git Branching Strategy

Use **GitHub Flow** (simple, industry standard for small teams):

```
main                  ← always deployable, protected
├── feat/project-setup
├── feat/database-schema
├── feat/api-tasks
├── feat/api-users
├── feat/security-middleware
├── feat/cron-jobs
├── feat/frontend-crud
└── feat/docker
```

**Branch naming conventions:**
- `feat/` — new features
- `fix/` — bug fixes
- `chore/` — tooling, deps, config (no production code)
- `docs/` — documentation only

**Merge strategy:** After finishing each branch, merge into `main` with `--no-ff` to preserve history, then delete the branch.

---

## Conventional Commits Reference

```
feat(scope):     new feature
fix(scope):      bug fix
chore(scope):    tooling, config, deps
docs(scope):     documentation
refactor(scope): code change without behavior change
security(scope): security fix or hardening
test(scope):     adding or fixing tests
```

Examples:
```
feat(db): add Prisma schema with User and Task models
feat(api): implement GET and POST /api/tasks
security(middleware): add rate limiting and security headers
chore(docker): add Dockerfile and docker-compose
docs(readme): add full setup and deployment guide
```

---

## Step-by-Step Build Instructions

Execute **in this exact order**. Each step ends with a commit.

---

### STEP 1 — Project initialization (branch: `feat/project-setup`)

```bash
# Start from main and create the setup branch
git checkout main
git checkout -b feat/project-setup

# Bootstrap the Next.js project INTO the current directory
npx create-next-app@latest . --typescript --app --tailwind --eslint --src-dir --import-alias "@/*"

# Install all production dependencies
npm install prisma @prisma/client zod resend @upstash/ratelimit @upstash/redis

# Install dev dependencies
npm install -D ts-node @types/node

# Initialize Prisma
npx prisma init
```

**Create `.env.example`** (this goes to git — it documents required variables):

```env
# ─── Database ──────────────────────────────────────────────────────────────
# Get a free PostgreSQL database at https://neon.tech
# For local Docker development, use: postgresql://postgres:postgres@localhost:5432/backend_practice
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

# ─── Email (Resend) ────────────────────────────────────────────────────────
# Get your API key at https://resend.com (3,000 emails/month free)
RESEND_API_KEY="re_xxxxxxxxxxxxxx"

# The "from" address — must be verified in your Resend account
EMAIL_FROM="noreply@yourdomain.com"

# Where weekly reports are sent
EMAIL_TO="your-personal@email.com"

# ─── Cron Job Security ─────────────────────────────────────────────────────
# Protects the cron endpoint from unauthorized calls
# Generate with: openssl rand -hex 32
CRON_SECRET="replace-with-a-strong-random-secret"

# ─── Rate Limiting (Upstash Redis) ─────────────────────────────────────────
# Get free Redis at https://upstash.com
# Leave empty to disable rate limiting locally
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# ─── App ───────────────────────────────────────────────────────────────────
# Used to build absolute URLs in emails and cron responses
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Update `.gitignore`** — add at the bottom:

```gitignore
# Environment files — NEVER commit real secrets
.env
.env.local
.env.*.local

# Prisma generated client (regenerated on build)
node_modules/.prisma

# Docker volumes
postgres_data/
```

**Commit:**
```bash
git add .
git commit -m "chore(setup): initialize Next.js 14 project with TypeScript and Tailwind"
```

---

### STEP 2 — Database schema (branch: `feat/database-schema`)

```bash
git checkout main
git merge feat/project-setup --no-ff -m "chore(setup): merge project initialization"
git branch -d feat/project-setup
git checkout -b feat/database-schema
```

**Create `prisma/schema.prisma`:**

```prisma
// prisma/schema.prisma
//
// This file defines your database structure.
// Think of it as the "blueprint" of your data.
//
// IMPORTANT: After ANY change to this file, run:
//   npx prisma migrate dev --name <description-of-change>
//
// Prisma will:
//   1. Generate a SQL migration file
//   2. Apply it to your database
//   3. Regenerate the TypeScript client

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  // DATABASE_URL is loaded from .env.local — never hardcode credentials
  url      = env("DATABASE_URL")
}

// ─── User ──────────────────────────────────────────────────────────────────
// A basic user model to demonstrate foreign key relationships.
// In a real app, you'd add password hash, roles, email verification, etc.
model User {
  id        String   @id @default(cuid())
  // cuid() generates collision-resistant IDs — safer than sequential integers
  // because they don't expose how many records exist in your database

  name      String
  email     String   @unique  // @unique creates a database index automatically

  // Timestamps — Prisma manages these automatically
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt  // auto-updates on every write

  // Relation: one user can have many tasks
  // This field doesn't create a column — it's a virtual relation for Prisma queries
  tasks     Task[]
}

// ─── Task ──────────────────────────────────────────────────────────────────
// The main entity for practicing CRUD operations.
model Task {
  id          String     @id @default(cuid())
  title       String
  description String?    // ? = nullable — this column allows NULL in the database

  status      TaskStatus @default(PENDING)

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Foreign key — links a task to a user
  // String? = nullable, so tasks can exist without an owner
  userId      String?
  user        User?      @relation(
    fields:     [userId],    // the column in THIS table
    references: [id],        // the column in the OTHER table
    onDelete:   SetNull      // if user is deleted, set userId to NULL (don't cascade-delete tasks)
  )
}

// ─── Enums ─────────────────────────────────────────────────────────────────
// Enums create a constrained set of allowed values at the database level.
// This is safer than storing raw strings like "pending" or "PENDING" inconsistently.
enum TaskStatus {
  PENDING
  IN_PROGRESS
  DONE
}
```

**Create `prisma/seed.ts`:**

```typescript
// prisma/seed.ts
//
// Seeds the database with example data for local development.
//
// Run with: npx prisma db seed
// (after adding "prisma": { "seed": "ts-node prisma/seed.ts" } to package.json)

import { PrismaClient, TaskStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data before seeding (idempotent — safe to run multiple times)
  // Order matters: delete tasks first because they reference users (foreign key)
  await prisma.task.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const alice = await prisma.user.create({
    data: { name: 'Alice Johnson', email: 'alice@example.com' },
  })

  const bob = await prisma.user.create({
    data: { name: 'Bob Williams', email: 'bob@example.com' },
  })

  // createMany is more efficient than calling create() in a loop
  // because it sends a single INSERT statement to the database
  await prisma.task.createMany({
    data: [
      {
        title: 'Learn Prisma ORM',
        description: 'Understand schema, migrations, and queries',
        status: TaskStatus.DONE,
        userId: alice.id,
      },
      {
        title: 'Build REST API with Next.js',
        description: 'Create CRUD endpoints using App Router API routes',
        status: TaskStatus.IN_PROGRESS,
        userId: alice.id,
      },
      {
        title: 'Deploy to Vercel',
        description: 'Set up CI/CD with automatic deploys from GitHub',
        status: TaskStatus.PENDING,
        userId: alice.id,
      },
      {
        title: 'Configure cron jobs',
        description: 'Schedule weekly email reports via Vercel crons',
        status: TaskStatus.PENDING,
        userId: bob.id,
      },
      {
        title: 'Implement security middleware',
        description: 'Add rate limiting, security headers, and input validation',
        status: TaskStatus.PENDING,
        userId: bob.id,
      },
    ],
  })

  console.log('✅ Seed completed successfully!')
  console.log(`   Created 2 users and 5 tasks`)
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    // Always disconnect after seeding — prevents the script from hanging
    await prisma.$disconnect()
  })
```

**Add seed script to `package.json`** (inside the root object):

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

**Commit:**
```bash
git add .
git commit -m "feat(db): add Prisma schema with User and Task models and seed script"
```

Merge to main:
```bash
git checkout main
git merge feat/database-schema --no-ff -m "feat(db): merge database schema"
git branch -d feat/database-schema
```

---

### STEP 3 — Core library files (branch: `feat/core-lib`)

```bash
git checkout main
git checkout -b feat/core-lib
```

**Create `src/lib/prisma.ts`:**

```typescript
// src/lib/prisma.ts
//
// Prisma Client singleton.
//
// WHY A SINGLETON?
// Next.js in development mode uses Hot Module Replacement (HMR), which
// re-executes module code on every file save. Without this pattern, each
// save would create a NEW PrismaClient instance, exhausting the database's
// connection pool very quickly.
//
// The singleton pattern stores the instance on `globalThis`, which
// survives HMR reloads. In production (where HMR doesn't run), a new
// instance is simply created once and reused for the lifetime of the process.

import { PrismaClient } from '@prisma/client'

// Extend the Node.js global type to include our Prisma instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Uncomment the line below to log every SQL query to your terminal.
    // Useful for debugging but very noisy — keep it off by default.
    // log: ['query', 'info', 'warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

**Create `src/lib/validations.ts`:**

```typescript
// src/lib/validations.ts
//
// Zod schemas for validating API request bodies.
//
// WHY ZOD?
// TypeScript types only exist at compile time — they disappear at runtime.
// When data arrives from an HTTP request, TypeScript has NO idea if it
// matches your types. Zod validates the actual runtime values and returns
// fully typed results.
//
// Pattern:
//   1. Define schema with z.object({...})
//   2. Infer the TypeScript type from the schema with z.infer<typeof schema>
//   3. In your API route: const result = schema.safeParse(body)
//   4. if (!result.success) return 400 with result.error.flatten().fieldErrors
//   5. Use result.data — it's now fully typed and validated

import { z } from 'zod'

// ─── Task Schemas ──────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be 200 characters or less')
    .trim(), // trim() removes leading/trailing whitespace before validation

  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .trim()
    .optional(),

  // cuid() validates that the string has the format of a Prisma CUID
  userId: z.string().cuid('Invalid user ID format').optional(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(1000).trim().nullable().optional(),
  // z.enum() restricts the value to one of the allowed strings
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE']).optional(),
})

// ─── User Schemas ──────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be 100 characters or less')
    .trim(),

  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address')
    .toLowerCase(), // normalize to lowercase before saving
})

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  email: z.string().email().toLowerCase().optional(),
})

// ─── Inferred TypeScript Types ─────────────────────────────────────────────
// These types are automatically derived from the schemas above.
// No need to manually keep types and schemas in sync — Zod does it for you.

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
```

**Create `src/lib/email.ts`:**

```typescript
// src/lib/email.ts
//
// Email sending utilities using Resend.
//
// Resend is a modern alternative to Nodemailer. It provides:
//   - A clean REST API (no SMTP configuration)
//   - Reliable delivery with built-in retries
//   - Dashboard to track email status
//   - 3,000 free emails/month

import { Resend } from 'resend'

// Resend client is initialized with the API key from environment variables.
// The ! asserts that RESEND_API_KEY is defined — make sure it is in .env.local
const resend = new Resend(process.env.RESEND_API_KEY!)

// ─── Types ─────────────────────────────────────────────────────────────────

export interface WeeklyReportData {
  totalTasks: number
  doneTasks: number
  pendingTasks: number
  inProgressTasks: number
}

// ─── Functions ─────────────────────────────────────────────────────────────

/**
 * Sends a weekly task summary report via email.
 * Called by the cron job at /api/cron/weekly-report.
 */
export async function sendWeeklyReport(data: WeeklyReportData): Promise<void> {
  const completionRate =
    data.totalTasks > 0
      ? Math.round((data.doneTasks / data.totalTasks) * 100)
      : 0

  const sentAt = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Resend accepts HTML directly — for production apps consider
  // using a templating library like react-email for more complex layouts
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: process.env.EMAIL_TO!,
    subject: `📋 Weekly Task Report — ${sentAt}`,
    html: buildReportHtml({ ...data, completionRate, sentAt }),
  })

  // Throw on failure so the cron endpoint can return an appropriate error response
  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

/**
 * Builds the HTML body for the weekly report email.
 * Extracted into its own function to keep sendWeeklyReport() clean
 * and to make the HTML independently testable.
 */
function buildReportHtml(data: WeeklyReportData & { completionRate: number; sentAt: string }): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9f9f9; margin: 0; padding: 32px;">
      <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #e5e5e5;">

        <h1 style="margin: 0 0 8px; font-size: 22px; color: #111;">Weekly Task Report</h1>
        <p style="margin: 0 0 24px; color: #666; font-size: 14px;">${data.sentAt}</p>

        <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #444;">Total tasks</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #111;">${data.totalTasks}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #444;">✅ Completed</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #16a34a;">${data.doneTasks}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #444;">🔄 In progress</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #2563eb;">${data.inProgressTasks}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #444;">⏳ Pending</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #d97706;">${data.pendingTasks}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; padding: 16px; background: ${data.completionRate >= 80 ? '#f0fdf4' : '#fef9c3'}; border-radius: 8px;">
          <p style="margin: 0; font-size: 28px; font-weight: 700; color: #111;">${data.completionRate}%</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #666;">completion rate</p>
        </div>

        <p style="margin: 24px 0 0; font-size: 12px; color: #aaa; text-align: center;">
          Generated automatically by backend-practice · <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #aaa;">Open dashboard</a>
        </p>
      </div>
    </body>
    </html>
  `
}
```

**Create `src/types/index.ts`:**

```typescript
// src/types/index.ts
//
// Global TypeScript types shared across the application.
// These extend or supplement the types auto-generated by Prisma.

import type { Task, User, TaskStatus } from '@prisma/client'

// ─── API Response Types ────────────────────────────────────────────────────
// These represent what the API actually returns (may differ from raw DB models
// because of included relations, omitted fields, etc.)

// Task with optional user relation included
export type TaskWithUser = Task & {
  user: Pick<User, 'id' | 'name' | 'email'> | null
}

// User with task count (used in the users list endpoint)
export type UserWithTaskCount = User & {
  _count: { tasks: number }
}

// User with their tasks (used in the single user endpoint)
export type UserWithTasks = User & {
  tasks: Task[]
}

// ─── API Error Response ────────────────────────────────────────────────────
// Consistent error shape across all API routes
export interface ApiError {
  error: string
  details?: Record<string, string[]> // field-level validation errors from Zod
}

// ─── Re-exports ────────────────────────────────────────────────────────────
// Re-export Prisma types so the rest of the app only needs to import from @/types
export type { Task, User, TaskStatus }
```

**Commit:**
```bash
git add .
git commit -m "feat(lib): add Prisma singleton, Zod validations, email utils, and global types"
```

Merge:
```bash
git checkout main
git merge feat/core-lib --no-ff -m "feat(lib): merge core library files"
git branch -d feat/core-lib
```

---

### STEP 4 — Security middleware (branch: `feat/security-middleware`)

```bash
git checkout main
git checkout -b feat/security-middleware
```

**Create `src/middleware.ts`** (Next.js middleware — runs before every request):

```typescript
// src/middleware.ts
//
// Next.js Edge Middleware — runs on the Edge Runtime BEFORE any route handler.
//
// This is the ideal place for:
//   - Security headers (prevent common web attacks)
//   - Rate limiting (block abuse before it hits your API)
//   - Request logging
//   - Authentication checks (in a more advanced setup)
//
// IMPORTANT: This file must be at src/middleware.ts (or middleware.ts at root).
// The `config.matcher` below controls which routes it applies to.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─── Rate Limiting ─────────────────────────────────────────────────────────
// We use Upstash Redis for rate limiting because it works in the Edge Runtime.
// Standard Node.js rate limiting libraries (express-rate-limit, etc.) do NOT
// work in Next.js middleware because it runs in a restricted environment.
//
// Upstash provides a serverless Redis that works over HTTP — perfect for Edge.

// Lazy-initialize the rate limiter only when Redis credentials are present.
// This allows the middleware to work locally without Upstash configured.
let ratelimit: any = null

async function getRateLimiter() {
  if (ratelimit) return ratelimit

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    // Rate limiting disabled — log a warning in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[middleware] Rate limiting disabled: UPSTASH_REDIS credentials not set')
    }
    return null
  }

  // Dynamic imports keep this code tree-shaken when Redis is not configured
  const { Ratelimit } = await import('@upstash/ratelimit')
  const { Redis } = await import('@upstash/redis')

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    // Sliding window: 60 requests per 60 seconds per IP
    // Adjust these numbers based on your API's expected traffic
    limiter: Ratelimit.slidingWindow(60, '60 s'),
    analytics: true, // enables dashboard analytics in Upstash console
  })

  return ratelimit
}

// ─── Middleware Function ───────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // ── 1. Security Headers ──────────────────────────────────────────────────
  // These HTTP response headers defend against common web attacks.
  // Learn more: https://owasp.org/www-project-secure-headers/

  // Prevents browsers from MIME-sniffing the content-type
  // (blocks certain types of XSS attacks)
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Prevents the page from being loaded in an iframe
  // (blocks clickjacking attacks)
  response.headers.set('X-Frame-Options', 'DENY')

  // Forces HTTPS for 1 year (only relevant in production)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  )

  // Controls what information is sent in the Referer header
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Disables browser features we don't need
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  // Content Security Policy (CSP) — controls what resources can be loaded.
  // This is one of the most powerful XSS defenses.
  // 'self' = only load from same origin
  // Adjust based on what external resources you actually use
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Next.js dev
      "style-src 'self' 'unsafe-inline'",                 // unsafe-inline needed for Tailwind
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  )

  // Remove the X-Powered-By header that Next.js adds by default.
  // Don't advertise what framework you're using — it helps attackers.
  response.headers.delete('X-Powered-By')

  // ── 2. Rate Limiting (API routes only) ───────────────────────────────────
  // Only apply rate limiting to API routes to avoid slowing down page loads
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const limiter = await getRateLimiter()

    if (limiter) {
      // Use IP address as the rate limit identifier.
      // request.ip is set by Vercel. On other platforms, check X-Forwarded-For.
      const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'
      const identifier = `api:${ip}`

      const { success, limit, reset, remaining } = await limiter.limit(identifier)

      // Always include rate limit info in headers (good API practice)
      response.headers.set('X-RateLimit-Limit', limit.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', reset.toString())

      if (!success) {
        // 429 Too Many Requests — standard HTTP status for rate limiting
        return new NextResponse(
          JSON.stringify({
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please wait before retrying.',
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
            },
          }
        )
      }
    }
  }

  return response
}

// ─── Matcher Config ────────────────────────────────────────────────────────
// Controls which routes this middleware runs on.
// This pattern excludes static files and Next.js internals for performance.
export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico   (browser favicon)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**Create `src/lib/api-helpers.ts`:**

```typescript
// src/lib/api-helpers.ts
//
// Helper functions for consistent API responses and error handling.
// Centralizing these avoids repeating the same patterns in every route.

import { NextResponse } from 'next/server'
import type { ApiError } from '@/types'

// ─── Response Helpers ──────────────────────────────────────────────────────

/** Returns a 200 OK response with JSON data */
export function ok<T>(data: T) {
  return NextResponse.json(data)
}

/** Returns a 201 Created response */
export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 })
}

/** Returns a 204 No Content response (used for DELETE) */
export function noContent() {
  return new NextResponse(null, { status: 204 })
}

/** Returns a 400 Bad Request with validation errors */
export function badRequest(error: string, details?: Record<string, string[]>) {
  const body: ApiError = { error, ...(details ? { details } : {}) }
  return NextResponse.json(body, { status: 400 })
}

/** Returns a 401 Unauthorized */
export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

/** Returns a 404 Not Found */
export function notFound(resource = 'Resource') {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 })
}

/** Returns a 409 Conflict (e.g., duplicate email) */
export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 })
}

/** Returns a 500 Internal Server Error */
export function serverError(message = 'Internal server error') {
  return NextResponse.json({ error: message }, { status: 500 })
}

// ─── Error Handler ─────────────────────────────────────────────────────────

/**
 * Wraps an async route handler with automatic error catching.
 * This prevents unhandled promise rejections from crashing your API.
 *
 * Usage:
 *   export const GET = withErrorHandler(async (req) => {
 *     // your logic here
 *   })
 */
export function withErrorHandler(
  handler: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any) => {
    try {
      return await handler(req, context)
    } catch (error) {
      // Log the full error server-side (never expose stack traces to clients)
      console.error(`[${req.method} ${new URL(req.url).pathname}]`, error)
      return serverError()
    }
  }
}
```

**Commit:**
```bash
git add .
git commit -m "security(middleware): add rate limiting, security headers, and CSP"
git add src/lib/api-helpers.ts
git commit -m "feat(lib): add API response helpers and error handler wrapper"
```

Merge:
```bash
git checkout main
git merge feat/security-middleware --no-ff -m "security(middleware): merge security middleware"
git branch -d feat/security-middleware
```

---

### STEP 5 — Tasks API (branch: `feat/api-tasks`)

```bash
git checkout main
git checkout -b feat/api-tasks
```

**Create `src/app/api/tasks/route.ts`:**

```typescript
// src/app/api/tasks/route.ts
//
// GET  /api/tasks       → list all tasks (optional ?status= filter)
// POST /api/tasks       → create a new task

import { prisma } from '@/lib/prisma'
import { createTaskSchema } from '@/lib/validations'
import { ok, created, badRequest, serverError } from '@/lib/api-helpers'
import { TaskStatus } from '@prisma/client'

// GET /api/tasks
// Supports: ?status=PENDING | IN_PROGRESS | DONE
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')

    // Validate the status query param if provided
    // Object.values() returns the enum values at runtime (TypeScript enums vanish at runtime)
    const validStatuses = Object.values(TaskStatus)
    const status = statusParam && validStatuses.includes(statusParam as TaskStatus)
      ? (statusParam as TaskStatus)
      : undefined

    const tasks = await prisma.task.findMany({
      where: status ? { status } : undefined,
      include: {
        // Select only the fields we need — avoid sending sensitive data
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(tasks)
  } catch (error) {
    console.error('[GET /api/tasks]', error)
    return serverError()
  }
}

// POST /api/tasks
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // safeParse does NOT throw — it returns { success, data } or { success: false, error }
    const result = createTaskSchema.safeParse(body)
    if (!result.success) {
      return badRequest('Validation failed', result.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const task = await prisma.task.create({
      data: result.data,
      include: { user: { select: { id: true, name: true } } },
    })

    return created(task)
  } catch (error) {
    console.error('[POST /api/tasks]', error)
    return serverError()
  }
}
```

**Create `src/app/api/tasks/[id]/route.ts`:**

```typescript
// src/app/api/tasks/[id]/route.ts
//
// GET    /api/tasks/:id  → get a single task
// PUT    /api/tasks/:id  → update a task
// DELETE /api/tasks/:id  → delete a task

import { prisma } from '@/lib/prisma'
import { updateTaskSchema } from '@/lib/validations'
import { ok, noContent, badRequest, notFound, serverError } from '@/lib/api-helpers'

type RouteContext = { params: { id: string } }

// GET /api/tasks/:id
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    if (!task) return notFound('Task')
    return ok(task)
  } catch (error) {
    console.error('[GET /api/tasks/:id]', error)
    return serverError()
  }
}

// PUT /api/tasks/:id
export async function PUT(request: Request, { params }: RouteContext) {
  try {
    // Check existence before parsing body to fail fast
    const existing = await prisma.task.findUnique({ where: { id: params.id } })
    if (!existing) return notFound('Task')

    const body = await request.json()
    const result = updateTaskSchema.safeParse(body)
    if (!result.success) {
      return badRequest('Validation failed', result.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data: result.data,
      include: { user: { select: { id: true, name: true } } },
    })

    return ok(task)
  } catch (error) {
    console.error('[PUT /api/tasks/:id]', error)
    return serverError()
  }
}

// DELETE /api/tasks/:id
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const existing = await prisma.task.findUnique({ where: { id: params.id } })
    if (!existing) return notFound('Task')

    await prisma.task.delete({ where: { id: params.id } })

    // 204 No Content is the correct HTTP status for a successful DELETE
    return noContent()
  } catch (error) {
    console.error('[DELETE /api/tasks/:id]', error)
    return serverError()
  }
}
```

**Commit:**
```bash
git add .
git commit -m "feat(api): implement full CRUD for /api/tasks"
```

Merge:
```bash
git checkout main
git merge feat/api-tasks --no-ff -m "feat(api): merge tasks API"
git branch -d feat/api-tasks
```

---

### STEP 6 — Users API (branch: `feat/api-users`)

```bash
git checkout main
git checkout -b feat/api-users
```

**Create `src/app/api/users/route.ts`:**

```typescript
// src/app/api/users/route.ts
//
// GET  /api/users  → list all users (with task count)
// POST /api/users  → create a user

import { prisma } from '@/lib/prisma'
import { createUserSchema } from '@/lib/validations'
import { ok, created, badRequest, conflict, serverError } from '@/lib/api-helpers'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        // _count is a special Prisma field that counts relations
        // without loading all the related records — much more efficient
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return ok(users)
  } catch (error) {
    console.error('[GET /api/users]', error)
    return serverError()
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = createUserSchema.safeParse(body)
    if (!result.success) {
      return badRequest('Validation failed', result.error.flatten().fieldErrors as Record<string, string[]>)
    }

    // Check for duplicate email before attempting to insert.
    // This gives a cleaner error message than catching the Prisma unique constraint error.
    const existingUser = await prisma.user.findUnique({
      where: { email: result.data.email },
    })
    if (existingUser) {
      return conflict('A user with this email already exists')
    }

    const user = await prisma.user.create({ data: result.data })
    return created(user)
  } catch (error) {
    console.error('[POST /api/users]', error)
    return serverError()
  }
}
```

**Create `src/app/api/users/[id]/route.ts`:**

```typescript
// src/app/api/users/[id]/route.ts

import { prisma } from '@/lib/prisma'
import { updateUserSchema } from '@/lib/validations'
import { ok, noContent, badRequest, conflict, notFound, serverError } from '@/lib/api-helpers'

type RouteContext = { params: { id: string } }

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: { tasks: { orderBy: { createdAt: 'desc' } } },
    })
    if (!user) return notFound('User')
    return ok(user)
  } catch (error) {
    console.error('[GET /api/users/:id]', error)
    return serverError()
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const existing = await prisma.user.findUnique({ where: { id: params.id } })
    if (!existing) return notFound('User')

    const body = await request.json()
    const result = updateUserSchema.safeParse(body)
    if (!result.success) {
      return badRequest('Validation failed', result.error.flatten().fieldErrors as Record<string, string[]>)
    }

    // Check for duplicate email if the email is being changed
    if (result.data.email && result.data.email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: result.data.email },
      })
      if (emailTaken) return conflict('Email is already in use')
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: result.data,
    })
    return ok(user)
  } catch (error) {
    console.error('[PUT /api/users/:id]', error)
    return serverError()
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const existing = await prisma.user.findUnique({ where: { id: params.id } })
    if (!existing) return notFound('User')

    await prisma.user.delete({ where: { id: params.id } })
    return noContent()
  } catch (error) {
    console.error('[DELETE /api/users/:id]', error)
    return serverError()
  }
}
```

**Commit:**
```bash
git add .
git commit -m "feat(api): implement full CRUD for /api/users"
```

Merge:
```bash
git checkout main
git merge feat/api-users --no-ff -m "feat(api): merge users API"
git branch -d feat/api-users
```

---

### STEP 7 — Cron Jobs (branch: `feat/cron-jobs`)

```bash
git checkout main
git checkout -b feat/cron-jobs
```

**Create `src/app/api/cron/weekly-report/route.ts`:**

```typescript
// src/app/api/cron/weekly-report/route.ts
//
// POST /api/cron/weekly-report
//
// This endpoint is called automatically by Vercel every Monday at 9:00 AM UTC.
// It can also be triggered manually (e.g., for testing) by sending a POST
// request with the correct Authorization header.
//
// HOW VERCEL CRONS WORK:
//   1. You define the schedule in vercel.json
//   2. Vercel calls the endpoint at the specified time
//   3. Vercel automatically includes: Authorization: Bearer <CRON_SECRET>
//   4. Your endpoint validates the secret and runs the job
//
// TESTING LOCALLY:
//   curl -X POST http://localhost:3000/api/cron/weekly-report \
//     -H "Authorization: Bearer your-cron-secret-here"

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWeeklyReport } from '@/lib/email'
import { unauthorized, serverError } from '@/lib/api-helpers'

export async function POST(request: Request) {
  // ── Security: Validate the cron secret ───────────────────────────────────
  // Without this check, anyone who discovers this URL could trigger the job.
  const authHeader = request.headers.get('authorization')
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`

  // Use a constant-time comparison to prevent timing attacks.
  // A timing attack exploits the fact that string comparison exits early
  // on the first non-matching character — leaking information about the secret.
  // (For full timing-safe comparison, use crypto.timingSafeEqual — this is simplified)
  if (!authHeader || authHeader !== expectedToken) {
    console.warn('[CRON] Unauthorized access attempt to /api/cron/weekly-report')
    return unauthorized()
  }

  try {
    // Use Promise.all() to run all COUNT queries in parallel — much faster
    // than running them sequentially with await
    const [totalTasks, doneTasks, pendingTasks, inProgressTasks] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { status: 'DONE' } }),
      prisma.task.count({ where: { status: 'PENDING' } }),
      prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
    ])

    await sendWeeklyReport({ totalTasks, doneTasks, pendingTasks, inProgressTasks })

    const result = {
      success: true,
      executedAt: new Date().toISOString(),
      report: { totalTasks, doneTasks, pendingTasks, inProgressTasks },
    }

    console.log('[CRON] Weekly report sent successfully:', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[CRON] Failed to send weekly report:', error)
    return serverError('Failed to process cron job')
  }
}
```

**Commit:**
```bash
git add .
git commit -m "feat(cron): add weekly report cron job endpoint with auth validation"
```

Merge:
```bash
git checkout main
git merge feat/cron-jobs --no-ff -m "feat(cron): merge cron jobs"
git branch -d feat/cron-jobs
```

---

### STEP 8 — Frontend CRUD (branch: `feat/frontend-crud`)

```bash
git checkout main
git checkout -b feat/frontend-crud
```

**Create `src/app/layout.tsx`:**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'backend-practice',
  description: 'Learning project — Next.js, Prisma, PostgreSQL, Vercel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <nav className="border-b border-gray-200 bg-white px-6 py-3">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <a href="/" className="font-semibold text-gray-900">backend-practice</a>
            <div className="flex gap-4 text-sm">
              <a href="/tasks" className="text-gray-500 hover:text-gray-900 transition-colors">Tasks</a>
              <a href="/users" className="text-gray-500 hover:text-gray-900 transition-colors">Users</a>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-4xl p-6">{children}</main>
      </body>
    </html>
  )
}
```

**Create `src/app/page.tsx`:**

```typescript
export default function Home() {
  const endpoints = [
    { method: 'GET',    color: 'text-green-600',  url: '/api/tasks' },
    { method: 'POST',   color: 'text-blue-600',   url: '/api/tasks' },
    { method: 'GET',    color: 'text-green-600',  url: '/api/tasks/:id' },
    { method: 'PUT',    color: 'text-yellow-600', url: '/api/tasks/:id' },
    { method: 'DELETE', color: 'text-red-600',    url: '/api/tasks/:id' },
    { method: 'GET',    color: 'text-green-600',  url: '/api/users' },
    { method: 'POST',   color: 'text-blue-600',   url: '/api/users' },
    { method: 'GET',    color: 'text-green-600',  url: '/api/users/:id' },
    { method: 'PUT',    color: 'text-yellow-600', url: '/api/users/:id' },
    { method: 'DELETE', color: 'text-red-600',    url: '/api/users/:id' },
    { method: 'POST',   color: 'text-blue-600',   url: '/api/cron/weekly-report' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">backend-practice</h1>
        <p className="mt-1 text-gray-500">Learning project — Next.js 14 · TypeScript · Prisma · PostgreSQL</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <a href="/tasks" className="rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all">
          <div className="text-2xl mb-2">📋</div>
          <h2 className="font-semibold">Tasks</h2>
          <p className="text-sm text-gray-500 mt-1">Full CRUD — create, list, update, delete</p>
        </a>
        <a href="/users" className="rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all">
          <div className="text-2xl mb-2">👥</div>
          <h2 className="font-semibold">Users</h2>
          <p className="text-sm text-gray-500 mt-1">User management with task associations</p>
        </a>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold mb-3">Available API Endpoints</h2>
        <div className="space-y-1.5 font-mono text-sm">
          {endpoints.map((e, i) => (
            <div key={i} className="flex gap-3">
              <span className={`w-14 shrink-0 font-medium ${e.color}`}>{e.method}</span>
              <span className="text-gray-600">{e.url}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Create `src/app/tasks/page.tsx`:**

```typescript
'use client'
// 'use client' tells Next.js this component runs in the browser.
// It's needed here because we use useState, useEffect, and event handlers.
// Server components (without this directive) run on the server and cannot use these.

import { useState, useEffect, useCallback } from 'react'

type Task = {
  id: string
  title: string
  description: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE'
  createdAt: string
  user: { id: string; name: string } | null
}

const STATUS_CONFIG = {
  PENDING:     { label: 'Pending',     classes: 'bg-gray-100 text-gray-700' },
  IN_PROGRESS: { label: 'In Progress', classes: 'bg-blue-100 text-blue-700' },
  DONE:        { label: 'Done',        classes: 'bg-green-100 text-green-700' },
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // useCallback memoizes the function so it doesn't get recreated on every render,
  // which is important when passing it as a dependency to useEffect
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) throw new Error('Failed to fetch tasks')
      setTasks(await res.json())
    } catch {
      setError('Could not load tasks. Is the server running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      if (!res.ok) throw new Error('Failed to create task')
      setNewTitle('')
      fetchTasks()
    } catch {
      setError('Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateStatus(id: string, status: Task['status']) {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      // Optimistic update: update local state immediately without waiting for a re-fetch
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    } catch {
      setError('Failed to update task')
    }
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch {
      setError('Failed to delete task')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Tasks</h1>
        <p className="text-sm text-gray-500">POST /api/tasks · GET /api/tasks · PUT/DELETE /api/tasks/:id</p>
      </div>

      <form onSubmit={createTask} className="flex gap-2">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="New task title..."
          disabled={submitting}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!newTitle.trim() || submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Creating...' : 'Create'}
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700 flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">dismiss</button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-gray-400">No tasks yet. Create your first one above.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{task.title}</p>
                {task.user && <p className="text-xs text-gray-400 mt-0.5">{task.user.name}</p>}
              </div>
              <select
                value={task.status}
                onChange={e => updateStatus(task.id, e.target.value as Task['status'])}
                className={`rounded-full px-3 py-1 text-xs font-medium border-0 cursor-pointer ${STATUS_CONFIG[task.status].classes}`}
              >
                {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                  <option key={v} value={v}>{c.label}</option>
                ))}
              </select>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-gray-300 hover:text-red-500 transition-colors text-xl leading-none"
                aria-label="Delete task"
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Create `src/app/users/page.tsx`** with a similar CRUD interface for users.

**Commit:**
```bash
git add .
git commit -m "feat(frontend): add task and user CRUD pages"
```

Merge:
```bash
git checkout main
git merge feat/frontend-crud --no-ff -m "feat(frontend): merge frontend CRUD pages"
git branch -d feat/frontend-crud
```

---

### STEP 9 — Docker (branch: `feat/docker`)

```bash
git checkout main
git checkout -b feat/docker
```

**Create `Dockerfile`:**

```dockerfile
# Dockerfile
#
# Multi-stage build: separates the build environment from the runtime environment.
#
# STAGE 1 (deps):    Install ALL dependencies (including devDependencies)
# STAGE 2 (builder): Build the Next.js app
# STAGE 3 (runner):  Production image — only the runtime artifacts, no build tools
#
# Multi-stage builds result in much smaller images because node_modules,
# TypeScript compiler, etc. don't end up in the final image.

# ─── Stage 1: Install dependencies ────────────────────────────────────────
FROM node:20-alpine AS deps

# Install libc compatibility for Alpine (required by some native Node modules)
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy ONLY package files first.
# Docker caches each layer — if these files don't change, the
# expensive `npm ci` step is skipped on subsequent builds.
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# npm ci is preferred over npm install in CI/Docker:
# - Uses the exact versions from package-lock.json
# - Fails if package-lock.json is out of sync
# - Does not update package-lock.json
RUN npm ci

# ─── Stage 2: Build the application ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy deps from previous stage (avoids reinstalling)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate the Prisma Client before building Next.js
# This is required because Next.js imports Prisma at build time
RUN npx prisma generate

# Build the Next.js application
# Produces the .next/ folder with the optimized production build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# ─── Stage 3: Production runner ────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user for security
# Running as root in production is a security risk — if the container is
# compromised, the attacker has root access to the container filesystem
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only what's needed to run the app
# Standalone output mode (configured in next.config.js) copies all dependencies
# into .next/standalone, making the image smaller and self-contained
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy Next.js standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# server.js is the standalone Next.js server — generated by the standalone output
CMD ["node", "server.js"]
```

**Create `docker-compose.yml`:**

```yaml
# docker-compose.yml
#
# Defines the full local development environment.
# Run everything with: docker compose up
# Stop everything with: docker compose down
#
# Services:
#   postgres  — PostgreSQL database (local equivalent of Neon)
#   app       — Next.js application

version: '3.8'

services:

  # ── PostgreSQL Database ──────────────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    # alpine variant is smaller than the default postgres image
    container_name: backend_practice_db
    restart: unless-stopped

    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: backend_practice

    ports:
      # host:container — maps localhost:5432 to the container's port 5432
      # This lets you connect from your host machine with any PostgreSQL client
      - '5432:5432'

    volumes:
      # Named volume — persists data between `docker compose down` and `up`
      # Without this, all data is lost when the container stops
      - postgres_data:/var/lib/postgresql/data

    healthcheck:
      # Docker will wait for this command to succeed before marking the service healthy
      # The app service uses `depends_on: condition: service_healthy` to wait for this
      test: ['CMD-SHELL', 'pg_isready -U postgres -d backend_practice']
      interval: 5s
      timeout: 5s
      retries: 5

  # ── Next.js Application ──────────────────────────────────────────────────
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: backend_practice_app
    restart: unless-stopped

    ports:
      - '3000:3000'

    environment:
      # Use the service name 'postgres' as the hostname — Docker's internal DNS
      # resolves service names automatically within the same network
      DATABASE_URL: 'postgresql://postgres:postgres@postgres:5432/backend_practice'
      NODE_ENV: production
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
      # Add other env vars here or use an env_file:
      # env_file: .env.local

    depends_on:
      postgres:
        condition: service_healthy  # wait for postgres to be ready before starting app

volumes:
  # Named volumes are managed by Docker and persist across container restarts
  postgres_data:
    driver: local
```

**Create `docker-compose.dev.yml`** (development override with hot-reloading):

```yaml
# docker-compose.dev.yml
#
# Development override — run with:
#   docker compose -f docker-compose.yml -f docker-compose.dev.yml up
#
# Or create a simple alias in your shell:
#   alias dc-dev="docker compose -f docker-compose.yml -f docker-compose.dev.yml"
#
# This override:
#   - Replaces the production build with a dev server (hot reload)
#   - Mounts the source code as a volume (changes reflect immediately)
#   - Uses the dev CMD

version: '3.8'

services:
  app:
    build:
      target: deps  # stop at the deps stage — no production build needed
    command: sh -c "npx prisma migrate deploy && npm run dev"
    volumes:
      # Mount source code into the container — enables hot reload
      - .:/app
      # Prevent host node_modules from overwriting container's
      - /app/node_modules
    environment:
      NODE_ENV: development
```

**Create `.dockerignore`:**

```
# .dockerignore
# Files listed here are NOT sent to the Docker build context.
# This speeds up builds and prevents sensitive files from entering the image.

node_modules
.next
.git
.gitignore
*.md
.env
.env.local
.env.*.local
npm-debug.log*
.DS_Store
coverage
.nyc_output
```

**Update `next.config.js`** to enable standalone output:

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' mode traces and bundles only the files needed to run the app.
  // This makes Docker images significantly smaller (no full node_modules/).
  // Required for the Dockerfile to work correctly.
  output: 'standalone',
}

module.exports = nextConfig
```

**Commit:**
```bash
git add .
git commit -m "chore(docker): add Dockerfile with multi-stage build and docker-compose"
```

Merge:
```bash
git checkout main
git merge feat/docker --no-ff -m "chore(docker): merge Docker configuration"
git branch -d feat/docker
```

---

### STEP 10 — Deploy config and documentation (branch: `docs/readme-and-deploy`)

```bash
git checkout main
git checkout -b docs/readme-and-deploy
```

**Create `vercel.json`:**

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-report",
      "schedule": "0 9 * * 1"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

**Create `README.md`** — see the complete README content below.

**Commit:**
```bash
git add .
git commit -m "docs(readme): add complete setup, API reference, and deployment guide"
```

Merge to main:
```bash
git checkout main
git merge docs/readme-and-deploy --no-ff -m "docs: merge README and deployment config"
git branch -d docs/readme-and-deploy
```

---

## `README.md` Content

````markdown
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
````

---

## Final Notes for the Agent

- **All code must be in English** — comments, variable names, commit messages, everything
- **Comment the "why"**, not the "what" — the code should be self-documenting; comments explain reasoning
- **Never use `any` in TypeScript** without an explicit comment explaining why it was unavoidable
- **Commit after every step** — do not batch multiple steps into one commit
- **Branch off `main`** for every feature, merge back with `--no-ff`, delete the branch after merging
- **Run `git log --oneline`** at the end to verify the commit history looks clean and professional
- **`use client`** only on components that actually need browser APIs, state, or event handlers
- **Validate all API input with Zod** before touching the database — never trust raw request bodies
- **The `output: 'standalone'`** in `next.config.js` is required for the Docker Dockerfile to work correctly
