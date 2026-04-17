import Link from 'next/link';
import {
  getBookingByManageToken,
  canManageBooking,
  isBookingDateInPast,
  toPublicBookingView,
  publicSiteBaseUrl,
} from '@/lib/booking-manage';
import { isValidManageTokenFormat } from '@/lib/manage-booking-token';
import { formatBookingDateDisplay, formatBookingTimeDisplay } from '@/shared/email/datetime';
import { ManageCard, ManageError, ManageShell } from '@/app/booking/_components/manage-ui';

export const dynamic = 'force-dynamic';

export default async function ManageBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token: raw } = await searchParams;
  const token = raw?.trim() ?? '';

  if (!isValidManageTokenFormat(token)) {
    return <ManageError title="Invalid link" message="Check the link in your email and try again." />;
  }

  const { data, error } = await getBookingByManageToken(token);

  if (error || !data) {
    return (
      <ManageError
        title="Booking not found"
        message="This link may be incorrect or no longer active."
      />
    );
  }

  if (!canManageBooking(data)) {
    return (
      <ManageError
        title="Cannot manage online"
        message="This booking is completed, cancelled, or missing a manage link. Contact us for help."
      />
    );
  }

  const v = toPublicBookingView(data);
  const when = [
    v.bookingDate ? formatBookingDateDisplay(v.bookingDate) : null,
    v.bookingTime ? formatBookingTimeDisplay(v.bookingTime) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const enc = encodeURIComponent(token);
  const past = isBookingDateInPast(data.booking_date);
  const site = publicSiteBaseUrl();

  return (
    <ManageShell>
      <ManageCard title="Your booking">
        <p className="text-zinc-500">
          Reference <span className="font-mono text-zinc-800">{v.referenceLabel}</span>
        </p>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Service</p>
          <p className="mt-1 text-zinc-900">{v.serviceName}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">When</p>
          <p className="mt-1 text-zinc-900">{when || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Where</p>
          <p className="mt-1 text-zinc-900">{v.addressLine}</p>
        </div>

        {past ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
            This booking date has passed. For changes, contact us at{' '}
            <a className="font-medium text-indigo-600" href={`${site}/contact`}>
              shalean.co.za
            </a>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link
              href={`/booking/reschedule?token=${enc}`}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
            >
              Reschedule
            </Link>
            <Link
              href={`/booking/cancel?token=${enc}`}
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50"
            >
              Cancel booking
            </Link>
          </div>
        )}
      </ManageCard>
    </ManageShell>
  );
}
