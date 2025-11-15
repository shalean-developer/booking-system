'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { stringifyStructuredData } from '@/lib/structured-data-validator';

const faqs = [
  {
    question: "How much does house cleaning cost in Cape Town?",
    answer: "Our cleaning services start from R250 for standard cleaning. Pricing depends on the size of your home, number of bedrooms and bathrooms, and the type of cleaning service you need. We offer transparent pricing with no hidden fees. Get an instant quote online or contact us for a personalized estimate."
  },
  {
    question: "Do you provide same-day cleaning services?",
    answer: "Yes! We offer same-day cleaning services in Cape Town. Book online and we'll match you with an available cleaner in your area. Same-day availability depends on your location and time of booking, but we strive to accommodate urgent cleaning needs whenever possible."
  },
  {
    question: "Are your cleaners insured and vetted?",
    answer: "Absolutely. All Shalean cleaners are fully insured, background-checked, and vetted professionals. We conduct thorough screening including identity verification, reference checks, and training before cleaners join our team. Your peace of mind is our priority."
  },
  {
    question: "What areas in Cape Town do you serve?",
    answer: "We serve all major areas across Cape Town including Sea Point, Claremont, Constantia, Camps Bay, Green Point, City Bowl, Atlantic Seaboard, Southern Suburbs, Northern Suburbs, and more. Check our locations page to see if we service your specific suburb."
  },
  {
    question: "What cleaning products do you use?",
    answer: "We use eco-friendly, non-toxic cleaning products that are safe for your family and pets. Our cleaners are trained to use professional-grade products that effectively clean while being environmentally responsible. If you have specific product preferences or allergies, let us know during booking."
  },
  {
    question: "Can I book recurring cleaning services?",
    answer: "Yes! We offer flexible recurring cleaning services including weekly, bi-weekly, and monthly schedules. Recurring customers enjoy discounted rates and priority booking. Set up your schedule once and we'll handle the rest. You can modify or cancel anytime."
  },
  {
    question: "What's included in a standard cleaning service?",
    answer: "Our standard cleaning includes dusting, vacuuming, mopping, bathroom cleaning, kitchen cleaning, trash removal, and general tidying. We clean all accessible surfaces, floors, and fixtures. Deep cleaning services include additional tasks like inside appliances, baseboards, and detailed scrubbing."
  },
  {
    question: "Do you offer Airbnb turnover cleaning?",
    answer: "Yes! We specialize in Airbnb turnover cleaning in Cape Town. Our team ensures your property is guest-ready with thorough cleaning, fresh linens, and attention to detail. We understand the importance of quick turnarounds and maintain high standards for short-term rental properties."
  }
];

export function HomeFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Generate FAQPage structured data
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyStructuredData(faqStructuredData, "FAQPage") }}
      />

      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about our cleaning services in Cape Town
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  aria-expanded={openIndex === index}
                >
                  <span className="font-semibold text-gray-900 pr-8">
                    {faq.question}
                  </span>
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-gray-600 mb-4">
              Still have questions? We're here to help!
            </p>
            <a
              href="/contact"
              className="text-primary font-semibold hover:underline"
            >
              Contact Us →
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
}
