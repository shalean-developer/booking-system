import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Set cache headers for static assets
  const pathname = request.nextUrl.pathname;
  
  // Cache static assets aggressively
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot)$/i)
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  // Cache CSS chunks aggressively for better parallel loading
  if (pathname.startsWith('/_next/static/chunks') && pathname.match(/\.css$/)) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  // Cache HTML pages for shorter duration with stale-while-revalidate
  if (pathname === '/' || pathname.startsWith('/blog/') || pathname.startsWith('/location/')) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

