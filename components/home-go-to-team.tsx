'use client';

import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function HomeGoToTeam() {
  const benefits = [
    'Trusted, vetted cleaners with background checks and insurance',
    'Consistent quality with our professional cleaning standards',
    'Easy booking and scheduling that fits your lifestyle',
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Image */}
          <motion.div
            className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden order-2 md:order-1"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src="/images/go-to-team-hero.jpg"
              alt="Professional cleaning team member in Cape Town - Shalean Cleaning Services trusted cleaners"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={(e) => {
                // Fallback to Unsplash if local image fails
                e.currentTarget.src = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=800&fit=crop";
              }}
            />
          </motion.div>

          {/* Right Side - Text */}
          <motion.div
            className="order-1 md:order-2"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Trusted Cleaning Team in Cape Town
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Experience the reliability of Shalean's professional cleaning team in Cape Town. Our vetted cleaners deliver consistent, high-quality service for your home, office, or Airbnb property across all Cape Town suburbs.
            </p>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-lg">{benefit}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

