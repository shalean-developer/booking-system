"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { 
  Sparkles, 
  Home, 
  CheckCircle, 
  Clock, 
  Users, 
  Award, 
  Star, 
  BookOpen,
  Shield,
  BarChart3,
  GraduationCap,
  Calendar,
  User,
  ArrowRight,
  Instagram,
  Mail,
  Phone,
  MapPin,
  Building,
  ClipboardList
} from "lucide-react";

export default function HomePage() {
  // Structured data for SEO
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
    <div className="min-h-screen bg-white">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
            <div className="mb-3 sm:mb-4">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
                Professional Cleaning Excellence
              </Badge>
            </div>
            <h1 className="mb-4 sm:mb-6 text-3xl font-bold text-gray-900 sm:text-5xl lg:text-7xl">
              Professional Cleaning
              <br />
              <span className="text-primary">Made Simple</span>
            </h1>
            <p className="mx-auto mb-6 sm:mb-8 max-w-3xl text-base sm:text-lg lg:text-xl text-gray-600">
              Book vetted, professional cleaners in minutes. Flexible scheduling, eco-friendly products, 
              and 100% satisfaction guarantee—every single time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg" asChild>
                <Link href="/booking/service/select">
                  Book a service
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 rounded-full px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg" asChild>
                <Link href="/booking/service/select">
                  Get Free Quote
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Key Statistics */}
          <div className="mt-12 sm:mt-16 lg:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Happy Customers */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-gray-700" />
              </div>
              <div className="text-3xl font-bold text-gray-900">500 +</div>
              <div className="text-sm text-gray-600">Happy Customers</div>
            </div>

            {/* Card 2: Satisfaction Rate */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-gray-700" />
              </div>
              <div className="text-3xl font-bold text-gray-900">98%</div>
              <div className="text-sm text-gray-600">Satisfaction Rate</div>
            </div>

            {/* Card 3: Expert Cleaners */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="h-6 w-6 text-gray-700" />
              </div>
              <div className="text-3xl font-bold text-gray-900">50 +</div>
              <div className="text-sm text-gray-600">Expert Cleaners</div>
            </div>

            {/* Card 4: Service Types */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-gray-700" />
              </div>
              <div className="text-3xl font-bold text-gray-900">100 +</div>
              <div className="text-sm text-gray-600">Service Types</div>
            </div>
          </div>
        </div>
      </section>

      {/* Flagship Services Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div>
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 sm:mb-4 text-xs sm:text-sm">
                Most Booked Services
              </Badge>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Experience Our Most Booked Services
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
                Comprehensive cleaning solutions designed to transform your space 
                from ordinary to extraordinary through meticulous attention to detail.
              </p>
              <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900">Standard Cleaning</h3>
                    <p className="text-sm sm:text-base text-gray-600">Regular maintenance cleaning to keep your space fresh and organized.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900">Deep Cleaning</h3>
                    <p className="text-sm sm:text-base text-gray-600">Thorough cleaning sessions that tackle every corner and surface.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900">Airbnb Cleaning</h3>
                    <p className="text-sm sm:text-base text-gray-600">Professional turnover cleaning to ensure guest-ready perfection.</p>
                  </div>
                </div>
              </div>
              <Link href="/services">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  Explore All Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div>
              <div className="relative">
                <div className="rounded-lg overflow-hidden h-64 sm:h-80 lg:h-96 bg-gray-100 relative">
                  <Image
                    src="/images/cleaning-team-hero.jpg"
                    alt="Professional cleaning team working in a modern kitchen"
                    width={800}
                    height={600}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 bg-white rounded-lg p-3 sm:p-4 shadow-lg">
                  <div className="flex justify-between items-center gap-2">
                    <div>
                      <div className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900">100+ Hours</div>
                      <div className="text-xs sm:text-sm text-gray-600">of Cleaning Experience</div>
                    </div>
                    <div>
                      <div className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900">24/7</div>
                      <div className="text-xs sm:text-sm text-gray-600">Customer Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 sm:mb-4 text-xs sm:text-sm">
              Why Choose Shalean
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Everything You Need for a Spotless Home
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              From residential to commercial spaces, we provide comprehensive cleaning 
              solutions and tools for every type of property.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <Card className="text-center p-4 sm:p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="mb-4 sm:mb-6 mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-4">Expert-Led Services</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Learn from industry professionals with decades of cleaning experience and training.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-4 sm:p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="mb-4 sm:mb-6 mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-4">Eco-Friendly Products</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Leverage cutting-edge green technology to enhance your living environment.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-4 sm:p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="mb-4 sm:mb-6 mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-4">Insured & Bonded</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Master the art of protecting your property with our comprehensive insurance coverage.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-4 sm:p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="mb-4 sm:mb-6 mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-4">Quality Guarantee</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Get satisfaction guarantee and quality assurance with every service.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Service Offerings Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 sm:mb-4 text-xs sm:text-sm">
              Our Services
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Choose Your Cleaning Solution
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              Explore our comprehensive range of professional cleaning services and solutions.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-40 sm:h-48 relative bg-gradient-to-br from-primary/20 to-primary/40">
                <Image
                  src="/images/home-maintenance.jpg"
                  alt="Home maintenance cleaning service"
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Home className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-2 opacity-80" />
                    <p className="text-sm sm:text-base font-medium">Home Maintenance</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Home Maintenance</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Regular home cleaning for ongoing upkeep. Ideal for one-off or recurring visits.
                </p>
                <Link href="/services/home-maintenance">
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 text-sm sm:text-base" aria-label="Learn more about Home Maintenance">
                    Learn More
                    <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-40 sm:h-48 relative bg-gradient-to-br from-blue-100 to-blue-200">
                <Image
                  src="/images/deep-specialty.jpg"
                  alt="Deep cleaning and specialty services"
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Building className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-2 opacity-80" />
                    <p className="text-sm sm:text-base font-medium">Deep & Specialty</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Deep & Specialty</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Intensive or focused cleaning such as deep cleans, carpets & upholstery, and other specialty tasks.
                </p>
                <Link href="/services/deep-specialty">
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 text-sm sm:text-base" aria-label="Learn more about Deep & Specialty">
                    Learn More
                    <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-40 sm:h-48 relative bg-gradient-to-br from-green-100 to-green-200">
                <Image
                  src="/images/move-turnover.jpg"
                  alt="Move in/out and turnover cleaning services"
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Calendar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-2 opacity-80" />
                    <p className="text-sm sm:text-base font-medium">Move & Turnover</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Move & Turnover</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Move-in/out and Airbnb turnover cleans for transitions and guest changeovers.
                </p>
                <Link href="/services/move-turnover">
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 text-sm sm:text-base" aria-label="Learn more about Move & Turnover">
                    Learn More
                    <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 sm:mb-4 text-xs sm:text-sm">
              Meet Our Team
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Meet Our Team
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Our expert team leads by example, delivering exceptional cleaning services with care and professionalism.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <Card className="text-center p-4 sm:p-6 border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full mx-auto mb-3 sm:mb-4 overflow-hidden">
                  <Image
                    src="/images/team-normatter.webp"
                    alt="Normatter - Cleaning Expert"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Normatter</h3>
                <div className="text-sm text-gray-600">
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border-l-4 border-primary">
                    <p className="italic mb-2 text-xs sm:text-sm">&ldquo;Normatter&apos;s team transformed our office completely. The attention to detail and eco-friendly approach exceeded our expectations. Highly recommend!&rdquo;</p>
                    <p className="text-xs text-gray-500 font-medium">- Sarah M., Corporate Client</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="text-center p-4 sm:p-6 border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full mx-auto mb-3 sm:mb-4 overflow-hidden">
                  <Image
                    src="/images/team-lucia.webp"
                    alt="Lucia - Commercial Cleaning Expert"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Lucia</h3>
                <div className="text-sm text-gray-600">
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border-l-4 border-primary">
                    <p className="italic mb-2 text-xs sm:text-sm">&ldquo;Lucia&apos;s commercial cleaning service is outstanding. Our restaurant has never looked cleaner. Professional, reliable, and thorough every time.&rdquo;</p>
                    <p className="text-xs text-gray-500 font-medium">- David K., Restaurant Owner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="text-center p-4 sm:p-6 border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full mx-auto mb-3 sm:mb-4 overflow-hidden">
                  <Image
                    src="/images/team-nyasha.webp"
                    alt="Nyasha - Residential Cleaning Expert"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Nyasha</h3>
                <div className="text-sm text-gray-600">
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border-l-4 border-primary">
                    <p className="italic mb-2 text-xs sm:text-sm">&ldquo;Nyasha&apos;s residential cleaning is exceptional. My home feels brand new after every visit. Trustworthy, efficient, and incredibly thorough.&rdquo;</p>
                    <p className="text-xs text-gray-500 font-medium">- Jennifer L., Homeowner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* As Featured In Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">As Featured In</h2>
            <p className="text-base sm:text-lg text-gray-600">
              Leading publications have recognized our commitment to excellence.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 opacity-60">
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-400">CLEANING TIMES</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-400">HOME MAGAZINE</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-400">BUSINESS WEEKLY</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-400">LOCAL NEWS</div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 sm:mb-4 text-xs sm:text-sm">
              Latest Insights
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Cleaning Tips & Industry News
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              Stay informed with our latest cleaning tips, industry insights, and expert advice for maintaining a spotless space.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-40 sm:h-48 relative bg-gradient-to-br from-primary/20 to-primary/40">
                <Image
                  src="/images/deep-specialty.jpg"
                  alt="Deep cleaning tips and techniques"
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Badge variant="outline" className="text-xs">Cleaning Tips</Badge>
                  <span className="text-xs text-gray-500">5 min read</span>
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                  10 Essential Deep Cleaning Tips for Every Home
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  Discover professional techniques to deep clean your home like an expert, from kitchen to bathroom.
                </p>
                <Link href="/blog/deep-cleaning-tips">
                  <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0 text-sm sm:text-base">
                    Read More
                    <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-40 sm:h-48 relative bg-gradient-to-br from-blue-100 to-blue-200">
                <Image
                  src="/images/home-maintenance.jpg"
                  alt="Eco-friendly cleaning products"
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Badge variant="outline" className="text-xs">Sustainability</Badge>
                  <span className="text-xs text-gray-500">4 min read</span>
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                  The Benefits of Eco-Friendly Cleaning Products
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  Learn why switching to eco-friendly cleaning products is better for your health and the environment.
                </p>
                <Link href="/blog/eco-friendly-products">
                  <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0 text-sm sm:text-base">
                    Read More
                    <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-40 sm:h-48 relative bg-gradient-to-br from-green-100 to-green-200">
                <Image
                  src="/images/move-turnover.jpg"
                  alt="Airbnb cleaning checklist"
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Badge variant="outline" className="text-xs">Airbnb Hosts</Badge>
                  <span className="text-xs text-gray-500">6 min read</span>
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                  Complete Airbnb Turnover Cleaning Checklist
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  Master the art of Airbnb turnover with our comprehensive cleaning checklist for 5-star reviews.
                </p>
                <Link href="/blog/airbnb-cleaning-checklist">
                  <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0 text-sm sm:text-base">
                    Read More
                    <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          <div className="text-center">
            <Link href="/blog">
              <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base">
                View All Articles
                <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-primary/10 to-primary/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Ready to Experience Spotless Living?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8">
            Join thousands of satisfied customers who have transformed their spaces with Shalean Cleaning.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg" asChild>
              <Link href="/booking/service/select">
                Book a service
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 bg-white rounded-full px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg" asChild>
              <Link href="/booking/service/select">
                Get Free Quote
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 mb-8 sm:mb-12">
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded flex items-center justify-center">
                  <span className="text-white font-bold text-base sm:text-lg">S</span>
                </div>
                <span className="text-lg sm:text-xl font-bold">Shalean Cleaning</span>
              </div>
              <p className="text-sm sm:text-base text-gray-400 max-w-md">
                Professional cleaning services and solutions helping homeowners and businesses 
                maintain pristine, healthy environments.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 sm:gap-8">
              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Services</h3>
                <div className="space-y-1.5 sm:space-y-2">
                  <Link href="/services/deep-specialty" className="block text-sm sm:text-base text-gray-400 hover:text-white">Deep Specialty Cleaning</Link>
                  <Link href="/services/home-maintenance" className="block text-sm sm:text-base text-gray-400 hover:text-white">Home Maintenance</Link>
                  <Link href="/services/move-turnover" className="block text-sm sm:text-base text-gray-400 hover:text-white">Move-in/Turnover</Link>
                  <Link href="/booking/service/select" className="block text-sm sm:text-base text-gray-400 hover:text-white">Book Service</Link>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Company</h3>
                <div className="space-y-1.5 sm:space-y-2">
                  <Link href="/about" className="block text-sm sm:text-base text-gray-400 hover:text-white">About Us</Link>
                  <Link href="/team" className="block text-sm sm:text-base text-gray-400 hover:text-white">Our Team</Link>
                  <Link href="/contact" className="block text-sm sm:text-base text-gray-400 hover:text-white">Contact Us</Link>
                  <Link href="/careers" className="block text-sm sm:text-base text-gray-400 hover:text-white">Careers</Link>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h3>
                <div className="space-y-1.5 sm:space-y-2">
                  <Link href="/terms" className="block text-sm sm:text-base text-gray-400 hover:text-white">Terms & Conditions</Link>
                  <Link href="/privacy" className="block text-sm sm:text-base text-gray-400 hover:text-white">Privacy Policy</Link>
                  <Link href="/cancellation" className="block text-sm sm:text-base text-gray-400 hover:text-white">Cancellation Policy</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
              © 2025 Shalean Cleaning Services. All rights reserved.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center">
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

