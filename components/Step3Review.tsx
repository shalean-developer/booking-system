'use client';

import type { ReactNode } from 'react';
import { CalendarDays, CheckCircle2, Clock3, Home, MapPin, ShieldCheck, UserCheck } from 'lucide-react';
import type { BookingFormData } from '@/components/booking-system-types';
import { BookingFlowLayout } from '@/components/booking/booking-flow-layout';
import { BookingFlowStepIndicator } from '@/components/booking-flow-step-indicator';
import { BookingSummarySidebar } from '@/components/booking/booking-summary-sidebar';

interface Step3ReviewProps {
  data: BookingFormData;
  serviceTitle: string;
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
  onGoStep1: () => void;
  onGoStep2: () => void;
  onGoStep4: () => void;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'Not selected';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return 'Not selected';
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString('en-ZA', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export function Step3Review({
  data,
  serviceTitle,
  pricing,
  onGoStep1,
  onGoStep2,
  onGoStep4,
}: Step3ReviewProps) {
  const location = data.workingArea?.trim() || data.address?.trim() || '';
  const hasRequired = Boolean(location && data.cleaner && data.date && data.time);

  const cleanerLabel = data.cleaner?.type === 'manual'
    ? data.cleaner.name
    : 'Best available cleaner';

  const estimatedHours = pricing.engineMeta?.estimatedHours ?? pricing.engineMeta?.estimatedJobHours ?? 0;

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans">
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden min-w-0 sm:block">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Review your booking</h1>
            <p className="text-xs text-gray-500 mt-0.5">Confirm details before payment</p>
          </div>
        </div>
        <BookingFlowStepIndicator activeStep={3} stepHint="Quick final check" />
      </div>

      <BookingFlowLayout
        sidebar={
          <BookingSummarySidebar
            serviceType={serviceTitle}
            rooms={data.bedrooms + (data.extraRooms || 0)}
            bathrooms={data.bathrooms}
            location={location}
            date={data.date}
            time={data.time}
            totalPrice={data.pricing?.total ?? null}
            onContinue={onGoStep4}
            continueDisabled={!hasRequired}
            continueLabel="Pay now →"
            urgencyMessage="We’re holding your time slot for the next few minutes"
          />
        }
      >
        <section className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6">
          <div className="space-y-4">
            <SummaryRow
              icon={<MapPin className="h-4 w-4 text-violet-600" />}
              label="Location"
              value={location || 'Missing location'}
              onEdit={onGoStep2}
            />
            <SummaryRow
              icon={<Home className="h-4 w-4 text-violet-600" />}
              label="Service"
              value={serviceTitle}
              onEdit={onGoStep1}
            />
            <SummaryRow
              icon={<CalendarDays className="h-4 w-4 text-violet-600" />}
              label="Date & Time"
              value={`${formatDate(data.date)} · ${formatTime(data.time)}`}
              onEdit={onGoStep1}
            />
            <SummaryRow
              icon={<UserCheck className="h-4 w-4 text-violet-600" />}
              label="Cleaner"
              value={cleanerLabel}
              onEdit={onGoStep2}
            />
            <SummaryRow
              icon={<CheckCircle2 className="h-4 w-4 text-violet-600" />}
              label="Home details"
              value={`${data.bedrooms} bedrooms · ${data.bathrooms} bathrooms · ${data.extraRooms || 0} extra rooms`}
            />
            <SummaryRow
              icon={<Clock3 className="h-4 w-4 text-violet-600" />}
              label="Duration"
              value={estimatedHours > 0 ? `${estimatedHours.toFixed(1)} hours` : 'Will be confirmed'}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 sm:p-5">
          <p className="mb-3 text-sm font-semibold text-violet-900">Why customers trust this booking</p>
          <ul className="space-y-2 text-sm text-violet-900">
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Your time is reserved</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Cleaner assigned after booking</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Free cancellation</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Secure checkout</li>
          </ul>
        </section>
      </BookingFlowLayout>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  onEdit,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onEdit?: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <p className="text-sm font-semibold text-gray-900">{label}</p>
        </div>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-semibold text-violet-600 hover:text-violet-800"
          >
            Edit
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-gray-700">{value}</p>
    </div>
  );
}

