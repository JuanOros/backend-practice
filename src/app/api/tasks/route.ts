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
