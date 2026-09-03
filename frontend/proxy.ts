import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiting state
// IP -> { count, windowStart }
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // General API limit
const AUTH_MAX_REQUESTS_PER_WINDOW = 20; // Stricter limit for auth endpoints

function cleanUpOldEntries() {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}

// Periodically clean up memory (e.g. every 5 mins) to prevent memory leaks in the Vercel function
setInterval(cleanUpOldEntries, 5 * 60 * 1000);

export default function proxy(request: NextRequest) {
  // Only apply rate limiting to /api routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Determine client IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown_ip';

    const now = Date.now();
    let data = rateLimitMap.get(ip);

    if (!data) {
      data = { count: 0, windowStart: now };
      rateLimitMap.set(ip, data);
    }

    // Reset window if it's expired
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      data.count = 0;
      data.windowStart = now;
    }

    data.count++;

    // Determine limit based on endpoint
    const limit = request.nextUrl.pathname.startsWith('/api/auth/') 
      ? AUTH_MAX_REQUESTS_PER_WINDOW 
      : MAX_REQUESTS_PER_WINDOW;

    if (data.count > limit) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'too_many_requests', 
          message: 'Rate limit exceeded. Please try again later.' 
        }),
        { 
          status: 429, 
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((data.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000).toString(),
          } 
        }
      );
    }
  }

  return NextResponse.next();
}

// Apply rate limiting specifically to data and admin routes.
// Auth routes (/api/auth/*) are completely bypassed so Next.js 16 does not intercept cookie headers.
export const config = {
  matcher: [
    '/api/votes/:path*',
    '/api/admin/:path*',
    '/api/teams/:path*',
    '/api/results/:path*',
  ],
};
