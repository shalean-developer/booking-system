'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Smartphone, Users, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function HomeReadyToStart() {
  return (
    <section className="py-16 md:py-24 bg-primary m-4 md:m-6 rounded-2xl">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.h2
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-12 text-center"
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
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Book Your Cleaning Today
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Book trusted cleaners in minutes. Same-day availability available.
            </p>
            <Button
              className="bg-primary hover:bg-primary/90 text-white rounded-full pl-6 pr-2 py-2.5 text-sm font-medium transition-colors gap-3"
              asChild
            >
              <Link href="/booking/service/standard/details" className="flex items-center gap-3">
                Book Now
                <span className="bg-white rounded-full flex items-center justify-center p-1.5 w-7 h-7 flex-shrink-0">
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                </span>
              </Link>
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
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Join Our Team
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Work with Shalean as a professional cleaner. Join our trusted team and help make homes spotless.
            </p>
            <Button
              className="bg-primary hover:bg-primary/90 text-white rounded-full pl-6 pr-2 py-2.5 text-sm font-medium transition-colors gap-3"
              asChild
            >
              <Link href="/careers" className="flex items-center gap-3">
                Become a Cleaner
                <span className="bg-white rounded-full flex items-center justify-center p-1.5 w-7 h-7 flex-shrink-0">
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                </span>
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

