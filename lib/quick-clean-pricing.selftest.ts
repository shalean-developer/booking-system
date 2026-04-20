/**
 * Run: npx tsx lib/quick-clean-pricing.selftest.ts
 */
import assert from 'node:assert';
import {
  calculateQuickCleanV4,
  maxAllowedExtrasForTierV4,
  QUICK_CLEAN_TIERS_V4,
  resolveQuickCleanTierV4,
} from './quick-clean-pricing-v4';
import { DEFAULT_QUICK_CLEAN_SETTINGS } from './quick-clean-settings';

const xs = resolveQuickCleanTierV4(0);
assert.equal(maxAllowedExtrasForTierV4(QUICK_CLEAN_TIERS_V4.XS, DEFAULT_QUICK_CLEAN_SETTINGS), 8);

const m = calculateQuickCleanV4(
  { bedrooms: 3, extrasIds: [], extrasQuantities: {} },
  DEFAULT_QUICK_CLEAN_SETTINGS
);
assert.ok(m.finalPriceCents > 0);

const l = calculateQuickCleanV4(
  { bedrooms: 5, extrasIds: ['a'], extrasQuantities: { a: 1 } },
  DEFAULT_QUICK_CLEAN_SETTINGS
);
assert.ok(l.totalHours >= QUICK_CLEAN_TIERS_V4.L.baseHours);

console.log('quick-clean-pricing-v4 selftest ok');
