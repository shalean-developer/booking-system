import type { NextRequest } from 'next/server';

/**
 * Shared secret for programmatic SEO APIs (blog posts, location pages).
 * Prefer SEO_CONTENT_API_SECRET; BLOG_CREATE_POST_SECRET remains supported.
 */
export function getSeoContentApiSecret(): string | undefined {
  return (
    process.env.SEO_CONTENT_API_SECRET?.trim() ||
    process.env.BLOG_CREATE_POST_SECRET?.trim() ||
    undefined
  );
}

export function authorizeSeoContentRequest(request: NextRequest): boolean {
  const secret = getSeoContentApiSecret();
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null;
  const headerKey = request.headers.get('x-api-key')?.trim();
  return bearer === secret || headerKey === secret;
}
