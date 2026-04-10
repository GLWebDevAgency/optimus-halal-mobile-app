import type { HalalVerdict, ModuleVerdict } from "./module-verdict.js";

export interface HalalReport {
  readonly verdict: HalalVerdict;
  readonly score: number;
  readonly confidence: number;
  readonly tier: "certified" | "analyzed_clean" | "doubtful" | "haram";
  readonly headlineFr: string;
  readonly headlineEn: string;
  readonly headlineAr: string;
  readonly certifier: { id: string; name: string; logoUrl?: string } | null;
  readonly signals: ModuleVerdict[];
  readonly madhabApplied: string;
  readonly madhabDivergence: boolean;
  readonly hasFullDossier: boolean;
  readonly engineVersion: string;
  readonly analysisSourceLabel: string;
}
