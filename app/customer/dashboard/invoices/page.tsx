import Link from 'next/link';
import { createClient, getAuthUserWithProfile } from '@/lib/supabase-server';
import { listCustomerBookingsForInvoicePage } from '@/lib/dashboard/customer-booking-list';
import { CustomerInvoiceRow } from '@/components/dashboard/shared/customer-invoice-row';

export const dynamic = 'force-dynamic';

export default async function CustomerInvoicesPage() {
  const profile = await getAuthUserWithProfile();
  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">Invoices</h1>
        <p className="mb-4 text-gray-500">
          No customer profile is linked to this account yet. Book while signed in to see your
          invoice history here.
        </p>
        <Link
          href="/dashboard"
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: bookings, error } = await listCustomerBookingsForInvoicePage(supabase, profile.id);

  if (error) {
    console.error('[customer/invoices]', error.message);
  }

  const rows = Array.isArray(bookings) ? bookings : [];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Invoices</h1>

      {rows.length === 0 ? (
        <p className="text-gray-500">No invoices yet. Your bookings will appear here.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((b) => (
            <CustomerInvoiceRow key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}
