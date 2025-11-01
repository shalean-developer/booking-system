import { stringifyStructuredData } from "@/lib/structured-data-validator";

export function HomeStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://shalean.co.za",
    "name": "Shalean Cleaning Services",
    "description": "Leading cleaning companies in Cape Town offering expert house cleaning services, deep cleaning services, and home cleaning services. Professional cleaning services near you for standard cleaning, deep cleaning, move-in/out, and Airbnb turnover.",
    "url": "https://shalean.co.za",
    "logo": "https://shalean.co.za/icon-512.png",
    "image": "https://shalean.co.za/images/cleaning-team-hero.jpg",
    "priceRange": "$$",
    "telephone": "+27 87 153 5250",
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "Western Cape",
      "addressLocality": "Cape Town",
      "addressCountry": "ZA"
    },
    "openingHours": "Mo-Su 08:00-18:00",
    "serviceType": [
      "House Cleaning",
      "Professional Cleaning",
      "Deep Cleaning",
      "Move In/Out Cleaning",
      "Airbnb Cleaning",
      "Commercial Cleaning",
      "Residential Cleaning",
      "Apartment Cleaning",
      "Office Cleaning",
      "Standard Cleaning",
      "Deep Specialty Cleaning",
      "House Cleaning Services",
      "Deep Cleaning Services",
      "Home Cleaning Services",
      "Cleaning Services Near Me"
    ],
    "areaServed": [
      {
        "@type": "City",
        "name": "Cape Town",
        "containedInPlace": {
          "@type": "State",
          "name": "Western Cape"
        }
      },
      {
        "@type": "City",
        "name": "Sea Point"
      },
      {
        "@type": "City",
        "name": "Camps Bay"
      },
      {
        "@type": "City",
        "name": "Claremont"
      },
      {
        "@type": "City",
        "name": "Green Point"
      },
      {
        "@type": "City",
        "name": "City Bowl"
      },
      {
        "@type": "City",
        "name": "Gardens"
      },
      {
        "@type": "City",
        "name": "Waterfront"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "500",
      "bestRating": "5",
      "worstRating": "1"
    },
    "sameAs": [
      "https://instagram.com/shaleancleaning"
    ]
  };

  // Use validator to clean and validate schema
  const validatedSchema = stringifyStructuredData(structuredData, "LocalBusiness");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: validatedSchema }}
    />
  );
}
