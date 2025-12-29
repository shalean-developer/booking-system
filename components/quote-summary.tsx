"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ServiceType } from '@/types/booking';

interface QuoteSummaryProps {
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
  };
  serviceId: ServiceType | null;
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  onSubmit: () => void;
  isSubmitting: boolean;
}

interface ApiExtraResponse {
  id: string;
  label?: string;
}

export function QuoteSummary({ contact, serviceId, bedrooms, bathrooms, extras, onSubmit, isSubmitting }: QuoteSummaryProps) {
  const isFormValid = contact.firstName && contact.lastName && contact.email && contact.phone && contact.location && serviceId;
  const [extrasList, setExtrasList] = useState<Array<{ id: string; label: string }>>([]);

  useEffect(() => {
    async function fetchExtras() {
      try {
        const response = await fetch('/api/quote/services');
        const data = await response.json();

        if (data.ok && data.extras) {
          const transformedExtras = (data.extras as ApiExtraResponse[]).map((ex) => ({
            id: ex.id?.trim() || '',
            label: ex.label?.trim() || ex.id?.trim() || '',
          }));
          setExtrasList(transformedExtras);
        }
      } catch (error) {
        // Silently handle error - extras list will remain empty
      }
    }

    fetchExtras();
  }, []);

  // Get selected extra labels
  const selectedExtraLabels = extras
    .map(extraId => {
      const extra = extrasList.find(e => e.id === extraId || e.id.trim().toLowerCase() === extraId.trim().toLowerCase());
      return extra?.label || extraId;
    })
    .filter(Boolean);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="lg:sticky lg:top-6 lg:h-fit"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">Your Quote</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Service</div>
              <div className="text-sm font-medium text-gray-800">
                {serviceId || <span className="text-gray-400">Not selected</span>}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Home details</div>
              <div className="text-sm font-medium text-gray-800">
                {bedrooms} Bed • {bathrooms} Bath
              </div>
            </div>

            <div className="flex justify-between items-start">
              <div className="text-sm text-gray-600">Extras</div>
              <div className="text-sm font-medium text-gray-800 text-right max-w-[60%]">
                {selectedExtraLabels.length > 0 ? (
                  <div className="space-y-1">
                    {selectedExtraLabels.map((label, index) => (
                      <div key={index}>{label}</div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">None</span>
                )}
              </div>
            </div>

            <hr className="border-t border-gray-200 my-2" />

            {/* Custom Quote Notice - No Price Display */}
            <div className="rounded-lg bg-primary/5 p-4 text-center">
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Custom Quote
              </p>
              <p className="text-xs text-gray-600">
                We&apos;ll provide a personalized quote based on your selections
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button
              onClick={onSubmit}
              disabled={!isFormValid || isSubmitting}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Sending Quote...</span>
                  <span className="sm:hidden">Sending...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Confirm Quote & Continue</span>
                  <span className="sm:hidden">Confirm & Continue</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <Link href="/booking/service/select" className="block">
              <Button variant="outline" size="lg" className="w-full">
                <span className="hidden sm:inline">Skip to Full Booking</span>
                <span className="sm:hidden">Full Booking</span>
              </Button>
            </Link>

            <p className="text-xs text-gray-500 text-center mt-3">
              We will email this quote to {contact.email || 'your email'}.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
