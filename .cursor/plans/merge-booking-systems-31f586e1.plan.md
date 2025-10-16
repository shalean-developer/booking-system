<!-- 31f586e1-e567-4e37-92d7-d0ab81156ad1 11078ce3-3432-417a-b812-6472a72e416e -->
# Build All Missing Pages (16 Total)

## Overview

Create comprehensive pages for all links currently returning 404 errors, ensuring consistent branding, proper SEO, and mobile responsiveness.

## Page Categories & Implementation

### Category 1: Navigation Pages (5 pages)

**1. `/services` - Main Services Listing**

- Overview of all cleaning services
- Grid layout with service cards (Standard, Deep, Moving, Airbnb)
- Each card links to detailed service pages
- CTA to booking flow
- SEO optimized with service keywords

**2. `/location` - Service Areas**

- Map or list of service coverage areas
- Service area descriptions
- Contact information by region
- CTA to check availability/book

**3. `/how-it-works` - Process Explanation**

- Step-by-step booking process
- What to expect timeline
- FAQ section
- Trust indicators (insured, bonded, satisfaction guarantee)
- CTA to start booking

**4. `/login` - Login Page**

- Login form for returning customers
- Option to register/sign up
- Password recovery link
- Social login options (optional)
- Redirect to dashboard after login

**5. `/booking/success` - Booking Confirmation**

- Success message with booking details
- Next steps information
- Download/email receipt option
- Return to home CTA

### Category 2: Blog Pages (4 pages)

**6. `/blog` - Main Blog Listing**

- Grid of blog posts with featured images
- Categories/tags filter
- Search functionality
- Pagination
- Recent posts sidebar

**7. `/blog/deep-cleaning-tips`**

- Article: "10 Essential Deep Cleaning Tips for Every Home"
- Professional cleaning techniques
- Product recommendations
- Before/after scenarios
- CTA to book deep cleaning

**8. `/blog/eco-friendly-products`**

- Article: "The Benefits of Eco-Friendly Cleaning Products"
- Health and environmental benefits
- Product comparisons
- Shalean's eco-friendly approach
- CTA to book

**9. `/blog/airbnb-cleaning-checklist`**

- Article: "Complete Airbnb Turnover Cleaning Checklist"
- Room-by-room checklist
- Time-saving tips
- Quality standards for 5-star reviews
- CTA to book Airbnb cleaning

### Category 3: Company Pages (4 pages)

**10. `/about` - About Us**

- Company story and mission
- Values and commitment
- Years of experience
- Service statistics
- Team photo/introduction
- CTA to learn more or book

**11. `/team` - Team Page**

- Team member profiles with photos
- Expertise and certifications
- Customer testimonials
- Join our team CTA

**12. `/contact` - Contact Page**

- Contact form (name, email, phone, message)
- Business hours
- Phone number, email
- Office address (if applicable)
- Social media links
- Response time expectation

**13. `/careers` - Careers Page**

- Open positions
- Why work with Shalean
- Benefits and perks
- Company culture
- Application process
- Apply now CTA/form

### Category 4: Legal Pages (3 pages)

**14. `/terms` - Terms & Conditions**

- Service terms
- Booking policies
- Payment terms
- Liability limitations
- User responsibilities
- Effective date

**15. `/privacy` - Privacy Policy**

- Data collection practices
- How data is used
- Data security measures
- Cookie policy
- User rights (GDPR/POPIA compliant)
- Contact for privacy concerns

**16. `/cancellation` - Cancellation Policy**

- Cancellation timeframes
- Refund policy
- Rescheduling options
- No-show policy
- Emergency cancellations
- How to cancel (steps/contact)

## Design Principles

All pages will follow:

- Consistent Shalean branding (primary colors, fonts)
- Shadcn UI components
- Mobile-first responsive design
- SEO optimization (meta tags, structured data)
- Fast loading times
- Accessibility standards
- Clear CTAs on every page

## Implementation Approach

1. Create page structure with proper Next.js app router conventions
2. Use existing components (Header, Footer, Button, Card, etc.)
3. Add proper metadata for SEO
4. Ensure mobile responsiveness
5. Add internal linking between related pages
6. Include CTAs to booking flow where appropriate

## File Structure

```
app/
├── services/
│   └── page.tsx (new)
├── location/
│   └── page.tsx (new)
├── how-it-works/
│   └── page.tsx (new)
├── login/
│   └── page.tsx (new)
├── booking/
│   └── success/
│       └── page.tsx (new)
├── blog/
│   ├── page.tsx (new)
│   ├── deep-cleaning-tips/
│   │   └── page.tsx (new)
│   ├── eco-friendly-products/
│   │   └── page.tsx (new)
│   └── airbnb-cleaning-checklist/
│       └── page.tsx (new)
├── about/
│   └── page.tsx (new)
├── team/
│   └── page.tsx (new)
├── contact/
│   └── page.tsx (new)
├── careers/
│   └── page.tsx (new)
├── terms/
│   └── page.tsx (new)
├── privacy/
│   └── page.tsx (new)
└── cancellation/
    └── page.tsx (new)
```

## Testing

- Verify all links work (no 404s)
- Test mobile responsiveness
- Check SEO meta tags
- Validate forms work properly
- Test navigation flow
- Build succeeds without errors

### To-dos

- [ ] Build 5 navigation pages (services, location, how-it-works, login, booking/success)
- [ ] Build 4 blog pages (main blog + 3 articles)
- [ ] Build 4 company pages (about, team, contact, careers)
- [ ] Build 3 legal pages (terms, privacy, cancellation)
- [ ] Test all pages, verify no 404s, run build