import { redirect } from 'next/navigation';

// Redirect /booking/flow to canonical booking URL
export default function BookingFlowPage() {
  redirect('/booking/service/standard/plan');
}
