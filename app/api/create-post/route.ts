import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase-server';
import { authorizeSeoContentRequest, getSeoContentApiSecret } from '@/lib/seo-api-auth';
import {
  calculateReadTime,
  excerptFromHtml,
  generateSlug,
} from '@/lib/blog-server';

export const dynamic = 'force-dynamic';

const createPostSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(200).optional(),
  content: z.string().min(1),
  meta_description: z.string().max(320).optional().nullable(),
  keywords: z.string().max(1000).optional().nullable(),
  featured_image: z.string().max(2000).optional().nullable(),
  meta_title: z.string().max(200).optional().nullable(),
  published: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  if (!getSeoContentApiSecret()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Set SEO_CONTENT_API_SECRET or BLOG_CREATE_POST_SECRET in .env.local, then restart the server.',
      },
      { status: 503 }
    );
  }

  if (!authorizeSeoContentRequest(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createPostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const slug = (input.slug ?? generateSlug(input.title)).replace(/^-+|-+$/g, '');
  if (!slug) {
    return NextResponse.json(
      { ok: false, error: 'Could not derive a valid slug from title' },
      { status: 400 }
    );
  }

  const excerpt = excerptFromHtml(input.content);
  const metaDescription =
    input.meta_description?.trim() || excerpt;
  const status = input.published ? 'published' : 'draft';
  const published_at = input.published ? new Date().toISOString() : null;

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title: input.title.trim(),
        slug,
        content: input.content,
        excerpt,
        meta_description: metaDescription,
        keywords: input.keywords?.trim() || null,
        featured_image: input.featured_image?.trim() || null,
        meta_title: input.meta_title?.trim() || null,
        status,
        published_at,
        read_time: calculateReadTime(input.content.replace(/<[^>]+>/g, ' ')),
      })
      .select('id, slug, status, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { ok: false, error: 'A post with this slug already exists', code: error.code },
          { status: 409 }
        );
      }
      if (error.code === '42703' || error.message?.includes('keywords')) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Column missing (keywords?). Run supabase/migrations/20260414120000_blog_posts_keywords.sql in Supabase SQL Editor.',
            code: error.code,
          },
          { status: 500 }
        );
      }
      console.error('[create-post]', error);
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: 500 }
      );
    }

    if (input.published) {
      revalidatePath('/blog');
      revalidatePath(`/blog/${slug}`);
    }

    return NextResponse.json({ ok: true, post: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'SUPABASE_SERVICE_ROLE_KEY is required for this endpoint. Add it to .env.local.',
        },
        { status: 503 }
      );
    }
    console.error('[create-post]', e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
