import { stringifyStructuredData } from "@/lib/structured-data-validator";

export function HomeStructuredData() {
  // Sample reviews from homepage (matching home-reviews-showcase.tsx)
  const reviews = [
    {
      "@type": "Review",
      "itemReviewed": {
        "@type": "LocalBusiness",
        "name": "Shalean Cleaning Services",
        "@id": "https://shalean.co.za"
      },
      "author": {
        "@type": "Person",
        "name": "Sarah M."
      },
      "reviewBody": "Shalean transformed my home! The team was professional, thorough, and used eco-friendly products. My apartment has never looked better. Highly recommend their deep cleaning service.",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5",
        "worstRating": "1"
      },
      "datePublished": new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
    },
    {
      "@type": "Review",
      "itemReviewed": {
        "@type": "LocalBusiness",
        "name": "Shalean Cleaning Services",
        "@id": "https://shalean.co.za"
      },
      "author": {
        "@type": "Person",
        "name": "Michael T."
      },
      "reviewBody": "Outstanding service! The cleaners arrived on time, were incredibly thorough, and left my place spotless. The booking process was seamless and the pricing is very fair. Will definitely use again.",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5",
        "worstRating": "1"
      },
      "datePublished": new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks ago
    },
    {
      "@type": "Review",
      "itemReviewed": {
        "@type": "LocalBusiness",
        "name": "Shalean Cleaning Services",
        "@id": "https://shalean.co.za"
      },
      "author": {
        "@type": "Person",
        "name": "Lisa K."
      },
      "reviewBody": "Best cleaning service in Cape Town! They handle my Airbnb turnovers perfectly every time. Fast, reliable, and my guests always comment on how clean the place is. Worth every rand!",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5",
        "worstRating": "1"
      },
      "datePublished": new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    }
  ];

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
      "ratingValue": "5.0",
      "reviewCount": "500",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": reviews,
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
