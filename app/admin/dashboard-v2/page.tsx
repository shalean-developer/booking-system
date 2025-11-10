'use client';

import dynamic from 'next/dynamic';

const AdminDashboardViewV2 = dynamic(
  () => import('@/components/admin/admin-dashboard-view-v2').then((mod) => ({ default: mod.AdminDashboardViewV2 })),
  {
    loading: () => <div className="py-12 text-center text-gray-500">Loading dashboard analytics...</div>,
  }
);

export default function DashboardV2Page() {
  // No need for client-side auth check - the layout already protects this route
  return <AdminDashboardViewV2 />;
}

