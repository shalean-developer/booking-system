import type { ServiceType as ApiServiceType } from '@/types/booking';
import type { BookingPayload } from './types';
import type { BookingPriceResult } from './calculate';
import type { BookingCarpetDetails } from '@/types/booking';
import { isBookingTeamName } from './booking-team-names';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildDashboardPendingBookingPayload(input: {
  user: { name: string; email: string; phone: string };
  address: { line1: string; suburb: string; city: string };
  state: {
    bedrooms: number;
    bathrooms: number;
    extraRooms: number;
    selectedExtraIds: string[];
    provideEquipment: boolean;
    date: string;
    time: string;
    cleaner_id: string | null;
  };
  selectedService: ApiServiceType;
  isTeamService: boolean;
  extrasQuantitiesById: Record<string, number>;
  carpetDetails: BookingCarpetDetails | null;
  linePricing: BookingPriceResult | null;
  numberOfCleanersForPricing: number;
  equipmentChargeZar: number;
  finalTotalZar: number;
  preSurge: number;
}): BookingPayload {
  const nameParts = input.user.name.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.slice(1).join(' ') || '—';
  const requiresTeam = input.isTeamService;
  const cleanerUuid =
    !requiresTeam && UUID_RE.test(input.state.cleaner_id ?? '')
      ? input.state.cleaner_id ?? undefined
      : undefined;
  const selected_team =
    requiresTeam &&
    input.state.cleaner_id &&
    isBookingTeamName(input.state.cleaner_id)
      ? input.state.cleaner_id
      : undefined;
  const svc = input.selectedService;

  return {
    step: 4,
    service: svc,
    bedrooms: input.state.bedrooms,
    bathrooms: input.state.bathrooms,
    extraRooms: svc === 'Carpet' ? 0 : input.state.extraRooms,
    numberOfCleaners: input.numberOfCleanersForPricing,
    extras: input.state.selectedExtraIds,
    extrasQuantities: input.extrasQuantitiesById,
    carpetDetails: input.carpetDetails ?? undefined,
    provideEquipment: (svc === 'Standard' || svc === 'Airbnb') && input.state.provideEquipment,
    notes: '',
    date: input.state.date,
    time: input.state.time,
    frequency: 'one-time',
    firstName,
    lastName,
    email: input.user.email.trim(),
    phone: input.user.phone.trim(),
    address: input.address,
    cleaner_id: cleanerUuid,
    selected_team,
    requires_team: requiresTeam,
    totalAmount: input.finalTotalZar,
    preSurgeTotal: input.preSurge,
    serviceFee: input.linePricing?.serviceFee ?? 0,
    frequencyDiscount: input.linePricing?.frequencyDiscount ?? 0,
    tipAmount: 0,
    discountAmount: 0,
    equipment_required: (svc === 'Standard' || svc === 'Airbnb') && input.state.provideEquipment,
    equipment_fee:
      (svc === 'Standard' || svc === 'Airbnb') && input.state.provideEquipment
        ? input.equipmentChargeZar
        : 0,
  };
}
