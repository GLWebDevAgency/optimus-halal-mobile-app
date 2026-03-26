import { describe, it, expect } from "vitest";
import {
  fnv1a,
  semverCompare,
  getContextValue,
  evaluateRule,
  evaluateRules,
  resolveFlag,
  type FlagRule,
  type UserContext,
  type FlagData,
} from "../../services/feature-flags.engine.js";

// ── Helpers ───────────────────────────────────────────────

const FREE_USER: UserContext = {
  tier: "free",
  madhab: "hanafi",
  platform: "ios",
  appVersion: "2.1.0",
};

const PREMIUM_USER: UserContext = {
  tier: "premium",
  madhab: "maliki",
  platform: "android",
  appVersion: "3.0.0",
};

function makeFlag(overrides: Partial<FlagData> = {}): FlagData {
  return {
    key: "testFlag",
    enabled: true,
    defaultValue: false,
    flagType: "boolean",
    rolloutPercentage: 100,
    variants: null,
    rules: [],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════
// FNV-1a
// ═══════════════════════════════════════════════════════════

describe("fnv1a", () => {
  it("returns a 32-bit unsigned integer", () => {
    const hash = fnv1a("hello");
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThan(2 ** 32);
  });

  it("is deterministic — same input always yields same hash", () => {
    const a = fnv1a("testFlaguser-123");
    const b = fnv1a("testFlaguser-123");
    expect(a).toBe(b);
  });

  it("produces different hashes for different inputs", () => {
    const a = fnv1a("flagAuser-1");
    const b = fnv1a("flagBuser-1");
    expect(a).not.toBe(b);
  });

  it("distributes values across [0,100) reasonably", () => {
    const buckets = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      buckets.add(fnv1a(`flag${i}user${i}`) % 100);
    }
    // With 1000 inputs we should cover most of 0-99
    expect(buckets.size).toBeGreaterThan(80);
  });

  it("handles empty string", () => {
    expect(fnv1a("")).toBe(2166136261); // FNV offset basis
  });
});

// ═══════════════════════════════════════════════════════════
// Semver comparison
// ═══════════════════════════════════════════════════════════

describe("semverCompare", () => {
  it("returns 0 for equal versions", () => {
    expect(semverCompare("1.0.0", "1.0.0")).toBe(0);
  });

  it("returns positive when a > b (major)", () => {
    expect(semverCompare("2.0.0", "1.0.0")).toBeGreaterThan(0);
  });

  it("returns negative when a < b (major)", () => {
    expect(semverCompare("1.0.0", "2.0.0")).toBeLessThan(0);
  });

  it("compares minor versions", () => {
    expect(semverCompare("1.2.0", "1.1.0")).toBeGreaterThan(0);
    expect(semverCompare("1.1.0", "1.2.0")).toBeLessThan(0);
  });

  it("compares patch versions", () => {
    expect(semverCompare("1.0.3", "1.0.1")).toBeGreaterThan(0);
    expect(semverCompare("1.0.1", "1.0.3")).toBeLessThan(0);
  });

  it("handles missing patch component", () => {
    expect(semverCompare("1.0", "1.0.0")).toBe(0);
  });

  it("handles partial versions gracefully", () => {
    expect(semverCompare("2", "1")).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════
// getContextValue
// ═══════════════════════════════════════════════════════════

describe("getContextValue", () => {
  it("returns tier", () => {
    expect(getContextValue(FREE_USER, "tier")).toBe("free");
  });

  it("returns madhab", () => {
    expect(getContextValue(FREE_USER, "madhab")).toBe("hanafi");
  });

  it("returns platform", () => {
    expect(getContextValue(FREE_USER, "platform")).toBe("ios");
  });

  it("returns appVersion", () => {
    expect(getContextValue(FREE_USER, "appVersion")).toBe("2.1.0");
  });

  it("returns null for unknown attribute", () => {
    expect(getContextValue(FREE_USER, "unknown")).toBeNull();
  });

  it("returns null when context value is null", () => {
    const ctx: UserContext = { ...FREE_USER, madhab: null };
    expect(getContextValue(ctx, "madhab")).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════
// evaluateRule — single rule
// ═══════════════════════════════════════════════════════════

describe("evaluateRule", () => {
  describe("eq operator", () => {
    it("matches when values are equal", () => {
      const rule: FlagRule = { attribute: "tier", operator: "eq", value: "free" };
      expect(evaluateRule(rule, FREE_USER)).toBe(true);
    });

    it("fails when values differ", () => {
      const rule: FlagRule = { attribute: "tier", operator: "eq", value: "premium" };
      expect(evaluateRule(rule, FREE_USER)).toBe(false);
    });
  });

  describe("neq operator", () => {
    it("matches when values differ", () => {
      const rule: FlagRule = { attribute: "tier", operator: "neq", value: "premium" };
      expect(evaluateRule(rule, FREE_USER)).toBe(true);
    });

    it("fails when values are equal", () => {
      const rule: FlagRule = { attribute: "tier", operator: "neq", value: "free" };
      expect(evaluateRule(rule, FREE_USER)).toBe(false);
    });
  });

  describe("in operator", () => {
    it("matches when value is in array", () => {
      const rule: FlagRule = { attribute: "platform", operator: "in", value: ["ios", "android"] };
      expect(evaluateRule(rule, FREE_USER)).toBe(true);
    });

    it("fails when value is not in array", () => {
      const rule: FlagRule = { attribute: "platform", operator: "in", value: ["web", "android"] };
      expect(evaluateRule(rule, FREE_USER)).toBe(false);
    });

    it("fails when value is not an array", () => {
      const rule: FlagRule = { attribute: "platform", operator: "in", value: "ios" };
      expect(evaluateRule(rule, FREE_USER)).toBe(false);
    });
  });

  describe("notIn operator", () => {
    it("matches when value is not in array", () => {
      const rule: FlagRule = { attribute: "platform", operator: "notIn", value: ["web", "android"] };
      expect(evaluateRule(rule, FREE_USER)).toBe(true);
    });

    it("fails when value is in array", () => {
      const rule: FlagRule = { attribute: "platform", operator: "notIn", value: ["ios", "android"] };
      expect(evaluateRule(rule, FREE_USER)).toBe(false);
    });
  });

  describe("gte / lte operators (numeric)", () => {
    it("gte matches when actual >= value", () => {
      const rule: FlagRule = { attribute: "appVersion", operator: "gte", value: 2 };
      const ctx: UserContext = { ...FREE_USER, appVersion: "3" };
      expect(evaluateRule(rule, ctx)).toBe(true);
    });

    it("lte matches when actual <= value", () => {
      const rule: FlagRule = { attribute: "appVersion", operator: "lte", value: 5 };
      const ctx: UserContext = { ...FREE_USER, appVersion: "3" };
      expect(evaluateRule(rule, ctx)).toBe(true);
    });
  });

  describe("semverGte / semverLte operators", () => {
    it("semverGte matches when actual >= target", () => {
      const rule: FlagRule = { attribute: "appVersion", operator: "semverGte", value: "2.0.0" };
      expect(evaluateRule(rule, FREE_USER)).toBe(true); // 2.1.0 >= 2.0.0
    });

    it("semverGte fails when actual < target", () => {
      const rule: FlagRule = { attribute: "appVersion", operator: "semverGte", value: "3.0.0" };
      expect(evaluateRule(rule, FREE_USER)).toBe(false); // 2.1.0 < 3.0.0
    });

    it("semverLte matches when actual <= target", () => {
      const rule: FlagRule = { attribute: "appVersion", operator: "semverLte", value: "3.0.0" };
      expect(evaluateRule(rule, FREE_USER)).toBe(true); // 2.1.0 <= 3.0.0
    });

    it("semverLte fails when actual > target", () => {
      const rule: FlagRule = { attribute: "appVersion", operator: "semverLte", value: "1.0.0" };
      expect(evaluateRule(rule, FREE_USER)).toBe(false); // 2.1.0 > 1.0.0
    });

    it("semverGte matches on exact equality", () => {
      const rule: FlagRule = { attribute: "appVersion", operator: "semverGte", value: "2.1.0" };
      expect(evaluateRule(rule, FREE_USER)).toBe(true);
    });
  });

  describe("null context", () => {
    it("returns false when context value is null", () => {
      const ctx: UserContext = { ...FREE_USER, madhab: null };
      const rule: FlagRule = { attribute: "madhab", operator: "eq", value: "hanafi" };
      expect(evaluateRule(rule, ctx)).toBe(false);
    });

    it("returns false for unknown attribute", () => {
      const rule: FlagRule = { attribute: "unknownField", operator: "eq", value: "x" };
      expect(evaluateRule(rule, FREE_USER)).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// evaluateRules — AND logic
// ═══════════════════════════════════════════════════════════

describe("evaluateRules", () => {
  it("returns true for empty rules (no constraints)", () => {
    expect(evaluateRules([], FREE_USER)).toBe(true);
  });

  it("returns true when all rules match (AND)", () => {
    const rules: FlagRule[] = [
      { attribute: "tier", operator: "eq", value: "free" },
      { attribute: "platform", operator: "eq", value: "ios" },
    ];
    expect(evaluateRules(rules, FREE_USER)).toBe(true);
  });

  it("returns false when any rule fails (AND)", () => {
    const rules: FlagRule[] = [
      { attribute: "tier", operator: "eq", value: "free" },
      { attribute: "platform", operator: "eq", value: "android" }, // fails
    ];
    expect(evaluateRules(rules, FREE_USER)).toBe(false);
  });

  it("handles complex targeting: premium + android + version >= 3.0.0", () => {
    const rules: FlagRule[] = [
      { attribute: "tier", operator: "eq", value: "premium" },
      { attribute: "platform", operator: "in", value: ["android"] },
      { attribute: "appVersion", operator: "semverGte", value: "3.0.0" },
    ];
    expect(evaluateRules(rules, PREMIUM_USER)).toBe(true);
    expect(evaluateRules(rules, FREE_USER)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// resolveFlag — full resolution logic
// ═══════════════════════════════════════════════════════════

describe("resolveFlag", () => {
  const userId = "user-abc-123";

  describe("kill switch (enabled=false)", () => {
    it("returns defaultValue when flag is disabled", () => {
      const flag = makeFlag({ enabled: false, defaultValue: false });
      expect(resolveFlag(flag, userId, undefined)).toBe(false);
    });

    it("returns defaultValue even if override exists when disabled", () => {
      const flag = makeFlag({ enabled: false, defaultValue: false });
      expect(resolveFlag(flag, userId, true)).toBe(false);
    });
  });

  describe("user override", () => {
    it("override value takes precedence over everything", () => {
      const flag = makeFlag({ enabled: true, rolloutPercentage: 0 });
      expect(resolveFlag(flag, userId, true)).toBe(true);
    });

    it("respects false override", () => {
      const flag = makeFlag({ enabled: true });
      expect(resolveFlag(flag, userId, false)).toBe(false);
    });

    it("does not use override when it is undefined", () => {
      const flag = makeFlag({ enabled: true });
      expect(resolveFlag(flag, userId, undefined)).toBe(true);
    });
  });

  describe("rollout percentage", () => {
    it("returns true when rollout is 100%", () => {
      const flag = makeFlag({ rolloutPercentage: 100, flagType: "boolean" });
      expect(resolveFlag(flag, userId, undefined)).toBe(true);
    });

    it("returns defaultValue when rollout is 0%", () => {
      const flag = makeFlag({ rolloutPercentage: 0, flagType: "boolean", defaultValue: false });
      expect(resolveFlag(flag, userId, undefined)).toBe(false);
    });

    it("is sticky — same user+flag always gets same result", () => {
      const flag = makeFlag({ rolloutPercentage: 50, flagType: "percentage" });
      const r1 = resolveFlag(flag, userId, undefined);
      const r2 = resolveFlag(flag, userId, undefined);
      expect(r1).toBe(r2);
    });

    it("uses flagType=percentage for rollout check", () => {
      const flag = makeFlag({ rolloutPercentage: 50, flagType: "percentage", defaultValue: "off" });
      // Deterministic: fnv1a("testFlag" + "user-abc-123") % 100
      const bucket = fnv1a(flag.key + userId) % 100;
      const expected = bucket < 50 ? true : "off";
      expect(resolveFlag(flag, userId, undefined)).toBe(expected);
    });
  });

  describe("variant allocation", () => {
    it("returns a variant from the array", () => {
      const variants = ["control", "variant-a", "variant-b"];
      const flag = makeFlag({ flagType: "variant", variants });
      const result = resolveFlag(flag, userId, undefined);
      expect(variants).toContain(result);
    });

    it("is sticky for variant selection", () => {
      const flag = makeFlag({ flagType: "variant", variants: ["A", "B", "C"] });
      const r1 = resolveFlag(flag, userId, undefined);
      const r2 = resolveFlag(flag, userId, undefined);
      expect(r1).toBe(r2);
    });

    it("returns defaultValue if variants is empty", () => {
      const flag = makeFlag({ flagType: "variant", variants: [], defaultValue: "v1" });
      expect(resolveFlag(flag, userId, undefined)).toBe("v1");
    });

    it("returns defaultValue if variants is null", () => {
      const flag = makeFlag({ flagType: "variant", variants: null, defaultValue: "v1" });
      expect(resolveFlag(flag, userId, undefined)).toBe("v1");
    });

    it("returns defaultValue for variant used as global config (authMode pattern)", () => {
      const flag = makeFlag({
        flagType: "variant",
        enabled: true,
        defaultValue: "v2",
        variants: null,
        rolloutPercentage: 100,
      });
      expect(resolveFlag(flag, "any-user-1", undefined)).toBe("v2");
      expect(resolveFlag(flag, "any-user-2", undefined)).toBe("v2");
    });

    it("distributes users across variants", () => {
      const flag = makeFlag({ flagType: "variant", variants: ["A", "B", "C"] });
      const counts: Record<string, number> = { A: 0, B: 0, C: 0 };
      const total = 10000;
      for (let i = 0; i < total; i++) {
        const result = resolveFlag(flag, `user-variant-dist-${i}`, undefined) as string;
        counts[result]++;
      }
      // Each variant should get some users (at least 20% of expected 33%)
      expect(counts.A).toBeGreaterThan(total * 0.2);
      expect(counts.B).toBeGreaterThan(total * 0.2);
      expect(counts.C).toBeGreaterThan(total * 0.2);
    });
  });

  describe("boolean flag (default path)", () => {
    it("returns true for an enabled boolean flag at 100% rollout", () => {
      const flag = makeFlag({ enabled: true, flagType: "boolean", rolloutPercentage: 100 });
      expect(resolveFlag(flag, userId, undefined)).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// Integration: rollout distribution sanity check
// ═══════════════════════════════════════════════════════════

describe("rollout distribution", () => {
  it("50% rollout includes roughly half of users (±10%)", () => {
    const flag = makeFlag({ rolloutPercentage: 50, flagType: "percentage", defaultValue: false });
    let included = 0;
    const total = 10000;
    for (let i = 0; i < total; i++) {
      const result = resolveFlag(flag, `user-${i}`, undefined);
      if (result === true) included++;
    }
    const ratio = included / total;
    expect(ratio).toBeGreaterThan(0.4);
    expect(ratio).toBeLessThan(0.6);
  });

  it("10% rollout includes roughly 10% of users (±5%)", () => {
    const flag = makeFlag({ rolloutPercentage: 10, flagType: "percentage", defaultValue: false });
    let included = 0;
    const total = 10000;
    for (let i = 0; i < total; i++) {
      const result = resolveFlag(flag, `user-${i}`, undefined);
      if (result === true) included++;
    }
    const ratio = included / total;
    expect(ratio).toBeGreaterThan(0.05);
    expect(ratio).toBeLessThan(0.15);
  });
});
