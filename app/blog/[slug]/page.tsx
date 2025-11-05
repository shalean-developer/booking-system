import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createBlogPostMetadata, generateOgImageUrl, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import { getPublishedPostBySlug, getRelatedPosts } from "@/lib/blog-server";
import { BlogPostHeader } from "@/components/blog-post-header";
import { BlogPostHero } from "@/components/blog-post-hero";
import { BlogPostContent } from "@/components/blog-post-content";
import { BlogPostSchema } from "@/components/blog-post-schema";
import dynamic from "next/dynamic";

// Lazy load below-fold sections for better performance
const BlogPostRelated = dynamic(() => import("@/components/blog-post-related").then(mod => ({ default: mod.BlogPostRelated })), {
  loading: () => <div className="py-20 bg-gradient-to-br from-gray-50 to-gray-100"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="text-center"><div className="animate-pulse bg-gray-200 h-8 w-64 mx-auto mb-12 rounded"></div><div className="grid md:grid-cols-3 gap-8"><div className="animate-pulse bg-gray-200 h-80 rounded"></div><div className="animate-pulse bg-gray-200 h-80 rounded"></div><div className="animate-pulse bg-gray-200 h-80 rounded"></div></div></div></div></div>
});

const BlogPostCTA = dynamic(() => import("@/components/blog-post-cta").then(mod => ({ default: mod.BlogPostCTA })), {
  loading: () => <div className="py-20 bg-gradient-to-br from-primary/10 via-primary/15 to-primary/20"><div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center"><div className="animate-pulse bg-gray-200 h-12 w-96 mx-auto mb-6 rounded"></div><div className="animate-pulse bg-gray-200 h-6 w-80 mx-auto mb-10 rounded"></div><div className="animate-pulse bg-gray-200 h-12 w-48 mx-auto rounded"></div></div></div>
});

type Props = {
  params: Promise<{ slug: string }>;
};

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found | Shalean Blog',
      description: 'The requested blog post could not be found.',
    };
  }

  // Create blog post metadata
  // Ensure title is within SEO limits (max 70 characters, prefer 60)
  let pageTitle = post.meta_title || post.title || 'Blog Post';
  if (pageTitle.length > 70) {
    // Truncate to 67 chars and add ellipsis if needed
    pageTitle = pageTitle.substring(0, 67).trim() + '...';
  } else if (pageTitle.length > 60 && !post.meta_title) {
    // If using fallback title and it's long, try to shorten it
    const shortTitle = post.title.split('|')[0].trim();
    if (shortTitle.length <= 70) {
      pageTitle = shortTitle;
    }
  }

  const blogMetadata = {
    title: pageTitle,
    description: post.meta_description || post.excerpt || 'Read our latest blog post about cleaning services.',
    canonical: `https://shalean.co.za/blog/${post.slug}`,
    ogImage: {
      url: post.featured_image || generateOgImageUrl("blog-default"),
      alt: post.featured_image_alt || post.title || 'Blog post image',
    },
    ogType: "article" as const,
    publishedTime: post.published_at || undefined,
    author: "Shalean Cleaning Services",
    generatedMeta: !post.meta_title || !post.meta_description,
  };

  // Validate metadata
  const validation = validateMetadata(blogMetadata);
  logMetadataValidation(`/blog/${post.slug}`, blogMetadata, validation);

  return createBlogPostMetadata(blogMetadata);
}

// Revalidate every hour
export const revalidate = 3600;

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Get related posts if category exists
  const relatedPosts = post.category_id
    ? await getRelatedPosts(post.category_id, post.id, 3)
    : [];

  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD Schema */}
      <BlogPostSchema post={post} />

      {/* Header */}
      <BlogPostHeader />

      {/* Hero Section */}
      <BlogPostHero post={post} />

      {/* Article Content */}
      <BlogPostContent 
        content={post.content} 
        title={post.title}
        url={`https://shalean.co.za/blog/${post.slug}`}
      />

      {/* Related Posts - Lazy Loaded */}
      <BlogPostRelated posts={relatedPosts} />

      {/* CTA Section - Lazy Loaded */}
      <BlogPostCTA />
    </div>
  );
}

