import { NextRequest, NextResponse } from 'next/server';
import { GET as bookingsGET } from '@/app/api/cleaner/bookings/route';

export const dynamic = 'force-dynamic';

/**
 * Alias for GET /api/cleaner/bookings — returns `jobs` + `bookings` for mobile clients.
 */
export async function GET(request: NextRequest) {
  const res = await bookingsGET(request);
  const data = (await res.json()) as {
    ok?: boolean;
    bookings?: unknown[];
    error?: string;
  };
  if (data.ok && Array.isArray(data.bookings)) {
    return NextResponse.json({ ok: true, jobs: data.bookings, bookings: data.bookings }, { status: res.status });
  }
  return NextResponse.json(data, { status: res.status });
}
