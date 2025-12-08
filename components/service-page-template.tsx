import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { InternalLinking } from "@/components/internal-linking";
import { GBPWidget } from "@/components/gbp-widget";
import { stringifyStructuredData } from "@/lib/structured-data-validator";
import { generateServiceLocalBusinessSchema } from "@/lib/gbp-schema";
import { 
  CheckCircle,
  ArrowRight,
  Star,
  Clock,
  Shield,
  Users,
  Home,
  Building,
  Calendar,
  Sparkles
} from "lucide-react";

interface ServicePageProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  pricing: string;
  pricingNote?: string;
  highlights: string[];
  serviceType: string;
  slug: string;
  color: string;
  iconColor: string;
  faqs?: Array<{ question: string; answer: string }>;
  relatedServices?: Array<{ title: string; href: string; description?: string }>;
  gbpUrl?: string;
  reviewLink?: string;
}

export function ServicePageTemplate({
  title,
  description,
  icon: Icon,
  features,
  pricing,
  pricingNote,
  highlights,
  serviceType,
  slug,
  color,
  iconColor,
  faqs = [],
  relatedServices = [],
  gbpUrl = "https://www.google.com/maps/place/Shalean+Cleaning+Services",
  reviewLink,
}: ServicePageProps) {
  // Enhanced Service schema with better areaServed
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": title,
    "description": description,
    "serviceType": serviceType,
    "provider": {
      "@type": "LocalBusiness",
      "@id": "https://shalean.co.za/#organization",
      "name": "Shalean Cleaning Services",
      "url": "https://shalean.co.za",
      "telephone": "+27 87 153 5250",
      "email": "support@shalean.co.za"
    },
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
    "offers": {
      "@type": "Offer",
      "priceRange": pricing.includes("From") ? pricing.replace("From ", "") : pricing,
      "priceCurrency": "ZAR",
      "availability": "https://schema.org/InStock",
      "url": `https://shalean.co.za/services/${slug}`
    },
    "url": `https://shalean.co.za/services/${slug}`,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "500",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  // FAQ schema if FAQs are provided
  const faqSchema = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  // LocalBusiness schema with GBP integration
  const localBusinessSchema = generateServiceLocalBusinessSchema({
    serviceName: title,
    serviceType: serviceType,
    pageUrl: `https://shalean.co.za/services/${slug}`,
    gbpUrl: gbpUrl,
    description: description,
    pricing: pricing,
  });

  // Breadcrumb items
  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: title, href: `/services/${slug}` }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Service Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyStructuredData(serviceSchema, "Service") }}
      />
      
      {/* FAQ Schema */}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: stringifyStructuredData(faqSchema, "FAQPage") }}
        />
      )}
      
      {/* LocalBusiness Schema with GBP */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyStructuredData(localBusinessSchema, "LocalBusiness") }}
      />
      
      <Header />
      
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Professional Service
            </Badge>
            <div className={`w-20 h-20 rounded-full ${color} flex items-center justify-center mx-auto mb-6`}>
              <Icon className={`h-10 w-10 ${iconColor}`} />
            </div>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">
              {title}
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
                <Link href="/booking/service/select">
                  Book Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg" asChild>
                <Link href="/booking/quote">
                  Get Quote
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What's Included
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive cleaning services tailored to your needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <p className="text-gray-700 font-medium">{feature}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our {title}?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((highlight, idx) => (
              <Card key={idx} className="border-0 shadow-lg text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-gray-700 font-medium">{highlight}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Description Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
              Comprehensive {title} Services
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 mb-4">
                Our {title.toLowerCase()} service is designed to meet the highest standards of cleanliness and professionalism. We understand that every space is unique, and our trained team adapts their approach to ensure optimal results for your specific needs. Whether you're in a modern apartment in <Link href="/location/cape-town/sea-point" className="text-primary hover:underline font-medium">Sea Point</Link>, a family home in <Link href="/location/cape-town/claremont" className="text-primary hover:underline font-medium">Claremont</Link>, or a luxury estate in <Link href="/location/cape-town/constantia" className="text-primary hover:underline font-medium">Constantia</Link>, we tailor our cleaning approach to match your property type and lifestyle.
              </p>
              <p className="text-lg text-gray-700 mb-4">
                {description} Our commitment to excellence means we use only premium <Link href="/blog/the-benefits-of-eco-friendly-cleaning-products" className="text-primary hover:underline font-medium">eco-friendly cleaning products</Link> that are both effective and safe for your family, pets, and the environment. Each cleaning session is thoroughly planned and executed with attention to detail. Our professional cleaners are fully trained, background-checked, and insured, giving you complete peace of mind when they're in your home or office.
              </p>
              <p className="text-lg text-gray-700 mb-4">
                When you book our {title.toLowerCase()} service, you can expect punctual arrival, respectful and professional service, and a thorough cleaning that exceeds expectations. We stand behind our work with a 100% satisfaction guarantee—if you're not completely happy, we'll return to make it right at no additional cost. Our team understands the importance of maintaining a clean, healthy environment, especially in high-traffic areas like <Link href="/location/cape-town/camps-bay" className="text-primary hover:underline font-medium">Camps Bay</Link> vacation rentals or busy <Link href="/location/cape-town/green-point" className="text-primary hover:underline font-medium">Green Point</Link> offices.
              </p>
              <p className="text-lg text-gray-700 mb-4">
                Our {title.toLowerCase()} service is available throughout <Link href="/location/cape-town" className="text-primary hover:underline font-medium">Cape Town</Link>, including popular areas like <Link href="/location/cape-town/sea-point" className="text-primary hover:underline font-medium">Sea Point</Link>, <Link href="/location/cape-town/claremont" className="text-primary hover:underline font-medium">Claremont</Link>, <Link href="/location/cape-town/constantia" className="text-primary hover:underline font-medium">Constantia</Link>, and <Link href="/location/cape-town/camps-bay" className="text-primary hover:underline font-medium">Camps Bay</Link>. We also serve <Link href="/location/johannesburg" className="text-primary hover:underline font-medium">Johannesburg</Link>, <Link href="/location/pretoria" className="text-primary hover:underline font-medium">Pretoria</Link>, and <Link href="/location/durban" className="text-primary hover:underline font-medium">Durban</Link> with the same high-quality standards. Our flexible scheduling means we can accommodate same-day requests, recurring appointments, or one-time deep cleans to fit your busy schedule.
              </p>
              <p className="text-lg text-gray-700 mb-4">
                What sets our {title.toLowerCase()} service apart is our attention to detail and commitment to customer satisfaction. We take the time to understand your specific needs, whether that's focusing on high-traffic areas, using particular cleaning products, or accommodating pets and children. Our cleaners arrive fully equipped with professional-grade supplies and equipment, so you don't need to provide anything. We're also happy to work around your schedule, offering early morning, evening, or weekend appointments when needed.
              </p>
              <p className="text-lg text-gray-700">
                Whether you're looking for a one-time deep clean, regular maintenance, or specialized cleaning for a particular occasion, our {title.toLowerCase()} service is flexible and can be customized to your schedule and requirements. Contact us today to discuss your needs and get a personalized quote. We're here to help you maintain a spotless home or office that you can be proud of.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Available Throughout South Africa
            </h2>
            <p className="text-xl text-gray-600">
              Our {title.toLowerCase()} service is available in major cities across South Africa
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/location/cape-town" className="text-center p-6 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">Cape Town</h3>
              <p className="text-sm text-gray-600">Sea Point, Camps Bay, Claremont & more</p>
            </Link>
            <Link href="/location/johannesburg" className="text-center p-6 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">Johannesburg</h3>
              <p className="text-sm text-gray-600">Sandton, Rosebank, Fourways & more</p>
            </Link>
            <Link href="/location/pretoria" className="text-center p-6 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">Pretoria</h3>
              <p className="text-sm text-gray-600">Centurion, Menlyn, Lynnwood & more</p>
            </Link>
            <Link href="/location/durban" className="text-center p-6 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">Durban</h3>
              <p className="text-sm text-gray-600">Umhlanga, Ballito, Morningside & more</p>
            </Link>
          </div>
          <div className="text-center mt-8">
            <Link href="/location">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                View All Service Locations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Transparent Pricing
          </h2>
          <div className="bg-gradient-to-r from-primary/10 to-primary/20 rounded-2xl p-8">
            <div className="text-5xl font-bold text-primary mb-4">{pricing}</div>
            <p className="text-xl text-gray-600 mb-6">
              Starting price for {serviceType.toLowerCase()}
            </p>
            {pricingNote && (
              <p className="text-gray-500 mb-6">{pricingNote}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Common questions about our {title.toLowerCase()} service
              </p>
            </div>
            <div className="space-y-6">
              {faqs.map((faq, idx) => (
                <Card key={idx} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Services Section */}
      {relatedServices.length > 0 && (
        <InternalLinking
          type="service"
          currentPage={slug}
          relatedLinks={relatedServices}
          title="Related Services"
          description="Explore other professional cleaning services we offer"
        />
      )}

      {/* Related Articles Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Learn More About Cleaning
            </h2>
            <p className="text-lg text-gray-600">
              Explore our expert guides and tips for maintaining a clean home
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {slug === 'deep-cleaning' && (
              <>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      <Link href="/blog/deep-cleaning-cape-town" className="hover:text-primary transition-colors">
                        Deep Cleaning Guide for Cape Town
                      </Link>
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Complete guide to deep cleaning your Cape Town home with expert tips and room-by-room checklists.
                    </p>
                    <Link href="/blog/deep-cleaning-cape-town">
                      <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0">
                        Read Guide <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      <Link href="/blog/10-essential-deep-cleaning-tips-for-every-home" className="hover:text-primary transition-colors">
                        10 Essential Deep Cleaning Tips
                      </Link>
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Master deep cleaning with expert tips covering sanitizing high-touch areas and refreshing appliances.
                    </p>
                    <Link href="/blog/10-essential-deep-cleaning-tips-for-every-home">
                      <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0">
                        Read Tips <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      <Link href="/blog/the-benefits-of-eco-friendly-cleaning-products" className="hover:text-primary transition-colors">
                        Eco-Friendly Cleaning Products
                      </Link>
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Learn why eco-friendly cleaning products are better for your health, home, and environment.
                    </p>
                    <Link href="/blog/the-benefits-of-eco-friendly-cleaning-products">
                      <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0">
                        Read Article <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </>
            )}
            {slug === 'airbnb-cleaning' && (
              <>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      <Link href="/blog/airbnb-cleaning-checklist" className="hover:text-primary transition-colors">
                        Complete Airbnb Cleaning Checklist
                      </Link>
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Master the art of Airbnb turnover cleaning with our comprehensive checklist for 5-star reviews.
                    </p>
                    <Link href="/blog/airbnb-cleaning-checklist">
                      <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0">
                        Read Checklist <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      <Link href="/blog/deep-cleaning-cape-town" className="hover:text-primary transition-colors">
                        Deep Cleaning Guide
                      </Link>
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Ensure thorough cleaning between guests with our comprehensive deep cleaning guide.
                    </p>
                    <Link href="/blog/deep-cleaning-cape-town">
                      <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0">
                        Read Guide <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      <Link href="/blog/the-benefits-of-eco-friendly-cleaning-products" className="hover:text-primary transition-colors">
                        Eco-Friendly Cleaning Products
                      </Link>
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Use safe, eco-friendly products that guests appreciate and that protect your property.
                    </p>
                    <Link href="/blog/the-benefits-of-eco-friendly-cleaning-products">
                      <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0">
                        Read Article <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </>
            )}
            {(slug === 'regular-cleaning' || slug === 'home-maintenance') && (
              <>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      <Link href="/blog/10-essential-deep-cleaning-tips-for-every-home" className="hover:text-primary transition-colors">
                        10 Essential Deep Cleaning Tips
                      </Link>
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Learn expert tips for maintaining a spotless home between regular cleaning sessions.
                    </p>
                    <Link href="/blog/10-essential-deep-cleaning-tips-for-every-home">
                      <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0">
                        Read Tips <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      <Link href="/blog/the-benefits-of-eco-friendly-cleaning-products" className="hover:text-primary transition-colors">
                        Eco-Friendly Cleaning Products
                      </Link>
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Discover why eco-friendly cleaning products are better for your health and environment.
                    </p>
                    <Link href="/blog/the-benefits-of-eco-friendly-cleaning-products">
                      <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0">
                        Read Article <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      <Link href="/blog/deep-cleaning-cape-town" className="hover:text-primary transition-colors">
                        Deep Cleaning Guide
                      </Link>
                    </h3>
                    <p className="text-gray-600 mb-4">
                      When regular cleaning isn't enough, learn when and how to do a thorough deep clean.
                    </p>
                    <Link href="/blog/deep-cleaning-cape-town">
                      <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0">
                        Read Guide <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Google Business Profile Widget */}
      <GBPWidget
        gbpUrl={gbpUrl}
        reviewLink={reviewLink}
        rating={5.0}
        reviewCount={500}
      />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Book Your {title}?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Experience professional cleaning services with guaranteed satisfaction.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
              <Link href="/booking/service/select">
                Book Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg" asChild>
              <Link href="/services">
                View All Services
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
