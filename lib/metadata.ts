import type { Metadata } from "next";

// Base URL for the site
export const SITE_URL = "https://shalean.co.za";

// Default OG image dimensions
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

// Validation limits
export const TITLE_MAX_LENGTH = 60;
export const DESCRIPTION_MAX_LENGTH = 160;

// Default site metadata
export const DEFAULT_SITE_METADATA = {
  siteName: "Shalean Cleaning Services",
  locale: "en_ZA",
  twitterCard: "summary_large_image" as const,
  defaultOgType: "website" as const,
} as const;

// Type definitions for page metadata
export interface PageMetadata {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: {
    url: string;
    alt: string;
  };
  ogType?: "website" | "article";
  twitterCard?: "summary" | "summary_large_image";
  robots?: string;
  generatedMeta?: boolean;
}

// Type definitions for blog post metadata
export interface BlogPostMetadata extends PageMetadata {
  publishedTime?: string;
  author?: string;
  ogType: "article";
}

/**
 * Validates metadata length and logs warnings
 */
export function validateMetadata(metadata: Partial<PageMetadata>): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let isValid = true;

  if (metadata.title) {
    if (metadata.title.length > TITLE_MAX_LENGTH) {
      warnings.push(`Title is ${metadata.title.length} characters (max: ${TITLE_MAX_LENGTH})`);
      isValid = false;
    } else if (metadata.title.length > 55) {
      warnings.push(`Title is ${metadata.title.length} characters (recommended: ≤55)`);
    }
  }

  if (metadata.description) {
    if (metadata.description.length > DESCRIPTION_MAX_LENGTH) {
      warnings.push(`Description is ${metadata.description.length} characters (max: ${DESCRIPTION_MAX_LENGTH})`);
      isValid = false;
    } else if (metadata.description.length > 150) {
      warnings.push(`Description is ${metadata.description.length} characters (recommended: ≤150)`);
    }
  }

  if (metadata.generatedMeta) {
    warnings.push("Metadata was auto-generated - please review and customize");
  }

  return { isValid, warnings };
}

/**
 * Truncates text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Generates canonical URL from path
 */
export function generateCanonical(path: string = ""): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Generates fallback metadata from page content
 */
export function generateFallbackMetadata(
  title: string,
  description: string,
  path: string = ""
): PageMetadata {
  return {
    title: truncateText(title, TITLE_MAX_LENGTH),
    description: truncateText(description, DESCRIPTION_MAX_LENGTH),
    canonical: generateCanonical(path),
    ogType: "website",
    twitterCard: "summary_large_image",
    generatedMeta: true,
  };
}

/**
 * Creates Next.js Metadata object from page metadata
 */
export function createMetadata(metadata: PageMetadata): Metadata {
  const canonical = metadata.canonical || generateCanonical();
  
  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical,
    },
    robots: metadata.robots || "index,follow",
    openGraph: {
      locale: DEFAULT_SITE_METADATA.locale,
      siteName: DEFAULT_SITE_METADATA.siteName,
      type: metadata.ogType || DEFAULT_SITE_METADATA.defaultOgType,
      title: metadata.title,
      description: metadata.description,
      url: canonical,
      ...(metadata.ogImage && {
        images: [
          {
            url: metadata.ogImage.url,
            alt: metadata.ogImage.alt,
            width: OG_IMAGE_WIDTH,
            height: OG_IMAGE_HEIGHT,
          },
        ],
      }),
    },
    twitter: {
      card: metadata.twitterCard || DEFAULT_SITE_METADATA.twitterCard,
      title: metadata.title,
      description: metadata.description,
      ...(metadata.ogImage && {
        images: [metadata.ogImage.url],
      }),
    },
  };
}

/**
 * Creates blog post metadata with article-specific fields
 */
export function createBlogPostMetadata(metadata: BlogPostMetadata): Metadata {
  const baseMetadata = createMetadata(metadata);
  
  return {
    ...baseMetadata,
    openGraph: {
      ...baseMetadata.openGraph,
      type: "article",
      ...(metadata.publishedTime && {
        publishedTime: metadata.publishedTime,
      }),
      ...(metadata.author && {
        authors: [metadata.author],
      }),
    },
  };
}

/**
 * Generates OG image URL for different page types
 */
export function generateOgImageUrl(pageType: string): string {
  return `${SITE_URL}/assets/og/${pageType}-1200x630.jpg`;
}

/**
 * Creates location-specific metadata for suburb pages
 */
export function createLocationMetadata(
  suburb: string,
  city: string,
  area: string,
  description: string,
  highlights: string[] = []
): PageMetadata {
  const slug = suburb.toLowerCase().replace(/\s+/g, '-');
  const path = `/location/${city.toLowerCase().replace(/\s+/g, '-')}/${slug}`;
  
  // Create optimized title (max 60 chars)
  const title = `Cleaning Services in ${suburb} | Shalean`;
  
  // Create optimized description (120-170 chars)
  const serviceTypes = highlights.length > 0 
    ? highlights.slice(0, 3).join(', ').toLowerCase()
    : 'regular, deep, and move-in cleaning';
  
  const optimizedDescription = `Professional home and apartment cleaning services in ${suburb}, ${city}. Experienced cleaners available for ${serviceTypes}. Book same-day service in ${area}.`;
  
  // Ensure description is within optimal range
  const finalDescription = optimizedDescription.length > DESCRIPTION_MAX_LENGTH 
    ? truncateText(optimizedDescription, DESCRIPTION_MAX_LENGTH)
    : optimizedDescription;
  
  return {
    title,
    description: finalDescription,
    canonical: generateCanonical(path),
    ogImage: {
      url: generateOgImageUrl(`location-${slug}`),
      alt: `Professional cleaning services in ${suburb}, ${city}`,
    },
    ogType: "website",
    twitterCard: "summary_large_image",
    robots: "index,follow",
    generatedMeta: false,
  };
}

/**
 * Logs metadata validation results for debugging
 */
export function logMetadataValidation(
  path: string,
  metadata: PageMetadata,
  validation: { isValid: boolean; warnings: string[] }
): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`\n📄 Metadata for ${path}:`);
    console.log(`Title: "${metadata.title}" (${metadata.title.length} chars)`);
    console.log(`Description: "${metadata.description}" (${metadata.description.length} chars)`);
    console.log(`Canonical: ${metadata.canonical}`);
    console.log(`Generated: ${metadata.generatedMeta ? "Yes" : "No"}`);
    
    if (validation.warnings.length > 0) {
      console.warn("⚠️  Warnings:");
      validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    if (!validation.isValid) {
      // Only log as warning for blog posts to avoid console errors
      console.warn("⚠️  Metadata validation failed - using fallback values");
    } else {
      console.log("✅ Metadata validation passed");
    }
    console.log("---");
  }
}
