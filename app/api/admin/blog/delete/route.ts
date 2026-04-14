import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = await createClient();
  const body = await request.json();
  const id = String(body.id || '').trim();

  if (!id) {
    return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
