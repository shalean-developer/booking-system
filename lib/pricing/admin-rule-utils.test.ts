/**
 * Run: npx tsx --test lib/pricing/admin-rule-utils.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  appliedRulesForLog,
  formatAppliedRulesForDisplay,
  getAppliedRuleIds,
  normalizeAppliedAdminRules,
} from '@/lib/pricing/admin-rule-utils';

test('getAppliedRuleIds handles legacy and new rule formats', () => {
  assert.deepEqual(getAppliedRuleIds(['a', 'b']), ['a', 'b']);
  assert.deepEqual(
    getAppliedRuleIds([
      { id: 'a', order: 1, type: 'override' },
      { id: 'b', order: 2, type: null },
    ]),
    ['a', 'b']
  );
  assert.deepEqual(getAppliedRuleIds(undefined), []);
});

test('normalizeAppliedAdminRules handles legacy and new rule formats', () => {
  assert.deepEqual(
    normalizeAppliedAdminRules(['a', 'b'], undefined),
    [
      { id: 'a', order: 1, type: null },
      { id: 'b', order: 2, type: null },
    ]
  );
  assert.deepEqual(
    normalizeAppliedAdminRules(
      [
        { id: 'a', order: 1, type: 'override' },
        { id: 'b', order: 2, type: 'cap' },
      ],
      undefined
    ),
    [
      { id: 'a', order: 1, type: 'override' },
      { id: 'b', order: 2, type: 'cap' },
    ]
  );
  assert.deepEqual(normalizeAppliedAdminRules([], ['x']), [{ id: 'x', order: 1, type: null }]);
});

test('formatAppliedRulesForDisplay uses order and type', () => {
  assert.equal(
    formatAppliedRulesForDisplay([{ id: 'r1', order: 1, type: 'override' }]),
    '1. override'
  );
});

test('appliedRulesForLog returns id, type, order', () => {
  assert.deepEqual(appliedRulesForLog([{ id: 'z', order: 3, type: 'multiplier' }]), [
    { id: 'z', type: 'multiplier', order: 3 },
  ]);
});
