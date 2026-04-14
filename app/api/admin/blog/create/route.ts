import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';
import {
  calculateReadTime,
  ensureKeywords,
  ensureMetaDescription,
  generateSlug,
  plainTextFromHtml,
} from '@/lib/blog-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const title = String(body.title || '').trim();
  const content = String(body.content || '').trim();
  const status = body.status === 'published' ? 'published' : 'draft';
  const slug = generateSlug(String(body.slug || title));

  if (!title || !slug || !content) {
    return NextResponse.json({ ok: false, error: 'Title, slug, and content are required' }, { status: 400 });
  }

  const { data: existingSlug } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (existingSlug) {
    return NextResponse.json({ ok: false, error: 'A post with this slug already exists' }, { status: 409 });
  }

  const metaDescription = ensureMetaDescription({ title, content, meta_description: body.meta_description });
  const excerpt = plainTextFromHtml(content).slice(0, 160) || title;
  const keywords = ensureKeywords({ title, content, keywords: body.keywords });

  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      title,
      slug,
      content,
      excerpt,
      featured_image: body.featured_image?.trim() || null,
      status,
      meta_title: title,
      meta_description: metaDescription,
      keywords,
      read_time: calculateReadTime(content),
      author_id: user.id,
      published_at: status === 'published' ? new Date().toISOString() : null,
    })
    .select('id, slug')
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, post: data });
}
