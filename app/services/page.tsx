import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { 
  Home, 
  Star, 
  Building, 
  Calendar,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Users
} from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { getSeoConfig } from "@/lib/seo-config";

// Services page metadata
export const metadata: Metadata = createMetadata(getSeoConfig("services"));

export default function ServicesPage() {
  const services = [
    {
      title: "Regular Cleaning",
      icon: Home,
      description: "Regular home cleaning to keep your space fresh and organized. Perfect for ongoing maintenance.",
      features: ["Dusting & vacuuming", "Kitchen & bathroom cleaning", "Floor mopping", "Surface sanitization"],
      pricing: "From R250",
      link: "/services/regular-cleaning",
      color: "bg-amber-50",
      iconColor: "text-amber-600"
    },
    {
      title: "Deep Cleaning",
      icon: Star,
      description: "Thorough, intensive cleaning that tackles every corner and surface. Ideal for seasonal refreshes.",
      features: ["Detailed scrubbing", "Hard-to-reach areas", "Appliance deep clean", "Comprehensive sanitisation"],
      pricing: "From R450",
      link: "/services/deep-cleaning",
      color: "bg-teal-50",
      iconColor: "text-teal-600"
    },
    {
      title: "Move In/Out Cleaning",
      icon: Building,
      description: "Complete cleaning for property transitions. Make your space move-in ready or get your deposit back.",
      features: ["Empty space cleaning", "All surfaces detailed", "Appliances inside-out", "Windows & walls"],
      pricing: "From R980",
      link: "/services/move-turnover",
      color: "bg-orange-50",
      iconColor: "text-orange-500"
    },
    {
      title: "Airbnb Cleaning",
      icon: Calendar,
      description: "Professional turnover cleaning for short-term rentals. Fast, reliable service between guests.",
      features: ["Quick turnaround", "Linen change", "Guest-ready standards", "Quality inspection"],
      pricing: "From R230",
      link: "/services/airbnb-cleaning",
      color: "bg-teal-50",
      iconColor: "text-teal-600"
    },
    {
      title: "Office Cleaning",
      icon: Building,
      description: "Professional commercial cleaning services for offices and workplaces. Keep your business environment clean.",
      features: ["Desk cleaning", "Reception maintenance", "Kitchen cleaning", "Restroom sanitization"],
      pricing: "From R180",
      link: "/services/office-cleaning",
      color: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      title: "Apartment Cleaning",
      icon: Users,
      description: "Specialized cleaning services for apartments and condos. Understanding apartment layouts and strata requirements.",
      features: ["Compact space optimization", "Strata-compliant cleaning", "Balcony cleaning", "Built-in storage"],
      pricing: "From R200",
      link: "/services/apartment-cleaning",
      color: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      title: "Window Cleaning",
      icon: Sparkles,
      description: "Professional window cleaning for crystal clear results. Streak-free, spotless windows every time.",
      features: ["Interior & exterior cleaning", "Window frame cleaning", "Screen maintenance", "Streak-free guarantee"],
      pricing: "From R150",
      link: "/services/window-cleaning",
      color: "bg-cyan-50",
      iconColor: "text-cyan-600"
    },
    {
      title: "Home Maintenance",
      icon: Home,
      description: "Comprehensive home maintenance cleaning services. Keep your home in perfect condition year-round.",
      features: ["Regular maintenance", "Seasonal cleaning", "Appliance care", "Deep sanitization"],
      pricing: "From R300",
      link: "/services/home-maintenance",
      color: "bg-green-50",
      iconColor: "text-green-600"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main id="main-content">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-primary/5 to-white" aria-label="Services overview">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Professional Cleaning Services
            </Badge>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">
              Our <span className="text-primary">Services</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              From regular maintenance to deep cleaning, we offer comprehensive solutions
              for every cleaning need. Professional service, eco-friendly products, guaranteed satisfaction.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20" aria-label="Our cleaning services">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article key={service.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <Card className="h-full">
                    <CardContent className="p-8">
                      <div className={`w-16 h-16 rounded-full ${service.color} flex items-center justify-center mb-6`} aria-hidden="true">
                        <Icon className={`h-8 w-8 ${service.iconColor}`} />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h2>
                      <p className="text-gray-600 mb-6">{service.description}</p>
                      
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">What's Included:</h3>
                        <ul className="space-y-2">
                          {service.features.map((feature, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 text-primary mr-2 flex-shrink-0" aria-hidden="true" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <div className="text-sm text-gray-500">Starting at</div>
                          <div className="text-2xl font-bold text-primary">{service.pricing}</div>
                        </div>
                        <Button asChild className="bg-primary hover:bg-primary/90">
                          <Link href={service.link}>
                            View {service.title} Details
                            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Service Areas Section */}
      <section className="py-20 bg-white" aria-label="Service areas">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              We Serve Across South Africa
            </h2>
            <p className="text-xl text-gray-600">
              Professional cleaning services available in major cities
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <article>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
                <CardContent className="p-6 text-center">
                  <Link href="/location/cape-town" className="block">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-primary transition-colors">
                      Cape Town
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Serving Sea Point, Camps Bay, Claremont, and more
                    </p>
                    <span className="text-primary text-sm font-medium">View Areas →</span>
                  </Link>
                </CardContent>
              </Card>
            </article>
            <article>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
                <CardContent className="p-6 text-center">
                  <Link href="/location/johannesburg" className="block">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-primary transition-colors">
                      Johannesburg
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Professional cleaning across Jozi suburbs
                    </p>
                    <span className="text-primary text-sm font-medium">View Areas →</span>
                  </Link>
                </CardContent>
              </Card>
            </article>
            <article>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
                <CardContent className="p-6 text-center">
                  <Link href="/location/pretoria" className="block">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-primary transition-colors">
                      Pretoria
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Quality cleaning services in the capital
                    </p>
                    <span className="text-primary text-sm font-medium">View Areas →</span>
                  </Link>
                </CardContent>
              </Card>
            </article>
            <article>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
                <CardContent className="p-6 text-center">
                  <Link href="/location/durban" className="block">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-primary transition-colors">
                      Durban
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Expert cleaners along the coast
                    </p>
                    <span className="text-primary text-sm font-medium">View Areas →</span>
                  </Link>
                </CardContent>
              </Card>
            </article>
          </div>
          <div className="text-center mt-8">
            <Link href="/location">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                View All Service Areas
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
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

      {/* Blog Posts Section */}
      <section className="py-20 bg-white" aria-label="Cleaning tips and guides">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Expert Cleaning Tips & Guides
            </h2>
            <p className="text-xl text-gray-600">
              Learn from our professional cleaning experts
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <article>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
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
                      Read Guide <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </article>
            <article>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
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
                      Read Tips <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </article>
            <article>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    <Link href="/blog/complete-airbnb-turnover-cleaning-checklist" className="hover:text-primary transition-colors">
                      Complete Airbnb Cleaning Checklist
                    </Link>
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Master the art of Airbnb turnover cleaning with our comprehensive checklist for 5-star reviews.
                  </p>
                  <Link href="/blog/complete-airbnb-turnover-cleaning-checklist">
                    <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0">
                      Read Checklist <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </article>
            <article>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
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
                      Read Article <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </article>
          </div>
          <div className="text-center mt-8">
            <Link href="/blog">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                View All Blog Posts
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </main>
    </div>
  );
}

