// prisma/seed.ts
//
// Seeds the database with example data for local development.
//
// Run with: npx prisma db seed
// (after adding "prisma": { "seed": "ts-node prisma/seed.ts" } to package.json)

import 'dotenv/config'
import dotenv from 'dotenv'
// Load .env.local before importing Prisma so DATABASE_URL is available
dotenv.config({ path: '.env.local', override: true })

import { PrismaClient, TaskStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Prisma 7 uses a driver adapter instead of a url in the schema
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

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
