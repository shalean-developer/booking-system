import { stringifyStructuredData } from "@/lib/structured-data-validator";

export function HomeStructuredData() {
  // Sample reviews from homepage (matching home-reviews-showcase.tsx)
  const reviews = [
    {
      "@type": "Review",
      "itemReviewed": {
        "@type": "LocalBusiness",
        "name": "Shalean Cleaning Services",
        "@id": "https://shalean.co.za/#organization"
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
        "@id": "https://shalean.co.za/#organization"
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
        "@id": "https://shalean.co.za/#organization"
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
    "@id": "https://shalean.co.za/#organization",
    "name": "Shalean Cleaning Services",
    "description": "Leading cleaning companies in Cape Town offering expert house cleaning services, deep cleaning services, and home cleaning services. Professional cleaning services near you for standard cleaning, deep cleaning, move-in/out, and Airbnb turnover.",
    "url": "https://shalean.co.za",
    "logo": {
      "@type": "ImageObject",
      "url": "https://shalean.co.za/icon-512.png"
    },
    "image": {
      "@type": "ImageObject",
      "url": "https://shalean.co.za/assets/og/home-1200x630.jpg",
      "width": 1200,
      "height": 630
    },
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
        "name": "Johannesburg",
        "containedInPlace": {
          "@type": "State",
          "name": "Gauteng"
        }
      },
      {
        "@type": "City",
        "name": "Pretoria",
        "containedInPlace": {
          "@type": "State",
          "name": "Gauteng"
        }
      },
      {
        "@type": "City",
        "name": "Durban",
        "containedInPlace": {
          "@type": "State",
          "name": "KwaZulu-Natal"
        }
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
      process.env.NEXT_PUBLIC_GBP_URL || "https://www.google.com/maps/place/Shalean+Cleaning+Services",
      "https://www.instagram.com/shalean_cleaning_services"
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
