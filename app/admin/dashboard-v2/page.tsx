'use client';

import { AdminDashboardViewV2 } from '@/components/admin/admin-dashboard-view-v2';

export default function DashboardV2Page() {
  // No need for client-side auth check - the layout already protects this route
  return <AdminDashboardViewV2 />;
}

