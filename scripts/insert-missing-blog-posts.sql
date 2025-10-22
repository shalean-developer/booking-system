-- Insert missing blog posts to fix 404 errors
-- This script creates 2 blog posts: airbnb-cleaning-checklist and eco-friendly-products

-- First, ensure we have a cleaning tips category
INSERT INTO blog_categories (id, name, slug, description, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Cleaning Tips',
  'cleaning-tips',
  'Expert cleaning advice and practical tips for maintaining a spotless home',
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Note: Using NULL author_id since auth.users is managed by Supabase Auth
-- Blog posts will show "Shalean Cleaning Services" as author in the frontend

-- Insert Airbnb Cleaning Checklist post
INSERT INTO blog_posts (
  id,
  title,
  slug,
  content,
  excerpt,
  featured_image,
  featured_image_alt,
  category_id,
  author_id,
  status,
  meta_title,
  meta_description,
  read_time,
  published_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Complete Airbnb Turnover Cleaning Checklist',
  'airbnb-cleaning-checklist',
  '<h2>The Ultimate Airbnb Turnover Cleaning Checklist</h2>

<p>Running a successful Airbnb requires maintaining impeccable cleanliness standards. Guests expect a spotless, hotel-quality experience, and your cleaning routine is crucial to achieving those 5-star reviews. This comprehensive checklist will help you maintain consistent, thorough cleaning standards for every turnover.</p>

<h3>Pre-Cleaning Preparation</h3>
<ul>
<li>Gather all cleaning supplies and equipment</li>
<li>Check for any guest-damaged items or maintenance issues</li>
<li>Remove all trash and personal items left by guests</li>
<li>Open windows for ventilation</li>
<li>Start with the highest areas and work downward</li>
</ul>

<h3>Kitchen Deep Clean</h3>
<ul>
<li><strong>Appliances:</strong> Clean inside and outside of refrigerator, microwave, oven, and dishwasher</li>
<li><strong>Countertops:</strong> Sanitize all surfaces with disinfectant</li>
<li><strong>Sink:</strong> Clean and disinfect, check for clogs</li>
<li><strong>Cabinets:</strong> Wipe down exterior surfaces</li>
<li><strong>Dishes:</strong> Ensure all dishes are clean and properly stored</li>
<li><strong>Floor:</strong> Sweep and mop thoroughly</li>
</ul>

<h3>Bathroom Sanitization</h3>
<ul>
<li><strong>Toilet:</strong> Clean bowl, seat, and exterior with disinfectant</li>
<li><strong>Shower/Bathtub:</strong> Scrub tiles, grout, and fixtures</li>
<li><strong>Mirrors:</strong> Clean and polish to streak-free finish</li>
<li><strong>Vanity:</strong> Clean countertop and sink</li>
<li><strong>Towels:</strong> Replace with fresh, clean towels</li>
<li><strong>Floor:</strong> Clean and disinfect</li>
</ul>

<h3>Living Areas</h3>
<ul>
<li><strong>Furniture:</strong> Vacuum cushions and wipe down surfaces</li>
<li><strong>Electronics:</strong> Clean TV screens and remote controls</li>
<li><strong>Windows:</strong> Clean interior windows and window sills</li>
<li><strong>Flooring:</strong> Vacuum carpets and mop hard floors</li>
<li><strong>Decor:</strong> Dust all decorative items</li>
</ul>

<h3>Bedroom Essentials</h3>
<ul>
<li><strong>Bedding:</strong> Change all sheets, pillowcases, and duvet covers</li>
<li><strong>Mattress:</strong> Check for stains and treat if necessary</li>
<li><strong>Closet:</strong> Ensure empty and clean</li>
<li><strong>Nightstands:</strong> Clean surfaces and empty drawers</li>
<li><strong>Floor:</strong> Vacuum or mop</li>
</ul>

<h3>Final Touches</h3>
<ul>
<li>Replace all consumables (toilet paper, paper towels, soap)</li>
<li>Check all light bulbs and replace if needed</li>
<li>Test all appliances and electronics</li>
<li>Ensure heating/cooling is working properly</li>
<li>Take photos for quality control</li>
<li>Lock up and set security system</li>
</ul>

<h3>Pro Tips for Airbnb Hosts</h3>
<ul>
<li><strong>Time Management:</strong> Allow 2-4 hours for thorough cleaning</li>
<li><strong>Quality Control:</strong> Use a checklist app or printed list</li>
<li><strong>Guest Communication:</strong> Inform guests of cleaning standards</li>
<li><strong>Backup Plan:</strong> Have professional cleaners on standby</li>
<li><strong>Supplies:</strong> Stock up on quality cleaning products</li>
</ul>

<p>Consistent, thorough cleaning is the foundation of a successful Airbnb business. By following this comprehensive checklist, you''ll ensure every guest experiences the clean, comfortable stay they expect, leading to better reviews and increased bookings.</p>',
  'Master the art of Airbnb turnover cleaning with our comprehensive checklist. From kitchen deep cleaning to bedroom essentials, ensure every guest experiences spotless perfection.',
  'https://images.unsplash.com/photo-1581578731548-c6d0f3e84c93?w=800&h=600&fit=crop',
  'Airbnb cleaning checklist with cleaning supplies and checklist',
  (SELECT id FROM blog_categories WHERE slug = 'cleaning-tips'),
  NULL,
  'published',
  'Complete Airbnb Turnover Cleaning Checklist | Shalean',
  'Master Airbnb turnover cleaning with our comprehensive checklist. Expert tips for kitchen, bathroom, bedroom, and living area cleaning to ensure 5-star guest reviews.',
  8,
  NOW(),
  NOW(),
  NOW()
);

-- Insert Eco-Friendly Products post
INSERT INTO blog_posts (
  id,
  title,
  slug,
  content,
  excerpt,
  featured_image,
  featured_image_alt,
  category_id,
  author_id,
  status,
  meta_title,
  meta_description,
  read_time,
  published_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'The Benefits of Eco-Friendly Cleaning Products',
  'eco-friendly-products',
  '<h2>The Benefits of Eco-Friendly Cleaning Products</h2>

<p>As awareness of environmental impact grows, more homeowners are making the switch to eco-friendly cleaning products. These sustainable alternatives offer numerous benefits for your health, home, and the planet. Let''s explore why making the switch is not just environmentally responsible, but also practical and effective.</p>

<h3>Health Benefits</h3>
<p>Traditional cleaning products often contain harsh chemicals that can cause respiratory issues, skin irritation, and allergic reactions. Eco-friendly alternatives use natural ingredients that are gentler on your body:</p>
<ul>
<li><strong>Reduced Allergies:</strong> Natural ingredients are less likely to trigger allergic reactions</li>
<li><strong>Better Air Quality:</strong> No toxic fumes or volatile organic compounds (VOCs)</li>
<li><strong>Safer for Children:</strong> Non-toxic formulas are safe around kids and pets</li>
<li><strong>Skin-Friendly:</strong> Gentle ingredients won''t cause irritation or dryness</li>
</ul>

<h3>Environmental Impact</h3>
<p>Eco-friendly cleaning products are designed with sustainability in mind:</p>
<ul>
<li><strong>Biodegradable:</strong> Ingredients break down naturally without harming ecosystems</li>
<li><strong>Reduced Packaging:</strong> Many eco-products use minimal, recyclable packaging</li>
<li><strong>Water-Safe:</strong> Won''t contaminate water sources or harm aquatic life</li>
<li><strong>Carbon Footprint:</strong> Often produced with renewable energy and sustainable practices</li>
</ul>

<h3>Cost-Effectiveness</h3>
<p>While eco-friendly products may seem more expensive initially, they often provide better value:</p>
<ul>
<li><strong>Concentrated Formulas:</strong> Last longer than traditional products</li>
<li><strong>Multi-Purpose:</strong> One product can often replace several specialized cleaners</li>
<li><strong>DIY Options:</strong> Many can be made at home using common ingredients</li>
<li><strong>Long-term Savings:</strong> Reduced health costs and environmental impact</li>
</ul>

<h3>Top Eco-Friendly Cleaning Ingredients</h3>
<ul>
<li><strong>White Vinegar:</strong> Natural disinfectant and deodorizer</li>
<li><strong>Baking Soda:</strong> Gentle abrasive and odor neutralizer</li>
<li><strong>Lemon Juice:</strong> Natural bleach and grease cutter</li>
<li><strong>Essential Oils:</strong> Natural fragrances with antimicrobial properties</li>
<li><strong>Castile Soap:</strong> Plant-based soap for all-purpose cleaning</li>
</ul>

<h3>Making the Switch</h3>
<p>Transitioning to eco-friendly cleaning doesn''t have to be overwhelming:</p>
<ul>
<li><strong>Start Small:</strong> Replace one product at a time</li>
<li><strong>Read Labels:</strong> Look for certifications like Green Seal or EcoLogo</li>
<li><strong>DIY Recipes:</strong> Try making your own cleaners with simple ingredients</li>
<li><strong>Research Brands:</strong> Choose companies committed to sustainability</li>
</ul>

<h3>Professional Cleaning with Eco-Friendly Products</h3>
<p>At Shalean, we understand the importance of sustainable cleaning practices. Our professional cleaners use eco-friendly products that:</p>
<ul>
<li>Effectively clean without harsh chemicals</li>
<li>Protect your family''s health</li>
<li>Maintain environmental responsibility</li>
<li>Deliver the same high-quality results</li>
</ul>

<p>Making the switch to eco-friendly cleaning products is a simple yet impactful way to create a healthier home environment while protecting the planet. Start your journey toward sustainable cleaning today and experience the benefits for yourself.</p>',
  'Discover the health, environmental, and cost benefits of eco-friendly cleaning products. Learn about natural ingredients and sustainable cleaning practices for a healthier home.',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
  'Eco-friendly cleaning products and natural ingredients',
  (SELECT id FROM blog_categories WHERE slug = 'cleaning-tips'),
  NULL,
  'published',
  'The Benefits of Eco-Friendly Cleaning Products | Shalean',
  'Discover why eco-friendly cleaning products are better for your health, home, and environment. Learn about natural ingredients and sustainable cleaning practices.',
  7,
  NOW(),
  NOW(),
  NOW()
);

-- Drop existing view if it exists (to avoid column structure conflicts)
DROP VIEW IF EXISTS blog_posts_with_details;

-- Create the blog_posts_with_details view
-- This view joins blog_posts with blog_categories for easy querying
CREATE VIEW blog_posts_with_details AS
SELECT 
  bp.*,
  bc.name as category_name,
  bc.slug as category_slug
FROM blog_posts bp
LEFT JOIN blog_categories bc ON bp.category_id = bc.id;
