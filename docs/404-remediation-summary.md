# 404 Remediation Summary – November 2025

## Overview
Actions taken to resolve the high volume of 404s reported in Search Console (257 legacy URLs). Work completed 11 Nov 2025 by GPT-5 Codex.

## Redirects
- Enforced apex domain (`www → non-www`) and added comprehensive legacy route coverage in `next.config.js`:
  - Booking routes (root, query variants, historical `/booking/:id`, legacy `/cleaning*` paths).
  - Locations: explicit mappings for problematic slugs (e.g. `-city-bowl`, `glencairn`, `tableview`, `lower-vrede`) plus wildcard fallbacks. Generated full mapping list in `data/location-redirects.txt` (150 entries) for potential import into infrastructure/CDN rules.
  - Services: ensured `/services/deep-cleaning`, `/services/office-`, `house-cleaning`, `carpet`, etc. resolve to modern equivalents.
  - Content: wildcards for `/articles/*`, `/article_page/*`, and missing blog slugs redirect to `/blog`.
  - Miscellaneous: `/auth`, `/account`, `/community/*`, `/apply`, `/privacy-policy`, `/refund`, `/shipping`, malformed `/&`, `/$`, and encoded `/user/m`.

## Restored / Added Pages
- Reintroduced dedicated service landing page at `app/services/deep-cleaning/page.tsx` and updated `/services` grid to link to it.
- Added compliance content:
  - `app/popia/page.tsx`
  - `app/cookies/page.tsx`
- Linked new legal pages from the site footer (`components/home-footer.tsx`).

## Sitemap & SEO
- `app/sitemap.ts` now includes:
  - Updated service list (includes `deep-cleaning`).
  - New legal pages (`/privacy`, `/popia`, `/cookies`).
- `docs/404-inventory.md` updated with resolution strategy per bucket.

## Validation
- `npm run build` (Next.js 16.0.1) succeeded after changes.

## Follow-Up
- Upload/merge the generated `data/location-redirects.txt` mapping into CDN or reverse proxy rules if needed (only select high-traffic redirects added directly to Next.js to avoid route bloat).
- Resubmit sitemap in Google Search Console and request recrawl for the highest-priority URLs (services, bookings, key locations).
- Monitor Search Console for residual 404s and expand redirect map as new patterns surface.

