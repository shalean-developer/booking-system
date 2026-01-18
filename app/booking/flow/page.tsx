import { redirect } from 'next/navigation';

// Redirect /booking/flow to /booking for backward compatibility
export default function BookingFlowPage() {
  redirect('/booking');
}
