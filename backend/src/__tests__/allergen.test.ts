import { describe, it, expect } from "vitest";
import { matchAllergens } from "../services/allergen.service.js";

describe("allergen service", () => {
  describe("matchAllergens", () => {
    it("matches direct allergens (high severity)", () => {
      const matches = matchAllergens(
        ["lactose", "arachides"],
        ["en:milk", "en:peanuts"],
        []
      );
      expect(matches).toHaveLength(2);
      expect(matches[0]).toEqual({
        userAllergen: "lactose",
        offTag: "en:milk",
        matchType: "allergen",
        severity: "high",
      });
      expect(matches[1]).toEqual({
        userAllergen: "arachides",
        offTag: "en:peanuts",
        matchType: "allergen",
        severity: "high",
      });
    });

    it("matches traces (medium severity)", () => {
      const matches = matchAllergens(["gluten"], [], ["en:gluten"]);
      expect(matches).toHaveLength(1);
      expect(matches[0].matchType).toBe("trace");
      expect(matches[0].severity).toBe("medium");
    });

    it("matches both allergens and traces for same user allergen", () => {
      const matches = matchAllergens(
        ["soja"],
        ["en:soybeans"],
        ["en:soybeans"]
      );
      expect(matches).toHaveLength(2);
      expect(matches[0].matchType).toBe("allergen");
      expect(matches[1].matchType).toBe("trace");
    });

    it("returns empty for no matches", () => {
      const matches = matchAllergens(
        ["sésame"],
        ["en:milk", "en:peanuts"],
        ["en:gluten"]
      );
      expect(matches).toHaveLength(0);
    });

    it("handles unknown user allergens gracefully", () => {
      const matches = matchAllergens(
        ["kryptonite"],
        ["en:milk"],
        []
      );
      expect(matches).toHaveLength(0);
    });

    it("handles empty inputs", () => {
      expect(matchAllergens([], [], [])).toHaveLength(0);
      expect(matchAllergens(["lactose"], [], [])).toHaveLength(0);
      expect(matchAllergens([], ["en:milk"], [])).toHaveLength(0);
    });

    it("normalizes case for FR allergen names", () => {
      const matches = matchAllergens(
        ["Lait", "ARACHIDES"],
        ["en:milk", "en:peanuts"],
        []
      );
      // "Lait" → lowercased → "lait" → "en:milk"
      // "ARACHIDES" → lowercased → "arachides" → "en:peanuts"
      expect(matches).toHaveLength(2);
    });

    it("maps French allergen synonyms correctly", () => {
      // "cacahuètes" is a synonym for "arachides"
      const matches = matchAllergens(
        ["cacahuètes", "blé", "oeufs", "crustacés"],
        ["en:peanuts", "en:gluten", "en:eggs", "en:crustaceans"],
        []
      );
      expect(matches).toHaveLength(4);
    });

    it("maps English allergen names correctly", () => {
      const matches = matchAllergens(
        ["milk", "peanuts", "eggs"],
        ["en:milk", "en:peanuts", "en:eggs"],
        []
      );
      expect(matches).toHaveLength(3);
    });
  });
});
