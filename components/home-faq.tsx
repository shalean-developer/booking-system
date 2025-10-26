'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, Search, Phone } from 'lucide-react';

const faqs = [
  {
    question: 'Do you provide cleaning services near me?',
    answer: 'Yes! Shalean serves all major areas in Cape Town including Sea Point, Camps Bay, Claremont, Green Point, CBD, Gardens, Mouille Point, and the V&A Waterfront. We also service surrounding suburbs. Book a cleaner near you today!'
  },
  {
    question: 'What areas in Cape Town do you serve?',
    answer: 'We provide professional cleaning services throughout Cape Town and surrounding areas. Our most popular service locations include Sea Point, Camps Bay, Claremont, Green Point, City Bowl, Gardens, and the V&A Waterfront. View our full service areas map for complete coverage.'
  },
  {
    question: 'How much does house cleaning cost?',
    answer: 'Our pricing is transparent and based on your specific needs. Standard home cleaning starts from R200, while deep cleaning services range from R400-R1500 depending on property size. Get an instant online quote by booking a service—no hidden fees!'
  },
  {
    question: 'Do you offer same-day cleaning services?',
    answer: 'Yes, we offer same-day and next-day cleaning appointments when available. Book online to see immediate availability. For urgent cleaning needs, contact us at +27 87 153 5250 and we\'ll do our best to accommodate you.'
  },
  {
    question: 'Are your cleaners vetted and insured?',
    answer: 'Absolutely. All Shalean cleaners undergo thorough background checks, are fully insured, and professionally trained. We maintain a 98% customer satisfaction rate and stand behind every cleaning service with our 100% satisfaction guarantee.'
  },
  {
    question: 'What makes Shalean different from other cleaning companies?',
    answer: 'Shalean combines professional expertise with exceptional customer service. We use eco-friendly products, provide flexible scheduling, offer online booking 24/7, and back every service with our satisfaction guarantee. With 50+ vetted cleaners and 500+ happy customers, we\'re Cape Town\'s trusted cleaning service.'
  }
];

export function HomeFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Generate FAQ schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
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
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left Column - Support Options */}
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-12">
                Frequently asked questions
              </h2>

              {/* Support Cards */}
              <div className="space-y-4">
                {/* Live Chat Card */}
                <div className="flex items-start gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-primary/50 transition-colors">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Contact live chat support</h3>
                    <p className="text-sm text-gray-600">Available 24/7. Quick response time.</p>
                  </div>
                </div>

                {/* Search Knowledge Base Card */}
                <div className="flex items-start gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-primary/50 transition-colors">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Browse our knowledge base</h3>
                    <p className="text-sm text-gray-600">Find answers to common questions.</p>
                  </div>
                </div>

                {/* Phone Support Card */}
                <div className="flex items-start gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-primary/50 transition-colors">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Call our support team</h3>
                    <p className="text-sm text-gray-600">+27 87 153 5250</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - FAQ Accordion */}
            <div>
              <div className="space-y-0">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-gray-200">
                    <button
                      onClick={() => setOpenIndex(openIndex === index ? null : index)}
                      className="w-full flex items-center justify-between py-6 text-left group"
                    >
                      <h3 className="font-semibold text-gray-900 pr-8 group-hover:text-primary transition-colors">
                        {faq.question}
                      </h3>
                      {openIndex === index ? (
                        <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 group-hover:text-primary transition-colors" />
                      )}
                    </button>
                    {openIndex === index && (
                      <div className="pb-6">
                        <p className="text-gray-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

