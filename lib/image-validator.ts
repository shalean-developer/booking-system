/**
 * Image Validator
 * 
 * Utilities for validating image paths and ensuring images exist
 */

import { SITE_URL } from "./metadata";

/**
 * Validates if an image path is valid (basic validation)
 * Note: In production, actual file existence would need server-side checks
 */
export function isValidImagePath(path: string | null | undefined): boolean {
  if (!path) return false;

  // Must be a string
  if (typeof path !== "string") return false;

  // Must not be empty
  if (path.trim() === "") return false;

  return true;
}

/**
 * Normalizes image path to absolute URL
 */
export function normalizeImagePath(path: string | null | undefined): string | null {
  if (!path) return null;

  // If already absolute URL, return as is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Remove leading slash if present for consistency
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  // Construct absolute URL
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Checks if image path points to a public directory
 */
export function isPublicImagePath(path: string): boolean {
  // Public images should start with /images/, /assets/, or similar public paths
  const publicPaths = [
    "/images/",
    "/assets/",
    "/icon-",
    "/favicon",
    "/apple-icon",
    "/logo",
  ];

  return publicPaths.some((publicPath) => path.includes(publicPath));
}

/**
 * Validates image reference for use in components
 */
export function validateImageReference(
  imagePath: string | null | undefined,
  componentName: string
): { isValid: boolean; normalizedPath: string | null; warning?: string } {
  if (!isValidImagePath(imagePath)) {
    return {
      isValid: false,
      normalizedPath: null,
      warning: `Invalid image path in ${componentName}`,
    };
  }

  const normalized = normalizeImagePath(imagePath);

  if (!isPublicImagePath(normalized || "")) {
    return {
      isValid: true,
      normalizedPath: normalized,
      warning: `Image path in ${componentName} may not be in public directory: ${normalized}`,
    };
  }

  return {
    isValid: true,
    normalizedPath: normalized,
  };
}

/**
 * Common image paths that should exist in public directory
 * This is a reference list - actual validation would check file system
 */
export const EXPECTED_IMAGES = [
  "/images/cleaning-team-hero.jpg",
  "/images/home-maintenance.jpg",
  "/images/deep-specialty.jpg",
  "/images/move-turnover.jpg",
  "/images/team-normatter.webp",
  "/images/team-lucia.webp",
  "/images/team-nyasha.webp",
  "/icon-32.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-icon.png",
  "/favicon.ico",
  "/logo.png",
] as const;

/**
 * Validates multiple image references at once
 */
export function validateImageReferences(
  images: Array<{ path: string | null | undefined; name: string }>
): Array<{ name: string; isValid: boolean; normalizedPath: string | null; warning?: string }> {
  return images.map(({ path, name }) => ({
    ...validateImageReference(path, name),
    name,
  }));
}
