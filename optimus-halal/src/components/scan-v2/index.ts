/**
 * Scan V2 Components — Barrel Export
 *
 * New V2 scan result screen components, used alongside
 * the existing V1 components behind a feature flag.
 *
 * @module components/scan-v2
 */

// ── Types & Utils ──
export type * from "./scan-v2-types";
export * from "./scan-v2-utils";

// ── Atoms ──
export { TrustGradeBadge } from "./TrustGradeBadge";
export { MadhabChip } from "./MadhabChip";
export { NaqiyPlusUpsell } from "./NaqiyPlusUpsell";

// ── Row Components ──
export { SubstanceSignalRow } from "./SubstanceSignalRow";
export { PracticeSignalRow } from "./PracticeSignalRow";

// ── Cards ──
export { HalalVerdictCard } from "./HalalVerdictCard";
export { CertifierTrustCard } from "./CertifierTrustCard";
export { HealthSummaryCard } from "./HealthSummaryCard";
export { PersonalAlertsCard } from "./PersonalAlertsCard";
export { BoycottAlertCard } from "./BoycottAlertCard";
export { AlternativesRail } from "./AlternativesRail";
export { AlgorithmicTraceCard } from "./AlgorithmicTraceCard";

// ── Bottom Sheets ──
export { SubstanceDetailSheet } from "./SubstanceDetailSheet";
export { CertifierDetailSheet } from "./CertifierDetailSheet";
