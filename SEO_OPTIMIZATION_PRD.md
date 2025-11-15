# SEO Optimization PRD (Product Requirements Document)

## Document Information
- **Project:** SEO Optimization & Enhancement
- **Version:** 1.0
- **Date:** 2024
- **Status:** Planning
- **Owner:** Development Team

---

## Executive Summary

This PRD outlines comprehensive SEO improvements for Shalean Cleaning Services website to enhance search engine visibility, improve rankings, and increase organic traffic. The plan focuses on structured data enhancements, content optimization, internal linking improvements, and technical SEO fixes.

**Business Impact:** Improved search rankings → Increased organic traffic → More bookings → Higher revenue

---

## 1. Objectives

### Primary Goals
1. **Increase Organic Visibility**
   - Achieve rich snippets in search results (Service, FAQ, HowTo, Review)
   - Improve rankings for target keywords
   - Increase click-through rates from search results

2. **Enhance Local SEO**
   - Better visibility in local search results
   - Improved Google Maps integration
   - Higher rankings for location-based queries

3. **Improve Content Discoverability**
   - Better structured data helps search engines understand content
   - Enhanced internal linking for better crawlability
   - Optimized content structure for semantic search

### Success Metrics
- **Rich Snippets:** 80% of service pages showing rich snippets within 3 months
- **Organic Traffic:** 30% increase in organic traffic within 6 months
- **Click-Through Rate:** 15% improvement in CTR from search results
- **Local Rankings:** Top 3 positions for 10+ location keywords
- **Page Speed:** Maintain Core Web Vitals scores (LCP < 2.5s, FID < 100ms, CLS < 0.1)

---

## 2. Current State Analysis

### Strengths ✅
- Comprehensive metadata system with SEO config (`lib/seo-config.ts`)
- Structured data implementation (Organization, LocalBusiness, BlogPosting, FAQPage, Breadcrumbs)
- Sitemap with proper priorities and change frequencies (`app/sitemap.ts`)
- Robots.txt properly configured (`app/robots.ts`)
- Image optimization with Next.js Image component
- Canonical URLs on all pages
- Open Graph and Twitter Cards
- Location pages with local SEO focus

### Gaps & Opportunities 🔍
- **Missing Service Schema:** Service pages lack Service schema markup
- **Limited Internal Linking:** Insufficient cross-linking between related pages
- **Missing HowTo Schema:** Blog posts with guides lack HowTo structured data
- **Incomplete FAQ Schema:** FAQ schema only on homepage and suburb pages
- **Missing Breadcrumbs:** Some key pages lack breadcrumb navigation
- **Review Schema:** Review aggregation could be enhanced
- **Content Structure:** Could improve semantic HTML5 usage
- **Meta Descriptions:** Some may need optimization for CTR

---

## 3. Requirements

### 3.1 Functional Requirements

#### FR-1: Service Schema Markup
**Priority:** High  
**Description:** Add JSON-LD Service schema to all service pages

**Requirements:**
- Add Service schema to all service pages:
  - `/services/deep-cleaning`
  - `/services/regular-cleaning`
  - `/services/airbnb-cleaning`
  - `/services/office-cleaning`
  - `/services/apartment-cleaning`
  - `/services/window-cleaning`
  - `/services/home-maintenance`
  - `/services/move-turnover`

**Schema Fields:**
```json
{
  "@type": "Service",
  "serviceType": "Home Cleaning Service",
  "provider": { "@type": "LocalBusiness", "name": "Shalean Cleaning Services" },
  "areaServed": { "@type": "City", "name": "Cape Town" },
  "offers": {
    "@type": "Offer",
    "priceRange": "R200-R1500",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": { /* if available */ }
}
```

**Acceptance Criteria:**
- [ ] All service pages have valid Service schema
- [ ] Schema validates in Google Rich Results Test
- [ ] Service rich snippets appear in search results within 2 weeks

---

#### FR-2: Enhanced Internal Linking
**Priority:** High  
**Description:** Improve internal linking structure across the site

**Requirements:**
- Add "Related Services" section on service pages
- Add "Related Locations" on suburb pages
- Add contextual links within blog content to service pages
- Create reusable internal linking component

**Acceptance Criteria:**
- [ ] Each service page links to 3+ related services
- [ ] Each suburb page links to 3+ related suburbs
- [ ] Blog posts contain 2-3 internal links to service/location pages
- [ ] Internal linking component created and reusable

---

#### FR-3: HowTo Schema for Blog Posts
**Priority:** Medium  
**Description:** Add HowTo schema to blog posts that are guides/tutorials

**Requirements:**
- Identify blog posts that are step-by-step guides
- Add HowTo schema with:
  - Step-by-step instructions
  - Estimated duration
  - Tools/materials needed (if applicable)

**Acceptance Criteria:**
- [ ] HowTo schema added to guide-type blog posts
- [ ] Schema validates in Google Rich Results Test
- [ ] HowTo rich snippets appear in search results

---

#### FR-4: FAQ Schema Expansion
**Priority:** High  
**Description:** Add FAQPage schema to more pages

**Requirements:**
- Add FAQ schema to:
  - All service pages (service-specific FAQs)
  - About page
  - Location hub pages (if not already present)

**Acceptance Criteria:**
- [ ] FAQ schema on all service pages
- [ ] FAQ schema on About page
- [ ] FAQ rich snippets appear in search results

---

#### FR-5: Breadcrumb Navigation
**Priority:** Medium  
**Description:** Add breadcrumb navigation with schema to missing pages

**Requirements:**
- Add breadcrumbs to:
  - Service pages
  - Blog listing page
  - About page
  - Other key pages missing breadcrumbs

**Breadcrumb Structure:**
```
Home > Services > [Service Name]
Home > Blog
Home > About
Home > Location > [City] > [Suburb]
```

**Acceptance Criteria:**
- [ ] Breadcrumbs visible on all target pages
- [ ] BreadcrumbList schema validates
- [ ] Breadcrumb rich snippets appear in search results

---

#### FR-6: Review Aggregation Schema
**Priority:** Medium  
**Description:** Enhance review and rating schema

**Requirements:**
- Enhance AggregateRating schema on homepage
- Add individual Review schema for testimonials
- Include review count from testimonials
- Add review schema to suburb pages (if not already present)

**Acceptance Criteria:**
- [ ] Review schema validates
- [ ] Star ratings appear in search results
- [ ] Review count accurately reflects testimonials

---

#### FR-7: Enhanced LocalBusiness Schema
**Priority:** Medium  
**Description:** Improve LocalBusiness schema on location pages

**Requirements:**
- Add more specific service areas
- Include geo coordinates (latitude/longitude)
- Add accurate opening hours
- Add price range per service type
- Include more service types

**Acceptance Criteria:**
- [ ] LocalBusiness schema enhanced on all location pages
- [ ] Schema validates in Google Rich Results Test
- [ ] Better Google Maps integration

---

#### FR-8: Article Schema Enhancement
**Priority:** Low  
**Description:** Enhance BlogPosting schema with additional fields

**Requirements:**
- Add articleSection (category)
- Add wordCount
- Add timeRequired
- Add keywords array
- Add articleBody (full content)

**Acceptance Criteria:**
- [ ] Enhanced Article schema on all blog posts
- [ ] Schema validates
- [ ] Article rich snippets appear in search results

---

### 3.2 Non-Functional Requirements

#### NFR-1: Performance
- **Page Load Time:** Maintain or improve current page load times
- **Core Web Vitals:** Maintain scores (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- **Schema Validation:** All structured data must validate without errors

#### NFR-2: Compatibility
- **Search Engines:** Support Google, Bing, and other major search engines
- **Rich Results:** Compatible with Google Rich Results Test
- **Mobile:** All enhancements must work on mobile devices

#### NFR-3: Maintainability
- **Code Quality:** Follow existing code patterns and conventions
- **Documentation:** Document all schema additions
- **Reusability:** Create reusable components where possible

#### NFR-4: SEO Best Practices
- **Validation:** All structured data must pass validation
- **Uniqueness:** No duplicate content or schema
- **Canonical URLs:** Maintain proper canonicalization

---

## 4. Technical Specifications

### 4.1 File Structure

```
lib/
├── seo-config.ts                    # Meta description optimization
├── metadata.ts                      # Metadata utilities
└── structured-data-validator.ts     # Schema validation

components/
├── service-page-template.tsx         # Service schema + internal links
├── blog-post-schema.tsx             # HowTo + Article schema
├── home-structured-data.tsx          # Review aggregation
├── suburb-page-template.tsx         # Enhanced LocalBusiness schema
└── internal-linking.tsx             # NEW: Reusable internal linking component

app/
├── sitemap.ts                       # Sitemap optimizations
└── [various pages]                  # Breadcrumbs, FAQ schema
```

### 4.2 Schema Implementation

#### Service Schema Template
```typescript
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Deep Cleaning Service",
  "description": "Professional deep cleaning service...",
  "serviceType": "Home Cleaning Service",
  "provider": {
    "@type": "LocalBusiness",
    "name": "Shalean Cleaning Services",
    "@id": "https://shalean.co.za/#organization"
  },
  "areaServed": [
    {
      "@type": "City",
      "name": "Cape Town"
    }
  ],
  "offers": {
    "@type": "Offer",
    "priceRange": "R200-R1500",
    "availability": "https://schema.org/InStock",
    "priceCurrency": "ZAR"
  }
};
```

#### HowTo Schema Template
```typescript
const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Deep Clean Your Kitchen",
  "description": "Step-by-step guide...",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Prepare cleaning supplies",
      "text": "Gather all necessary cleaning supplies..."
    }
  ],
  "totalTime": "PT2H",
  "tool": ["Cleaning supplies", "Microfiber cloths"]
};
```

### 4.3 Internal Linking Component

```typescript
// components/internal-linking.tsx
interface InternalLinkProps {
  type: 'service' | 'location' | 'blog';
  currentPage: string;
  limit?: number;
}

export function InternalLinking({ type, currentPage, limit = 3 }: InternalLinkProps) {
  // Logic to fetch and display related links
}
```

---

## 5. Implementation Plan

### Phase 1: High Priority (Weeks 1-2)
1. **Service Schema Markup** (FR-1)
   - Add Service schema to all service pages
   - Validate in Google Rich Results Test
   - Deploy and monitor

2. **FAQ Schema Expansion** (FR-4)
   - Add FAQ schema to service pages
   - Add FAQ schema to About page
   - Validate and deploy

3. **Enhanced Internal Linking** (FR-2)
   - Create internal linking component
   - Add related services to service pages
   - Add related locations to suburb pages
   - Add contextual links to blog posts

### Phase 2: Medium Priority (Weeks 3-4)
4. **Breadcrumb Navigation** (FR-5)
   - Implement breadcrumb component
   - Add to all target pages
   - Add BreadcrumbList schema

5. **Review Aggregation** (FR-6)
   - Enhance AggregateRating schema
   - Add Review schema for testimonials
   - Validate and deploy

6. **Enhanced LocalBusiness Schema** (FR-7)
   - Add geo coordinates
   - Improve service area definitions
   - Add accurate opening hours

### Phase 3: Low Priority (Weeks 5-6)
7. **HowTo Schema** (FR-3)
   - Identify guide-type blog posts
   - Add HowTo schema
   - Validate and deploy

8. **Article Schema Enhancement** (FR-8)
   - Add additional fields to BlogPosting schema
   - Validate and deploy

9. **Meta Description Optimization**
   - Review all meta descriptions
   - Optimize for CTR
   - Ensure uniqueness

### Phase 4: Optimization & Monitoring (Week 7+)
10. **Sitemap Optimization**
    - Update lastModified dates
    - Optimize priorities
    - Monitor indexing

11. **Performance Monitoring**
    - Monitor Core Web Vitals
    - Track rich snippet appearances
    - Monitor search rankings

---

## 6. Testing & Validation

### 6.1 Schema Validation
- **Tool:** Google Rich Results Test (https://search.google.com/test/rich-results)
- **Criteria:** All schemas must pass validation
- **Frequency:** Before deployment and after each change

### 6.2 SEO Testing Checklist
- [ ] All structured data validates without errors
- [ ] No duplicate schemas on pages
- [ ] Canonical URLs are correct
- [ ] Meta descriptions are unique and optimized
- [ ] Internal links are working and relevant
- [ ] Breadcrumbs display correctly
- [ ] Page load times maintained or improved
- [ ] Mobile responsiveness verified

### 6.3 Search Console Monitoring
- Monitor rich snippet appearances
- Track indexing status
- Monitor search performance metrics
- Check for any errors or warnings

---

## 7. Success Metrics & KPIs

### Primary Metrics
1. **Rich Snippet Appearances**
   - Target: 80% of service pages showing rich snippets within 3 months
   - Measurement: Google Search Console

2. **Organic Traffic**
   - Target: 30% increase within 6 months
   - Measurement: Google Analytics

3. **Click-Through Rate (CTR)**
   - Target: 15% improvement
   - Baseline: Current CTR from search results
   - Measurement: Google Search Console

4. **Local Rankings**
   - Target: Top 3 positions for 10+ location keywords
   - Measurement: Google Search Console, manual checks

### Secondary Metrics
- **Page Speed:** Maintain Core Web Vitals scores
- **Indexing:** All pages indexed within 1 week
- **Schema Errors:** Zero validation errors
- **Internal Link Clicks:** Track via analytics

---

## 8. Dependencies

### Technical Dependencies
- Next.js framework (already in use)
- Structured data validator (`lib/structured-data-validator.ts`)
- SEO config system (`lib/seo-config.ts`)
- Metadata utilities (`lib/metadata.ts`)

### Content Dependencies
- FAQ content for service pages
- Related service/location mappings
- Testimonial/review data

### External Dependencies
- Google Search Console access
- Google Analytics access
- Access to review/testimonial data

---

## 9. Risks & Mitigation

### Risk 1: Schema Validation Errors
- **Impact:** High - Rich snippets won't appear
- **Probability:** Medium
- **Mitigation:** 
  - Use structured data validator before deployment
  - Test in Google Rich Results Test
  - Monitor Search Console for errors

### Risk 2: Performance Impact
- **Impact:** Medium - Could affect page load times
- **Probability:** Low
- **Mitigation:**
  - Lazy load schema scripts where possible
  - Monitor Core Web Vitals
  - Optimize schema size

### Risk 3: Over-Optimization
- **Impact:** Low - Could trigger spam filters
- **Probability:** Low
- **Mitigation:**
  - Follow Google guidelines
  - Natural content integration
  - Avoid keyword stuffing

### Risk 4: Maintenance Overhead
- **Impact:** Medium - Ongoing maintenance required
- **Probability:** Medium
- **Mitigation:**
  - Create reusable components
  - Document all changes
  - Establish monitoring processes

---

## 10. Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1 | Weeks 1-2 | Service Schema, FAQ Schema, Internal Linking |
| Phase 2 | Weeks 3-4 | Breadcrumbs, Review Schema, LocalBusiness Enhancement |
| Phase 3 | Weeks 5-6 | HowTo Schema, Article Enhancement, Meta Optimization |
| Phase 4 | Week 7+ | Monitoring, Optimization, Iteration |

**Total Estimated Duration:** 6-8 weeks for full implementation

---

## 11. Approval & Sign-off

### Stakeholders
- **Product Owner:** [Name]
- **Technical Lead:** [Name]
- **SEO Specialist:** [Name]
- **Development Team:** [Names]

### Sign-off
- [ ] Product Owner Approval
- [ ] Technical Lead Approval
- [ ] SEO Specialist Approval
- [ ] Development Team Ready

---

## 12. Appendix

### A. Schema Examples
See Technical Specifications section for detailed schema templates.

### B. Reference Links
- [Google Structured Data Guidelines](https://developers.google.com/search/docs/guides/intro-structured-data)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Documentation](https://schema.org/)

### C. Related Documents
- SEO Optimization Plan (`.cursor/plans/`)
- Current SEO Config (`lib/seo-config.ts`)
- Structured Data Validator (`lib/structured-data-validator.ts`)

---

## Document History

| Version | Date | Author | Changes |
|--------|------|--------|---------|
| 1.0 | 2024 | Development Team | Initial PRD creation |

---

**Next Steps:**
1. Review and approve PRD
2. Assign development resources
3. Begin Phase 1 implementation
4. Set up monitoring and tracking

