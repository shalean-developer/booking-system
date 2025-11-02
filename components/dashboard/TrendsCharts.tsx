/**
 * TrendsCharts - Lazy-loaded wrapper for revenue and bookings charts
 */

import React from 'react';
import dynamic from 'next/dynamic';

const RevenueChartEnhanced = dynamic(
  () => import('@/components/admin/revenue-chart-enhanced').then((mod) => ({ default: mod.RevenueChartEnhanced })),
  { ssr: false, loading: () => <div className="h-[250px] animate-pulse bg-gray-100 rounded" /> }
);

const BookingsChartEnhanced = dynamic(
  () => import('@/components/admin/bookings-chart-enhanced').then((mod) => ({ default: mod.BookingsChartEnhanced })),
  { ssr: false, loading: () => <div className="h-[250px] animate-pulse bg-gray-100 rounded" /> }
);

export interface TrendsChartsProps {
  chartData: any[];
  isLoadingChart?: boolean;
}

export function TrendsCharts({ chartData, isLoadingChart }: TrendsChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <RevenueChartEnhanced data={chartData} isLoading={isLoadingChart} />
      <BookingsChartEnhanced data={chartData} isLoading={isLoadingChart} />
    </div>
  );
}

