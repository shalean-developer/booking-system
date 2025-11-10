'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const AdminDashboardViewV2 = dynamic(
  () => import('@/components/admin/admin-dashboard-view-v2').then((mod) => ({ default: mod.AdminDashboardViewV2 })),
  {
    loading: () => <div className="py-12 text-center text-gray-500">Loading dashboard (v2)...</div>,
  }
);

const AdminSimpleDashboard = dynamic(
  () => import('@/components/admin/admin-simple-dashboard').then((mod) => ({ default: mod.AdminSimpleDashboard })),
  {
    loading: () => <div className="py-12 text-center text-gray-500">Loading simplified dashboard...</div>,
  }
);

const AdminDashboardViewV4 = dynamic(
  () => import('@/components/admin/admin-dashboard-view-v4').then((mod) => ({ default: mod.AdminDashboardViewV4 })),
  {
    loading: () => <div className="py-12 text-center text-gray-500">Loading original dashboard...</div>,
  }
);

const DashboardRedesigned = dynamic(
  () => import('@/components/admin/dashboard-redesigned').then((mod) => ({ default: mod.DashboardRedesigned })),
  {
    loading: () => <div className="py-12 text-center text-gray-500">Loading redesigned dashboard...</div>,
  }
);

type DashboardViewType = 'v2' | 'simple' | 'original' | 'redesigned';

export default function DashboardPage() {
  const [dashboardView, setDashboardView] = useState<DashboardViewType>('original');

  // Load dashboard view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('admin-dashboard-view');
    // Support legacy 'v4' value and migrate to 'original'
    if (savedView === 'v4') {
      setDashboardView('original');
      localStorage.setItem('admin-dashboard-view', 'original');
    } else if (savedView === 'v2' || savedView === 'original' || savedView === 'redesigned') {
      setDashboardView(savedView as DashboardViewType);
    } else {
      setDashboardView('original');
    }
  }, []);

  // Save dashboard view preference to localStorage
  useEffect(() => {
    if (dashboardView !== 'simple') {
      localStorage.setItem('admin-dashboard-view', dashboardView);
    }
  }, [dashboardView]);

  return (
    <div className="space-y-6">
      {/* Render selected dashboard view */}
      {dashboardView === 'v2' && <AdminDashboardViewV2 />}
      {dashboardView === 'simple' && <AdminSimpleDashboard />}
      {dashboardView === 'original' && <AdminDashboardViewV4 />}
      {dashboardView === 'redesigned' && <DashboardRedesigned />}
    </div>
  );
}
