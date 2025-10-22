import { generateOgImageUrl, generateCanonical } from "./metadata";

// SEO configuration for all pages
export const SEO_CONFIG = {
  // Home page
  home: {
    title: "Shalean Cleaning Services - Exceptional Home & Office Cleaning",
    description: "Reliable home & apartment cleaning services in Cape Town. Book deep cleans, move-outs, and regular cleaning with Shalean's expert team today.",
    canonical: generateCanonical("/"),
    ogImage: {
      url: generateOgImageUrl("home"),
      alt: "Shalean Cleaning Services team cleaning a living room"
    }
  },

  // Services pages
  services: {
    title: "Home Cleaning Services — Deep, Standard & Airbnb",
    description: "Explore Shalean's cleaning services: deep clean, standard clean, Airbnb turnaround, and move-in/out cleaning. Book online today.",
    canonical: generateCanonical("/services"),
    ogImage: {
      url: generateOgImageUrl("services"),
      alt: "Cleaning supplies laid out on kitchen counter"
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
    title: "Home Maintenance Cleaning | Regular Cleaning Services",
    description: "Professional home maintenance cleaning services. Keep your home spotless with regular cleaning from Shalean's expert team.",
    canonical: generateCanonical("/services/home-maintenance"),
    ogImage: {
      url: generateOgImageUrl("home-maintenance"),
      alt: "Professional cleaner maintaining a clean home"
    }
  },

  "move-turnover": {
    title: "Move In/Out & Airbnb Cleaning Services | Shalean",
    description: "Professional move-in/out cleaning and Airbnb turnover services. Ensure your property is guest-ready with Shalean's expert team.",
    canonical: generateCanonical("/services/move-turnover"),
    ogImage: {
      url: generateOgImageUrl("move-turnover"),
      alt: "Professional move-in/out cleaning service"
    }
  },

  // Blog pages
  blog: {
    title: "Cleaning Tips & Guides | Shalean Blog",
    description: "Expert cleaning tips, industry insights, and practical guides from professional cleaners. Learn how to maintain a spotless space.",
    canonical: generateCanonical("/blog"),
    ogImage: {
      url: generateOgImageUrl("blog-default"),
      alt: "Shalean blog featuring cleaning tips and guides"
    }
  },

  // Booking pages
  "booking-select": {
    title: "Book a Cleaning Service — Shalean Online Booking",
    description: "Book a trusted cleaner online for a deep clean, regular service, or Airbnb turnovers across Cape Town. Get an instant quote.",
    canonical: generateCanonical("/booking/service/select"),
    ogImage: {
      url: generateOgImageUrl("booking"),
      alt: "Mobile booking interface with cleaning options"
    }
  },

  "booking-quote": {
    title: "Get Cleaning Quote — Instant Pricing | Shalean",
    description: "Get an instant quote for professional cleaning services. Transparent pricing for deep clean, regular cleaning, and specialty services.",
    canonical: generateCanonical("/booking/quote"),
    ogImage: {
      url: generateOgImageUrl("booking"),
      alt: "Transparent cleaning service pricing"
    }
  },

  // Other key pages
  contact: {
    title: "Contact Shalean Cleaning Services — Cape Town Cleaners",
    description: "Questions? Contact Shalean Cleaning Services for quotes, jobs, and support. Call +27 87 153 5250 or visit our Claremont office.",
    canonical: generateCanonical("/contact"),
    ogImage: {
      url: generateOgImageUrl("contact"),
      alt: "Shalean office front and phone icon"
    }
  },

  about: {
    title: "About Shalean — Professional Cleaners",
    description: "Learn about Shalean's mission to provide exceptional cleaning services. Meet our team of professional cleaners serving Cape Town.",
    canonical: generateCanonical("/about"),
    ogImage: {
      url: generateOgImageUrl("about"),
      alt: "Shalean cleaning team at work"
    }
  },

  careers: {
    title: "Careers at Shalean — Join Our Cleaning Team",
    description: "Join Shalean's growing team of professional cleaners. Competitive pay, flexible schedules, and career growth opportunities.",
    canonical: generateCanonical("/careers"),
    ogImage: {
      url: generateOgImageUrl("careers"),
      alt: "Join Shalean cleaning team"
    }
  },

  team: {
    title: "Meet Our Cleaning Team — Shalean Experts",
    description: "Meet Shalean's expert cleaning team. Professional cleaners with years of experience serving Cape Town homes and businesses.",
    canonical: generateCanonical("/team"),
    ogImage: {
      url: generateOgImageUrl("team"),
      alt: "Shalean cleaning team members"
    }
  },

  "how-it-works": {
    title: "How Shalean Works — Simple Booking Process",
    description: "Learn how easy it is to book professional cleaning services with Shalean. Simple online booking, expert cleaners, guaranteed satisfaction.",
    canonical: generateCanonical("/how-it-works"),
    ogImage: {
      url: generateOgImageUrl("how-it-works"),
      alt: "Shalean booking process overview"
    }
  },

  // Location pages
  "location-cape-town": {
    title: "Cape Town Cleaning Services | Shalean",
    description: "Professional cleaning services throughout Cape Town. From Sea Point to Stellenbosch, Shalean serves all Cape Town areas.",
    canonical: generateCanonical("/location/cape-town"),
    ogImage: {
      url: generateOgImageUrl("cape-town"),
      alt: "Cape Town cleaning services coverage"
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
