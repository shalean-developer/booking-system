'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { OverviewStats } from '@/components/admin/dashboard/overview-stats';
import { BookingPipeline } from '@/components/admin/dashboard/booking-pipeline';
import { ServiceBreakdown } from '@/components/admin/dashboard/service-breakdown';
import { QuickActions } from '@/components/admin/dashboard/quick-actions';
import { RecentActivity } from '@/components/admin/dashboard/recent-activity';
import { PendingAlerts } from '@/components/admin/dashboard/pending-alerts';
import { RevenueChartEnhanced } from '@/components/admin/revenue-chart-enhanced';
import { BookingsChartEnhanced } from '@/components/admin/bookings-chart-enhanced';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [pipeline, setPipeline] = useState<Record<string, number> | null>(null);
  const [serviceBreakdown, setServiceBreakdown] = useState<any[] | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        const [statsRes, pipelineRes, serviceRes, chartRes, bookingsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/stats/booking-pipeline'),
          fetch('/api/admin/stats/service-breakdown'),
          fetch('/api/admin/stats/chart'),
          fetch('/api/admin/bookings?limit=10'),
        ]);

        const [statsData, pipelineData, serviceData, chartData, bookingsData] = await Promise.all([
          statsRes.json(),
          pipelineRes.json(),
          serviceRes.json(),
          chartRes.json(),
          bookingsRes.json(),
        ]);

        if (statsData.ok) setStats(statsData.stats);
        if (pipelineData.ok) setPipeline(pipelineData.pipeline);
        if (serviceData.ok) setServiceBreakdown(serviceData.data);
        if (chartData.ok) setChartData(chartData.data);
        if (bookingsData.ok) setRecentBookings(bookingsData.bookings || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Dashboard"
        description="Overview of your business metrics and recent activity"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Dashboard' },
        ]}
      />

      <OverviewStats stats={stats} isLoading={isLoading} />

      <div className="grid gap-6 md:grid-cols-2 w-full">
        <RevenueChartEnhanced data={chartData} isLoading={isLoading} />
        <BookingsChartEnhanced data={chartData} isLoading={isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 w-full">
        <div className="lg:col-span-2 space-y-6">
          <ServiceBreakdown data={serviceBreakdown} isLoading={isLoading} />
          <RecentActivity bookings={recentBookings} isLoading={isLoading} />
        </div>

        <div className="space-y-6">
          <BookingPipeline pipeline={pipeline} isLoading={isLoading} />
          <PendingAlerts
            pendingQuotes={stats?.pendingQuotes}
            pendingApplications={stats?.pendingApplications}
            pendingBookings={stats?.pendingBookings}
            isLoading={isLoading}
          />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
