import type { FeatureFlag, FeatureEvaluationContext } from '../../types/src';

/**
 * Deterministic hash of string to integer [0..99] for percentage rollouts
 */
export function hashToPercent(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Convert to 32bit int
  }
  return Math.abs(hash % 100);
}

/**
 * Evaluates whether a feature flag is active for a given context
 */
export function evaluateFeatureFlag(
  flag: FeatureFlag,
  context: FeatureEvaluationContext = {}
): boolean {
  // 1. Master toggle check
  if (!flag.enabled) {
    return false;
  }

  // 2. Environment check
  if (flag.environment !== 'all' && context.environment && flag.environment !== context.environment) {
    return false;
  }

  // 3. User explicit ID whitelist check
  if (context.telegramId && flag.allowedTelegramIds && flag.allowedTelegramIds.length > 0) {
    if (flag.allowedTelegramIds.includes(context.telegramId)) {
      return true;
    }
  }

  // 4. Role check
  if (context.role && flag.allowedRoles && flag.allowedRoles.length > 0) {
    if (!flag.allowedRoles.includes(context.role)) {
      return false;
    }
  }

  // 5. Rollout percentage check
  if (flag.rolloutPercentage < 100) {
    const seed = context.telegramId?.toString() || context.userId || 'anonymous';
    const userBucket = hashToPercent(`${flag.key}:${seed}`);
    return userBucket < flag.rolloutPercentage;
  }

  return true;
}

export class FeatureFlagRegistry {
  private flags: Map<string, FeatureFlag> = new Map();

  constructor(initialFlags: FeatureFlag[] = []) {
    for (const flag of initialFlags) {
      this.flags.set(flag.key, flag);
    }
  }

  public set(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
  }

  public get(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }

  public getAll(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  public isEnabled(key: string, context?: FeatureEvaluationContext): boolean {
    const flag = this.flags.get(key);
    if (!flag) return false;
    return evaluateFeatureFlag(flag, context);
  }
}
