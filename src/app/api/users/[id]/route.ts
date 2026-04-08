// src/app/api/users/[id]/route.ts
//
// GET    /api/users/:id  → get user with their tasks
// PUT    /api/users/:id  → update a user
// DELETE /api/users/:id  → delete a user

import { prisma } from '@/lib/prisma'
import { updateUserSchema } from '@/lib/validations'
import { ok, noContent, badRequest, conflict, notFound, serverError } from '@/lib/api-helpers'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
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
    const { id } = await params
    const existing = await prisma.user.findUnique({ where: { id } })
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
      where: { id },
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
    const { id } = await params
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) return notFound('User')

    await prisma.user.delete({ where: { id } })
    return noContent()
  } catch (error) {
    console.error('[DELETE /api/users/:id]', error)
    return serverError()
  }
}
