# 404 Resolution Plan  2025-11-10 Crawl

## Services (4 URLs)
- `/services/deep-cleaning`  Restore dedicated page (new Next.js route mirroring deep-cleaning offer)
- `/services/house-cleaning`, `/services/carpet`, `/services/office-`  Add/adjust 301 redirects to new `/services/regular-cleaning`, `/services/deep-specialty`, `/services/office-cleaning`

## Booking (18 URLs)
- Legacy booking root and query variants already redirected  confirm coverage
- Dynamic booking IDs (`/booking/1740`)  add wildcard redirect to `/booking/confirmation`
- `/cleaning/first-step`  already redirected  verify still linked; remove old references if any

## Locations (152 URLs)
- For slugs that map to existing `/location/{city}/{suburb}` pages (29 matches)  add explicit 301 redirects
- For priority Cape Town suburbs missing content (`maitland`, `durbanvale`, `plumstead`, `wynberg`, `tableview`)  restore pages using location template
- For remaining legacy Webflow IDs / malformed slugs  consolidate to `/location` hub via wildcard redirect (already present) and remove from sitemap/internal links
- Audit components for lingering `/locations/` links and swap to new `/location/` structure

## Articles & Article Pages (44 URLs)
- Map old `/articles/*` and `/article_page/*` slugs to new blog posts where equivalents exist (fall back to `/blog` if not)
- Restore cornerstone pieces as new blog entries via CMS (flagged: `expert-home-deep-cleaning-services-near-you`, `the-best-cleaning-services-in-cape-town`, `one-time-cleaning-service-costs`)
- Remove `/articles/` index link from navigation if still present

## Blog (6 URLs)
- Add redirects for `/blog/cleaning-frequency`, `/blog/cleaning-mistakes`, `/blog/how-to-prepare-for-a-deep-clean` to closest live equivalents or restored drafts

## Auth & Account (5 URLs)
- `/auth`, `/auth/sign-up` already redirected  confirm
- `/account`  add redirect to `/login`
- `/user/m`  remove internal links; respond with 410 if external only

## Legal & Policy (7 URLs)
- Restore compliance pages: create `/popia` and `/cookies` routes referencing updated policy copy
- Add redirect `/privacy-policy`  `/privacy`
- `/refund`, `/shipping`  redirect to `/terms`

## Other legacy hashes / malformed (12 URLs)
- Identify source (likely legacy CMS). Ensure not emitted by sitemap or internal nav
- Configure wildcard catch-all to return 410 to signal removal if no redirect target
