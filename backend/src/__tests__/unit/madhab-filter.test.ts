import { describe, it, expect } from "vitest";
import { applyMadhabFilter } from "../../domain/engine/madhab-filter.js";
import type { MadhabRulingView } from "../../domain/ports/madhab-ruling-repo.js";

describe("madhab-filter", () => {
  it("returns base score when madhab is general", () => {
    const result = applyMadhabFilter(45, "general", null);
    expect(result.score).toBe(45);
    expect(result.madhabNote).toBeNull();
  });

  it("lowers score when madhab ruling is haram", () => {
    const ruling: MadhabRulingView = {
      substanceId: "SHELLAC", madhab: "hanafi", ruling: "haram",
      contemporarySplit: true, classicalSources: [], contemporarySources: [],
    };
    const result = applyMadhabFilter(45, "hanafi", ruling);
    expect(result.score).toBeLessThan(45);
    expect(result.madhabNote).toContain("hanafi");
  });

  it("raises score when madhab ruling is halal", () => {
    const ruling: MadhabRulingView = {
      substanceId: "SHELLAC", madhab: "shafii", ruling: "halal",
      contemporarySplit: false, classicalSources: [], contemporarySources: [],
    };
    const result = applyMadhabFilter(45, "shafii", ruling);
    expect(result.score).toBeGreaterThan(45);
  });

  it("flags contemporary split in note", () => {
    const ruling: MadhabRulingView = {
      substanceId: "SHELLAC", madhab: "hanafi", ruling: "doubtful",
      contemporarySplit: true, classicalSources: [], contemporarySources: [],
    };
    const result = applyMadhabFilter(45, "hanafi", ruling);
    expect(result.madhabNote).toContain("divergence");
  });

  it("clamps score to 0-100 range", () => {
    const ruling: MadhabRulingView = {
      substanceId: "X", madhab: "hanafi", ruling: "haram",
      contemporarySplit: false, classicalSources: [], contemporarySources: [],
    };
    const result = applyMadhabFilter(5, "hanafi", ruling);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
