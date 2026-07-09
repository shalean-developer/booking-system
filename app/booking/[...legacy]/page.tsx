import { redirect } from 'next/navigation';

export default function LegacyBookingFallback() {
  redirect('/booking-v2');
}

