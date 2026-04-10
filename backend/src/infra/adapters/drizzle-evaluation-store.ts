/**
 * DrizzleEvaluationStore — Adapter for halal_evaluations table.
 *
 * Single INSERT (C5), returns generated UUID.
 * Uses module-scoped db import (same pattern as other Drizzle adapters).
 */

import { db } from "../../db/index.js";
import { halalEvaluations } from "../../db/schema/halal-evaluations.js";
import type { IEvaluationStore, EvaluationRecord } from "../../domain/ports/evaluation-store.js";

export class DrizzleEvaluationStore implements IEvaluationStore {
  async persist(record: EvaluationRecord): Promise<string> {
    const [row] = await db
      .insert(halalEvaluations)
      .values({
        scanId: record.scanId,
        productId: record.productId,
        userId: record.userId,
        engineVersion: record.engineVersion,
        userMadhab: record.userMadhab,
        userStrictness: record.userStrictness,
        userTier: record.userTier,
        track: record.track,
        modulesFired: record.modulesFired,
        finalScore: record.finalScore,
        finalVerdict: record.finalVerdict,
        status: record.status,
        degradationReason: record.degradationReason,
        trace: record.trace,
        durationMs: record.durationMs,
      })
      .returning({ id: halalEvaluations.id });

    return row.id;
  }
}
