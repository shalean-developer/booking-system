import type { BlogCategory, BlogPostWithDetails } from '@/lib/blog-server';

export type BlogListingPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  categorySlug: string | null;
  categoryLabel: string;
  author: string;
  dateLabel: string;
  readTimeLabel: string;
  imageUrl: string | null;
  imageAlt: string;
  tags: string[];
  trending: boolean;
};

export type BlogListingCategory = {
  id: string;
  slug: string;
  name: string;
};

export type BlogListingPayload = {
  posts: BlogListingPost[];
  categories: BlogListingCategory[];
  featuredPostId: string | null;
  trendingPostIds: string[];
};

const DEFAULT_AUTHOR = 'Shalean Team';

function formatPublishedDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function normalizeTags(tags: unknown): string[] {
  if (tags == null) return [];
  if (Array.isArray(tags)) {
    return tags.filter((t): t is string => typeof t === 'string' && t.length > 0);
  }
  return [];
}

function excerptForCard(post: BlogPostWithDetails): string {
  const ex = post.excerpt?.trim() || post.meta_description?.trim() || '';
  if (ex) return ex;
  return 'Read the full article on our blog.';
}

export function buildBlogListingPayload(
  rawPosts: BlogPostWithDetails[],
  categories: BlogCategory[],
): BlogListingPayload {
  const sorted = [...rawPosts].sort((a, b) => {
    const ta = a.published_at ? new Date(a.published_at).getTime() : 0;
    const tb = b.published_at ? new Date(b.published_at).getTime() : 0;
    return tb - ta;
  });

  const featuredPostId = sorted[0]?.id ?? null;
  const trendingPostIds = sorted.slice(1, 5).map((p) => p.id);

  const posts: BlogListingPost[] = sorted.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: excerptForCard(p),
    categorySlug: p.category_slug ?? null,
    categoryLabel: p.category_name ?? 'Article',
    author: DEFAULT_AUTHOR,
    dateLabel: formatPublishedDate(p.published_at),
    readTimeLabel: `${Math.max(1, p.read_time ?? 5)} min read`,
    imageUrl: p.featured_image?.trim() || null,
    imageAlt: p.featured_image_alt?.trim() || p.title,
    tags: normalizeTags(p.tags),
    trending: trendingPostIds.includes(p.id),
  }));

  return {
    posts,
    categories: categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
    featuredPostId,
    trendingPostIds,
  };
}
