'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

const POLL_MS = 2000;
/** Paystack can take >10s to report success; avoid false failures while still pending. */
const MAX_ATTEMPTS = 20;
/** Avoid infinite spinner if Paystack/API never responds. */
const FETCH_TIMEOUT_MS = 18_000;
const WHATSAPP_HREF =
  'https://wa.me/27871535250?text=' +
  encodeURIComponent('Hi Shalean — I need help with a payment / booking confirmation.');

const DEFAULT_VERIFY_FAIL =
  'We could not confirm your payment. Please contact support if you were charged.';

type PollJson = {
  status?: string;
  bookingId?: string;
  booking_id?: string;
  message?: string;
};

async function fetchVerifyPoll(search: string): Promise<Response> {
  const ctrl = new AbortController();
  const kill = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(`/api/payment/verify?${search}`, {
      cache: 'no-store',
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(kill);
  }
}

function FailedIcon() {
  return (
    <div
      className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-200 bg-red-50 text-lg font-bold leading-none text-red-600 shadow-sm"
      aria-hidden
    >
      !
    </div>
  );
}

function PaymentStatusInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const reference =
    searchParams.get('reference')?.trim() ||
    searchParams.get('trxref')?.trim() ||
    '';
  const bookingHint =
    searchParams.get('booking_id')?.trim() ||
    searchParams.get('ref')?.trim() ||
    searchParams.get('id')?.trim() ||
    '';
  const ct = searchParams.get('ct')?.trim() || '';

  const [phase, setPhase] = useState<'processing' | 'timeout' | 'failed' | 'error'>('processing');
  const [failMessage, setFailMessage] = useState<string | null>(null);
  const [pollKey, setPollKey] = useState(0);

  const paymentRetryHref = useMemo(() => {
    if (bookingHint) {
      return `/booking/payment?bookingId=${encodeURIComponent(bookingHint)}`;
    }
    return '/booking/payment';
  }, [bookingHint]);

  const statusPageHref = useMemo(() => {
    const u = new URLSearchParams();
    if (reference) u.set('reference', reference);
    if (searchParams.get('trxref')) u.set('trxref', searchParams.get('trxref')!);
    if (bookingHint) {
      u.set('ref', bookingHint);
      u.set('booking_id', bookingHint);
    }
    if (ct) u.set('ct', ct);
    const q = u.toString();
    return q ? `/payment/status?${q}` : '/payment/status';
  }, [reference, searchParams, bookingHint, ct]);

  const buildConfirmationUrl = useCallback(
    (bookingId: string) => {
      const q = new URLSearchParams();
      q.set('reference', reference || `booking-${bookingId}`);
      q.set('ref', bookingId);
      if (ct) q.set('ct', ct);
      q.set('verified', '1');
      return `/booking/confirmation?${q.toString()}`;
    },
    [reference, ct],
  );

  useEffect(() => {
    if (!reference) {
      setPhase('error');
      setFailMessage('Missing payment reference. Open the link from Paystack or your email.');
      return;
    }

    let cancelled = false;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const runAttempt = async () => {
      if (cancelled) return;
      attempt += 1;

      try {
        const params = new URLSearchParams();
        params.set('reference', reference);
        params.set('poll', '1');
        if (bookingHint) {
          params.set('ref', bookingHint);
          params.set('booking_id', bookingHint);
        }
        const res = await fetchVerifyPoll(params.toString());
        let data: PollJson;
        try {
          data = (await res.json()) as PollJson;
        } catch {
          throw new Error('bad_json');
        }
        if (cancelled) return;

        if (data.status === 'success') {
          const bid = data.bookingId || data.booking_id || bookingHint;
          if (!bid) {
            setPhase('failed');
            setFailMessage('Confirmed but missing booking id. Please contact support.');
            return;
          }
          router.replace(buildConfirmationUrl(bid));
          return;
        }

        if (data.status === 'failed') {
          setPhase('failed');
          setFailMessage(data.message || 'Payment could not be confirmed.');
          return;
        }

        if (data.status === 'pending') {
          if (attempt >= MAX_ATTEMPTS) {
            setPhase('timeout');
            return;
          }
          timer = setTimeout(runAttempt, POLL_MS);
          return;
        }

        setPhase('failed');
        setFailMessage(data.message || 'Unexpected response from server.');
      } catch {
        if (cancelled) return;
        if (attempt >= MAX_ATTEMPTS) {
          setPhase('timeout');
          return;
        }
        timer = setTimeout(runAttempt, POLL_MS);
      }
    };

    setPhase('processing');
    setFailMessage(null);
    void runAttempt();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [reference, bookingHint, router, buildConfirmationUrl, pollKey]);

  const restartPolling = () => {
    setPhase('processing');
    setPollKey((k) => k + 1);
  };

  if (!reference) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <FailedIcon />
          <h1 className="mt-5 text-2xl font-bold text-zinc-900">Payment verification failed</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Missing payment reference. Open the link from Paystack or your confirmation email, or contact
            support if you were charged.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-full bg-violet-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
            >
              Return to home
            </Link>
            <Link
              href={paymentRetryHref}
              className="text-sm font-medium text-indigo-600 underline-offset-4 hover:underline"
            >
              Try payment again
            </Link>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'processing') {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-600" aria-hidden />
          <h1 className="mt-6 text-lg font-semibold text-zinc-900">Processing payment…</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Please wait while we confirm with Paystack. Do not close this page.
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'timeout') {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-700">
            …
          </div>
          <h1 className="mt-5 text-xl font-bold text-zinc-900">Still confirming your payment</h1>
          <p className="mt-2 text-sm text-zinc-600">
            This can take a few seconds. Please wait or check again. If you were charged, we&apos;ll email you
            when it clears — or message us on WhatsApp.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={restartPolling}
              className="inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-6 py-3.5 text-sm font-medium text-white shadow-md hover:bg-indigo-500"
            >
              Check again
            </button>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'failed' || phase === 'error') {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <FailedIcon />
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-zinc-900">Payment verification failed</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            {failMessage?.trim() || DEFAULT_VERIFY_FAIL}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={restartPolling}
              className="inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500"
            >
              Check payment again
            </button>
            <p className="text-xs text-zinc-500">
              If Paystack charged you, confirmation can take a moment — use this before paying a second time.
            </p>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-full bg-violet-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
            >
              Return to home
            </Link>
            <Link
              href={paymentRetryHref}
              className="text-sm font-medium text-indigo-600 underline-offset-4 hover:underline"
            >
              Pay again (only if you were not charged)
            </Link>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline"
            >
              Contact support
            </a>
            <Link
              href={statusPageHref}
              className="text-xs font-medium text-zinc-500 underline-offset-4 hover:underline"
            >
              Reload this check page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <Loader2 className="h-9 w-9 animate-spin text-indigo-600" />
        </div>
      }
    >
      <PaymentStatusInner />
    </Suspense>
  );
}
