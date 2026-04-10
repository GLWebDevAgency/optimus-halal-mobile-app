import { describe, it, expect } from "vitest";
import path from "node:path";
import {
  parseSubstanceDossier,
  extractMatchPatterns,
  extractScenarios,
  extractMadhabRulings,
  parsePracticeTuples,
  type ParsedSubstance,
} from "../../db/seeds/compile-dossiers.js";

const DOSSIERS_ROOT = path.resolve(
  __dirname, "..", "..", "..", "..",
  "docs", "naqiy", "dossiers-recherches-naqiy", "dossiers_v2",
);

describe("compile-dossiers", () => {
  describe("parseSubstanceDossier", () => {
    it("parses SHELLAC dossier into substance + dossier records", () => {
      const filePath = path.join(DOSSIERS_ROOT, "json", "naqiy_dossier_SHELLAC_v2.json");
      const result = parseSubstanceDossier(filePath);
      expect(result).not.toBeNull();
      expect(result!.substance.id).toBe("SHELLAC");
      expect(result!.substance.tier).toBeGreaterThanOrEqual(1);
      expect(result!.substance.tier).toBeLessThanOrEqual(4);
      expect(result!.dossier.contentHash).toHaveLength(64);
      expect(result!.dossier.schemaVersion).toBe("substance-dossier.v1");
    });
  });

  describe("extractMatchPatterns", () => {
    it("extracts patterns from SHELLAC match_vocabulary", () => {
      const filePath = path.join(DOSSIERS_ROOT, "json", "naqiy_dossier_SHELLAC_v2.json");
      const parsed = parseSubstanceDossier(filePath)!;
      const patterns = extractMatchPatterns(parsed);
      expect(patterns.length).toBeGreaterThan(5); // at least canonical + synonyms + e_numbers + off_tags
      expect(patterns.some(p => p.patternType === "e_number" && p.patternValue === "E904")).toBe(true);
      expect(patterns.some(p => p.patternType === "keyword_fr" && p.patternValue.includes("gomme"))).toBe(true);
      expect(patterns.some(p => p.patternType === "off_tag" && p.patternValue === "en:e904")).toBe(true);
    });
  });

  describe("extractScenarios", () => {
    it("extracts score_matrix scenarios from SHELLAC", () => {
      const filePath = path.join(DOSSIERS_ROOT, "json", "naqiy_dossier_SHELLAC_v2.json");
      const parsed = parseSubstanceDossier(filePath)!;
      const scenarios = extractScenarios(parsed);
      expect(scenarios.length).toBeGreaterThanOrEqual(1);
      for (const s of scenarios) {
        expect(s.score).toBeGreaterThanOrEqual(0);
        expect(s.score).toBeLessThanOrEqual(100);
        expect(s.substanceId).toBe("SHELLAC");
      }
    });
  });

  describe("extractMadhabRulings", () => {
    it("extracts 4 madhab rulings from SHELLAC", () => {
      const filePath = path.join(DOSSIERS_ROOT, "json", "naqiy_dossier_SHELLAC_v2.json");
      const parsed = parseSubstanceDossier(filePath)!;
      const rulings = extractMadhabRulings(parsed);
      expect(rulings).toHaveLength(4);
      expect(rulings.map(r => r.madhab).sort()).toEqual(["hanafi", "hanbali", "maliki", "shafii"]);
    });
  });

  describe("parsePracticeTuples", () => {
    it("parses 15 stunning tuples from the tuples file", () => {
      const filePath = path.join(
        DOSSIERS_ROOT, "practices", "stunning", "tuples", "tuples_stunning.json",
      );
      const tuples = parsePracticeTuples(filePath);
      expect(tuples).toHaveLength(15);
      for (const t of tuples) {
        expect(t.slug).toMatch(/^[A-Z][A-Z0-9_]+$/);
        expect(t.verdictHanafi).toBeGreaterThanOrEqual(0);
        expect(t.verdictHanafi).toBeLessThanOrEqual(100);
        expect(t.dossierSectionRef.length).toBeGreaterThan(5);
      }
    });
  });
});
