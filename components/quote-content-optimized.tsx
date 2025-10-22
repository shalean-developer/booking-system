"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ServiceType } from '@/types/booking';

// Import static components
import { QuoteHeader } from '@/components/quote-header';
import { QuoteHero } from '@/components/quote-hero';
import { ContactCard } from '@/components/quote-contact-card';
import { ServiceGrid } from '@/components/quote-service-grid';
import { HomeDetailsCard } from '@/components/quote-home-details';

// Dynamic imports for below-fold components
const ExtrasGrid = dynamic(() => import('@/components/quote-extras-grid').then(mod => ({ default: mod.ExtrasGrid })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
});

const QuoteSummary = dynamic(() => import('@/components/quote-summary').then(mod => ({ default: mod.QuoteSummary })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
});

const MobileQuoteBar = dynamic(() => import('@/components/mobile-quote-bar').then(mod => ({ default: mod.MobileQuoteBar })), {
  loading: () => <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent"><div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 flex items-center justify-between"><div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div><div className="animate-pulse bg-gray-200 h-10 w-24 rounded"></div></div></div>
});

export function QuoteContent() {
  const router = useRouter();
  const [contact, setContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [serviceId, setServiceId] = useState<ServiceType | null>(null);
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(1);
  const [extras, setExtras] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleExtra(id: string) {
    setExtras((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  const handleSubmit = async () => {
    if (!serviceId) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/quote-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: serviceId,
          bedrooms,
          bathrooms,
          extras,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.ok) {
        // Show success message even if email failed
        if (result.emailError) {
          if (result.emailError === 'Email service not configured') {
            console.log('Quote recorded successfully (email service not configured):', result.quoteId);
          } else {
            console.warn('Email sending failed but quote was recorded:', result.emailError);
          }
        }

        // Redirect to quote confirmation page
        router.push('/booking/quote/confirmation');
      } else {
        alert(`Failed to send quote confirmation: ${result.error || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Quote confirmation error:', error);
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <QuoteHeader />

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <QuoteHero />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <ContactCard contact={contact} setContact={setContact} />
            <ServiceGrid selected={serviceId} setSelected={setServiceId} />
            <HomeDetailsCard
              bedrooms={bedrooms}
              setBedrooms={setBedrooms}
              bathrooms={bathrooms}
              setBathrooms={setBathrooms}
            />
            <ExtrasGrid selectedExtras={extras} toggleExtra={toggleExtra} />
          </div>

          <div className="hidden lg:block lg:col-span-4">
            <QuoteSummary
              contact={contact}
              serviceId={serviceId}
              bedrooms={bedrooms}
              bathrooms={bathrooms}
              extras={extras}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Mobile condensed summary bar */}
      <MobileQuoteBar
        contact={contact}
        serviceId={serviceId}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
