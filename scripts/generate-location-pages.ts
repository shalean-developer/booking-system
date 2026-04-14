/**
 * Programmatic SEO location page generator
 *
 * Run:
 *   npx tsx scripts/generate-location-pages.ts
 *
 * Optional env:
 *   LOCATION_PAGES_API_URL=http://localhost:3001/api/create-location-page
 *   SEO_CONTENT_API_SECRET=...
 *   BLOG_CREATE_POST_SECRET=... (fallback)
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_URL =
  process.env.LOCATION_PAGES_API_URL?.trim() ||
  "http://localhost:3001/api/create-location-page";
const API_KEY =
  process.env.SEO_CONTENT_API_SECRET?.trim() ||
  process.env.BLOG_CREATE_POST_SECRET?.trim() ||
  "";
const FALLBACK_CITY = { city: "Cape Town", region: "Western Cape" } as const;

type CityRegion = {
  city: string;
  region: string;
};

type ApiResponse = {
  ok?: boolean;
  error?: string;
  code?: string;
};

type CreateLocationPayload = {
  title: string;
  slug: string;
  city: string;
  region: string;
  hero_subtitle: string;
  content: string;
  meta_description: string;
  keywords: string;
  published: boolean;
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const cityGroups: Array<{ city: string; region: string; slugs: string[] }> = [
  {
    city: "Cape Town",
    region: "Western Cape",
    slugs: [
      "claremont",
      "sea-point",
      "observatory",
      "newlands",
      "rondebosch",
      "gardens",
      "woodstock",
      "green-point",
      "milnerton",
      "table-view",
      "blouberg",
      "durbanville",
      "bellville",
      "muizenberg",
      "fish-hoek",
      "noordhoek",
      "hout-bay",
      "constantia",
      "wynberg",
      "tokai",
      "kenilworth",
      "bishopscourt",
      "plumstead",
      "bergvliet",
      "retreat",
      "lansdowne",
      "athlone",
      "pinelands",
      "goodwood",
      "parow",
      "edgemead",
      "parklands",
      "sunningdale",
      "melkbosstrand",
      "brackenfell",
      "kraaifontein",
      "somerset-west",
      "strand",
      "gordons-bay",
    ],
  },
  {
    city: "Johannesburg",
    region: "Gauteng",
    slugs: [
      "sandton",
      "rosebank",
      "fourways",
      "randburg",
      "midrand",
      "bryanston",
      "rivonia",
      "hyde-park",
      "illovo",
      "melrose",
      "houghton",
      "parkhurst",
      "northcliff",
      "linden",
      "sunninghill",
      "morningside",
      "bedfordview",
      "germiston",
      "boksburg",
      "kempton-park",
      "edenvale",
      "alberton",
      "roodepoort",
      "soweto",
      "johannesburg-south",
      "modderfontein",
    ],
  },
  {
    city: "Pretoria",
    region: "Gauteng",
    slugs: [
      "menlyn",
      "brooklyn-pretoria",
      "waterkloof",
      "lynnwood",
      "hatfield",
      "centurion",
      "faerie-glen",
      "garsfontein",
      "moreleta-park",
      "montana",
      "sinoville",
      "wonderboom",
      "arcadia",
      "sunnyside-pretoria",
      "silver-lakes",
      "mooikloof",
      "waverley-pretoria",
      "annlin",
      "elarduspark",
      "zwartkop",
    ],
  },
  {
    city: "Durban",
    region: "KwaZulu-Natal",
    slugs: [
      "umhlanga",
      "durban-north",
      "la-lucia",
      "westville",
      "glenwood",
      "musgrave",
      "berea-durban",
      "morningside-durban",
      "pinetown",
      "hillcrest",
      "kloof",
      "ballito",
      "tongaat",
      "phoenix",
      "chattsworth",
      "amanzi-toti",
      "uMdloti",
      "bluff",
      "newlands-east",
      "newlands-west",
    ],
  },
  {
    city: "Port Elizabeth",
    region: "Eastern Cape",
    slugs: [
      "summerstrand",
      "walmer",
      "newton-park",
      "mount-pleasant",
      "mill-park",
      "framesby",
      "lorraine",
      "greenacres",
      "charlo",
      "kabega",
    ],
  },
  {
    city: "Bloemfontein",
    region: "Free State",
    slugs: [
      "westdene-bloemfontein",
      "langenhoven-park",
      "universitas",
      "dan-pienaar",
      "navalsig",
      "fichardt-park",
      "bayswater",
      "willows",
      "heuwelsig",
      "spitskop",
    ],
  },
  {
    city: "Gqeberha",
    region: "Eastern Cape",
    slugs: [
      "lorraine-manor",
      "walmer-heights",
      "sunridge-park",
      "kragga-kamma",
      "fairview-gqeberha",
      "mount-road",
    ],
  },
];

const locations = cityGroups.flatMap((g) => g.slugs);

const cityBySlug: Record<string, CityRegion> = Object.fromEntries(
  cityGroups.flatMap((g) => g.slugs.map((slug) => [slug, { city: g.city, region: g.region }]))
) as Record<string, CityRegion>;

const nearbyAreas: Record<string, string[]> = Object.fromEntries(
  cityGroups.flatMap((g) =>
    g.slugs.map((slug, index) => {
      const near: string[] = [];
      if (g.slugs[index - 1]) near.push(formatTitle(g.slugs[index - 1]));
      if (g.slugs[index + 1]) near.push(formatTitle(g.slugs[index + 1]));
      if (g.slugs[index + 2]) near.push(formatTitle(g.slugs[index + 2]));
      return [slug, near];
    })
  )
) as Record<string, string[]>;

const subtitles = [
  "Trusted cleaners with flexible scheduling.",
  "Reliable home cleaning services near you.",
  "Professional cleaning with eco-friendly products.",
  "Affordable and vetted cleaners in your area.",
  "Book in minutes with transparent pricing and quality service.",
];

const contentTemplates = [
  (location: string, city: string, nearby: string) => `
    <p>Shalean provides professional home cleaning in ${location}, ${city}. Our vetted team handles recurring, deep, and once-off cleaning with consistent quality.</p>
    <p>We also support homes in nearby areas like ${nearby}. Book online in minutes and choose a schedule that fits your week.</p>
    <p><a href="/booking/service/standard/plan">Book your cleaning now</a> and enjoy a cleaner, healthier home.</p>
  `.trim(),
  (location: string, city: string, nearby: string) => `
    <p>Looking for trusted cleaners in ${location}? Our local teams in ${city} deliver reliable home cleaning and detailed deep-clean support.</p>
    <p>Customers in ${nearby} choose Shalean for flexible bookings, vetted cleaners, and eco-friendly options.</p>
    <p>Get started today via our fast online booking flow.</p>
  `.trim(),
  (location: string, city: string, nearby: string) => `
    <p>Home cleaning in ${location} should be simple. We make it easy with transparent pricing and dependable teams across ${city}.</p>
    <p>We frequently serve ${nearby}, helping busy households keep kitchens, bathrooms, and living spaces spotless.</p>
    <p>Choose the service type you need and reserve your slot online.</p>
  `.trim(),
  (location: string, city: string, nearby: string) => `
    <p>Need a cleaner in ${location}? Shalean offers routine cleaning, move-in/move-out support, and deep cleaning in ${city}.</p>
    <p>Our crews also cover nearby suburbs such as ${nearby}, with punctual arrivals and quality-focused checklists.</p>
    <p>Book today for a stress-free clean tailored to your home.</p>
  `.trim(),
  (location: string, city: string, nearby: string) => `
    <p>From weekly maintenance to one-time resets, our ${location} cleaning services are designed for modern households in ${city}.</p>
    <p>We support families and professionals in ${nearby} with trusted, vetted cleaners and easy rescheduling.</p>
    <p>Ready for a cleaner space? Book online now.</p>
  `.trim(),
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getCityRegion(slug: string): CityRegion {
  return cityBySlug[slug] || FALLBACK_CITY;
}

function getNearbyLabel(slug: string): string {
  const nearby = nearbyAreas[slug] || [];
  if (nearby.length === 0) return "surrounding areas";
  return nearby.slice(0, 3).join(", ");
}

function buildPayload(slug: string): CreateLocationPayload {
  const locationTitle = formatTitle(slug);
  const { city, region } = getCityRegion(slug);
  const nearby = getNearbyLabel(slug);

  return {
    title: `Home Cleaning in ${locationTitle}`,
    slug,
    city,
    region,
    hero_subtitle: getRandom(subtitles),
    content: getRandom(contentTemplates)(locationTitle, city, nearby),
    meta_description: `Book trusted home cleaners in ${locationTitle}, ${city}. Flexible scheduling, vetted cleaners, and reliable service near ${nearby}.`,
    keywords: `${locationTitle} cleaning, house cleaning ${locationTitle}, home cleaning ${city}, deep cleaning ${locationTitle}`,
    published: true,
  };
}

function isDuplicateResponse(status: number, body: ApiResponse): boolean {
  if (status === 409) return true;
  const text = `${body.error || ""} ${body.code || ""}`.toLowerCase();
  return text.includes("already exists") || text.includes("duplicate") || text.includes("23505");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function throttleMs(): number {
  return 400 + Math.floor(Math.random() * 201); // 400-600ms
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!API_KEY) {
    console.error("Missing SEO_CONTENT_API_SECRET or BLOG_CREATE_POST_SECRET.");
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`Generating ${locations.length} location pages via ${API_URL}`);

  for (const slug of locations) {
    const payload = buildPayload(slug);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      let result: ApiResponse = {};
      try {
        result = (await response.json()) as ApiResponse;
      } catch {
        result = {};
      }

      if (response.ok && result.ok !== false) {
        created++;
        console.log(`✅ Created: ${slug}`);
      } else if (isDuplicateResponse(response.status, result)) {
        skipped++;
        console.log(`⚠️ Skipped (exists): ${slug}`);
      } else {
        failed++;
        console.error(`❌ Failed: ${slug}`, result.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      failed++;
      console.error(`❌ Failed: ${slug}`, error);
    }

    await sleep(throttleMs());
  }

  console.log(
    `Summary -> total: ${locations.length}, created: ${created}, skipped: ${skipped}, failed: ${failed}`
  );
}

main().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
