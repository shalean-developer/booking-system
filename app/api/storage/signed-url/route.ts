import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { path, expiresIn } = await req.json();
    if (!path || typeof path !== 'string') {
      return NextResponse.json({ ok: false, error: 'path is required' }, { status: 400 });
    }
    const exp = typeof expiresIn === 'number' ? Math.min(Math.max(expiresIn, 60), 60 * 60 * 24 * 7) : 60 * 60; // 1h default

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      return NextResponse.json({ ok: false, error: 'Service role not configured' }, { status: 500 });
    }

    const supabase = createClient(url, serviceRoleKey);
    // Bucket inferred from first segment of path (bucket/path/to/file)
    const [bucket, ...rest] = path.split('/');
    const objectPath = rest.join('/');
    if (!bucket || !objectPath) {
      return NextResponse.json({ ok: false, error: 'Invalid path format. Use "bucket/dir/file.ext"' }, { status: 400 });
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


