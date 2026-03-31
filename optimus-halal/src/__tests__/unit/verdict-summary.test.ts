import { describe, it, expect } from "vitest";
import {
  buildVerdictSummary,
  selectAdviceTexts,
  type VerdictSummaryInput,
  type VerdictSummaryResult,
  type MatrixLevel,
  type CompositionStatus,
  type AdviceTextId,
} from "@/utils/verdict-summary";

// ── Stub translations — keys match the VerdictTranslations interface ──

const T = {
  fiqh4Halal: "fiqh4Halal",
  fiqh4Haram: "fiqh4Haram",
  fiqh4Doubtful: "fiqh4Doubtful",
  fiqh4Unknown: "fiqh4Unknown",
  fiqhMajority: "{n} sur 4 ok. {school} réserve.",
  fiqhDivergent: "fiqhDivergent",
  certifierAlso: "aussi {name} {grade} ({score}/100)",
  certifierHowever: "toutefois {name} {grade} ({score}/100)",
  certifierNone: "certifierNone",
  certifierNoScore: "certifié par {name}",
  theoreticalNote: "theoreticalNote",
  short4Halal: "short4Halal",
  short4Haram: "short4Haram",
  short4Doubtful: "short4Doubtful",
  short4Unknown: "short4Unknown",
  shortMajority: "{n}/4",
  shortDivergent: "shortDivergent",
  // Matrix keys
  matrixHighConfidenceLabel: "Confiance élevée",
  matrixHighConfidencePhrase: "Certifié halal très fiable. Aucun ingrédient problématique.",
  matrixGoodConfidenceLabel: "Confiance correcte",
  matrixGoodConfidencePhrase: "Certification fiable. Composition conforme.",
  matrixVigilanceCleanLabel: "Vigilance",
  matrixVigilanceCleanPhrase: "Certifieur vigilance ({score}/100). Pas de problème mais garanties limitées.",
  matrixLowReliabilityLabel: "Peu fiable",
  matrixLowReliabilityPhrase: "Certifieur peu fiable ({score}/100). Pas interdit mais abattage non assuré.",
  matrixNotReliableLabel: "Pas fiable du tout",
  matrixNotReliablePhrase: "Certifieur ({name}, {score}/100) aucune garantie.",
  matrixDoubtfulHighLabel: "Ingrédient(s) douteux",
  matrixDoubtfulHighPhrase: "Certifieur fiable, {count} ingrédient(s) débat.",
  matrixDoubleVigilanceLabel: "Double vigilance",
  matrixDoubleVigilancePhrase: "Certifieur vigilance ({score}/100) + douteux.",
  matrixNotRecommendedLabel: "Non recommandé",
  matrixNotRecommendedPhrase: "Certifieur peu fiable ({score}/100) + douteux.",
  matrixHaramLabel: "Ingrédient interdit",
  matrixHaramPhrase: "{count} interdit(s) malgré certification.",
  matrixNoCertCleanLabel: "Composition conforme",
  matrixNoCertCleanPhrase: "Aucun élément problématique.",
  matrixNoCertDoubtfulLabel: "Ingrédient(s) douteux",
  matrixNoCertDoubtfulPhrase: "Ingrédients douteux détectés.",
  matrixNoCertHaramLabel: "Interdit",
  matrixNoCertHaramPhrase: "Ingrédients interdits présents.",
};

// ── Helpers ──

function make4Schools(status: string): VerdictSummaryInput["madhabVerdicts"] {
  return ["hanafi", "shafii", "maliki", "hanbali"].map((m) => ({
    madhab: m,
    status,
  }));
}

function certified(
  name: string,
  score: number,
  grade = "grade",
): Pick<VerdictSummaryInput, "certifierName" | "certifierScore" | "certifierGrade"> {
  return { certifierName: name, certifierScore: score, certifierGrade: grade };
}

function build(overrides: Partial<VerdictSummaryInput>): VerdictSummaryResult {
  const defaults: VerdictSummaryInput = {
    madhabVerdicts: make4Schools("halal"),
    certifierName: null,
    certifierGrade: null,
    certifierScore: null,
    conflictCount: 0,
  };
  return buildVerdictSummary({ ...defaults, ...overrides }, T);
}

// ═══════════════════════════════════════════════════════════════
// 1. CERTIFIED + CLEAN (all 4 schools halal)
// ═══════════════════════════════════════════════════════════════

describe("Certified + Clean", () => {
  it("score ≥ 90 → Confiance élevée (high)", () => {
    const r = build({ ...certified("ACMIF", 95), conflictCount: 0 });
    expect(r.matrixLabel).toBe("Confiance élevée");
    expect(r.matrixLevel).toBe("high" satisfies MatrixLevel);
    expect(r.isDoubtful).toBe(false);
  });

  it("score = 90 (boundary) → Confiance élevée", () => {
    const r = build({ ...certified("AVS", 90) });
    expect(r.matrixLabel).toBe("Confiance élevée");
    expect(r.matrixLevel).toBe("high");
  });

  it("score 70-89 → Confiance correcte (good)", () => {
    const r = build({ ...certified("AVS", 75) });
    expect(r.matrixLabel).toBe("Confiance correcte");
    expect(r.matrixLevel).toBe("good");
    expect(r.isDoubtful).toBe(false);
  });

  it("score = 70 (boundary) → Confiance correcte", () => {
    const r = build({ ...certified("AVS", 70) });
    expect(r.matrixLabel).toBe("Confiance correcte");
    expect(r.matrixLevel).toBe("good");
  });

  it("score 51-69 → Vigilance", () => {
    const r = build({ ...certified("X", 55) });
    expect(r.matrixLabel).toBe("Vigilance");
    expect(r.matrixLevel).toBe("vigilance");
    expect(r.matrixPhrase).toContain("55/100");
    expect(r.isDoubtful).toBe(true);
  });

  it("score = 51 (boundary) → Vigilance", () => {
    const r = build({ ...certified("X", 51) });
    expect(r.matrixLabel).toBe("Vigilance");
    expect(r.matrixLevel).toBe("vigilance");
  });

  it("score 35-50 → Peu fiable (low)", () => {
    const r = build({ ...certified("Y", 42) });
    expect(r.matrixLabel).toBe("Peu fiable");
    expect(r.matrixLevel).toBe("low");
    expect(r.matrixPhrase).toContain("42/100");
    expect(r.isDoubtful).toBe(true);
  });

  it("score = 35 (boundary) → Peu fiable", () => {
    const r = build({ ...certified("Y", 35) });
    expect(r.matrixLabel).toBe("Peu fiable");
    expect(r.matrixLevel).toBe("low");
  });

  it("score < 35 → Pas fiable (danger)", () => {
    const r = build({ ...certified("BadCert", 12) });
    expect(r.matrixLabel).toBe("Pas fiable du tout");
    expect(r.matrixLevel).toBe("danger");
    expect(r.matrixPhrase).toContain("BadCert");
    expect(r.matrixPhrase).toContain("12/100");
    expect(r.isDoubtful).toBe(true);
  });

  it("score = 0 → Pas fiable", () => {
    const r = build({ ...certified("Zero", 0) });
    expect(r.matrixLabel).toBe("Pas fiable du tout");
    expect(r.matrixLevel).toBe("danger");
  });

  it("score = 89 → Confiance correcte (not élevée)", () => {
    const r = build({ ...certified("Edge", 89) });
    expect(r.matrixLabel).toBe("Confiance correcte");
    expect(r.matrixLevel).toBe("good");
  });

  it("score = 69 → Vigilance (not correcte)", () => {
    const r = build({ ...certified("Edge", 69) });
    expect(r.matrixLabel).toBe("Vigilance");
    expect(r.matrixLevel).toBe("vigilance");
  });

  it("score = 50 → Peu fiable (not vigilance)", () => {
    const r = build({ ...certified("Edge", 50) });
    expect(r.matrixLabel).toBe("Peu fiable");
    expect(r.matrixLevel).toBe("low");
  });

  it("score = 34 → Pas fiable (not peu fiable)", () => {
    const r = build({ ...certified("Edge", 34) });
    expect(r.matrixLabel).toBe("Pas fiable du tout");
    expect(r.matrixLevel).toBe("danger");
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. CERTIFIED + DOUBTFUL
// ═══════════════════════════════════════════════════════════════

describe("Certified + Doubtful", () => {
  const doubtfulSchools = [
    { madhab: "hanafi", status: "halal" },
    { madhab: "shafii", status: "doubtful" },
    { madhab: "maliki", status: "halal" },
    { madhab: "hanbali", status: "halal" },
  ];

  it("score ≥ 70 → Ingrédient(s) douteux (vigilance)", () => {
    const r = build({
      madhabVerdicts: doubtfulSchools,
      ...certified("AVS", 80),
      conflictCount: 2,
    });
    expect(r.matrixLabel).toBe("Ingrédient(s) douteux");
    expect(r.matrixLevel).toBe("vigilance");
    expect(r.matrixPhrase).toContain("2");
    expect(r.isDoubtful).toBe(true);
  });

  it("score 51-69 → Double vigilance (low)", () => {
    const r = build({
      madhabVerdicts: doubtfulSchools,
      ...certified("X", 55),
    });
    expect(r.matrixLabel).toBe("Double vigilance");
    expect(r.matrixLevel).toBe("low");
    expect(r.matrixPhrase).toContain("55/100");
    expect(r.isDoubtful).toBe(true);
  });

  it("score ≤ 50 → Non recommandé (danger)", () => {
    const r = build({
      madhabVerdicts: doubtfulSchools,
      ...certified("Bad", 30),
    });
    expect(r.matrixLabel).toBe("Non recommandé");
    expect(r.matrixLevel).toBe("danger");
    expect(r.matrixPhrase).toContain("30/100");
    expect(r.isDoubtful).toBe(true);
  });

  it("all 4 schools doubtful + high score → still Ingrédient(s) douteux", () => {
    const r = build({
      madhabVerdicts: make4Schools("doubtful"),
      ...certified("Top", 95),
      conflictCount: 3,
    });
    expect(r.matrixLabel).toBe("Ingrédient(s) douteux");
    expect(r.matrixLevel).toBe("vigilance");
    expect(r.matrixPhrase).toContain("3");
  });

  it("score = 70 boundary → Ingrédient(s) douteux (not double vigilance)", () => {
    const r = build({
      madhabVerdicts: doubtfulSchools,
      ...certified("Edge", 70),
    });
    expect(r.matrixLabel).toBe("Ingrédient(s) douteux");
    expect(r.matrixLevel).toBe("vigilance");
  });

  it("score = 51 boundary → Double vigilance (not non recommandé)", () => {
    const r = build({
      madhabVerdicts: doubtfulSchools,
      ...certified("Edge", 51),
    });
    expect(r.matrixLabel).toBe("Double vigilance");
    expect(r.matrixLevel).toBe("low");
  });

  it("score = 50 boundary → Non recommandé", () => {
    const r = build({
      madhabVerdicts: doubtfulSchools,
      ...certified("Edge", 50),
    });
    expect(r.matrixLabel).toBe("Non recommandé");
    expect(r.matrixLevel).toBe("danger");
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. CERTIFIED + HARAM
// ═══════════════════════════════════════════════════════════════

describe("Certified + Haram", () => {
  const haramSchools = [
    { madhab: "hanafi", status: "haram" },
    { madhab: "shafii", status: "halal" },
    { madhab: "maliki", status: "halal" },
    { madhab: "hanbali", status: "halal" },
  ];

  it("any score → Ingrédient interdit (danger)", () => {
    const r = build({
      madhabVerdicts: haramSchools,
      ...certified("AVS", 95),
      conflictCount: 1,
    });
    expect(r.matrixLabel).toBe("Ingrédient interdit");
    expect(r.matrixLevel).toBe("danger");
    expect(r.matrixPhrase).toContain("1");
    expect(r.isDoubtful).toBe(true);
  });

  it("low score + haram → still Ingrédient interdit", () => {
    const r = build({
      madhabVerdicts: haramSchools,
      ...certified("Bad", 10),
      conflictCount: 3,
    });
    expect(r.matrixLabel).toBe("Ingrédient interdit");
    expect(r.matrixLevel).toBe("danger");
    expect(r.matrixPhrase).toContain("3");
  });

  it("all 4 schools haram → Ingrédient interdit", () => {
    const r = build({
      madhabVerdicts: make4Schools("haram"),
      ...certified("Top", 98),
      conflictCount: 5,
    });
    expect(r.matrixLabel).toBe("Ingrédient interdit");
    expect(r.matrixLevel).toBe("danger");
  });

  it("haram takes precedence over doubtful", () => {
    const mixed = [
      { madhab: "hanafi", status: "haram" },
      { madhab: "shafii", status: "doubtful" },
      { madhab: "maliki", status: "halal" },
      { madhab: "hanbali", status: "doubtful" },
    ];
    const r = build({
      madhabVerdicts: mixed,
      ...certified("C", 80),
    });
    expect(r.matrixLabel).toBe("Ingrédient interdit");
    expect(r.matrixLevel).toBe("danger");
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. NOT CERTIFIED
// ═══════════════════════════════════════════════════════════════

describe("Not Certified", () => {
  it("clean composition → Composition conforme (good)", () => {
    const r = build({ madhabVerdicts: make4Schools("halal") });
    expect(r.matrixLabel).toBe("Composition conforme");
    expect(r.matrixLevel).toBe("good");
    expect(r.isDoubtful).toBe(false);
  });

  it("doubtful composition → Ingrédient(s) douteux (vigilance)", () => {
    const r = build({
      madhabVerdicts: [
        { madhab: "hanafi", status: "halal" },
        { madhab: "shafii", status: "doubtful" },
        { madhab: "maliki", status: "halal" },
        { madhab: "hanbali", status: "halal" },
      ],
    });
    expect(r.matrixLabel).toBe("Ingrédient(s) douteux");
    expect(r.matrixLevel).toBe("vigilance");
    expect(r.isDoubtful).toBe(true);
  });

  it("haram composition → Interdit (danger)", () => {
    const r = build({
      madhabVerdicts: [
        { madhab: "hanafi", status: "haram" },
        { madhab: "shafii", status: "halal" },
        { madhab: "maliki", status: "halal" },
        { madhab: "hanbali", status: "halal" },
      ],
    });
    expect(r.matrixLabel).toBe("Interdit");
    expect(r.matrixLevel).toBe("danger");
  });

  it("all 4 unknown → treated as clean (Composition conforme)", () => {
    const r = build({ madhabVerdicts: make4Schools("unknown") });
    expect(r.matrixLabel).toBe("Composition conforme");
    expect(r.matrixLevel).toBe("good");
  });

  it("certifier name without score → treated as not certified for matrix", () => {
    const r = build({
      madhabVerdicts: make4Schools("halal"),
      certifierName: "SomeOrg",
      certifierScore: null,
      certifierGrade: null,
    });
    expect(r.matrixLabel).toBe("Composition conforme");
    expect(r.matrixLevel).toBe("good");
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. LEGACY FIELDS (backward compat)
// ═══════════════════════════════════════════════════════════════

describe("Legacy fields preserved", () => {
  it("fiqhLine set for consensus halal", () => {
    const r = build({ madhabVerdicts: make4Schools("halal") });
    expect(r.fiqhLine).toBe("fiqh4Halal");
    expect(r.shortFiqhLine).toBe("short4Halal");
    expect(r.isConsensus).toBe(true);
    expect(r.dominantStatus).toBe("halal");
  });

  it("fiqhLine set for consensus haram", () => {
    const r = build({ madhabVerdicts: make4Schools("haram") });
    expect(r.fiqhLine).toBe("fiqh4Haram");
  });

  it("fiqhLine set for consensus doubtful", () => {
    const r = build({ madhabVerdicts: make4Schools("doubtful") });
    expect(r.fiqhLine).toBe("fiqh4Doubtful");
  });

  it("fiqhLine set for 3/4 majority", () => {
    const r = build({
      madhabVerdicts: [
        { madhab: "hanafi", status: "halal" },
        { madhab: "shafii", status: "halal" },
        { madhab: "maliki", status: "halal" },
        { madhab: "hanbali", status: "doubtful" },
      ],
    });
    expect(r.fiqhLine).toContain("3 sur 4");
    expect(r.fiqhLine).toContain("Hanbali");
    expect(r.isConsensus).toBe(false);
  });

  it("certifierLine positive framing when score >= 60", () => {
    const r = build({
      ...certified("AVS", 80, "Fiable"),
    });
    expect(r.certifierLine).toContain("aussi");
    expect(r.certifierLine).toContain("AVS");
    expect(r.certifierLine).toContain("80/100");
  });

  it("certifierLine cautionary framing when score < 60", () => {
    const r = build({
      ...certified("Bad", 30, "Peu fiable"),
    });
    expect(r.certifierLine).toContain("toutefois");
  });

  it("theoreticalNote present when certifier exists", () => {
    const r = build({ ...certified("AVS", 80) });
    expect(r.theoreticalNote).toBe("theoreticalNote");
  });

  it("theoreticalNote null when no certifier", () => {
    const r = build({});
    expect(r.theoreticalNote).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. CONFLICT COUNT INTERPOLATION
// ═══════════════════════════════════════════════════════════════

describe("Conflict count interpolation", () => {
  it("conflictCount > 0 inserted into phrase", () => {
    const r = build({
      madhabVerdicts: make4Schools("haram"),
      ...certified("X", 90),
      conflictCount: 3,
    });
    expect(r.matrixPhrase).toContain("3");
  });

  it("conflictCount = 0 defaults to 1 in phrase", () => {
    const r = build({
      madhabVerdicts: make4Schools("haram"),
      ...certified("X", 90),
      conflictCount: 0,
    });
    expect(r.matrixPhrase).toContain("1");
  });

  it("conflictCount omitted defaults to 1", () => {
    const r = build({
      madhabVerdicts: make4Schools("haram"),
      ...certified("X", 90),
    });
    expect(r.matrixPhrase).toContain("1");
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. EXHAUSTIVE THRESHOLD BOUNDARIES
// ═══════════════════════════════════════════════════════════════

describe("NaqiyScore threshold boundaries (certified + clean)", () => {
  const thresholds: Array<[number, string, MatrixLevel]> = [
    [100, "Confiance élevée", "high"],
    [90, "Confiance élevée", "high"],
    [89, "Confiance correcte", "good"],
    [70, "Confiance correcte", "good"],
    [69, "Vigilance", "vigilance"],
    [51, "Vigilance", "vigilance"],
    [50, "Peu fiable", "low"],
    [35, "Peu fiable", "low"],
    [34, "Pas fiable du tout", "danger"],
    [1, "Pas fiable du tout", "danger"],
    [0, "Pas fiable du tout", "danger"],
  ];

  it.each(thresholds)(
    "score %i → %s (%s)",
    (score, expectedLabel, expectedLevel) => {
      const r = build({ ...certified("Cert", score) });
      expect(r.matrixLabel).toBe(expectedLabel);
      expect(r.matrixLevel).toBe(expectedLevel);
    },
  );
});

describe("NaqiyScore threshold boundaries (certified + doubtful)", () => {
  const doubtfulVerdicts = [
    { madhab: "hanafi", status: "halal" },
    { madhab: "shafii", status: "doubtful" },
    { madhab: "maliki", status: "halal" },
    { madhab: "hanbali", status: "halal" },
  ];

  const thresholds: Array<[number, string, MatrixLevel]> = [
    [100, "Ingrédient(s) douteux", "vigilance"],
    [70, "Ingrédient(s) douteux", "vigilance"],
    [69, "Double vigilance", "low"],
    [51, "Double vigilance", "low"],
    [50, "Non recommandé", "danger"],
    [0, "Non recommandé", "danger"],
  ];

  it.each(thresholds)(
    "score %i → %s (%s)",
    (score, expectedLabel, expectedLevel) => {
      const r = build({
        madhabVerdicts: doubtfulVerdicts,
        ...certified("C", score),
      });
      expect(r.matrixLabel).toBe(expectedLabel);
      expect(r.matrixLevel).toBe(expectedLevel);
    },
  );
});

// ═══════════════════════════════════════════════════════════════
// 8. isDoubtful FLAG CORRECTNESS
// ═══════════════════════════════════════════════════════════════

describe("isDoubtful flag", () => {
  it("false for certified clean + high score", () => {
    expect(build({ ...certified("A", 95) }).isDoubtful).toBe(false);
  });

  it("false for certified clean + good score", () => {
    expect(build({ ...certified("A", 75) }).isDoubtful).toBe(false);
  });

  it("true for certified clean + vigilance score", () => {
    expect(build({ ...certified("A", 55) }).isDoubtful).toBe(true);
  });

  it("true for certified clean + low score", () => {
    expect(build({ ...certified("A", 40) }).isDoubtful).toBe(true);
  });

  it("true for certified clean + danger score", () => {
    expect(build({ ...certified("A", 10) }).isDoubtful).toBe(true);
  });

  it("true for any certified + doubtful", () => {
    const d = [
      { madhab: "hanafi", status: "halal" },
      { madhab: "shafii", status: "doubtful" },
      { madhab: "maliki", status: "halal" },
      { madhab: "hanbali", status: "halal" },
    ];
    expect(build({ madhabVerdicts: d, ...certified("A", 95) }).isDoubtful).toBe(true);
  });

  it("true for any certified + haram", () => {
    const h = [
      { madhab: "hanafi", status: "haram" },
      { madhab: "shafii", status: "halal" },
      { madhab: "maliki", status: "halal" },
      { madhab: "hanbali", status: "halal" },
    ];
    expect(build({ madhabVerdicts: h, ...certified("A", 95) }).isDoubtful).toBe(true);
  });

  it("false for not certified + clean", () => {
    expect(build({}).isDoubtful).toBe(false);
  });

  it("true for not certified + doubtful", () => {
    const d = [
      { madhab: "hanafi", status: "doubtful" },
      { madhab: "shafii", status: "halal" },
      { madhab: "maliki", status: "halal" },
      { madhab: "hanbali", status: "halal" },
    ];
    expect(build({ madhabVerdicts: d }).isDoubtful).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 9. compositionStatus EXPOSED IN RESULT
// ═══════════════════════════════════════════════════════════════

describe("compositionStatus in result", () => {
  it("halal when all schools halal", () => {
    expect(build({}).compositionStatus).toBe("halal");
  });

  it("doubtful when any school doubtful", () => {
    const d = [
      { madhab: "hanafi", status: "halal" },
      { madhab: "shafii", status: "doubtful" },
      { madhab: "maliki", status: "halal" },
      { madhab: "hanbali", status: "halal" },
    ];
    expect(build({ madhabVerdicts: d }).compositionStatus).toBe("doubtful");
  });

  it("haram when any school haram (even with doubtful)", () => {
    const h = [
      { madhab: "hanafi", status: "haram" },
      { madhab: "shafii", status: "doubtful" },
      { madhab: "maliki", status: "halal" },
      { madhab: "hanbali", status: "halal" },
    ];
    expect(build({ madhabVerdicts: h }).compositionStatus).toBe("haram");
  });
});

// ═══════════════════════════════════════════════════════════════
// 10. selectAdviceTexts — MULTI-TEXT CONTEXTUAL SELECTION
// ═══════════════════════════════════════════════════════════════

describe("selectAdviceTexts", () => {
  // ── Haram → [C, D] ──
  describe("haram composition", () => {
    const levels: MatrixLevel[] = ["high", "good", "vigilance", "low", "danger"];
    it.each(levels)("matrixLevel=%s → [C, D]", (level) => {
      expect(selectAdviceTexts(level, "haram")).toEqual(["C", "D"]);
    });
  });

  // ── Doubtful → [C, B, A, D] ──
  describe("doubtful composition", () => {
    const levels: MatrixLevel[] = ["high", "good", "vigilance", "low", "danger"];
    it.each(levels)("matrixLevel=%s → [C, B, A, D]", (level) => {
      expect(selectAdviceTexts(level, "doubtful")).toEqual(["C", "B", "A", "D"]);
    });
  });

  // ── Halal → [C, B, A, D] ──
  describe("halal composition", () => {
    const levels: MatrixLevel[] = ["high", "good", "vigilance", "low", "danger"];
    it.each(levels)("matrixLevel=%s → [C, B, A, D]", (level) => {
      expect(selectAdviceTexts(level, "halal")).toEqual(["C", "B", "A", "D"]);
    });
  });

  // ── Every combination returns only valid IDs ──
  describe("exhaustive coverage", () => {
    const allLevels: MatrixLevel[] = ["high", "good", "vigilance", "low", "danger"];
    const allStatuses: CompositionStatus[] = ["halal", "doubtful", "haram"];
    const validIds: AdviceTextId[] = ["A", "B", "C", "D"];

    for (const level of allLevels) {
      for (const status of allStatuses) {
        it(`(${level}, ${status}) → all IDs valid`, () => {
          const result = selectAdviceTexts(level, status);
          expect(result.length).toBeGreaterThan(0);
          for (const id of result) {
            expect(validIds).toContain(id);
          }
        });
      }
    }
  });

  // ── isDoubtful for not-certified + haram ──
  it("not-certified + haram → isDoubtful=true", () => {
    const r = build({ madhabVerdicts: make4Schools("haram") });
    expect(r.isDoubtful).toBe(true);
  });
});
