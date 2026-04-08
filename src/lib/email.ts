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

// Lazy-initialize the Resend client so the module can be imported at build time
// even when RESEND_API_KEY is not set (e.g., during `next build` on Vercel).
// The key is only required at runtime when sendWeeklyReport() is actually called.
function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

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
  const { error } = await getResend().emails.send({
    from: process.env.EMAIL_FROM!,
    to: process.env.EMAIL_TO!,
    subject: `Weekly Task Report — ${sentAt}`,
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
              <td style="padding: 6px 0; color: #444;">Completed</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #16a34a;">${data.doneTasks}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #444;">In progress</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #2563eb;">${data.inProgressTasks}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #444;">Pending</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #d97706;">${data.pendingTasks}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; padding: 16px; background: ${data.completionRate >= 80 ? '#f0fdf4' : '#fef9c3'}; border-radius: 8px;">
          <p style="margin: 0; font-size: 28px; font-weight: 700; color: #111;">${data.completionRate}%</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #666;">completion rate</p>
        </div>

        <p style="margin: 24px 0 0; font-size: 12px; color: #aaa; text-align: center;">
          Generated automatically by backend-practice &middot; <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #aaa;">Open dashboard</a>
        </p>
      </div>
    </body>
    </html>
  `
}
