'use client';

import dynamic from 'next/dynamic';

const AdminDashboardViewV2 = dynamic(
  () => import('@/components/admin/admin-dashboard-view-v2').then(mod => mod.AdminDashboardViewV2),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
);

export default function DashboardV2Wrapper() {
  return <AdminDashboardViewV2 />;
}

