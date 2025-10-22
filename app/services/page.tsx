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
      features: ["Detailed scrubbing", "Hard-to-reach areas", "Appliance deep clean", "Comprehensive sanitization"],
      pricing: "From R1,200",
      link: "/services/deep-specialty",
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

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-white">
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
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 rounded-full ${service.color} flex items-center justify-center mb-6`}>
                      <Icon className={`h-8 w-8 ${service.iconColor}`} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h2>
                    <p className="text-gray-600 mb-6">{service.description}</p>
                    
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">What's Included:</h3>
                      <ul className="space-y-2">
                        {service.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
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
                          Learn More
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Book Your Service?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Get started with our easy booking process and enjoy a spotless space.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
            <Link href="/booking/service/select">
              Book Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

