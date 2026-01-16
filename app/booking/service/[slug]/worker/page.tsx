'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Waves, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useBookingPath } from '@/lib/useBookingPath';
import { slugToServiceType } from '@/lib/booking-utils';
import { WorkerSelection } from '@/components/worker-selection';
import { BookingSummaryDetails } from '@/components/booking-summary-details';
import { PRICING } from '@/lib/pricing';
import type { ServiceType as DbServiceType } from '@/types/booking';
import { supabase as supabaseClient } from '@/lib/supabase-client';

// Map URL/service-card IDs to DB pricing service_type values
type ServiceType = 'standard' | 'deep' | 'airbnb' | 'move' | 'carpet';
const SERVICE_ID_TO_DB: Record<ServiceType, DbServiceType> = {
  standard: 'Standard',
  deep: 'Deep',
  airbnb: 'Airbnb',
  move: 'Move In/Out',
  carpet: 'Carpet',
};

// Helper Component
const StepIndicator = ({
  currentStep
}: {
  currentStep: number;
}) => {
  const steps = [{
    id: 1,
    label: 'Details'
  }, {
    id: 2,
    label: 'Worker'
  }, {
    id: 3,
    label: 'Submit'
  }];
  return (
    <div className="flex items-center justify-center space-x-3">
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
              currentStep >= step.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
            )}>
              {currentStep > step.id ? <CheckCircle2 className="w-4 h-4" /> : step.id}
            </div>
            <span className={cn(
              "text-[10px] mt-1.5 font-medium uppercase tracking-wider",
              currentStep >= step.id ? "text-blue-600" : "text-gray-400"
            )}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={cn("h-px w-12", currentStep > step.id ? "bg-blue-600" : "bg-gray-200")} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default function WorkerPage() {
  const params = useParams();
  const router = useRouter();
  const { state, updateField } = useBookingV2();
  const { getSelectPath } = useBookingPath();
  const slug = params.slug as string;
  const serviceFromSlug = slugToServiceType(slug);

  // Service rates state
  const [serviceRates, setServiceRates] = useState<{ base: number; bedroom: number; bathroom: number } | null>(null);
  const [serviceRatesLoading, setServiceRatesLoading] = useState(false);
  const [extrasPrices, setExtrasPrices] = useState<Record<string, number>>({});

  // Convert state service to URL service type format
  const selectedService: ServiceType | null = useMemo(() => {
    if (!state.service) return null;
    const dbToUrl: Record<DbServiceType, ServiceType> = {
      'Standard': 'standard',
      'Deep': 'deep',
      'Airbnb': 'airbnb',
      'Move In/Out': 'move',
      'Carpet': 'carpet',
    };
    return dbToUrl[state.service] || null;
  }, [state.service]);

  useEffect(() => {
    updateField('currentStep', 2);
    if (serviceFromSlug && serviceFromSlug !== state.service) {
      updateField('service', serviceFromSlug);
    }
    if (!state.service) {
      router.push(getSelectPath);
    }
  }, [serviceFromSlug, state.service, updateField, router, getSelectPath]);

  // Fetch service prices from DB when selected service changes
  useEffect(() => {
    let cancelled = false;

    const serviceKey: DbServiceType | null = selectedService ? SERVICE_ID_TO_DB[selectedService] : null;
    if (!serviceKey) {
      setServiceRates(null);
      setServiceRatesLoading(false);
      return;
    }

    setServiceRatesLoading(true);
    (async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabaseClient
        .from('pricing_config')
        .select('price_type, price, effective_date')
        .eq('is_active', true)
        .eq('service_type', serviceKey)
        .in('price_type', ['base', 'bedroom', 'bathroom'])
        .lte('effective_date', today)
        .or(`end_date.is.null,end_date.gt.${today}`)
        .order('effective_date', { ascending: false });

      if (error) throw error;

      // Take the most recent value per price_type
      const latest: Partial<Record<'base' | 'bedroom' | 'bathroom', number>> = {};
      for (const row of (data || []) as any[]) {
        const pt = row.price_type as 'base' | 'bedroom' | 'bathroom';
        if (latest[pt] === undefined) {
          latest[pt] = Number(row.price);
        }
      }

      const fallback = (PRICING.services as any)[serviceKey] as { base: number; bedroom: number; bathroom: number } | undefined;
      const nextRates = {
        base: latest.base ?? fallback?.base ?? 250,
        bedroom: latest.bedroom ?? fallback?.bedroom ?? 35,
        bathroom: latest.bathroom ?? fallback?.bathroom ?? 35,
      };

      if (!cancelled) {
        setServiceRates(nextRates);
        setServiceRatesLoading(false);
      }
    })().catch(() => {
      if (cancelled) return;
      const fallback = (PRICING.services as any)[serviceKey] as { base: number; bedroom: number; bathroom: number } | undefined;
      setServiceRates({
        base: fallback?.base ?? 250,
        bedroom: fallback?.bedroom ?? 35,
        bathroom: fallback?.bathroom ?? 35,
      });
      setServiceRatesLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedService]);

  // Fetch extras prices
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabaseClient
        .from('pricing_config')
        .select('item_name, price, effective_date')
        .eq('is_active', true)
        .eq('price_type', 'extra')
        .lte('effective_date', today)
        .or(`end_date.is.null,end_date.gt.${today}`)
        .order('effective_date', { ascending: false });

      if (error) throw error;

      const prices: Record<string, number> = {};
      const seen = new Set<string>();
      for (const row of (data || []) as any[]) {
        const name = String(row.item_name || '').trim();
        if (!name || seen.has(name)) continue;
        seen.add(name);
        prices[name] = Number(row.price) || 0;
      }

      if (!cancelled) {
        setExtrasPrices(prices);
      }
    })().catch(() => {
      // Fallback to PRICING.extras (static)
      if (!cancelled) {
        setExtrasPrices(PRICING.extras as Record<string, number>);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Calculate summary values
  const safeBedrooms = state.bedrooms ?? 0;
  const safeBathrooms = state.bathrooms ?? 1;
  const safeOfficeCount = 0; // Not available in V2 state, default to 0
  const selectedServiceKey: DbServiceType | null = selectedService ? SERVICE_ID_TO_DB[selectedService] : null;
  const fallbackRates = selectedServiceKey ? ((PRICING.services as any)[selectedServiceKey] as { base: number; bedroom: number; bathroom: number } | undefined) : undefined;
  const basePrice = serviceRates?.base ?? fallbackRates?.base ?? 250;
  const bedroomRate = serviceRates?.bedroom ?? fallbackRates?.bedroom ?? 35;
  const bathroomRate = serviceRates?.bathroom ?? fallbackRates?.bathroom ?? 35;

  const carpetRoomStatus = state.carpetDetails?.roomStatus || null;
  const carpetPropertyMoveFee = selectedServiceKey === 'Carpet' && carpetRoomStatus === 'hasProperty' ? 250 : 0;
  const roomTotal = selectedServiceKey === 'Carpet'
    ? ((state.carpetDetails?.numberOfRooms || 0) * bedroomRate + (state.carpetDetails?.numberOfLooseCarpets || 0) * bathroomRate + carpetPropertyMoveFee)
    : (safeBedrooms * bedroomRate + safeBathrooms * bathroomRate + safeOfficeCount * bedroomRate);

  const extrasTotal = (state.extras || []).reduce((acc, name) => {
    const quantity = state.extrasQuantities?.[name] ?? 1;
    const unitPrice = extrasPrices[name] ?? (PRICING.extras as any)[name] ?? 0;
    return acc + (unitPrice * Math.max(quantity, 1));
  }, 0);

  const isStandardOrAirbnb = selectedService === 'standard' || selectedService === 'airbnb';
  const cleanersCount = Math.max(1, Math.round(state.numberOfCleaners || 1));
  const equipmentCharge = isStandardOrAirbnb && state.provideEquipment ? (PRICING.equipmentCharge ?? 500) : 0;

  const laborSubtotalOneCleaner = basePrice + roomTotal + extrasTotal;
  const subtotal = (isStandardOrAirbnb ? laborSubtotalOneCleaner * cleanersCount : laborSubtotalOneCleaner) + equipmentCharge;
  const serviceFee = subtotal * 0.1176;
  const total = subtotal + serviceFee;

  if (!state.service) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Shalean</span>
          </div>

          {/* Stepper - Between logo and navlinks */}
          <div className="hidden md:flex items-center justify-center flex-1 px-8">
            <StepIndicator currentStep={2} />
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-blue-600">Services</a>
            <a href="#" className="hover:text-blue-600">Pricing</a>
            <a href="#" className="hover:text-blue-600">Help Center</a>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors">
              Book Now
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            <WorkerSelection />
          </div>

          {/* Sticky Sidebar Summary */}
          <BookingSummaryDetails
            selectedService={selectedService}
            numCleaners={cleanersCount}
            equipmentSupplied={state.provideEquipment}
            serviceRatesLoading={serviceRatesLoading}
            basePrice={basePrice}
            roomTotal={roomTotal}
            bookingDate={state.date || ''}
            bookingTime={state.time || ''}
            selectedExtras={state.extras || []}
            extrasTotal={extrasTotal}
            subtotal={subtotal}
            serviceFee={serviceFee}
            total={total}
            safeBedrooms={safeBedrooms}
            safeBathrooms={safeBathrooms}
            safeOfficeCount={safeOfficeCount}
            carpetRoomStatus={carpetRoomStatus}
            extrasPrices={extrasPrices}
          />
        </div>
      </main>
    </div>
  );
}
