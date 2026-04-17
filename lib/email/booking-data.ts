import { calcTotalSync } from '@/lib/pricing';
import { fetchActivePricing } from '@/lib/pricing-db';
import type { BookingState, ServiceType } from '@/types/booking';
import type { BookingEmailData } from '@/shared/email/types';
import { formatBookingDateDisplay, formatBookingTimeDisplay } from '@/shared/email/datetime';
import { publicSiteBaseUrl } from '@/lib/booking-manage';

function displayBookingId(bookingId: string): string {
  return /^SC\d{8}$/.test(bookingId) ? bookingId : bookingId.slice(-8);
}

function cleanerSummaryFromBooking(booking: {
  cleanerName?: string | null;
  cleaner_id?: string;
}): string | undefined {
  if (booking.cleanerName?.trim()) {
    return `Assigned cleaner: ${booking.cleanerName.trim()}`;
  }
  if (booking.cleaner_id === 'manual') {
    return 'Manual assignment requested — our team will assign the best available cleaner and confirm with you shortly.';
  }
  if (booking.cleaner_id) {
    return 'A cleaner will be assigned to your booking shortly.';
  }
  return undefined;
}

export type BookingStateForCustomerEmail = BookingState & {
  bookingId: string;
  totalAmount?: number;
  cleanerName?: string;
  equipment_required?: boolean;
  equipment_fee?: number;
  /** When building from a DB row (e.g. resend) — bookings.status === 'paid' */
  inferredPaid?: boolean;
  manageToken?: string;
};

/**
 * Maps booking flow / API state to the shared customer confirmation payload.
 */
export async function buildBookingEmailDataFromBookingState(
  booking: BookingStateForCustomerEmail,
): Promise<BookingEmailData> {
  let totalPrice: number | undefined;
  if (booking.totalAmount !== undefined && booking.totalAmount > 0) {
    totalPrice =
      booking.totalAmount > 1000 ? booking.totalAmount / 100 : booking.totalAmount;
  } else {
    const pricingData = await fetchActivePricing();
    const pricingDetails = calcTotalSync(
      {
        service: booking.service as ServiceType,
        bedrooms: booking.bedrooms || 0,
        bathrooms: booking.bathrooms || 0,
        extras: booking.extras || [],
        extrasQuantities: booking.extrasQuantities,
      },
      booking.frequency || 'one-time',
      pricingData,
    );
    totalPrice = pricingDetails.total;
  }

  const equipmentRequired =
    (booking as { equipment_required?: boolean }).equipment_required ??
    booking.provideEquipment ??
    false;
  const equipmentFeeRaw = (booking as { equipment_fee?: number }).equipment_fee;
  const equipmentFeeZar =
    typeof equipmentFeeRaw === 'number' && Number.isFinite(equipmentFeeRaw)
      ? equipmentFeeRaw
      : 0;

  const id = displayBookingId(booking.bookingId);
  const siteUrl = publicSiteBaseUrl();

  const paid =
    Boolean(booking.paymentReference?.trim()) ||
    booking.inferredPaid === true;
  const status: 'paid' | 'pending' = paid ? 'paid' : 'pending';

  const addressParts = [
    booking.address?.line1,
    booking.address?.suburb,
    booking.address?.city,
  ].filter(Boolean) as string[];
  const address = addressParts.length ? addressParts.join(', ') : undefined;

  return {
    customerName: `${booking.firstName} ${booking.lastName}`.trim() || 'Customer',
    serviceName: booking.service ?? 'Cleaning',
    bookingId: id,
    amountZar: totalPrice,
    status,
    bookingDate: formatBookingDateDisplay(booking.date ?? undefined),
    bookingTime: formatBookingTimeDisplay(booking.time ?? undefined),
    address,
    paymentReference: booking.paymentReference?.trim() || undefined,
    equipmentRequired,
    equipmentFeeZar,
    cleanerSummary: cleanerSummaryFromBooking(booking),
    manageBookingUrl: `${siteUrl}/dashboard`,
    trackingUrl: `${siteUrl}/dashboard`,
    siteBaseUrl: siteUrl,
    manageToken: booking.manageToken,
    whatsappUrl: `https://wa.me/27871535250?text=${encodeURIComponent(
      `Hi Shalean, regarding booking #${id}`,
    )}`,
  };
}
