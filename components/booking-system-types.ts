export type ServiceType = 'standard' | 'deep' | 'move' | 'airbnb' | 'carpet';
export type PropertyType = 'apartment' | 'house' | 'office' | 'studio';

export type PaymentMethod = 'online' | 'later';

export interface BookingFormData {
  service: ServiceType;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  propertyType: PropertyType;
  officeSize: string;
  extras: string[];
  cleanerId: string;
  teamId: string;
  workingArea: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  instructions: string;
  paymentMethod: PaymentMethod;
  tipAmount: number;
  promoCode: string;
  discountAmount: number;
  /** Step 1 — office breakdown (maps into bedrooms/bathrooms/extraRooms for API pricing) */
  officeBoardrooms?: number;
  officePrivateOffices?: number;
  officeOpenAreas?: number;
  officeBathrooms?: number;
  officeKitchens?: number;
  officeHasReception?: boolean;
  /** Step 1 — carpet */
  carpetRooms?: number;
  carpetRugs?: number;
  carpetExtraCleaner?: boolean;
  /** Step 2 — standard / Airbnb: cleaners bring equipment vs customer supplies */
  scheduleEquipmentPref?: 'bring' | 'own';
}
