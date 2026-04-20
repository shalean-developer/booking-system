/**
 * Surge engine — run: npx tsx --test lib/pricing/surgeEngine.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSurgeMultiplier, getPublicSurgePricingNote } from '@/lib/pricing/surgeEngine';

const CLAMP_MAX = 2.0;

test('normal conditions → multiplier ~1.0', () => {
  const r = calculateSurgeMultiplier({
    service_type: 'standard',
    date: '2026-06-10',
    time: '10:00',
    active_bookings_count: 3,
    available_cleaners_count: 10,
    slot_average_bookings: 3,
    required_cleaners: 1,
  });
  assert.ok(r.multiplier >= 0.95 && r.multiplier <= 1.15, `got ${r.multiplier}`);
});

test('high demand + low supply → elevated multiplier (bounded)', () => {
  const r = calculateSurgeMultiplier({
    service_type: 'standard',
    date: '2026-06-10',
    time: '10:00',
    active_bookings_count: 25,
    available_cleaners_count: 2,
    slot_average_bookings: 4,
    required_cleaners: 2,
  });
  assert.ok(r.multiplier >= 1.25 && r.multiplier <= CLAMP_MAX, `got ${r.multiplier}`);
});

test('low demand ratio → slight discount floor', () => {
  const r = calculateSurgeMultiplier({
    service_type: 'standard',
    date: '2026-06-11',
    time: '14:00',
    active_bookings_count: 0,
    available_cleaners_count: 20,
    slot_average_bookings: 8,
    required_cleaners: 1,
  });
  assert.ok(r.multiplier <= 1.0 && r.multiplier >= 0.8, `got ${r.multiplier}`);
});

test('multiplier never exceeds 2.0 or below 0.8', () => {
  const extreme = calculateSurgeMultiplier({
    service_type: 'airbnb',
    date: '2026-06-13',
    time: '08:00',
    active_bookings_count: 100,
    available_cleaners_count: 1,
    slot_average_bookings: 1,
    required_cleaners: 3,
    forecast_high_demand: true,
  });
  assert.ok(extreme.multiplier <= 2.0 && extreme.multiplier >= 0.8);
});

test('getPublicSurgePricingNote — no numeric breakdown', () => {
  assert.match(getPublicSurgePricingNote(1.12) ?? '', /increased/i);
  assert.match(getPublicSurgePricingNote(0.92) ?? '', /discount/i);
  assert.equal(getPublicSurgePricingNote(1.0), null);
});
