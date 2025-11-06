import type { Metadata } from "next";

// Base URL for the site
export const SITE_URL = "https://shalean.co.za";

// Default OG image dimensions
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

// Validation limits
export const TITLE_MAX_LENGTH = 70; // SEO best practice: 15-70 characters
export const DESCRIPTION_MAX_LENGTH = 170; // SEO best practice: 120-170 characters

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
export function validateMetadata(metadata: Partial<PageMetadata> | Metadata): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let isValid = true;

  const titleValue = (metadata as any).title as string | undefined;
  if (typeof titleValue === "string") {
    if (titleValue.length > TITLE_MAX_LENGTH) {
      warnings.push(`Title is ${titleValue.length} characters (max: ${TITLE_MAX_LENGTH})`);
      isValid = false;
    } else if (titleValue.length < 15) {
      warnings.push(`Title is ${titleValue.length} characters (minimum: 15)`);
      isValid = false;
    }
  }

  const descriptionValue = (metadata as any).description as string | undefined;
  if (typeof descriptionValue === "string") {
    if (descriptionValue.length > DESCRIPTION_MAX_LENGTH) {
      warnings.push(`Description is ${descriptionValue.length} characters (max: ${DESCRIPTION_MAX_LENGTH})`);
      isValid = false;
    } else if (descriptionValue.length < 120) {
      warnings.push(`Description is ${descriptionValue.length} characters (minimum: 120)`);
      isValid = false;
    }
  }

  if ((metadata as any).generatedMeta) {
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
export function createMetadata(metadata: PageMetadata | Metadata): Metadata {
  // If it's already a Next.js Metadata object, return as-is
  if ((metadata as any).alternates || (metadata as any).openGraph) {
    return metadata as Metadata;
  }

  const pageMeta = metadata as PageMetadata;
  const canonical = pageMeta.canonical || generateCanonical();

  // If title + template would exceed 70 chars, use full title object to prevent template appending
  // Template adds " | Shalean Cleaning Services" (30 chars), so we check if title > 40
  // This prevents " | Shalean Cleaning Services" from being added when title is already long
  // Use type assertion to bypass TypeScript requirement for template property
  const TEMPLATE_SUFFIX_LENGTH = 30; // " | Shalean Cleaning Services"
  const MAX_TITLE_LENGTH = 70;
  // If title is > 40 chars, don't add template to keep total ≤ 70
  const titleMetadata = pageMeta.title.length > 40
    ? ({ default: pageMeta.title } as any)
    : pageMeta.title;

  // Ensure description is within optimal range (120-170 chars)
  let finalDescription = pageMeta.description;
  if (finalDescription.length > DESCRIPTION_MAX_LENGTH) {
    // Truncate descriptions that are too long
    finalDescription = truncateText(finalDescription, DESCRIPTION_MAX_LENGTH);
  } else if (finalDescription.length < 120) {
    // Expand descriptions that are too short
    // Try to add context while keeping it under 170 chars
    const expanded = `${finalDescription} Trusted local cleaning company with competitive pricing and satisfaction guarantee.`;
    if (expanded.length <= DESCRIPTION_MAX_LENGTH) {
      finalDescription = expanded;
    } else {
      // If expanded is still too long, just pad with generic text
      finalDescription = `${finalDescription} Professional cleaning services with expert cleaners and flexible scheduling.`;
      if (finalDescription.length > DESCRIPTION_MAX_LENGTH) {
        finalDescription = truncateText(finalDescription, DESCRIPTION_MAX_LENGTH);
      }
    }
  }

  return {
    title: titleMetadata,
    description: finalDescription,
    alternates: {
      canonical,
    },
    robots: pageMeta.robots || "index,follow",
    openGraph: {
      locale: DEFAULT_SITE_METADATA.locale,
      siteName: DEFAULT_SITE_METADATA.siteName,
      type: pageMeta.ogType || DEFAULT_SITE_METADATA.defaultOgType,
      title: pageMeta.title,
      description: finalDescription,
      url: canonical,
      ...(pageMeta.ogImage && {
        images: [
          {
            url: pageMeta.ogImage.url,
            alt: pageMeta.ogImage.alt,
            width: OG_IMAGE_WIDTH,
            height: OG_IMAGE_HEIGHT,
          },
        ],
      }),
    },
    twitter: {
      card: pageMeta.twitterCard || DEFAULT_SITE_METADATA.twitterCard,
      title: pageMeta.title,
      description: finalDescription,
      ...(pageMeta.ogImage && {
        images: [pageMeta.ogImage.url],
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
): Metadata {
  const slug = suburb.toLowerCase().replace(/\s+/g, '-');
  const path = `/location/${city.toLowerCase().replace(/\s+/g, '-')}/${slug}`;
  
  // Create optimized title (15-70 chars)
  const title = `Cleaning Services in ${suburb} | Shalean`;
  
  // Create optimized description (120-170 chars)
  const serviceTypes = highlights.length > 0 
    ? highlights.slice(0, 3).join(', ').toLowerCase()
    : 'regular, deep, and move-in cleaning';
  
  const optimizedDescription = `Professional home and apartment cleaning services in ${suburb}, ${city}. Experienced cleaners available for ${serviceTypes}. Book same-day service in ${area}. Trusted local cleaning company with competitive pricing.`;
  
  // Use the provided description if it's valid length (120-170 chars), otherwise use optimized
  let finalDescription = description;
  if (description.length < 120 || description.length > 170) {
    // If custom description is not optimal length, use the generated one
    finalDescription = optimizedDescription;
  }
  
  // Ensure description is within optimal range (120-170 chars)
  if (finalDescription.length > 170) {
    finalDescription = truncateText(finalDescription, 170);
  } else if (finalDescription.length < 120) {
    // If still too short, expand it
    finalDescription = `Professional home and apartment cleaning services in ${suburb}, ${city}. Expert cleaners available for ${serviceTypes}. Book same-day service throughout ${area}. Trusted local cleaning company with competitive pricing and satisfaction guarantee.`;
    
    // Trim if over limit
    if (finalDescription.length > 170) {
      finalDescription = truncateText(finalDescription, 170);
    }
  }
  
  // Return full Next.js Metadata so pages using this directly get proper canonicals
  return createMetadata({
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
  });
}

/**
 * Logs metadata validation results for debugging
 */
export function logMetadataValidation(
  path: string,
  metadata: PageMetadata | Metadata,
  validation: { isValid: boolean; warnings: string[] }
): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`\n📄 Metadata for ${path}:`);
    const titleValue = (metadata as any).title as string | undefined;
    const descriptionValue = (metadata as any).description as string | undefined;
    const canonicalValue = (metadata as any).alternates?.canonical || (metadata as any).canonical;
    const generated = (metadata as any).generatedMeta ? "Yes" : "No";

    console.log(`Title: "${titleValue ?? ""}" (${titleValue?.length ?? 0} chars)`);
    console.log(`Description: "${descriptionValue ?? ""}" (${descriptionValue?.length ?? 0} chars)`);
    console.log(`Canonical: ${canonicalValue ?? ""}`);
    console.log(`Generated: ${generated}`);
    
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
