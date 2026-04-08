// src/app/api/tasks/[id]/route.ts
//
// GET    /api/tasks/:id  → get a single task
// PUT    /api/tasks/:id  → update a task
// DELETE /api/tasks/:id  → delete a task

import { prisma } from '@/lib/prisma'
import { updateTaskSchema } from '@/lib/validations'
import { ok, noContent, badRequest, notFound, serverError } from '@/lib/api-helpers'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/tasks/:id
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const task = await prisma.task.findUnique({
      where: { id },
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
    const { id } = await params
    // Check existence before parsing body to fail fast
    const existing = await prisma.task.findUnique({ where: { id } })
    if (!existing) return notFound('Task')

    const body = await request.json()
    const result = updateTaskSchema.safeParse(body)
    if (!result.success) {
      return badRequest('Validation failed', result.error.flatten().fieldErrors as Record<string, string[]>)
    }

    const task = await prisma.task.update({
      where: { id },
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
    const { id } = await params
    const existing = await prisma.task.findUnique({ where: { id } })
    if (!existing) return notFound('Task')

    await prisma.task.delete({ where: { id } })

    // 204 No Content is the correct HTTP status for a successful DELETE
    return noContent()
  } catch (error) {
    console.error('[DELETE /api/tasks/:id]', error)
    return serverError()
  }
}
