import { describe, it, expect } from "vitest";
import {
  evaluatePersonalAlerts,
  type AllergenMatch,
  type RiskyAdditive,
} from "../../services/personal-engine.js";

// ── Test data ────────────────────────────────────────────────

const milkAllergenMatch: AllergenMatch = {
  displayName: "Lait",
  matchType: "direct",
  severity: "high",
};

const traceAllergenMatch: AllergenMatch = {
  displayName: "Noisettes",
  matchType: "trace",
  severity: "medium",
};

const riskyPregnant: RiskyAdditive = {
  code: "E951",
  nameFr: "Aspartame",
  riskPregnant: true,
  riskChildren: false,
  healthEffectsFr: "L'aspartame est déconseillé pendant la grossesse.",
};

const riskyChildren: RiskyAdditive = {
  code: "E102",
  nameFr: "Tartrazine",
  riskPregnant: false,
  riskChildren: true,
  healthEffectsFr: null,
};

const riskyBoth: RiskyAdditive = {
  code: "E110",
  nameFr: "Jaune orangé S",
  riskPregnant: true,
  riskChildren: true,
  healthEffectsFr: "Colorant azoïque déconseillé aux enfants et femmes enceintes.",
};

// ── Tests ────────────────────────────────────────────────────

describe("PersonalEngine — evaluatePersonalAlerts", () => {
  it("returns allergen alert when user has matching allergen", () => {
    const report = evaluatePersonalAlerts(
      [milkAllergenMatch],
      ["milk"],
      false,
      false,
      [],
      true,
    );

    expect(report.alerts).toHaveLength(1);
    expect(report.alerts[0].type).toBe("allergen");
    expect(report.alerts[0].severity).toBe("high");
    expect(report.alerts[0].title).toContain("Lait");
    expect(report.upsellHint).toBeNull();
  });

  it("returns trace allergen alert", () => {
    const report = evaluatePersonalAlerts(
      [traceAllergenMatch],
      ["nuts"],
      false,
      false,
      [],
      true,
    );

    expect(report.alerts).toHaveLength(1);
    expect(report.alerts[0].title).toContain("Traces possibles");
    expect(report.alerts[0].description).toContain("traces");
  });

  it("returns pregnancy alert for risky additive", () => {
    const report = evaluatePersonalAlerts(
      [],
      null,
      true,
      false,
      [riskyPregnant],
      true,
    );

    expect(report.alerts).toHaveLength(1);
    expect(report.alerts[0].type).toBe("health");
    expect(report.alerts[0].severity).toBe("high");
    expect(report.alerts[0].title).toContain("grossesse");
    expect(report.alerts[0].description).toContain("aspartame");
  });

  it("returns children alert for risky additive", () => {
    const report = evaluatePersonalAlerts(
      [],
      null,
      false,
      true,
      [riskyChildren],
      true,
    );

    expect(report.alerts).toHaveLength(1);
    expect(report.alerts[0].type).toBe("health");
    expect(report.alerts[0].severity).toBe("medium");
    expect(report.alerts[0].title).toContain("enfants");
    // Falls back to generated description since healthEffectsFr is null
    expect(report.alerts[0].description).toContain("Tartrazine");
  });

  it("returns both pregnancy and children alerts for dual-risk additive", () => {
    const report = evaluatePersonalAlerts(
      [],
      null,
      true,
      true,
      [riskyBoth],
      true,
    );

    expect(report.alerts).toHaveLength(2);
    expect(report.alerts[0].severity).toBe("high"); // pregnancy
    expect(report.alerts[1].severity).toBe("medium"); // children
  });

  it("returns empty alerts + upsellHint when canAllergenProfile is false (free user)", () => {
    const report = evaluatePersonalAlerts(
      [milkAllergenMatch],
      ["milk"],
      true,
      true,
      [riskyBoth],
      false, // free user
    );

    expect(report.alerts).toHaveLength(0);
    expect(report.upsellHint).toBe("allergens_profile");
  });

  it("returns no alerts when user has no allergens and no risk flags", () => {
    const report = evaluatePersonalAlerts(
      [],
      null,
      false,
      false,
      [],
      true,
    );

    expect(report.alerts).toHaveLength(0);
    expect(report.upsellHint).toBeNull();
  });

  it("combines allergen + health alerts in one report", () => {
    const report = evaluatePersonalAlerts(
      [milkAllergenMatch, traceAllergenMatch],
      ["milk", "nuts"],
      true,
      false,
      [riskyPregnant],
      true,
    );

    expect(report.alerts).toHaveLength(3);
    const types = report.alerts.map((a) => a.type);
    expect(types).toContain("allergen");
    expect(types).toContain("health");
  });
});
