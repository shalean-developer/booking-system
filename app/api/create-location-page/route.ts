import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase-server';
import { authorizeSeoContentRequest, getSeoContentApiSecret } from '@/lib/seo-api-auth';
import { excerptFromHtml, generateSlug } from '@/lib/blog-server';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(200).optional(),
  city: z.string().min(1).max(200),
  region: z.string().max(200).optional().nullable(),
  hero_subtitle: z.string().max(500).optional().nullable(),
  content: z.string().min(1),
  meta_title: z.string().max(200).optional().nullable(),
  meta_description: z.string().max(320).optional().nullable(),
  keywords: z.string().max(1000).optional().nullable(),
  featured_image: z.string().max(2000).optional().nullable(),
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

  const parsed = bodySchema.safeParse(json);
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
      { ok: false, error: 'Could not derive a valid slug' },
      { status: 400 }
    );
  }

  const plain = excerptFromHtml(input.content, 320);
  const metaDescription = input.meta_description?.trim() || plain;
  const status = input.published ? 'published' : 'draft';
  const published_at = input.published ? new Date().toISOString() : null;

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('service_location_pages')
      .insert({
        slug,
        title: input.title.trim(),
        city: input.city.trim(),
        region: input.region?.trim() || null,
        hero_subtitle: input.hero_subtitle?.trim() || null,
        content: input.content,
        meta_title: input.meta_title?.trim() || null,
        meta_description: metaDescription,
        keywords: input.keywords?.trim() || null,
        featured_image: input.featured_image?.trim() || null,
        status,
        published_at,
      })
      .select('id, slug, status, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { ok: false, error: 'A page with this slug already exists', code: error.code },
          { status: 409 }
        );
      }
      if (error.code === '42P01') {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Table service_location_pages not found. Run supabase/migrations/20260414140000_service_location_pages.sql',
            code: error.code,
          },
          { status: 500 }
        );
      }
      console.error('[create-location-page]', error);
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: 500 }
      );
    }

    if (input.published) {
      revalidatePath('/services');
      revalidatePath(`/services/${slug}`);
    }

    return NextResponse.json({ ok: true, page: data });
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
    console.error('[create-location-page]', e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
