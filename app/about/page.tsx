import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Users, Award, Shield, Heart, ArrowRight, Target, Star } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Shalean Cleaning Services",
  description: "Learn about Shalean's mission to provide exceptional cleaning services. 2,500+ happy customers, 98% satisfaction rate, eco-friendly approach.",
};

export default function AboutPage() {
  const values = [
    { icon: Star, title: "Excellence", description: "We deliver consistently high-quality service on every job" },
    { icon: Shield, title: "Trust", description: "Insured, bonded, and background-checked professionals" },
    { icon: Heart, title: "Care", description: "We treat every home as if it were our own" },
    { icon: Target, title: "Reliability", description: "On-time service and transparent communication" }
  ];

  const stats = [
    { number: "2,500+", label: "Happy Customers" },
    { number: "98%", label: "Satisfaction Rate" },
    { number: "50+", label: "Expert Cleaners" },
    { number: "5,000+", label: "Cleans Completed" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">Shalean</div>
              <span className="text-sm text-gray-500">Cleaning Services</span>
            </Link>
            <Button variant="outline" asChild>
              <Link href="/"><Home className="mr-2 h-4 w-4" />Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="py-20 bg-gradient-to-b from-primary/5 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Our Story</Badge>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">About <span className="text-primary">Shalean</span></h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Transforming homes and businesses across South Africa with professional cleaning services built on trust, excellence, and care.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                At Shalean, we believe everyone deserves a clean, healthy living environment. Our mission is to provide
                exceptional cleaning services that exceed expectations while maintaining our commitment to sustainability
                and customer satisfaction.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Founded with a vision to revolutionize the cleaning industry, we combine professional expertise with
                eco-friendly products and modern technology to deliver superior results every time.
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/team">Meet Our Team<ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="relative h-96 rounded-lg overflow-hidden shadow-xl">
              <Image src="/images/cleaning-team-hero.jpg" alt="Shalean team" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title} className="border-0 shadow-lg text-center">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Impact</h2>
            <p className="text-xl text-gray-600">Numbers that reflect our commitment to excellence</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-0 shadow-lg text-center">
                <CardContent className="p-8">
                  <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Join Thousands of Satisfied Customers</h2>
          <p className="text-xl text-gray-600 mb-8">Experience the Shalean difference today</p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
            <Link href="/booking/service/select">Book Your Service<ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

