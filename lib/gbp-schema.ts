/**
 * Google Business Profile Schema Helper
 * 
 * Generates LocalBusiness schema markup with GBP integration
 * for service pages and other business-related pages.
 */

export interface GBPSchemaOptions {
  /**
   * Service name (e.g., "House Cleaning", "Deep Cleaning")
   */
  serviceName?: string;
  /**
   * Service type for schema
   */
  serviceType?: string;
  /**
   * Page URL
   */
  pageUrl: string;
  /**
   * Google Business Profile URL
   */
  gbpUrl?: string;
  /**
   * Business description
   */
  description?: string;
  /**
   * Price range (e.g., "R200-R1500")
   */
  priceRange?: string;
  /**
   * Physical address (if applicable)
   */
  streetAddress?: string;
  /**
   * Service area (defaults to Cape Town)
   */
  serviceArea?: Array<{
    "@type": "City" | "AdministrativeArea";
    name: string;
    containedInPlace?: {
      "@type": "State" | "Country";
      name: string;
    };
  }>;
}

/**
 * Default service areas (Cape Town focused)
 */
const defaultServiceAreas = [
  {
    "@type": "City" as const,
    name: "Cape Town",
    containedInPlace: {
      "@type": "State" as const,
      name: "Western Cape",
    },
  },
  {
    "@type": "City" as const,
    name: "Johannesburg",
    containedInPlace: {
      "@type": "State" as const,
      name: "Gauteng",
    },
  },
  {
    "@type": "City" as const,
    name: "Pretoria",
    containedInPlace: {
      "@type": "State" as const,
      name: "Gauteng",
    },
  },
  {
    "@type": "City" as const,
    name: "Durban",
    containedInPlace: {
      "@type": "State" as const,
      name: "KwaZulu-Natal",
    },
  },
];

/**
 * Generate LocalBusiness schema with GBP integration
 */
export function generateGBPSchema(options: GBPSchemaOptions) {
  const {
    serviceName,
    serviceType,
    pageUrl,
    gbpUrl,
    description = "Professional cleaning services in Cape Town. Trusted cleaners delivering exceptional results.",
    priceRange = "R200-R1500",
    streetAddress,
    serviceArea = defaultServiceAreas,
  } = options;

  // Get GBP URL from environment if not provided
  const finalGbpUrl = gbpUrl || process.env.NEXT_PUBLIC_GBP_URL;

  // Base LocalBusiness schema
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://shalean.co.za/#organization",
    name: "Shalean Cleaning Services",
    alternateName: "Shalean",
    url: "https://shalean.co.za",
    logo: "https://shalean.co.za/icon-512.png",
    image: "https://shalean.co.za/images/cleaning-team-hero.jpg",
    description: description,
    telephone: "+27 87 153 5250",
    email: "support@shalean.co.za",
    address: {
      "@type": "PostalAddress",
      ...(streetAddress && { streetAddress }),
      addressLocality: "Cape Town",
      addressRegion: "Western Cape",
      addressCountry: "ZA",
    },
    openingHours: ["Mo-Su 08:00-18:00"],
    priceRange: priceRange,
    areaServed: serviceArea,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "500",
      bestRating: "5",
      worstRating: "1",
    },
  };

  // Add GBP URL to sameAs if provided
  if (finalGbpUrl) {
    schema.sameAs = [finalGbpUrl];
  }

  // Add service-specific information
  if (serviceName || serviceType) {
    schema.serviceType = serviceType || serviceName;
    
    // Add hasOfferCatalog for service-specific offers
    if (serviceName) {
      schema.hasOfferCatalog = {
        "@type": "OfferCatalog",
        name: `${serviceName} Services`,
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: serviceName,
              serviceType: serviceType || serviceName,
              provider: {
                "@type": "LocalBusiness",
                "@id": "https://shalean.co.za/#organization",
                name: "Shalean Cleaning Services",
              },
              areaServed: serviceArea,
              url: pageUrl,
            },
          },
        ],
      };
    }
  }

  return schema;
}

/**
 * Generate service-specific LocalBusiness schema
 * Combines LocalBusiness with Service schema
 */
export function generateServiceLocalBusinessSchema(options: GBPSchemaOptions & {
  serviceDescription?: string;
  pricing?: string;
}) {
  const {
    serviceName,
    serviceType,
    pageUrl,
    gbpUrl,
    serviceDescription,
    pricing,
    ...rest
  } = options;

  const localBusinessSchema = generateGBPSchema({
    serviceName,
    serviceType,
    pageUrl,
    gbpUrl,
    ...rest,
  });

  // If we have service-specific details, enhance the schema
  if (serviceName && serviceDescription) {
    localBusinessSchema.serviceType = [serviceType || serviceName];
    
    // Add detailed service information
    if (localBusinessSchema.hasOfferCatalog) {
      localBusinessSchema.hasOfferCatalog.itemListElement[0].itemOffered.description = serviceDescription;
      
      if (pricing) {
        localBusinessSchema.hasOfferCatalog.itemListElement[0].itemOffered.offers = {
          "@type": "Offer",
          priceRange: pricing.includes("From") ? pricing.replace("From ", "") : pricing,
          priceCurrency: "ZAR",
          availability: "https://schema.org/InStock",
          url: pageUrl,
        };
      }
    }
  }

  return localBusinessSchema;
}

