import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { 
  Home, 
  Calendar,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Shield,
  Award,
  Clock,
  Users
} from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "How It Works | Shalean Cleaning Services",
  description: "Simple 4-step process to book your cleaning service. Professional cleaners, eco-friendly products, satisfaction guaranteed. Easy online booking, flexible scheduling, and instant quotes.",
  canonical: generateCanonical("/how-it-works"),
});

export default function HowItWorksPage() {
  const steps = [
    {
      number: "1",
      title: "Choose Your Service",
      description: "Select from Standard, Deep, Move In/Out, or Airbnb cleaning. Configure your home details and extras.",
      icon: Home,
      color: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      number: "2",
      title: "Schedule Your Clean",
      description: "Pick a date and time that works for you. We offer flexible scheduling from 7AM to 7PM, Monday through Saturday.",
      icon: Calendar,
      color: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      number: "3",
      title: "We Clean Your Space",
      description: "Our professional, trained cleaners arrive on time with all eco-friendly supplies. Sit back and relax or go about your day.",
      icon: Sparkles,
      color: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      number: "4",
      title: "Enjoy Your Clean Home",
      description: "Walk into a spotless space. Not satisfied? We'll make it right with our 100% satisfaction guarantee.",
      icon: CheckCircle,
      color: "bg-amber-50",
      iconColor: "text-amber-600"
    }
  ];

  const whyChooseUs = [
    {
      icon: Shield,
      title: "Insured & Bonded",
      description: "Full liability coverage for your peace of mind"
    },
    {
      icon: Award,
      title: "98% Satisfaction Rate",
      description: "Trusted by 2,500+ happy customers"
    },
    {
      icon: Clock,
      title: "Flexible Scheduling",
      description: "Book at times that work for your schedule"
    },
    {
      icon: Users,
      title: "Trained Professionals",
      description: "Background-checked, experienced cleaners"
    }
  ];

  const faqs = [
    {
      question: "Do I need to provide cleaning supplies?",
      answer: "No, we bring all professional-grade, eco-friendly cleaning supplies and equipment."
    },
    {
      question: "How long does a cleaning take?",
      answer: "It depends on your home size and service type. Standard cleaning takes 2-4 hours, while deep cleaning may take 4-8 hours."
    },
    {
      question: "Do I need to be home?",
      answer: "Not required! Many clients provide access instructions and go about their day. We're fully insured and bonded."
    },
    {
      question: "What if I'm not satisfied?",
      answer: "We offer a 100% satisfaction guarantee. If you're not happy, we'll return within 24 hours to make it right—at no extra charge."
    },
    {
      question: "Can I reschedule or cancel?",
      answer: "Yes! You can reschedule or cancel up to 24 hours before your appointment with no penalty."
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
              Simple & Easy Process
            </Badge>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">
              How It <span className="text-primary">Works</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Book professional cleaning in just 4 simple steps.
              No hassle, no surprises—just a spotless home.
            </p>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="flex flex-col md:flex-row items-center gap-8">
                  <div className={`flex-shrink-0 w-24 h-24 rounded-full ${step.color} flex items-center justify-center border-4 border-white shadow-lg`}>
                    <Icon className={`h-12 w-12 ${step.iconColor}`} />
                  </div>
                  <Card className="flex-1 border-0 shadow-lg">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl">
                          {step.number}
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h2>
                          <p className="text-gray-600 text-lg">{step.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block">
                      <ArrowRight className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Shalean?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're committed to providing exceptional service and peace of mind.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-0 shadow-lg text-center">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">
              Have questions? We've got answers.
            </p>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Book your cleaning service in just a few minutes.
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

