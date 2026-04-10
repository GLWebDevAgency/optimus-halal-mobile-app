import { db } from "../../db/index.js";
import { substanceMatchPatterns } from "../../db/schema/substance-match-patterns.js";
import type { IMatchPatternRepo, MatchPatternView } from "../../domain/ports/match-pattern-repo.js";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export class DrizzleMatchPatternRepo implements IMatchPatternRepo {
  private cache: MatchPatternView[] | null = null;
  private cacheExpiry = 0;

  async getAllActive(): Promise<MatchPatternView[]> {
    const now = Date.now();
    if (this.cache && now < this.cacheExpiry) {
      return this.cache;
    }

    const rows = await db.select().from(substanceMatchPatterns);
    this.cache = rows.map(r => this.toView(r));
    this.cacheExpiry = now + CACHE_TTL_MS;
    return this.cache;
  }

  private toView(row: typeof substanceMatchPatterns.$inferSelect): MatchPatternView {
    return {
      substanceId: row.substanceId,
      patternType: row.patternType,
      patternValue: row.patternValue,
      lang: row.lang ?? null,
      priority: row.priority,
      confidence: row.confidence,
    };
  }
}
