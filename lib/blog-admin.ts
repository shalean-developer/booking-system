export type BlogPostStatus = 'draft' | 'published';

export type BlogPostInput = {
  title: string;
  slug?: string;
  content: string;
  meta_description?: string | null;
  keywords?: string | null;
  featured_image?: string | null;
  status?: BlogPostStatus;
};

export function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function plainTextFromHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function ensureMetaDescription(input: BlogPostInput): string {
  const explicit = input.meta_description?.trim();
  if (explicit) return explicit;

  const fallback = plainTextFromHtml(input.content).slice(0, 160).trim();
  return fallback || input.title.trim();
}

export function ensureKeywords(input: BlogPostInput): string | null {
  const explicit = input.keywords?.trim();
  if (explicit) return explicit;

  const titleParts = input.title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 2);

  if (titleParts.length === 0) return null;

  return Array.from(new Set(titleParts)).slice(0, 8).join(', ');
}

export function calculateReadTime(content: string): number {
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
