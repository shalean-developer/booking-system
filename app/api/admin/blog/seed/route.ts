import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

// Existing blog posts to migrate
const existingPosts = [
  {
    title: '10 Essential Deep Cleaning Tips for Every Home',
    slug: '10-essential-deep-cleaning-tips-for-every-home',
    excerpt: 'Discover professional techniques to deep clean your home like an expert, from kitchen to bathroom. Transform your space with these proven methods.',
    category: 'Cleaning Tips',
    readTime: 5,
    image: '/images/deep-specialty.jpg',
    date: '2025-10-15',
    content: `
      <p class="text-xl text-gray-600 mb-8">
        Deep cleaning goes beyond your regular tidying routine. It's about tackling the areas
        that don't get attention during weekly cleaning sessions. Whether you're preparing for
        a special occasion, changing seasons, or just want a fresh start, these professional
        tips will help you achieve a thoroughly clean home.
      </p>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">
        Professional Deep Cleaning Techniques
      </h2>

      <div class="space-y-6 mb-12">
        <div class="border-0 shadow-md p-6 rounded-lg">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              1
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-900 mb-2">Start from Top to Bottom</h3>
              <p class="text-gray-600">Always clean from ceiling to floor to avoid re-cleaning lower surfaces. Dust ceiling fans, light fixtures, and high shelves first.</p>
            </div>
          </div>
        </div>

        <div class="border-0 shadow-md p-6 rounded-lg">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              2
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-900 mb-2">Tackle the Kitchen Thoroughly</h3>
              <p class="text-gray-600">Clean inside your oven, refrigerator, and dishwasher. Don't forget behind appliances where grease and dust accumulate.</p>
            </div>
          </div>
        </div>

        <div class="border-0 shadow-md p-6 rounded-lg">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              3
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-900 mb-2">Deep Clean Bathrooms</h3>
              <p class="text-gray-600">Scrub grout lines, descale showerheads, and clean behind toilets. Use appropriate cleaners for different surfaces.</p>
            </div>
          </div>
        </div>

        <div class="border-0 shadow-md p-6 rounded-lg">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              4
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-900 mb-2">Refresh Carpets and Upholstery</h3>
              <p class="text-gray-600">Vacuum thoroughly, then steam clean or use appropriate cleaning solutions for fabric furniture and carpets.</p>
            </div>
          </div>
        </div>

        <div class="border-0 shadow-md p-6 rounded-lg">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              5
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-900 mb-2">Windows and Mirrors</h3>
              <p class="text-gray-600">Clean both sides of windows, frames, and sills. Use streak-free glass cleaner for a crystal-clear finish.</p>
            </div>
          </div>
        </div>

        <div class="border-0 shadow-md p-6 rounded-lg">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              6
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-900 mb-2">Organize as You Clean</h3>
              <p class="text-gray-600">Declutter each room before deep cleaning. Donate or discard items you no longer need.</p>
            </div>
          </div>
        </div>

        <div class="border-0 shadow-md p-6 rounded-lg">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              7
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-900 mb-2">Clean Air Vents and Filters</h3>
              <p class="text-gray-600">Remove dust from air vents and replace or clean HVAC filters to improve air quality.</p>
            </div>
          </div>
        </div>

        <div class="border-0 shadow-md p-6 rounded-lg">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              8
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-900 mb-2">Baseboards and Trim</h3>
              <p class="text-gray-600">Wipe down all baseboards, door frames, and window trim. These areas collect surprising amounts of dust.</p>
            </div>
          </div>
        </div>

        <div class="border-0 shadow-md p-6 rounded-lg">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              9
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-900 mb-2">Mattresses and Bedding</h3>
              <p class="text-gray-600">Vacuum mattresses, wash all bedding including pillows, and flip or rotate mattresses.</p>
            </div>
          </div>
        </div>

        <div class="border-0 shadow-md p-6 rounded-lg">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              10
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-900 mb-2">Don't Forget Hidden Areas</h3>
              <p class="text-gray-600">Clean under furniture, behind doors, inside closets, and other often-overlooked spaces.</p>
            </div>
          </div>
        </div>
      </div>

      <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6">
        When to Call the Professionals
      </h2>

      <p class="text-gray-600 mb-6">
        While these tips will help you maintain a clean home, professional deep cleaning services
        offer several advantages:
      </p>

      <ul class="space-y-3 mb-8">
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Professional-grade equipment and eco-friendly cleaning products</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Trained experts who know the most effective techniques</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Time savings—focus on what matters while we handle the cleaning</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="text-primary">✓</span>
          <span class="text-gray-600">Consistent, high-quality results every time</span>
        </li>
      </ul>

      <div class="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg mb-8">
        <p class="text-gray-700 italic">
          "Regular deep cleaning not only keeps your home looking beautiful but also contributes
          to better indoor air quality and a healthier living environment for your family."
        </p>
        <p class="text-sm text-gray-600 mt-2">— Shalean Cleaning Experts</p>
      </div>
    `,
    meta_title: '10 Must-Know Deep Cleaning Tips for a Spotless Home',
    meta_description: 'Professional deep cleaning techniques to transform your home. Expert tips for kitchen, bathroom, and every room from Shalean\'s cleaning professionals.',
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

