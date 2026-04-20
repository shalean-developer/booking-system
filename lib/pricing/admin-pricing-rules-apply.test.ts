/**
 * V6.2 admin rule stacking — run: npx tsx --test lib/pricing/admin-pricing-rules-apply.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAdminPricingRulesStack,
  MAX_RULES_APPLIED,
  MAX_TOTAL_MULTIPLIER,
  MIN_TOTAL_MULTIPLIER,
} from '@/lib/pricing/admin-pricing-rules-apply';

const R1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1';
const R2 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2';
test('stacks multiple multiplier rules', () => {
  const r = applyAdminPricingRulesStack(1, [
    {
      id: R1,
      dynamic_enabled: true,
      rule_type: 'multiplier',
      multiplier_override: 1.1,
      priority: 10,
    },
    {
      id: R2,
      dynamic_enabled: true,
      rule_type: 'multiplier',
      multiplier_override: 1.1,
      priority: 5,
    },
  ]);
  assert.ok(Math.abs(r.finalMultiplier - 1.21) < 1e-9);
  assert.equal(r.appliedRuleIds.length, 2);
  assert.equal(r.appliedRules[0].order, 1);
  assert.equal(r.appliedRules[1].order, 2);
  assert.equal(r.appliedRules[0].type, 'multiplier');
  assert.ok(Math.abs(r.multiplier_delta - 0.21) < 1e-9);
  assert.ok(Math.abs(r.effective_multiplier - 1.21) < 1e-9);
});

test('override rule replaces accumulated multiplier', () => {
  const r = applyAdminPricingRulesStack(2, [
    {
      id: R1,
      dynamic_enabled: true,
      rule_type: 'multiplier',
      multiplier_override: 1.2,
      priority: 10,
    },
    {
      id: R2,
      dynamic_enabled: true,
      rule_type: 'override',
      multiplier_override: 1.5,
      priority: 5,
    },
  ]);
  assert.equal(r.finalMultiplier, 1.5);
  assert.ok(r.appliedRuleIds.includes(R2));
});

test('override stops further stacking', () => {
  const r = applyAdminPricingRulesStack(1, [
    {
      id: R1,
      dynamic_enabled: true,
      rule_type: 'override',
      multiplier_override: 1.5,
      priority: 10,
    },
    {
      id: R2,
      dynamic_enabled: true,
      rule_type: 'multiplier',
      multiplier_override: 2,
      priority: 5,
    },
  ]);
  assert.equal(r.finalMultiplier, 1.5);
  assert.equal(r.appliedRuleIds.length, 1);
  assert.ok(r.appliedRuleIds.includes(R1));
  assert.ok(!r.appliedRuleIds.includes(R2));
});

test('cap rule merges min/max for final-pricing', () => {
  const r = applyAdminPricingRulesStack(1, [
    {
      id: R1,
      dynamic_enabled: true,
      rule_type: 'cap',
      min_price_zar: 100,
      max_price_zar: 500,
      priority: 10,
    },
  ]);
  assert.equal(r.limits_zar?.min, 100);
  assert.equal(r.limits_zar?.max, 500);
  assert.ok(r.appliedRuleIds.includes(R1));
});

test('multiple cap rules merge to tightest min/max band', () => {
  const r = applyAdminPricingRulesStack(1, [
    {
      id: R1,
      dynamic_enabled: true,
      rule_type: 'cap',
      min_price_zar: 100,
      max_price_zar: 1000,
      priority: 10,
    },
    {
      id: R2,
      dynamic_enabled: true,
      rule_type: 'cap',
      min_price_zar: 200,
      max_price_zar: 400,
      priority: 5,
    },
  ]);
  assert.equal(r.limits_zar?.min, 200);
  assert.equal(r.limits_zar?.max, 400);
});

test('expired rules are ignored at fetch layer (apply receives only active rules)', () => {
  const r = applyAdminPricingRulesStack(1, []);
  assert.equal(r.finalMultiplier, 1);
  assert.equal(r.appliedRuleIds.length, 0);
  assert.equal(r.effective_multiplier, 1);
});

test('global cap prevents multiplier overflow', () => {
  const r = applyAdminPricingRulesStack(1, [
    {
      id: R1,
      dynamic_enabled: true,
      rule_type: 'multiplier',
      multiplier_override: 5,
      priority: 10,
    },
  ]);
  assert.equal(r.finalMultiplier, MAX_TOTAL_MULTIPLIER);
});

test('global floor prevents multiplier underflow', () => {
  const r = applyAdminPricingRulesStack(1, [
    {
      id: R1,
      dynamic_enabled: true,
      rule_type: 'override',
      multiplier_override: 0.1,
      priority: 10,
    },
  ]);
  assert.equal(r.finalMultiplier, MIN_TOTAL_MULTIPLIER);
});

test('dynamic_enabled false neutralizes before type switch', () => {
  const r = applyAdminPricingRulesStack(2, [
    {
      id: R1,
      dynamic_enabled: false,
      rule_type: 'multiplier',
      multiplier_override: 9,
      priority: 10,
    },
  ]);
  assert.equal(r.finalMultiplier, 1);
});

test('no-op rules are skipped', () => {
  const r = applyAdminPricingRulesStack(1, [
    {
      id: R1,
      dynamic_enabled: true,
      rule_type: 'multiplier',
      priority: 10,
    },
    {
      id: R2,
      dynamic_enabled: true,
      rule_type: 'multiplier',
      multiplier_override: 1.5,
      priority: 5,
    },
  ]);
  assert.equal(r.finalMultiplier, 1.5);
  assert.ok(!r.appliedRuleIds.includes(R1));
  assert.ok(r.appliedRuleIds.includes(R2));
});

test('rule limit prevents overflow', () => {
  const rules = Array.from({ length: 12 }, (_, i) => ({
    id: `bbbbbbbb-bbbb-bbbb-bbbb-${String(i).padStart(12, '0')}`,
    dynamic_enabled: true as const,
    rule_type: 'multiplier' as const,
    multiplier_override: 1.01,
    priority: 100 - i,
  }));
  const r = applyAdminPricingRulesStack(1, rules);
  assert.equal(r.appliedRuleIds.length, MAX_RULES_APPLIED);
  let expected = 1;
  for (let i = 0; i < MAX_RULES_APPLIED; i++) expected *= 1.01;
  assert.ok(Math.abs(r.finalMultiplier - expected) < 1e-6);
});

test('calculates effective multiplier as 1 when base dynamic is zero', () => {
  const r = applyAdminPricingRulesStack(0, [
    {
      id: R1,
      dynamic_enabled: true,
      rule_type: 'multiplier',
      multiplier_override: 1.2,
      priority: 10,
    },
  ]);
  assert.equal(r.effective_multiplier, 1);
});

test('logs clamp trigger when exceeding limits', () => {
  const orig = console.warn;
  const calls: unknown[] = [];
  console.warn = (...args: unknown[]) => {
    calls.push(args);
  };
  try {
    applyAdminPricingRulesStack(1, [
      {
        id: R1,
        dynamic_enabled: true,
        rule_type: 'multiplier',
        multiplier_override: 5,
        priority: 10,
      },
    ]);
    assert.ok(calls.some((c) => Array.isArray(c) && c[0] === '[PRICING CLAMP]'));
  } finally {
    console.warn = orig;
  }
});

test('logs warning when rule count exceeds limit', () => {
  const orig = console.warn;
  const calls: unknown[] = [];
  console.warn = (...args: unknown[]) => {
    calls.push(args);
  };
  try {
    const rules = Array.from({ length: 12 }, (_, i) => ({
      id: `cccccccc-cccc-cccc-cccc-${String(i).padStart(12, '0')}`,
      dynamic_enabled: true as const,
      rule_type: 'multiplier' as const,
      multiplier_override: 1.01,
      priority: 100 - i,
    }));
    applyAdminPricingRulesStack(1, rules);
    assert.ok(calls.some((c) => Array.isArray(c) && c[0] === '[PRICING RULE LIMIT]'));
  } finally {
    console.warn = orig;
  }
});
