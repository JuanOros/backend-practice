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
