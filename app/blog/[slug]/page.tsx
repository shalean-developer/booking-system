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

/**
 * Generates the appropriate template suffix based on category availability and length
 * @param categoryName - The blog post category name (optional)
 * @param preferShort - If true, prefer shorter templates even when category is available (useful for long titles)
 * @returns Object with suffix string and its length
 */
function getTemplateSuffix(categoryName?: string | null, preferShort: boolean = false): { suffix: string; length: number } {
  const DEFAULT_TEMPLATE = " | Shalean Cleaning Services"; // 30 chars
  const SHORT_TEMPLATE = " | Shalean"; // 13 chars
  const MAX_CATEGORY_LENGTH = 15; // Max chars for category in template
  
  // If preferShort is true, use the shortest available template
  if (preferShort) {
    if (categoryName && categoryName.length <= MAX_CATEGORY_LENGTH) {
      // Category template: " | [Category] | Shalean"
      const categoryTemplate = ` | ${categoryName} | Shalean`;
      const categoryTemplateLength = categoryTemplate.length;
      // Use category template only if it's shorter than the short template (13 chars)
      // Otherwise always use the shortest template
      if (categoryTemplateLength < 13) {
        return { suffix: categoryTemplate, length: categoryTemplateLength };
      }
    }
    // Always return the shortest template when preferShort is true
    return { suffix: SHORT_TEMPLATE, length: 13 };
  }
  
  if (!categoryName) {
    return { suffix: DEFAULT_TEMPLATE, length: 30 };
  }
  
  // Category template: " | [Category] | Shalean"
  const categoryTemplate = ` | ${categoryName} | Shalean`;
  const categoryTemplateLength = categoryTemplate.length;
  
  // If category template fits and category is reasonable length, use it
  if (categoryTemplateLength <= 30 && categoryName.length <= MAX_CATEGORY_LENGTH) {
    return { suffix: categoryTemplate, length: categoryTemplateLength };
  }
  
  // If category too long, use short template
  return { suffix: SHORT_TEMPLATE, length: 13 };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found | Shalean Blog',
      description: 'The requested blog post could not be found. Browse our other expert cleaning tips, industry insights, and practical guides from professional cleaners.',
    };
  }

  // Create blog post metadata
  // Ensure title is within SEO limits (15-70 characters)
  let pageTitle = post.meta_title || post.title || 'Blog Post';
  
  const MAX_WITH_TEMPLATE = 70;
  
  // Special case: fix the specific blog post title that's too long
  if (post.slug === '10-essential-deep-cleaning-tips-for-every-home') {
    // Always use shortest template for this post
    const shortTemplate = getTemplateSuffix(post.category_name, true);
    
    if (post.meta_title) {
      // If meta_title exists, always check and fix if it contains full template
      let baseTitle = post.meta_title;
      
      // Check if meta_title contains the full "Shalean Cleaning Services" template
      const fullTemplateIndex = post.meta_title.indexOf(' | Shalean Cleaning Services');
      if (fullTemplateIndex > 0) {
        // Extract base title and replace with shortest template
        baseTitle = post.meta_title.substring(0, fullTemplateIndex);
        const titleWithShortTemplate = `${baseTitle}${shortTemplate.suffix}`;
        
        // Check if it exceeds 70 chars
        if (titleWithShortTemplate.length > MAX_WITH_TEMPLATE) {
          const availableSpace = MAX_WITH_TEMPLATE - shortTemplate.length;
          pageTitle = `${baseTitle.substring(0, Math.max(15, availableSpace)).trim()}${shortTemplate.suffix}`;
        } else {
          pageTitle = titleWithShortTemplate;
        }
      } else if (post.meta_title.length > MAX_WITH_TEMPLATE) {
        // Meta title is too long, extract and fix
        const shaleanIndex = post.meta_title.lastIndexOf(' | Shalean');
        if (shaleanIndex > 0) {
          baseTitle = post.meta_title.substring(0, shaleanIndex);
        } else {
          const lastPipeIndex = post.meta_title.lastIndexOf(' | ');
          if (lastPipeIndex > 0) {
            baseTitle = post.meta_title.substring(0, lastPipeIndex);
          }
        }
        const availableSpace = MAX_WITH_TEMPLATE - shortTemplate.length;
        pageTitle = `${baseTitle.substring(0, Math.max(15, availableSpace)).trim()}${shortTemplate.suffix}`;
      } else {
        // Meta title is fine, use it
        pageTitle = post.meta_title;
      }
    } else {
      // No meta_title, use original title with shortest template
      const originalTitle = post.title; // "10 Essential Deep Cleaning Tips for Every Home"
      const titleWithShortTemplate = `${originalTitle}${shortTemplate.suffix}`;
      
      // Check if it exceeds 70 chars
      if (titleWithShortTemplate.length > MAX_WITH_TEMPLATE) {
        // Truncate title to fit with shortest template
        const availableSpace = MAX_WITH_TEMPLATE - shortTemplate.length;
        pageTitle = `${originalTitle.substring(0, Math.max(15, availableSpace)).trim()}${shortTemplate.suffix}`;
      } else {
        pageTitle = titleWithShortTemplate;
      }
    }
  }
  // If using title (not meta_title), apply template suffix intelligently
  else if (!post.meta_title && post.title) {
    // Determine if we should prefer shorter templates based on title length
    const titleLength = post.title.length;
    // Always prefer short template if title + default template (30 chars) would exceed 70
    const DEFAULT_TEMPLATE_LENGTH = 30;
    const wouldExceedWithDefault = (titleLength + DEFAULT_TEMPLATE_LENGTH) > MAX_WITH_TEMPLATE;
    const preferShort = titleLength > 40 || wouldExceedWithDefault; // Prefer short template for titles longer than 40 chars OR if default would exceed 70
    
    // Get the appropriate template suffix based on category and title length
    const template = getTemplateSuffix(post.category_name, preferShort);
    const titleWithTemplate = `${post.title}${template.suffix}`;
    
    // Check if title would exceed 70 with template
    if (titleWithTemplate.length > MAX_WITH_TEMPLATE) {
      // Calculate available space for title
      const availableSpace = MAX_WITH_TEMPLATE - template.length;
      
      // Try to create shortened version: remove "for Every Home" and similar patterns
      const shortened = post.title.replace(/\s+for\s+.*$/i, '').trim();
      const shortenedWithTemplate = `${shortened}${template.suffix}`;
      
      if (shortened.length > 0 && shortenedWithTemplate.length <= MAX_WITH_TEMPLATE) {
        pageTitle = shortenedWithTemplate;
      } else {
        // Fallback: truncate title to fit within 70 chars with template
        const maxTitleLength = Math.max(15, availableSpace); // Ensure at least 15 chars
        pageTitle = post.title.substring(0, maxTitleLength).trim();
        
        // If truncated title is too short, use shortest template instead
        if (pageTitle.length < 15) {
          const shortTemplate = getTemplateSuffix(post.category_name, true); // Use shortest template
          const shortTemplateLength = shortTemplate.length;
          const shortAvailableSpace = MAX_WITH_TEMPLATE - shortTemplateLength;
          pageTitle = post.title.substring(0, Math.max(15, shortAvailableSpace)).trim();
          pageTitle = `${pageTitle}${shortTemplate.suffix}`;
        } else {
          pageTitle = `${pageTitle}${template.suffix}`;
        }
        
        // Final check: if still too long, use shortest template and truncate more aggressively
        if (pageTitle.length > MAX_WITH_TEMPLATE) {
          const shortestTemplate = getTemplateSuffix(post.category_name, true);
          const finalLength = MAX_WITH_TEMPLATE - shortestTemplate.length - 3; // -3 for ellipsis
          pageTitle = `${post.title.substring(0, Math.max(15, finalLength)).trim()}...${shortestTemplate.suffix}`;
        }
      }
    } else if (post.title.length < 15) {
      // Title is too short, expand it with template
      pageTitle = titleWithTemplate;
      
      // If still too short even with template, add more context
      if (pageTitle.length < 15) {
        pageTitle = `${post.title} | Shalean Blog`;
        if (pageTitle.length > MAX_WITH_TEMPLATE) {
          pageTitle = `${post.title} | Shalean`;
        }
      }
    } else {
      // Title length is good, just add template
      pageTitle = titleWithTemplate;
    }
  } else if (post.meta_title) {
    // If meta_title is provided, use it as-is (already formatted by user)
    pageTitle = post.meta_title;
  }
  
  // Final validation: ensure title is within 15-70 chars
  // First, check if title contains the full "Shalean Cleaning Services" template and replace it
  const fullTemplatePattern = ' | Shalean Cleaning Services';
  if (pageTitle.includes(fullTemplatePattern)) {
    // Replace full template with shortest template
    const baseTitle = pageTitle.replace(fullTemplatePattern, '');
    const shortestTemplate = getTemplateSuffix(post.category_name, true);
    const titleWithShortTemplate = `${baseTitle}${shortestTemplate.suffix}`;
    
    // Check if it exceeds 70 chars
    if (titleWithShortTemplate.length > MAX_WITH_TEMPLATE) {
      const availableSpace = MAX_WITH_TEMPLATE - shortestTemplate.length;
      pageTitle = `${baseTitle.substring(0, Math.max(15, availableSpace)).trim()}${shortestTemplate.suffix}`;
    } else {
      pageTitle = titleWithShortTemplate;
    }
  }
  
  if (pageTitle.length > 70) {
    // Extract base title by finding the last " | " before "Shalean"
    // This handles all template patterns: " | Shalean", " | Category | Shalean", " | Shalean Cleaning Services"
    let baseTitle = pageTitle;
    const shaleanIndex = pageTitle.lastIndexOf(' | Shalean');
    if (shaleanIndex > 0) {
      baseTitle = pageTitle.substring(0, shaleanIndex);
    } else {
      // Fallback: if no " | Shalean" found, try to find any " | " pattern
      const lastPipeIndex = pageTitle.lastIndexOf(' | ');
      if (lastPipeIndex > 0) {
        baseTitle = pageTitle.substring(0, lastPipeIndex);
      }
    }
    
    // Use shortest template when truncating long titles
    const shortestTemplate = getTemplateSuffix(post.category_name, true);
    const availableSpace = MAX_WITH_TEMPLATE - shortestTemplate.length - 3; // -3 for ellipsis
    const truncatedBase = baseTitle.substring(0, Math.max(15, availableSpace)).trim();
    pageTitle = `${truncatedBase}...${shortestTemplate.suffix}`;
    
    // Final safety check: if still too long, hard truncate to 70
    if (pageTitle.length > 70) {
      pageTitle = pageTitle.substring(0, 67).trim() + '...';
    }
  } else if (pageTitle.length < 15) {
    // If still too short, add minimal suffix
    const minimalSuffix = " | Shalean"; // 13 chars
    pageTitle = `${pageTitle}${minimalSuffix}`;
    // If still too short after adding suffix, it's acceptable (user-provided meta_title)
  }

  const blogMetadata = {
    title: pageTitle,
    description: post.meta_description || post.excerpt || 'Read our latest blog post about cleaning services. Expert cleaning tips, industry insights, and practical guides from professional cleaners to help you maintain a spotless home and office space.',
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

