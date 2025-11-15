'use client';

import Image from 'next/image';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Joanne van der Merwe',
    text: 'Shalean\'s cleaning service was fantastic! Everything was spotless and the cleaner was professional and friendly. Highly recommend for Cape Town residents!',
    avatar: '/images/team-lucia.webp',
    date: '2 weeks ago',
    location: 'Cape Town',
    rating: 5,
    datePublished: '2024-01-15T10:00:00.000Z',
  },
  {
    name: 'Peter Mkhize',
    text: 'I\'ve been using Shalean for months now. The quality is consistently excellent and booking is so easy. Perfect for busy professionals.',
    avatar: '/images/team-normatter.webp',
    date: '1 month ago',
    location: 'Johannesburg',
    rating: 5,
    datePublished: '2023-12-30T10:00:00.000Z',
  },
  {
    name: 'Sarah Johnson',
    text: 'Amazing experience! The cleaner arrived on time and did an incredible job. My Airbnb was spotless for the next guests. Will definitely book again.',
    avatar: '/images/team-nyasha.webp',
    date: '3 weeks ago',
    location: 'Cape Town',
    rating: 5,
    datePublished: '2024-01-08T10:00:00.000Z',
  },
  {
    name: 'Michael Dlamini',
    text: 'Best cleaning service I\'ve tried in Durban. The booking process is easy and the cleaners are top-notch. Worth every rand!',
    avatar: '/images/team-lucia.webp',
    date: '1 week ago',
    location: 'Durban',
    rating: 5,
    datePublished: '2024-01-22T10:00:00.000Z',
  },
];

// Calculate aggregate rating
const aggregateRating = {
  "@type": "AggregateRating",
  "ratingValue": "5.0",
  "reviewCount": testimonials.length.toString(),
  "bestRating": "5",
  "worstRating": "1"
};

// Generate Review schema for each testimonial
const reviewSchemas = testimonials.map((testimonial) => ({
  "@context": "https://schema.org",
  "@type": "Review",
  "author": {
    "@type": "Person",
    "name": testimonial.name
  },
  "reviewBody": testimonial.text,
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": testimonial.rating.toString(),
    "bestRating": "5",
    "worstRating": "1"
  },
  "datePublished": testimonial.datePublished
}));

export function HomeReviewsShowcase() {
  return (
    <section id="testimonials" className="py-16 sm:py-20 lg:py-24 bg-white" aria-label="Customer reviews and testimonials">
      {/* Review Schema for each testimonial */}
      {reviewSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
        />
      ))}
      
      {/* Aggregate Rating Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify({
            "@context": "https://schema.org",
            ...aggregateRating
          }, null, 2)
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.div
          className="text-center mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600">
            Real reviews from satisfied customers across South Africa
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 rounded-2xl h-full">
                <CardContent className="p-6 lg:p-8">
                  <div className="flex items-start gap-4">
                    {/* Profile Picture with Blue Background */}
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-primary flex-shrink-0 flex items-center justify-center border-2 border-primary/20">
                      <Image
                        src={testimonial.avatar}
                        alt={`${testimonial.name} - Shalean Cleaning customer review`}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        sizes="64px"
                        onError={(e) => {
                          e.currentTarget.parentElement!.style.backgroundColor = '#3b82f6';
                        }}
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Name, Location, and Stars */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-gray-900 text-base">{testimonial.name}</p>
                            <span className="text-gray-500 text-sm">•</span>
                            <span className="text-gray-500 text-sm">{testimonial.location}</span>
                          </div>
                        </div>
                        {/* Star Rating */}
                        <div className="flex items-center gap-1 flex-shrink-0" aria-label={`${testimonial.rating} out of 5 stars`}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-5 w-5 ${star <= testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                              strokeWidth={0}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Testimonial Text */}
                      <p className="text-gray-700 mb-4 leading-relaxed text-base">
                        {testimonial.text}
                      </p>
                      
                      {/* Date */}
                      <p className="text-sm text-gray-400 mt-auto">
                        {testimonial.date}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Review Collection Prompt */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div className="inline-flex flex-col items-center gap-3 p-6 bg-primary/5 rounded-2xl border border-primary/10">
            <p className="text-base text-gray-700 font-medium">
              Had a great experience with Shalean?
            </p>
            <p className="text-sm text-gray-600">
              Share your review and help others discover our cleaning services in Cape Town
            </p>
            <a
              href="mailto:support@shalean.co.za?subject=Review%20for%20Shalean%20Cleaning%20Services"
              className="text-sm text-primary hover:text-primary/80 font-semibold underline"
            >
              Leave a Review →
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

