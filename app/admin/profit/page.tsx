import { Suspense } from 'react';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import { fetchProfitDashboardData } from '@/lib/admin/profit-dashboard-data';
import { ProfitDashboardView } from '@/components/admin/profit-dashboard-view';

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
    <Suspense fallback={<div className="p-8 text-sm text-zinc-500">Loading profit dashboard…</div>}>
      <ProfitDashboardView data={data} />
    </Suspense>
  );
}
