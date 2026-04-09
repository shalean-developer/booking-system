/**
 * Public marketing URLs (safe for client + server).
 *
 * GBP: use Google Maps → your business → Share → copy link.
 * Do not use google.com/search?... URLs (they expire and hurt SEO).
 */
export const GBP_LISTING_URL =
  process.env.NEXT_PUBLIC_GBP_URL?.trim() ||
  "https://www.google.com/maps/place/Shalean+Cleaning+Services/@-33.9249,18.4241,15z";
