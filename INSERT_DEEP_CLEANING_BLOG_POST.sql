-- =====================================================
-- INSERT DEEP CLEANING BLOG POST
-- Run this in Supabase SQL Editor
-- =====================================================

-- Insert Deep Cleaning Guide Blog Post
DO $$
DECLARE
    v_category_id UUID;
    v_read_time INTEGER;
    v_full_content TEXT;
BEGIN
    -- Get the Cleaning Tips category ID
    SELECT id INTO v_category_id
    FROM blog_categories
    WHERE slug = 'cleaning-tips'
    LIMIT 1;

    -- Check if category exists
    IF v_category_id IS NULL THEN
        RAISE EXCEPTION 'Category "Cleaning Tips" not found';
    END IF;

    -- Full HTML content with proper escaping
    v_full_content := '<p class="text-lg text-gray-600 mb-6">
        Deep cleaning revives spaces that regular chores overlook. Focus on high-impact wins, follow a room-by-room rhythm,
        and rely on the right tools so every surface feels fresh again.
      </p>

      <div class="grid gap-4 mb-12 sm:grid-cols-3">
        <div class="border border-primary/20 rounded-lg p-4 bg-primary/5">
          <p class="text-sm font-semibold text-primary tracking-wide uppercase">Why it matters</p>
          <p class="text-sm text-gray-600 mt-2">Removes allergens, grime, and odors that silently build up.</p>
        </div>
        <div class="border border-primary/20 rounded-lg p-4 bg-primary/5">
          <p class="text-sm font-semibold text-primary tracking-wide uppercase">When to do it</p>
          <p class="text-sm text-gray-600 mt-2">Seasonally for a full reset, monthly for high-traffic zones.</p>
        </div>
        <div class="border border-primary/20 rounded-lg p-4 bg-primary/5">
          <p class="text-sm font-semibold text-primary tracking-wide uppercase">How to succeed</p>
          <p class="text-sm text-gray-600 mt-2">Declutter first, then move methodically from top to bottom.</p>
        </div>
      </div>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">Understanding Deep Cleaning</h2>

      <div class="space-y-6">
        <section class="border border-gray-200 shadow-sm p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">What Is Deep Cleaning?</h3>
          <p class="text-gray-600">
            Deep cleaning is a comprehensive approach that targets built-up grime, allergens, and dirt hiding in hard-to-reach areas.
            Unlike weekly chores, it includes detailed tasks such as scrubbing grout, degreasing appliances, and lifting stubborn stains
            so every surface is truly sanitized.
          </p>
        </section>

        <section class="border border-gray-200 shadow-sm p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">Benefits of Deep Cleaning Every Room</h3>
          <p class="text-gray-600">
            A deep clean promotes healthier air, removes allergens, eliminates trapped odors, and prolongs the life of your appliances.
            By addressing hidden dust and grease, you reduce potential hazards and enjoy a calmer, healthier home environment.
          </p>
        </section>

        <section class="border border-gray-200 shadow-sm p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">Deep Cleaning vs. Regular Cleaning</h3>
          <p class="text-gray-600">
            Regular cleaning keeps surfaces tidy day to day. Deep cleaning is less frequent but far more thorough, covering forgotten zones
            from baseboards to ceiling fans. Both are essential&mdash;routine care maintains, while deep cleaning restores.
          </p>
        </section>
      </div>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">Essential Deep Cleaning Tasks</h2>

      <div class="space-y-6">
        <section class="border border-gray-200 shadow-sm p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">1. Disinfect High-Touch Areas</h3>
          <p class="text-gray-600">
            Wipe down light switches, remote controls, doorknobs, and appliance handles with disinfectant.
            These hotspots harbor germs and should be sanitized first so you do not recontaminate freshly cleaned rooms.
          </p>
        </section>

        <section class="border border-gray-200 shadow-sm p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">2. Deep Clean the Bathroom</h3>
          <p class="text-gray-600">
            Remove soap scum and mildew from grout, disinfect the toilet and sink, and polish mirrors and fixtures.
            Pay attention to shower walls, window sills, and exhaust fans where moisture and mold collect.
          </p>
        </section>

        <section class="border border-gray-200 shadow-sm p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">3. Refresh Kitchen Appliances</h3>
          <p class="text-gray-600">
            Run an empty dishwasher cycle with vinegar, degrease the stovetop, clean the microwave, and purge crumbs from small appliances.
            Clearing grease and buildup keeps everything running efficiently and odor-free.
          </p>
        </section>
      </div>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">Deep Cleaning Methods for Every Room</h2>

      <div class="space-y-6">
        <section class="border border-gray-200 shadow-sm p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">4. Clean Every Surface from Top to Bottom</h3>
          <p class="text-gray-600">
            Dust ceiling fans, vents, and light fixtures before tackling walls, windows, and floors.
            Vacuum corners and edges, then mop or steam clean to lift lingering dirt for a polished finish.
          </p>
        </section>

        <section class="border border-gray-200 shadow-sm p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">5. Use Microfiber Cloths Wisely</h3>
          <p class="text-gray-600">
            Microfiber traps dust more effectively than cotton. Keep a stack on hand so you are always working with a clean cloth
            when wiping counters, polishing mirrors, or dusting electronics.
          </p>
        </section>

        <section class="border border-gray-200 shadow-sm p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">6. Remove Stains from Carpets and Upholstery</h3>
          <p class="text-gray-600">
            Pre-treat stains with an appropriate solution, then blot gently before vacuuming or using a carpet cleaner.
            For upholstery, follow fabric care labels to avoid damage and keep textiles looking new.
          </p>
        </section>
      </div>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">Tools and Products for Deep Cleaning</h2>

      <div class="space-y-6">
        <section class="border border-gray-200 shadow-sm p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">7. Stock Essential Supplies</h3>
          <p class="text-gray-600">
            Build a kit with all-purpose cleaner, disinfectant wipes, glass cleaner, microfiber cloths, sponges, and scrub brushes.
            Having the right tools within reach keeps your momentum going.
          </p>
        </section>

        <section class="border border-gray-200 shadow-sm p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">8. Choose the Right Mop and Vacuum</h3>
          <p class="text-gray-600">
            Use a vacuum with strong suction and attachments to reach crevices and upholstery.
            Pair it with a mop that lifts grime without streaks&mdash;steam mops are excellent for sanitizing sealed floors.
          </p>
        </section>

        <section class="border border-gray-200 shadow-sm p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">9. Keep Glass Crystal Clear</h3>
          <p class="text-gray-600">
            Select a glass cleaner that cuts through fingerprints and residue without leaving streaks.
            Wipe windows, mirrors, and frames with a clean microfiber cloth or squeegee for a brilliant shine.
          </p>
        </section>
      </div>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">Tips to Maintain a Clean Home</h2>

      <div class="space-y-6">
        <section class="border border-gray-200 shadow-sm p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">10. Balance Regular and Deep Cleaning</h3>
          <p class="text-gray-600">
            Schedule routine tasks like vacuuming, dusting, and wiping counters weekly, then layer in seasonal deep cleans.
            This combination keeps your home looking immaculate between major cleaning sessions.
          </p>
        </section>

        <section class="border border-gray-200 shadow-sm p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">Organize Clutter First</h3>
          <p class="text-gray-600">
            Decluttering before you start frees up surfaces and prevents dust from collecting around piles.
            Sort items into keep, donate, and discard categories, and rely on bins or shelving for long-term order.
          </p>
        </section>

        <section class="border border-gray-200 shadow-sm p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">Keep Germs and Odors Away</h3>
          <p class="text-gray-600">
            Disinfect high-traffic surfaces frequently, boost ventilation by opening windows, and use natural deodorizers or diffusers.
            Address spills immediately to stop stains and smells from settling in.
          </p>
        </section>
      </div>

      <div class="bg-primary/5 border border-primary/30 p-6 rounded-lg mt-12">
        <p class="text-gray-800 font-semibold mb-2">Need a head start?</p>
        <p class="text-gray-600">
          Book a Shalean deep clean and we will reset your busiest rooms in a single visit. You handle the maintenance;
          our specialists tackle the grime, detail the appliances, and leave a shine that lasts.
        </p>
      </div>';

    -- Calculate read time (approximately 6 minutes for this content)
    v_read_time := 6;

    -- Insert the blog post
    INSERT INTO blog_posts (
        title,
        slug,
        content,
        excerpt,
        featured_image,
        featured_image_alt,
        category_id,
        status,
        meta_title,
        meta_description,
        read_time,
        published_at
    ) VALUES (
        '10 Essential Deep Cleaning Tips for Every Home',
        '10-essential-deep-cleaning-tips-for-every-home',
        v_full_content,
        'Your complete guide to deep cleaning high-touch areas, bathrooms, kitchens, and every surface for a healthier home.',
        '/images/deep-specialty.jpg',
        'Deep cleaning tips and techniques',
        v_category_id,
        'published',
        '10 Essential Deep Cleaning Tips for Every Home | Shalean',
        'Master deep cleaning with ten expert tips covering sanitizing high-touch areas, refreshing appliances, and keeping every room in your home spotless.',
        v_read_time,
        '2025-10-15 08:00:00+00'
    );

    RAISE NOTICE 'Deep cleaning blog post inserted successfully!';
    RAISE NOTICE 'Category ID: %', v_category_id;
END $$;

-- Verify the post was created
SELECT id, title, slug, status, published_at, category_id
FROM blog_posts
WHERE slug = '10-essential-deep-cleaning-tips-for-every-home';

