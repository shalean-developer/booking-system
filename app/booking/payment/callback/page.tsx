'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Legacy Paystack return URL. New flows use `/payment/status` directly.
 */
function LegacyCallbackRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const reference =
      searchParams.get('reference')?.trim() ||
      searchParams.get('trxref')?.trim() ||
      '';
    const bookingId = searchParams.get('booking_id')?.trim() || '';

    const next = new URLSearchParams();
    if (reference) {
      next.set('reference', reference);
    }
    if (bookingId) {
      next.set('booking_id', bookingId);
      next.set('ref', bookingId);
    }

    const qs = next.toString();
    router.replace(qs ? `/payment/status?${qs}` : '/payment/status');
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-600" aria-hidden />
        <p className="mt-4 text-sm text-zinc-600">Redirecting…</p>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <LegacyCallbackRedirect />
    </Suspense>
  );
}
