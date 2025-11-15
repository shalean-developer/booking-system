'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Calculator, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { PRICING } from '@/lib/pricing';

export function PricingContent() {
  const exampleBedrooms = 2;
  const exampleBathrooms = 2;

  const services = [
    {
      name: 'Standard Cleaning',
      type: 'Standard',
      base: PRICING.services.Standard.base,
      bedroom: PRICING.services.Standard.bedroom,
      bathroom: PRICING.services.Standard.bathroom,
      exampleTotal: PRICING.services.Standard.base + 
                   (exampleBedrooms * PRICING.services.Standard.bedroom) + 
                   (exampleBathrooms * PRICING.services.Standard.bathroom) + 
                   PRICING.serviceFee,
      description: 'Regular home cleaning to keep your space fresh and organized',
      features: [
        'Dusting and vacuuming all surfaces',
        'Bathroom cleaning and sanitization',
        'Kitchen cleaning including countertops',
        'Trash removal and replacement',
        'Floor mopping and sweeping',
        'General tidying and organization'
      ],
      bestFor: 'Regular maintenance, weekly or bi-weekly cleaning'
    },
    {
      name: 'Deep Cleaning',
      type: 'Deep',
      base: PRICING.services.Deep.base,
      bedroom: PRICING.services.Deep.bedroom,
      bathroom: PRICING.services.Deep.bathroom,
      exampleTotal: PRICING.services.Deep.base + 
                   (exampleBedrooms * PRICING.services.Deep.bedroom) + 
                   (exampleBathrooms * PRICING.services.Deep.bathroom) + 
                   PRICING.serviceFee,
      description: 'Thorough, intensive cleaning that tackles every corner and surface',
      features: [
        'Inside all appliances (fridge, oven, microwave)',
        'Baseboards, window sills, and ledges',
        'Detailed scrubbing of bathrooms',
        'Carpet and upholstery cleaning',
        'Inside cabinets and drawers',
        'Ceiling fans and light fixtures',
        'Deep sanitization throughout'
      ],
      bestFor: 'Spring cleaning, move-in preparation, or periodic deep clean'
    },
    {
      name: 'Move In/Out Cleaning',
      type: 'Move In/Out',
      base: PRICING.services['Move In/Out'].base,
      bedroom: PRICING.services['Move In/Out'].bedroom,
      bathroom: PRICING.services['Move In/Out'].bathroom,
      exampleTotal: PRICING.services['Move In/Out'].base + 
                   (exampleBedrooms * PRICING.services['Move In/Out'].bedroom) + 
                   (exampleBathrooms * PRICING.services['Move In/Out'].bathroom) + 
                   PRICING.serviceFee,
      description: 'Complete cleaning for property transitions',
      features: [
        'Full deep cleaning service',
        'Inside all cabinets and closets',
        'Window cleaning (inside and out)',
        'Move-out inspection ready',
        'Garage and storage areas',
        'Appliance deep cleaning',
        'Property condition report'
      ],
      bestFor: 'Moving in or out, end of lease cleaning, property sales'
    },
    {
      name: 'Airbnb Cleaning',
      type: 'Airbnb',
      base: PRICING.services.Airbnb.base,
      bedroom: PRICING.services.Airbnb.bedroom,
      bathroom: PRICING.services.Airbnb.bathroom,
      exampleTotal: PRICING.services.Airbnb.base + 
                   (exampleBedrooms * PRICING.services.Airbnb.bedroom) + 
                   (exampleBathrooms * PRICING.services.Airbnb.bathroom) + 
                   PRICING.serviceFee,
      description: 'Professional turnover cleaning for short-term rentals',
      features: [
        'Guest-ready standard cleaning',
        'Linen change and bed making',
        'Quick turnaround service',
        'Quality guarantee',
        'Restocking essentials',
        'Property inspection',
        'Same-day availability'
      ],
      bestFor: 'Airbnb turnovers, short-term rental cleaning, guest preparation'
    }
  ];

  const extras = Object.entries(PRICING.extras).map(([name, price]) => ({
    name,
    price
  }));

  return (
    <main className="py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Cleaning Services Pricing in Cape Town
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Transparent, upfront pricing with no hidden fees. All prices include service fee. Get an instant quote online.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>No hidden fees</span>
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>Instant online quotes</span>
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>Satisfaction guaranteed</span>
            </span>
          </div>
        </motion.div>

        {/* Service Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {services.map((service, index) => (
            <motion.div
              key={service.name}
              className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{service.name}</h2>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Pricing Structure</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Base price:</span>
                    <span className="font-bold text-gray-900">R{service.base}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Per bedroom:</span>
                    <span className="font-bold text-gray-900">R{service.bedroom}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Per bathroom:</span>
                    <span className="font-bold text-gray-900">R{service.bathroom}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-3 mt-3">
                    <span className="text-gray-600">Service fee:</span>
                    <span className="font-bold text-gray-900">R{PRICING.serviceFee}</span>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-4 mt-4">
                    <div className="text-sm text-gray-600 mb-1">Example: {exampleBedrooms} bedroom, {exampleBathrooms} bathroom home</div>
                    <div className="text-3xl font-bold text-primary">R{service.exampleTotal}</div>
                    <div className="text-xs text-gray-500 mt-1">Includes service fee</div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">What's Included:</h3>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Best For */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-blue-900 mb-1">Best For:</div>
                    <div className="text-sm text-blue-800">{service.bestFor}</div>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white"
                size="lg"
                asChild
              >
                <Link href={`/booking/service/select?service=${service.type}`}>
                  Book {service.name}
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Extra Services */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Additional Services & Extras
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extras.map((extra, index) => (
              <div
                key={extra.name}
                className="bg-white rounded-lg shadow p-4 border border-gray-200"
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-medium">{extra.name}</span>
                  <span className="text-primary font-bold">R{extra.price}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Frequency Discounts */}
        <motion.div
          className="bg-gradient-to-r from-primary/10 to-blue-50 rounded-2xl p-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Save More with Recurring Cleaning Services
          </h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            Book regular cleaning and save on every visit. Discounts apply to the subtotal (before service fee).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 text-center shadow">
              <div className="text-4xl font-bold text-primary mb-2">{PRICING.frequencyDiscounts.weekly}%</div>
              <div className="text-xl font-semibold text-gray-900 mb-2">Weekly</div>
              <div className="text-gray-600 mb-4">Save on every clean</div>
              <div className="text-sm text-gray-500">
                Perfect for busy households that need regular maintenance
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow">
              <div className="text-4xl font-bold text-primary mb-2">{PRICING.frequencyDiscounts['bi-weekly']}%</div>
              <div className="text-xl font-semibold text-gray-900 mb-2">Bi-Weekly</div>
              <div className="text-gray-600 mb-4">Regular savings</div>
              <div className="text-sm text-gray-500">
                Ideal for maintaining a clean home every two weeks
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow">
              <div className="text-4xl font-bold text-primary mb-2">{PRICING.frequencyDiscounts.monthly}%</div>
              <div className="text-xl font-semibold text-gray-900 mb-2">Monthly</div>
              <div className="text-gray-600 mb-4">Ongoing discount</div>
              <div className="text-sm text-gray-500">
                Great for periodic deep cleaning and maintenance
              </div>
            </div>
          </div>
        </motion.div>

        {/* How Pricing Works */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            How Our Pricing Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Base Pricing</h3>
              <p className="text-gray-600 mb-4">
                Each cleaning service has a base price that covers the essential cleaning tasks. This price varies by service type:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Standard Cleaning:</strong> R{PRICING.services.Standard.base} base</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Deep Cleaning:</strong> R{PRICING.services.Deep.base} base</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Move In/Out:</strong> R{PRICING.services['Move In/Out'].base} base</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Airbnb:</strong> R{PRICING.services.Airbnb.base} base</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Room-Based Pricing</h3>
              <p className="text-gray-600 mb-4">
                We add charges based on the number of bedrooms and bathrooms in your home:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Bedroom charges vary by service type (R{PRICING.services.Standard.bedroom}-R{PRICING.services.Deep.bedroom} per bedroom)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Bathroom charges vary by service type (R{PRICING.services.Standard.bathroom}-R{PRICING.services.Deep.bathroom} per bathroom)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Service fee of R{PRICING.serviceFee} is added to all bookings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Extra services can be added for additional fees</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center bg-primary/5 rounded-2xl p-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Calculator className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Get Your Instant Quote
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Use our online calculator to get an instant quote for your cleaning service. No commitment required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white"
              asChild
            >
              <Link href="/booking/service/select">Get Instant Quote</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10"
              asChild
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

