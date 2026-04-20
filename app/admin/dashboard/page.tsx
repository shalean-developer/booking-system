import { Suspense } from 'react';
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard';

export default function AdminAnalyticsDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-gray-500 text-sm">
          Loading analytics…
        </div>
      }
    >
      <AnalyticsDashboard />
    </Suspense>
  );
}
