import { getPricingAnalytics } from '@/lib/analytics/getPricingAnalytics';
import { PricingAnalyticsDashboard } from '@/components/admin/pricing-analytics-dashboard';

/** Best-effort; admin layout uses `force-dynamic` — primary cache is `unstable_cache` in `getPricingAnalytics`. */
export const revalidate = 60;

export default async function AdminPricingAnalyticsPage() {
  const data = await getPricingAnalytics();
  return <PricingAnalyticsDashboard data={data} />;
}
