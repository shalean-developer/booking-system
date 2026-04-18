import { unstable_cache } from 'next/cache';
import { createServiceClient } from '@/lib/supabase-server';
import { fetchActivePricing } from '@/lib/pricing-db';
import { fetchServicesMetadata } from '@/lib/pricing-db';

export interface BookingFormDataServer {
  services: Array<{
    type: 'Standard' | 'Deep' | 'Move In/Out' | 'Airbnb' | 'Carpet';
    label: string;
    subLabel: string;
    description: string;
    checklist: string[];
    badge?: 'Popular' | 'New';
    icon: string;
    image: string;
    displayOrder: number;
  }>;
  pricing: {
    services: Record<string, { base: number; bedroom: number; bathroom: number; extraRoom: number }>;
    extras: Record<string, number>;
    serviceFee: number;
    frequencyDiscounts: Record<string, number>;
    equipmentChargeZar: number;
    minimumBookingFeeZar: number;
  } | null;
  extras: {
    all: string[];
    standardAndAirbnb: string[];
    deepAndMove: string[];
    quantityExtras: string[];
    meta: Record<string, { blurb: string }>;
    prices: Record<string, number>;
  };
  equipment: {
    items: string[];
    charge: number;
  };
}

async function getBookingFormDataUncached(): Promise<BookingFormDataServer> {
  // Use service client so we never call cookies() inside unstable_cache (not allowed by Next.js)
  const supabase = createServiceClient();

  const [
    servicesMetadata,
    pricingData,
    extrasResult,
    equipmentResult,
    equipmentChargeResult,
  ] = await Promise.all([
    fetchServicesMetadata(),
    fetchActivePricing(),
    supabase
      .from('pricing_config')
      .select('item_name, price, effective_date, notes')
      .eq('price_type', 'extra')
      .eq('is_active', true)
      .is('service_type', null)
      .not('item_name', 'is', null)
      .order('item_name', { ascending: true })
      .order('effective_date', { ascending: false }),
    supabase
      .from('equipment_items')
      .select('id, name, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('pricing_config')
      .select('price')
      .eq('price_type', 'equipment_charge')
      .eq('is_active', true)
      .is('service_type', null)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single(),
  ]);

  const { data: extrasData } = extrasResult;
  const { data: equipmentItems } = equipmentResult;
  const { data: equipmentChargeData } = equipmentChargeResult;
  const equipmentCharge = equipmentChargeData?.price ? Number(equipmentChargeData.price) : 500;

  const iconMap: Record<string, string> = {
    '🏠': 'Home',
    '✨': 'Star',
    '🏢': 'Building',
    '📅': 'Calendar',
    '🧹': 'Sparkles',
    'Home': 'Home',
    'Star': 'Star',
    'Building': 'Building',
    'Calendar': 'Calendar',
    'Sparkles': 'Sparkles',
  };

  const transformedServices = servicesMetadata.map((service) => {
    const iconName = service.icon ? iconMap[service.icon] || 'Home' : 'Home';
    return {
      type: service.service_type as 'Standard' | 'Deep' | 'Move In/Out' | 'Airbnb' | 'Carpet',
      label: service.display_name,
      subLabel: service.description || '',
      description: service.description || '',
      checklist: [] as string[],
      badge: service.service_type === 'Standard' ? ('Popular' as const) : undefined,
      icon: iconName,
      image: service.image_url || `/images/service-${service.service_type.toLowerCase().replace(/\s+/g, '-')}-cleaning.jpg`,
      displayOrder: service.display_order,
    };
  });

  const seenExtras = new Map<string, { name: string; price: number; blurb: string }>();
  const normalizedNames = new Map<string, string>();

  (extrasData || []).forEach((extra: { item_name?: string | null; price?: number; notes?: string | null }) => {
    if (!extra.item_name) return;

    const name = extra.item_name.trim();
    const normalizedName = name.toLowerCase().replace(/\s+/g, ' ').trim();

    if (normalizedNames.has(normalizedName)) return;

    normalizedNames.set(normalizedName, name);
    seenExtras.set(name, {
      name,
      price: Number(extra.price) || 0,
      blurb: extra.notes || '',
    });
  });

  const extrasMeta: Record<string, { blurb: string }> = {};
  seenExtras.forEach((extra) => {
    extrasMeta[extra.name] = { blurb: extra.blurb };
  });

  const allExtrasList = Array.from(seenExtras.keys());
  const standardAndAirbnbExtrasList = ['Inside Fridge', 'Inside Oven', 'Interior Walls', 'Interior Windows', 'Inside Cabinets', 'Laundry & Ironing', 'Laundry', 'Ironing'];
  const standardAndAirbnbExtras = allExtrasList.filter((extra) =>
    standardAndAirbnbExtrasList.includes(extra)
  );
  const deepAndMoveExtras = allExtrasList.filter(
    (extra) =>
      !standardAndAirbnbExtras.includes(extra) &&
      extra !== 'Laundry & Ironing' &&
      extra !== 'Laundry' &&
      extra !== 'Ironing'
  );

  const quantityExtras = new Set(
    allExtrasList.filter((extra) =>
      ['Carpet Cleaning', 'Couch Cleaning', 'Ceiling Cleaning', 'Mattress Cleaning'].includes(extra)
    )
  );

  return {
    services: transformedServices,
    pricing: pricingData,
    extras: {
      all: allExtrasList,
      standardAndAirbnb: standardAndAirbnbExtras,
      deepAndMove: deepAndMoveExtras,
      quantityExtras: Array.from(quantityExtras),
      meta: extrasMeta,
      prices: (() => {
        const prices = Object.fromEntries(
          Array.from(seenExtras.entries()).map(([name, data]) => [name, data.price])
        );
        const extraCleanerAliases = [
          'Extra Cleaner',
          'Carpet extra cleaner',
          'Carpet occupied property',
          'Carpet property occupied',
        ];
        const resolvedExtraCleanerPrice = extraCleanerAliases
          .map((name) => prices[name])
          .find((value) => typeof value === 'number');
        if (typeof resolvedExtraCleanerPrice === 'number') {
          prices['Extra Cleaner'] = resolvedExtraCleanerPrice;
          prices['Carpet extra cleaner'] = resolvedExtraCleanerPrice;
          prices['Carpet occupied property'] = resolvedExtraCleanerPrice;
          prices['Carpet property occupied'] = resolvedExtraCleanerPrice;
        }
        return prices;
      })(),
    },
    equipment: {
      items: (equipmentItems || []).map((item: { name: string }) => item.name),
      charge: equipmentCharge,
    },
  };
}

export async function getBookingFormData(): Promise<BookingFormDataServer> {
  return unstable_cache(
    getBookingFormDataUncached,
    ['booking-form-data'],
    // Short TTL so disabled extras drop off quickly; admin saves also call `revalidateTag('booking-form-data')`.
    { revalidate: 30, tags: ['booking-form-data'] }
  )();
}
