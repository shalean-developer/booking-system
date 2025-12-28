import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { 
  Home, 
  Building, 
  Factory, 
  Sparkles, 
  Droplets,
  ArrowRight
} from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "All Cleaning Service Categories | Shalean",
  description: "Browse all our cleaning service categories including residential, commercial, industrial, specialized, and outdoor cleaning services.",
  canonical: generateCanonical("/category"),
});

const categories = [
  {
    title: 'Residential Cleaning',
    description: 'Services for homes and apartments.',
    icon: Home,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    slug: 'residential-cleaning',
    services: ['Regular Cleaning', 'Deep Cleaning', 'Move In/Out Cleaning', 'Apartment Cleaning', 'Home Maintenance'],
  },
  {
    title: 'Commercial Cleaning',
    description: 'Cleaning for businesses and offices.',
    icon: Building,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    slug: 'commercial-cleaning',
    services: ['Office Cleaning', 'Airbnb Cleaning', 'Regular Commercial Cleaning'],
  },
  {
    title: 'Industrial Cleaning',
    description: 'Heavy-duty and large-scale cleaning.',
    icon: Factory,
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
    slug: 'industrial-cleaning',
    services: ['Post-Construction Cleaning', 'Large-Scale Deep Cleaning', 'Industrial Facility Cleaning'],
  },
  {
    title: 'Specialized Cleaning',
    description: 'Targeted services for specific needs.',
    icon: Sparkles,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    slug: 'specialized-cleaning',
    services: ['Carpet Cleaning', 'Window Cleaning', 'One-Time Cleaning', 'Deep Specialty Cleaning'],
  },
  {
    title: 'Outdoor & Exterior Cleaning',
    description: 'Cleaning services for outdoor areas.',
    icon: Droplets,
    bgColor: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    slug: 'outdoor-exterior-cleaning',
    services: ['Window Cleaning', 'Outdoor Area Cleaning', 'Exterior Surface Cleaning'],
  },
];

export default function AllCategoriesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main id="main-content">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-primary/5 to-white" aria-label="All categories">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                Our Category
              </Badge>
              <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">
                All Cleaning <span className="text-primary">Categories</span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
                Explore our comprehensive range of cleaning service categories. From residential to industrial, 
                we provide professional cleaning solutions for every need.
              </p>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-20" aria-label="Service categories">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {categories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <Link key={index} href={`/category/${category.slug}`} className="block">
                    <Card
                      className={`${category.bgColor} border border-transparent rounded-2xl shadow-sm hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer relative overflow-hidden h-full`}
                    >
                      <CardContent className="p-6 sm:p-8 relative h-full flex flex-col">
                        {/* Arrow Button - Top Right */}
                        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors z-10">
                          <ArrowRight className="h-4 w-4 text-gray-700" />
                        </div>

                        {/* Icon */}
                        <div className="mb-6 flex justify-center">
                          <div className={`w-16 h-16 rounded-lg ${category.bgColor} flex items-center justify-center border-2 border-gray-900`}>
                            <Icon className={`h-8 w-8 ${category.iconColor} stroke-[2]`} />
                          </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 text-center">
                          {category.title}
                        </h2>

                        {/* Description */}
                        <p className="text-base text-gray-600 leading-relaxed text-center mb-4">
                          {category.description}
                        </p>

                        {/* Services List */}
                        <div className="mt-auto pt-4 border-t border-gray-200">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Services include:</p>
                          <ul className="space-y-1">
                            {category.services.slice(0, 3).map((service, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-center">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                                {service}
                              </li>
                            ))}
                            {category.services.length > 3 && (
                              <li className="text-sm text-primary font-medium">
                                +{category.services.length - 3} more services
                              </li>
                            )}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/20" aria-label="Call to action">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Ready to Book Your Service?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Get started with our easy booking process and enjoy a spotless space.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
              <Link href="/booking/service/select">
                Book Cleaning Service Now
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

