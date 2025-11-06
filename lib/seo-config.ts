import { generateOgImageUrl, generateCanonical } from "./metadata";

// SEO configuration for all pages
export const SEO_CONFIG = {
  // Home page
  home: {
    title: "House Cleaning Services in Cape Town | Shalean Cleaning Services — Professional Home Cleaning Experts Offering Deep Cleaning, Regular Maintenance, Move-In Cleaning, and Airbnb Turnover Services",
    description: "Professional cleaning services in Cape Town with Shalean. Expert house cleaners offering deep cleaning, regular maintenance, and move-in cleaning services. Book today!",
    canonical: generateCanonical("/"),
    ogImage: {
      url: generateOgImageUrl("home"),
      alt: "Shalean Cleaning Services team cleaning a living room"
    }
  },

  // Services pages
  services: {
    title: "Home Cleaning Services — Deep, Standard & Airbnb Cleaning | Shalean Professional Cleaning Services Offering Comprehensive Solutions for Every Cleaning Need Including Regular Maintenance, Deep Cleaning, Move-In/Out, and Specialty Services",
    description: "Explore Shalean's cleaning services: deep clean, standard clean, Airbnb turnaround, and move-in/out cleaning. Book online today.",
    canonical: generateCanonical("/services"),
    ogImage: {
      url: generateOgImageUrl("services"),
      alt: "Cleaning supplies laid out on kitchen counter"
    }
  },

  "deep-specialty": {
    title: "Deep Cleaning Services in Cape Town | Shalean Professional Deep Cleaning Experts Offering Thorough Kitchen, Bathroom, Carpet, and Upholstery Cleaning Services with Satisfaction Guaranteed",
    description: "Book professional deep cleaning in Cape Town. Thorough cleaning of kitchens, bathrooms, carpets, and upholstery. Satisfaction guaranteed.",
    canonical: generateCanonical("/services/deep-specialty"),
    ogImage: {
      url: generateOgImageUrl("deep-cleaning"),
      alt: "Before and after deep cleaned kitchen"
    }
  },

  "home-maintenance": {
    title: "Home Maintenance Cleaning | Regular Cleaning Services | Shalean Professional Home Maintenance Cleaning Experts Offering Ongoing Maintenance, Seasonal Cleaning, and Regular Cleaning Services to Keep Your Home Spotless Year-Round",
    description: "Professional home maintenance cleaning services. Keep your home spotless with regular cleaning from Shalean's expert team. Ongoing maintenance and seasonal cleaning available.",
    canonical: generateCanonical("/services/home-maintenance"),
    ogImage: {
      url: generateOgImageUrl("home-maintenance"),
      alt: "Professional cleaner maintaining a clean home"
    }
  },

  "move-turnover": {
    title: "Move In/Out & Airbnb Cleaning Services | Shalean Professional Move-In/Out and Airbnb Turnover Cleaning Experts Offering Complete Property Cleaning Services to Ensure Your Space is Guest-Ready and Move-In Ready",
    description: "Professional move-in/out cleaning and Airbnb turnover services. Ensure your property is guest-ready with Shalean's expert team.",
    canonical: generateCanonical("/services/move-turnover"),
    ogImage: {
      url: generateOgImageUrl("move-turnover"),
      alt: "Professional move-in/out cleaning service"
    }
  },

  // Blog pages
  blog: {
    title: "Cleaning Tips & Guides | Shalean Blog — Expert Cleaning Tips, Industry Insights, and Practical Guides from Professional Cleaners to Help You Maintain a Spotless Home and Office Space",
    description: "Expert cleaning tips, industry insights, and practical guides from professional cleaners. Learn how to maintain a spotless space.",
    canonical: generateCanonical("/blog"),
    ogImage: {
      url: generateOgImageUrl("blog-default"),
      alt: "Shalean blog featuring cleaning tips and guides"
    }
  },

  "booking-select": {
    title: "Book a Cleaning Service Online | Shalean Online Booking Platform — Book a Trusted Cleaner Online for Deep Clean, Regular Service, or Airbnb Turnovers Across Cape Town, Johannesburg, Pretoria, and Durban with Instant Quotes",
    description: "Book a trusted cleaner online for a deep clean, regular service, or Airbnb turnovers across Cape Town. Get an instant quote.",
    canonical: generateCanonical("/booking/service/select"),
    ogImage: {
      url: generateOgImageUrl("booking"),
      alt: "Mobile booking interface with cleaning options"
    }
  },

  "booking-quote": {
    title: "Cleaning Quote & Pricing | Shalean Transparent Pricing — Get an Instant Quote for Professional Cleaning Services with Transparent Pricing for Deep Clean, Regular Cleaning, Move-In/Out, and Specialty Services",
    description: "Get an instant quote for professional cleaning services. Transparent pricing for deep clean, regular cleaning, and specialty services.",
    canonical: generateCanonical("/booking/quote"),
    ogImage: {
      url: generateOgImageUrl("booking"),
      alt: "Transparent cleaning service pricing"
    }
  },

  // Other key pages
  contact: {
    title: "Contact Shalean Cleaning Services — Cape Town Cleaners | Get in Touch with Shalean Professional Cleaning Services for Quotes, Job Inquiries, Customer Support, and Service Questions. Call +27 87 153 5250 or Visit Our Claremont Office",
    description: "Questions? Contact Shalean Cleaning Services for quotes, jobs, and support. Call +27 87 153 5250 or visit our Claremont office.",
    canonical: generateCanonical("/contact"),
    ogImage: {
      url: generateOgImageUrl("contact"),
      alt: "Shalean office front and phone icon"
    }
  },

  about: {
    title: "About Shalean — Professional Cleaners | Learn About Shalean's Mission to Provide Exceptional Cleaning Services, Meet Our Team of Professional Cleaners Serving Cape Town, Johannesburg, Pretoria, and Durban, and Discover Our Commitment to Quality",
    description: "Learn about Shalean's mission to provide exceptional cleaning services. Meet our team of professional cleaners serving Cape Town, Johannesburg, Pretoria, and Durban.",
    canonical: generateCanonical("/about"),
    ogImage: {
      url: generateOgImageUrl("about"),
      alt: "Shalean cleaning team at work"
    }
  },

  careers: {
    title: "Careers at Shalean — Join Our Cleaning Team | Join Shalean's Growing Team of Professional Cleaners with Competitive Pay, Flexible Schedules, Career Growth Opportunities, and a Supportive Work Environment in Cape Town and Beyond",
    description: "Join Shalean's growing team of professional cleaners. Competitive pay, flexible schedules, and career growth opportunities. Apply today for positions in Cape Town and beyond.",
    canonical: generateCanonical("/careers"),
    ogImage: {
      url: generateOgImageUrl("careers"),
      alt: "Join Shalean cleaning team"
    }
  },

  team: {
    title: "Meet Our Cleaning Team — Shalean Experts | Meet Shalean's Expert Cleaning Team of Professional Cleaners with Years of Experience Serving Cape Town, Johannesburg, Pretoria, and Durban Homes and Businesses",
    description: "Meet Shalean's expert cleaning team. Professional cleaners with years of experience serving Cape Town, Johannesburg, Pretoria, and Durban homes and businesses.",
    canonical: generateCanonical("/team"),
    ogImage: {
      url: generateOgImageUrl("team"),
      alt: "Shalean cleaning team members"
    }
  },

  "how-it-works": {
    title: "How Shalean Works — Simple Booking Process | Learn How Easy It Is to Book Professional Cleaning Services with Shalean Through Our Simple Online Booking System, Expert Cleaners, and Guaranteed Satisfaction Process",
    description: "Learn how easy it is to book professional cleaning services with Shalean. Simple online booking, expert cleaners, guaranteed satisfaction.",
    canonical: generateCanonical("/how-it-works"),
    ogImage: {
      url: generateOgImageUrl("how-it-works"),
      alt: "Shalean booking process overview"
    }
  },

  // Location pages
  location: {
    title: "Service Areas | Shalean Cleaning Services — Professional Cleaning Services Across South Africa Serving Cape Town, Johannesburg, Pretoria, and Durban. Check if We Service Your Area and Get a Free Quote Today",
    description: "Professional cleaning services across South Africa. We serve Cape Town, Johannesburg, Pretoria, and Durban. Check if we service your area and get a free quote.",
    canonical: generateCanonical("/location"),
    ogImage: {
      url: generateOgImageUrl("service-areas"),
      alt: "Shalean Cleaning Services coverage map showing service areas across South Africa"
    }
  },

  "location-cape-town": {
    title: "Cape Town Cleaning Services | Shalean Professional Cleaning Services Throughout Cape Town — From Sea Point to Stellenbosch, Shalean Serves All Cape Town Areas Including Atlantic Seaboard, City Bowl, Southern Suburbs, and More",
    description: "Professional cleaning services throughout Cape Town. From Sea Point to Stellenbosch, Shalean serves all Cape Town areas including Atlantic Seaboard, City Bowl, and Southern Suburbs.",
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
