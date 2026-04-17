import type { ServiceType as ApiServiceType } from '@/types/booking';
import type { BookingFormData } from '@/components/booking-system-types';

/** Slug for matching extra id ↔ DB extra name (same as booking-system slugify). */
export function slugifyExtraId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

export function getEffectiveRoomCounts(data: BookingFormData): {
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
} {
  if (data.service === 'carpet') {
    return {
      bedrooms: data.carpetRooms ?? data.bedrooms,
      bathrooms: data.carpetRugs ?? data.bathrooms,
      extraRooms: data.carpetExtraCleaner ? 1 : 0,
    };
  }
  if (data.propertyType === 'office') {
    const ob = data.officeBoardrooms ?? data.bathrooms;
    const op = data.officePrivateOffices ?? data.bedrooms;
    const ox =
      (data.officeOpenAreas ?? 0) +
      (data.officeKitchens ?? 0) +
      (data.officeBathrooms ?? 0) +
      (data.officeHasReception ? 1 : 0);
    return { bedrooms: op, bathrooms: ob, extraRooms: ox };
  }
  if (data.propertyType === 'studio') {
    return {
      bedrooms: 0,
      bathrooms: Math.max(1, data.bathrooms),
      extraRooms: data.extraRooms,
    };
  }
  return { bedrooms: data.bedrooms, bathrooms: data.bathrooms, extraRooms: data.extraRooms };
}

export function buildCarpetDetailsForPricing(data: BookingFormData): {
  hasFittedCarpets: boolean;
  hasLooseCarpets: boolean;
  numberOfRooms: number;
  numberOfLooseCarpets: number;
  roomStatus: 'empty' | 'hasProperty';
} | null {
  if (data.service !== 'carpet') return null;
  const rooms = data.carpetRooms ?? data.bedrooms ?? 0;
  const rugs = data.carpetRugs ?? data.bathrooms ?? 0;
  return {
    hasFittedCarpets: rooms > 0,
    hasLooseCarpets: rugs > 0,
    numberOfRooms: Math.max(0, rooms),
    numberOfLooseCarpets: Math.max(0, rugs),
    roomStatus: data.carpetExtraCleaner ? 'hasProperty' : 'empty',
  };
}

/**
 * Map UI extra ids to pricing_config extra names using catalog from DB.
 * Unknown ids are passed through (may still resolve in pricing.extras).
 */
export function mapExtraIdsToCanonicalNames(
  extraIds: string[],
  catalogAllNames: string[]
): string[] {
  const out: string[] = [];
  for (const id of extraIds) {
    const direct = catalogAllNames.find((n) => slugifyExtraId(n) === id);
    out.push(direct ?? id);
  }
  return out;
}

export function aggregateExtraQuantitiesByName(
  extraIds: string[],
  extrasQuantitiesById: Record<string, number> | undefined,
  catalogAllNames: string[]
): Record<string, number> {
  const byName: Record<string, number> = {};
  const seen = new Set<string>();
  const extraCleanerAliases = [
    'Extra Cleaner',
    'Carpet extra cleaner',
    'Carpet occupied property',
    'Carpet property occupied',
  ];
  for (const id of extraIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    let name = catalogAllNames.find((n) => slugifyExtraId(n) === id) ?? id;
    if (id === 'extra_cleaner') {
      name =
        extraCleanerAliases.find((alias) =>
          catalogAllNames.some((n) => n.trim().toLowerCase() === alias.trim().toLowerCase())
        ) ?? 'Extra Cleaner';
    }
    const perId =
      extrasQuantitiesById?.[id] ?? extraIds.filter((x) => x === id).length;
    byName[name] = Math.max(1, perId);
  }
  return byName;
}

const SERVICE_MAP: Record<BookingFormData['service'], ApiServiceType> = {
  standard: 'Standard',
  deep: 'Deep',
  move: 'Move In/Out',
  airbnb: 'Airbnb',
  carpet: 'Carpet',
};

export function formServiceToApi(service: BookingFormData['service']): ApiServiceType {
  return SERVICE_MAP[service];
}
