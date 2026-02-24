/**
 * Certifier Seed — from certification-list.json
 *
 * Loads 18 French halal certifiers with computed trust scores.
 * Designed for idempotent upsert via ON CONFLICT.
 */

import type { NewCertifier } from "../schema/certifiers.js";
import { computeAllTrustScores } from "../schema/certifiers.js";

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
  "halal-assessment": boolean | null;
  notes: string[];
}

function transformCertifier(entry: CertificationEntry): NewCertifier {
  const scores = computeAllTrustScores(entry);

  return {
    id: entry.id,
    name: entry.name.trim(),
    website: entry.website?.trim() || null,
    creationYear: entry.creationYear,
    controllersAreEmployees: entry.controllersAreEmployees,
    controllersPresentEachProduction: entry.controllersPresentEachProduction,
    hasSalariedSlaughterers: entry.hasSalariedSlaughterers,
    acceptsMechanicalSlaughter: entry.acceptsMechanicalPoultrySlaughter,
    acceptsElectronarcosis: entry.acceptsPoultryElectronarcosis,
    acceptsPostSlaughterElectrocution: entry.acceptsPoultryElectrocutionPostSlaughter,
    acceptsStunning: entry.acceptsStunningForCattleCalvesLambs,
    halalAssessment: entry["halal-assessment"] ?? false,
    ...scores,
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
