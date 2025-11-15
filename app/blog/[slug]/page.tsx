import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createBlogPostMetadata, generateOgImageUrl, validateMetadata, logMetadataValidation } from "@/lib/metadata";
import { getPublishedPostBySlug, getRelatedPosts, getPublishedPosts } from "@/lib/blog-server";
import type { BlogPostWithDetails } from "@/lib/blog-server";
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

const FALLBACK_POSTS: Record<string, BlogPostWithDetails> = {
  "the-benefits-of-eco-friendly-cleaning-products": {
    id: "fallback-eco-friendly-cleaning-products",
    title: "The Benefits of Eco-Friendly Cleaning Products",
    slug: "the-benefits-of-eco-friendly-cleaning-products",
    content: `
      <p class="text-xl text-gray-600 mb-8">
        Making the switch to eco-friendly cleaning products isn't just a trend—it's a smart choice 
        for your health, your family, and the planet. Let's explore why green cleaning products are 
        worth considering and how they can transform your cleaning routine.
      </p>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">
        Why Choose Eco-Friendly Products?
      </h2>

      <div class="space-y-6 mb-12">
        <div class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-xl font-bold text-gray-900 mb-2">Healthier Indoor Air Quality</h3>
          <p class="text-gray-600">Traditional cleaning products can release harmful volatile organic compounds (VOCs) into your home. Eco-friendly alternatives are made with natural ingredients that don't compromise air quality.</p>
        </div>

        <div class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-xl font-bold text-gray-900 mb-2">Safer for Children and Pets</h3>
          <p class="text-gray-600">Green cleaning products contain fewer harsh chemicals, reducing the risk of skin irritation, respiratory issues, and accidental poisoning.</p>
        </div>

        <div class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-xl font-bold text-gray-900 mb-2">Environmental Protection</h3>
          <p class="text-gray-600">Eco-friendly products are biodegradable and come in sustainable packaging, reducing pollution and waste in our ecosystems.</p>
        </div>

        <div class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-xl font-bold text-gray-900 mb-2">Equally Effective</h3>
          <p class="text-gray-600">Modern eco-friendly products are just as effective as traditional cleaners, without the environmental and health downsides.</p>
        </div>
      </div>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">
        Natural Ingredients to Look For
      </h2>

      <ul class="space-y-3 mb-8">
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600"><strong>Vinegar:</strong> Natural disinfectant and deodorizer</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600"><strong>Baking Soda:</strong> Gentle abrasive for scrubbing</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600"><strong>Essential Oils:</strong> Natural fragrance and antibacterial properties</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600"><strong>Castile Soap:</strong> Vegetable-based, multipurpose cleaner</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600"><strong>Lemon Juice:</strong> Natural bleaching and degreasing agent</span>
        </li>
      </ul>

      <div class="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg mb-8">
        <p class="text-gray-700 italic">
          "At Shalean, we exclusively use eco-friendly cleaning products to ensure the safety of 
          your family and our planet, without compromising on cleanliness."
        </p>
        <p class="text-sm text-gray-600 mt-2">— Shalean Cleaning Services</p>
      </div>
    `,
    excerpt: "Learn why switching to eco-friendly cleaning products is better for your health and the environment. Discover safe, effective alternatives.",
    featured_image: "/images/home-maintenance.jpg",
    featured_image_alt: "Eco-friendly cleaning products on a countertop",
    category_id: "fallback-sustainability",
    category_name: "Sustainability",
    category_slug: "sustainability",
    author_id: "fallback-author",
    status: "published",
    meta_title: "The Benefits of Eco-Friendly Cleaning Products | Shalean Blog",
    meta_description: "Learn why switching to eco-friendly cleaning products is better for your health and the environment. Discover safe, effective alternatives.",
    read_time: 4,
    published_at: "2025-10-12T00:00:00Z",
    created_at: "2025-10-12T00:00:00Z",
    updated_at: "2025-10-12T00:00:00Z",
    tags: ["eco-friendly", "cleaning"],
  },
};

async function getPostWithFallback(slug: string): Promise<BlogPostWithDetails | null> {
  const post = await getPublishedPostBySlug(slug);
  if (post) {
    return post;
  }
  return FALLBACK_POSTS[slug] ?? null;
}


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
  const post = await getPostWithFallback(slug);

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
      // If meta_title exists, ALWAYS check and fix if it contains full template or is too long
      // Also ensure it has a template suffix if it doesn't have one
      let baseTitle = post.meta_title;
      const fullTemplatePattern = ' | Shalean Cleaning Services';
      const hasFullTemplate = post.meta_title.includes(fullTemplatePattern);
      const hasAnyTemplate = post.meta_title.includes(' | Shalean') || post.meta_title.includes(' | ');
      const isTooLong = post.meta_title.length > MAX_WITH_TEMPLATE;
      
      if (hasFullTemplate || isTooLong || !hasAnyTemplate) {
        // Extract base title
        if (hasFullTemplate) {
          baseTitle = post.meta_title.replace(fullTemplatePattern, '');
        } else if (hasAnyTemplate) {
          // Try to extract base title from any template
          const shaleanIndex = post.meta_title.lastIndexOf(' | Shalean');
          if (shaleanIndex > 0) {
            baseTitle = post.meta_title.substring(0, shaleanIndex);
          } else {
            const lastPipeIndex = post.meta_title.lastIndexOf(' | ');
            if (lastPipeIndex > 0) {
              baseTitle = post.meta_title.substring(0, lastPipeIndex);
            }
          }
        }
        // If no template found, baseTitle is already the meta_title
        
        // Use shortest template
        const titleWithShortTemplate = `${baseTitle.trim()}${shortTemplate.suffix}`;
        
        // Check if it exceeds 70 chars
        if (titleWithShortTemplate.length > MAX_WITH_TEMPLATE) {
          const availableSpace = MAX_WITH_TEMPLATE - shortTemplate.length;
          pageTitle = `${baseTitle.substring(0, Math.max(15, availableSpace)).trim()}${shortTemplate.suffix}`;
        } else {
          pageTitle = titleWithShortTemplate;
        }
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
  // First, ALWAYS check if title contains the full "Shalean Cleaning Services" template and replace it
  // This is a critical fix to ensure titles never exceed 70 chars
  const fullTemplatePattern = ' | Shalean Cleaning Services';
  if (pageTitle.includes(fullTemplatePattern) || pageTitle.length > MAX_WITH_TEMPLATE) {
    // Replace full template with shortest template
    let baseTitle = pageTitle;
    if (pageTitle.includes(fullTemplatePattern)) {
      baseTitle = pageTitle.replace(fullTemplatePattern, '');
    } else if (pageTitle.length > MAX_WITH_TEMPLATE) {
      // If title is too long but doesn't have the pattern, try to extract base title
      const shaleanIndex = pageTitle.lastIndexOf(' | Shalean');
      if (shaleanIndex > 0) {
        baseTitle = pageTitle.substring(0, shaleanIndex);
      } else {
        const lastPipeIndex = pageTitle.lastIndexOf(' | ');
        if (lastPipeIndex > 0) {
          baseTitle = pageTitle.substring(0, lastPipeIndex);
        }
      }
    }
    
    const shortestTemplate = getTemplateSuffix(post.category_name, true);
    const titleWithShortTemplate = `${baseTitle.trim()}${shortestTemplate.suffix}`;
    
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
  const post = await getPostWithFallback(slug);

  if (!post) {
    notFound();
  }

  // Get all published posts and filter out the current post
  const allPosts = await getPublishedPosts();
  const otherPosts = allPosts.filter(p => p.slug !== slug && p.status === 'published');

  // Get related posts if category exists (for category-based related section)
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
      <BlogPostHero post={{ ...post, content: post.content }} />

      {/* Article Content */}
      <BlogPostContent 
        content={post.content} 
        title={post.title}
        url={`https://shalean.co.za/blog/${post.slug}`}
        otherPosts={otherPosts}
      />

      {/* Related Posts - Lazy Loaded */}
      <BlogPostRelated posts={relatedPosts} currentPostSlug={post.slug} />

      {/* CTA Section - Lazy Loaded */}
      <BlogPostCTA />
    </div>
  );
}

