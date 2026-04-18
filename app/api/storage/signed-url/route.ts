import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  BOOKING_PHOTO_SIGNED_URL_MAX_SECONDS,
  parseBookingIdFromStoragePath,
  requireBookingStorageAccess,
  STORAGE_PHOTOS_BUCKET,
} from '@/lib/storage-booking-access';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = typeof body.path === 'string' ? body.path.trim() : '';
    const expiresIn = body.expiresIn;

    if (!path) {
      return NextResponse.json({ ok: false, error: 'path is required' }, { status: 400 });
    }

    if (path.includes('..') || path.includes('\\')) {
      return NextResponse.json({ ok: false, error: 'Invalid path' }, { status: 400 });
    }

    const bookingId = parseBookingIdFromStoragePath(path);
    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: `path must start with ${STORAGE_PHOTOS_BUCKET}/ and include a valid booking id` },
        { status: 400 }
      );
    }

    const access = await requireBookingStorageAccess(bookingId);
    if (!access.ok) {
      return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
    }

    // Cap at 5 minutes — longer TTL increases leak risk if the URL is shared or logged.
    const maxSec = BOOKING_PHOTO_SIGNED_URL_MAX_SECONDS;
    const exp =
      typeof expiresIn === 'number' && Number.isFinite(expiresIn)
        ? Math.min(Math.max(Math.floor(expiresIn), 60), maxSec)
        : maxSec;

    const supabase = createServiceClient();
    const [bucket, ...rest] = path.split('/');
    const objectPath = rest.join('/');

    if (bucket !== STORAGE_PHOTOS_BUCKET || !objectPath) {
      return NextResponse.json({ ok: false, error: 'Invalid path format' }, { status: 400 });
    }

    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectPath, exp);
    if (error || !data?.signedUrl) {
      return NextResponse.json({ ok: false, error: error?.message || 'Failed to create signed URL' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, signedUrl: data.signedUrl, expiresIn: exp });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
