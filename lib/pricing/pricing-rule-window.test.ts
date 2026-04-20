/**
 * Hour window — run: npx tsx --test lib/pricing/pricing-rule-window.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isHourInWindow } from '@/lib/pricing/pricing-rule-window';

test('overnight time window includes late evening', () => {
  assert.equal(isHourInWindow(23, 22, 2), true);
});

test('overnight time window includes early morning', () => {
  assert.equal(isHourInWindow(1, 22, 2), true);
});

test('overnight time window excludes mid-day', () => {
  assert.equal(isHourInWindow(12, 22, 2), false);
});

test('same-day window works', () => {
  assert.equal(isHourInWindow(10, 9, 17), true);
  assert.equal(isHourInWindow(8, 9, 17), false);
});

test('null start and end allows any hour', () => {
  assert.equal(isHourInWindow(3, null, null), true);
});
