import Link from 'next/link';
import { ManageCard, ManageShell } from '@/app/booking/_components/manage-ui';

export default function CancelSuccessPage() {
  return (
    <ManageShell>
      <ManageCard title="Booking cancelled">
        <p className="text-zinc-700">
          Your booking has been cancelled. If this was a mistake, contact us as soon as possible.
        </p>
        <Link href="/" className="inline-block pt-2 font-medium text-indigo-600 hover:text-indigo-500">
          Back to home
        </Link>
      </ManageCard>
    </ManageShell>
  );
}
