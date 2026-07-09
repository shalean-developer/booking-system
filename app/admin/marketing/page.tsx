import { MarketingCampaignPanel } from '@/components/admin/marketing-campaign-panel';
import { MarketingStatsCards } from '@/components/admin/marketing-stats-cards';

export const dynamic = 'force-dynamic';

export default function AdminMarketingPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Marketing</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Campaigns, open/click analytics, AI-assisted copy, and WhatsApp automation. Lifecycle
          sends use <code className="text-xs">/api/cron/email-triggers</code>.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Analytics</h2>
        <MarketingStatsCards />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Broadcast campaign</h2>
        <MarketingCampaignPanel />
      </section>
    </div>
  );
}
