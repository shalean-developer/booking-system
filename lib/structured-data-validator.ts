/**
 * Structured Data Validator
 * 
 * Utilities for cleaning and validating JSON-LD structured data
 * to ensure compatibility with schema.org specifications
 */

const SITE_URL = "https://shalean.co.za";

/**
 * Recursively removes undefined, null, and empty values from an object
 */
export function cleanStructuredData<T extends Record<string, any>>(data: T): Partial<T> {
  const cleaned: any = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip undefined and null values
    if (value === undefined || value === null) {
      continue;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      const cleanedArray = value
        .map((item) => {
          if (typeof item === "object" && item !== null) {
            return cleanStructuredData(item);
          }
          return item;
        })
        .filter((item) => item !== undefined && item !== null && item !== "");
      
      if (cleanedArray.length > 0) {
        cleaned[key] = cleanedArray;
      }
      continue;
    }

    // Handle objects
    if (typeof value === "object" && value !== null && !(value instanceof Date)) {
      const cleanedObject = cleanStructuredData(value);
      if (Object.keys(cleanedObject).length > 0) {
        cleaned[key] = cleanedObject;
      }
      continue;
    }

    // Handle strings - skip empty strings
    if (typeof value === "string" && value.trim() === "") {
      continue;
    }

    // Handle dates - ensure ISO 8601 format
    if (value instanceof Date) {
      cleaned[key] = value.toISOString();
      continue;
    }

    // Keep all other values
    cleaned[key] = value;
  }

  return cleaned;
}

/**
 * Validates and fixes image URLs to be absolute
 */
export function normalizeImageUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;

  // If already absolute URL, return as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Remove leading slash if present
  const cleanPath = url.startsWith("/") ? url.slice(1) : url;

  // Construct absolute URL
  return `${SITE_URL}/${cleanPath}`;
}

/**
 * Validates required fields for Organization schema
 */
export function validateOrganizationSchema(schema: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schema["@context"]) {
    errors.push("Missing @context");
  }

  if (!schema["@type"]) {
    errors.push("Missing @type");
  }

  if (schema["@type"] !== "Organization" && schema["@type"] !== "LocalBusiness") {
    errors.push(`Invalid @type: expected Organization or LocalBusiness, got ${schema["@type"]}`);
  }

  if (!schema.name || typeof schema.name !== "string" || schema.name.trim() === "") {
    errors.push("Missing or invalid 'name' field");
  }

  if (schema.url && typeof schema.url !== "string") {
    errors.push("Invalid 'url' field - must be string");
  }

  if (schema.logo && typeof schema.logo !== "string" && !schema.logo.url) {
    errors.push("Invalid 'logo' field - must be string URL or ImageObject");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates required fields for BlogPosting schema
 */
export function validateBlogPostingSchema(schema: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schema["@context"]) {
    errors.push("Missing @context");
  }

  if (!schema["@type"] || schema["@type"] !== "BlogPosting") {
    errors.push("Invalid or missing @type - must be BlogPosting");
  }

  if (!schema.headline || typeof schema.headline !== "string" || schema.headline.trim() === "") {
    errors.push("Missing or invalid 'headline' field");
  }

  if (!schema.description || typeof schema.description !== "string" || schema.description.trim() === "") {
    errors.push("Missing or invalid 'description' field");
  }

  if (schema.datePublished) {
    const date = new Date(schema.datePublished);
    if (isNaN(date.getTime())) {
      errors.push("Invalid 'datePublished' - must be valid ISO 8601 date");
    }
  }

  if (schema.image) {
    if (typeof schema.image === "string") {
      // String URL is valid
      if (!schema.image.startsWith("http")) {
        errors.push("Image URL must be absolute (start with http:// or https://)");
      }
    } else if (typeof schema.image === "object") {
      // ImageObject must have url
      if (!schema.image.url || typeof schema.image.url !== "string") {
        errors.push("ImageObject must have 'url' field");
      }
    }
  }

  if (schema.author && typeof schema.author === "object") {
    if (!schema.author.name || typeof schema.author.name !== "string") {
      errors.push("Author must have 'name' field");
    }
  }

  if (schema.publisher && typeof schema.publisher === "object") {
    if (!schema.publisher.name || typeof schema.publisher.name !== "string") {
      errors.push("Publisher must have 'name' field");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates required fields for Service schema
 */
export function validateServiceSchema(schema: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schema["@context"]) {
    errors.push("Missing @context");
  }

  if (!schema["@type"] || schema["@type"] !== "Service") {
    errors.push("Invalid or missing @type - must be Service");
  }

  if (!schema.name || typeof schema.name !== "string" || schema.name.trim() === "") {
    errors.push("Missing or invalid 'name' field");
  }

  if (!schema.description || typeof schema.description !== "string" || schema.description.trim() === "") {
    errors.push("Missing or invalid 'description' field");
  }

  if (schema.provider && typeof schema.provider === "object") {
    if (!schema.provider.name || typeof schema.provider.name !== "string") {
      errors.push("Provider must have 'name' field");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates and fixes a structured data schema
 * Returns cleaned and validated schema ready for JSON.stringify
 */
export function validateAndCleanSchema<T extends Record<string, any>>(
  schema: T,
  schemaType?: "Organization" | "BlogPosting" | "Service" | "LocalBusiness"
): { cleaned: Partial<T>; isValid: boolean; errors: string[] } {
  // First, normalize image URLs
  if ('image' in schema && schema.image) {
    if (typeof schema.image === "string") {
      (schema as any).image = normalizeImageUrl(schema.image) || schema.image;
    } else if (typeof schema.image === "object" && schema.image !== null && 'url' in schema.image) {
      (schema.image as any).url = normalizeImageUrl((schema.image as any).url) || (schema.image as any).url;
    }
  }

  if ('logo' in schema && schema.logo) {
    if (typeof schema.logo === "string") {
      (schema as any).logo = normalizeImageUrl(schema.logo) || schema.logo;
    } else if (typeof schema.logo === "object" && schema.logo !== null && 'url' in schema.logo) {
      (schema.logo as any).url = normalizeImageUrl((schema.logo as any).url) || (schema.logo as any).url;
    }
  }

  // Clean undefined/null values
  const cleaned = cleanStructuredData(schema) as Partial<T>;

  // Validate based on schema type
  let validation = { isValid: true, errors: [] as string[] };

  if (schemaType === "BlogPosting") {
    validation = validateBlogPostingSchema(cleaned);
  } else if (schemaType === "Service") {
    validation = validateServiceSchema(cleaned);
  } else if (schemaType === "Organization" || schemaType === "LocalBusiness") {
    validation = validateOrganizationSchema(cleaned);
  }

  return {
    cleaned,
    isValid: validation.isValid,
    errors: validation.errors,
  };
}

/**
 * Safely stringifies structured data with validation
 */
export function stringifyStructuredData(
  schema: any,
  schemaType?: "Organization" | "BlogPosting" | "Service" | "LocalBusiness"
): string {
  const { cleaned, isValid, errors } = validateAndCleanSchema(schema, schemaType);

  if (!isValid && process.env.NODE_ENV === "development") {
    console.warn("⚠️ Structured data validation errors:", errors);
  }

  try {
    return JSON.stringify(cleaned, null, 0);
  } catch (error) {
    console.error("Error stringifying structured data:", error);
    return JSON.stringify({});
  }
}
