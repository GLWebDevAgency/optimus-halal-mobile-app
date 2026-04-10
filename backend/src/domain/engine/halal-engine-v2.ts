import { matchModules } from "./module-matcher.js";
import { selectScenario } from "./scenario-selector.js";
import { applyMadhabFilter } from "./madhab-filter.js";
import { aggregate } from "./aggregator.js";
import type { IDossierRepo } from "../ports/dossier-repo.js";
import type { IScenarioRepo } from "../ports/scenario-repo.js";
import type { IMadhabRulingRepo } from "../ports/madhab-ruling-repo.js";
import type { IMatchPatternRepo } from "../ports/match-pattern-repo.js";
import type { ProductContext } from "../types/product-context.js";
import type { HalalEvaluationContext } from "../types/halal-evaluation-context.js";
import type { HalalReport } from "../types/halal-report.js";
import type { ModuleVerdict, HalalVerdict } from "../types/module-verdict.js";

const ENGINE_VERSION = "halal-engine-v2.0.0";

export class HalalEngineV2 {
  constructor(
    private dossiers: IDossierRepo,
    private scenarios: IScenarioRepo,
    private madhabRulings: IMadhabRulingRepo,
    private patterns: IMatchPatternRepo,
  ) {}

  async evaluate(product: ProductContext, ctx: HalalEvaluationContext): Promise<HalalReport> {
    // STEP 1 — Match modules (multi-source)
    const allPatterns = await this.patterns.getAllActive();
    const matches = matchModules(product, allPatterns);

    if (matches.length === 0) {
      return this.buildCleanReport(product, ctx);
    }

    // STEP 2 — Batch-load all data (H17: no N+1)
    const substanceIds = matches.map(m => m.substanceId);
    const [dossiersMap, scenariosMap, rulingsMap] = await Promise.all([
      this.dossiers.batchGetActive(substanceIds),
      this.scenarios.batchForSubstances(substanceIds),
      this.madhabRulings.batchGet(substanceIds, ctx.madhab),
    ]);

    // STEP 3 — Evaluate each module
    const verdicts: ModuleVerdict[] = [];
    for (const match of matches) {
      const dossier = dossiersMap.get(match.substanceId);
      if (!dossier) continue;

      const substanceScenarios = scenariosMap.get(match.substanceId) ?? [];
      const defaultPosition = extractDefaultPosition(dossier.dossierJson);
      const selected = selectScenario(substanceScenarios, {
        category: product.category,
        usage: product.usage,
        certified_halal: false,
      }, defaultPosition);

      const ruling = rulingsMap.get(match.substanceId) ?? null;
      const filtered = applyMadhabFilter(selected.score, ctx.madhab, ruling);

      verdicts.push({
        substanceId: match.substanceId,
        displayName: `${match.substanceId} (${match.matchedTerm})`,
        score: filtered.score,
        verdict: scoreToVerdict(filtered.score),
        scenarioKey: selected.scenarioKey,
        rationaleFr: selected.rationaleFr,
        rationaleAr: selected.rationaleAr ?? null,
        madhabNote: filtered.madhabNote,
        fatwaCount: dossier.fatwaCount ?? 0,
        dossierId: dossier.id,
        icon: inferIcon(match.substanceId),
      });
    }

    // STEP 4 — Aggregate
    const aggregated = aggregate(verdicts, ctx.strictness);

    // STEP 5 — Build report
    return {
      ...aggregated,
      confidence: computeConfidence(verdicts, product.extractionSource),
      tier: aggregated.verdict === "haram" ? "haram" : "doubtful",
      headlineFr: buildHeadline(aggregated.verdict, ctx.madhab, "fr"),
      headlineEn: buildHeadline(aggregated.verdict, ctx.madhab, "en"),
      headlineAr: buildHeadline(aggregated.verdict, ctx.madhab, "ar"),
      certifier: null,
      signals: verdicts,
      madhabApplied: ctx.madhab,
      madhabDivergence: verdicts.some(v => v.madhabNote !== null),
      hasFullDossier: true,
      engineVersion: ENGINE_VERSION,
      analysisSourceLabel: `Analyse Naqiy v2 · ${verdicts.length} substance(s) · ${verdicts.reduce((s, v) => s + v.fatwaCount, 0)} fatwas`,
    };
  }

  private buildCleanReport(_product: ProductContext, ctx: HalalEvaluationContext): HalalReport {
    return {
      verdict: "halal", score: 90, confidence: 0.8,
      tier: "analyzed_clean",
      headlineFr: "Aucun ingrédient problématique détecté",
      headlineEn: "No problematic ingredient detected",
      headlineAr: "لم يتم اكتشاف أي مكون إشكالي",
      certifier: null, signals: [],
      madhabApplied: ctx.madhab, madhabDivergence: false,
      hasFullDossier: false, engineVersion: ENGINE_VERSION,
      analysisSourceLabel: "Analyse Naqiy v2 · Produit analysé propre",
    };
  }
}

// Helper functions (pure)
function extractDefaultPosition(dossierJson: Record<string, unknown>) {
  const pos = dossierJson.naqiy_position as Record<string, unknown> | undefined;
  return {
    globalScore: (pos?.global_score as number) ?? 50,
    verdict: (pos?.verdict_internal_ingestion as string) ?? "mashbooh",
  };
}

function scoreToVerdict(score: number): HalalVerdict {
  if (score >= 90) return "halal";
  if (score >= 70) return "halal_with_caution";
  if (score >= 40) return "mashbooh";
  if (score >= 20) return "avoid";
  return "haram";
}

function computeConfidence(verdicts: ModuleVerdict[], source: string): number {
  const base = source === "gemini" ? 0.85 : source === "off_structured" ? 0.7 : 0.5;
  return Math.min(1, base * (verdicts.length > 0 ? 0.95 : 1));
}

function inferIcon(substanceId: string): ModuleVerdict["icon"] {
  if (["SHELLAC", "CARMINE"].includes(substanceId)) return "insect";
  if (["ALCOHOL_FLAVORINGS"].includes(substanceId)) return "alcohol";
  if (["GELATIN", "E471", "GLYCEROL", "RENNET", "LACTOSE_WHEY"].includes(substanceId)) return "animal";
  if (["SOY_LECITHIN"].includes(substanceId)) return "source";
  return "other";
}

function buildHeadline(verdict: HalalVerdict, _madhab: string, lang: string): string {
  const headlines: Record<HalalVerdict, Record<string, string>> = {
    halal: { fr: "Aucun problème détecté", en: "No issues detected", ar: "لا مشكلة" },
    halal_with_caution: { fr: "Quelques points d'attention", en: "Some caution points", ar: "بعض نقاط الاحتراز" },
    mashbooh: { fr: "Discutable selon votre école", en: "Questionable per your school", ar: "مشبوه حسب مذهبك" },
    avoid: { fr: "À éviter selon votre école", en: "Avoid per your school", ar: "يُنصح بالتجنب" },
    haram: { fr: "Contient des éléments interdits", en: "Contains prohibited elements", ar: "يحتوي على عناصر محرّمة" },
  };
  return headlines[verdict]?.[lang] ?? headlines[verdict]?.fr ?? "";
}
