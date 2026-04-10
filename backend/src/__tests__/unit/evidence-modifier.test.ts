import { describe, it, expect } from "vitest";
import { applyEvidenceModifier } from "../../domain/engine/evidence-modifier.js";

describe("applyEvidenceModifier", () => {
  // ── Evidence level penalties ─────────────────────────────────

  it("third_party_audit → no penalty", () => {
    expect(applyEvidenceModifier(98, "third_party_audit", [], null)).toBe(98);
  });

  it("fulltime_muslim_inspector → -2", () => {
    expect(applyEvidenceModifier(98, "fulltime_muslim_inspector", [], null)).toBe(96);
  });

  it("audit_report_self → -5", () => {
    expect(applyEvidenceModifier(80, "audit_report_self", [], null)).toBe(75);
  });

  it("protocol_published → -8", () => {
    expect(applyEvidenceModifier(80, "protocol_published", [], null)).toBe(72);
  });

  it("declaration → -12", () => {
    expect(applyEvidenceModifier(45, "declaration", [], null)).toBe(33);
  });

  it("none → floor to 10", () => {
    expect(applyEvidenceModifier(45, "none", [], null)).toBe(10);
  });

  it("none with high base → still floors to 10", () => {
    expect(applyEvidenceModifier(98, "none", [], null)).toBe(10);
  });

  // ── Required evidence missing penalties (cumulative) ────────

  it("missing mortality_rate_published → additional -10", () => {
    // base 72, evidence level third_party_audit (0), missing mortality = -10
    expect(
      applyEvidenceModifier(72, "third_party_audit", ["mortality_rate_published"], null),
    ).toBe(62);
  });

  it("missing wake_tests_performed → additional -8", () => {
    expect(
      applyEvidenceModifier(72, "third_party_audit", ["wake_tests_performed"], null),
    ).toBe(64);
  });

  it("missing both mortality + wake tests → cumulative -18", () => {
    expect(
      applyEvidenceModifier(72, "third_party_audit", ["mortality_rate_published", "wake_tests_performed"], null),
    ).toBe(54);
  });

  it("declaration + missing mortality + missing wake tests → -12 -10 -8 = -30", () => {
    // base 45 - 12 - 10 - 8 = 15
    expect(
      applyEvidenceModifier(
        45,
        "declaration",
        ["mortality_rate_published", "wake_tests_performed"],
        null,
      ),
    ).toBe(15);
  });

  // ── Evidence satisfied via evidenceDetails ───────────────────

  it("mortality required but present in evidenceDetails → no penalty", () => {
    expect(
      applyEvidenceModifier(
        72,
        "third_party_audit",
        ["mortality_rate_published"],
        { mortality_rate_published: true },
      ),
    ).toBe(72);
  });

  it("wake_tests required and present → no penalty", () => {
    expect(
      applyEvidenceModifier(
        72,
        "third_party_audit",
        ["wake_tests_performed"],
        { wake_tests_performed: true },
      ),
    ).toBe(72);
  });

  it("mortality present but wake_tests missing → only wake penalty", () => {
    expect(
      applyEvidenceModifier(
        72,
        "third_party_audit",
        ["mortality_rate_published", "wake_tests_performed"],
        { mortality_rate_published: true },
      ),
    ).toBe(64);
  });

  // ── Clamping ────────────────────────────────────────────────

  it("clamps to 0 when penalties exceed base", () => {
    // base 5, declaration -12 → would be -7, clamp to 0
    expect(applyEvidenceModifier(5, "declaration", [], null)).toBe(0);
  });

  it("cumulative penalties clamp to 0", () => {
    // base 10, fulltime_muslim -2 = 8, mortality -10 = -2 → clamp 0
    expect(
      applyEvidenceModifier(
        10,
        "fulltime_muslim_inspector",
        ["mortality_rate_published"],
        null,
      ),
    ).toBe(0);
  });

  // ── Edge cases ──────────────────────────────────────────────

  it("base 0 stays 0 regardless of evidence", () => {
    expect(applyEvidenceModifier(0, "third_party_audit", [], null)).toBe(0);
  });

  it("unknown evidence level treated same as none → floor to 10", () => {
    expect(applyEvidenceModifier(80, "unknown_level" as string, [], null)).toBe(10);
  });

  it("empty required evidence + good evidence level → no penalty", () => {
    expect(applyEvidenceModifier(98, "third_party_audit", [], {})).toBe(98);
  });

  it("fulltime_muslim_inspector evidence is not considered for required evidence satisfaction", () => {
    // Even though evidence_level is fulltime_muslim_inspector,
    // if fulltime_muslim_inspector is in required_evidence, it must be in evidenceDetails
    expect(
      applyEvidenceModifier(
        90,
        "fulltime_muslim_inspector",
        ["fulltime_muslim_inspector"],
        null,
      ),
    ).toBe(88); // -2 for evidence level only, no extra penalty for required (fulltime_muslim_inspector not in required evidence penalty map)
  });
});
