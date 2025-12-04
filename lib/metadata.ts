import type { Metadata } from "next";

// Base URL for the site
export const SITE_URL = "https://shalean.co.za";

// Default OG image dimensions
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

// Validation limits
export const TITLE_MAX_LENGTH = 70; // SEO best practice: 15-70 characters
export const DESCRIPTION_MAX_LENGTH = 155; // SEO best practice: 120-155 characters (Google displays ~155)

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
  keywords?: string[];
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
  // Note: Template length is variable (handled upstream in blog post metadata generation):
  // - " | [Category] | Shalean" (variable, typically 13-30 chars)
  // - " | Shalean Cleaning Services" (30 chars, default fallback)
  // - " | Shalean" (13 chars, short fallback)
  // We check if title > 40 chars OR if it already contains a template to prevent template appending
  // Use type assertion to bypass TypeScript requirement for template property
  const TEMPLATE_SUFFIX_LENGTH = 30; // Max expected template length for safety check
  const MAX_TITLE_LENGTH = 70;
  // Check if title already has a template suffix (contains " | Shalean" or " | ")
  const hasTemplate = pageMeta.title.includes(' | Shalean') || pageMeta.title.includes(' | ');
  // If title is > 40 chars OR already has a template, use { default: ... } to prevent layout template appending
  // (Titles are pre-formatted with appropriate template in blog post metadata generation)
  const titleMetadata = (pageMeta.title.length > 40 || hasTemplate)
    ? ({ absolute: pageMeta.title } as any)
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
    ...(pageMeta.keywords && pageMeta.keywords.length > 0 && {
      keywords: pageMeta.keywords,
    }),
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
  // For blog posts, ALWAYS use { default: ... } format to prevent layout template from appending
  // Blog post titles are pre-formatted with appropriate template suffixes
  // Build metadata directly to ensure title is set correctly
  const canonical = metadata.canonical || generateCanonical();
  
  // Ensure description is within optimal range (120-170 chars)
  let finalDescription = metadata.description;
  if (finalDescription.length > DESCRIPTION_MAX_LENGTH) {
    finalDescription = truncateText(finalDescription, DESCRIPTION_MAX_LENGTH);
  } else if (finalDescription.length < 120) {
    const expanded = `${finalDescription} Trusted local cleaning company with competitive pricing and satisfaction guarantee.`;
    if (expanded.length <= DESCRIPTION_MAX_LENGTH) {
      finalDescription = expanded;
    } else {
      finalDescription = `${finalDescription} Professional cleaning services with expert cleaners and flexible scheduling.`;
      if (finalDescription.length > DESCRIPTION_MAX_LENGTH) {
        finalDescription = truncateText(finalDescription, DESCRIPTION_MAX_LENGTH);
      }
    }
  }
  
  // CRITICAL: Always use { default: ... } format for blog post titles
  // This prevents the layout template "%s | Shalean Cleaning Services" from appending
  const titleWithDefault = { absolute: metadata.title } as any;
  
  return {
    title: titleWithDefault, // Use { default: ... } to prevent template appending
    description: finalDescription,
    alternates: {
      canonical,
    },
    robots: metadata.robots || "index,follow",
    openGraph: {
      locale: DEFAULT_SITE_METADATA.locale,
      siteName: DEFAULT_SITE_METADATA.siteName,
      type: "article",
      title: metadata.title, // Keep original title for OG tags
      description: finalDescription,
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
      ...(metadata.publishedTime && {
        publishedTime: metadata.publishedTime,
      }),
      ...(metadata.author && {
        authors: [metadata.author],
      }),
    },
    twitter: {
      card: metadata.twitterCard || DEFAULT_SITE_METADATA.twitterCard,
      title: metadata.title, // Keep original title for Twitter tags
      description: finalDescription,
      ...(metadata.ogImage && {
        images: [metadata.ogImage.url],
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
  highlights: string[] = [],
  slugOverrideOrOptions?: string | {
    slugOverride?: string;
    services?: string[];
    propertyTypes?: string[];
    keywords?: string[];
  }
): Metadata {
  const options =
    typeof slugOverrideOrOptions === "string"
      ? { slugOverride: slugOverrideOrOptions }
      : slugOverrideOrOptions ?? {};

  const slugify = (value: string): string =>
    value
      .toLowerCase()
      .replace(/['’&]/g, '') // remove apostrophes and ampersands
      .replace(/[^a-z0-9]+/g, '-') // replace other non-alphanumeric with hyphen
      .replace(/(^-|-$)/g, ''); // trim hyphens from ends

  const suburbSlug = options.slugOverride ?? slugify(suburb);
  const citySlug = slugify(city);

  const path = `/location/${citySlug}/${suburbSlug}`;

  const formatList = (items: string[]): string => {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
  };

  const defaultServices = [
    "regular house cleaning",
    "deep cleaning",
    "move-in/out cleaning",
    "office cleaning",
  ];

  const services =
    options.services?.length
      ? options.services
      : highlights.length
        ? highlights.map((item) => item.toLowerCase())
        : defaultServices;

  const propertyTypes =
    options.propertyTypes?.length
      ? options.propertyTypes
      : ["homes", "apartments", "offices"];

  const primaryTitle = `Home & Office Cleaning Services in ${suburb}, ${city} | Shalean`;
  const fallbackTitle = `Cleaning Services in ${suburb} | Shalean`;
  const title = primaryTitle.length <= TITLE_MAX_LENGTH ? primaryTitle : fallbackTitle;

  const serviceSummary = formatList(services.slice(0, 3));
  const propertySummary = formatList(propertyTypes.slice(0, 3));

  const optimizedDescription = `Book vetted cleaners for ${propertySummary} in ${suburb}, ${city}. We provide ${serviceSummary} with flexible scheduling, eco-friendly products, and a 100% satisfaction guarantee across ${area}.`;
  
  // Use the provided description if it's valid length (120-155 chars), otherwise use optimized
  let finalDescription = description;
  if (description.length < 120 || description.length > DESCRIPTION_MAX_LENGTH) {
    // If custom description is not optimal length, use the generated one
    finalDescription = optimizedDescription;
  }
  
  // Ensure description is within optimal range (120-155 chars)
  if (finalDescription.length > DESCRIPTION_MAX_LENGTH) {
    finalDescription = truncateText(finalDescription, DESCRIPTION_MAX_LENGTH);
  } else if (finalDescription.length < 120) {
    // If still too short, expand it
    finalDescription = `Professional cleaning for ${propertySummary || "homes and offices"} in ${suburb}, ${city}. Expert cleaners handle ${serviceSummary || "regular, deep, and move-in cleaning"}. Book same-day service throughout ${area} with competitive pricing and satisfaction guarantee.`;
    
    // Trim if over limit
    if (finalDescription.length > DESCRIPTION_MAX_LENGTH) {
      finalDescription = truncateText(finalDescription, DESCRIPTION_MAX_LENGTH);
    }
  }

  const defaultKeywords = [
    `${suburb} cleaning services`,
    `${suburb} cleaners`,
    `${suburb} house cleaning`,
    `${suburb} maid service`,
    `${suburb} deep cleaning`,
    `${suburb} move out cleaning`,
    `${suburb} office cleaning`,
    `${city} cleaning company`,
    `${area} cleaners`,
  ];

  const keywords = Array.from(
    new Set([...(options.keywords ?? []), ...defaultKeywords].map((keyword) => keyword.trim()).filter(Boolean))
  );
  
  // Return full Next.js Metadata so pages using this directly get proper canonicals
  return createMetadata({
    title,
    description: finalDescription,
    canonical: generateCanonical(path),
    ...(keywords.length > 0 && { keywords }),
    ogImage: {
      url: generateOgImageUrl(`location-${suburbSlug}`),
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
