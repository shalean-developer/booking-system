import { redirect } from 'next/navigation';

/**
 * Legacy URL: redirect /booking/plan to the canonical plan URL
 * /booking/service/(serviceName)/step
 */
export default function BookingPlanRedirect() {
  redirect('/booking/service/standard/plan');
}
