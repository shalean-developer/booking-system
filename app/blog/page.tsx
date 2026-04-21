import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import { getSeoConfig } from '@/lib/seo-config';
import { getPublishedPosts, getCategories } from '@/lib/blog-server';
import { buildBlogListingPayload } from '@/lib/blog-listing';
import CleaningBlogPageWithRouter from '@/components/cleaning-blog-page';

export const metadata: Metadata = createMetadata(getSeoConfig('blog'));

export default async function BlogPage() {
  const [rawPosts, categories] = await Promise.all([getPublishedPosts(), getCategories()]);
  const payload = buildBlogListingPayload(rawPosts, categories);
  return <CleaningBlogPageWithRouter {...payload} />;
}
