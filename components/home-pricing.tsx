'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { PRICING } from '@/lib/pricing';

export function HomePricing() {
  // Calculate example prices for a 2-bedroom, 2-bathroom home
  const exampleBedrooms = 2;
  const exampleBathrooms = 2;

  const services = [
    {
      name: 'Standard Cleaning',
      base: PRICING.services.Standard.base,
      bedroom: PRICING.services.Standard.bedroom,
      bathroom: PRICING.services.Standard.bathroom,
      exampleTotal: PRICING.services.Standard.base + 
                   (exampleBedrooms * PRICING.services.Standard.bedroom) + 
                   (exampleBathrooms * PRICING.services.Standard.bathroom) + 
                   PRICING.serviceFee,
      description: 'Regular home cleaning to keep your space fresh',
      features: ['Dusting & vacuuming', 'Bathroom cleaning', 'Kitchen cleaning', 'Trash removal']
    },
    {
      name: 'Deep Cleaning',
      base: PRICING.services.Deep.base,
      bedroom: PRICING.services.Deep.bedroom,
      bathroom: PRICING.services.Deep.bathroom,
      exampleTotal: PRICING.services.Deep.base + 
                   (exampleBedrooms * PRICING.services.Deep.bedroom) + 
                   (exampleBathrooms * PRICING.services.Deep.bathroom) + 
                   PRICING.serviceFee,
      description: 'Thorough, intensive cleaning for every corner',
      features: ['Inside appliances', 'Baseboards & windows', 'Detailed scrubbing', 'Carpet cleaning']
    },
    {
      name: 'Move In/Out',
      base: PRICING.services['Move In/Out'].base,
      bedroom: PRICING.services['Move In/Out'].bedroom,
      bathroom: PRICING.services['Move In/Out'].bathroom,
      exampleTotal: PRICING.services['Move In/Out'].base + 
                   (exampleBedrooms * PRICING.services['Move In/Out'].bedroom) + 
                   (exampleBathrooms * PRICING.services['Move In/Out'].bathroom) + 
                   PRICING.serviceFee,
      description: 'Complete cleaning for property transitions',
      features: ['Full deep clean', 'Inside all cabinets', 'Window cleaning', 'Move-out inspection']
    },
    {
      name: 'Airbnb Cleaning',
      base: PRICING.services.Airbnb.base,
      bedroom: PRICING.services.Airbnb.bedroom,
      bathroom: PRICING.services.Airbnb.bathroom,
      exampleTotal: PRICING.services.Airbnb.base + 
                   (exampleBedrooms * PRICING.services.Airbnb.bedroom) + 
                   (exampleBathrooms * PRICING.services.Airbnb.bathroom) + 
                   PRICING.serviceFee,
      description: 'Professional turnover cleaning for short-term rentals',
      features: ['Guest-ready standard', 'Linen change', 'Quick turnaround', 'Quality guarantee']
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Transparent Pricing for Cleaning Services in Cape Town
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Clear, upfront pricing with no hidden fees. All prices include service fee. Get an instant quote online.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {services.map((service, index) => (
            <motion.div
              key={service.name}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{service.description}</p>
              
              {/* Pricing Breakdown */}
              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base price:</span>
                  <span className="font-semibold text-gray-900">R{service.base}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Per bedroom:</span>
                  <span className="font-semibold text-gray-900">R{service.bedroom}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Per bathroom:</span>
                  <span className="font-semibold text-gray-900">R{service.bathroom}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2 mt-2">
                  <span className="text-gray-600">Service fee:</span>
                  <span className="font-semibold text-gray-900">R{PRICING.serviceFee}</span>
                </div>
              </div>

              {/* Example Price */}
              <div className="bg-primary/10 rounded-lg p-4 mb-4">
                <div className="text-xs text-gray-600 mb-1">Example (2 bed, 2 bath):</div>
                <div className="text-2xl font-bold text-primary">R{service.exampleTotal}</div>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white"
                asChild
              >
                <Link href={`/booking/service/select?service=${service.name.replace(/\s+/g, '')}`}>Book {service.name}</Link>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Frequency Discounts */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Save More with Recurring Cleaning
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">{PRICING.frequencyDiscounts.weekly}%</div>
              <div className="font-semibold text-gray-900 mb-1">Weekly</div>
              <div className="text-sm text-gray-600">Save on every clean</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">{PRICING.frequencyDiscounts['bi-weekly']}%</div>
              <div className="font-semibold text-gray-900 mb-1">Bi-Weekly</div>
              <div className="text-sm text-gray-600">Regular savings</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">{PRICING.frequencyDiscounts.monthly}%</div>
              <div className="font-semibold text-gray-900 mb-1">Monthly</div>
              <div className="text-sm text-gray-600">Ongoing discount</div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-600 mb-4">
            Need a custom quote? Get an instant estimate online.
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white"
            asChild
          >
            <Link href="/pricing" className="flex items-center gap-2">
              View Full Cleaning Services Pricing in Cape Town
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
