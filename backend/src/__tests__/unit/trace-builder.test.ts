import { describe, it, expect } from "vitest";
import {
  buildDecisionFlow,
  buildEvaluationTrace,
  type TraceContext,
} from "../../domain/engine/trace-builder.js";

function makeAnalyzedCtx(overrides: Partial<TraceContext> = {}): TraceContext {
  return {
    productName: "Bonbons Haribo",
    barcode: "3045320094084",
    resolveSource: "db_fresh",
    resolveMs: 0.3,
    geminiSource: "live",
    extractMs: 420,
    ingredientCount: 15,
    additiveCount: 3,
    category: "candy",
    substancesDetectedCount: 2,
    track: "analyzed",
    matches: [
      { substanceId: "SHELLAC", source: "gemini", matchedTerm: "gomme-laque", confidence: 0.95, priority: 100 },
      { substanceId: "CARMINE", source: "e_number", matchedTerm: "E120", confidence: 1.0, priority: 90 },
    ],
    scenarioSelections: [
      { substanceId: "SHELLAC", scenarioKey: "uncertified_candy", specificity: 1, baseScore: 35 },
      { substanceId: "CARMINE", scenarioKey: "__default__", specificity: 0, baseScore: 35 },
    ],
    madhabResults: [
      { substanceId: "SHELLAC", madhab: "hanafi", ruling: "haram", contemporarySplit: true, scoreBefore: 35, scoreAfter: 20 },
      { substanceId: "CARMINE", madhab: "hanafi", ruling: "haram", contemporarySplit: false, scoreBefore: 35, scoreAfter: 20 },
    ],
    madhab: "hanafi",
    strictness: "moderate",
    aggregatedScore: 20,
    aggregatedVerdict: "avoid",
    strictnessAdjustment: 0,
    finalScore: 20,
    finalVerdict: "avoid",
    confidence: 0.81,
    engineMs: 12,
    totalMs: 435,
    ...overrides,
  };
}

function makeCertifiedCtx(): TraceContext {
  return {
    productName: "Steak haché ARGML",
    barcode: "3700000000001",
    resolveSource: "db_fresh",
    resolveMs: 0.2,
    geminiSource: "cache",
    extractMs: 0,
    ingredientCount: 3,
    additiveCount: 0,
    category: "meat",
    substancesDetectedCount: 0,
    track: "certified",
    certifierName: "ARGML",
    certifierGrade: "N1",
    matches: [],
    scenarioSelections: [],
    madhabResults: [],
    madhab: "hanafi",
    strictness: "moderate",
    aggregatedScore: 96,
    aggregatedVerdict: "halal",
    strictnessAdjustment: 0,
    finalScore: 96,
    finalVerdict: "halal",
    confidence: 0.95,
    engineMs: 5,
    totalMs: 8,
    tupleEvaluations: [
      { tupleSlug: "CATTLE_NOSTUN_MANUAL", family: "stunning", dimensions: "cattle/no_stun", baseScore: 98, evidenceLevel: "fulltime_muslim_inspector", adjustedScore: 96, isBlocking: false },
    ],
    trustBaseline: 96,
    speciesEvaluated: "cattle",
  };
}

describe("trace-builder", () => {
  describe("buildDecisionFlow — Analyzed Track", () => {
    it("generates a readable step-by-step narrative", () => {
      const flow = buildDecisionFlow(makeAnalyzedCtx());
      expect(flow.length).toBeGreaterThanOrEqual(7);

      // Verify each step is present and readable
      expect(flow[0]).toContain("ÉTAPE 1");
      expect(flow[0]).toContain("Bonbons Haribo");
      expect(flow[0]).toContain("3045320094084");

      expect(flow[1]).toContain("ÉTAPE 2");
      expect(flow[1]).toContain("15 ingrédients");
      expect(flow[1]).toContain("source=live");

      expect(flow[2]).toContain("ÉTAPE 3");
      expect(flow[2]).toContain("PISTE ANALYSÉE");

      expect(flow[3]).toContain("ÉTAPE 4");
      expect(flow[3]).toContain("2 substance(s)");

      // Substance detail lines
      expect(flow[4]).toContain("SHELLAC");
      expect(flow[4]).toContain("gomme-laque");
      expect(flow[5]).toContain("CARMINE");
    });

    it("shows scenario selection with specificity", () => {
      const flow = buildDecisionFlow(makeAnalyzedCtx());
      const scenarioStep = flow.find((l) => l.includes("ÉTAPE 5"));
      expect(scenarioStep).toContain("Sélection scénario");
      const shellacScenario = flow.find((l) => l.includes("uncertified_candy"));
      expect(shellacScenario).toBeDefined();
    });

    it("shows madhab filter with score delta", () => {
      const flow = buildDecisionFlow(makeAnalyzedCtx());
      const madhabLine = flow.find((l) => l.includes("SHELLAC") && l.includes("ruling="));
      expect(madhabLine).toContain("35→20");
      expect(madhabLine).toContain("Divergence contemporaine");
    });

    it("shows final aggregation with strictness overlay", () => {
      const flow = buildDecisionFlow(makeAnalyzedCtx());
      const finalLine = flow.find((l) => l.includes("FINAL"));
      expect(finalLine).toContain("score=20");
      expect(finalLine).toContain("verdict=avoid");
      expect(finalLine).toContain("0.81");
    });

    it("handles clean product (no substances)", () => {
      const flow = buildDecisionFlow(makeAnalyzedCtx({
        matches: [],
        scenarioSelections: [],
        madhabResults: [],
        substancesDetectedCount: 0,
        aggregatedScore: 90,
        aggregatedVerdict: "halal",
        finalScore: 90,
        finalVerdict: "halal",
      }));
      expect(flow.some((l) => l.includes("aucune substance"))).toBe(true);
      expect(flow.some((l) => l.includes("HALAL"))).toBe(true);
    });
  });

  describe("buildDecisionFlow — Certified Track", () => {
    it("generates certified-specific narrative with tuple evaluations", () => {
      const flow = buildDecisionFlow(makeCertifiedCtx());
      expect(flow[2]).toContain("PISTE CERTIFIÉE");
      expect(flow[2]).toContain("ARGML");

      const tupleLine = flow.find((l) => l.includes("CATTLE_NOSTUN_MANUAL"));
      expect(tupleLine).toContain("base=98");
      expect(tupleLine).toContain("ajusté=96");

      const baselineLine = flow.find((l) => l.includes("Baseline"));
      expect(baselineLine).toContain("96");

      const finalLine = flow.find((l) => l.includes("FINAL"));
      expect(finalLine).toContain("verdict=halal");
    });
  });

  describe("buildEvaluationTrace", () => {
    it("produces a complete trace JSONB with decision_flow included", () => {
      const trace = buildEvaluationTrace(makeAnalyzedCtx());
      expect(trace.engine_version).toBe("halal-engine-v2.0.0");
      expect(trace.track).toBe("analyzed");
      expect(trace.gemini_source).toBe("live");
      expect(trace.decision_flow).toBeInstanceOf(Array);
      expect(trace.decision_flow.length).toBeGreaterThanOrEqual(7);
      expect(trace.modules_fired).toHaveLength(2);
      expect(trace.final.verdict).toBe("avoid");
      expect(trace.final.score).toBe(20);
    });
  });
});
