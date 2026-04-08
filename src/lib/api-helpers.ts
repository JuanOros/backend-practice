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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (req: Request, context?: any) => Promise<NextResponse>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
