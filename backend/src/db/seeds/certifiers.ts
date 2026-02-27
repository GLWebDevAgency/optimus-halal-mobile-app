/**
 * Certifier Seed — from certification-list.json
 *
 * Loads 18 French halal certifiers with RAW practice flags only.
 * Trust scores are NOT pre-computed here — they are computed at runtime
 * by certifier-score.service.ts using dynamic controversy penalty.
 *
 * The DB columns (trustScore, trustScoreHanafi, etc.) are seeded as 0
 * and serve as a materialized cache for list endpoints (history).
 * The authoritative source is always the runtime engine.
 *
 * Designed for idempotent upsert via ON CONFLICT.
 */

import type { NewCertifier } from "../schema/certifiers.js";

interface CertificationEntry {
  id: string;
  name: string;
  website: string;
  creationYear: number | null;
  controllersAreEmployees: boolean | null;
  controllersPresentEachProduction: boolean | null;
  hasSalariedSlaughterers: boolean | null;
  acceptsMechanicalPoultrySlaughter: boolean | null;
  acceptsPoultryElectronarcosis: boolean | null;
  acceptsPoultryElectrocutionPostSlaughter: boolean | null;
  acceptsStunningForCattleCalvesLambs: boolean | null;
  acceptsVsm: boolean | null;
  // V4: Transparency indicators
  transparencyPublicCharter: boolean | null;
  transparencyAuditReports: boolean | null;
  transparencyCompanyList: boolean | null;
  "halal-assessment": boolean | null;
  controversyPenalty: number;
  notes: string[];
}

function transformCertifier(entry: CertificationEntry): NewCertifier {
  return {
    id: entry.id,
    name: entry.name.trim(),
    website: entry.website?.trim() || null,
    creationYear: entry.creationYear,
    // Raw practice flags — stored as-is, NOT used to pre-compute scores
    controllersAreEmployees: entry.controllersAreEmployees,
    controllersPresentEachProduction: entry.controllersPresentEachProduction,
    hasSalariedSlaughterers: entry.hasSalariedSlaughterers,
    acceptsMechanicalSlaughter: entry.acceptsMechanicalPoultrySlaughter,
    acceptsElectronarcosis: entry.acceptsPoultryElectronarcosis,
    acceptsPostSlaughterElectrocution: entry.acceptsPoultryElectrocutionPostSlaughter,
    acceptsStunning: entry.acceptsStunningForCattleCalvesLambs,
    acceptsVsm: entry.acceptsVsm,
    // V4: Transparency indicators
    transparencyPublicCharter: entry.transparencyPublicCharter ?? null,
    transparencyAuditReports: entry.transparencyAuditReports ?? null,
    transparencyCompanyList: entry.transparencyCompanyList ?? null,
    // Static controversy penalty from JSON (legacy — runtime uses certifier_events)
    controversyPenalty: entry.controversyPenalty ?? 0,
    halalAssessment: entry["halal-assessment"] ?? false,
    // Score columns default to 0 — runtime engine is the source of truth
    trustScore: 0,
    trustScoreHanafi: 0,
    trustScoreShafii: 0,
    trustScoreMaliki: 0,
    trustScoreHanbali: 0,
    notes: entry.notes?.length ? entry.notes : null,
    isActive: true,
  };
}

export async function loadCertifierSeedData(): Promise<NewCertifier[]> {
  const raw: CertificationEntry[] = await import(
    "../../../asset/certification-list.json",
    { with: { type: "json" } }
  ).then((m) => m.default);

  return raw.map(transformCertifier);
}
