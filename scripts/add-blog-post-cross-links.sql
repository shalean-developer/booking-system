-- =====================================================
-- ADD CROSS-LINKS BETWEEN BLOG POSTS
-- Run this in Supabase SQL Editor
-- =====================================================
-- This script adds natural contextual links between all 4 published blog posts
-- Links are added within the HTML content where topics naturally overlap

-- 1. Update "deep-cleaning-cape-town" post
-- Add links to: eco-friendly products (where cleaning products mentioned), 
--               other deep cleaning post, Airbnb checklist (thorough cleaning)
UPDATE blog_posts
SET content = REPLACE(
  content,
  'rely on the right tools so every surface feels fresh again.',
  'rely on the right tools so every surface feels fresh again. For eco-friendly options that are safe for your family, check out our guide to <a href="/blog/the-benefits-of-eco-friendly-cleaning-products" class="text-primary hover:underline font-medium">eco-friendly cleaning products</a>.'
)
WHERE slug = 'deep-cleaning-cape-town';

UPDATE blog_posts
SET content = REPLACE(
  content,
  'Build a kit with all-purpose cleaner, disinfectant wipes, glass cleaner, microfiber cloths, sponges, and scrub brushes.',
  'Build a kit with all-purpose cleaner, disinfectant wipes, glass cleaner, microfiber cloths, sponges, and scrub brushes. Consider using <a href="/blog/the-benefits-of-eco-friendly-cleaning-products" class="text-primary hover:underline font-medium">eco-friendly cleaning products</a> for a safer home environment.'
)
WHERE slug = 'deep-cleaning-cape-town';

UPDATE blog_posts
SET content = REPLACE(
  content,
  'Deep cleaning is a comprehensive approach that targets built-up grime, allergens, and dirt hiding in hard-to-reach areas.',
  'Deep cleaning is a comprehensive approach that targets built-up grime, allergens, and dirt hiding in hard-to-reach areas. For more specific tips, see our <a href="/blog/10-essential-deep-cleaning-tips-for-every-home" class="text-primary hover:underline font-medium">10 essential deep cleaning tips</a>.'
)
WHERE slug = 'deep-cleaning-cape-town';

UPDATE blog_posts
SET content = REPLACE(
  content,
  'Schedule routine tasks like vacuuming, dusting, and wiping counters weekly, then layer in seasonal deep cleans.',
  'Schedule routine tasks like vacuuming, dusting, and wiping counters weekly, then layer in seasonal deep cleans. For Airbnb hosts, our <a href="/blog/complete-airbnb-turnover-cleaning-checklist" class="text-primary hover:underline font-medium">complete Airbnb turnover cleaning checklist</a> provides a thorough framework.'
)
WHERE slug = 'deep-cleaning-cape-town';

-- 2. Update "10-essential-deep-cleaning-tips-for-every-home" post
-- Add links to: eco-friendly products, deep cleaning Cape Town guide, Airbnb checklist
UPDATE blog_posts
SET content = REPLACE(
  content,
  'Build a kit with all-purpose cleaner, disinfectant wipes, glass cleaner, microfiber cloths, sponges, and scrub brushes.',
  'Build a kit with all-purpose cleaner, disinfectant wipes, glass cleaner, microfiber cloths, sponges, and scrub brushes. Learn more about <a href="/blog/the-benefits-of-eco-friendly-cleaning-products" class="text-primary hover:underline font-medium">eco-friendly cleaning products</a> that are safer for your home.'
)
WHERE slug = '10-essential-deep-cleaning-tips-for-every-home';

UPDATE blog_posts
SET content = REPLACE(
  content,
  'Deep cleaning is a comprehensive approach that targets built-up grime, allergens, and dirt hiding in hard-to-reach areas.',
  'Deep cleaning is a comprehensive approach that targets built-up grime, allergens, and dirt hiding in hard-to-reach areas. For Cape Town-specific guidance, see our <a href="/blog/deep-cleaning-cape-town" class="text-primary hover:underline font-medium">complete guide to deep cleaning your home in Cape Town</a>.'
)
WHERE slug = '10-essential-deep-cleaning-tips-for-every-home';

UPDATE blog_posts
SET content = REPLACE(
  content,
  'Schedule routine tasks like vacuuming, dusting, and wiping counters weekly, then layer in seasonal deep cleans.',
  'Schedule routine tasks like vacuuming, dusting, and wiping counters weekly, then layer in seasonal deep cleans. Airbnb hosts can follow our <a href="/blog/complete-airbnb-turnover-cleaning-checklist" class="text-primary hover:underline font-medium">complete Airbnb turnover cleaning checklist</a> for thorough guest-ready cleaning.'
)
WHERE slug = '10-essential-deep-cleaning-tips-for-every-home';

UPDATE blog_posts
SET content = REPLACE(
  content,
  'Select a glass cleaner that cuts through fingerprints and residue without leaving streaks.',
  'Select a glass cleaner that cuts through fingerprints and residue without leaving streaks. Many <a href="/blog/the-benefits-of-eco-friendly-cleaning-products" class="text-primary hover:underline font-medium">eco-friendly cleaning products</a> work just as effectively.'
)
WHERE slug = '10-essential-deep-cleaning-tips-for-every-home';

-- 3. Update "the-benefits-of-eco-friendly-cleaning-products" post
-- Add links to: both deep cleaning posts (where products are used)
UPDATE blog_posts
SET content = REPLACE(
  content,
  'Making the switch to eco-friendly cleaning products isn''t just a trend—it''s a smart choice',
  'Making the switch to eco-friendly cleaning products isn''t just a trend—it''s a smart choice, especially when tackling <a href="/blog/deep-cleaning-cape-town" class="text-primary hover:underline font-medium">deep cleaning tasks</a> or following our <a href="/blog/10-essential-deep-cleaning-tips-for-every-home" class="text-primary hover:underline font-medium">essential deep cleaning tips</a>.'
)
WHERE slug = 'the-benefits-of-eco-friendly-cleaning-products';

UPDATE blog_posts
SET content = REPLACE(
  content,
  'At Shalean, we exclusively use eco-friendly cleaning products to ensure the safety of',
  'At Shalean, we exclusively use eco-friendly cleaning products to ensure the safety of your family and our planet, without compromising on cleanliness. These products are perfect for <a href="/blog/deep-cleaning-cape-town" class="text-primary hover:underline font-medium">deep cleaning projects</a> and <a href="/blog/complete-airbnb-turnover-cleaning-checklist" class="text-primary hover:underline font-medium">Airbnb turnovers</a>.'
)
WHERE slug = 'the-benefits-of-eco-friendly-cleaning-products';

UPDATE blog_posts
SET content = REPLACE(
  content,
  'Modern eco-friendly products are just as effective as traditional cleaners, without the environmental and health downsides.',
  'Modern eco-friendly products are just as effective as traditional cleaners, without the environmental and health downsides. They work excellently for <a href="/blog/10-essential-deep-cleaning-tips-for-every-home" class="text-primary hover:underline font-medium">deep cleaning tasks</a> and maintaining a spotless home.'
)
WHERE slug = 'the-benefits-of-eco-friendly-cleaning-products';

-- 4. Update "complete-airbnb-turnover-cleaning-checklist" post
-- Add links to: deep cleaning posts (thorough cleaning), eco-friendly products
UPDATE blog_posts
SET content = REPLACE(
  content,
  'As an Airbnb host, the cleanliness of your property directly impacts your reviews and bookings.',
  'As an Airbnb host, the cleanliness of your property directly impacts your reviews and bookings. For a truly thorough clean, consider our <a href="/blog/deep-cleaning-cape-town" class="text-primary hover:underline font-medium">deep cleaning guide</a> and <a href="/blog/10-essential-deep-cleaning-tips-for-every-home" class="text-primary hover:underline font-medium">essential deep cleaning tips</a>.'
)
WHERE slug = 'complete-airbnb-turnover-cleaning-checklist';

UPDATE blog_posts
SET content = REPLACE(
  content,
  'Professional Airbnb cleaning services can save you time and ensure consistent 5-star',
  'Professional Airbnb cleaning services can save you time and ensure consistent 5-star cleanliness. We use <a href="/blog/the-benefits-of-eco-friendly-cleaning-products" class="text-primary hover:underline font-medium">eco-friendly cleaning products</a> and follow thorough <a href="/blog/deep-cleaning-cape-town" class="text-primary hover:underline font-medium">deep cleaning protocols</a> to exceed guest expectations.'
)
WHERE slug = 'complete-airbnb-turnover-cleaning-checklist';

UPDATE blog_posts
SET content = REPLACE(
  content,
  'Clean and sanitize all countertops',
  'Clean and sanitize all countertops using <a href="/blog/the-benefits-of-eco-friendly-cleaning-products" class="text-primary hover:underline font-medium">eco-friendly cleaning products</a> for a safer guest experience'
)
WHERE slug = 'complete-airbnb-turnover-cleaning-checklist';

UPDATE blog_posts
SET content = REPLACE(
  content,
  'Scrub and disinfect toilet, sink, and shower/tub',
  'Scrub and disinfect toilet, sink, and shower/tub. For stubborn grime, follow our <a href="/blog/10-essential-deep-cleaning-tips-for-every-home" class="text-primary hover:underline font-medium">deep cleaning tips</a>'
)
WHERE slug = 'complete-airbnb-turnover-cleaning-checklist';

-- Verify updates
SELECT 
  slug,
  title,
  CASE 
    WHEN content LIKE '%/blog/the-benefits-of-eco-friendly-cleaning-products%' THEN 'Has eco-friendly link'
    ELSE 'Missing eco-friendly link'
  END as eco_friendly_link,
  CASE 
    WHEN content LIKE '%/blog/deep-cleaning-cape-town%' THEN 'Has deep cleaning Cape Town link'
    ELSE 'Missing deep cleaning Cape Town link'
  END as deep_cleaning_ct_link,
  CASE 
    WHEN content LIKE '%/blog/10-essential-deep-cleaning-tips-for-every-home%' THEN 'Has deep cleaning tips link'
    ELSE 'Missing deep cleaning tips link'
  END as deep_cleaning_tips_link,
  CASE 
    WHEN content LIKE '%/blog/complete-airbnb-turnover-cleaning-checklist%' THEN 'Has Airbnb checklist link'
    ELSE 'Missing Airbnb checklist link'
  END as airbnb_link
FROM blog_posts
WHERE slug IN (
  'deep-cleaning-cape-town',
  '10-essential-deep-cleaning-tips-for-every-home',
  'the-benefits-of-eco-friendly-cleaning-products',
  'complete-airbnb-turnover-cleaning-checklist'
)
ORDER BY slug;

