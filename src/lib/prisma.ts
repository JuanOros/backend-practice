// src/lib/prisma.ts
//
// Prisma Client singleton with pg driver adapter (required by Prisma 7).
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
//
// WHY A DRIVER ADAPTER?
// Prisma 7 removed the `url` field from schema.prisma. The database connection
// is now passed via a driver adapter (e.g., @prisma/adapter-pg) at runtime.

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function createPrismaClient() {
  // PrismaPg creates a connection pool using the DATABASE_URL env var.
  // Next.js automatically loads .env.local, so no manual dotenv import needed here.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({
    adapter,
    // Uncomment the line below to log every SQL query to your terminal.
    // Useful for debugging but very noisy — keep it off by default.
    // log: ['query', 'info', 'warn', 'error'],
  })
}

// Extend the Node.js global type to include our Prisma instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
