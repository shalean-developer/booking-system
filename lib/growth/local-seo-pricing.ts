import {
  calculateBookingV4,
  type CalculateBookingV4Result,
} from '@/lib/pricing/v4/calculateBookingV4';
import type { LocalSeoServiceId } from '@/lib/growth/local-seo-types';
import { SERVICE_PAGE_META } from '@/lib/growth/local-seo-services';

export type SeoPricingExampleRow = {
  id: string;
  label: string;
  homeDescription: string;
  priceZar: number;
  hoursOnSite: number;
  teamSize: number;
  modeLabel: string;
};

function rowFromResult(
  id: string,
  label: string,
  homeDescription: string,
  r: CalculateBookingV4Result,
  modeLabel: string
): SeoPricingExampleRow {
  return {
    id,
    label,
    homeDescription,
    priceZar: r.price_zar,
    hoursOnSite: Math.round(r.hours * 10) / 10,
    teamSize: r.team_size,
    modeLabel,
  };
}

/**
 * Live V4 labour-line examples (same engine as checkout). Excludes surge / loyalty / promos.
 */
export function buildSeoPricingExamples(service: LocalSeoServiceId): SeoPricingExampleRow[] {
  const focus = SERVICE_PAGE_META[service].pricingFocus;
  const out: SeoPricingExampleRow[] = [];

  if (focus === 'standard') {
    const quickSmall = calculateBookingV4({
      service_type: 'standard',
      pricing_mode: 'quick',
      bedrooms: 2,
      bathrooms: 2,
      extra_rooms: 0,
      extras: [],
    });
    out.push(
      rowFromResult(
        'std-quick-2x2',
        'Compact home (Quick)',
        '2 bedrooms · 2 bathrooms · Quick clean',
        quickSmall,
        'V4 Quick table + time guards'
      )
    );

    const premFamily = calculateBookingV4({
      service_type: 'standard',
      pricing_mode: 'premium',
      bedrooms: 3,
      bathrooms: 2,
      extra_rooms: 1,
      extras: [],
    });
    out.push(
      rowFromResult(
        'std-prem-3x2-ex',
        'Family home (Premium)',
        '3 bedrooms · 2 bathrooms · 1 extra room · Premium',
        premFamily,
        'V4 Premium table + extra room line'
      )
    );
  }

  if (focus === 'deep') {
    const deep = calculateBookingV4({
      service_type: 'deep',
      bedrooms: 3,
      bathrooms: 2,
      extra_rooms: 0,
      extras: [],
    });
    out.push(
      rowFromResult(
        'deep-3x2',
        'Deep clean (typical)',
        '3 bedrooms · 2 bathrooms · Deep service',
        deep,
        'V4 Deep matrix + min hours'
      )
    );
  }

  if (focus === 'move') {
    const move = calculateBookingV4({
      service_type: 'move',
      bedrooms: 2,
      bathrooms: 2,
      extra_rooms: 0,
      extras: [],
    });
    out.push(
      rowFromResult(
        'move-2x2',
        'Move-out clean',
        '2 bedrooms · 2 bathrooms · Move in/out',
        move,
        'V4 Move matrix + crew sizing'
      )
    );
  }

  // Intent pages: still show standard examples + one contextual line
  if (service === 'affordable-cleaning') {
    return out.filter((r) => r.id.startsWith('std-'));
  }
  if (service === 'same-day-cleaning' || service === 'weekly-cleaning') {
    return out;
  }

  if (focus === 'deep') {
    return out.filter((r) => r.id === 'deep-3x2');
  }
  if (focus === 'move') {
    return out.filter((r) => r.id === 'move-2x2');
  }

  return out;
}
