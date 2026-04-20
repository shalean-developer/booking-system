/**
 * Zoho Books invoice line items + notes — shared by Edge (`zoho-books.ts`) and Next (`lib/zoho-books-server.ts`).
 */

import type { BookingCarpetDetails, ServiceType } from '../../../types/booking';
import {
  type BookingPriceFrequency,
  type PricingData,
  PRICING,
} from '../../../lib/pricing';
import { calculateFinalBookingPrice } from '../../../lib/pricing/final-pricing';

export type ZohoLineItem = {
  name: string;
  description?: string;
  quantity: number;
  rate: number;
};

export type ZohoInvoiceBookingInput = {
  id: string;
  service_type: string | null;
  customer_name: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  booking_date: string | null;
  booking_time: string | null;
  address_line1: string | null;
  address_suburb: string | null;
  address_city: string | null;
  total_amount: number | null;
  price_snapshot?: unknown;
  bedrooms?: number | null;
  bathrooms?: number | null;
  extras?: string[] | null;
  notes?: string | null;
  tip_amount?: number | null;
  service_fee?: number | null;
  frequency_discount?: number | null;
  frequency?: string | null;
  surge_amount?: number | null;
  equipment_required?: boolean | null;
  /** ZAR (not cents) — see bookings.equipment_fee migration */
  equipment_fee?: number | null;
};

/** Maps a `bookings` row (or selected columns) into the Zoho payload input shape. */
export function toZohoInvoiceBookingInput(b: {
  id: string;
  service_type: string | null;
  customer_name: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  booking_date?: string | null;
  booking_time?: string | null;
  address_line1?: string | null;
  address_suburb?: string | null;
  address_city?: string | null;
  total_amount: number | null;
  price_snapshot?: unknown;
  bedrooms?: number | null;
  bathrooms?: number | null;
  extras?: string[] | null;
  notes?: string | null;
  tip_amount?: number | null;
  service_fee?: number | null;
  frequency_discount?: number | null;
  frequency?: string | null;
  surge_amount?: number | null;
  equipment_required?: boolean | null;
  equipment_fee?: number | null;
}): ZohoInvoiceBookingInput {
  return {
    id: b.id,
    service_type: b.service_type,
    customer_name: b.customer_name,
    customer_email: b.customer_email,
    customer_phone: b.customer_phone,
    booking_date: b.booking_date ?? null,
    booking_time: b.booking_time ?? null,
    address_line1: b.address_line1 ?? null,
    address_suburb: b.address_suburb ?? null,
    address_city: b.address_city ?? null,
    total_amount: b.total_amount,
    price_snapshot: b.price_snapshot,
    bedrooms: b.bedrooms,
    bathrooms: b.bathrooms,
    extras: b.extras,
    notes: b.notes,
    tip_amount: b.tip_amount,
    service_fee: b.service_fee,
    frequency_discount: b.frequency_discount,
    frequency: b.frequency,
    surge_amount: b.surge_amount,
    equipment_required: b.equipment_required,
    equipment_fee: b.equipment_fee,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function serviceDisplayName(serviceType: string | null | undefined): string {
  const s = serviceType?.trim() || 'Cleaning';
  const map: Record<string, string> = {
    Standard: 'Standard Cleaning',
    Deep: 'Deep Cleaning',
    'Move In/Out': 'Move In/Out Cleaning',
    Airbnb: 'Airbnb Cleaning',
    Carpet: 'Carpet Cleaning',
  };
  return map[s] ?? `${s} Cleaning`;
}

export function formatBookingDateForZoho(isoDate: string | null | undefined): string {
  if (!isoDate) return 'N/A';
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatBookingAddress(b: ZohoInvoiceBookingInput): string {
  const parts = [b.address_line1, b.address_suburb, b.address_city].filter(
    (x) => typeof x === 'string' && x.trim().length > 0,
  ) as string[];
  return parts.length ? parts.join(', ') : 'N/A';
}

export function buildPrimaryServiceDescription(b: ZohoInvoiceBookingInput): string {
  return [
    `Service: ${serviceDisplayName(b.service_type)}`,
    `Date: ${formatBookingDateForZoho(b.booking_date)}`,
    `Time: ${b.booking_time?.trim() || '—'}`,
    `Address: ${formatBookingAddress(b)}`,
  ].join('\n');
}

function parseSnapshot(snap: unknown): {
  service?: {
    type?: string;
    bedrooms?: number;
    bathrooms?: number;
    numberOfCleaners?: number;
    extraRooms?: number;
  };
  extras?: string[];
  extras_quantities?: Record<string, number>;
  discount_amount?: number;
  carpet_details?: BookingCarpetDetails | null;
} {
  if (!snap || typeof snap !== 'object') return {};
  return snap as {
    service?: {
      type?: string;
      bedrooms?: number;
      bathrooms?: number;
      numberOfCleaners?: number;
      extraRooms?: number;
    };
    extras?: string[];
    extras_quantities?: Record<string, number>;
    discount_amount?: number;
    carpet_details?: BookingCarpetDetails | null;
  };
}

function coerceServiceType(raw: string | null | undefined): ServiceType | null {
  const s = raw?.trim();
  if (!s) return null;
  const allowed: ServiceType[] = ['Standard', 'Deep', 'Move In/Out', 'Airbnb', 'Carpet'];
  return allowed.includes(s as ServiceType) ? (s as ServiceType) : null;
}

function resolveFrequency(b: ZohoInvoiceBookingInput): BookingPriceFrequency {
  const f = b.frequency;
  if (!f || f === 'one-time') return 'one-time';
  if (f === 'weekly' || f === 'bi-weekly' || f === 'monthly') return f;
  return 'one-time';
}

function resolveExtraUnitPrice(pricing: PricingData, extraName: string): number {
  const normalized = extraName.trim();
  let unit = pricing.extras[normalized] ?? 0;
  if (unit === 0) {
    const key = Object.keys(pricing.extras).find(
      (k) => k.toLowerCase().trim() === normalized.toLowerCase(),
    );
    if (key) unit = pricing.extras[key] ?? 0;
  }
  if (unit === 0) {
    const normalizeToken = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');
    const wanted = normalizeToken(normalized);
    const key = Object.keys(pricing.extras).find((k) => normalizeToken(k) === wanted);
    if (key) unit = pricing.extras[key] ?? 0;
  }
  return unit;
}

function sumLineItems(items: ZohoLineItem[]): number {
  return round2(items.reduce((acc, li) => acc + round2(li.quantity * li.rate), 0));
}

export function buildBookingNotes(b: ZohoInvoiceBookingInput): string {
  const snap = parseSnapshot(b.price_snapshot);
  const beds = snap.service?.bedrooms ?? b.bedrooms ?? 0;
  const baths = snap.service?.bathrooms ?? b.bathrooms ?? 0;
  const extrasList = Array.isArray(snap.extras) && snap.extras.length
    ? snap.extras
    : Array.isArray(b.extras) && b.extras.length
      ? b.extras
      : [];
  const extrasHuman =
    extrasList.length > 0
      ? extrasList.map((x) => x.trim()).filter(Boolean).join(', ')
      : 'None';

  return [
    `Booking ID: ${b.id}`,
    ``,
    `Service: ${serviceDisplayName(b.service_type)}`,
    `Date: ${formatBookingDateForZoho(b.booking_date)} at ${b.booking_time?.trim() || '—'}`,
    `Address: ${formatBookingAddress(b)}`,
    ``,
    `Details:`,
    `- Bedrooms: ${beds}`,
    `- Bathrooms: ${baths}`,
    `- Extras: ${extrasHuman}`,
    ``,
    `Customer:`,
    `${b.customer_name?.trim() || 'Customer'}`,
  ].join('\n');
}

/**
 * Builds Zoho `line_items`, invoice `notes`, and the description for the primary service line.
 * Adds a final adjustment line when rounded components do not match `total_amount` (cents).
 */
export function buildZohoInvoicePayloadParts(params: {
  booking: ZohoInvoiceBookingInput;
  pricing: PricingData;
}): { line_items: ZohoLineItem[]; notes: string; primary_line_description: string } {
  const { booking, pricing } = params;
  const expectedZar = round2((Number(booking.total_amount ?? 0) || 0) / 100);
  const snap = parseSnapshot(booking.price_snapshot);

  const service =
    coerceServiceType(snap.service?.type ?? booking.service_type) ??
    coerceServiceType('Standard');
  if (!service || expectedZar <= 0) {
    return {
      line_items: [
        {
          name: `${serviceDisplayName(booking.service_type)} (Booking ${booking.id})`,
          description: buildPrimaryServiceDescription(booking),
          quantity: 1,
          rate: expectedZar,
        },
      ],
      notes: buildBookingNotes(booking),
      primary_line_description: buildPrimaryServiceDescription(booking),
    };
  }

  const bedrooms = snap.service?.bedrooms ?? booking.bedrooms ?? 0;
  const bathrooms = snap.service?.bathrooms ?? booking.bathrooms ?? 0;
  const extraRooms = snap.service?.extraRooms ?? 0;
  const numberOfCleaners = Math.max(1, Math.round(snap.service?.numberOfCleaners ?? 1));
  const extrasNames = Array.from(
    new Set(
      (Array.isArray(snap.extras) && snap.extras.length ? snap.extras : booking.extras ?? []).map((e) =>
        String(e).trim(),
      ).filter(Boolean),
    ),
  );
  const extrasQuantities = snap.extras_quantities ?? {};

  const freq = resolveFrequency(booking);
  const equipmentFeeZar =
    typeof booking.equipment_fee === 'number' && Number.isFinite(booking.equipment_fee)
      ? booking.equipment_fee
      : undefined;

  const calcInput = {
    service,
    bedrooms: Math.max(0, Number(bedrooms) || 0),
    bathrooms: Math.max(0, Number(bathrooms) || 0),
    extraRooms: Math.max(0, Number(extraRooms) || 0),
    extras: extrasNames,
    extrasQuantities,
    carpetDetails:
      service === 'Carpet'
        ? snap.carpet_details ??
          ({
            hasFittedCarpets: bedrooms > 0,
            hasLooseCarpets: bathrooms > 0,
            numberOfRooms: Math.max(0, Number(bedrooms) || 0),
            numberOfLooseCarpets: Math.max(0, Number(bathrooms) || 0),
            roomStatus: 'empty',
          } as BookingCarpetDetails)
        : null,
    provideEquipment: booking.equipment_required === true,
    equipmentChargeOverride: equipmentFeeZar,
    numberOfCleaners,
  };

  const final = calculateFinalBookingPrice(pricing, calcInput, freq);
  const calc = final.breakdown.cart;
  const bd = calc.breakdown;

  const items: ZohoLineItem[] = [];
  let primaryDescription = buildPrimaryServiceDescription(booking);

  if (service === 'Carpet') {
    items.push({
      name: serviceDisplayName(booking.service_type),
      description: primaryDescription,
      quantity: 1,
      rate: round2(bd.base),
    });
    if (bd.carpetFitted > 0) {
      const n = calcInput.carpetDetails?.numberOfRooms ?? 0;
      const q = n > 0 ? n : 1;
      items.push({
        name: 'Fitted carpets',
        description: n > 0 ? `${n} room(s)` : undefined,
        quantity: q,
        rate: round2(bd.carpetFitted / q),
      });
    }
    if (bd.carpetLoose > 0) {
      const n = calcInput.carpetDetails?.numberOfLooseCarpets ?? 0;
      const q = n > 0 ? n : 1;
      items.push({
        name: 'Loose carpets',
        description: n > 0 ? `${n} carpet(s)` : undefined,
        quantity: q,
        rate: round2(bd.carpetLoose / q),
      });
    }
    if (bd.carpetOccupiedFee > 0) {
      items.push({
        name: 'Property occupied',
        quantity: 1,
        rate: round2(bd.carpetOccupiedFee),
      });
    }
  } else {
    items.push({
      name: serviceDisplayName(booking.service_type),
      description: primaryDescription,
      quantity: 1,
      rate: round2(bd.base),
    });
    if (bedrooms > 0 && bd.bedrooms > 0) {
      const q = Math.max(1, Number(bedrooms) || 0);
      items.push({
        name: 'Bedrooms',
        description: `${q} bedroom${q === 1 ? '' : 's'}`,
        quantity: q,
        rate: round2(bd.bedrooms / q),
      });
    }
    if (bathrooms > 0 && bd.bathrooms > 0) {
      const q = Math.max(1, Number(bathrooms) || 0);
      items.push({
        name: 'Bathrooms',
        description: `${q} bathroom${q === 1 ? '' : 's'}`,
        quantity: q,
        rate: round2(bd.bathrooms / q),
      });
    }
    if (extraRooms > 0 && bd.extraRooms > 0) {
      items.push({
        name: 'Extra rooms',
        description: `${extraRooms} extra room(s)`,
        quantity: extraRooms,
        rate: round2(bd.extraRooms / extraRooms),
      });
    }
  }

  for (const name of extrasNames) {
    const q = Math.max(1, Number(extrasQuantities[name] ?? 1) || 1);
    const unit = resolveExtraUnitPrice(pricing, name);
    if (unit <= 0) continue;
    items.push({
      name,
      quantity: q,
      rate: round2(unit),
    });
  }

  if (
    (service === 'Standard' || service === 'Airbnb') &&
    numberOfCleaners > 1 &&
    bd.laborSubtotalOneCleaner > 0
  ) {
    const add = round2((numberOfCleaners - 1) * bd.laborSubtotalOneCleaner);
    if (add > 0) {
      items.push({
        name: 'Additional cleaner(s)',
        description: `${numberOfCleaners - 1} × same labor package`,
        quantity: 1,
        rate: add,
      });
    }
  }

  if (bd.equipmentCharge > 0) {
    items.push({
      name: 'Equipment',
      description: 'Equipment provision',
      quantity: 1,
      rate: round2(bd.equipmentCharge),
    });
  }

  if (calc.minimumApplied > 0) {
    items.push({
      name: 'Minimum booking adjustment',
      quantity: 1,
      rate: round2(calc.minimumApplied),
    });
  }

  const serviceFeeZar =
    typeof booking.service_fee === 'number' && Number.isFinite(booking.service_fee)
      ? round2(booking.service_fee / 100)
      : round2(calc.serviceFee);
  if (serviceFeeZar > 0) {
    items.push({
      name: 'Service fee',
      quantity: 1,
      rate: serviceFeeZar,
    });
  }

  const freqDiscZar =
    typeof booking.frequency_discount === 'number' && Number.isFinite(booking.frequency_discount)
      ? round2(booking.frequency_discount / 100)
      : round2(calc.frequencyDiscount);
  if (freqDiscZar > 0) {
    items.push({
      name: 'Frequency discount',
      quantity: 1,
      rate: round2(-freqDiscZar),
    });
  }

  const promoZar =
    typeof snap.discount_amount === 'number' && Number.isFinite(snap.discount_amount)
      ? round2(snap.discount_amount / 100)
      : 0;
  if (promoZar > 0) {
    items.push({
      name: 'Promotional discount',
      quantity: 1,
      rate: round2(-promoZar),
    });
  }

  const surgeZar =
    typeof booking.surge_amount === 'number' && Number.isFinite(booking.surge_amount)
      ? round2(booking.surge_amount / 100)
      : 0;
  if (surgeZar > 0) {
    items.push({
      name: 'Peak / surge pricing',
      quantity: 1,
      rate: surgeZar,
    });
  }

  const tipZar =
    typeof booking.tip_amount === 'number' && Number.isFinite(booking.tip_amount)
      ? round2(booking.tip_amount / 100)
      : 0;
  if (tipZar > 0) {
    items.push({
      name: 'Tip (to cleaner)',
      quantity: 1,
      rate: tipZar,
    });
  }

  const sum = sumLineItems(items);
  const diff = round2(expectedZar - sum);
  if (Math.abs(diff) > 0.001) {
    items.push({
      name: 'Invoice total adjustment',
      description: 'Aligns invoice lines with the amount charged (rounding / catalog drift)',
      quantity: 1,
      rate: diff,
    });
  }

  return {
    line_items: items,
    notes: buildBookingNotes(booking),
    primary_line_description: primaryDescription,
  };
}

/** Edge functions use static catalog pricing (`PRICING`); Next.js uses `fetchActivePricing()` instead. */
export function buildZohoInvoicePayloadPartsWithStaticPricing(booking: ZohoInvoiceBookingInput) {
  return buildZohoInvoicePayloadParts({ booking, pricing: PRICING });
}
