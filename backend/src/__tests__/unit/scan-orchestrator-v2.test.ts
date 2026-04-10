import { describe, it, expect, vi } from "vitest";
import { ScanOrchestratorV2, type OrchestratorDeps, type UserProfile, type ScanOrchestratorInput } from "../../services/scan-orchestrator-v2.js";
import type { HalalReport } from "../../domain/types/halal-report.js";

// ── Mock data ────────────────────────────────────────────────

const MOCK_HALAL_REPORT_ANALYZED: HalalReport = {
  verdict: "mashbooh",
  score: 45,
  confidence: 0.85,
  tier: "doubtful",
  headlineFr: "Discutable selon votre école",
  headlineEn: "Questionable per your school",
  headlineAr: "مشبوه حسب مذهبك",
  certifier: null,
  signals: [
    {
      substanceId: "SHELLAC",
      displayName: "SHELLAC (gomme-laque)",
      score: 35,
      verdict: "mashbooh",
      scenarioKey: "uncertified_candy",
      rationaleFr: "Gomme-laque d'origine insecte",
      rationaleAr: null,
      madhabNote: null,
      fatwaCount: 12,
      dossierId: "uuid-1",
      icon: "insect",
    },
  ],
  madhabApplied: "general",
  madhabDivergence: false,
  hasFullDossier: true,
  engineVersion: "halal-engine-v2.0.0",
  analysisSourceLabel: "Analyse Naqiy v2",
};

const MOCK_HALAL_REPORT_CERTIFIED: HalalReport = {
  verdict: "halal",
  score: 88,
  confidence: 0.92,
  tier: "certified",
  headlineFr: "Certifié halal (Excellence)",
  headlineEn: "Halal Certified (Excellence)",
  headlineAr: "شهادة حلال (ممتاز)",
  certifier: { id: "avs", name: "AVS" },
  signals: [],
  madhabApplied: "general",
  madhabDivergence: false,
  hasFullDossier: true,
  engineVersion: "halal-engine-v2.0.0",
  analysisSourceLabel: "Certified Track",
};

const MOCK_PRODUCT = {
  id: "prod-uuid-1",
  name: "Nutella",
  brand: "Ferrero",
  barcode: "3017620422003",
  imageUrl: null,
  category: "spread",
  offData: {
    ingredients_text_fr: "Sucre, huile de palme, noisettes, cacao, lait écrémé en poudre",
    additives_tags: ["en:e322"],
    labels_tags: [],
    allergens_tags: ["en:milk", "en:nuts"],
    traces_tags: ["en:soybeans"],
    ingredients_analysis_tags: [],
    categories: "Pâtes à tartiner",
  },
};

const MOCK_GEMINI_RESULT = {
  ingredients: ["sucre", "huile de palme", "noisettes", "cacao", "lait écrémé en poudre"],
  additives: ["e322"],
  lang: "fr",
  product_category: "spread" as const,
  product_usage: "ingestion" as const,
  meat_classification: null,
  detected_substances: [
    { substance_id: "SHELLAC", matched_term: "gomme-laque", match_source: "canonical_fr" as const, confidence: 0.95 },
  ],
  animal_source_hints: [],
  alcohol_context: { present: false, role: "none" as const },
  novaEstimate: 4 as const,
  allergenHints: ["milk", "nuts"],
  containsAlcohol: false,
  isOrganic: false,
};

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "user-uuid-1",
    madhab: "general",
    halalStrictness: "moderate",
    allergens: null,
    isPregnant: false,
    hasChildren: false,
    subscriptionTier: "free",
    boycottOptIn: false,
    ...overrides,
  };
}

function makeInput(overrides: Partial<ScanOrchestratorInput> = {}): ScanOrchestratorInput {
  return {
    barcode: "3017620422003",
    ...overrides,
  };
}

// ── Mock dependencies ────────────────────────────────────────

function makeMockDeps(overrides: Partial<OrchestratorDeps> = {}): OrchestratorDeps {
  return {
    db: {},
    halalEngine: {
      evaluate: vi.fn().mockResolvedValue(MOCK_HALAL_REPORT_ANALYZED),
    } as any,
    certifierTrustEngine: {
      evaluate: vi.fn().mockResolvedValue(MOCK_HALAL_REPORT_CERTIFIED),
    } as any,
    evaluationStore: {
      persist: vi.fn().mockResolvedValue("eval-uuid-1"),
    },
    resolveProduct: vi.fn().mockResolvedValue({
      product: MOCK_PRODUCT,
      offData: MOCK_PRODUCT.offData,
      source: "db_fresh",
    }),
    aiExtractIngredientsV2: vi.fn().mockResolvedValue({
      result: MOCK_GEMINI_RESULT,
      source: "v2",
    }),
    matchAllergens: vi.fn().mockReturnValue([]),
    lookupBrandCertifier: vi.fn().mockResolvedValue(null),
    fetchRiskyAdditives: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────

describe("ScanOrchestratorV2", () => {
  it("analyzed track flow — no certifier → returns HalalReport with signals", async () => {
    const deps = makeMockDeps();
    const orchestrator = new ScanOrchestratorV2(deps);
    const user = makeUser();

    const result = await orchestrator.execute(makeInput(), user);

    // Should use analyzed track
    expect(result.context.track).toBe("analyzed");
    expect(result.halal.verdict).toBe("mashbooh");
    expect(result.halal.signals).toHaveLength(1);
    expect(result.halal.signals[0].substanceId).toBe("SHELLAC");

    // HalalEngineV2 should have been called
    expect(deps.halalEngine.evaluate).toHaveBeenCalledOnce();

    // CertifierTrustEngine should NOT have been called
    expect(deps.certifierTrustEngine.evaluate).not.toHaveBeenCalled();

    // Product should be returned
    expect(result.product).not.toBeNull();
    expect((result.product as any).name).toBe("Nutella");

    // Context metadata
    expect(result.context.engineVersion).toBe("halal-engine-v2.0.0");
    expect(result.context.madhab).toBe("general");
  });

  it("certified track flow — certifier found → returns CertifierTrustReport", async () => {
    const deps = makeMockDeps({
      lookupBrandCertifier: vi.fn().mockResolvedValue({
        certifierId: "avs",
        certifierName: "AVS",
      }),
    });
    const orchestrator = new ScanOrchestratorV2(deps);
    const user = makeUser();

    const result = await orchestrator.execute(makeInput(), user);

    // Should use certified track
    expect(result.context.track).toBe("certified");
    expect(result.halal.verdict).toBe("halal");
    expect(result.halal.score).toBe(88);

    // CertifierTrustEngine should have been called
    expect(deps.certifierTrustEngine.evaluate).toHaveBeenCalledOnce();

    // HalalEngineV2 should NOT have been called
    expect(deps.halalEngine.evaluate).not.toHaveBeenCalled();
  });

  it("viewOnly mode — no persist call", async () => {
    const deps = makeMockDeps();
    const orchestrator = new ScanOrchestratorV2(deps);
    const user = makeUser();

    const result = await orchestrator.execute(makeInput({ viewOnly: true }), user);

    // Should still return valid result
    expect(result.halal).toBeDefined();
    expect(result.context.track).toBe("analyzed");

    // evaluationStore.persist should NOT have been called
    expect(deps.evaluationStore.persist).not.toHaveBeenCalled();
  });

  it("anonymous user (null) — no persist call", async () => {
    const deps = makeMockDeps();
    const orchestrator = new ScanOrchestratorV2(deps);

    const result = await orchestrator.execute(makeInput(), null);

    expect(result.halal).toBeDefined();
    expect(deps.evaluationStore.persist).not.toHaveBeenCalled();
  });

  it("C1 invariant — engines only receive HalalEvaluationContext, not tier", async () => {
    const deps = makeMockDeps();
    const orchestrator = new ScanOrchestratorV2(deps);
    const user = makeUser({ subscriptionTier: "premium" });

    await orchestrator.execute(makeInput(), user);

    // Check what was passed to halalEngine.evaluate
    const evalCall = (deps.halalEngine.evaluate as ReturnType<typeof vi.fn>).mock.calls[0];
    const evalCtx = evalCall[1];

    // C1: only madhab, strictness, lang — no tier, no entitlements
    expect(evalCtx).toHaveProperty("madhab");
    expect(evalCtx).toHaveProperty("strictness");
    expect(evalCtx).toHaveProperty("lang");
    expect(evalCtx).not.toHaveProperty("tier");
    expect(evalCtx).not.toHaveProperty("subscriptionTier");
    expect(evalCtx).not.toHaveProperty("canAllergenProfile");
  });

  it("boycott returns null when boycottOptIn is false", async () => {
    const deps = makeMockDeps();
    const orchestrator = new ScanOrchestratorV2(deps);
    const user = makeUser({ boycottOptIn: false });

    const result = await orchestrator.execute(makeInput(), user);

    expect(result.boycott).toBeNull();
  });

  it("personalAlerts returns upsellHint for free users", async () => {
    const deps = makeMockDeps();
    const orchestrator = new ScanOrchestratorV2(deps);
    const user = makeUser({ subscriptionTier: "free" });

    const result = await orchestrator.execute(makeInput(), user);

    expect(result.personal.alerts).toHaveLength(0);
    expect(result.personal.upsellHint).toBe("allergens_profile");
  });

  it("logged-in non-viewOnly user → persist is called with correct record", async () => {
    const deps = makeMockDeps();
    const orchestrator = new ScanOrchestratorV2(deps);
    const user = makeUser();

    await orchestrator.execute(makeInput(), user);

    expect(deps.evaluationStore.persist).toHaveBeenCalledOnce();
    const record = (deps.evaluationStore.persist as ReturnType<typeof vi.fn>).mock.calls[0][0];

    expect(record.userId).toBe("user-uuid-1");
    expect(record.engineVersion).toBe("halal-engine-v2.0.0");
    expect(record.track).toBe("analyzed");
    expect(record.status).toBe("ok");
    expect(record.trace).toBeDefined();
    expect(typeof record.durationMs).toBe("number");
  });

  it("persist failure is non-fatal — result still returned", async () => {
    const deps = makeMockDeps({
      evaluationStore: {
        persist: vi.fn().mockRejectedValue(new Error("DB connection lost")),
      },
    });
    const orchestrator = new ScanOrchestratorV2(deps);
    const user = makeUser();

    // Should not throw
    const result = await orchestrator.execute(makeInput(), user);
    expect(result.halal).toBeDefined();
    expect(result.context.track).toBe("analyzed");
  });

  it("product not found — returns null product with default report", async () => {
    const deps = makeMockDeps({
      resolveProduct: vi.fn().mockResolvedValue(null),
    });
    const orchestrator = new ScanOrchestratorV2(deps);

    const result = await orchestrator.execute(makeInput(), null);

    expect(result.product).toBeNull();
    expect(result.halal).toBeDefined();
  });
});
