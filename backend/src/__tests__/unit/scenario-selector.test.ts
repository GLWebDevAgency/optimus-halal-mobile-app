import { describe, it, expect } from "vitest";
import { selectScenario } from "../../domain/engine/scenario-selector.js";
import type { SubstanceScenarioView } from "../../domain/ports/scenario-repo.js";

const SHELLAC_SCENARIOS: SubstanceScenarioView[] = [
  {
    substanceId: "SHELLAC", scenarioKey: "mui_certified_tablet",
    matchConditions: { category: ["tablet_pharma"], certified_halal: true },
    specificity: 2, score: 85, verdict: "halal",
    rationaleFr: "Certifié MUI", rationaleEn: null, rationaleAr: null, dossierSectionRef: null,
  },
  {
    substanceId: "SHELLAC", scenarioKey: "uncertified_candy",
    matchConditions: { category: ["candy", "chocolate"] },
    specificity: 1, score: 35, verdict: "mashbooh",
    rationaleFr: "Bonbon non certifié", rationaleEn: null, rationaleAr: null, dossierSectionRef: null,
  },
  {
    substanceId: "SHELLAC", scenarioKey: "cosmetic_external",
    matchConditions: { usage: "topical" },
    specificity: 1, score: 70, verdict: "halal",
    rationaleFr: "Usage externe", rationaleEn: null, rationaleAr: null, dossierSectionRef: null,
  },
];

const DEFAULT_POSITION = { globalScore: 45, verdict: "mashbooh" };

describe("scenario-selector", () => {
  it("selects most specific matching scenario", () => {
    const selected = selectScenario(SHELLAC_SCENARIOS, { category: "candy", usage: "ingestion" }, DEFAULT_POSITION);
    expect(selected.scenarioKey).toBe("uncertified_candy");
    expect(selected.score).toBe(35);
  });

  it("falls back to naqiy_position when no scenario matches", () => {
    const selected = selectScenario(SHELLAC_SCENARIOS, { category: "sauce", usage: "ingestion" }, DEFAULT_POSITION);
    expect(selected.scenarioKey).toBe("__default__");
    expect(selected.score).toBe(45);
  });

  it("prefers higher specificity when multiple match", () => {
    const selected = selectScenario(SHELLAC_SCENARIOS, { category: "tablet_pharma", usage: "ingestion", certified_halal: true }, DEFAULT_POSITION);
    expect(selected.scenarioKey).toBe("mui_certified_tablet");
    expect(selected.score).toBe(85);
  });

  it("matches usage-based scenarios", () => {
    const selected = selectScenario(SHELLAC_SCENARIOS, { category: "cosmetic_topical", usage: "topical" }, DEFAULT_POSITION);
    expect(selected.scenarioKey).toBe("cosmetic_external");
  });
});
