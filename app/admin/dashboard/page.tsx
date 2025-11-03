'use client';

import { useEffect, useState } from 'react';
import { AdminDashboardViewV2 } from '@/components/admin/admin-dashboard-view-v2';
import { AdminSimpleDashboard } from '@/components/admin/admin-simple-dashboard';
import { AdminDashboardViewV4 } from '@/components/admin/admin-dashboard-view-v4';
import { DashboardRedesigned } from '@/components/admin/dashboard-redesigned';

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
