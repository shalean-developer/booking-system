export function HomeStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://shalean.co.za",
    "name": "Shalean Cleaning Services",
    "description": "Expert professional cleaning services for homes and businesses. Standard cleaning, deep cleaning, move-in/out, and Airbnb turnover services.",
    "url": "https://shalean.co.za",
    "logo": "https://shalean.co.za/icon-512.png",
    "image": "https://shalean.co.za/images/cleaning-team-hero.jpg",
    "priceRange": "$$",
    "telephone": "+27 87 153 5250",
    "serviceType": [
      "Cleaning Service",
      "House Cleaning",
      "Deep Cleaning",
      "Move In/Out Cleaning",
      "Airbnb Cleaning",
      "Commercial Cleaning",
      "Residential Cleaning"
    ],
    "areaServed": {
      "@type": "Country",
      "name": "South Africa"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "2500",
      "bestRating": "5",
      "worstRating": "1"
    },
    "sameAs": [
      "https://instagram.com/shaleancleaning"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
