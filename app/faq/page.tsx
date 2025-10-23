import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { 
  HelpCircle,
  ArrowRight,
  CheckCircle,
  Phone,
  Mail,
  Clock
} from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Frequently Asked Questions | Shalean Cleaning Services",
  description: "Find answers to common questions about Shalean cleaning services. Learn about our services, pricing, scheduling, and more.",
  canonical: "/faq",
  ogImage: {
    url: "https://shalean.co.za/assets/og/faq-1200x630.jpg",
    alt: "Frequently asked questions about Shalean cleaning services"
  }
});

export default function FAQPage() {
  const faqs = [
    {
      question: "What cleaning services do you offer?",
      answer: "We offer regular cleaning, deep cleaning, move-in/move-out cleaning, Airbnb cleaning, office cleaning, apartment cleaning, and window cleaning services across Cape Town, Johannesburg, Pretoria, and Durban."
    },
    {
      question: "How much do your cleaning services cost?",
      answer: "Our pricing varies based on the type of service and property size. Regular cleaning starts from R250, deep cleaning from R1,200, and move-in/out cleaning from R980. Contact us for a personalized quote."
    },
    {
      question: "Are your cleaners insured and bonded?",
      answer: "Yes, all our cleaners are fully insured, bonded, and background-checked. We take security and trust seriously to give you peace of mind."
    },
    {
      question: "Do you provide cleaning supplies and equipment?",
      answer: "Yes, we bring all necessary cleaning supplies and equipment. We use eco-friendly products and professional-grade equipment to ensure the best results."
    },
    {
      question: "How do I book a cleaning service?",
      answer: "You can book online through our booking system, call us at +27 87 153 5250, or contact us through our website. We offer flexible scheduling to fit your needs."
    },
    {
      question: "Can I schedule regular cleaning appointments?",
      answer: "Absolutely! We offer weekly, bi-weekly, and monthly cleaning schedules. Regular customers often receive discounted rates and priority booking."
    },
    {
      question: "What areas do you service?",
      answer: "We currently service Cape Town (all suburbs), Johannesburg (Northern Suburbs, Midrand, Eastern Suburbs, Southern Suburbs, Western Suburbs, Inner City), Pretoria (Central, Eastern, Northern, Western, Southern Suburbs, Golf Estates), and Durban (Coastal North, Central, Western, Southern Suburbs, South Coast, Upper Areas)."
    },
    {
      question: "Do you offer same-day cleaning services?",
      answer: "Yes, we offer same-day service when available. However, we recommend booking in advance to ensure availability, especially for deep cleaning or move-in/out services."
    },
    {
      question: "What if I'm not satisfied with the cleaning?",
      answer: "We offer a 100% satisfaction guarantee. If you're not completely satisfied, we'll return within 24 hours to address any concerns at no additional cost."
    },
    {
      question: "Do you clean during weekends and holidays?",
      answer: "Yes, we offer cleaning services 7 days a week, including weekends and most holidays. Additional charges may apply for holiday cleaning."
    },
    {
      question: "Can I cancel or reschedule my appointment?",
      answer: "Yes, you can cancel or reschedule your appointment up to 24 hours in advance at no charge. Cancellations within 24 hours may incur a fee."
    },
    {
      question: "Do you offer eco-friendly cleaning options?",
      answer: "Yes, we use eco-friendly cleaning products that are safe for children, pets, and the environment. All our products are biodegradable and non-toxic."
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
              <HelpCircle className="h-3 w-3 mr-1" />
              Help Center
            </Badge>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">
              Frequently Asked <span className="text-primary">Questions</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Find answers to common questions about our cleaning services, pricing, and policies.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
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

      {/* Contact Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Still Have Questions?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Can't find what you're looking for? Our team is here to help.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Phone className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Call Us</h3>
                <p className="text-gray-600 mb-4">Speak directly with our team</p>
                <a href="tel:+27871535250" className="text-primary font-medium">
                  +27 87 153 5250
                </a>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Mail className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Email Us</h3>
                <p className="text-gray-600 mb-4">Get detailed answers</p>
                <a href="mailto:support@shalean.co.za" className="text-primary font-medium">
                  support@shalean.co.za
                </a>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Response Time</h3>
                <p className="text-gray-600 mb-4">We respond quickly</p>
                <span className="text-primary font-medium">
                  Within 2 hours
                </span>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
              <Link href="/contact">
                Contact Us
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg" asChild>
              <Link href="/booking/service/select">
                Book Now
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
