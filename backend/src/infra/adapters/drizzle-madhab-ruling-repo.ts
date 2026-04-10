import { db } from "../../db/index.js";
import { substanceMadhabRulings } from "../../db/schema/substance-madhab-rulings.js";
import { eq, and, inArray } from "drizzle-orm";
import type { IMadhabRulingRepo, MadhabRulingView } from "../../domain/ports/madhab-ruling-repo.js";

export class DrizzleMadhabRulingRepo implements IMadhabRulingRepo {
  async get(substanceId: string, madhab: string): Promise<MadhabRulingView | null> {
    const [row] = await db.select().from(substanceMadhabRulings)
      .where(and(
        eq(substanceMadhabRulings.substanceId, substanceId),
        eq(substanceMadhabRulings.madhab, madhab),
      ))
      .limit(1);
    return row ? this.toView(row) : null;
  }

  async batchGet(substanceIds: string[], madhab: string): Promise<Map<string, MadhabRulingView>> {
    if (substanceIds.length === 0) return new Map();
    const rows = await db.select().from(substanceMadhabRulings)
      .where(and(
        inArray(substanceMadhabRulings.substanceId, substanceIds),
        eq(substanceMadhabRulings.madhab, madhab),
      ));
    const map = new Map<string, MadhabRulingView>();
    for (const row of rows) map.set(row.substanceId, this.toView(row));
    return map;
  }

  private toView(row: typeof substanceMadhabRulings.$inferSelect): MadhabRulingView {
    return {
      substanceId: row.substanceId,
      madhab: row.madhab,
      ruling: row.ruling,
      contemporarySplit: row.contemporarySplit,
      classicalSources: row.classicalSources ?? [],
      contemporarySources: row.contemporarySources ?? [],
    };
  }
}
