import { db } from "../../db/index.js";
import { substanceDossiers } from "../../db/schema/substance-dossiers.js";
import { eq, and, inArray } from "drizzle-orm";
import type { IDossierRepo, SubstanceDossierView } from "../../domain/ports/dossier-repo.js";

export class DrizzleDossierRepo implements IDossierRepo {
  async getActive(substanceId: string): Promise<SubstanceDossierView | null> {
    const [row] = await db.select().from(substanceDossiers)
      .where(and(eq(substanceDossiers.substanceId, substanceId), eq(substanceDossiers.isActive, true)))
      .limit(1);
    return row ? this.toView(row) : null;
  }

  async batchGetActive(substanceIds: string[]): Promise<Map<string, SubstanceDossierView>> {
    if (substanceIds.length === 0) return new Map();
    const rows = await db.select().from(substanceDossiers)
      .where(and(inArray(substanceDossiers.substanceId, substanceIds), eq(substanceDossiers.isActive, true)));
    const map = new Map<string, SubstanceDossierView>();
    for (const row of rows) map.set(row.substanceId, this.toView(row));
    return map;
  }

  private toView(row: typeof substanceDossiers.$inferSelect): SubstanceDossierView {
    return {
      id: row.id,
      substanceId: row.substanceId,
      version: row.version,
      dossierJson: row.dossierJson as Record<string, unknown>,
      contentHash: row.contentHash,
      fatwaCount: row.fatwaCount,
    };
  }
}
