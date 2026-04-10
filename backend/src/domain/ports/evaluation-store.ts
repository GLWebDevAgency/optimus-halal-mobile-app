/**
 * IEvaluationStore — Port for persisting halal evaluation records.
 *
 * Each scan → exactly one halal_evaluations row (C5: single INSERT).
 * The orchestrator builds the record; the adapter just persists.
 */

export interface EvaluationRecord {
  scanId: string | null;
  productId: string | null;
  userId: string | null;
  engineVersion: string;
  userMadhab: string | null;
  userStrictness: string | null;
  userTier: string | null;
  track: "certified" | "analyzed";
  modulesFired: string[];
  finalScore: number | null;
  finalVerdict: string | null;
  status: "ok" | "degraded" | "failed";
  degradationReason: string | null;
  trace: Record<string, unknown>;
  durationMs: number | null;
}

export interface IEvaluationStore {
  /** Persist a single evaluation record. Returns the generated UUID. */
  persist(record: EvaluationRecord): Promise<string>;
}
