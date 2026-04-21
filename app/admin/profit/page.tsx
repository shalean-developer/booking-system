import { Suspense } from 'react';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import { fetchProfitDashboardData } from '@/lib/admin/profit-dashboard-data';
import { ProfitDashboardView } from '@/components/admin/profit-dashboard-view';
import { ProfitDashboard } from '@/components/admin/ProfitDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminProfitPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    service?: string;
    cleaner?: string;
    mode?: string;
  }>;
}) {
  const sp = await searchParams;

  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    supabase = await createClient();
  }

  const modeParam = sp.mode?.trim().toLowerCase();
  const mode = modeParam === 'projected' ? 'projected' : 'realized';

  const data = await fetchProfitDashboardData(supabase, {
    dateFrom: sp.from?.trim() || null,
    dateTo: sp.to?.trim() || null,
    serviceType: sp.service && sp.service !== 'All' ? sp.service.trim() : null,
    cleanerId: sp.cleaner?.trim() || null,
    mode,
  });

  return (
    <div className="space-y-12">
      <Suspense
        fallback={
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
            Loading payment-locked profit…
          </div>
        }
      >
        <div className="px-4 py-6 sm:px-6">
          <ProfitDashboard />
        </div>
      </Suspense>
      <Suspense fallback={<div className="p-8 text-sm text-zinc-500">Loading profit dashboard…</div>}>
        <div className="px-4 pb-10 sm:px-6">
          <ProfitDashboardView data={data} />
        </div>
      </Suspense>
    </div>
  );
}
