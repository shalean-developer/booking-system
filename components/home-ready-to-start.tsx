'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Smartphone, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export function HomeReadyToStart() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Ready to Get Started?
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Block - Book Cleaning */}
          <motion.div
            className="bg-gray-50 rounded-2xl p-8 md:p-12 text-center hover:shadow-lg transition-shadow"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center">
                <Smartphone className="h-16 w-16 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Book Your Cleaning Today
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Experience the relief of a spotless home in Cape Town. Book trusted cleaners in minutes. Same-day availability for <Link href="/services/regular-cleaning" className="text-primary hover:underline">standard cleaning</Link>, <Link href="/services/deep-cleaning" className="text-primary hover:underline">deep cleaning</Link>, and <Link href="/services/move-turnover" className="text-primary hover:underline">move-in/out cleaning</Link>. Join 500+ satisfied customers with a 5-star rating!
            </p>
            <Button
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-lg"
              asChild
            >
              <Link href="/booking/service/select">Book Now</Link>
            </Button>
          </motion.div>

          {/* Right Block - Become a Cleaner */}
          <motion.div
            className="bg-gray-50 rounded-2xl p-8 md:p-12 text-center hover:shadow-lg transition-shadow"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-16 w-16 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Join Our Team
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Work with Shalean as a professional cleaner. Join our trusted team and help make homes spotless.
            </p>
            <Button
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-lg"
              asChild
            >
              <Link href="/careers">Become a Cleaner</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

