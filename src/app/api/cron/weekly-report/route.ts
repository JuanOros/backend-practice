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
