/**
 * SEO Validator
 * 
 * Comprehensive utilities for validating SEO metadata
 */

import { TITLE_MAX_LENGTH, DESCRIPTION_MAX_LENGTH, SITE_URL } from "./metadata";

export interface SEOValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validates page title
 */
export function validateTitle(title: string | undefined | null): SEOValidationResult {
  const result: SEOValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
  };

  if (!title) {
    result.isValid = false;
    result.errors.push("Title is required");
    return result;
  }

  if (typeof title !== "string") {
    result.isValid = false;
    result.errors.push("Title must be a string");
    return result;
  }

  const trimmed = title.trim();

  if (trimmed.length === 0) {
    result.isValid = false;
    result.errors.push("Title cannot be empty");
    return result;
  }

  if (trimmed.length > TITLE_MAX_LENGTH) {
    result.isValid = false;
    result.errors.push(`Title exceeds maximum length (${trimmed.length}/${TITLE_MAX_LENGTH} chars)`);
  } else if (trimmed.length > 60) {
    result.warnings.push(`Title is long (${trimmed.length} chars) - optimal is 50-60 chars`);
  } else if (trimmed.length < 30) {
    result.warnings.push(`Title is short (${trimmed.length} chars) - consider 30-60 chars`);
  }

  // Check for duplicate patterns
  if (trimmed.split("|").length > 2) {
    result.warnings.push("Title has multiple separators - may be too long when rendered");
  }

  return result;
}

/**
 * Validates meta description
 */
export function validateDescription(description: string | undefined | null): SEOValidationResult {
  const result: SEOValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
  };

  if (!description) {
    result.isValid = false;
    result.errors.push("Description is required");
    return result;
  }

  if (typeof description !== "string") {
    result.isValid = false;
    result.errors.push("Description must be a string");
    return result;
  }

  const trimmed = description.trim();

  if (trimmed.length === 0) {
    result.isValid = false;
    result.errors.push("Description cannot be empty");
    return result;
  }

  if (trimmed.length > DESCRIPTION_MAX_LENGTH) {
    result.isValid = false;
    result.errors.push(`Description exceeds maximum length (${trimmed.length}/${DESCRIPTION_MAX_LENGTH} chars)`);
  } else if (trimmed.length > 160) {
    result.warnings.push(`Description is long (${trimmed.length} chars) - optimal is 150-160 chars`);
  } else if (trimmed.length < 120) {
    result.warnings.push(`Description is short (${trimmed.length} chars) - optimal is 120-160 chars`);
  }

  // Check for proper sentence structure
  if (!trimmed.endsWith(".") && !trimmed.endsWith("!") && trimmed.length > 50) {
    result.warnings.push("Description should end with punctuation for better readability");
  }

  return result;
}

/**
 * Validates canonical URL
 */
export function validateCanonical(canonical: string | undefined | null): SEOValidationResult {
  const result: SEOValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
  };

  if (!canonical) {
    // Canonical is optional but recommended
    result.warnings.push("Canonical URL is missing - recommended for SEO");
    return result;
  }

  if (typeof canonical !== "string") {
    result.isValid = false;
    result.errors.push("Canonical must be a string");
    return result;
  }

  // Should be absolute URL
  if (!canonical.startsWith("http://") && !canonical.startsWith("https://")) {
    result.warnings.push("Canonical URL should be absolute (start with http:// or https://)");
  }

  // Should match site domain
  if (canonical.startsWith("http") && !canonical.startsWith(SITE_URL)) {
    result.warnings.push(`Canonical URL points to different domain (expected ${SITE_URL})`);
  }

  return result;
}

/**
 * Validates if H1 heading exists on page
 * This is a placeholder - actual validation would need to check rendered HTML
 */
export function validateH1(h1Text: string | null | undefined): SEOValidationResult {
  const result: SEOValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
  };

  if (!h1Text) {
    result.isValid = false;
    result.errors.push("H1 heading is missing - required for SEO");
    return result;
  }

  if (typeof h1Text !== "string" || h1Text.trim().length === 0) {
    result.isValid = false;
    result.errors.push("H1 heading is empty or invalid");
    return result;
  }

  // H1 should match or be related to page title
  if (h1Text.length > 100) {
    result.warnings.push("H1 heading is very long - consider shortening");
  }

  return result;
}

/**
 * Validates anchor text for internal links
 */
export function validateAnchorText(
  anchorText: string,
  targetUrl: string
): SEOValidationResult {
  const result: SEOValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
  };

  const nonDescriptivePatterns = [
    /^click here$/i,
    /^read more$/i,
    /^here$/i,
    /^link$/i,
    /^more$/i,
    /^see more$/i,
    /^learn more$/i,
    /^\d+$/,
    /^#$/,
  ];

  for (const pattern of nonDescriptivePatterns) {
    if (pattern.test(anchorText.trim())) {
      result.isValid = false;
      result.errors.push(`Anchor text "${anchorText}" is not descriptive`);
      return result;
    }
  }

  if (anchorText.trim().length < 3) {
    result.warnings.push("Anchor text is very short - consider making it more descriptive");
  }

  if (anchorText.trim().length > 100) {
    result.warnings.push("Anchor text is very long - consider shortening");
  }

  return result;
}

/**
 * Comprehensive SEO validation for a page
 */
export interface PageSEOData {
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  h1?: string | null;
  wordCount?: number;
  internalLinks?: number;
  images?: Array<{ alt?: string; src?: string }>;
}

export function validatePageSEO(data: PageSEOData): SEOValidationResult {
  const result: SEOValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
  };

  // Validate title
  const titleValidation = validateTitle(data.title);
  if (!titleValidation.isValid) {
    result.isValid = false;
    result.errors.push(...titleValidation.errors);
  }
  result.warnings.push(...titleValidation.warnings);

  // Validate description
  const descValidation = validateDescription(data.description);
  if (!descValidation.isValid) {
    result.isValid = false;
    result.errors.push(...descValidation.errors);
  }
  result.warnings.push(...descValidation.warnings);

  // Validate canonical
  const canonValidation = validateCanonical(data.canonical);
  result.warnings.push(...canonValidation.warnings);
  if (!canonValidation.isValid) {
    result.isValid = false;
    result.errors.push(...canonValidation.errors);
  }

  // Validate H1
  if (data.h1 !== undefined) {
    const h1Validation = validateH1(data.h1);
    if (!h1Validation.isValid) {
      result.isValid = false;
      result.errors.push(...h1Validation.errors);
    }
    result.warnings.push(...h1Validation.warnings);
  }

  // Validate word count
  if (data.wordCount !== undefined) {
    if (data.wordCount < 300) {
      result.warnings.push(`Low word count (${data.wordCount}) - aim for 300+ words for better SEO`);
    }
    if (data.wordCount < 100) {
      result.warnings.push(`Very low word count (${data.wordCount}) - consider adding more content`);
    }
  }

  // Validate internal links
  if (data.internalLinks !== undefined) {
    if (data.internalLinks < 2) {
      result.warnings.push(`Few internal links (${data.internalLinks}) - aim for 2+ internal links per page`);
    }
  }

  // Validate images have alt text
  if (data.images) {
    const imagesWithoutAlt = data.images.filter((img) => !img.alt || img.alt.trim() === "");
    if (imagesWithoutAlt.length > 0) {
      result.warnings.push(`${imagesWithoutAlt.length} image(s) missing alt text`);
    }
  }

  return result;
}

/**
 * Checks for duplicate titles across pages
 */
export function checkDuplicateTitles(
  titles: Array<{ path: string; title: string }>
): Array<{ path: string; title: string; duplicates: string[] }> {
  const titleMap = new Map<string, string[]>();

  // Group titles by their normalized form
  titles.forEach(({ path, title }) => {
    const normalized = title.trim().toLowerCase();
    if (!titleMap.has(normalized)) {
      titleMap.set(normalized, []);
    }
    titleMap.get(normalized)!.push(path);
  });

  // Find duplicates
  const duplicates: Array<{ path: string; title: string; duplicates: string[] }> = [];

  titleMap.forEach((paths, normalizedTitle) => {
    if (paths.length > 1) {
      paths.forEach((path) => {
        const originalTitle = titles.find((t) => t.path === path)?.title || normalizedTitle;
        duplicates.push({
          path,
          title: originalTitle,
          duplicates: paths.filter((p) => p !== path),
        });
      });
    }
  });

  return duplicates;
}

/**
 * Checks for duplicate descriptions across pages
 */
export function checkDuplicateDescriptions(
  descriptions: Array<{ path: string; description: string }>
): Array<{ path: string; description: string; duplicates: string[] }> {
  const descMap = new Map<string, string[]>();

  // Group descriptions by their normalized form
  descriptions.forEach(({ path, description }) => {
    const normalized = description.trim().toLowerCase();
    if (!descMap.has(normalized)) {
      descMap.set(normalized, []);
    }
    descMap.get(normalized)!.push(path);
  });

  // Find duplicates
  const duplicates: Array<{ path: string; description: string; duplicates: string[] }> = [];

  descMap.forEach((paths, normalizedDesc) => {
    if (paths.length > 1) {
      paths.forEach((path) => {
        const originalDesc = descriptions.find((d) => d.path === path)?.description || normalizedDesc;
        duplicates.push({
          path,
          description: originalDesc,
          duplicates: paths.filter((p) => p !== path),
        });
      });
    }
  });

  return duplicates;
}
