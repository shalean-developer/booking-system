import { redirect } from 'next/navigation';

/**
 * Root /booking redirects to canonical URL: /booking/service/standard/plan
 */
export default function BookingPage() {
  redirect('/booking/service/standard/plan');
}
