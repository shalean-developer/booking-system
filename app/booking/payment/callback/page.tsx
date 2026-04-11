'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

type VerifyState =
  | { status: 'loading' }
  | { status: 'success'; zoho_invoice_id: string | null; booking_id: string; amount_zar?: number }
  | { status: 'error'; message: string };

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref') || '';
  const bookingId = searchParams.get('booking_id') || '';

  const [state, setState] = useState<VerifyState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!reference || !bookingId) {
        setState({
          status: 'error',
          message: 'Missing payment reference or booking. Please use the link from your booking confirmation.',
        });
        return;
      }

      try {
        const res = await fetch('/api/payment/edge/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference, booking_id: bookingId }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok || !data.ok) {
          setState({
            status: 'error',
            message: data.error || data.message || 'Payment verification failed',
          });
          return;
        }

        setState({
          status: 'success',
          zoho_invoice_id: data.zoho_invoice_id ?? null,
          booking_id: data.booking_id || bookingId,
          amount_zar: data.amount_zar,
        });
      } catch {
        if (!cancelled) {
          setState({ status: 'error', message: 'Network error. Please try again or contact support.' });
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [reference, bookingId]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {state.status === 'loading' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-violet-600" aria-hidden />
            <p className="text-gray-700">Confirming your payment…</p>
          </div>
        )}

        {state.status === 'success' && (
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" aria-hidden />
            <h1 className="text-xl font-semibold text-gray-900">Payment successful</h1>
            <p className="text-gray-600 text-sm">
              Your booking <span className="font-mono font-medium">{state.booking_id}</span> is confirmed.
            </p>
            {typeof state.amount_zar === 'number' && (
              <p className="text-gray-700">
                Amount paid: <strong>R {state.amount_zar.toFixed(2)}</strong>
              </p>
            )}
            {state.zoho_invoice_id && (
              <p className="text-sm text-gray-600">
                Invoice ID:{' '}
                <span className="font-mono text-gray-900">{state.zoho_invoice_id}</span>
              </p>
            )}
            <p className="text-sm text-gray-500">
              A confirmation email has been sent to your inbox.
            </p>
            <Link
              href="/booking/confirmation"
              className="inline-block mt-4 w-full rounded-xl bg-violet-600 px-4 py-3 text-white font-medium hover:bg-violet-700 transition-colors"
            >
              View booking details
            </Link>
          </div>
        )}

        {state.status === 'error' && (
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" aria-hidden />
            <h1 className="text-xl font-semibold text-gray-900">Could not confirm payment</h1>
            <p className="text-gray-600 text-sm">{state.message}</p>
            <Link href="/booking" className="inline-block mt-2 text-violet-600 font-medium hover:underline">
              Back to booking
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
