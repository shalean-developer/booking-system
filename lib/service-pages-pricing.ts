import { fetchActivePricing, type PricingData } from '@/lib/pricing-db';
import { formatFromBaseZar, formatCarpetPerRoomFrom } from '@/lib/display-pricing';

type Core = 'Standard' | 'Deep' | 'Move In/Out' | 'Airbnb';

const SLUG_TO_MODE: Record<string, Core | 'carpet-per-room'> = {
  'regular-cleaning': 'Standard',
  'deep-cleaning': 'Deep',
  'move-turnover': 'Move In/Out',
  'airbnb-cleaning': 'Airbnb',
  'carpet-cleaning': 'carpet-per-room',
  'one-time-cleaning': 'Standard',
  'apartment-cleaning': 'Standard',
  'home-maintenance': 'Standard',
  'office-cleaning': 'Standard',
  'window-cleaning': 'Standard',
  'post-construction-cleaning': 'Deep',
};

/**
 * Public service detail pages — “From …” line from `pricing_config` (fallback: `lib/pricing` PRICING).
 */
export async function getServicePageFromPrice(slug: string): Promise<string> {
  let pricing: PricingData | null = null;
  try {
    pricing = await fetchActivePricing();
  } catch {
    pricing = null;
  }
  const mode = SLUG_TO_MODE[slug] ?? 'Standard';
  if (mode === 'carpet-per-room') {
    return formatCarpetPerRoomFrom(pricing);
  }
  return formatFromBaseZar(pricing, mode);
}
