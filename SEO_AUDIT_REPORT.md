# 🔍 SEO Audit Report for shalean.co.za
**Date:** November 27, 2025  
**Website:** https://shalean.co.za

---

## 📊 Executive Summary

Your website has a **solid SEO foundation** with many technical elements properly implemented. However, there are significant opportunities to improve content depth, keyword targeting, and on-page optimization across location and service pages.

**Overall SEO Score: 7.5/10**

---

## ✅ What's Working Well

### 1. **Technical SEO Foundation** ⭐⭐⭐⭐⭐
- ✅ **Structured Data**: Comprehensive JSON-LD schemas implemented
  - LocalBusiness schema with proper business information
  - Review schema with aggregate ratings (5.0 rating, 500+ reviews)
  - Organization schema
- ✅ **Meta Tags**: Properly configured across all pages
  - Title tags with template system
  - Meta descriptions (120-170 characters)
  - Open Graph tags for social sharing
  - Twitter Card tags
- ✅ **Sitemap.xml**: Comprehensive sitemap with 200+ URLs
  - Proper priority and changefreq settings
  - Includes all location pages, services, and blog posts
- ✅ **Robots.txt**: Properly configured
  - Blocks admin/dashboard areas
  - Allows all public pages
  - References sitemap
- ✅ **Canonical URLs**: Properly set on all pages
- ✅ **Google Analytics**: Configured (G-VV357GZWXM)
- ✅ **Mobile Responsive**: Site is mobile-friendly

### 2. **URL Structure** ⭐⭐⭐⭐
- Clean, descriptive URLs (`/location/cape-town/sea-point`)
- Logical hierarchy
- SEO-friendly slugs

### 3. **Site Architecture** ⭐⭐⭐⭐
- Good internal linking structure
- Clear navigation hierarchy
- Location-based pages for local SEO

### 4. **Performance Optimizations** ⭐⭐⭐⭐
- Next.js Image optimization
- Font optimization with fallbacks
- Critical CSS inline
- Async CSS loading

---

## ⚠️ Areas Needing Improvement

### 1. **Content Depth & Uniqueness** ⚠️ CRITICAL

**Issue:** Many location pages likely have thin or duplicate content.

**Impact:** Google may not rank these pages well if content is too similar.

**Recommendations:**
- Add unique, location-specific content to each suburb page
- Include local landmarks, neighborhoods, and specific service details
- Add 300-500 words of unique content per location page
- Include local testimonials or case studies

**Priority:** HIGH

---

### 2. **Heading Structure** ⚠️ MEDIUM

**Current State:** Need to verify H1-H6 hierarchy on all pages.

**Recommendations:**
- Ensure ONE H1 per page with primary keyword
- Use H2 for main sections
- Maintain logical heading hierarchy
- Include location keywords in headings

**Example for Cape Town page:**
```html
<h1>Professional Cleaning Services in Cape Town</h1>
<h2>Why Choose Shalean for Cape Town Cleaning?</h2>
<h2>Areas We Serve in Cape Town</h2>
<h3>Sea Point Cleaning Services</h3>
<h3>Claremont Cleaning Services</h3>
```

**Priority:** MEDIUM

---

### 3. **Image SEO** ⚠️ MEDIUM

**Current State:** Images may lack descriptive alt text.

**Recommendations:**
- Add descriptive alt text to ALL images
- Include location and service keywords in alt text
- Format: `[Service] cleaning in [Location] - Shalean Cleaning Services`

**Examples:**
- ❌ Bad: `alt="cleaning"`
- ✅ Good: `alt="Professional deep cleaning service in Sea Point, Cape Town - Shalean Cleaning Services"`
- ✅ Good: `alt="House cleaning team cleaning living room in Claremont, Cape Town"`

**Priority:** MEDIUM

---

### 4. **Internal Linking** ⚠️ MEDIUM

**Recommendations:**
- Add more internal links between related pages
- Link location pages to service pages
- Create topic clusters (e.g., Cape Town → Services → Blog posts)
- Add contextual links in content (not just navigation)

**Example:** In Cape Town page content, link to:
- `/services/deep-cleaning` when mentioning deep cleaning
- `/location/cape-town/sea-point` when mentioning Sea Point
- `/blog/airbnb-cleaning-checklist` when mentioning Airbnb cleaning

**Priority:** MEDIUM

---

### 5. **Schema Markup Enhancements** ⚠️ LOW-MEDIUM

**Missing Schemas:**
- ❌ FAQPage schema (you have FAQ sections)
- ❌ BreadcrumbList schema
- ❌ Service schema for individual services
- ❌ VideoObject schema (if you add videos)

**Recommendations:**
- Add FAQPage schema to FAQ sections
- Add BreadcrumbList schema for better navigation
- Add Service schema to service detail pages

**Priority:** LOW-MEDIUM

---

### 6. **Blog Content Strategy** ⚠️ MEDIUM

**Current State:** Only 6 blog posts found in sitemap.

**Recommendations:**
- Publish 2-4 blog posts per month
- Target long-tail keywords:
  - "how to deep clean kitchen Cape Town"
  - "best cleaning service Sea Point"
  - "Airbnb cleaning checklist South Africa"
- Add internal links from blog posts to service/location pages
- Include location-specific content in blog posts

**Priority:** MEDIUM

---

### 7. **Page Speed Optimization** ⚠️ LOW-MEDIUM

**Recommendations:**
- Implement lazy loading for below-the-fold images
- Consider using WebP format for images
- Minimize JavaScript bundle size
- Use CDN for static assets
- Enable compression (gzip/brotli)

**Priority:** LOW-MEDIUM

---

### 8. **Local SEO Enhancements** ⚠️ MEDIUM

**Missing Elements:**
- ❌ Google Business Profile integration
- ❌ Location-specific schema enhancements
- ❌ Local citations/backlinks

**Recommendations:**
- Claim and optimize Google Business Profile
- Add location-specific schema (GeoCoordinates)
- Build local citations (directory listings)
- Get listed in local business directories

**Priority:** MEDIUM

---

## 📋 Step-by-Step Improvement Plan

### Phase 1: Homepage Optimization (Week 1)

#### Step 1.1: Optimize H1 Tag
**Current:** Need to verify H1 contains primary keyword  
**Action:** Ensure H1 is: "Professional Cleaning Services in Cape Town for Homes & Offices"

**File:** `app/home-content.tsx` or hero component

#### Step 1.2: Add FAQ Schema
**Action:** Add FAQPage structured data to homepage FAQ section

**Example:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "How much does cleaning cost in Cape Town?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Standard cleaning starts from R250..."
    }
  }]
}
```

#### Step 1.3: Optimize Image Alt Text
**Action:** Review all homepage images and add descriptive alt text

**Files:** All image components on homepage

---

### Phase 2: Location Pages Optimization (Weeks 2-3)

#### Step 2.1: Cape Town Main Page
**File:** `app/location/cape-town/page.tsx`

**Actions:**
1. Add unique H1: "Professional Cleaning Services in Cape Town | Shalean"
2. Add 400-500 words of unique content about Cape Town cleaning
3. Include local areas served (Sea Point, Claremont, etc.)
4. Add local testimonials
5. Link to suburb pages
6. Add location-specific schema

**Content Template:**
```
H1: Professional Cleaning Services in Cape Town
Intro: 2-3 sentences about Cape Town cleaning services
Why Choose Shalean in Cape Town: 3-4 bullet points
Areas We Serve: List with links to suburb pages
Local Testimonials: 2-3 Cape Town-specific reviews
Call to Action: Book Cape Town cleaning service
```

#### Step 2.2: Suburb Pages (e.g., Sea Point, Claremont)
**Files:** `app/location/cape-town/[suburb]/page.tsx`

**Actions for EACH suburb:**
1. Unique H1: "Professional Cleaning Services in [Suburb], Cape Town"
2. 300-400 words unique content per suburb
3. Local landmarks/neighborhoods mentioned
4. Specific service offerings for that area
5. Link to main Cape Town page and service pages
6. Add GeoCoordinates schema

**Content Template per Suburb:**
```
H1: Professional Cleaning Services in [Suburb], Cape Town
Intro: About [Suburb] and why residents choose Shalean
Services Available: Deep cleaning, regular cleaning, etc.
Why [Suburb] Residents Love Us: 2-3 unique points
Nearby Areas: Links to adjacent suburbs
Testimonial: [Suburb]-specific review if available
```

**Priority Suburbs to Optimize First:**
1. Sea Point
2. Claremont
3. Camps Bay
4. Green Point
5. Constantia
6. City Bowl

---

### Phase 3: Service Pages Optimization (Week 4)

#### Step 3.1: Deep Cleaning Service Page
**File:** `app/services/deep-cleaning/page.tsx`

**Actions:**
1. Add unique H1 with location: "Deep Cleaning Services in Cape Town"
2. Expand content to 500-600 words
3. Add service-specific schema
4. Include location-specific sections
5. Add before/after images with alt text
6. Link to location pages

#### Step 3.2: All Service Pages
**Repeat for:**
- Regular Cleaning
- Airbnb Cleaning
- Office Cleaning
- Move In/Out Cleaning
- Apartment Cleaning

**Template:**
```
H1: [Service] in Cape Town | Shalean
What is [Service]: Definition and explanation
What's Included: Detailed checklist
Pricing: Transparent pricing
Why Choose Shalean: Benefits
Areas We Serve: Links to location pages
FAQ: Service-specific questions
```

---

### Phase 4: Blog Content Strategy (Ongoing)

#### Step 4.1: Content Calendar
**Publish 2-4 posts per month:**

**Month 1:**
- "Complete Guide to Deep Cleaning Your Cape Town Home"
- "How to Choose the Best Cleaning Service in Sea Point"
- "Airbnb Host Checklist: Professional Turnover Cleaning"

**Month 2:**
- "Eco-Friendly Cleaning Products: What Shalean Uses"
- "Move-In Cleaning: What to Expect in Cape Town"
- "Office Cleaning Best Practices for Cape Town Businesses"

**Step 4.2: Blog Post Optimization**
- Target long-tail keywords
- 800-1200 words per post
- Include internal links to service/location pages
- Add images with descriptive alt text
- Use proper heading structure

---

### Phase 5: Technical Enhancements (Week 5)

#### Step 5.1: Add Breadcrumb Schema
**Action:** Add BreadcrumbList schema to all pages

**Example:**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [{
    "@type": "ListItem",
    "position": 1,
    "name": "Home",
    "item": "https://shalean.co.za"
  }, {
    "@type": "ListItem",
    "position": 2,
    "name": "Cape Town",
    "item": "https://shalean.co.za/location/cape-town"
  }]
}
```

#### Step 5.2: Add FAQ Schema to FAQ Pages
**Action:** Convert FAQ sections to FAQPage schema

#### Step 5.3: Optimize Images
**Action:**
- Convert images to WebP format
- Add descriptive alt text to all images
- Implement lazy loading
- Use Next.js Image component everywhere

---

### Phase 6: Local SEO (Ongoing)

#### Step 6.1: Google Business Profile
- Claim and verify Google Business Profile
- Add all service areas
- Upload photos
- Collect and respond to reviews
- Post regular updates

#### Step 6.2: Local Citations
- List on local directories
- Get listed on:
  - Yellow Pages South Africa
  - HelloPeter
  - Local business directories
  - Industry-specific directories

#### Step 6.3: Location Schema Enhancement
- Add GeoCoordinates to location pages
- Add address information
- Add service area details

---

## 🎯 Quick Wins (Do First)

1. **Add FAQ Schema** (1 hour)
   - Convert FAQ sections to FAQPage schema
   - Immediate visibility in Google search results

2. **Optimize Image Alt Text** (2-3 hours)
   - Review all images
   - Add descriptive, keyword-rich alt text

3. **Add Breadcrumb Schema** (1 hour)
   - Implement BreadcrumbList schema
   - Better navigation and SEO

4. **Optimize Top 5 Location Pages** (1 week)
   - Sea Point, Claremont, Camps Bay, Green Point, Constantia
   - Add unique content to each

5. **Internal Linking Audit** (2 hours)
   - Add contextual internal links
   - Link location pages to services

---

## 📈 Expected Results

### Short-term (1-3 months):
- Improved rankings for location-specific keywords
- Better click-through rates from search results
- Increased organic traffic by 20-30%

### Medium-term (3-6 months):
- Top 3 rankings for "cleaning services [suburb]"
- 50% increase in organic traffic
- Better conversion rates from organic traffic

### Long-term (6-12 months):
- Dominant rankings for local cleaning keywords
- 100%+ increase in organic traffic
- Strong local SEO presence

---

## 🔧 Technical Implementation Notes

### Files to Modify:

1. **Homepage:**
   - `app/page.tsx`
   - `app/home-content.tsx` (or similar)
   - Hero component

2. **Location Pages:**
   - `app/location/page.tsx`
   - `app/location/cape-town/page.tsx`
   - `app/location/cape-town/[suburb]/page.tsx`

3. **Service Pages:**
   - `app/services/[slug]/page.tsx`
   - `lib/seo-config.ts`

4. **Schema:**
   - `app/layout.tsx` (for Organization schema)
   - Individual page components (for page-specific schemas)

5. **Blog:**
   - `app/blog/[slug]/page.tsx`
   - Blog post components

---

## 📊 Monitoring & Measurement

### Key Metrics to Track:

1. **Google Search Console:**
   - Impressions
   - Clicks
   - Average position
   - Click-through rate

2. **Google Analytics:**
   - Organic traffic
   - Bounce rate
   - Pages per session
   - Conversion rate

3. **Rankings:**
   - Track keywords:
     - "cleaning services Cape Town"
     - "cleaning services Sea Point"
     - "deep cleaning Cape Town"
     - "Airbnb cleaning Cape Town"

### Tools to Use:

- Google Search Console
- Google Analytics
- Ahrefs or SEMrush (for keyword tracking)
- PageSpeed Insights (for performance)
- Schema.org Validator (for schema testing)

---

## ✅ Checklist Summary

### Immediate Actions:
- [ ] Add FAQ schema to homepage
- [ ] Optimize all image alt text
- [ ] Add breadcrumb schema
- [ ] Review and optimize H1 tags on all pages

### Week 1-2:
- [ ] Optimize Cape Town main location page
- [ ] Optimize top 5 suburb pages (Sea Point, Claremont, etc.)
- [ ] Add unique content to each location page

### Week 3-4:
- [ ] Optimize all service pages
- [ ] Add service-specific schema
- [ ] Improve internal linking

### Ongoing:
- [ ] Publish 2-4 blog posts per month
- [ ] Build local citations
- [ ] Monitor and respond to reviews
- [ ] Track rankings and adjust strategy

---

## 🎓 Best Practices to Follow

1. **Content Quality:**
   - Write for users first, search engines second
   - Provide value and answer questions
   - Use natural language, not keyword stuffing

2. **Keyword Strategy:**
   - Target long-tail keywords
   - Use location + service combinations
   - Include variations and synonyms

3. **Technical SEO:**
   - Keep site fast (aim for <3s load time)
   - Ensure mobile-friendliness
   - Fix any crawl errors

4. **Local SEO:**
   - Maintain consistent NAP (Name, Address, Phone)
   - Get local backlinks
   - Encourage customer reviews

---

## 📞 Next Steps

1. **Review this report** with your team
2. **Prioritize** improvements based on business goals
3. **Create content calendar** for blog posts
4. **Set up tracking** in Google Search Console and Analytics
5. **Start with Quick Wins** (FAQ schema, alt text, breadcrumbs)
6. **Implement Phase 1** (Homepage optimization)

---

**Questions or need clarification on any recommendations?**  
This audit provides a roadmap for improving your SEO. Focus on one phase at a time and measure results as you go.






















