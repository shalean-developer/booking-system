"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { 
  Briefcase, 
  Heart, 
  TrendingUp, 
  Users, 
  ArrowRight, 
  CheckCircle, 
  Award,
  Target,
  Shield,
  Sparkles,
  UserCheck,
  FileCheck,
  MessageSquare,
  Star
} from "lucide-react";

export function CareersContent() {
  const benefits = [
    { icon: TrendingUp, title: "Competitive Pay", description: "Fair compensation with performance bonuses and salary growth opportunities" },
    { icon: Users, title: "Great Team", description: "Work with supportive, professional colleagues in a positive environment" },
    { icon: Heart, title: "Work-Life Balance", description: "Flexible scheduling to fit your lifestyle and personal commitments" },
    { icon: Briefcase, title: "Career Growth", description: "Training programs and advancement opportunities to develop your skills" },
    { icon: Award, title: "Recognition Program", description: "Employee of the month awards and performance-based incentives" },
    { icon: Shield, title: "Job Security", description: "Stable employment with a growing company in an essential industry" }
  ];

  const positions = [
    { 
      title: "Residential Cleaner", 
      type: "Full-time / Part-time", 
      location: "Cape Town", 
      description: "Provide exceptional cleaning services for residential properties. Perfect for detail-oriented individuals who take pride in their work." 
    },
    { 
      title: "Commercial Cleaner", 
      type: "Full-time", 
      location: "Johannesburg", 
      description: "Maintain cleanliness in offices and commercial spaces. Great for those who enjoy working in professional environments." 
    },
    { 
      title: "Team Leader", 
      type: "Full-time", 
      location: "Multiple Locations", 
      description: "Lead and train cleaning teams while ensuring quality standards are met. Ideal for experienced cleaners ready to advance." 
    },
    { 
      title: "Airbnb Cleaner", 
      type: "Full-time / Part-time", 
      location: "Cape Town", 
      description: "Specialize in fast, thorough turnover cleaning for short-term rentals. Fast-paced and rewarding work." 
    }
  ];

  const companyValues = [
    { icon: Target, title: "Excellence", description: "We strive for the highest quality in everything we do" },
    { icon: Heart, title: "Care", description: "We treat every space and person with respect and attention" },
    { icon: Shield, title: "Integrity", description: "We operate with honesty, transparency, and trust" },
    { icon: Users, title: "Teamwork", description: "We succeed together through collaboration and support" }
  ];

  const applicationProcess = [
    { step: "1", icon: FileCheck, title: "Apply Online", description: "Submit your application through our easy online form" },
    { step: "2", icon: UserCheck, title: "Initial Review", description: "Our HR team reviews your application within 1-3 days" },
    { step: "3", icon: MessageSquare, title: "Interview", description: "Qualified candidates are invited for a personal interview" },
    { step: "4", icon: CheckCircle, title: "Onboarding", description: "Join our team and begin comprehensive training" }
  ];

  const testimonials = [
    {
      name: "Lucia",
      role: "Senior Cleaner",
      image: "/images/team-lucia.webp",
      quote: "Working at Shalean has been incredible. The team is supportive, the pay is fair, and I've learned so much. I started as a cleaner and now I'm training new team members!"
    },
    {
      name: "Normatter",
      role: "Commercial Team Lead",
      image: "/images/team-normatter.webp",
      quote: "The flexibility here is amazing. I can balance my work schedule with my personal life. Management truly cares about their employees, and it shows in everything they do."
    },
    {
      name: "Nyasha",
      role: "Residential Specialist",
      image: "/images/team-nyasha.webp",
      quote: "I love the recognition program! When you do great work, it's noticed and rewarded. The growth opportunities here are real - I've progressed so much in just one year."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-primary/10 via-white to-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/cleaning-team-hero.jpg')] opacity-5 bg-cover bg-center"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-sm">Join Our Team</Badge>
            <h1 className="mb-6 text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900">
              Build Your <span className="text-primary">Career</span> With Us
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-lg sm:text-xl text-gray-600">
              Join a team that values excellence, integrity, and growth. We're looking for dedicated 
              professionals to help us deliver exceptional service to our clients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8" asChild>
                <Link href="/careers/apply">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Apply Now
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 text-lg px-8" asChild>
                <Link href="#positions">
                  View Open Positions
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work With Us Section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Benefits & Perks</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Work With Us?</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              We invest in our team members' success and wellbeing with comprehensive benefits
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card key={benefit.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Company Values Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Our Culture</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {companyValues.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="text-center">
                  <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Employee Testimonials */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Employee Stories</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Hear From Our Team</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Real stories from real team members about their experience at Shalean
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section id="positions" className="py-16 sm:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Current Openings</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Open Positions</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Find the perfect role for you and start your journey with us
            </p>
          </div>
          <div className="space-y-6 mb-12">
            {positions.map((position) => (
              <Card key={position.title} className="border-0 shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{position.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                        <Badge variant="outline" className="font-medium">{position.type}</Badge>
                        <span className="flex items-center gap-1">
                          <span>📍</span>
                          {position.location}
                        </span>
                      </div>
                      <p className="text-gray-600 text-base">{position.description}</p>
                    </div>
                    <Button 
                      className="bg-primary hover:bg-primary/90 whitespace-nowrap" 
                      size="lg"
                      asChild
                    >
                      <Link href={`/careers/apply?position=${encodeURIComponent(position.title)}`}>
                        Apply Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-4">Don't see a position that fits? We're always looking for talented individuals!</p>
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10" asChild>
              <Link href="/careers/apply">
                Submit General Application
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Application Process Section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Application Process</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, transparent steps from application to your first day
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {applicationProcess.map((process) => {
              const Icon = process.icon;
              return (
                <div key={process.step} className="text-center relative">
                  <div className="w-16 h-16 rounded-full bg-primary text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg">
                    {process.step}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{process.title}</h3>
                  <p className="text-gray-600">{process.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-primary/10 to-primary/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to Join Our Team?
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Take the first step towards a rewarding career with Shalean Cleaning Services. 
            We can't wait to meet you!
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6" asChild>
            <Link href="/careers/apply">
              <Briefcase className="mr-2 h-5 w-5" />
              Apply Now
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

