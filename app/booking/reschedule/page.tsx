import { Suspense } from 'react';
import {
  getBookingByManageToken,
  canManageBooking,
  isBookingDateInPast,
  toPublicBookingView,
} from '@/lib/booking-manage';
import { isValidManageTokenFormat } from '@/lib/manage-booking-token';
import { ManageError } from '@/app/booking/_components/manage-ui';
import { DashboardRescheduleRedirect } from '@/app/booking/reschedule/dashboard-redirect';
import { PublicRescheduleByToken } from '@/app/booking/reschedule/public-by-token';

export const dynamic = 'force-dynamic';

export default async function ReschedulePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; id?: string }>;
}) {
  const p = await searchParams;

  if (p.token) {
    if (!isValidManageTokenFormat(p.token)) {
      return <ManageError title="Invalid link" message="Check the link in your email and try again." />;
    }
    const { data, error } = await getBookingByManageToken(p.token);
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
          title="Cannot reschedule"
          message="This booking is completed or cancelled. Contact us for help."
        />
      );
    }
    if (isBookingDateInPast(data.booking_date)) {
      return (
        <ManageError
          title="Booking has passed"
          message="Please contact us if you still need assistance."
        />
      );
    }
    return <PublicRescheduleByToken token={p.token.trim()} initial={toPublicBookingView(data)} />;
  }

  if (p.id) {
    return (
      <Suspense fallback={null}>
        <DashboardRescheduleRedirect bookingId={p.id} />
      </Suspense>
    );
  }

  return (
    <ManageError
      title="Missing information"
      message="Open the reschedule link from your confirmation email, or reschedule from your dashboard."
    />
  );
}
