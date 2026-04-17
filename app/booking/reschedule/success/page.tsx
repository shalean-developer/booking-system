import Link from 'next/link';
import { ManageCard, ManageShell } from '@/app/booking/_components/manage-ui';

export default function RescheduleSuccessPage() {
  return (
    <ManageShell>
      <ManageCard title="Booking rescheduled">
        <p className="text-zinc-700">Your new date and time are saved. We sent a confirmation to your email.</p>
        <Link href="/" className="inline-block pt-2 font-medium text-indigo-600 hover:text-indigo-500">
          Back to home
        </Link>
      </ManageCard>
    </ManageShell>
  );
}
