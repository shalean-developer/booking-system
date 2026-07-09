'use client';

import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Loader2, MapPin, Navigation, Star, Users } from 'lucide-react';
import type { BookingFormData } from '@/components/booking-system-types';
import { BookingFlowStepIndicator } from '@/components/booking-flow-step-indicator';
import { BookingFlowLayout } from '@/components/booking/booking-flow-layout';
import { cn } from '@/lib/utils';
import type { Cleaner as ApiCleaner } from '@/types/booking';
import dynamic from 'next/dynamic';
import { RecommendedCleanerCard } from '@/components/booking/recommended-cleaner-card';
import { BookingSummarySidebar } from '@/components/booking/booking-summary-sidebar';

const CleanerList = dynamic(
  () => import('@/components/booking/cleaner-list').then((m) => m.CleanerList),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-600" />
        <p className="mt-2 text-sm text-gray-500">Loading cleaner list…</p>
      </div>
    ),
  }
);

function formatDate(dateStr: string) {
  if (!dateStr) return 'Not selected';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(timeStr: string) {
  if (!timeStr) return 'Not selected';
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString('en-ZA', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatZar(v: number) {
  return `R ${Math.round(v).toLocaleString('en-ZA')}`;
}

export interface BookingStep2ExtrasProps {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  onBack?: () => void;
  onContinue: () => void | Promise<void>;
  pricing: {
    total: number;
    dbPricingRows: { id: string; label: string; value: number }[];
    engineMeta: {
      estimatedHours: number;
      hoursPerCleaner: number;
      marginRateBoostApplied: number;
      teamSize: number;
      estimatedJobHours: number;
    } | null;
  };
  serviceTitle: string;
  pricingLockError?: string;
  apiCleaners: ApiCleaner[];
  cleanersLoading: boolean;
}

export function BookingStep2Extras({
  data,
  setData,
  onBack,
  onContinue,
  pricing,
  serviceTitle,
  pricingLockError,
  apiCleaners,
  cleanersLoading,
}: BookingStep2ExtrasProps) {
  const [manualOpen, setManualOpen] = useState(false);
  const hasRequiredStep1Data = Boolean(data.service && data.date && data.time);
  const hasLocation = Boolean(data.workingArea?.trim() || data.address?.trim());
  const hasManualSelection = Boolean(data.cleanerId);
  const hasCleaner = Boolean(data.cleaner || data.cleanerId);
  const canContinue = hasRequiredStep1Data && hasLocation && hasCleaner;

  const selectedCleaner = useMemo(
    () => (data.cleanerId ? apiCleaners.find((c) => c.id === data.cleanerId) ?? null : null),
    [data.cleanerId, apiCleaners]
  );

  const handleLocationChange = (value: string) => {
    setData((prev) => ({
      ...prev,
      address: value,
      workingArea: value,
      userHasEdited: true,
    }));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const label = `Current location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
      setData((prev) => ({
        ...prev,
        address: label,
        workingArea: label,
        userHasEdited: true,
      }));
    });
  };

  const applyBestAvailableCleaner = () => {
    setData((prev) => ({
      ...prev,
      cleanerId: '',
      cleaner: {
        id: 'ai-recommended',
        name: 'Best available cleaner',
        rating: 4.8,
        jobs: 100,
        type: 'ai',
      },
      teamId: '',
      userHasEdited: true,
    }));
  };

  const selectBestAvailable = () => {
    applyBestAvailableCleaner();
    onContinue();
  };
  const handleSidebarContinue = () => {
    if (!hasRequiredStep1Data || !hasLocation) return;
    if (!hasCleaner && !manualOpen) {
      applyBestAvailableCleaner();
      onContinue();
      return;
    }
    if (hasCleaner) onContinue();
  };


  const selectCleaner = (id: string) => {
    const cleaner = apiCleaners.find((c) => c.id === id);
    setData((prev) => ({
      ...prev,
      cleanerId: id,
      cleaner: cleaner
        ? {
            id: cleaner.id,
            name: cleaner.name,
            rating: cleaner.rating ?? 0,
            jobs: cleaner.completed_jobs_count ?? 0,
            type: 'manual',
          }
        : prev.cleaner ?? null,
      teamId: '',
      userHasEdited: true,
    }));
    if (hasRequiredStep1Data && hasLocation) {
      onContinue();
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={18} className="text-gray-500" />
            </button>
          ) : null}
          <div className="min-w-0 hidden sm:block">
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Shalean Cleaning Services</p>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Choose your cleaner</h1>
            <p className="text-xs text-gray-500 mt-0.5">Step 2 of 4 · Takes ~1 min</p>
          </div>
        </div>
        <BookingFlowStepIndicator activeStep={2} stepHint="Takes ~1 min" />
      </div>

      <BookingFlowLayout
        sidebar={
          <BookingSummarySidebar
            serviceType={serviceTitle}
            rooms={data.bedrooms + (data.extraRooms || 0)}
            bathrooms={data.bathrooms}
            location={data.workingArea || data.address || ''}
            date={data.date}
            time={data.time}
            totalPrice={data.pricing?.total ?? null}
            onContinue={handleSidebarContinue}
            continueDisabled={!canContinue}
            continueLabel="Continue →"
          />
        }
      >
        {pricingLockError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {pricingLockError}
          </div>
        ) : null}

        <section className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-violet-600" />
            <h2 className="text-base font-bold text-gray-900">Where should we clean?</h2>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter your address"
              value={data.address || data.workingArea || ''}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
            <button
              type="button"
              onClick={useCurrentLocation}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:border-violet-300"
            >
              <Navigation className="h-3.5 w-3.5" />
              Use current location
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 space-y-4">
          {!manualOpen ? (
            <RecommendedCleanerCard onConfirm={selectBestAvailable} disabled={!hasRequiredStep1Data || !hasLocation} />
          ) : null}

          <button
            type="button"
            onClick={() => setManualOpen((v) => !v)}
            className="text-sm font-semibold text-violet-600 hover:text-violet-800 underline underline-offset-2"
          >
            {manualOpen ? '← Back to recommended cleaner' : 'Prefer to choose yourself?'}
          </button>

          {manualOpen ? (
            cleanersLoading ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-sm text-violet-700">
                  Finding cleaners...
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
                  <div className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
                </div>
                <CleanerList
                  cleaners={apiCleaners}
                  loading={cleanersLoading}
                  selectedCleanerId={data.cleanerId}
                  fallbackPrice={pricing.total}
                  onSelect={(cleaner) => selectCleaner(cleaner.id)}
                />
              </div>
            ) : apiCleaners.length > 0 ? (
              <CleanerList
                cleaners={apiCleaners}
                loading={false}
                selectedCleanerId={data.cleanerId}
                fallbackPrice={pricing.total}
                onSelect={(cleaner) => selectCleaner(cleaner.id)}
              />
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                No cleaners are available right now for this selection. Try changing time, date, or location.
              </div>
            )
          ) : null}
        </section>
      </BookingFlowLayout>
    </div>
  );
}

