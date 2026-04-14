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

export async function PUT(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = await createClient();
  const body = await request.json();

  const id = String(body.id || '').trim();
  const title = String(body.title || '').trim();
  const content = String(body.content || '').trim();
  const status = body.status === 'published' ? 'published' : 'draft';
  const slug = generateSlug(String(body.slug || title));

  if (!id || !title || !slug || !content) {
    return NextResponse.json({ ok: false, error: 'id, title, slug, and content are required' }, { status: 400 });
  }

  const { data: existingSlug } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', slug)
    .neq('id', id)
    .maybeSingle();

  if (existingSlug) {
    return NextResponse.json({ ok: false, error: 'A different post already uses this slug' }, { status: 409 });
  }

  const { data: currentPost } = await supabase
    .from('blog_posts')
    .select('published_at')
    .eq('id', id)
    .maybeSingle();

  const metaDescription = ensureMetaDescription({ title, content, meta_description: body.meta_description });
  const keywords = ensureKeywords({ title, content, keywords: body.keywords });
  const excerpt = plainTextFromHtml(content).slice(0, 160) || title;

  const publishedAt =
    status === 'published'
      ? currentPost?.published_at || new Date().toISOString()
      : null;

  const { data, error } = await supabase
    .from('blog_posts')
    .update({
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
      published_at: publishedAt,
    })
    .eq('id', id)
    .select('id, slug, status, published_at')
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, post: data });
}
