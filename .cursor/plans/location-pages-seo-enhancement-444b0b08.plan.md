<!-- 444b0b08-65a1-4ddb-bf08-22c860d844c7 83152785-2fdd-4ca7-9302-1048e2db3e38 -->
# Location Pages SEO Enhancement

## Overview

Improve SEO for all 40 Cape Town suburb pages by implementing comprehensive metadata including canonical URLs, optimized meta descriptions, Open Graph tags, Twitter cards, and structured data.

## Current Issues

1. **Missing canonical URLs** - Pages don't have self-referencing canonical URLs
2. **Short meta descriptions** - Current descriptions are ~85-110 chars, need 120-170 chars
3. **Limited social media tags** - No Open Graph or Twitter card optimization
4. **No structured data** - Missing LocalBusiness schema for local SEO

## Implementation Strategy

### 1. Update Metadata Helper for Location Pages

Create a new helper function in `lib/metadata.ts`:

- `createLocationMetadata()` - Generate complete metadata for suburb pages
- Include canonical URL generation
- Create optimized meta descriptions (120-170 chars)
- Add Open Graph images
- Include Twitter card metadata

### 2. Update Suburb Page Template

Modify `components/suburb-page-template.tsx`:

- Add structured data (LocalBusiness schema) for each suburb
- Include service area, contact info, operating hours
- Add breadcrumb structured data
- Enhance local SEO signals

### 3. Update All 40 Suburb Pages

Update each page in `app/location/cape-town/[suburb]/page.tsx`:

- Replace basic `metadata` export with `generateMetadata()` function
- Use new `createLocationMetadata()` helper
- Expand meta descriptions to 120-170 characters
- Add location-specific keywords
- Include canonical URLs

### 4. Key Files to Modify

- `lib/metadata.ts` - Add location metadata helpers
- `components/suburb-page-template.tsx` - Add structured data
- All 40 files: `app/location/cape-town/[suburb]/page.tsx`

## Sample Implementation

### Enhanced Meta Description Examples

**Before:** "Professional cleaning services in Camps Bay, Cape Town. Book your trusted cleaner today! Serving the Atlantic Seaboard." (85 chars)

**After:** "Professional home and apartment cleaning services in Camps Bay, Cape Town. Experienced luxury property cleaners available for regular, deep, and Airbnb cleaning. Book same-day service on the Atlantic Seaboard." (210 chars - will optimize to ~140 chars)

### Structured Data Example

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Shalean Cleaning Services - Camps Bay",
  "image": "https://shalean.co.za/assets/og/location-camps-bay.jpg",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Camps Bay",
    "addressRegion": "Western Cape",
    "addressCountry": "ZA"
  },
  "telephone": "+27871535250",
  "priceRange": "R200-R1500",
  "areaServed": {
    "@type": "City",
    "name": "Camps Bay"
  }
}
```

## SEO Benefits

- **Canonical URLs** - Prevent duplicate content issues, ensure correct URL indexing
- **Optimized Meta Descriptions** - Improve click-through rates from search results (120-170 chars is optimal)
- **Open Graph Tags** - Better social media sharing with custom images and descriptions
- **Twitter Cards** - Enhanced Twitter/X sharing experience
- **Structured Data** - Help Google understand business locations and services, improve local search rankings
- **Location-specific Keywords** - Better targeting for "[service] in [suburb]" searches

## Testing

After implementation, verify:

- Meta descriptions are 120-170 characters
- Canonical URLs are present and correct
- Structured data validates on Google's Rich Results Test
- Open Graph tags work on social media preview tools

### To-dos

- [ ] Add createLocationMetadata() helper function to lib/metadata.ts with canonical URL, OG tags, and optimized descriptions
- [ ] Update suburb-page-template.tsx to include LocalBusiness and BreadcrumbList structured data
- [ ] Update 6 Atlantic Seaboard suburb pages (Camps Bay, Sea Point, Green Point, Clifton, Bantry Bay, Fresnaye) with enhanced metadata
- [ ] Update 6 City Bowl suburb pages (City Centre, Gardens, Tamboerskloof, Oranjezicht, Woodstock, Observatory) with enhanced metadata
- [ ] Update 7 Northern Suburbs pages (Table View, Bloubergstrand, Milnerton, Durbanville, Bellville, Parow, Brackenfell) with enhanced metadata
- [ ] Update 10 Southern Suburbs pages (Claremont, Newlands, Rondebosch, Wynberg, Kenilworth, Plumstead, Constantia, Bishopscourt, Tokai, Bergvliet) with enhanced metadata
- [ ] Update 5 False Bay suburb pages (Muizenberg, Fish Hoek, Kalk Bay, Simon's Town, Lakeside) with enhanced metadata
- [ ] Update 4 West Coast suburb pages (Hout Bay, Noordhoek, Kommetjie, Scarborough) with enhanced metadata
- [ ] Update 3 Helderberg and Winelands pages (Somerset West, Strand, Stellenbosch) with enhanced metadata