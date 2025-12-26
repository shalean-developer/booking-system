'use client';

import Link from 'next/link';
import { Phone, Mail, ArrowUpRight } from 'lucide-react';

export function HomeReviewsApp() {
  return (
    <section className="pt-0 pb-4 bg-white">
      <div className="container mx-auto px-4 max-w-7xl border rounded-lg py-4">
        <div className="flex flex-wrap items-center justify-between gap-6 md:gap-8">
          {/* Get Our Service - Far Left */}
          <span className="text-lg font-semibold text-gray-900">Get Our Service</span>

          {/* Middle Section - Phone and Email */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            {/* Phone Number */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center flex-shrink-0">
                <Phone className="h-4 w-4 text-gray-700" />
              </div>
              <span className="text-base text-gray-700">+27 87 153 5250</span>
            </div>

            {/* Email Placeholder */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 text-gray-700" />
              </div>
              <span className="text-base text-gray-500">support@shalean.com</span>
            </div>
          </div>

          {/* Our Services Button - Far Right */}
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors text-base font-medium"
          >
            <span className="text-blue-900">Book Our Services</span>
            <span className="bg-primary rounded-full p-0.5">
              <ArrowUpRight className="h-7 w-7 text-white" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
