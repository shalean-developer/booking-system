import { AdminDashboardViewV2 } from '@/components/admin/admin-dashboard-view-v2';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function DashboardV2Page() {
  if (!await isAdmin()) {
    redirect('/login?returnTo=/admin/dashboard-v2');
  }
  return <AdminDashboardViewV2 />;
}

