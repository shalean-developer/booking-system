import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const bookingId = (form.get('bookingId') as string | null)?.trim();
    const kind = (form.get('kind') as string | null)?.trim(); // 'before' | 'after'

    if (!file || !bookingId || !kind || (kind !== 'before' && kind !== 'after')) {
      return NextResponse.json(
        { ok: false, error: 'file, bookingId and kind (before|after) are required' },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      return NextResponse.json(
        { ok: false, error: 'Service role not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceRoleKey);

    // Create safe filename
    const originalName = (file as any).name || 'upload.webp';
    const baseName = originalName.replace(/[^\w.\-]/g, '_');
    const path = `${bookingId}/${kind}/${Date.now()}-${baseName}`;

    // Convert File to ArrayBuffer/Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('booking-photos')
      .upload(path, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });

    if (uploadError) {
      return NextResponse.json(
        { ok: false, error: uploadError.message },
        { status: 500 }
      );
    }

    // Create signed URL (1 hour)
    const { data: signed, error: signErr } = await supabase.storage
      .from('booking-photos')
      .createSignedUrl(path, 60 * 60);

    if (signErr || !signed?.signedUrl) {
      return NextResponse.json(
        { ok: false, error: signErr?.message || 'Failed to sign URL', path },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, path: `booking-photos/${path}`, signedUrl: signed.signedUrl });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


