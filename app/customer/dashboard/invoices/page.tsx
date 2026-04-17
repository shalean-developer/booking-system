import Link from 'next/link';
import { createClient, getAuthUserWithProfile } from '@/lib/supabase-server';
import { formatZarFromMinorUnits, invoicePaymentLabel } from '@/lib/invoice-bookings';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CustomerInvoicesPage() {
  const profile = await getAuthUserWithProfile();
  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-4 text-2xl font-semibold text-zinc-900">Invoices</h1>
        <p className="mb-4 text-zinc-500">
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
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(
      'id, service_type, created_at, total_amount, status, payment_status, invoice_url, booking_date'
    )
    .eq('customer_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[customer/invoices]', error.message);
  }

  const rows = Array.isArray(bookings) ? bookings : [];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Invoices</h1>

      {rows.length === 0 ? (
        <p className="text-zinc-500">
          No invoices yet. Your bookings will appear here.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((b) => {
            const payLabel = invoicePaymentLabel(b.payment_status, b.status);
            return (
              <div
                key={b.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-zinc-900">#{b.id}</p>
                  <p className="text-sm text-zinc-500">
                    {b.service_type ?? 'Service'}{' '}
                    <span className="text-zinc-300">•</span>{' '}
                    {b.created_at
                      ? new Date(b.created_at).toLocaleDateString('en-ZA')
                      : '—'}
                  </p>
                  <p className="text-sm text-zinc-600">
                    R {formatZarFromMinorUnits(b.total_amount)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      payLabel === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    )}
                  >
                    {payLabel}
                  </span>
                  <span className="text-xs text-zinc-400" title="Booking status">
                    {b.status}
                  </span>

                  {b.invoice_url ? (
                    <a
                      href={b.invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Download →
                    </a>
                  ) : (
                    <span className="text-xs text-zinc-400">No PDF yet</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
