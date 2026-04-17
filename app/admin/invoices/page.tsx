import { createClient, createServiceClient, isAdmin } from '@/lib/supabase-server';
import {
  formatZarFromMinorUnits,
  invoicePaymentLabel,
} from '@/lib/invoice-bookings';
import { cn } from '@/lib/utils';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type Search = {
  q?: string;
  payment?: string;
  from?: string;
  to?: string;
};

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? '';
  const payment = sp.payment ?? 'all';
  const from = sp.from?.trim() ?? '';
  const to = sp.to?.trim() ?? '';

  if (!(await isAdmin())) {
    redirect('/login?returnTo=/admin/invoices');
  }

  /** Prefer service role so this list is not empty when RLS + SSR session do not align. */
  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    supabase = await createClient();
  }

  let query = supabase
    .from('bookings')
    .select(
      'id, customer_name, total_amount, status, payment_status, payment_reference, created_at, invoice_url, service_type'
    )
    .order('created_at', { ascending: false })
    .limit(500);

  if (q) {
    query = query.ilike('id', `%${q}%`);
  }

  if (payment === 'paid') {
    query = query.or(
      'payment_status.eq.success,payment_status.eq.paid,status.eq.paid'
    );
  } else if (payment === 'pending') {
    query = query
      .neq('status', 'paid')
      .or('payment_status.is.null,payment_status.eq.pending,payment_status.eq.failed');
  }

  if (from) {
    query = query.gte('created_at', `${from}T00:00:00.000Z`);
  }
  if (to) {
    query = query.lte('created_at', `${to}T23:59:59.999Z`);
  }

  const { data: bookings, error } = await query;

  if (error) {
    console.error('[admin/invoices]', error.message);
  }

  const rows = Array.isArray(bookings) ? bookings : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">All Invoices</h1>
        <p className="mt-1 text-sm text-gray-500">
          Bookings with amounts and payment status. PDF links use{' '}
          <code className="rounded bg-gray-100 px-1 text-xs">invoice_url</code> when set.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Could not load bookings: {error.message}
        </div>
      ) : null}

      <form
        method="get"
        action="/admin/invoices"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="flex min-w-[180px] flex-1 flex-col gap-1">
          <label htmlFor="inv-q" className="text-xs font-medium text-gray-600">
            Booking ID
          </label>
          <input
            id="inv-q"
            name="q"
            placeholder="Search booking ID…"
            defaultValue={q}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex min-w-[140px] flex-col gap-1">
          <label htmlFor="inv-pay" className="text-xs font-medium text-gray-600">
            Payment
          </label>
          <select
            id="inv-pay"
            name="payment"
            defaultValue={payment}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div className="flex min-w-[140px] flex-col gap-1">
          <label htmlFor="inv-from" className="text-xs font-medium text-gray-600">
            From (created)
          </label>
          <input
            id="inv-from"
            name="from"
            type="date"
            defaultValue={from}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex min-w-[140px] flex-col gap-1">
          <label htmlFor="inv-to" className="text-xs font-medium text-gray-600">
            To (created)
          </label>
          <input
            id="inv-to"
            name="to"
            type="date"
            defaultValue={to}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Apply
          </button>
          <a
            href="/admin/invoices"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset
          </a>
        </div>
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">
          No bookings match these filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3 font-medium">Booking</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Service</th>
                <th className="p-3 font-medium">Amount</th>
                <th className="p-3 font-medium">Invoice</th>
                <th className="p-3 font-medium">Booking status</th>
                <th className="p-3 font-medium">Created</th>
                <th className="p-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => {
                const payLabel = invoicePaymentLabel(b.payment_status, b.status);
                return (
                  <tr key={b.id} className="border-t border-gray-100">
                    <td className="p-3 font-mono text-xs text-gray-900">#{b.id}</td>
                    <td className="p-3 text-gray-900">
                      {b.customer_name ?? '—'}
                    </td>
                    <td className="p-3 text-gray-600">{b.service_type ?? '—'}</td>
                    <td className="p-3 text-gray-900">
                      R {formatZarFromMinorUnits(b.total_amount)}
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          payLabel === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        )}
                      >
                        {payLabel}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{b.status}</td>
                    <td className="p-3 whitespace-nowrap text-gray-600">
                      {b.created_at
                        ? new Date(b.created_at).toLocaleDateString('en-ZA')
                        : '—'}
                    </td>
                    <td className="p-3">
                      {b.invoice_url ? (
                        <a
                          href={b.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
