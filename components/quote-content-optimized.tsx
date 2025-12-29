"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ServiceType } from '@/types/booking';

// Import static components
import { QuoteHero } from '@/components/quote-hero';
import { ContactCard } from '@/components/quote-contact-card';
import { ServiceGrid } from '@/components/quote-service-grid';
import { HomeDetailsCard } from '@/components/quote-home-details';
import { NotesCard } from '@/components/quote-notes-card';

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
    location: '',
  });
  const [notes, setNotes] = useState('');
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
          location: contact.location,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.ok) {
        // Redirect to quote confirmation page
        router.push('/booking/quote/confirmation');
      } else {
        alert(`Failed to send quote confirmation: ${result.error || 'Please try again.'}`);
      }
    } catch (error) {
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12 pb-24 lg:pb-12">
        <div className="opacity-0 animate-[fade-in_0.5s_ease-in-out_0.1s_forwards]">
          <QuoteHero />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6 flex flex-col items-center">
            <ContactCard contact={contact} setContact={setContact} />
            <ServiceGrid selected={serviceId} setSelected={setServiceId} />
            <HomeDetailsCard
              bedrooms={bedrooms}
              setBedrooms={setBedrooms}
              bathrooms={bathrooms}
              setBathrooms={setBathrooms}
            />
            <ExtrasGrid selectedExtras={extras} toggleExtra={toggleExtra} />
            <NotesCard notes={notes} setNotes={setNotes} />
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
