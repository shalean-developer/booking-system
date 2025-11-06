import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { 
  Star,
  Quote,
  ArrowRight,
  CheckCircle,
  Users,
  MapPin
} from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Customer Testimonials | Shalean",
  description: "Read real customer reviews and testimonials for Shalean cleaning services. See why our customers trust us with their home and office cleaning needs.",
  canonical: generateCanonical("/testimonials"),
  ogImage: {
    url: "https://shalean.co.za/assets/og/testimonials-1200x630.jpg",
    alt: "Customer testimonials for Shalean cleaning services"
  }
});

export default function TestimonialsPage() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "Camps Bay, Cape Town",
      rating: 5,
      text: "Shalean has been cleaning my apartment for over a year now. The cleaners are always punctual, professional, and do an amazing job. I couldn't be happier with the service!",
      service: "Regular Cleaning"
    },
    {
      name: "Michael Chen",
      location: "Sandton, Johannesburg",
      rating: 5,
      text: "Excellent service! The team cleaned my office space thoroughly and were very respectful of our work environment. Highly recommend for commercial cleaning.",
      service: "Office Cleaning"
    },
    {
      name: "Emma Williams",
      location: "Umhlanga, Durban",
      rating: 5,
      text: "The Airbnb cleaning service is fantastic. They always have my property guest-ready on time, and the quality is consistently excellent. Perfect for my rental business.",
      service: "Airbnb Cleaning"
    },
    {
      name: "David Thompson",
      location: "Constantia, Cape Town",
      rating: 5,
      text: "Used Shalean for our move-out cleaning and got our full deposit back. The cleaners were thorough, professional, and left the place spotless. Will definitely use again.",
      service: "Move In/Out Cleaning"
    },
    {
      name: "Lisa Brown",
      location: "Menlyn, Pretoria",
      rating: 5,
      text: "The deep cleaning service exceeded my expectations. They cleaned areas I didn't even think about. The house has never looked better!",
      service: "Deep Cleaning"
    },
    {
      name: "James Wilson",
      location: "Sea Point, Cape Town",
      rating: 5,
      text: "Professional, reliable, and trustworthy. The cleaners always arrive on time and do a thorough job. I've been using their services for 6 months and couldn't be happier.",
      service: "Regular Cleaning"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Star className="h-3 w-3 mr-1" />
              Customer Reviews
            </Badge>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">
              What Our <span className="text-primary">Customers Say</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Don't just take our word for it. Read real testimonials from satisfied customers across South Africa.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-primary mb-4" />
                  <p className="text-gray-700 mb-6 italic">
                    "{testimonial.text}"
                  </p>
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold text-gray-900">{testimonial.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{testimonial.location}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {testimonial.service}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-gray-600">
              Our commitment to quality shows in our customer satisfaction
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">4.9/5</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <div className="text-gray-600">Cleanings Completed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Experience Our Service?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of satisfied customers and book your cleaning service today.
          </p>
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
      </section>
    </div>
  );
}
