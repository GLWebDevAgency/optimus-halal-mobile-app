/**
 * Scan V2 — Type Definitions
 *
 * Maps directly to backend HalalReport + ModuleVerdict types,
 * with UI-specific extensions for the scan result screen.
 *
 * @module components/scan-v2/scan-v2-types
 */

// ── Re-export backend domain types for convenience ──
// These mirror the backend types; we duplicate them here to avoid
// cross-package imports in the mobile app.

export type HalalVerdict = "halal" | "halal_with_caution" | "mashbooh" | "avoid" | "haram";

export type MadhabId = "general" | "hanafi" | "shafii" | "maliki" | "hanbali";

export type Strictness = "relaxed" | "moderate" | "strict" | "very_strict";

export type SubstanceIcon =
  | "insect"
  | "alcohol"
  | "animal"
  | "enzyme"
  | "process"
  | "source"
  | "other";

// ── Module Verdict (single substance signal) ──

export interface ModuleVerdictV2 {
  readonly substanceId: string;
  readonly displayName: string;
  readonly score: number; // 0..100
  readonly verdict: HalalVerdict;
  readonly scenarioKey: string;
  readonly rationaleFr: string;
  readonly rationaleAr: string | null;
  readonly madhabNote: string | null;
  readonly fatwaCount: number;
  readonly dossierId: string;
  readonly icon: SubstanceIcon;
}

// ── Halal Report (full scan result) ──

export interface HalalReportV2 {
  readonly verdict: HalalVerdict;
  readonly score: number; // 0..100
  readonly confidence: number; // 0..1
  readonly tier: "certified" | "analyzed_clean" | "doubtful" | "haram";
  readonly headlineFr: string;
  readonly headlineEn: string;
  readonly headlineAr: string;
  readonly certifier: CertifierInfoV2 | null;
  readonly signals: ModuleVerdictV2[];
  readonly madhabApplied: string;
  readonly madhabDivergence: boolean;
  readonly hasFullDossier: boolean;
  readonly engineVersion: string;
  readonly analysisSourceLabel: string;
}

// ── Certifier ──

export interface CertifierInfoV2 {
  readonly id: string;
  readonly name: string;
  readonly logoUrl?: string;
  readonly shortName?: string;
  readonly creationYear?: number;
  readonly website?: string;
}

// ── Trust Grade (N1-N5) ──

export interface TrustGradeInfo {
  readonly grade: number; // 1-5
  readonly arabic: string; // "١" "٢" etc.
  readonly label: string; // "Tres fiable" etc.
  readonly color: string; // hex color
}

// ── Certifier Practice ──

export interface CertifierPractice {
  readonly id: string;
  readonly label: string;
  readonly score: number; // 0..100
  readonly isBlocker: boolean;
  readonly verdict: HalalVerdict;
  readonly dossierId?: string;
  readonly descriptionFr?: string;
}

// ── Certifier Trust Scores per Madhab ──

export interface CertifierTrustScores {
  readonly trustScore: number;
  readonly trustScoreHanafi: number;
  readonly trustScoreShafii: number;
  readonly trustScoreMaliki?: number;
  readonly trustScoreHanbali?: number;
}

// ── Substance Detail (for bottom sheet) ──

export interface SubstanceDetail {
  readonly substanceId: string;
  readonly displayName: string;
  readonly score: number;
  readonly verdict: HalalVerdict;
  readonly scenarioKey: string;
  readonly rationaleFr: string;
  readonly rationaleAr: string | null;
  readonly icon: SubstanceIcon;
  readonly fatwaCount: number;
  readonly dossierId: string;
  readonly madhabRulings: MadhabRuling[];
  readonly fatwas: FatwaEntry[];
  readonly sources: ScholarlySource[];
}

export interface MadhabRuling {
  readonly madhab: MadhabId;
  readonly ruling: HalalVerdict;
  readonly isSplit: boolean;
  readonly note?: string;
}

export interface FatwaEntry {
  readonly institution: string;
  readonly verdict: "permis" | "conditionnel" | "interdit";
  readonly year?: number;
  readonly reference?: string;
}

export interface ScholarlySource {
  readonly title: string;
  readonly author?: string;
  readonly url?: string;
  readonly year?: number;
}

// ── Health Summary ──

export interface HealthSummaryData {
  readonly nutriScore: string | null; // "A" "B" "C" "D" "E"
  readonly novaGroup: number | null; // 1-4
  readonly additivesCount: number;
  readonly additivesHalalRelevant: string[]; // e.g. ["E904", "E471"]
}

// ── Personal Alert ──

export interface PersonalAlertV2 {
  readonly type: "allergen" | "pregnancy" | "health";
  readonly severity: "high" | "medium" | "low";
  readonly title: string;
  readonly description: string;
  readonly iconName?: string;
}

// ── Boycott Alert ──

export interface BoycottAlertData {
  readonly brandName: string;
  readonly reason: string;
  readonly source: string;
  readonly sourceUrl?: string;
  readonly alternatives?: string[];
}

// ── Alternative Product ──

export interface AlternativeProductV2 {
  readonly barcode: string;
  readonly name: string;
  readonly brand: string;
  readonly imageUrl: string | null;
  readonly score: number;
  readonly verdict: HalalVerdict;
  readonly certifierName: string | null;
}

// ── Algorithmic Trace ──

export interface AlgorithmicTraceStep {
  readonly module: string;
  readonly input: string;
  readonly output: string;
  readonly durationMs: number;
  readonly decision: string;
}

// ── Verdict UI Level (maps score ranges to display tiers) ──

export type VerdictLevel = "HALAL" | "PRUDENCE" | "MASHBOOH" | "A_EVITER" | "HARAM";
