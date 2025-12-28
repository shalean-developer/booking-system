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
  ArrowRight,
  CheckCircle
} from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";
import { notFound } from "next/navigation";

const categoryData: Record<string, {
  title: string;
  description: string;
  longDescription: string;
  icon: typeof Home;
  bgColor: string;
  iconColor: string;
  services: Array<{
    title: string;
    href: string;
    description: string;
    pricing: string;
  }>;
  highlights: string[];
}> = {
  'residential-cleaning': {
    title: 'Residential Cleaning',
    description: 'Services for homes and apartments.',
    longDescription: 'Professional residential cleaning services designed to keep your home fresh, clean, and comfortable. Our expert cleaners provide comprehensive solutions for all your household cleaning needs.',
    icon: Home,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    services: [
      {
        title: 'Regular Cleaning',
        href: '/services/regular-cleaning',
        description: 'Weekly or bi-weekly maintenance cleaning to keep your home fresh.',
        pricing: 'From R250'
      },
      {
        title: 'Deep Cleaning',
        href: '/services/deep-cleaning',
        description: 'Comprehensive deep cleaning for thorough home reset.',
        pricing: 'From R450'
      },
      {
        title: 'Move In/Out Cleaning',
        href: '/services/move-turnover',
        description: 'Complete cleaning for property transitions.',
        pricing: 'From R980'
      },
      {
        title: 'Apartment Cleaning',
        href: '/services/apartment-cleaning',
        description: 'Specialized cleaning for apartments and condos.',
        pricing: 'From R200'
      },
      {
        title: 'Home Maintenance',
        href: '/services/home-maintenance',
        description: 'Ongoing maintenance cleaning to keep your home spotless.',
        pricing: 'From R300'
      },
    ],
    highlights: [
      'Flexible scheduling options',
      'Eco-friendly cleaning products',
      'Insured and bonded cleaners',
      '100% satisfaction guarantee',
      'Same-day service available'
    ]
  },
  'commercial-cleaning': {
    title: 'Commercial Cleaning',
    description: 'Cleaning for businesses and offices.',
    longDescription: 'Professional commercial cleaning services to maintain a clean and professional business environment. We help businesses create a positive impression with spotless offices and workspaces.',
    icon: Building,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    services: [
      {
        title: 'Office Cleaning',
        href: '/services/office-cleaning',
        description: 'Professional cleaning for offices and workplaces.',
        pricing: 'From R180'
      },
      {
        title: 'Airbnb Cleaning',
        href: '/services/airbnb-cleaning',
        description: 'Fast turnover cleaning for short-term rentals.',
        pricing: 'From R230'
      },
    ],
    highlights: [
      'Flexible scheduling for business hours',
      'Commercial-grade equipment',
      'Trained commercial cleaning staff',
      'Consistent quality service',
      'Customized cleaning plans'
    ]
  },
  'industrial-cleaning': {
    title: 'Industrial Cleaning',
    description: 'Heavy-duty and large-scale cleaning.',
    longDescription: 'Heavy-duty industrial cleaning services for large facilities, warehouses, and post-construction sites. Our team handles large-scale projects with professional equipment and expertise.',
    icon: Factory,
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
    services: [
      {
        title: 'Post-Construction Cleaning',
        href: '/services/post-construction-cleaning',
        description: 'Complete cleaning after construction or renovation projects.',
        pricing: 'Custom Quote'
      },
      {
        title: 'Deep Cleaning',
        href: '/services/deep-cleaning',
        description: 'Comprehensive deep cleaning for large spaces.',
        pricing: 'From R450'
      },
    ],
    highlights: [
      'Large-scale project expertise',
      'Industrial-grade equipment',
      'Safety-certified cleaners',
      'Flexible scheduling',
      'Customized service plans'
    ]
  },
  'specialized-cleaning': {
    title: 'Specialized Cleaning',
    description: 'Targeted services for specific needs.',
    longDescription: 'Specialized cleaning services tailored to your unique needs. From carpet cleaning to window cleaning, we provide targeted solutions for specific cleaning challenges.',
    icon: Sparkles,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    services: [
      {
        title: 'Carpet Cleaning',
        href: '/services/carpet-cleaning',
        description: 'Professional carpet and rug cleaning services.',
        pricing: 'Custom Quote'
      },
      {
        title: 'Window Cleaning',
        href: '/services/window-cleaning',
        description: 'Streak-free window cleaning for crystal clear results.',
        pricing: 'From R150'
      },
      {
        title: 'One-Time Cleaning',
        href: '/services/one-time-cleaning',
        description: 'Single deep cleaning service for special occasions.',
        pricing: 'Custom Quote'
      },
    ],
    highlights: [
      'Specialized equipment and techniques',
      'Expert-trained cleaners',
      'Targeted solutions',
      'Quality guaranteed',
      'Flexible service options'
    ]
  },
  'outdoor-exterior-cleaning': {
    title: 'Outdoor & Exterior Cleaning',
    description: 'Cleaning services for outdoor areas.',
    longDescription: 'Professional outdoor and exterior cleaning services to keep your property looking its best. From windows to outdoor surfaces, we handle all your exterior cleaning needs.',
    icon: Droplets,
    bgColor: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    services: [
      {
        title: 'Window Cleaning',
        href: '/services/window-cleaning',
        description: 'Interior and exterior window cleaning for crystal clear views.',
        pricing: 'From R150'
      },
    ],
    highlights: [
      'Exterior surface expertise',
      'Weather-resistant solutions',
      'Safety equipment for high areas',
      'Eco-friendly outdoor products',
      'Regular maintenance programs'
    ]
  },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryData[slug];
  
  if (!category) {
    return createMetadata({
      title: "Category Not Found | Shalean",
    });
  }

  return createMetadata({
    title: `${category.title} Services | Shalean`,
    description: category.longDescription,
    canonical: generateCanonical(`/category/${slug}`),
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = categoryData[slug];

  if (!category) {
    notFound();
  }

  const Icon = category.icon;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main id="main-content">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-primary/5 to-white" aria-label={category.title}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                Our Category
              </Badge>
              <div className="flex justify-center mb-6">
                <div className={`w-20 h-20 rounded-lg ${category.bgColor} flex items-center justify-center border-2 border-gray-900`}>
                  <Icon className={`h-10 w-10 ${category.iconColor} stroke-[2]`} />
                </div>
              </div>
              <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">
                {category.title} <span className="text-primary">Services</span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
                {category.longDescription}
              </p>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20" aria-label={`${category.title} services`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Available Services
              </h2>
              <p className="text-xl text-gray-600">
                Choose from our range of {category.title.toLowerCase()} services
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {category.services.map((service, index) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">{service.title}</h3>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Starting at</div>
                        <div className="text-2xl font-bold text-primary">{service.pricing}</div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-6">{service.description}</p>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <Link href={service.href}>
                        View Service Details
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Highlights Section */}
        <section className="py-20 bg-gray-50" aria-label="Service highlights">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why Choose Our {category.title} Services?
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.highlights.map((highlight, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-primary mr-3 flex-shrink-0 mt-1" aria-hidden="true" />
                  <p className="text-lg text-gray-700">{highlight}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/20" aria-label="Call to action">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Ready to Book Your {category.title} Service?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Get started with our easy booking process and enjoy professional cleaning services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
                <Link href="/booking/service/select">
                  Book Cleaning Service Now
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg" asChild>
                <Link href="/category">
                  View All Categories
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

