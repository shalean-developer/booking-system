/**
 * Pricing preview payload must match `calculateFinalBookingPrice` output (no drift).
 * Run: npx tsx --test lib/pricing/pricing-preview-mirror.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRICING } from '@/lib/pricing';
import {
  calculateFinalBookingPrice,
  buildPricingPreviewResponse,
} from '@/lib/pricing/final-pricing';

test('preview matches final pricing exactly', () => {
  const final = calculateFinalBookingPrice(
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
  const preview = buildPricingPreviewResponse(final);
  assert.equal(preview.total_amount_cents, final.total_amount_cents);
  assert.equal(preview.price_zar, final.price_zar);
  assert.strictEqual(preview.breakdown, final.breakdown);
  assert.ok(Array.isArray(preview.admin_rule_ids));
});
