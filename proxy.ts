import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function applyCacheAndSecurityHeaders(response: NextResponse, request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot)$/i)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  if (pathname.startsWith('/_next/static/chunks') && pathname.match(/\.css$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  if (pathname === '/' || pathname.startsWith('/blog/') || pathname.startsWith('/location/')) {
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  }

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isCustomerDashboard = path === '/dashboard' || path.startsWith('/dashboard/');

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (isCustomerDashboard && supabaseUrl && anonKey) {
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirect', `${path}${request.nextUrl.search}`);
      return NextResponse.redirect(redirectUrl);
    }
  }

  applyCacheAndSecurityHeaders(response, request);
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
