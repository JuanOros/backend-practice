// src/proxy.ts
//
// Next.js Edge Proxy — runs on the Edge Runtime BEFORE any route handler.
// (renamed from middleware.ts in Next.js 16 — same functionality, new filename)
//
// This is the ideal place for:
//   - Security headers (prevent common web attacks)
//   - Rate limiting (block abuse before it hits your API)
//   - Request logging
//   - Authentication checks (in a more advanced setup)
//
// IMPORTANT: This file must be at src/middleware.ts (or middleware.ts at root).
// The `config.matcher` below controls which routes it applies to.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─── Rate Limiting ─────────────────────────────────────────────────────────
// We use Upstash Redis for rate limiting because it works in the Edge Runtime.
// Standard Node.js rate limiting libraries (express-rate-limit, etc.) do NOT
// work in Next.js middleware because it runs in a restricted environment.
//
// Upstash provides a serverless Redis that works over HTTP — perfect for Edge.

// Lazy-initialize the rate limiter only when Redis credentials are present.
// This allows the middleware to work locally without Upstash configured.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ratelimit: any = null

async function getRateLimiter() {
  if (ratelimit) return ratelimit

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    // Rate limiting disabled — log a warning in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[middleware] Rate limiting disabled: UPSTASH_REDIS credentials not set')
    }
    return null
  }

  // Dynamic imports keep this code tree-shaken when Redis is not configured
  const { Ratelimit } = await import('@upstash/ratelimit')
  const { Redis } = await import('@upstash/redis')

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    // Sliding window: 60 requests per 60 seconds per IP
    // Adjust these numbers based on your API's expected traffic
    limiter: Ratelimit.slidingWindow(60, '60 s'),
    analytics: true, // enables dashboard analytics in Upstash console
  })

  return ratelimit
}

// ─── Middleware Function ───────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // ── 1. Security Headers ──────────────────────────────────────────────────
  // These HTTP response headers defend against common web attacks.
  // Learn more: https://owasp.org/www-project-secure-headers/

  // Prevents browsers from MIME-sniffing the content-type
  // (blocks certain types of XSS attacks)
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Prevents the page from being loaded in an iframe
  // (blocks clickjacking attacks)
  response.headers.set('X-Frame-Options', 'DENY')

  // Forces HTTPS for 1 year (only relevant in production)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  )

  // Controls what information is sent in the Referer header
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Disables browser features we don't need
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  // Content Security Policy (CSP) — controls what resources can be loaded.
  // This is one of the most powerful XSS defenses.
  // 'self' = only load from same origin
  // Adjust based on what external resources you actually use
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Next.js dev
      "style-src 'self' 'unsafe-inline'",                 // unsafe-inline needed for Tailwind
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  )

  // Remove the X-Powered-By header that Next.js adds by default.
  // Don't advertise what framework you're using — it helps attackers.
  response.headers.delete('X-Powered-By')

  // ── 2. Rate Limiting (API routes only) ───────────────────────────────────
  // Only apply rate limiting to API routes to avoid slowing down page loads
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const limiter = await getRateLimiter()

    if (limiter) {
      // Use IP address as the rate limit identifier.
      // request.ip is set by Vercel. On other platforms, check X-Forwarded-For.
      const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
      const identifier = `api:${ip}`

      const { success, limit, reset, remaining } = await limiter.limit(identifier)

      // Always include rate limit info in headers (good API practice)
      response.headers.set('X-RateLimit-Limit', limit.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', reset.toString())

      if (!success) {
        // 429 Too Many Requests — standard HTTP status for rate limiting
        return new NextResponse(
          JSON.stringify({
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please wait before retrying.',
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
            },
          }
        )
      }
    }
  }

  return response
}

// ─── Matcher Config ────────────────────────────────────────────────────────
// Controls which routes this middleware runs on.
// This pattern excludes static files and Next.js internals for performance.
export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico   (browser favicon)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
