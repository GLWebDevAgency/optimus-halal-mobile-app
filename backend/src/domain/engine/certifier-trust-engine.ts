/**
 * CertifierTrustEngine — Certified Track (Phase 4)
 *
 * Computes a dossier-anchored trust score for a certifier using the
 * Practice Tuple Framework (PTF). Replaces V1 editorial delta scoring
 * with scholarly-traced, species-weighted scores.
 *
 * Pipeline:
 *   1. Load accepted tuples for this certifier (species-filtered if meat)
 *   2. For each tuple: base score from practice_tuples[madhab] + evidence modifier
 *   3. Baseline = min(adjusted scores)
 *   4. Apply live events decay penalty
 *   5. Apply strictness overlay (delta ≤ 0, never positive — C2 fix)
 *   6. Hard invariant: trustScore ≤ baseline (no bonus above worst accepted practice)
 *   7. Map score → grade (N1≥85, N2≥70, N3≥55, N4≥35, N5<35) → verdict
 *   8. Build report with practice_signals + decision_flow
 *
 * @see docs/superpowers/specs/2026-04-09-halal-engine-v2-design.md §7
 */

import type {
  ICertifierTrustRepo,
  CertifierTupleView,
  CertifierAcceptanceView,
} from "../ports/certifier-trust-repo.js";
import type { HalalEvaluationContext } from "../types/halal-evaluation-context.js";
import type { HalalVerdict, ModuleVerdict } from "../types/module-verdict.js";
import { applyEvidenceModifier } from "./evidence-modifier.js";

// ── Types ──────────────────────────────────────────────────────

export interface PracticeSignal {
  tupleSlug: string;
  familyId: string;
  dimensions: Record<string, unknown>;
  baseScore: number;
  evidenceLevel: string;
  adjustedScore: number;
  isBlocking: boolean;
  dossierSectionRef: string;
  notesFr: string | null;
}

export interface CertifierTrustReport {
  readonly verdict: HalalVerdict;
  readonly score: number;
  readonly confidence: number;
  readonly tier: "certified";
  readonly grade: 1 | 2 | 3 | 4 | 5;
  readonly gradeLabel: string;
  readonly baseline: number;
  readonly eventsPenalty: number;
  readonly strictnessDelta: number;
  readonly headlineFr: string;
  readonly headlineEn: string;
  readonly headlineAr: string;
  readonly certifier: { id: string; name: string; logoUrl?: string } | null;
  readonly signals: ModuleVerdict[];
  readonly practiceSignals: PracticeSignal[];
  readonly madhabApplied: string;
  readonly madhabDivergence: boolean;
  readonly speciesEvaluated: string | undefined;
  readonly hasFullDossier: boolean;
  readonly engineVersion: string;
  readonly analysisSourceLabel: string;
  readonly decisionFlow: string[];
}

// ── Grade thresholds (§7.2) ────────────────────────────────────

interface GradeInfo {
  grade: 1 | 2 | 3 | 4 | 5;
  label: string;
  verdict: HalalVerdict;
}

function scoreToGrade(score: number): GradeInfo {
  if (score >= 85) return { grade: 1, label: "N١ Excellence", verdict: "halal" };
  if (score >= 70) return { grade: 2, label: "N٢ Confiance", verdict: "halal" };
  if (score >= 55) return { grade: 3, label: "N٣ Acceptable", verdict: "halal_with_caution" };
  if (score >= 35) return { grade: 4, label: "N٤ Questionable", verdict: "mashbooh" };
  return { grade: 5, label: "N٥ Non recommandé", verdict: "avoid" };
}

// ── Strictness overlay (monotonically non-positive — C2 fix) ──

function getStrictnessDelta(strictness: string): number {
  switch (strictness) {
    case "relaxed": return 0;
    case "moderate": return 0;
    case "strict": return -5;
    case "very_strict": return -10;
    default: return 0;
  }
}

// ── Madhab score selector ──────────────────────────────────────

function getMadhabScore(
  tuple: CertifierTupleView,
  madhab: string,
): number {
  switch (madhab) {
    case "hanafi": return tuple.verdictHanafi;
    case "maliki": return tuple.verdictMaliki;
    case "shafii": return tuple.verdictShafii;
    case "hanbali": return tuple.verdictHanbali;
    case "general":
      // Most conservative: minimum of all four madhabs
      return Math.min(
        tuple.verdictHanafi,
        tuple.verdictMaliki,
        tuple.verdictShafii,
        tuple.verdictHanbali,
      );
    default:
      return Math.min(
        tuple.verdictHanafi,
        tuple.verdictMaliki,
        tuple.verdictShafii,
        tuple.verdictHanbali,
      );
  }
}

// ── Events decay penalty (§7.1 step 4) ────────────────────────

function computeEventsPenalty(
  events: Array<{ scoreImpact: number; occurredAt: string; isActive: boolean }>,
): number {
  const now = Date.now();
  const HALF_LIFE_MONTHS = 12;
  const LN2 = Math.LN2;

  let penalty = 0;
  for (const event of events) {
    if (!event.isActive) continue;
    const occurredMs = new Date(event.occurredAt).getTime();
    const monthsSince = (now - occurredMs) / (1000 * 60 * 60 * 24 * 30.44);
    const decayFactor = Math.exp(-LN2 * monthsSince / HALF_LIFE_MONTHS);
    penalty += Math.abs(event.scoreImpact) * decayFactor;
  }

  return Math.round(penalty * 100) / 100; // 2 decimal precision
}

// ── Decision flow builder (certified track) ────────────────────

function buildCertifiedDecisionFlow(
  certifierId: string,
  species: string | undefined,
  madhab: string,
  strictness: string,
  tupleEvals: Array<{
    tupleSlug: string;
    familyId: string;
    dimensions: string;
    baseScore: number;
    evidenceLevel: string;
    adjustedScore: number;
    isBlocking: boolean;
  }>,
  baseline: number,
  eventsPenalty: number,
  strictnessDelta: number,
  finalScore: number,
  finalVerdict: HalalVerdict,
  gradeLabel: string,
): string[] {
  const flow: string[] = [];

  flow.push(
    `ÉTAPE 1 — Piste certifiée : certifieur=${certifierId}, espèce=${species ?? "toutes"}, madhab=${madhab}`,
  );

  flow.push(
    `ÉTAPE 2 — Évaluation pratiques (${tupleEvals.length} tuples) :`,
  );
  tupleEvals.forEach((t, i) => {
    const prefix = i === tupleEvals.length - 1 ? "  └─" : "  ├─";
    const blocking = t.isBlocking ? " ⚠ POINT BLOQUANT" : "";
    flow.push(
      `${prefix} ${t.tupleSlug} (${t.familyId}/${t.dimensions}) : base=${t.baseScore}, evidence=${t.evidenceLevel}, ajusté=${t.adjustedScore}${blocking}`,
    );
  });

  flow.push(`ÉTAPE 3 — Baseline = min(ajustés) = ${baseline}`);

  if (eventsPenalty > 0) {
    flow.push(`ÉTAPE 4 — Pénalité événements : -${eventsPenalty.toFixed(1)}`);
  } else {
    flow.push(`ÉTAPE 4 — Pénalité événements : aucune`);
  }

  if (strictnessDelta !== 0) {
    flow.push(`ÉTAPE 5 — Overlay strictness (${strictness}) : ${strictnessDelta}`);
  } else {
    flow.push(`ÉTAPE 5 — Overlay strictness (${strictness}) : aucun ajustement`);
  }

  flow.push(
    `ÉTAPE 6 — FINAL : score=${finalScore}, grade=${gradeLabel}, verdict=${finalVerdict}`,
  );

  return flow;
}

// ── Engine ──────────────────────────────────────────────────────

export interface ProductInfo {
  name: string;
  species?: string;
}

export class CertifierTrustEngine {
  private readonly repo: ICertifierTrustRepo;

  constructor(repo: ICertifierTrustRepo) {
    this.repo = repo;
  }

  async evaluate(
    certifierId: string,
    product: ProductInfo,
    evalCtx: HalalEvaluationContext,
  ): Promise<CertifierTrustReport> {
    const startMs = performance.now();

    // ── Step 1: Load accepted tuples ───────────────────────────
    const accepted = await this.repo.getAcceptedTuples(
      certifierId,
      product.species,
    );

    // No tuples → N5 / avoid
    if (accepted.length === 0) {
      return this.buildEmptyReport(certifierId, product, evalCtx, startMs);
    }

    // ── Step 2: Compute adjusted scores per tuple ──────────────
    const tupleEvals: Array<{
      tupleSlug: string;
      familyId: string;
      dimensions: string;
      baseScore: number;
      evidenceLevel: string;
      adjustedScore: number;
      isBlocking: boolean;
      tuple: CertifierTupleView;
      acceptance: CertifierAcceptanceView;
    }> = [];

    for (const { tuple, acceptance } of accepted) {
      const baseScore = getMadhabScore(tuple, evalCtx.madhab);
      const adjustedScore = applyEvidenceModifier(
        baseScore,
        acceptance.evidenceLevel,
        tuple.requiredEvidence,
        acceptance.evidenceDetails,
      );

      tupleEvals.push({
        tupleSlug: tuple.tupleSlug,
        familyId: tuple.familyId,
        dimensions: JSON.stringify(tuple.dimensions),
        baseScore,
        evidenceLevel: acceptance.evidenceLevel,
        adjustedScore,
        isBlocking: adjustedScore < 35,
        tuple,
        acceptance,
      });
    }

    // ── Step 3: Baseline = min(adjusted) ───────────────────────
    const baseline = Math.min(...tupleEvals.map((e) => e.adjustedScore));

    // ── Step 4: Live events decay penalty ──────────────────────
    const events = await this.repo.getLiveEvents(certifierId, 24);
    const eventsPenalty = computeEventsPenalty(events);

    // ── Step 5: Strictness overlay (delta ≤ 0, C2 fix) ────────
    let strictnessDelta = getStrictnessDelta(evalCtx.strictness);

    // very_strict: downgrade 1 grade if any accepted tuple ≤ 50
    let gradeDowngrade = false;
    if (evalCtx.strictness === "very_strict") {
      const hasLowTuple = tupleEvals.some((e) => e.adjustedScore <= 50);
      if (hasLowTuple) {
        gradeDowngrade = true;
      }
    }

    // ── Step 6: Final score ────────────────────────────────────
    let trustScore = Math.round(
      Math.max(0, Math.min(100, baseline - eventsPenalty + strictnessDelta)),
    );

    // HARD INVARIANT: trustScore ≤ baseline
    trustScore = Math.min(trustScore, baseline);

    // ── Step 7: Grade + verdict ────────────────────────────────
    let gradeInfo = scoreToGrade(trustScore);

    // Apply grade downgrade for very_strict
    if (gradeDowngrade && gradeInfo.grade < 5) {
      const downgradedGrade = (gradeInfo.grade + 1) as 1 | 2 | 3 | 4 | 5;
      gradeInfo = scoreToGrade(
        // Map to worst score in the downgraded grade
        downgradedGrade === 2 ? 70 :
        downgradedGrade === 3 ? 55 :
        downgradedGrade === 4 ? 35 :
        0,
      );
      // Keep the actual score, just downgrade the grade
      gradeInfo = {
        grade: downgradedGrade,
        label: gradeInfo.label,
        verdict: gradeInfo.verdict,
      };
    }

    // ── Step 8: Build report ───────────────────────────────────
    const durationMs = performance.now() - startMs;

    // Build practice signals (sorted by adjusted score ascending — weakest first)
    const sortedEvals = [...tupleEvals].sort((a, b) => a.adjustedScore - b.adjustedScore);

    const practiceSignals: PracticeSignal[] = sortedEvals.map((e) => ({
      tupleSlug: e.tupleSlug,
      familyId: e.familyId,
      dimensions: e.tuple.dimensions,
      baseScore: e.baseScore,
      evidenceLevel: e.acceptance.evidenceLevel,
      adjustedScore: e.adjustedScore,
      isBlocking: e.isBlocking,
      dossierSectionRef: e.tuple.dossierSectionRef,
      notesFr: e.tuple.notesFr,
    }));

    // Build ModuleVerdict[] (for HalalReport compatibility)
    const signals: ModuleVerdict[] = sortedEvals.map((e) => ({
      substanceId: e.tupleSlug,
      displayName: e.tupleSlug.replace(/_/g, " ").toLowerCase(),
      score: e.adjustedScore,
      verdict: scoreToGrade(e.adjustedScore).verdict,
      scenarioKey: "__certified_track__",
      rationaleFr: e.tuple.notesFr ?? `Pratique ${e.tupleSlug} — ${e.tuple.dossierSectionRef}`,
      rationaleAr: null,
      madhabNote: null,
      fatwaCount: 0,
      dossierId: e.tuple.dossierSectionRef,
      icon: "process" as const,
    }));

    // Build decision flow
    const decisionFlow = buildCertifiedDecisionFlow(
      certifierId,
      product.species,
      evalCtx.madhab,
      evalCtx.strictness,
      tupleEvals.map((e) => ({
        tupleSlug: e.tupleSlug,
        familyId: e.familyId,
        dimensions: e.dimensions,
        baseScore: e.baseScore,
        evidenceLevel: e.evidenceLevel,
        adjustedScore: e.adjustedScore,
        isBlocking: e.isBlocking,
      })),
      baseline,
      eventsPenalty,
      strictnessDelta,
      trustScore,
      gradeInfo.verdict,
      gradeInfo.label,
    );

    // Confidence: higher when more tuples evaluated and evidence is strong
    const avgEvidenceQuality = tupleEvals.reduce((sum, e) => {
      const qualityMap: Record<string, number> = {
        third_party_audit: 1.0,
        fulltime_muslim_inspector: 0.9,
        audit_report_self: 0.7,
        protocol_published: 0.5,
        declaration: 0.3,
        none: 0.1,
      };
      return sum + (qualityMap[e.evidenceLevel] ?? 0.1);
    }, 0) / tupleEvals.length;

    const confidence = Math.round(
      Math.min(0.95, 0.5 + avgEvidenceQuality * 0.4) * 100,
    ) / 100;

    return {
      verdict: gradeInfo.verdict,
      score: trustScore,
      confidence,
      tier: "certified",
      grade: gradeInfo.grade,
      gradeLabel: gradeInfo.label,
      baseline,
      eventsPenalty,
      strictnessDelta,
      headlineFr: this.headlineFr(gradeInfo.grade, product.name),
      headlineEn: this.headlineEn(gradeInfo.grade, product.name),
      headlineAr: this.headlineAr(gradeInfo.grade, product.name),
      certifier: { id: certifierId, name: certifierId },
      signals,
      practiceSignals,
      madhabApplied: evalCtx.madhab,
      madhabDivergence: this.hasMadhabDivergence(tupleEvals.map((e) => e.tuple)),
      speciesEvaluated: product.species,
      hasFullDossier: true,
      engineVersion: "halal-engine-v2.0.0",
      analysisSourceLabel: "Certified Track — Practice Tuple Framework",
      decisionFlow,
    };
  }

  // ── Private helpers ──────────────────────────────────────────

  private buildEmptyReport(
    certifierId: string,
    product: ProductInfo,
    evalCtx: HalalEvaluationContext,
    startMs: number,
  ): CertifierTrustReport {
    return {
      verdict: "avoid",
      score: 0,
      confidence: 0.1,
      tier: "certified",
      grade: 5,
      gradeLabel: "N٥ Non recommandé",
      baseline: 0,
      eventsPenalty: 0,
      strictnessDelta: 0,
      headlineFr: `Aucune pratique documentée pour ce certifieur`,
      headlineEn: `No documented practices for this certifier`,
      headlineAr: `لا توجد ممارسات موثقة لهذه الجهة`,
      certifier: { id: certifierId, name: certifierId },
      signals: [],
      practiceSignals: [],
      madhabApplied: evalCtx.madhab,
      madhabDivergence: false,
      speciesEvaluated: product.species,
      hasFullDossier: false,
      engineVersion: "halal-engine-v2.0.0",
      analysisSourceLabel: "Certified Track — No data",
      decisionFlow: [
        `ÉTAPE 1 — Piste certifiée : certifieur=${certifierId}, espèce=${product.species ?? "toutes"}, madhab=${evalCtx.madhab}`,
        `ÉTAPE 2 — Aucun tuple accepté trouvé → VERDICT AUTOMATIQUE N٥`,
      ],
    };
  }

  private hasMadhabDivergence(tuples: CertifierTupleView[]): boolean {
    for (const t of tuples) {
      const scores = [t.verdictHanafi, t.verdictMaliki, t.verdictShafii, t.verdictHanbali];
      const max = Math.max(...scores);
      const min = Math.min(...scores);
      if (max - min > 15) return true;
    }
    return false;
  }

  private headlineFr(grade: number, productName: string): string {
    switch (grade) {
      case 1: return `${productName} — Certifié halal (Excellence)`;
      case 2: return `${productName} — Certifié halal (Confiance)`;
      case 3: return `${productName} — Certifié halal (Vigilance)`;
      case 4: return `${productName} — Certification douteuse`;
      case 5: return `${productName} — Certification non fiable`;
      default: return `${productName} — Certification inconnue`;
    }
  }

  private headlineEn(grade: number, productName: string): string {
    switch (grade) {
      case 1: return `${productName} — Halal Certified (Excellence)`;
      case 2: return `${productName} — Halal Certified (Trusted)`;
      case 3: return `${productName} — Halal Certified (Caution)`;
      case 4: return `${productName} — Questionable Certification`;
      case 5: return `${productName} — Unreliable Certification`;
      default: return `${productName} — Unknown Certification`;
    }
  }

  private headlineAr(grade: number, productName: string): string {
    switch (grade) {
      case 1: return `${productName} — شهادة حلال (ممتاز)`;
      case 2: return `${productName} — شهادة حلال (موثوق)`;
      case 3: return `${productName} — شهادة حلال (يقظة)`;
      case 4: return `${productName} — شهادة مشكوك فيها`;
      case 5: return `${productName} — شهادة غير موثوقة`;
      default: return `${productName} — شهادة غير معروفة`;
    }
  }
}
