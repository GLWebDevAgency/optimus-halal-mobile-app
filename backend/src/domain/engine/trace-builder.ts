/**
 * Trace Builder — Generates human-readable algorithmic decision flow.
 *
 * Every scan produces a `decision_flow: string[]` in the evaluation trace.
 * Each entry reads like a step in the decision pipeline, so a non-developer
 * auditor (halal authority, legal, QA) can understand exactly WHY a verdict
 * was reached without reading code or parsing nested JSON.
 *
 * Example output:
 *   "ÉTAPE 1 — Produit résolu : Nutella (3017620422003), source=db_cache (0.3ms)"
 *   "ÉTAPE 2 — Extraction Gemini V2 : 12 ingrédients, 2 additifs, catégorie=spread (source=live, 450ms)"
 *   "ÉTAPE 3 — Routage : aucune certification détectée → PISTE ANALYSÉE"
 *   "ÉTAPE 4 — Détection substances : 2 substances matchées"
 *   "  ├─ SHELLAC matché via gemini (terme='gomme-laque', confiance=0.95, priorité=100)"
 *   "  └─ E471 matché via e_number (terme='E471', confiance=1.0, priorité=90)"
 *   "ÉTAPE 5 — Sélection scénario :"
 *   "  ├─ SHELLAC → scénario 'uncertified_candy' (spécificité=1, score_base=35)"
 *   "  └─ E471 → scénario '__default__' (score_base=45)"
 *   "ÉTAPE 6 — Filtre madhab (hanafi) :"
 *   "  ├─ SHELLAC : ruling=haram, split_contemporain=oui → score 35→20 ⚠ Divergence"
 *   "  └─ E471 : ruling=doubtful, split_contemporain=oui → score 45→40"
 *   "ÉTAPE 7 — Agrégation : min pondéré → score=20, verdict=AVOID"
 *   "  ├─ Overlay strictness (moderate) : aucun ajustement"
 *   "  └─ FINAL : score=20, verdict=AVOID, confiance=0.81"
 *
 * Pure function — no DB, no side effects, no async.
 */

import type { ModuleVerdict, HalalVerdict } from "../types/module-verdict.js";
import type { SubstanceMatch } from "./module-matcher.js";

export interface TraceContext {
  // Stage 0
  productName: string | null;
  barcode: string;

  // Stage 1
  resolveSource: "db_fresh" | "db_stale" | "off_fetch" | "unknown";
  resolveMs: number;

  // Stage 2
  geminiSource: "live" | "cache" | "fast_path_off" | "fallback_regex" | "unavailable";
  extractMs: number;
  ingredientCount: number;
  additiveCount: number;
  category: string;
  substancesDetectedCount: number;

  // Stage 3
  track: "certified" | "analyzed";
  certifierName?: string;
  certifierGrade?: string;

  // Stage 4 — per-module detail
  matches: Array<{
    substanceId: string;
    source: string;
    matchedTerm: string;
    confidence: number;
    priority: number;
  }>;

  // Stage 5 — per-module scenario
  scenarioSelections: Array<{
    substanceId: string;
    scenarioKey: string;
    specificity: number;
    baseScore: number;
  }>;

  // Stage 6 — per-module madhab
  madhabResults: Array<{
    substanceId: string;
    madhab: string;
    ruling: string | null;
    contemporarySplit: boolean;
    scoreBefore: number;
    scoreAfter: number;
  }>;

  // Stage 7 — aggregation
  madhab: string;
  strictness: string;
  aggregatedScore: number;
  aggregatedVerdict: HalalVerdict;
  strictnessAdjustment: number;
  finalScore: number;
  finalVerdict: HalalVerdict;
  confidence: number;
  engineMs: number;
  totalMs: number;

  // Certified track extras
  tupleEvaluations?: Array<{
    tupleSlug: string;
    family: string;
    dimensions: string;
    baseScore: number;
    evidenceLevel: string;
    adjustedScore: number;
    isBlocking: boolean;
  }>;
  trustBaseline?: number;
  speciesEvaluated?: string;
}

/**
 * Build the human-readable decision flow from structured trace data.
 */
export function buildDecisionFlow(ctx: TraceContext): string[] {
  const flow: string[] = [];
  const last = (items: unknown[]) => items.length > 0 ? "└─" : "├─";

  // ── ÉTAPE 1 — Résolution produit ──
  flow.push(
    `ÉTAPE 1 — Produit résolu : ${ctx.productName ?? "inconnu"} (${ctx.barcode}), source=${ctx.resolveSource} (${ctx.resolveMs.toFixed(1)}ms)`,
  );

  // ── ÉTAPE 2 — Extraction ──
  flow.push(
    `ÉTAPE 2 — Extraction Gemini : ${ctx.ingredientCount} ingrédients, ${ctx.additiveCount} additifs, catégorie=${ctx.category} (source=${ctx.geminiSource}, ${ctx.extractMs.toFixed(0)}ms)`,
  );

  // ── ÉTAPE 3 — Routage track ──
  if (ctx.track === "certified") {
    flow.push(
      `ÉTAPE 3 — Routage : certification détectée (${ctx.certifierName ?? "?"}, grade ${ctx.certifierGrade ?? "?"}) → PISTE CERTIFIÉE`,
    );
  } else {
    flow.push(
      `ÉTAPE 3 — Routage : aucune certification détectée → PISTE ANALYSÉE`,
    );
  }

  // ── CERTIFIED TRACK ──
  if (ctx.track === "certified" && ctx.tupleEvaluations) {
    flow.push(`ÉTAPE 4 — Évaluation pratiques certifieur (${ctx.tupleEvaluations.length} tuples, espèce=${ctx.speciesEvaluated ?? "toutes"}) :`);
    ctx.tupleEvaluations.forEach((t, i) => {
      const prefix = i === ctx.tupleEvaluations!.length - 1 ? "  └─" : "  ├─";
      const blocking = t.isBlocking ? " ⚠ POINT BLOQUANT" : "";
      flow.push(
        `${prefix} ${t.tupleSlug} (${t.family}/${t.dimensions}) : base=${t.baseScore}, evidence=${t.evidenceLevel}, ajusté=${t.adjustedScore}${blocking}`,
      );
    });
    flow.push(`ÉTAPE 5 — Baseline trust = min(ajustés) = ${ctx.trustBaseline ?? "?"}`);
    flow.push(
      `ÉTAPE 6 — FINAL CERTIFIÉ : score=${ctx.finalScore}, verdict=${ctx.finalVerdict}, confiance=${ctx.confidence.toFixed(2)}, madhab=${ctx.madhab} (${ctx.engineMs.toFixed(0)}ms)`,
    );
    flow.push(`DURÉE TOTALE : ${ctx.totalMs.toFixed(0)}ms`);
    return flow;
  }

  // ── ANALYZED TRACK ──

  // Étape 4 — Détection substances
  if (ctx.matches.length === 0) {
    flow.push(`ÉTAPE 4 — Détection substances : aucune substance halal-sensible détectée`);
    flow.push(`ÉTAPE 5 — VERDICT : HALAL (analysé propre), score=90, confiance=${ctx.confidence.toFixed(2)}`);
    flow.push(`DURÉE TOTALE : ${ctx.totalMs.toFixed(0)}ms`);
    return flow;
  }

  flow.push(`ÉTAPE 4 — Détection substances : ${ctx.matches.length} substance(s) matchée(s)`);
  ctx.matches.forEach((m, i) => {
    const prefix = i === ctx.matches.length - 1 ? "  └─" : "  ├─";
    flow.push(
      `${prefix} ${m.substanceId} matché via ${m.source} (terme='${m.matchedTerm}', confiance=${m.confidence.toFixed(2)}, priorité=${m.priority})`,
    );
  });

  // Étape 5 — Sélection scénario
  flow.push(`ÉTAPE 5 — Sélection scénario :`);
  ctx.scenarioSelections.forEach((s, i) => {
    const prefix = i === ctx.scenarioSelections.length - 1 ? "  └─" : "  ├─";
    flow.push(
      `${prefix} ${s.substanceId} → scénario '${s.scenarioKey}' (spécificité=${s.specificity}, score_base=${s.baseScore})`,
    );
  });

  // Étape 6 — Filtre madhab
  flow.push(`ÉTAPE 6 — Filtre madhab (${ctx.madhab}) :`);
  ctx.madhabResults.forEach((m, i) => {
    const prefix = i === ctx.madhabResults.length - 1 ? "  └─" : "  ├─";
    const split = m.contemporarySplit ? " ⚠ Divergence contemporaine" : "";
    const delta = m.scoreAfter !== m.scoreBefore
      ? ` → score ${m.scoreBefore}→${m.scoreAfter}`
      : " → score inchangé";
    const ruling = m.ruling ? `ruling=${m.ruling}` : "pas d'override";
    flow.push(`${prefix} ${m.substanceId} : ${ruling}${delta}${split}`);
  });

  // Étape 7 — Agrégation
  flow.push(`ÉTAPE 7 — Agrégation : min pondéré → score=${ctx.aggregatedScore}, verdict=${ctx.aggregatedVerdict}`);
  if (ctx.strictnessAdjustment !== 0) {
    flow.push(`  ├─ Overlay strictness (${ctx.strictness}) : ajustement ${ctx.strictnessAdjustment > 0 ? "+" : ""}${ctx.strictnessAdjustment}`);
  } else {
    flow.push(`  ├─ Overlay strictness (${ctx.strictness}) : aucun ajustement`);
  }
  flow.push(
    `  └─ FINAL : score=${ctx.finalScore}, verdict=${ctx.finalVerdict}, confiance=${ctx.confidence.toFixed(2)}`,
  );
  flow.push(`DURÉE TOTALE : ${ctx.totalMs.toFixed(0)}ms`);

  return flow;
}

/**
 * Build the complete evaluation trace JSONB from structured context.
 */
export function buildEvaluationTrace(ctx: TraceContext) {
  return {
    engine_version: "halal-engine-v2.0.0",
    track: ctx.track,
    gemini_source: ctx.geminiSource,
    stages: {
      resolve_ms: ctx.resolveMs,
      extract_ms: ctx.extractMs,
      engine_ms: ctx.engineMs,
      total_ms: ctx.totalMs,
    },
    modules_fired: ctx.matches.map((m, i) => ({
      substance_id: m.substanceId,
      score: ctx.madhabResults[i]?.scoreAfter ?? ctx.scenarioSelections[i]?.baseScore ?? 0,
      scenario_key: ctx.scenarioSelections[i]?.scenarioKey ?? "__none__",
      match_source: m.source,
      match_priority: m.priority,
      madhab_note: ctx.madhabResults[i]?.contemporarySplit
        ? `Divergence contemporaine (${ctx.madhab})`
        : null,
    })),
    tuples_evaluated: (ctx.tupleEvaluations ?? []).map((t) => ({
      practice_tuple_id: t.tupleSlug,
      base_score: t.baseScore,
      adjusted_score: t.adjustedScore,
      evidence_level: t.evidenceLevel,
    })),
    certifier_id: ctx.track === "certified" ? (ctx.certifierName ?? null) : null,
    species_evaluated: ctx.speciesEvaluated ?? null,
    decision_flow: buildDecisionFlow(ctx),
    final: {
      verdict: ctx.finalVerdict,
      score: ctx.finalScore,
      confidence: ctx.confidence,
    },
  };
}
