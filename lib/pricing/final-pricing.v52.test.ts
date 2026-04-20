/**
 * V5.2 pricing pipeline smoke tests — run: npx tsx --test lib/pricing/final-pricing.v52.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRICING } from '@/lib/pricing';
import { calculateFinalBookingPrice, MIN_PRICE_ZAR_V52 } from '@/lib/pricing/final-pricing';
import * as checkoutPricing from '@/lib/booking-checkout-pricing';

test('Carpet V4: 1 room / 0 rugs matches table (550 ZAR), above global min floor', () => {
  const r = calculateFinalBookingPrice(
    PRICING,
    {
      service: 'Carpet',
      bedrooms: 1,
      bathrooms: 0,
      extraRooms: 0,
      extras: [],
      rugs: 0,
      carpetDetails: {
        hasFittedCarpets: true,
        hasLooseCarpets: false,
        numberOfRooms: 1,
        numberOfLooseCarpets: 0,
        roomStatus: 'empty',
      },
    },
    'one-time'
  );
  assert.equal(r.price_zar, 550);
  assert.equal(r.breakdown.adjustments.min_fee, 0);
});

test('never returns negative price', () => {
  const r = calculateFinalBookingPrice(
    PRICING,
    {
      service: 'Standard',
      bedrooms: 1,
      bathrooms: 0,
      extraRooms: 0,
      extras: [],
      pricingMode: 'basic',
      provideEquipment: false,
    },
    'weekly'
  );
  assert.ok(r.price_zar >= 0);
  assert.ok(r.total_amount_cents >= 0);
});

test('matches unified + adjustments: cents mirror price_zar', () => {
  const r = calculateFinalBookingPrice(
    PRICING,
    {
      service: 'Standard',
      bedrooms: 2,
      bathrooms: 1,
      extraRooms: 0,
      extras: [],
      pricingMode: 'premium',
      provideEquipment: false,
    },
    'one-time'
  );
  assert.ok(r.breakdown.unified != null);
  assert.equal(r.total_amount_cents, Math.round(r.price_zar * 100));
});

test('applies dynamic multiplier (V6 — exposed on unified breakdown)', () => {
  const r = calculateFinalBookingPrice(
    PRICING,
    {
      service: 'Standard',
      bedrooms: 1,
      bathrooms: 1,
      extraRooms: 0,
      extras: [],
      pricingMode: 'premium',
      provideEquipment: false,
      schedule: { date: '2026-04-18', time_slot: '18:00' },
    },
    'one-time'
  );
  assert.ok(r.breakdown.unified != null);
  assert.ok(r.breakdown.unified!.dynamic_multiplier != null);
  assert.equal(typeof r.breakdown.unified!.dynamic_multiplier, 'number');
});

test('checkout availability helper does not expose price mutation API', () => {
  assert.equal(typeof checkoutPricing.runBookingCheckoutAvailability, 'function');
  const src = String(checkoutPricing.runBookingCheckoutAvailability);
  assert.ok(!src.includes('calculateSurgePricing'), 'checkout must not apply RPC surge to totals');
});

test('has only one price output on FinalPriceResult', () => {
  const pricing = calculateFinalBookingPrice(
    PRICING,
    {
      service: 'Standard',
      bedrooms: 1,
      bathrooms: 1,
      extraRooms: 0,
      extras: [],
      pricingMode: 'premium',
      provideEquipment: false,
    },
    'one-time'
  );
  assert.ok(pricing.total_amount_cents != null);
  assert.ok(!('preSurgeTotalZar' in pricing));
  assert.ok(!('finalTotalZar' in pricing));
});

test('frequency discount applies when not one-time', () => {
  const r = calculateFinalBookingPrice(
    PRICING,
    {
      service: 'Standard',
      bedrooms: 2,
      bathrooms: 1,
      extraRooms: 0,
      extras: [],
      pricingMode: 'premium',
      provideEquipment: true,
      referral: { first_booking_eligible: false },
    },
    'monthly'
  );
  assert.ok(r.breakdown.adjustments.frequency_percent > 0);
  assert.ok(r.total_amount_cents > 0);
});

test('increases dynamic multiplier when demand score is high (V6.1)', () => {
  const r = calculateFinalBookingPrice(
    PRICING,
    {
      service: 'Standard',
      bedrooms: 1,
      bathrooms: 1,
      extraRooms: 0,
      extras: [],
      pricingMode: 'premium',
      provideEquipment: false,
      schedule: { date: '2026-04-15', time_slot: '10:00' },
      dynamic_signals: { demand_score: 0.9, supply_score: 1 },
    },
    'one-time'
  );
  assert.ok(r.breakdown.unified != null);
  assert.ok(r.breakdown.unified.dynamic_multiplier > 1);
  assert.equal(r.breakdown.unified.demand_score, 0.9);
  assert.equal(r.breakdown.unified.supply_score, 1);
});

test('applies admin override multiplier (V6.2)', () => {
  const r = calculateFinalBookingPrice(
    PRICING,
    {
      service: 'Standard',
      bedrooms: 1,
      bathrooms: 1,
      extraRooms: 0,
      extras: [],
      pricingMode: 'premium',
      provideEquipment: false,
      schedule: { date: '2026-06-15', time_slot: '10:00' },
      dynamic_signals: { demand_score: 0.5, supply_score: 1 },
      admin_dynamic_pricing: {
        rule_ids: ['00000000-0000-0000-0000-000000000001'],
        multiplier: 1.5,
        base_dynamic_multiplier: 1,
      },
    },
    'one-time'
  );
  assert.ok(r.breakdown.unified != null);
  assert.equal(r.breakdown.unified.dynamic_multiplier, 1.5);
  assert.deepEqual(r.breakdown.unified.admin_rule_applied, [
    { id: '00000000-0000-0000-0000-000000000001', order: 1, type: null },
  ]);
  assert.equal(r.breakdown.unified.base_dynamic_multiplier, 1);
});

test('admin max ZAR cap clamps catalogue total (V6.2)', () => {
  const r = calculateFinalBookingPrice(
    PRICING,
    {
      service: 'Standard',
      bedrooms: 2,
      bathrooms: 2,
      extraRooms: 0,
      extras: [],
      pricingMode: 'premium',
      provideEquipment: false,
      schedule: { date: '2026-06-15', time_slot: '10:00' },
      dynamic_signals: { demand_score: 0.5, supply_score: 1 },
      admin_dynamic_pricing: {
        rule_ids: ['cap-rule'],
        multiplier: 1,
        base_dynamic_multiplier: 1,
        limits_zar: { min: null, max: 50 },
      },
    },
    'one-time'
  );
  assert.equal(r.breakdown.cart.total, 50);
  assert.ok((r.breakdown.adjustments.admin_max_clamp_zar ?? 0) > 0);
});
