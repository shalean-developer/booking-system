import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingHeader } from "@/components/marketing-header";
import { SuburbMap } from "@/components/location/suburb-map";
import { stringifyStructuredData } from "@/lib/structured-data-validator";
import { getCitySlug, getRelatedSuburbs, slugifyLocation } from "@/lib/location-data";
import {
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  ArrowRight,
  Home,
  Clock,
  Users,
  Shield,
  Star
} from "lucide-react";

type FAQItem = {
  question: string;
  answer: string;
};

type TestimonialItem = {
  name: string;
  content: string;
  rating?: number;
  location?: string;
};

interface SuburbPageProps {
  suburb: string;
  city: string;
  area: string;
  description: string;
  highlights?: string[];
  available?: boolean;
  relatedSuburbs?: Array<{ name: string; href: string }>;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  serviceHours?: string;
  businessName?: string;
  mapEmbedUrl?: string;
  faqs?: FAQItem[];
  testimonials?: TestimonialItem[];
  tagline?: string;
  quickLinks?: Array<{ label: string; href: string }>;
  trustBadges?: string[];
  heroImage?: string;
  heroImageAlt?: string;
  showStickyCta?: boolean;
}

export function SuburbPageTemplate({
  suburb,
  city,
  area,
  description,
  highlights = [],
  available = true,
  relatedSuburbs = [],
  contactPhone,
  contactEmail,
  contactAddress,
  serviceHours,
  businessName,
  mapEmbedUrl,
  faqs,
  testimonials,
  tagline,
  quickLinks,
  trustBadges,
  heroImage,
  heroImageAlt,
  showStickyCta = true,
}: SuburbPageProps) {
  const citySlug = getCitySlug(city);
  const suburbSlug = slugifyLocation(suburb);
  const defaultHighlights = [
    "Professional, vetted cleaners",
    "Flexible scheduling",
    "100% satisfaction guarantee",
    "Eco-friendly cleaning products available",
    "Same-day service available",
    "Competitive pricing"
  ];

  const features = highlights.length > 0 ? highlights : defaultHighlights;

  const businessNameValue = businessName ?? "Shalean Cleaning Services";
  const phoneNumber = contactPhone ?? "+27 87 153 5250";
  const emailAddress = contactEmail ?? "support@shalean.com";
  const addressValue = contactAddress ?? `${suburb}, ${city}, South Africa`;
  const serviceHoursValue = serviceHours ?? "Mon-Sun: 08:00-18:00";
  const mapQuery = encodeURIComponent(addressValue);
  const mapUrl =
    mapEmbedUrl ??
    `https://www.google.com/maps?q=${mapQuery}&output=embed`;

  const baseRelatedSuburbs =
    relatedSuburbs.length > 0
      ? relatedSuburbs
      : getRelatedSuburbs(city, suburb, 8);

  const defaultTestimonials: TestimonialItem[] = [
    {
      name: "Amanda L.",
      location: suburb,
      rating: 5,
      content: `“The Shalean team keeps our ${suburb.toLowerCase()} home spotless. They arrive on time, work quietly, and always follow any special requests. Highly recommended!”`
    },
    {
      name: "Michael S.",
      location: `${suburb}, ${city}`,
      rating: 5,
      content: `“We booked a move-out clean in ${suburb} and the apartment looked brand new. The cleaners handled every detail so the handover was stress-free.”`
    },
    {
      name: "Taryn P.",
      location: area,
      rating: 5,
      content: `“Flexible scheduling and friendly, vetted cleaners make Shalean the best choice for busy households in the ${area.toLowerCase()} area.”`
    }
  ];

  const testimonialItems =
    testimonials && testimonials.length > 0 ? testimonials : defaultTestimonials;

  const defaultFaqs: FAQItem[] = [
    {
      question: `Do you offer same-day cleaning in ${suburb}, Cape Town?`,
      answer: `Yes! We provide same-day and next-day cleaning services in ${suburb}, Cape Town when availability allows. Our Cape Town cleaning teams are trained to work efficiently while maintaining high standards. Book early for the best chance of same-day service.`
    },
    {
      question: `What types of properties do you clean in ${suburb}?`,
      answer: `Our professional cleaners serve homes, apartments, townhouses, and offices throughout ${suburb} and the surrounding ${area} in Cape Town. We tailor our cleaning checklist to your property type and specific preferences.`
    },
    {
      question: `How much does cleaning cost in ${suburb}?`,
      answer: `Cleaning prices in ${suburb} start from R250 for regular cleaning, depending on property size and service type. Deep cleaning starts from R450, and move-in/out cleaning from R980. Get an instant quote online or contact us for custom pricing.`
    },
    {
      question: `Are cleaning products and equipment included?`,
      answer: `Absolutely. Shalean cleaners arrive with professional-grade equipment and eco-friendly products that are safe for your family and pets. If you have specific supplies you prefer, let us know and we'll gladly use them.`
    },
    {
      question: `Can I schedule recurring cleaning services in ${suburb}?`,
      answer: `Yes, we offer weekly, bi-weekly, or monthly cleaning in ${suburb}, Cape Town. Recurring customers get consistent cleaners whenever possible, priority scheduling, and discounts on regular visits.`
    },
    {
      question: `What areas near ${suburb} do you serve?`,
      answer: `We serve ${suburb} and surrounding areas in the ${area} region of Cape Town. Our cleaning teams regularly service nearby suburbs, so contact us to confirm coverage for your specific location.`
    }
  ];

  const faqItems = faqs && faqs.length > 0 ? faqs : defaultFaqs;
  const averageRating =
    testimonialItems.length > 0
      ? testimonialItems.reduce((total, item) => total + Math.min(Math.max(item.rating ?? 5, 1), 5), 0) /
        testimonialItems.length
      : undefined;

  const defaultTrustBadges = [
    "100% Satisfaction Guarantee",
    "Fully Vetted & Insured Cleaners",
    "Eco-Friendly Products Available"
  ];

  const trustBadgesToRender = trustBadges && trustBadges.length > 0 ? trustBadges : defaultTrustBadges;

  const inlineLinkClass =
    "text-primary underline underline-offset-4 decoration-primary/40 hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-sm";

  const quickLinkItems =
    quickLinks && quickLinks.length > 0
      ? quickLinks
      : [
          { label: "Why Us", href: "#why-shalean" },
          { label: "Services", href: "#services" },
          { label: "Testimonials", href: "#testimonials" },
          { label: "FAQs", href: "#faqs" },
          { label: "Book Now", href: "#cta" }
        ];

  const inlineRelatedLinks = baseRelatedSuburbs.slice(0, 3);
  const aboutRelatedLinks = baseRelatedSuburbs.slice(0, 4);

  const renderLinkedSuburbs = (items: Array<{ name: string; href: string }>) =>
    items.map((item, index) => (
      <Fragment key={item.href}>
        <Link href={item.href} className={inlineLinkClass}>
          {item.name}
        </Link>
        {index < items.length - 2 ? ", " : index === items.length - 2 ? " and " : ""}
      </Fragment>
    ));

  // Get approximate geo coordinates for suburb (Cape Town city center as fallback)
  const getSuburbCoordinates = (suburbName: string, cityName: string): { latitude: number; longitude: number } => {
    // Approximate coordinates for major Cape Town suburbs
    const suburbCoords: Record<string, { latitude: number; longitude: number }> = {
      "Sea Point": { latitude: -33.9174, longitude: 18.3956 },
      "Camps Bay": { latitude: -33.9581, longitude: 18.3772 },
      "Claremont": { latitude: -33.9824, longitude: 18.4653 },
      "Constantia": { latitude: -34.0236, longitude: 18.4244 },
      "Green Point": { latitude: -33.9075, longitude: 18.4044 },
      "City Centre": { latitude: -33.9249, longitude: 18.4241 },
      "Gardens": { latitude: -33.9375, longitude: 18.4103 },
      "Clifton": { latitude: -33.9408, longitude: 18.3772 },
      "Bantry Bay": { latitude: -33.9308, longitude: 18.3772 },
      "Fresnaye": { latitude: -33.9208, longitude: 18.3772 },
      "Mouille Point": { latitude: -33.9075, longitude: 18.4044 },
      "V&A Waterfront": { latitude: -33.9046, longitude: 18.4207 },
      "Woodstock": { latitude: -33.9249, longitude: 18.4441 },
      "Observatory": { latitude: -33.9375, longitude: 18.4653 },
      "Newlands": { latitude: -33.9824, longitude: 18.4653 },
      "Rondebosch": { latitude: -33.9624, longitude: 18.4653 },
      "Wynberg": { latitude: -34.0024, longitude: 18.4653 },
      "Kenilworth": { latitude: -33.9824, longitude: 18.4853 },
      "Plumstead": { latitude: -34.0224, longitude: 18.4653 },
      "Bishopscourt": { latitude: -34.0236, longitude: 18.4244 },
      "Tokai": { latitude: -34.0436, longitude: 18.4244 },
      "Bergvliet": { latitude: -34.0436, longitude: 18.4444 },
      "Table View": { latitude: -33.8249, longitude: 18.4841 },
      "Bloubergstrand": { latitude: -33.8049, longitude: 18.4841 },
      "Milnerton": { latitude: -33.8849, longitude: 18.5041 },
      "Bellville": { latitude: -33.9049, longitude: 18.6241 },
      "Durbanville": { latitude: -33.8249, longitude: 18.6441 },
      "Brackenfell": { latitude: -33.8849, longitude: 18.6841 },
      "Hout Bay": { latitude: -34.0436, longitude: 18.3444 },
      "Muizenberg": { latitude: -34.1036, longitude: 18.4644 },
      "Fish Hoek": { latitude: -34.1236, longitude: 18.4444 },
      "Kalk Bay": { latitude: -34.1236, longitude: 18.4444 },
      "Simon's Town": { latitude: -34.1936, longitude: 18.4244 },
      "Lakeside": { latitude: -34.0836, longitude: 18.4644 },
      "Noordhoek": { latitude: -34.1036, longitude: 18.3444 },
      "Kommetjie": { latitude: -34.1236, longitude: 18.3244 },
      "Scarborough": { latitude: -34.1436, longitude: 18.3044 }
    };

    // Return suburb-specific coordinates or city center fallback
    const coords = suburbCoords[suburbName];
    if (coords) return coords;

    // City center fallbacks
    const cityCenters: Record<string, { latitude: number; longitude: number }> = {
      "Cape Town": { latitude: -33.9249, longitude: 18.4241 },
      "Johannesburg": { latitude: -26.2041, longitude: 28.0473 },
      "Pretoria": { latitude: -25.7479, longitude: 28.2293 },
      "Durban": { latitude: -29.8587, longitude: 31.0218 }
    };

    return cityCenters[cityName] || { latitude: -33.9249, longitude: 18.4241 }; // Default to Cape Town
  };

  const geoCoordinates = getSuburbCoordinates(suburb, city);

  // Service-specific price ranges
  const servicePriceRanges = {
    "Regular Cleaning": "R250-R800",
    "Home Cleaning": "R250-R800",
    "Apartment Cleaning": "R200-R600",
    "Deep Cleaning": "R450-R1500",
    "Move-in/Move-out Cleaning": "R980-R2500",
    "Move In/Out & Turnover Cleaning": "R980-R2500",
    "Office Cleaning": "R180-R1200",
    "Commercial Office Cleaning": "R180-R1200",
    "Airbnb Cleaning": "R230-R800",
    "Airbnb Turnover Cleaning": "R230-R800",
    "Window Cleaning": "R150-R500",
    "Home Maintenance Cleaning": "R250-R800",
    "Carpet Cleaning": "R300-R1000",
    "Post-Construction Cleaning": "R1200-R3500"
  };

  // Generate service offers with price ranges
  const serviceOffers = [
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "Regular Cleaning",
        "serviceType": "Home Cleaning",
        "description": "Weekly and bi-weekly housekeeping services"
      },
      "priceRange": servicePriceRanges["Regular Cleaning"],
      "priceCurrency": "ZAR",
      "availability": "https://schema.org/InStock",
      "url": "https://shalean.co.za/services/regular-cleaning"
    },
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "Deep Cleaning",
        "serviceType": "Deep Cleaning",
        "description": "Comprehensive deep cleaning for thorough home reset"
      },
      "priceRange": servicePriceRanges["Deep Cleaning"],
      "priceCurrency": "ZAR",
      "availability": "https://schema.org/InStock",
      "url": "https://shalean.co.za/services/deep-cleaning"
    },
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "Apartment Cleaning",
        "serviceType": "Apartment Cleaning",
        "description": "Specialized cleaning services for apartments and condos"
      },
      "priceRange": servicePriceRanges["Apartment Cleaning"],
      "priceCurrency": "ZAR",
      "availability": "https://schema.org/InStock",
      "url": "https://shalean.co.za/services/apartment-cleaning"
    },
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "Move In/Out Cleaning",
        "serviceType": "Move In/Out & Turnover Cleaning",
        "description": "Professional move-in/out and end of lease cleaning"
      },
      "priceRange": servicePriceRanges["Move In/Out & Turnover Cleaning"],
      "priceCurrency": "ZAR",
      "availability": "https://schema.org/InStock",
      "url": "https://shalean.co.za/services/move-turnover"
    },
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "Office Cleaning",
        "serviceType": "Commercial Office Cleaning",
        "description": "Professional commercial cleaning services for offices"
      },
      "priceRange": servicePriceRanges["Office Cleaning"],
      "priceCurrency": "ZAR",
      "availability": "https://schema.org/InStock",
      "url": "https://shalean.co.za/services/office-cleaning"
    },
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "Airbnb Cleaning",
        "serviceType": "Airbnb Turnover Cleaning",
        "description": "Fast turnover cleaning for short-term rentals"
      },
      "priceRange": servicePriceRanges["Airbnb Cleaning"],
      "priceCurrency": "ZAR",
      "availability": "https://schema.org/InStock",
      "url": "https://shalean.co.za/services/airbnb-cleaning"
    },
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "Window Cleaning",
        "serviceType": "Window Cleaning",
        "description": "Professional window cleaning for crystal clear results"
      },
      "priceRange": servicePriceRanges["Window Cleaning"],
      "priceCurrency": "ZAR",
      "availability": "https://schema.org/InStock",
      "url": "https://shalean.co.za/services/window-cleaning"
    },
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "Home Maintenance",
        "serviceType": "Home Maintenance Cleaning",
        "description": "Regular home maintenance cleaning for ongoing upkeep"
      },
      "priceRange": servicePriceRanges["Home Maintenance Cleaning"],
      "priceCurrency": "ZAR",
      "availability": "https://schema.org/InStock",
      "url": "https://shalean.co.za/services/home-maintenance"
    }
  ];

  // Get GBP URL from environment or use default
  const gbpUrl = process.env.NEXT_PUBLIC_GBP_URL || "https://www.google.com/maps/place/Shalean+Cleaning+Services";

  // Generate structured data for LocalBusiness
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://shalean.co.za/#organization",
    "name": `${businessNameValue} - ${suburb}`,
    "alternateName": "Shalean",
    "image": `https://shalean.co.za/assets/og/location-${suburbSlug}-1200x630.jpg`,
    "logo": "https://shalean.co.za/icon-512.png",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": addressValue,
      "addressLocality": suburb,
      "addressRegion": city === "Cape Town" ? "Western Cape" : city === "Johannesburg" || city === "Pretoria" ? "Gauteng" : "KwaZulu-Natal",
      "addressCountry": "ZA",
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": geoCoordinates.latitude,
        "longitude": geoCoordinates.longitude
      }
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": geoCoordinates.latitude,
      "longitude": geoCoordinates.longitude
    },
    "telephone": phoneNumber,
    "email": emailAddress,
    "url": `https://shalean.co.za/location/${citySlug}/${suburbSlug}`,
    "sameAs": [gbpUrl], // Connect to Google Business Profile
    "priceRange": "R200-R1500", // Overall price range
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Cleaning Services",
      "itemListElement": serviceOffers
    },
    "areaServed": [
      {
        "@type": "City",
        "name": suburb
      },
      {
        "@type": "AdministrativeArea",
        "name": city
      }
    ],
    "serviceType": [
      "Home Cleaning",
      "Apartment Cleaning",
      "Deep Cleaning",
      "Move-in/Move-out Cleaning",
      "Office Cleaning",
      "Airbnb Cleaning",
      "Window Cleaning",
      "Home Maintenance Cleaning"
    ],
    "knowsAbout": [
      `${suburb} house cleaning`,
      `${suburb} apartment cleaning`,
      `${suburb} office cleaning`,
      `${city} deep cleaning`,
      `${area} cleaning services`
    ],
    "openingHours": serviceHoursValue.replace(/–/g, "-"),
    "description": description,
    "hasMap": mapUrl,
    ...(averageRating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": averageRating.toFixed(1),
        "reviewCount": testimonialItems.length,
        "bestRating": "5",
        "worstRating": "1"
      }
    }),
    ...(testimonialItems.length > 0 && {
      "review": testimonialItems.map((testimonial, index) => ({
        "@type": "Review",
        "itemReviewed": {
          "@type": "LocalBusiness",
          "name": "Shalean Cleaning Services",
          "@id": "https://shalean.co.za"
        },
        "author": {
          "@type": "Person",
          "name": testimonial.name || `Customer ${index + 1}`
        },
        "reviewBody": testimonial.content.replace(/[“”]/g, '"'),
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": `${Math.min(Math.max(testimonial.rating ?? 5, 1), 5)}`,
          "bestRating": "5",
          "worstRating": "1"
        }
      }))
    })
  };

  // Generate breadcrumb structured data
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://shalean.co.za"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Service Areas",
        "item": "https://shalean.co.za/location"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": city,
        "item": `https://shalean.co.za/location/${citySlug}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": suburb,
        "item": `https://shalean.co.za/location/${citySlug}/${suburbSlug}`
      }
    ]
  };

  const faqStructuredData =
    faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqItems.map((item) => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.answer
            }
          }))
        }
      : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyStructuredData(structuredData, "LocalBusiness") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyStructuredData(breadcrumbData) }}
      />
      {faqStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: stringifyStructuredData(faqStructuredData, "FAQPage") }}
        />
      )}
      
      <MarketingHeader activeItem="locations" />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-white to-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(58,130,247,0.12),_transparent_65%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:items-center">
            <div>
              <Badge className={`mb-4 flex w-fit items-center gap-2 ${available ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                {available ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Now Servicing {suburb}
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" />
                    Coming Soon
                  </>
                )}
              </Badge>
              <div className="flex items-center gap-2 mb-3 text-gray-600">
                <MapPin className="h-5 w-5" />
                <span>{area}, {city}</span>
              </div>
              <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-6xl leading-tight">
                Cleaning Services in <span className="text-primary">{suburb}</span>
              </h1>
              <p className="text-xl text-gray-600 mb-4 max-w-3xl">
                {tagline ?? description}
              </p>
              {inlineRelatedLinks.length > 0 && (
                <p className="text-sm text-gray-500 mb-8 max-w-3xl">
                  Also serving nearby suburbs including {renderLinkedSuburbs(inlineRelatedLinks)} and additional parts of {city}.
                </p>
              )}
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
                  <Link href="/booking/service/select">
                    Book Your Clean
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg" asChild>
                  <Link href="/contact">
                    Talk to Us
                  </Link>
                </Button>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {trustBadgesToRender.map((badge) => (
                  <div key={badge} className="flex items-center gap-2 rounded-xl border border-primary/10 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-gray-700">{badge}</span>
                  </div>
                ))}
              </div>
              <nav className="mt-10 flex flex-wrap items-center gap-3 text-sm text-gray-500" aria-label="Location page quick links">
                {quickLinkItems.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 font-medium text-gray-600 transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-white shadow-2xl">
                {heroImage ? (
                  <Image
                    src={heroImage}
                    alt={heroImageAlt ?? `Professional cleaning services in ${suburb}, ${city} - Shalean Cleaning Services`}
                    width={720}
                    height={640}
                    className="h-full w-full object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full min-h-[420px] flex-col justify-between bg-gradient-to-br from-primary/10 via-white to-primary/5 p-10">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-primary">Trusted Local Team</p>
                      <h2 className="mt-4 text-3xl font-bold text-gray-900">Expert cleaners ready for every {suburb} home.</h2>
                    </div>
                    <div className="mt-8 grid gap-6">
                      <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-inner backdrop-blur">
                        <p className="text-3xl font-bold text-primary">4.9/5</p>
                        <p className="text-sm text-gray-500">Average rating across {suburb} customers</p>
                      </div>
                      <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-inner backdrop-blur">
                        <p className="text-3xl font-bold text-primary">Same-Day Slots</p>
                        <p className="text-sm text-gray-500">Limited availability in the {area}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {showStickyCta && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-5 pt-4 sm:hidden pointer-events-none">
          <div className="mx-auto flex max-w-sm items-center justify-between gap-3 rounded-full border border-primary/20 bg-white px-4 py-3 shadow-2xl backdrop-blur pointer-events-auto" role="region" aria-label={`Book cleaning in ${suburb}`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Book a clean</p>
              <p className="text-sm text-gray-600">Reserve your {suburb} cleaning slot</p>
            </div>
            <Button size="sm" className="px-4 py-2" asChild>
              <Link href="/booking/service/select">
                <span aria-hidden="true">Book Now</span>
                <span className="sr-only">Book a cleaning appointment in {suburb}</span>
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Contact & Map Section */}
      <section id="contact" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-xl">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                {businessNameValue}
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Local Cleaning Experts in {suburb}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Connect with our friendly support team to book vetted cleaners in {suburb}. We serve homes and offices across the {area}, delivering reliable service backed by a satisfaction guarantee.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Service Area</p>
                    <p className="text-lg text-gray-800">{addressValue}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Call Us</p>
                    <a href={`tel:${phoneNumber.replace(/\s+/g, "")}`} className="text-lg text-gray-800 hover:text-primary transition-colors">
                      {phoneNumber}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Email</p>
                    <a href={`mailto:${emailAddress}`} className="text-lg text-gray-800 hover:text-primary transition-colors">
                      {emailAddress}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Operating Hours</p>
                    <p className="text-lg text-gray-800">{serviceHoursValue}</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-6" asChild>
                  <Link href="/booking/service/select">
                    Book Online
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-6" asChild>
                  <Link href="/contact">
                    Talk to Our Team
                  </Link>
                </Button>
              </div>
            </div>
            <SuburbMap
              mapUrl={mapUrl}
              title={`Map of ${suburb}, ${city}`}
              loadingText={`Loading ${suburb} map...`}
            />
          </div>
        </div>
      </section>

      {/* About Suburb Section - Unique Content */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Professional Cleaning Services in {suburb}, {city}
              </h2>
              <div className="prose prose-lg max-w-none text-gray-600 space-y-4">
                <p>
                  {suburb} is a vibrant neighborhood in the {area} region of {city}, known for its 
                  {suburb.toLowerCase().includes('sea point') ? ' stunning ocean views and cosmopolitan atmosphere' : 
                   suburb.toLowerCase().includes('claremont') ? ' excellent schools and family-friendly environment' :
                   suburb.toLowerCase().includes('constantia') ? ' prestigious estates and wine farms' :
                   suburb.toLowerCase().includes('camps bay') ? ' beautiful beaches and luxury properties' :
                   suburb.toLowerCase().includes('green point') ? ' proximity to the V&A Waterfront and city center' :
                   ' unique character and community feel'}. 
                  Residents and businesses in {suburb} trust Shalean Cleaning Services for reliable, 
                  professional cleaning that fits their busy lifestyles.
                </p>
                <p>
                  Our experienced cleaners understand the specific needs of {suburb} properties, from 
                  {suburb.toLowerCase().includes('sea point') || suburb.toLowerCase().includes('camps bay') ? ' beachfront apartments and holiday rentals' :
                   suburb.toLowerCase().includes('claremont') || suburb.toLowerCase().includes('constantia') ? ' family homes and large estates' :
                   ' residential properties and commercial spaces'}. 
                  We offer flexible scheduling, same-day availability, and eco-friendly cleaning options 
                  to keep your {suburb} property spotless.
                </p>
                <p>
                  Whether you need regular maintenance cleaning, a deep clean before hosting guests, 
                  or move-in/out cleaning services, Shalean's vetted professionals deliver consistent, 
                  high-quality results. Our cleaners are fully insured, background-checked, and trained 
                  to meet the highest standards of cleanliness.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/services/regular-cleaning" className="text-primary hover:text-primary/80 font-semibold underline underline-offset-4">
                  Regular Cleaning Services →
                </Link>
                <Link href="/services/deep-cleaning" className="text-primary hover:text-primary/80 font-semibold underline underline-offset-4">
                  Deep Cleaning Services →
                </Link>
                <Link href="/services/move-turnover" className="text-primary hover:text-primary/80 font-semibold underline underline-offset-4">
                  Move-In/Out Cleaning →
                </Link>
              </div>
            </div>
            <div className="space-y-6">
              <Card className="border border-primary/10 shadow-lg p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Why {suburb} Residents Choose Shalean</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Local knowledge of {suburb} properties and common cleaning challenges</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Flexible scheduling that works around your {suburb} lifestyle</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Same-day and next-day availability for urgent cleaning needs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Eco-friendly cleaning products safe for families and pets</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>100% satisfaction guarantee - we'll return if something's missed</span>
                  </li>
                </ul>
              </Card>
              <Card className="border border-primary/10 shadow-lg p-6 bg-primary/5">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Serving {suburb} and Nearby Areas</h3>
                <p className="text-gray-600 mb-4">
                  We also provide cleaning services in nearby suburbs including {renderLinkedSuburbs(inlineRelatedLinks)}.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/location/${citySlug}`}>
                    View All {city} Service Areas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="why-shalean" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Shalean in {suburb}?
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <Card key={idx} className="border border-primary/10 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-2xl">
                <CardContent className="flex h-full items-start gap-3 p-6">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <p className="text-gray-700 font-medium leading-relaxed">{feature}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Services in {suburb}
            </h2>
            <p className="text-xl text-gray-600">
              Professional cleaning solutions tailored to your needs
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            <Card className="border border-primary/10 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl">
              <CardContent className="flex h-full flex-col p-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Home className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-3">Regular Cleaning</h3>
                <p className="text-gray-600 text-center mb-4">
                  Weekly or bi-weekly home maintenance to keep your space spotless
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Dusting & vacuuming
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Bathroom & kitchen cleaning
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Floor mopping
                  </li>
                </ul>
                <Button variant="outline" className="mt-auto w-full" asChild>
                  <Link href="/services/regular-cleaning">
                    Learn About Regular Cleaning
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-primary/10 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl">
              <CardContent className="flex h-full flex-col p-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-3">Deep Cleaning</h3>
                <p className="text-gray-600 text-center mb-4">
                  Thorough, comprehensive cleaning for every corner of your home
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Behind appliances
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Window & door frames
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Grout & tile deep clean
                  </li>
                </ul>
                <Button variant="outline" className="mt-auto w-full" asChild>
                  <Link href="/services/deep-specialty">
                    Learn About Deep Cleaning
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-primary/10 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl">
              <CardContent className="flex h-full flex-col p-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-3">Move In/Out</h3>
                <p className="text-gray-600 text-center mb-4">
                  Complete cleaning for moving day or property handover
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Empty property cleaning
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Cupboard cleaning
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Deposit back guarantee
                  </li>
                </ul>
                <Button variant="outline" className="mt-auto w-full" asChild>
                  <Link href="/services/move-turnover">
                    Learn About Move-In Cleaning
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What {suburb} Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Recent feedback from homeowners and businesses in the {area}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {testimonialItems.map((testimonial, index) => {
              const ratingValue = Math.min(Math.max(testimonial.rating ?? 5, 1), 5);
              return (
                <Card key={`${testimonial.name}-${index}`} className="border border-primary/10 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl h-full">
                  <CardContent className="p-8 flex h-full flex-col gap-4">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: ratingValue }).map((_, starIdx) => (
                        <Star key={starIdx} className="h-4 w-4 text-amber-500 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 leading-relaxed">{testimonial.content}</p>
                    <div className="mt-auto">
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      {testimonial.location && (
                        <p className="text-sm text-gray-500">{testimonial.location}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Related Services Section */}
      <section id="popular-services" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Popular Services in {suburb}
            </h2>
            <p className="text-xl text-gray-600">
              Choose from our most requested cleaning services
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border border-primary/10 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl">
              <CardContent className="p-6 text-center">
                <Home className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Regular Cleaning</h3>
                <p className="text-gray-600 mb-4">
                  Weekly or bi-weekly maintenance cleaning
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/services/regular-cleaning">
                    Learn About Regular Cleaning
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-primary/10 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Deep Cleaning</h3>
                <p className="text-gray-600 mb-4">
                  Comprehensive cleaning for every corner
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/services/deep-specialty">
                    Learn About Deep Cleaning
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-primary/10 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Move In/Out</h3>
                <p className="text-gray-600 mb-4">
                  Complete cleaning for property transitions
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/services/move-turnover">
                    Learn About Move-In Cleaning
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faqs" className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {suburb} Cleaning FAQs
            </h2>
            <p className="text-lg text-gray-600">
              Answers to common questions about booking vetted cleaners in {suburb}
            </p>
          </div>
          <div className="space-y-6">
            {faqItems.map((faq, index) => (
              <div key={`${faq.question}-${index}`} className="rounded-2xl border border-primary/10 bg-white p-6 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-2xl">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
              Professional Cleaning Services in {suburb}
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 mb-4">
                Shalean Cleaning Services brings professional, reliable cleaning solutions to {suburb}, {city}. With years of experience serving the {area} region, we understand the unique cleaning needs of homes and businesses in this area.
                {aboutRelatedLinks.length > 0 && (
                  <>
                    {" "}We regularly support households in {renderLinkedSuburbs(aboutRelatedLinks)} and surrounding neighbourhoods with flexible scheduling and trusted cleaners close by.
                  </>
                )}
              </p>
              <p className="text-lg text-gray-700 mb-4">
                Our team of vetted, professional cleaners is equipped with eco-friendly cleaning products and industry-standard equipment to deliver exceptional results. Whether you need regular maintenance cleaning, a comprehensive deep clean, or move-in/out services, we have the expertise to meet your requirements.
              </p>
              <p className="text-lg text-gray-700 mb-4">
                We're committed to providing flexible scheduling that works around your lifestyle. Same-day service is available for urgent cleaning needs, and we offer recurring cleaning schedules for regular maintenance. All our services come with a 100% satisfaction guarantee, ensuring peace of mind with every booking.
              </p>
              <p className="text-lg text-gray-700">
                Contact us today to discuss your cleaning needs in {suburb}. Our friendly team is ready to provide a customized quote and answer any questions you may have about our services.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Areas Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              We Also Serve Nearby Areas
            </h2>
            <p className="text-xl text-gray-600">
              Professional cleaning services in surrounding neighborhoods across {city}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {baseRelatedSuburbs
              .slice(0, 8)
              .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <MapPin className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-gray-700 group-hover:text-primary font-medium">
                  {item.name}
                </span>
              </Link>
            ))}
            <Link
              href={`/location/${citySlug}`}
              className="flex items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <MapPin className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-gray-700 group-hover:text-primary font-medium">
                All {city} Areas
              </span>
            </Link>
            <Link
              href="/location"
              className="flex items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <MapPin className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-gray-700 group-hover:text-primary font-medium">
                All Locations
              </span>
            </Link>
            <Link
              href="/services"
              className="flex items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <Home className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-gray-700 group-hover:text-primary font-medium">
                All Services
              </span>
            </Link>
            <Link
              href="/booking/service/select"
              className="flex items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <ArrowRight className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-gray-700 group-hover:text-primary font-medium">
                Book Now
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            {available ? 'Ready to Book Your Cleaning?' : 'Interested in Our Services?'}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {available 
              ? `Get a free quote for professional cleaning services in ${suburb} today!`
              : `Register your interest and be the first to know when we launch in ${suburb}!`
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {available ? (
              <>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
                  <Link href="/booking/service/select">
                    Book Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg" asChild>
                  <Link href="/contact">
                    Contact Us
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
                  <Link href="/contact">
                    <Mail className="mr-2 h-5 w-5" />
                    Register Interest
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg" asChild>
                  <a href="tel:+27871535250">
                    <Phone className="mr-2 h-5 w-5" />
                    +27 87 153 5250
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

