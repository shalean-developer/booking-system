import { redirect } from 'next/navigation';

// Redirect to main booking flow (new BookingSystem at /booking)
export default function BookingServiceStepPage() {
  redirect('/booking');
}
