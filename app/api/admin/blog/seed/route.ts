import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

// Existing blog posts to migrate
const existingPosts = [
  {
    title: '10 Essential Deep Cleaning Tips for Every Home',
    slug: '10-essential-deep-cleaning-tips-for-every-home',
    excerpt: 'Your complete guide to deep cleaning high-touch areas, bathrooms, kitchens, and every surface for a healthier home.',
    category: 'Cleaning Tips',
    readTime: 6,
    image: '/images/deep-specialty.jpg',
    date: '2025-10-15',
    content: `
      <p class="text-xl text-gray-600 mb-8">
        Welcome to your guide to achieving an impeccably clean home. A deep clean goes beyond routine tidying,
        reaching every corner so your space feels refreshed, sanitized, and ready for whatever comes next.
        Use these expert-backed tips to transform every room in your home.
      </p>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">Understanding Deep Cleaning</h2>

      <div class="space-y-6">
        <section class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">What Is Deep Cleaning?</h3>
          <p class="text-gray-600">
            Deep cleaning is a comprehensive approach that targets built-up grime, allergens, and dirt hiding in hard-to-reach areas.
            Unlike weekly chores, it includes detailed tasks such as scrubbing grout, degreasing appliances, and lifting stubborn stains
            so every surface is truly sanitized.
          </p>
        </section>

        <section class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">Benefits of Deep Cleaning Every Room</h3>
          <p class="text-gray-600">
            A deep clean promotes healthier air, removes allergens, eliminates trapped odors, and prolongs the life of your appliances.
            By addressing hidden dust and grease, you reduce potential hazards and enjoy a calmer, healthier home environment.
          </p>
        </section>

        <section class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">Deep Cleaning vs. Regular Cleaning</h3>
          <p class="text-gray-600">
            Regular cleaning keeps surfaces tidy day to day. Deep cleaning is less frequent but far more thorough, covering forgotten zones
            from baseboards to ceiling fans. Both are essential&mdash;routine care maintains, while deep cleaning restores.
          </p>
        </section>
      </div>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">Essential Deep Cleaning Tasks</h2>

      <div class="space-y-6">
        <section class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">1. Disinfect High-Touch Areas</h3>
          <p class="text-gray-600">
            Wipe down light switches, remote controls, doorknobs, and appliance handles with disinfectant.
            These hotspots harbor germs and should be sanitized first so you do not recontaminate freshly cleaned rooms.
          </p>
        </section>

        <section class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">2. Deep Clean the Bathroom</h3>
          <p class="text-gray-600">
            Remove soap scum and mildew from grout, disinfect the toilet and sink, and polish mirrors and fixtures.
            Pay attention to shower walls, window sills, and exhaust fans where moisture and mold collect.
          </p>
        </section>

        <section class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">3. Refresh Kitchen Appliances</h3>
          <p class="text-gray-600">
            Run an empty dishwasher cycle with vinegar, degrease the stovetop, clean the microwave, and purge crumbs from small appliances.
            Clearing grease and buildup keeps everything running efficiently and odor-free.
          </p>
        </section>
      </div>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">Deep Cleaning Methods for Every Room</h2>

      <div class="space-y-6">
        <section class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">4. Clean Every Surface from Top to Bottom</h3>
          <p class="text-gray-600">
            Dust ceiling fans, vents, and light fixtures before tackling walls, windows, and floors.
            Vacuum corners and edges, then mop or steam clean to lift lingering dirt for a polished finish.
          </p>
        </section>

        <section class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">5. Use Microfiber Cloths Wisely</h3>
          <p class="text-gray-600">
            Microfiber traps dust more effectively than cotton. Keep a stack on hand so you are always working with a clean cloth
            when wiping counters, polishing mirrors, or dusting electronics.
          </p>
        </section>

        <section class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">6. Remove Stains from Carpets and Upholstery</h3>
          <p class="text-gray-600">
            Pre-treat stains with an appropriate solution, then blot gently before vacuuming or using a carpet cleaner.
            For upholstery, follow fabric care labels to avoid damage and keep textiles looking new.
          </p>
        </section>
      </div>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">Tools and Products for Deep Cleaning</h2>

      <div class="space-y-6">
        <section class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">7. Stock Essential Supplies</h3>
          <p class="text-gray-600">
            Build a kit with all-purpose cleaner, disinfectant wipes, glass cleaner, microfiber cloths, sponges, and scrub brushes.
            Having the right tools within reach keeps your momentum going.
          </p>
        </section>

        <section class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">8. Choose the Right Mop and Vacuum</h3>
          <p class="text-gray-600">
            Use a vacuum with strong suction and attachments to reach crevices and upholstery.
            Pair it with a mop that lifts grime without streaks&mdash;steam mops are excellent for sanitizing sealed floors.
          </p>
        </section>

        <section class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">9. Keep Glass Crystal Clear</h3>
          <p class="text-gray-600">
            Select a glass cleaner that cuts through fingerprints and residue without leaving streaks.
            Wipe windows, mirrors, and frames with a clean microfiber cloth or squeegee for a brilliant shine.
          </p>
        </section>
      </div>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">Tips to Maintain a Clean Home</h2>

      <div class="space-y-6">
        <section class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">10. Balance Regular and Deep Cleaning</h3>
          <p class="text-gray-600">
            Schedule routine tasks like vacuuming, dusting, and wiping counters weekly, then layer in seasonal deep cleans.
            This combination keeps your home looking immaculate between major cleaning sessions.
          </p>
        </section>

        <section class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">Organize Clutter First</h3>
          <p class="text-gray-600">
            Decluttering before you start frees up surfaces and prevents dust from collecting around piles.
            Sort items into keep, donate, and discard categories, and rely on bins or shelving for long-term order.
          </p>
        </section>

        <section class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">Keep Germs and Odors Away</h3>
          <p class="text-gray-600">
            Disinfect high-traffic surfaces frequently, boost ventilation by opening windows, and use natural deodorizers or diffusers.
            Address spills immediately to stop stains and smells from settling in.
          </p>
        </section>
      </div>

      <div class="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg mt-12">
        <p class="text-gray-700 italic">
          Deep cleaning is an investment in your health, comfort, and peace of mind. Tackle a room at a time, or call in the professionals
          when you need an extra hand&mdash;we are here to help you keep every space spotless.
        </p>
      </div>
    `,
    meta_title: '10 Essential Deep Cleaning Tips for Every Home | Shalean',
    meta_description: 'Master deep cleaning with ten expert tips covering sanitizing high-touch areas, refreshing appliances, and keeping every room in your home spotless.',
  },
  {
    title: 'The Benefits of Eco-Friendly Cleaning Products',
    slug: 'the-benefits-of-eco-friendly-cleaning-products',
    excerpt: 'Learn why switching to eco-friendly cleaning products is better for your health and the environment. Discover safe, effective alternatives.',
    category: 'Sustainability',
    readTime: 4,
    image: '/images/home-maintenance.jpg',
    date: '2025-10-12',
    content: `
      <p class="text-xl text-gray-600 mb-8">
        Making the switch to eco-friendly cleaning products isn't just a trend—it's a smart choice 
        for your health, your family, and the planet. Let's explore why green cleaning products are 
        worth considering and how they can transform your cleaning routine.
      </p>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">
        Why Choose Eco-Friendly Products?
      </h2>

      <div class="space-y-6 mb-12">
        <div class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-xl font-bold text-gray-900 mb-2">Healthier Indoor Air Quality</h3>
          <p class="text-gray-600">Traditional cleaning products can release harmful volatile organic compounds (VOCs) into your home. Eco-friendly alternatives are made with natural ingredients that don't compromise air quality.</p>
        </div>

        <div class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-xl font-bold text-gray-900 mb-2">Safer for Children and Pets</h3>
          <p class="text-gray-600">Green cleaning products contain fewer harsh chemicals, reducing the risk of skin irritation, respiratory issues, and accidental poisoning.</p>
        </div>

        <div class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-xl font-bold text-gray-900 mb-2">Environmental Protection</h3>
          <p class="text-gray-600">Eco-friendly products are biodegradable and come in sustainable packaging, reducing pollution and waste in our ecosystems.</p>
        </div>

        <div class="border-0 shadow-md p-6 rounded-lg">
          <h3 class="text-xl font-bold text-gray-900 mb-2">Equally Effective</h3>
          <p class="text-gray-600">Modern eco-friendly products are just as effective as traditional cleaners, without the environmental and health downsides.</p>
        </div>
      </div>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">
        Natural Ingredients to Look For
      </h2>

      <ul class="space-y-3 mb-8">
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600"><strong>Vinegar:</strong> Natural disinfectant and deodorizer</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600"><strong>Baking Soda:</strong> Gentle abrasive for scrubbing</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600"><strong>Essential Oils:</strong> Natural fragrance and antibacterial properties</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600"><strong>Castile Soap:</strong> Vegetable-based, multipurpose cleaner</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600"><strong>Lemon Juice:</strong> Natural bleaching and degreasing agent</span>
        </li>
      </ul>

      <div class="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg mb-8">
        <p class="text-gray-700 italic">
          "At Shalean, we exclusively use eco-friendly cleaning products to ensure the safety of 
          your family and our planet, without compromising on cleanliness."
        </p>
        <p class="text-sm text-gray-600 mt-2">— Shalean Cleaning Services</p>
      </div>
    `,
    meta_title: 'The Benefits of Eco-Friendly Cleaning Products | Shalean Blog',
    meta_description: 'Learn why switching to eco-friendly cleaning products is better for your health and the environment. Discover safe, effective alternatives.',
  },
  {
    title: 'Complete Airbnb Turnover Cleaning Checklist',
    slug: 'complete-airbnb-turnover-cleaning-checklist',
    excerpt: 'Master the art of Airbnb turnover with our comprehensive cleaning checklist for 5-star reviews. Ensure guest satisfaction every time.',
    category: 'Airbnb Hosts',
    readTime: 6,
    image: '/images/move-turnover.jpg',
    date: '2025-10-10',
    content: `
      <p class="text-xl text-gray-600 mb-8">
        As an Airbnb host, the cleanliness of your property directly impacts your reviews and bookings. 
        A thorough turnover clean is essential for maintaining high standards and ensuring guest satisfaction. 
        Follow this comprehensive checklist to achieve 5-star cleanliness every time.
      </p>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">
        Living Room & Common Areas
      </h2>

      <ul class="space-y-3 mb-8">
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Vacuum all floors and carpets thoroughly</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Dust all surfaces, shelves, and decorative items</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Clean windows, mirrors, and glass surfaces</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Wipe down light switches and door handles</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Empty all trash bins and replace liners</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Fluff and arrange cushions and throws</span>
        </li>
      </ul>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">
        Kitchen
      </h2>

      <ul class="space-y-3 mb-8">
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Clean and sanitize all countertops</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Wipe down all appliances inside and out</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Clean stovetop and remove any grease</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Empty and clean refrigerator shelves</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Wash and put away all dishes and utensils</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Sweep and mop floors</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Restock essentials (paper towels, dish soap, etc.)</span>
        </li>
      </ul>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">
        Bedrooms
      </h2>

      <ul class="space-y-3 mb-8">
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Change all bed linens and pillowcases</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Vacuum under the bed and in corners</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Dust nightstands and dressers</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Check closets for left items</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Provide fresh towels and extra blankets</span>
        </li>
      </ul>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">
        Bathrooms
      </h2>

      <ul class="space-y-3 mb-8">
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Scrub and disinfect toilet, sink, and shower/tub</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Clean mirrors and chrome fixtures</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Replace towels and bath mats</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Restock toiletries (toilet paper, soap, shampoo)</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Sweep and mop floors</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Empty trash and replace liner</span>
        </li>
      </ul>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">
        Final Touches
      </h2>

      <ul class="space-y-3 mb-8">
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Do a final walkthrough to check everything</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Ensure all lights are working</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Set thermostat to comfortable temperature</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Add welcoming touches (fresh flowers, welcome note)</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Take photos for your records</span>
        </li>
      </ul>

      <div class="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg mb-8">
        <p class="text-gray-700 italic">
          "Professional Airbnb cleaning services can save you time and ensure consistent 5-star 
          cleanliness. At Shalean, we specialize in short-term rental turnovers with fast, 
          reliable service."
        </p>
        <p class="text-sm text-gray-600 mt-2">— Shalean Turnover Cleaning Team</p>
      </div>
    `,
    meta_title: 'Complete Airbnb Turnover Cleaning Checklist | Shalean Blog',
    meta_description: 'Master the art of Airbnb turnover with our comprehensive cleaning checklist for 5-star reviews. Ensure guest satisfaction every time.',
  },
];

export async function POST() {
  try {
    // Check admin authorization
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get categories
    const { data: categories } = await supabase
      .from('blog_categories')
      .select('*');

    if (!categories) {
      return NextResponse.json({ error: 'Categories not found' }, { status: 404 });
    }

    const results = [];

    for (const post of existingPosts) {
      // Find category ID
      const category = categories.find(c => c.name === post.category);
      
      if (!category) {
        console.error(`Category not found: ${post.category}`);
        continue;
      }

      // Insert blog post
      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          featured_image: post.image,
          featured_image_alt: post.title,
          category_id: category.id,
          status: 'published',
          meta_title: post.meta_title,
          meta_description: post.meta_description,
          read_time: post.readTime,
          published_at: new Date(post.date).toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error(`Error inserting post ${post.title}:`, error);
        results.push({ title: post.title, success: false, error: error.message });
      } else {
        results.push({ title: post.title, success: true, id: data.id });
      }
    }

    return NextResponse.json({
      message: 'Migration completed',
      results,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Failed to migrate posts' },
      { status: 500 }
    );
  }
}

