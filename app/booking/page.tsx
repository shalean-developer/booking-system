import { Suspense } from 'react';
import { BookingFlowWrapper } from './booking-flow-wrapper';

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3001}`;
}

async function fetchFormData() {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/booking/form-data`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  const json = await res.json();
  if (!json.ok || !json.services) return null;
  return {
    services: json.services,
    pricing: json.pricing,
    extras: json.extras ?? { all: [], standardAndAirbnb: [], deepAndMove: [], quantityExtras: [], meta: {}, prices: {} },
    equipment: json.equipment ?? { items: [], charge: 500 },
  };
}

export default async function BookingPage() {
  let formData: Awaited<ReturnType<typeof fetchFormData>> = null;
  try {
    formData = await fetchFormData();
  } catch {
    // Fallback: client will fetch and show error via useBookingFormData
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading booking...</p>
          </div>
        </div>
      }
    >
      <BookingFlowWrapper initialFormData={formData} />
    </Suspense>
  );
}
