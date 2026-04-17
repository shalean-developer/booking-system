'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import type { PublicBookingManageView } from '@/lib/booking-manage';
import { formatBookingDateDisplay, formatBookingTimeDisplay } from '@/shared/email/datetime';
import { Loader2 } from 'lucide-react';
import { ManageCard, ManageShell } from '@/app/booking/_components/manage-ui';

export function PublicCancelByToken({
  token,
  initial,
}: {
  token: string;
  initial: PublicBookingManageView;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const when = [
    initial.bookingDate ? formatBookingDateDisplay(initial.bookingDate) : null,
    initial.bookingTime ? formatBookingTimeDisplay(initial.bookingTime) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  async function onConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/booking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error || 'Could not cancel this booking.');
        setSubmitting(false);
        return;
      }
      router.push('/booking/cancel/success');
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <ManageShell>
      <ManageCard title="Cancel booking">
        <p className="text-zinc-500">
          Reference <span className="font-mono text-zinc-800">{initial.referenceLabel}</span>
        </p>
        <p className="text-zinc-800">{when || '—'}</p>

        <p className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-3 text-zinc-800">
          Are you sure you want to cancel? This cannot be undone online.
        </p>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
          <Link
            href={`/booking/manage?token=${encodeURIComponent(token)}`}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Go back
          </Link>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-500 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Cancel booking
          </button>
        </div>
      </ManageCard>
    </ManageShell>
  );
}
