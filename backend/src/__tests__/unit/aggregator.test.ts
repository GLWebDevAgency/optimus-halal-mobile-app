import { describe, it, expect } from "vitest";
import { aggregate } from "../../domain/engine/aggregator.js";
import type { ModuleVerdict } from "../../domain/types/module-verdict.js";

function makeVerdict(overrides: Partial<ModuleVerdict>): ModuleVerdict {
  return {
    substanceId: "X", displayName: "X", score: 50, verdict: "mashbooh",
    scenarioKey: "test", rationaleFr: "test", rationaleAr: null,
    madhabNote: null, fatwaCount: 0, dossierId: "uuid", icon: "other",
    ...overrides,
  };
}

describe("aggregator", () => {
  it("returns halal for empty verdicts (analyzed clean)", () => {
    const result = aggregate([], "moderate");
    expect(result.verdict).toBe("halal");
    expect(result.score).toBe(90);
  });

  it("returns haram if any single module is haram", () => {
    const verdicts = [
      makeVerdict({ score: 80, verdict: "halal" }),
      makeVerdict({ score: 5, verdict: "haram" }),
    ];
    const result = aggregate(verdicts, "moderate");
    expect(result.verdict).toBe("haram");
  });

  it("uses weighted minimum for non-haram verdicts", () => {
    const verdicts = [
      makeVerdict({ score: 35, verdict: "mashbooh" }),
      makeVerdict({ score: 70, verdict: "halal_with_caution" }),
    ];
    const result = aggregate(verdicts, "moderate");
    expect(result.score).toBeLessThanOrEqual(40);
    expect(result.verdict).toBe("mashbooh");
  });

  it("applies strictness overlay — very_strict downgrades", () => {
    const verdicts = [makeVerdict({ score: 75, verdict: "halal_with_caution" })];
    const result = aggregate(verdicts, "very_strict");
    expect(result.score).toBeLessThan(75);
  });

  it("maps score to correct verdict bucket", () => {
    expect(aggregate([makeVerdict({ score: 95, verdict: "halal" })], "moderate").verdict).toBe("halal");
    expect(aggregate([makeVerdict({ score: 75, verdict: "halal_with_caution" })], "moderate").verdict).toBe("halal_with_caution");
    expect(aggregate([makeVerdict({ score: 50, verdict: "mashbooh" })], "moderate").verdict).toBe("mashbooh");
    expect(aggregate([makeVerdict({ score: 25, verdict: "avoid" })], "moderate").verdict).toBe("avoid");
    expect(aggregate([makeVerdict({ score: 10, verdict: "haram" })], "moderate").verdict).toBe("haram");
  });
});
