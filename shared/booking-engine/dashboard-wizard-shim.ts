import type { BookingFormData } from '@/components/booking-system-types';
import type { ServiceType as ApiServiceType } from '@/types/booking';

export function apiServiceToWizardService(api: ApiServiceType): BookingFormData['service'] {
  const m: Record<ApiServiceType, BookingFormData['service']> = {
    Standard: 'standard',
    Deep: 'deep',
    'Move In/Out': 'move',
    Airbnb: 'airbnb',
    Carpet: 'carpet',
  };
  return m[api];
}

/** Minimal `BookingFormData` for work-hours / team-size heuristics (dashboard cart). */
export function buildDashboardWizardShim(input: {
  service: ApiServiceType;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  selectedExtraIds: string[];
  extrasQuantitiesById: Record<string, number>;
}): BookingFormData {
  return {
    service: apiServiceToWizardService(input.service),
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    extraRooms: input.extraRooms,
    propertyType: 'house',
    officeSize: '',
    extras: [...input.selectedExtraIds],
    extrasQuantities: { ...input.extrasQuantitiesById },
    cleanerId: '',
    teamId: '',
    workingArea: '',
    date: '',
    time: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    instructions: '',
    paymentMethod: 'online',
    tipAmount: 0,
    promoCode: '',
    discountAmount: 0,
    numberOfCleaners: 1,
  };
}
