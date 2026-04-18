import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  BOOKING_PHOTO_SIGNED_URL_MAX_SECONDS,
  requireBookingStorageAccess,
  validateBookingIdParam,
  validateImageUpload,
} from '@/lib/storage-booking-access';

export const dynamic = 'force-dynamic';

const BUCKET = 'booking-photos';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const rawBookingId = form.get('bookingId');
    const kind = (form.get('kind') as string | null)?.trim();

    const bookingId = validateBookingIdParam(typeof rawBookingId === 'string' ? rawBookingId : '');
    if (!bookingId) {
      return NextResponse.json({ ok: false, error: 'Invalid or missing bookingId' }, { status: 400 });
    }

    if (!file || !kind || (kind !== 'before' && kind !== 'after')) {
      return NextResponse.json(
        { ok: false, error: 'file, bookingId and kind (before|after) are required' },
        { status: 400 }
      );
    }

    const imgCheck = validateImageUpload(file);
    if (!imgCheck.ok) {
      return NextResponse.json({ ok: false, error: imgCheck.error }, { status: imgCheck.status });
    }

    const access = await requireBookingStorageAccess(bookingId);
    if (!access.ok) {
      return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
    }

    const supabase = createServiceClient();

    const originalName = (file as { name?: string }).name || 'upload.webp';
    const baseName = originalName.replace(/[^\w.\-]/g, '_');
    const path = `${bookingId}/${kind}/${Date.now()}-${baseName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType = file.type && file.type !== 'application/octet-stream' ? file.type : 'image/jpeg';

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      cacheControl: '3600',
      upsert: false,
      contentType,
    });

    if (uploadError) {
      return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });
    }

    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, BOOKING_PHOTO_SIGNED_URL_MAX_SECONDS);

    if (signErr || !signed?.signedUrl) {
      return NextResponse.json(
        { ok: false, error: signErr?.message || 'Failed to sign URL', path },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, path: `${BUCKET}/${path}`, signedUrl: signed.signedUrl });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
