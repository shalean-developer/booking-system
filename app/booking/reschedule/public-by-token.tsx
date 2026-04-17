'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import type { PublicBookingManageView } from '@/lib/booking-manage';
import { STANDARD_BOOKING_TIME_IDS } from '@/lib/booking-time-slots';
import { formatBookingDateDisplay, formatBookingTimeDisplay } from '@/shared/email/datetime';
import { Loader2 } from 'lucide-react';
import { ManageCard, ManageShell } from '@/app/booking/_components/manage-ui';

export function PublicRescheduleByToken({
  token,
  initial,
}: {
  token: string;
  initial: PublicBookingManageView;
}) {
  const router = useRouter();
  const [bookingDate, setBookingDate] = useState(initial.bookingDate || '');
  const [bookingTime, setBookingTime] = useState(initial.bookingTime || '09:00');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentWhen = [
    initial.bookingDate ? formatBookingDateDisplay(initial.bookingDate) : null,
    initial.bookingTime ? formatBookingTimeDisplay(initial.bookingTime) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/booking/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, booking_date: bookingDate, booking_time: bookingTime }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error || 'Could not update your booking.');
        setSubmitting(false);
        return;
      }
      router.push('/booking/reschedule/success');
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <ManageShell>
      <ManageCard title="Reschedule booking">
        <p className="text-zinc-500">
          Reference <span className="font-mono text-zinc-800">{initial.referenceLabel}</span>
        </p>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Current</p>
          <p className="mt-1 text-zinc-800">{currentWhen || '—'}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div>
            <label htmlFor="bd" className="block text-xs font-medium text-zinc-500">
              New date
            </label>
            <input
              id="bd"
              type="date"
              required
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="bt" className="block text-xs font-medium text-zinc-500">
              New start time
            </label>
            <select
              id="bt"
              required
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {STANDARD_BOOKING_TIME_IDS.map((t) => (
                <option key={t} value={t}>
                  {formatBookingTimeDisplay(t) ?? t}
                </option>
              ))}
            </select>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Confirm new time
          </button>
        </form>

        <p className="border-t border-zinc-100 pt-4 text-center">
          <Link href={`/booking/manage?token=${encodeURIComponent(token)}`} className="text-sm text-zinc-500 hover:text-zinc-800">
            ← Back
          </Link>
        </p>
      </ManageCard>
    </ManageShell>
  );
}
