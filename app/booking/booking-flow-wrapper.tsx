'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** @deprecated Public wizard lives at `/booking-v2`. */
export function BookingFlowWrapper() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/booking-v2');
  }, [router]);
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-zinc-50 text-sm text-zinc-600">
      Redirecting to booking…
    </div>
  );
}
