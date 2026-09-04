import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis and Rate Limit only if env vars are present
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken 
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

// Create a new ratelimiter, that allows 10 requests per 10 seconds
const ratelimit = redis 
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
    })
  : null;

export async function proxy(request: NextRequest) {
  // Apply rate limiting to API routes or specific high-traffic paths
  if (request.nextUrl.pathname.startsWith('/api/') || request.nextUrl.pathname.startsWith('/dashboard')) {
    if (ratelimit) {
      // Use IP as the identifier
      const ip = request.headers.get('x-forwarded-for') ?? request.ip ?? '127.0.0.1';
      const { success, limit, reset, remaining } = await ratelimit.limit(ip);

      if (!success) {
        return new NextResponse('Too Many Requests. Rate limit exceeded.', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        });
      }
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
