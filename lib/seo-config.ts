import { generateOgImageUrl, generateCanonical } from "./metadata";

// SEO configuration for all pages
export const SEO_CONFIG = {
  // Home page
  home: {
    title: "Professional Cleaning Services Cape Town | House & Office Cleaning | Shalean",
    description: "Book vetted cleaners in Cape Town. Same-day deep cleaning, house cleaning & office cleaning. Insured cleaners, satisfaction guaranteed. From R250. Book online today!",
    canonical: generateCanonical("/"),
    keywords: ["cleaning services Cape Town", "house cleaning Cape Town", "maid service Cape Town", "deep cleaning Cape Town", "office cleaning Cape Town", "Airbnb cleaning Cape Town", "professional cleaners Cape Town", "move out cleaning Cape Town"],
    ogImage: {
      url: generateOgImageUrl("home"),
      alt: "Shalean Cleaning Services team cleaning a living room in Cape Town"
    }
  },

  // Services pages
  services: {
    title: "Cleaning Services Cape Town | House & Office Cleaning | Shalean",
    description: "Professional cleaning services in Cape Town: deep clean, standard clean, Airbnb turnaround, and move-in/out cleaning. Same-day available. From R250. Book vetted cleaners online today!",
    canonical: generateCanonical("/services"),
    ogImage: {
      url: generateOgImageUrl("services"),
      alt: "Professional cleaning services in Cape Town - Shalean Cleaning Services"
    }
  },

  "deep-specialty": {
    title: "Deep Cleaning Services in Cape Town | Shalean",
    description: "Book professional deep cleaning in Cape Town. Thorough cleaning of kitchens, bathrooms, carpets, and upholstery. Satisfaction guaranteed.",
    canonical: generateCanonical("/services/deep-specialty"),
    ogImage: {
      url: generateOgImageUrl("deep-cleaning"),
      alt: "Before and after deep cleaned kitchen"
    }
  },

  "home-maintenance": {
    title: "Home Maintenance Cleaning Cape Town | Regular Cleaning | Shalean",
    description: "Professional home maintenance cleaning services in Cape Town. Keep your home spotless with regular cleaning from Shalean's expert team. Ongoing maintenance and seasonal cleaning available. Book today!",
    canonical: generateCanonical("/services/home-maintenance"),
    ogImage: {
      url: generateOgImageUrl("home-maintenance"),
      alt: "Professional cleaner maintaining a clean home in Cape Town - Shalean Cleaning Services"
    }
  },

  "move-turnover": {
    title: "Move In/Out Cleaning Cape Town | End of Lease Cleaning | Shalean",
    description: "Professional move-in/out cleaning and Airbnb turnover services in Cape Town. End of lease cleaning, same-day available. From R980. Book trusted cleaners for your property transition today!",
    canonical: generateCanonical("/services/move-turnover"),
    ogImage: {
      url: generateOgImageUrl("move-turnover"),
      alt: "Professional move-in/out cleaning service in Cape Town - Shalean Cleaning Services"
    }
  },

  // Blog pages
  blog: {
    title: "Cleaning Tips & Guides | Shalean Blog",
    description: "Expert cleaning tips, industry insights, and practical guides from professional cleaners. Learn how to maintain a spotless space with our comprehensive cleaning resources.",
    canonical: generateCanonical("/blog"),
    ogImage: {
      url: generateOgImageUrl("blog-default"),
      alt: "Shalean blog featuring cleaning tips and guides"
    }
  },

  "booking-select": {
    title: "Book a Cleaning Service Online",
    description: "Book a trusted cleaner online for deep clean, regular service, or Airbnb turnovers across Cape Town. Get instant quote with transparent pricing and flexible scheduling. Book now!",
    canonical: generateCanonical("/booking/service/select"),
    ogImage: {
      url: generateOgImageUrl("booking"),
      alt: "Mobile booking interface with cleaning options"
    }
  },

  "booking-quote": {
    title: "Cleaning Quote & Pricing | Shalean",
    description: "Get an instant quote for professional cleaning services. Transparent pricing for deep clean, regular cleaning, and specialty services. No hidden fees. Request your quote today!",
    canonical: generateCanonical("/booking/quote"),
    ogImage: {
      url: generateOgImageUrl("booking"),
      alt: "Transparent cleaning service pricing"
    }
  },

  // Other key pages
  contact: {
    title: "Contact Shalean | Cape Town Cleaners",
    description: "Questions? Contact Shalean Cleaning Services for quotes, jobs, and support. Call +27 87 153 5250 or visit our Claremont office. We're here to help with all your cleaning needs.",
    canonical: generateCanonical("/contact"),
    ogImage: {
      url: generateOgImageUrl("contact"),
      alt: "Shalean office front and phone icon"
    }
  },

  about: {
    title: "About Shalean — Professional Cleaners",
    description: "Learn about Shalean's mission to provide exceptional cleaning services. Meet our team of professional cleaners serving Cape Town, Johannesburg, Pretoria, and Durban.",
    canonical: generateCanonical("/about"),
    ogImage: {
      url: generateOgImageUrl("about"),
      alt: "Shalean cleaning team at work"
    }
  },

  careers: {
    title: "Careers at Shalean — Join Our Cleaning Team",
    description: "Join Shalean's growing team of professional cleaners. Competitive pay, flexible schedules, and career growth opportunities. Apply today for positions in Cape Town and beyond.",
    canonical: generateCanonical("/careers"),
    ogImage: {
      url: generateOgImageUrl("careers"),
      alt: "Join Shalean cleaning team"
    }
  },

  team: {
    title: "Meet Our Cleaning Team — Shalean Experts",
    description: "Meet Shalean's expert cleaning team. Professional cleaners with years of experience serving Cape Town, Johannesburg, Pretoria, and Durban homes and businesses.",
    canonical: generateCanonical("/team"),
    ogImage: {
      url: generateOgImageUrl("team"),
      alt: "Shalean cleaning team members"
    }
  },

  "how-it-works": {
    title: "How Shalean Works | Shalean",
    description: "Learn how easy it is to book professional cleaning services with Shalean. Simple online booking, expert cleaners, guaranteed satisfaction. Get started in minutes!",
    canonical: generateCanonical("/how-it-works"),
    ogImage: {
      url: generateOgImageUrl("how-it-works"),
      alt: "Shalean booking process overview"
    }
  },

  // Location pages
  location: {
    title: "Service Areas | Shalean Cleaning Services",
    description: "Professional cleaning services across South Africa. We serve Cape Town, Johannesburg, Pretoria, and Durban. Check if we service your area and get a free quote.",
    canonical: generateCanonical("/location"),
    ogImage: {
      url: generateOgImageUrl("service-areas"),
      alt: "Shalean Cleaning Services coverage map showing service areas across South Africa"
    }
  },

  "location-cape-town": {
    title: "Cape Town Cleaning Services | Shalean",
    description: "Professional cleaning services throughout Cape Town. From Sea Point to Stellenbosch, Shalean serves all Cape Town areas including Atlantic Seaboard, City Bowl, and Southern Suburbs.",
    canonical: generateCanonical("/location/cape-town"),
    ogImage: {
      url: generateOgImageUrl("cape-town"),
      alt: "Cape Town cleaning services coverage"
    }
  },

  pricing: {
    title: "Cleaning Services Pricing Cape Town | Transparent Rates | Shalean",
    description: "Clear pricing for cleaning services in Cape Town. Standard cleaning from R250, deep cleaning from R1200. See all rates including service fees. Get instant quote online. No hidden costs.",
    canonical: generateCanonical("/pricing"),
    keywords: [
      "cleaning services pricing Cape Town",
      "house cleaning prices Cape Town",
      "deep cleaning cost Cape Town",
      "maid service rates Cape Town",
      "cleaning service fees Cape Town",
      "affordable cleaning Cape Town",
      "cleaning prices South Africa"
    ],
    ogImage: {
      url: generateOgImageUrl("pricing"),
      alt: "Transparent cleaning services pricing in Cape Town - Shalean Cleaning Services"
    }
  }
};

// Helper function to get SEO config for a page
export function getSeoConfig(pageKey: keyof typeof SEO_CONFIG) {
  return SEO_CONFIG[pageKey];
}

// Helper function to get all page keys
export function getAllPageKeys(): (keyof typeof SEO_CONFIG)[] {
  return Object.keys(SEO_CONFIG) as (keyof typeof SEO_CONFIG)[];
}
