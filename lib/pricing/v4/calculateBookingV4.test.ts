/**
 * V4 hour guards, team rules, and rate sanity — run:
 * npx tsx --test lib/pricing/v4/calculateBookingV4.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBookingV4, resolveTeam } from '@/lib/pricing/v4/calculateBookingV4';

test('Deep: 1 bed / 1 bath → hours minimum 6 enforced', () => {
  const r = calculateBookingV4({
    service_type: 'deep',
    bedrooms: 1,
    bathrooms: 1,
    extra_rooms: 0,
    extras: [],
  });
  assert.equal(r.hours, 6);
});

test('Carpet: 1 carpet room → hours ≥ 1.5', () => {
  const r = calculateBookingV4({
    service_type: 'carpet',
    bedrooms: 1,
    bathrooms: 0,
    carpets: 1,
    rugs: 0,
    extra_rooms: 0,
    extras: [],
  });
  assert.ok(r.hours >= 1.5);
});

test('Carpet: 5 rooms + high rugs → hours ≤ 5.5', () => {
  const r = calculateBookingV4({
    service_type: 'carpet',
    bedrooms: 5,
    bathrooms: 5,
    carpets: 5,
    rugs: 5,
    extra_rooms: 0,
    extras: [],
  });
  assert.ok(r.hours <= 5.5);
});

test('Team: deep/move at 6h → 2 cleaners; at 7h → 3', () => {
  const d6 = calculateBookingV4({
    service_type: 'deep',
    bedrooms: 1,
    bathrooms: 1,
    extra_rooms: 0,
    extras: [],
  });
  assert.equal(d6.hours, 6);
  assert.equal(resolveTeam('deep', d6.hours), 2);
  assert.equal(d6.team_size, 2);

  const d7 = calculateBookingV4({
    service_type: 'deep',
    bedrooms: 1,
    bathrooms: 5,
    extra_rooms: 0,
    extras: [],
  });
  assert.equal(d7.hours, 7);
  assert.equal(resolveTeam('deep', d7.hours), 3);
  assert.equal(d7.team_size, 3);

  const m6 = calculateBookingV4({
    service_type: 'move',
    bedrooms: 1,
    bathrooms: 1,
    extra_rooms: 0,
    extras: [],
  });
  assert.equal(resolveTeam('move', m6.hours), 2);
});

test('Team: carpet <3h job → 1 cleaner; ≥3h → 2', () => {
  const low = calculateBookingV4({
    service_type: 'carpet',
    bedrooms: 1,
    bathrooms: 0,
    carpets: 1,
    rugs: 0,
    extra_rooms: 0,
    extras: [],
  });
  assert.ok(low.hours < 3);
  assert.equal(resolveTeam('carpet', low.hours), 1);
  assert.equal(low.team_size, 1);

  const high = calculateBookingV4({
    service_type: 'carpet',
    bedrooms: 5,
    bathrooms: 0,
    carpets: 5,
    rugs: 0,
    extra_rooms: 0,
    extras: [],
  });
  assert.ok(high.hours >= 3);
  assert.equal(resolveTeam('carpet', high.hours), 2);
  assert.equal(high.team_size, 2);
});

test('Pricing sanity: effective hourly rate in typical band (no throw)', () => {
  const r = calculateBookingV4({
    service_type: 'deep',
    bedrooms: 2,
    bathrooms: 2,
    extra_rooms: 0,
    extras: [],
  });
  const rate = r.cleaning_subtotal_zar / r.hours;
  assert.ok(rate >= 120 && rate <= 600);
  assert.ok(Math.abs(rate - r.effective_hourly_rate_zar) < 0.01);
});
