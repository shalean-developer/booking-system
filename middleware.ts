import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CLEANER_SESSION = 'cleaner_session';

/**
 * Cleaner app uses httpOnly `cleaner_session` (not Supabase Auth roles).
 * Only sessions with this cookie may access /cleaner/* except /cleaner/login.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/cleaner')) {
    return NextResponse.next();
  }
  if (pathname === '/cleaner/login' || pathname.startsWith('/cleaner/login/')) {
    return NextResponse.next();
  }

  if (pathname === '/cleaner' || pathname === '/cleaner/') {
    return NextResponse.redirect(new URL('/cleaner/dashboard', request.url));
  }

  const session = request.cookies.get(CLEANER_SESSION)?.value;
  if (!session) {
    const login = new URL('/cleaner/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/cleaner/:path*'],
};
