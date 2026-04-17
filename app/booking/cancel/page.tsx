import {
  getBookingByManageToken,
  canManageBooking,
  isBookingDateInPast,
  toPublicBookingView,
} from '@/lib/booking-manage';
import { isValidManageTokenFormat } from '@/lib/manage-booking-token';
import { ManageError } from '@/app/booking/_components/manage-ui';
import { PublicCancelByToken } from '@/app/booking/cancel/public-cancel';

export const dynamic = 'force-dynamic';

export default async function CancelBookingPage({
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
        title="Cannot cancel online"
        message="This booking is already completed or cancelled."
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

  return <PublicCancelByToken token={token} initial={toPublicBookingView(data)} />;
}
