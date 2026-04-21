'use client';

import { PricingEngineDashboard } from '@/components/admin/pricing-engine-dashboard';
import { AdminQuotesView } from '@/components/admin/admin-quotes-view';

export default function AdminQuotesPage() {
  return (
    <PricingEngineDashboard initialPage="quotes" pageOverrides={{ quotes: <AdminQuotesView /> }} />
  );
}
