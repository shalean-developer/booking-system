# 📸 Image Naming Guide - Hero to Footer

## 📁 Directory Structure

All images should be placed in: `public/images/`

## 🎯 Naming Convention

Use **kebab-case** (lowercase with hyphens) and be descriptive:

**Format**: `{section}-{description}.{extension}`

**Examples**:
- `hero-background.jpg`
- `hero-cleaning-team.jpg`
- `service-standard-cleaning.jpg`
- `footer-logo.png`

---

## 🖼️ Section-by-Section Image Names

### 1. **Hero Section** (`components/home-hero.tsx`)
```
hero-background.jpg          # Main hero background image
hero-background.webp         # Optimized version (optional)
```
**Current**: Using Unsplash URL
**Recommended Size**: 1920x1080px (16:9) or 1200x800px
**Format**: JPG or WebP

---

### 2. **Popular Projects Section** (`components/home-popular-projects.tsx`)
**Note**: These are fetched from database `image_url` field, but you can also use local images:

```
service-standard-cleaning.jpg     # Standard Cleaning service
service-deep-cleaning.jpg         # Deep Cleaning service
service-airbnb-cleaning.jpg       # Airbnb Cleaning service
service-move-in-out-cleaning.jpg  # Move In/Out Cleaning service
service-carpet-cleaning.jpg       # Carpet Cleaning service
```
**Recommended Size**: 800x600px (4:3 aspect ratio)
**Format**: JPG or WebP

---

### 3. **Everyday Life Section** (`components/home-everyday-life.tsx`)
```
everyday-life-hero.jpg
everyday-life-cleaning.jpg
```
**Current**: Using Unsplash URL
**Recommended Size**: 1200x800px
**Format**: JPG or WebP

---

### 4. **Featured Taskers/Cleaners** (`components/home-featured-taskers.tsx`)
```
team-featured-1.jpg
team-featured-2.jpg
team-featured-3.jpg
```
**Or use specific names**:
```
team-normatter.jpg
team-lucia.jpg
team-nyasha.jpg
```
**Recommended Size**: 400x400px (square)
**Format**: JPG, PNG, or WebP

---

### 5. **Go To Team Section** (`components/home-go-to-team.tsx`)
```
team-section-background.jpg
team-group-photo.jpg
```
**Current**: Using Unsplash URL
**Recommended Size**: 1200x800px
**Format**: JPG or WebP

---

### 6. **Guides Section** (`components/home-guides.tsx`)
```
guide-deep-cleaning.jpg
guide-airbnb-checklist.jpg
guide-home-maintenance.jpg
```
**Recommended Size**: 600x400px
**Format**: JPG or WebP

---

### 7. **Mobile App Section** (`components/home-mobile-app.tsx`)
```
mobile-app-screenshot.jpg
mobile-app-hero.jpg
app-store-badge.svg          # Already exists
google-play-badge.svg        # Already exists
```
**Recommended Size**: 800x600px
**Format**: JPG or WebP (SVG for badges)

---

### 8. **Reviews Showcase** (`components/home-reviews-showcase.tsx`)
```
review-customer-1.jpg
review-customer-2.jpg
review-customer-3.jpg
```
**Recommended Size**: 200x200px (square thumbnails)
**Format**: JPG or WebP

---

### 9. **Cities Section** (`components/home-cities.tsx`)
```
city-cape-town.jpg
city-johannesburg.jpg
city-pretoria.jpg
city-durban.jpg
```
**Recommended Size**: 800x600px
**Format**: JPG or WebP

---

### 10. **Ready to Start Section** (`components/home-ready-to-start.tsx`)
```
cta-background.jpg
cta-hero-image.jpg
```
**Recommended Size**: 1200x600px
**Format**: JPG or WebP

---

### 11. **Footer** (`components/home-footer.tsx`)
```
footer-logo.png              # Logo (if different from main logo)
footer-background.jpg        # Footer background (optional)
social-facebook.svg          # Social media icons
social-instagram.svg
social-twitter.svg
social-linkedin.svg
```
**Recommended Size**: 
- Logo: 200x60px
- Social icons: 24x24px (SVG preferred)
**Format**: PNG for logo, SVG for icons

---

## 📋 Complete File Structure

```
public/
├── images/
│   ├── hero/
│   │   ├── hero-background.jpg
│   │   └── hero-cleaning-team.jpg
│   ├── services/
│   │   ├── service-standard-cleaning.jpg
│   │   ├── service-deep-cleaning.jpg
│   │   ├── service-airbnb-cleaning.jpg
│   │   ├── service-move-in-out-cleaning.jpg
│   │   └── service-carpet-cleaning.jpg
│   ├── team/
│   │   ├── team-normatter.jpg
│   │   ├── team-lucia.jpg
│   │   └── team-nyasha.jpg
│   ├── guides/
│   │   ├── guide-deep-cleaning.jpg
│   │   └── guide-airbnb-checklist.jpg
│   ├── mobile/
│   │   └── mobile-app-screenshot.jpg
│   ├── cities/
│   │   ├── city-cape-town.jpg
│   │   ├── city-johannesburg.jpg
│   │   ├── city-pretoria.jpg
│   │   └── city-durban.jpg
│   ├── footer/
│   │   ├── footer-logo.png
│   │   └── social-*.svg
│   └── blog/              # Blog post images
│       └── (blog-post-slug).jpg
```

---

## ✅ Best Practices

1. **Use descriptive names**: `service-standard-cleaning.jpg` not `img1.jpg`
2. **Use kebab-case**: lowercase with hyphens
3. **Include section prefix**: `hero-`, `service-`, `team-`, `footer-`
4. **Keep it short**: Max 50 characters
5. **Use appropriate extensions**: `.jpg` for photos, `.png` for logos, `.svg` for icons
6. **Optimize file sizes**: 
   - Hero images: < 300KB
   - Service images: < 200KB
   - Team photos: < 100KB
   - Icons: < 10KB

---

## 🔧 How to Update Database Image URLs

If you upload images locally, update the `services` table in Supabase:

```sql
UPDATE services 
SET image_url = '/images/service-standard-cleaning.jpg'
WHERE service_type = 'Standard';

UPDATE services 
SET image_url = '/images/service-deep-cleaning.jpg'
WHERE service_type = 'Deep';

UPDATE services 
SET image_url = '/images/service-airbnb-cleaning.jpg'
WHERE service_type = 'Airbnb';

UPDATE services 
SET image_url = '/images/service-move-in-out-cleaning.jpg'
WHERE service_type = 'Move In/Out';

UPDATE services 
SET image_url = '/images/service-carpet-cleaning.jpg'
WHERE service_type = 'Carpet';
```

---

## 📝 Quick Reference

| Section | Prefix | Example |
|---------|--------|---------|
| Hero | `hero-` | `hero-background.jpg` |
| Services | `service-` | `service-standard-cleaning.jpg` |
| Team | `team-` | `team-normatter.jpg` |
| Guides | `guide-` | `guide-deep-cleaning.jpg` |
| Mobile App | `mobile-` | `mobile-app-screenshot.jpg` |
| Cities | `city-` | `city-cape-town.jpg` |
| Footer | `footer-` | `footer-logo.png` |
| Social Icons | `social-` | `social-facebook.svg` |

---

## 🎨 Image Optimization Tips

1. **Compress images** before uploading (use tools like TinyPNG, Squoosh)
2. **Use WebP** for better compression (modern browsers)
3. **Provide JPG fallback** for older browsers
4. **Use Next.js Image component** for automatic optimization
5. **Set proper alt text** for accessibility

