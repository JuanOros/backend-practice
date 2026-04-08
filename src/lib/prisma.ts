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
