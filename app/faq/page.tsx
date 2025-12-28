'use client';

import { useState } from 'react';
import { Plus, Minus, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from "@/components/header";
import { stringifyStructuredData } from '@/lib/structured-data-validator';

type FAQCategory = 'getting-started' | 'services-pricing' | 'booking-scheduling' | 'account-technical';

const faqsByCategory: Record<FAQCategory, Array<{ question: string; answer: string }>> = {
  'getting-started': [
    {
      question: "How do I book a cleaning service?",
      answer: "Booking is easy! Simply create an account, browse our available cleaning services, select the service and time that works for you, and complete your booking. You'll receive a confirmation email with all the details of your scheduled cleaning."
    },
    {
      question: "What cleaning services do you offer?",
      answer: "We offer a comprehensive range of cleaning services including regular house cleaning, deep cleaning, move-in/move-out cleaning, office cleaning, post-construction cleaning, and specialized services like carpet cleaning and window washing. We can customize our services to meet your specific needs."
    },
    {
      question: "Are your cleaners insured and bonded?",
      answer: "Yes! All our cleaning professionals are fully insured, bonded, and background-checked for your peace of mind. We take the safety and security of your home seriously, and all our staff undergo thorough screening before joining our team."
    },
    {
      question: "Do I need to provide cleaning supplies and equipment?",
      answer: "Our equipment policy varies by service type. For Deep Cleaning and Move In/Out Cleaning services, we provide all equipment and supplies at no extra charge. For Regular Cleaning and Airbnb Cleaning services, equipment is available upon customer request for an additional charge. All our cleaning teams bring eco-friendly cleaning products. If you prefer to use specific products, you can let us know and we'll use your preferred supplies."
    }
  ],
  'services-pricing': [
    {
      question: "How much do your cleaning services cost?",
      answer: "Pricing varies based on the size of your space, type of service, and frequency. One-time cleanings typically start from R300, while recurring weekly or bi-weekly services offer discounted rates. We provide free estimates, so contact us for an accurate quote tailored to your needs."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and EFT transfers. For recurring services, you can set up automatic payments for convenience. All payments are processed securely through our platform."
    },
    {
      question: "Are there discounts for recurring services?",
      answer: "Yes! We offer discounted rates for regular recurring cleanings. Weekly cleanings save up to 15%, and bi-weekly cleanings save up to 10% compared to one-time services. The more frequent your service, the more you save while keeping your space consistently clean."
    },
    {
      question: "Do you offer eco-friendly cleaning options?",
      answer: "Absolutely! We use eco-friendly, non-toxic cleaning products that are safe for your family, pets, and the environment. All our standard cleanings use green cleaning products at no extra charge. Just let us know if you have any specific preferences or allergies."
    }
  ],
  'booking-scheduling': [
    {
      question: "How far in advance do I need to book?",
      answer: "We recommend booking at least 24-48 hours in advance to ensure availability. However, we often have same-day availability for urgent cleaning needs. For recurring services, you can set up a regular schedule and we'll automatically book your appointments."
    },
    {
      question: "Can I reschedule or cancel my cleaning appointment?",
      answer: "Yes! You can reschedule or cancel your appointment up to 24 hours before the scheduled time at no charge. Cancellations made less than 24 hours in advance may incur a fee. You can manage your bookings directly through your account or by contacting our support team."
    },
    {
      question: "Will I have the same cleaner each time?",
      answer: "We do our best to assign you the same cleaning professional for consistency and to build trust. However, if your regular cleaner is unavailable, we'll ensure a qualified replacement from our team. You can also request specific cleaners if you have a preference."
    },
    {
      question: "What areas do you service?",
      answer: "We currently service Cape Town and surrounding suburbs. Enter your address during booking to check if we service your area. We're constantly expanding our coverage, so if we don't service your area yet, let us know and we'll notify you when we become available."
    }
  ],
  'account-technical': [
    {
      question: "I forgot my password. How do I reset it?",
      answer: "Click on \"Forgot Password\" on the login page, enter your email address, and we'll send you a password reset link. Follow the instructions in the email to create a new password. If you don't receive the email, check your spam folder or contact support."
    },
    {
      question: "How do I update my account information or service preferences?",
      answer: "Go to your account settings, click on \"Edit Profile\" or \"Service Preferences,\" and update any information you want to change. You can update your contact details, address, cleaning preferences, access instructions, and payment methods. Don't forget to save your changes."
    },
    {
      question: "What should I do if I'm not satisfied with the cleaning?",
      answer: "Your satisfaction is our priority! If you're not happy with the service, please contact us within 24 hours of the cleaning. We'll send a team back to address any issues at no additional charge. We stand behind our work and want to ensure you're completely satisfied."
    },
    {
      question: "I'm experiencing payment issues. Who can help?",
      answer: "If you're having trouble with payments, please contact our support team immediately. We can help troubleshoot payment issues, process refunds if necessary, and ensure your account is properly set up. We're here to help make the process as smooth as possible."
    }
  ]
};

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory>('getting-started');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const currentFaqs = faqsByCategory[selectedCategory];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const categories: Array<{ id: FAQCategory; label: string }> = [
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'services-pricing', label: 'Services & Pricing' },
    { id: 'booking-scheduling', label: 'Booking & Scheduling' },
    { id: 'account-technical', label: 'Account & Technical Issues' }
  ];

  // Flatten all FAQs for structured data
  const allFaqs = Object.values(faqsByCategory).flat();

  // Generate FAQPage structured data for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allFaqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-white to-purple-50/30">
      {/* FAQPage Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyStructuredData(faqSchema, "FAQPage") }}
      />
      <Header />

      {/* FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Title and Category Buttons */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  FAQs
                </h1>
                <p className="text-lg text-gray-600">
                  Everything you need to know about our cleaning services, booking, pricing, and more.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setOpenIndex(0);
                    }}
                    className={`w-fit text-left px-4 py-2 rounded-full transition-all ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-white text-black border border-blue-600 hover:bg-gray-50'
                    }`}
                    aria-label={`Filter FAQs by ${category.label}`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column - FAQ Accordion */}
            <div className="space-y-4">
              {currentFaqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    aria-expanded={openIndex === index}
                    aria-label={`${faq.question} - Click to ${openIndex === index ? 'collapse' : 'expand'} answer`}
                  >
                    <span className="font-semibold text-gray-900 pr-8 flex-1">
                      {faq.question}
                    </span>
                    {openIndex === index ? (
                      <Minus className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    ) : (
                      <Plus className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    )}
                  </button>
                  {openIndex === index && (
                    <div className="px-6 pb-5 pt-0 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}

              {/* Still have questions section */}
              <div className="mt-8 pt-8">
                <div className="bg-purple-50/60 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Still have questions?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Contact our support team and we will make sure everything is clear and intuitive for you!
                  </p>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-white rounded-full pl-6 pr-2 py-2.5 text-sm font-medium transition-colors gap-3" 
                    asChild
                  >
                    <Link href="/contact" className="flex items-center gap-3">
                      Contact Support
                      <span className="bg-white rounded-full flex items-center justify-center p-1.5 w-7 h-7 flex-shrink-0">
                        <ArrowUpRight className="h-4 w-4 text-primary" />
                      </span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
