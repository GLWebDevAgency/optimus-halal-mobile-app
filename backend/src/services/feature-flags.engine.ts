/**
 * Feature Flags Evaluation Engine — Pure functions, zero I/O.
 *
 * All functions here are deterministic and side-effect-free,
 * making them trivially unit-testable without DB or Redis mocks.
 */

// ── Types ─────────────────────────────────────────────────
export interface FlagRule {
  attribute: string;
  operator: "eq" | "neq" | "in" | "notIn" | "gte" | "lte" | "semverGte" | "semverLte";
  value: string | string[] | number;
}

export interface UserContext {
  tier: "free" | "premium";
  madhab: string | null;
  platform: string | null;
  appVersion: string | null;
}

export interface FlagData {
  key: string;
  enabled: boolean;
  defaultValue: unknown;
  flagType: string;
  rolloutPercentage: number;
  variants: unknown;
  rules: unknown;
}

// ── FNV-1a hash for sticky rollout allocation ─────────────
export function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash;
}

// ── Semver comparison ─────────────────────────────────────
export function semverCompare(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// ── Context value extraction ──────────────────────────────
export function getContextValue(ctx: UserContext, attribute: string): string | null {
  switch (attribute) {
    case "tier": return ctx.tier;
    case "madhab": return ctx.madhab;
    case "platform": return ctx.platform;
    case "appVersion": return ctx.appVersion;
    default: return null;
  }
}

// ── Rule evaluation ───────────────────────────────────────
export function evaluateRule(rule: FlagRule, ctx: UserContext): boolean {
  const actual = getContextValue(ctx, rule.attribute);
  if (actual === null || actual === undefined) return false;

  switch (rule.operator) {
    case "eq":
      return actual === String(rule.value);
    case "neq":
      return actual !== String(rule.value);
    case "in":
      return Array.isArray(rule.value) && rule.value.includes(actual);
    case "notIn":
      return Array.isArray(rule.value) && !rule.value.includes(actual);
    case "gte":
      return Number(actual) >= Number(rule.value);
    case "lte":
      return Number(actual) <= Number(rule.value);
    case "semverGte":
      return semverCompare(actual, String(rule.value)) >= 0;
    case "semverLte":
      return semverCompare(actual, String(rule.value)) <= 0;
    default:
      return false;
  }
}

export function evaluateRules(rules: FlagRule[], ctx: UserContext): boolean {
  if (rules.length === 0) return true; // no rules = always match
  return rules.every((rule) => evaluateRule(rule, ctx));
}

// ── Resolve a single flag ─────────────────────────────────
export function resolveFlag(
  flag: FlagData,
  userId: string,
  overrideValue: unknown | undefined,
): unknown {
  // 1. Kill switch OFF → default
  if (!flag.enabled) return flag.defaultValue;

  // 2. User override takes precedence
  if (overrideValue !== undefined) return overrideValue;

  // 3. Rollout percentage (sticky via FNV-1a)
  if (flag.flagType === "percentage" || flag.rolloutPercentage < 100) {
    const bucket = fnv1a(flag.key + userId) % 100;
    if (bucket >= flag.rolloutPercentage) return flag.defaultValue;
  }

  // 4. Variant allocation
  if (flag.flagType === "variant" && Array.isArray(flag.variants) && flag.variants.length > 0) {
    const idx = fnv1a(flag.key + userId) % flag.variants.length;
    return flag.variants[idx];
  }

  // 5. Boolean enabled = true
  return true;
}
