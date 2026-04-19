import type { BookingFormData } from '@/components/booking-system-types';
import type { BookingPayload } from './types';
import type { BookingPriceResult } from './calculate';
import { BOOKING_DEFAULT_CITY } from '@/lib/contact';
import {
  buildCarpetDetailsForPricing,
  buildExtrasQuantitiesByIdFromWizard,
  formServiceToApi,
  getEffectiveRoomCounts,
} from '@/lib/booking-pricing-input';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type WizardPendingPricingContext = {
  pricing: {
    total: number;
    discountAmount: number;
    serviceFee: number;
    frequencyDiscount: number;
    engineFinalCents: number | null;
  };
  lineCalc: BookingPriceResult | null;
  checkoutPreSurge: number | undefined;
  checkoutFinal: number | undefined;
  estimatedMaxHours: number;
  companyCosts: {
    equipmentCostCents: number;
    extraCleanerFeeCents: number;
  } | null;
};

/**
 * Body for `POST /api/bookings/pending` and `POST /api/bookings/guest` from the public wizard.
 */
export function buildWizardPendingBookingPayload(
  data: BookingFormData,
  paymentReference: string | null,
  expectedEndTime: string | null | undefined,
  equipmentChargeZar: number | undefined,
  ctx: WizardPendingPricingContext
): BookingPayload {
  const nameParts = data.name.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const apiService = formServiceToApi(data.service);
  const requiresTeam = data.service === 'deep' || data.service === 'move';
  const cleanerId = data.cleanerId && UUID_REGEX.test(data.cleanerId) ? data.cleanerId : null;
  const selectedTeam = requiresTeam ? 'Team booking' : undefined;
  const extrasQuantities = buildExtrasQuantitiesByIdFromWizard(data.extras, data.extrasQuantities);
  const eff = getEffectiveRoomCounts(data);
  const totalsPre = ctx.checkoutFinal ?? ctx.pricing.total;
  const totalsSurge = ctx.checkoutPreSurge ?? ctx.pricing.total;
  const equipmentRequired =
    (data.service === 'standard' || data.service === 'airbnb') && data.scheduleEquipmentPref === 'bring';
  const equipmentFee =
    equipmentRequired && equipmentChargeZar ? equipmentChargeZar : 0;

  return {
    step: 4,
    service: apiService,
    bedrooms: eff.bedrooms,
    bathrooms: eff.bathrooms,
    extraRooms: eff.extraRooms,
    numberOfCleaners: ctx.lineCalc?.breakdown.numberOfCleaners ?? 1,
    extras: data.extras,
    extrasQuantities,
    carpetDetails: buildCarpetDetailsForPricing(data),
    provideEquipment: equipmentRequired,
    notes: data.instructions || '',
    date: data.date,
    time: data.time,
    frequency: 'one-time',
    firstName,
    lastName,
    email: data.email.trim(),
    phone: data.phone.trim(),
    address: { line1: data.address.trim(), suburb: data.workingArea || '', city: BOOKING_DEFAULT_CITY },
    cleaner_id: cleanerId || undefined,
    selected_team: selectedTeam,
    requires_team: requiresTeam,
    ...(paymentReference ? { paymentReference } : {}),
    expectedEndTime: expectedEndTime || undefined,
    totalAmount: totalsPre,
    preSurgeTotal: totalsSurge,
    serviceFee: ctx.pricing.serviceFee,
    frequencyDiscount: ctx.pricing.frequencyDiscount,
    discountCode: data.promoCode || undefined,
    discountAmount: ctx.pricing.discountAmount,
    tipAmount: data.tipAmount,
    equipment_required: equipmentRequired,
    equipment_fee: equipmentFee,
    equipmentCharge: equipmentFee,
    pricingEngineFinalCents: ctx.pricing.engineFinalCents ?? undefined,
    pricingTotalHours: ctx.estimatedMaxHours,
    pricingTeamSize: ctx.lineCalc?.breakdown.numberOfCleaners ?? 1,
    pricingMode: data.pricingMode,
    basicPlannedHours: data.basicPlannedHours ?? undefined,
    scheduleEquipmentPref: data.scheduleEquipmentPref,
    equipmentCostCents: ctx.companyCosts?.equipmentCostCents,
    extraCleanerFeeCents: ctx.companyCosts?.extraCleanerFeeCents,
  };
}
