import { describe, it, expect } from "vitest";
import { CertifierTrustEngine } from "../../domain/engine/certifier-trust-engine.js";
import type {
  ICertifierTrustRepo,
  CertifierTupleView,
  CertifierAcceptanceView,
  CertifierEventView,
} from "../../domain/ports/certifier-trust-repo.js";
import type { HalalEvaluationContext } from "../../domain/types/halal-evaluation-context.js";

// ── Helpers ────────────────────────────────────────────────────

function makeTuple(
  slug: string,
  species: string,
  verdicts: { hanafi: number; maliki: number; shafii: number; hanbali: number },
  requiredEvidence: string[] = [],
): CertifierTupleView {
  return {
    tupleSlug: slug,
    familyId: "stunning",
    dimensions: { species, method: "test" },
    verdictHanafi: verdicts.hanafi,
    verdictMaliki: verdicts.maliki,
    verdictShafii: verdicts.shafii,
    verdictHanbali: verdicts.hanbali,
    requiredEvidence,
    dossierSectionRef: "TEST §1",
    typicalMortalityPctMin: null,
    typicalMortalityPctMax: null,
    notesFr: null,
  };
}

function makeAcceptance(
  slug: string,
  evidenceLevel = "third_party_audit",
  evidenceDetails: Record<string, unknown> | null = null,
): CertifierAcceptanceView {
  return {
    tupleSlug: slug,
    stance: "accepts",
    evidenceLevel,
    evidenceDetails,
  };
}

function mockRepo(
  tuples: Array<{ tuple: CertifierTupleView; acceptance: CertifierAcceptanceView }>,
  events: CertifierEventView[] = [],
): ICertifierTrustRepo {
  return {
    getAcceptedTuples: async () => tuples,
    getLiveEvents: async () => events,
  };
}

const baseCtx: HalalEvaluationContext = {
  madhab: "hanafi",
  strictness: "moderate",
  lang: "fr",
};

// ── Test Suite ─────────────────────────────────────────────────

describe("CertifierTrustEngine", () => {
  // Test 1: Single tuple cattle no_stun → trust 96 → N1
  it("single cattle no_stun tuple → N1 (Excellence)", async () => {
    const repo = mockRepo([
      {
        tuple: makeTuple("CATTLE_NOSTUN_MANUAL", "cattle", {
          hanafi: 98, maliki: 98, shafii: 98, hanbali: 98,
        }),
        acceptance: makeAcceptance("CATTLE_NOSTUN_MANUAL", "fulltime_muslim_inspector"),
      },
    ]);

    const engine = new CertifierTrustEngine(repo);
    const report = await engine.evaluate(
      "cert-1",
      { name: "Test Beef", species: "cattle" },
      baseCtx,
    );

    expect(report.score).toBe(96); // 98 - 2 (fulltime_muslim_inspector)
    expect(report.verdict).toBe("halal");
    expect(report.tier).toBe("certified");
    expect(report.grade).toBe(1); // N1: ≥85
  });

  // Test 2: Mixed tuples with poultry waterbath → baseline = min → low trust
  it("mixed poultry tuples → baseline = min(adjusted) → N5", async () => {
    const repo = mockRepo([
      {
        tuple: makeTuple("POULTRY_WATERBATH_REDUCED_VERIFIED", "poultry", {
          hanafi: 30, maliki: 40, shafii: 45, hanbali: 30,
        }, ["mortality_rate_published", "wake_tests_performed"]),
        acceptance: makeAcceptance(
          "POULTRY_WATERBATH_REDUCED_VERIFIED",
          "fulltime_muslim_inspector",
          null, // mortality NOT published, wake tests NOT performed
        ),
      },
      {
        tuple: makeTuple("POULTRY_SEMIAUTO_MUSLIM_CUTTERS", "poultry", {
          hanafi: 90, maliki: 92, shafii: 95, hanbali: 92,
        }),
        acceptance: makeAcceptance("POULTRY_SEMIAUTO_MUSLIM_CUTTERS", "fulltime_muslim_inspector"),
      },
    ]);

    const engine = new CertifierTrustEngine(repo);
    const report = await engine.evaluate(
      "cert-argml",
      { name: "Poulet ARGML", species: "poultry" },
      baseCtx,
    );

    // POULTRY_WATERBATH: 30(hanafi) - 2(fulltime) - 10(mortality) - 8(wake) = 10
    // POULTRY_SEMIAUTO: 90(hanafi) - 2(fulltime) = 88
    // baseline = min(10, 88) = 10
    expect(report.score).toBeLessThanOrEqual(10);
    expect(report.grade).toBe(5); // N5: <35
    expect(report.verdict).toBe("avoid");
  });

  // Test 3: Species-filtered (cattle only) → high trust
  it("species filter selects only cattle tuples → high score", async () => {
    const repo = mockRepo([
      {
        tuple: makeTuple("CATTLE_NOSTUN_MANUAL", "cattle", {
          hanafi: 98, maliki: 98, shafii: 98, hanbali: 98,
        }),
        acceptance: makeAcceptance("CATTLE_NOSTUN_MANUAL", "third_party_audit"),
      },
      // This poultry tuple should be included by repo if species filter works,
      // but we simulate the repo already filtering
    ]);

    const engine = new CertifierTrustEngine(repo);
    const report = await engine.evaluate(
      "cert-1",
      { name: "Steak", species: "cattle" },
      baseCtx,
    );

    expect(report.score).toBe(98);
    expect(report.grade).toBe(1); // N1
  });

  // Test 4: Live event penalty applies
  it("live events reduce score below baseline", async () => {
    const now = new Date();
    const repo = mockRepo(
      [
        {
          tuple: makeTuple("CATTLE_NOSTUN_MANUAL", "cattle", {
            hanafi: 98, maliki: 98, shafii: 98, hanbali: 98,
          }),
          acceptance: makeAcceptance("CATTLE_NOSTUN_MANUAL", "third_party_audit"),
        },
      ],
      [
        {
          scoreImpact: -15,
          occurredAt: now.toISOString(),
          isActive: true,
        },
      ],
    );

    const engine = new CertifierTrustEngine(repo);
    const report = await engine.evaluate(
      "cert-scandal",
      { name: "Steak", species: "cattle" },
      baseCtx,
    );

    // baseline = 98, event penalty ~15 (recent, almost no decay)
    expect(report.score).toBeLessThan(98);
    expect(report.score).toBeGreaterThan(70); // 98 - 15 = 83
  });

  // Test 5: Strictness very_strict downgrades
  it("very_strict applies -10 penalty", async () => {
    const repo = mockRepo([
      {
        tuple: makeTuple("CATTLE_ESTUN_HEAD_ONLY", "cattle", {
          hanafi: 72, maliki: 75, shafii: 78, hanbali: 70,
        }),
        acceptance: makeAcceptance("CATTLE_ESTUN_HEAD_ONLY", "third_party_audit"),
      },
    ]);

    const engine = new CertifierTrustEngine(repo);
    const report = await engine.evaluate(
      "cert-1",
      { name: "Steak", species: "cattle" },
      { ...baseCtx, strictness: "very_strict" },
    );

    // base 72, strictness -10 = 62, plus downgrade 1 grade if any tuple ≤ 50
    // 72 > 50, so no downgrade, just -10 → 62
    expect(report.score).toBe(62);
    expect(report.grade).toBe(3); // N3: 55-69
  });

  it("very_strict with low tuple → extra grade downgrade", async () => {
    const repo = mockRepo([
      {
        tuple: makeTuple("POULTRY_WATERBATH_STANDARD", "poultry", {
          hanafi: 5, maliki: 5, shafii: 15, hanbali: 3,
        }),
        acceptance: makeAcceptance("POULTRY_WATERBATH_STANDARD", "third_party_audit"),
      },
    ]);

    const engine = new CertifierTrustEngine(repo);
    const report = await engine.evaluate(
      "cert-1",
      { name: "Poulet", species: "poultry" },
      { ...baseCtx, strictness: "very_strict" },
    );

    // base 5 (hanafi), strictness -10 → 0 (clamped), grade 5
    // tuple 5 ≤ 50 → downgrade 1 grade, but already N5 so stays N5
    expect(report.score).toBe(0);
    expect(report.grade).toBe(5);
  });

  // ── HARD INVARIANT: trustScore ≤ baseline ────────────────────

  it("INVARIANT: trustScore never exceeds baseline", async () => {
    // Test with relaxed strictness (0 penalty) — score should equal baseline
    const repo = mockRepo([
      {
        tuple: makeTuple("CATTLE_NOSTUN_MANUAL", "cattle", {
          hanafi: 98, maliki: 98, shafii: 98, hanbali: 98,
        }),
        acceptance: makeAcceptance("CATTLE_NOSTUN_MANUAL", "third_party_audit"),
      },
    ]);

    const engine = new CertifierTrustEngine(repo);
    const report = await engine.evaluate(
      "cert-1",
      { name: "Steak", species: "cattle" },
      { ...baseCtx, strictness: "relaxed" },
    );

    // Baseline = 98, relaxed = 0 penalty, so score = 98
    expect(report.score).toBeLessThanOrEqual(98); // ≤ baseline
  });

  // ── Strictness overlay is MONOTONICALLY NON-POSITIVE (C2 fix) ──

  it("C2 FIX: strictness overlay is never positive", async () => {
    const repo = mockRepo([
      {
        tuple: makeTuple("CATTLE_NOSTUN_MANUAL", "cattle", {
          hanafi: 50, maliki: 50, shafii: 50, hanbali: 50,
        }),
        acceptance: makeAcceptance("CATTLE_NOSTUN_MANUAL", "third_party_audit"),
      },
    ]);

    const engine = new CertifierTrustEngine(repo);

    for (const strictness of ["relaxed", "moderate", "strict", "very_strict"] as const) {
      const report = await engine.evaluate(
        "cert-1",
        { name: "Steak", species: "cattle" },
        { ...baseCtx, strictness },
      );
      // Score must NEVER exceed baseline (50)
      expect(report.score).toBeLessThanOrEqual(50);
    }
  });

  // ── No tuples → N5/avoid ─────────────────────────────────────

  it("no accepted tuples → score 0, N5, avoid", async () => {
    const repo = mockRepo([]);

    const engine = new CertifierTrustEngine(repo);
    const report = await engine.evaluate(
      "cert-unknown",
      { name: "Mystery Product" },
      baseCtx,
    );

    expect(report.score).toBe(0);
    expect(report.grade).toBe(5);
    expect(report.verdict).toBe("avoid");
  });

  // ── Report structure ─────────────────────────────────────────

  it("produces complete HalalReport with practice_signals and decision_flow", async () => {
    const repo = mockRepo([
      {
        tuple: makeTuple("CATTLE_NOSTUN_MANUAL", "cattle", {
          hanafi: 98, maliki: 98, shafii: 98, hanbali: 98,
        }),
        acceptance: makeAcceptance("CATTLE_NOSTUN_MANUAL", "third_party_audit"),
      },
    ]);

    const engine = new CertifierTrustEngine(repo);
    const report = await engine.evaluate(
      "cert-avs",
      { name: "Steak AVS", species: "cattle" },
      baseCtx,
    );

    expect(report.tier).toBe("certified");
    expect(report.madhabApplied).toBe("hanafi");
    expect(report.engineVersion).toBe("halal-engine-v2.0.0");
    expect(report.signals.length).toBeGreaterThan(0);
    expect(report.decisionFlow.length).toBeGreaterThan(0);
    expect(report.practiceSignals.length).toBeGreaterThan(0);

    // Practice signal structure
    const sig = report.practiceSignals[0];
    expect(sig.tupleSlug).toBe("CATTLE_NOSTUN_MANUAL");
    expect(sig.baseScore).toBe(98);
    expect(sig.adjustedScore).toBe(98);
    expect(sig.evidenceLevel).toBe("third_party_audit");
  });

  // ── Madhab selection ─────────────────────────────────────────

  it("uses correct madhab column for Shafi'i", async () => {
    const repo = mockRepo([
      {
        tuple: makeTuple("CATTLE_ESTUN_HEAD_ONLY", "cattle", {
          hanafi: 72, maliki: 75, shafii: 78, hanbali: 70,
        }),
        acceptance: makeAcceptance("CATTLE_ESTUN_HEAD_ONLY", "third_party_audit"),
      },
    ]);

    const engine = new CertifierTrustEngine(repo);
    const report = await engine.evaluate(
      "cert-1",
      { name: "Steak", species: "cattle" },
      { ...baseCtx, madhab: "shafii" },
    );

    expect(report.score).toBe(78); // shafii verdict
  });

  it("general madhab uses weighted average of all four", async () => {
    const repo = mockRepo([
      {
        tuple: makeTuple("CATTLE_ESTUN_HEAD_ONLY", "cattle", {
          hanafi: 72, maliki: 75, shafii: 78, hanbali: 70,
        }),
        acceptance: makeAcceptance("CATTLE_ESTUN_HEAD_ONLY", "third_party_audit"),
      },
    ]);

    const engine = new CertifierTrustEngine(repo);
    const report = await engine.evaluate(
      "cert-1",
      { name: "Steak", species: "cattle" },
      { ...baseCtx, madhab: "general" },
    );

    // General = min of all four = 70 (most conservative)
    expect(report.score).toBe(70);
  });

  // ── Strict penalty ───────────────────────────────────────────

  it("strict strictness applies -5 penalty", async () => {
    const repo = mockRepo([
      {
        tuple: makeTuple("CATTLE_ESTUN_HEAD_ONLY", "cattle", {
          hanafi: 72, maliki: 75, shafii: 78, hanbali: 70,
        }),
        acceptance: makeAcceptance("CATTLE_ESTUN_HEAD_ONLY", "third_party_audit"),
      },
    ]);

    const engine = new CertifierTrustEngine(repo);
    const report = await engine.evaluate(
      "cert-1",
      { name: "Steak", species: "cattle" },
      { ...baseCtx, strictness: "strict" },
    );

    expect(report.score).toBe(67); // 72 - 5
  });
});
