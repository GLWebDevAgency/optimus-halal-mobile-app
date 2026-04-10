import { db } from "../../db/index.js";
import { substanceScenarios } from "../../db/schema/substance-scenarios.js";
import { eq, inArray } from "drizzle-orm";
import type { IScenarioRepo, SubstanceScenarioView } from "../../domain/ports/scenario-repo.js";

export class DrizzleScenarioRepo implements IScenarioRepo {
  async forSubstance(substanceId: string): Promise<SubstanceScenarioView[]> {
    const rows = await db.select().from(substanceScenarios)
      .where(eq(substanceScenarios.substanceId, substanceId));
    return rows.map(r => this.toView(r));
  }

  async batchForSubstances(substanceIds: string[]): Promise<Map<string, SubstanceScenarioView[]>> {
    if (substanceIds.length === 0) return new Map();
    const rows = await db.select().from(substanceScenarios)
      .where(inArray(substanceScenarios.substanceId, substanceIds));
    const map = new Map<string, SubstanceScenarioView[]>();
    for (const row of rows) {
      const existing = map.get(row.substanceId) ?? [];
      existing.push(this.toView(row));
      map.set(row.substanceId, existing);
    }
    return map;
  }

  private toView(row: typeof substanceScenarios.$inferSelect): SubstanceScenarioView {
    return {
      substanceId: row.substanceId,
      scenarioKey: row.scenarioKey,
      matchConditions: row.matchConditions as Record<string, unknown>,
      specificity: row.specificity,
      score: row.score,
      verdict: row.verdict,
      rationaleFr: row.rationaleFr,
      rationaleEn: row.rationaleEn ?? null,
      rationaleAr: row.rationaleAr ?? null,
      dossierSectionRef: row.dossierSectionRef ?? null,
    };
  }
}
