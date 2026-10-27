import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateFeatureFlag, hashToPercent, FeatureFlagRegistry } from './evaluator';
import type { FeatureFlag } from '../../types/src';

test('feature flags: respects master enabled toggle', () => {
  const flag: FeatureFlag = {
    key: 'test_flag',
    name: 'Test Flag',
    description: 'Testing flag',
    enabled: false,
    rolloutPercentage: 100,
    environment: 'all',
    updated_at: new Date().toISOString(),
  };

  assert.equal(evaluateFeatureFlag(flag), false);

  flag.enabled = true;
  assert.equal(evaluateFeatureFlag(flag), true);
});

test('feature flags: whitelist overrides percentage restriction', () => {
  const flag: FeatureFlag = {
    key: 'beta_feature',
    name: 'Beta Feature',
    description: 'Beta only for select testers',
    enabled: true,
    rolloutPercentage: 0,
    allowedTelegramIds: [123456],
    environment: 'all',
    updated_at: new Date().toISOString(),
  };

  // User not in whitelist
  assert.equal(evaluateFeatureFlag(flag, { telegramId: 999999 }), false);
  // User in whitelist
  assert.equal(evaluateFeatureFlag(flag, { telegramId: 123456 }), true);
});

test('feature flags: role-based restriction', () => {
  const flag: FeatureFlag = {
    key: 'admin_panel',
    name: 'Admin Panel Access',
    description: 'For admin roles only',
    enabled: true,
    rolloutPercentage: 100,
    allowedRoles: ['admin', 'moderator'],
    environment: 'all',
    updated_at: new Date().toISOString(),
  };

  assert.equal(evaluateFeatureFlag(flag, { role: 'user' }), false);
  assert.equal(evaluateFeatureFlag(flag, { role: 'admin' }), true);
  assert.equal(evaluateFeatureFlag(flag, { role: 'moderator' }), true);
});

test('feature flags: deterministic percentage hashing', () => {
  const p1 = hashToPercent('feature_x:user123');
  const p2 = hashToPercent('feature_x:user123');
  assert.equal(p1, p2);
  assert.ok(p1 >= 0 && p1 < 100);
});
