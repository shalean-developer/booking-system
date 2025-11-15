'use client';

import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function HomeEverydayLife() {
  const benefits = [
    'Vetted cleaners with background checks and insurance',
    'Flexible booking - same-day availability',
    'Satisfaction guaranteed or we\'ll return to fix it',
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everyday Life Made Easier in Cape Town
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Professional cleaning services in Cape Town that fit your schedule. Book trusted cleaners for your home, office, or Airbnb with complete peace of mind. Same-day availability across Sea Point, Claremont, Constantia, and all Cape Town areas.
            </p>
            <ul className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-lg">{benefit}</span>
                </li>
              ))}
            </ul>
            <Button
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-lg"
              asChild
            >
              <Link href="/booking/service/select">Book a Cleaning Now</Link>
            </Button>
          </motion.div>

          {/* Right Side - Image */}
          <motion.div
            className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src="/images/everyday-life-hero.jpg"
              alt="Customer booking professional cleaning services in Cape Town - Shalean Cleaning Services"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={(e) => {
                // Fallback to Unsplash if local image fails
                e.currentTarget.src = "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=800&fit=crop&auto=format";
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

