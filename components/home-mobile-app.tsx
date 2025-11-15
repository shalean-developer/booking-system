'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

export function HomeMobileApp() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text and Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get More Done On The Go
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Manage your cleaning bookings from anywhere. Book cleaners, track progress, and communicate - all in one place.
            </p>
            
            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button 
                className="bg-primary hover:bg-primary/90 text-white h-12 px-8 whitespace-nowrap rounded-lg"
                asChild
              >
                <Link href="/booking/service/select">Get Started</Link>
              </Button>
              <Button 
                variant="outline"
                className="h-12 px-8 whitespace-nowrap rounded-lg border-gray-300"
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>

            {/* Mobile-friendly note */}
            <p className="text-sm text-gray-500">
              ✓ Works on all devices
            </p>
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
              src="/images/mobile-app-hero.jpg.jpg"
              alt="Shalean Cleaning mobile app - Book cleaners on the go"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={(e) => {
                // Fallback to Unsplash if local image fails
                e.currentTarget.src = "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=800&fit=crop";
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

