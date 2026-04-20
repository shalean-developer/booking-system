'use client';

import { useParams } from 'next/navigation';
import { LiveTrackingView } from '@/components/booking/live-tracking-view';

export default function BookingTrackPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-gray-600">
        Invalid booking reference.
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4 px-4">
        <h1 className="text-center text-lg font-semibold text-gray-900">Live tracking</h1>
      </header>
      <LiveTrackingView bookingId={id} />
    </div>
  );
}
