/**
 * Halal Engine V2 — Seed dossier data into DB
 *
 * Reads compiled dossier JSONs and upserts into substances, dossiers,
 * match_patterns, scenarios, madhab_rulings, practice families/tuples.
 *
 * Idempotent via content_hash comparison — skips unchanged dossiers.
 * Gated behind HALAL_V2_SEED=true env var in run-all.ts.
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  substances,
  substanceDossiers,
  substanceMatchPatterns,
  substanceScenarios,
  substanceMadhabRulings,
  practiceFamilies,
  practices,
  practiceDossiers,
  practiceTuples,
} from "../schema/index.js";
import {
  parseSubstanceDossier,
  extractMatchPatterns,
  extractScenarios,
  extractMadhabRulings,
  parsePracticeTuples,
} from "./compile-dossiers.js";

const DOSSIERS_ROOT = path.resolve(
  __dirname, "..", "..", "..", "..",
  "docs", "naqiy", "dossiers-recherches-naqiy", "dossiers_v2",
);

const JSON_DIR = path.join(DOSSIERS_ROOT, "json");
const PRACTICES_DIR = path.join(DOSSIERS_ROOT, "practices");

interface SeedCounts {
  substances: number;
  dossiers: number;
  dossiersSkipped: number;
  matchPatterns: number;
  scenarios: number;
  madhabRulings: number;
  practiceFamilies: number;
  practices: number;
  practiceDossiers: number;
  practiceTuples: number;
}

export async function seedHalalV2(db: PostgresJsDatabase): Promise<number> {
  const counts: SeedCounts = {
    substances: 0,
    dossiers: 0,
    dossiersSkipped: 0,
    matchPatterns: 0,
    scenarios: 0,
    madhabRulings: 0,
    practiceFamilies: 0,
    practices: 0,
    practiceDossiers: 0,
    practiceTuples: 0,
  };

  // ── 1. Substance dossiers ──────────────────────────────────────────
  if (fs.existsSync(JSON_DIR)) {
    const files = fs.readdirSync(JSON_DIR)
      .filter((f) => f.endsWith(".json") && f.startsWith("naqiy_dossier_"));

    for (const file of files) {
      const filePath = path.join(JSON_DIR, file);
      const parsed = parseSubstanceDossier(filePath);
      if (!parsed) {
        console.log(`      [skip] ${file}: parse returned null`);
        continue;
      }

      // Upsert substance using Drizzle ORM
      // Drizzle handles JS arrays properly via postgres.js driver
      await (db as any).insert(substances)
        .values({
          id: parsed.substance.id,
          slug: parsed.substance.slug,
          nameFr: parsed.substance.nameFr,
          nameEn: parsed.substance.nameEn,
          nameAr: parsed.substance.nameAr ?? null,
          eNumbers: parsed.substance.eNumbers ?? [],
          tier: parsed.substance.tier,
          priorityScore: parsed.substance.priorityScore,
          fiqhIssues: parsed.substance.fiqhIssues ?? [],
          issueType: parsed.substance.issueType,
          isActive: parsed.substance.isActive,
        })
        .onConflictDoUpdate({
          target: substances.id,
          set: {
            slug: parsed.substance.slug,
            nameFr: parsed.substance.nameFr,
            nameEn: parsed.substance.nameEn,
            nameAr: parsed.substance.nameAr ?? null,
            eNumbers: parsed.substance.eNumbers ?? [],
            tier: parsed.substance.tier,
            priorityScore: parsed.substance.priorityScore,
            fiqhIssues: parsed.substance.fiqhIssues ?? [],
            issueType: parsed.substance.issueType,
            isActive: parsed.substance.isActive,
          },
        });
      counts.substances++;

      // Check content_hash to decide if dossier needs update
      const existing = await (db as any)
        .select({ contentHash: substanceDossiers.contentHash })
        .from(substanceDossiers)
        .where(
          eq(substanceDossiers.substanceId, parsed.dossier.substanceId)
        )
        .where(
          eq(substanceDossiers.version, parsed.dossier.version)
        )
        .limit(1);

      if (existing.length > 0 && existing[0].contentHash === parsed.dossier.contentHash) {
        counts.dossiersSkipped++;
      } else {
        // Upsert dossier using Drizzle ORM
        const dossierResult = await (db as any).insert(substanceDossiers)
          .values({
            substanceId: parsed.dossier.substanceId,
            version: parsed.dossier.version,
            schemaVersion: parsed.dossier.schemaVersion,
            dossierJson: parsed.dossier.dossierJson,
            contentHash: parsed.dossier.contentHash,
            verifiedAt: parsed.dossier.verifiedAt,
            verificationPasses: parsed.dossier.verificationPasses,
            fatwaCount: parsed.dossier.fatwaCount,
            isActive: parsed.dossier.isActive,
          })
          .onConflictDoUpdate({
            target: [substanceDossiers.substanceId, substanceDossiers.version],
            set: {
              schemaVersion: parsed.dossier.schemaVersion,
              dossierJson: parsed.dossier.dossierJson,
              contentHash: parsed.dossier.contentHash,
              verifiedAt: parsed.dossier.verifiedAt,
              verificationPasses: parsed.dossier.verificationPasses,
              fatwaCount: parsed.dossier.fatwaCount,
              isActive: parsed.dossier.isActive,
            },
          })
          .returning({ id: substanceDossiers.id });
        counts.dossiers++;

        // Update active_dossier_id on substance if this dossier is active
        if (parsed.dossier.isActive && dossierResult.length > 0) {
          const dossierId = dossierResult[0].id;
          await (db as any).update(substances)
            .set({ activeDossierId: dossierId })
            .where(eq(substances.id, parsed.substance.id));
        }

        // Delete old match patterns + scenarios for this substance, re-insert
        await (db as any).delete(substanceMatchPatterns)
          .where(eq(substanceMatchPatterns.substanceId, parsed.substance.id));
        const patterns = extractMatchPatterns(parsed);
        for (const p of patterns) {
          await (db as any).insert(substanceMatchPatterns)
            .values({
              substanceId: p.substanceId,
              patternType: p.patternType,
              patternValue: p.patternValue,
              lang: p.lang,
              priority: p.priority,
              confidence: p.confidence,
              source: p.source,
            });
        }
        counts.matchPatterns += patterns.length;

        await (db as any).delete(substanceScenarios)
          .where(eq(substanceScenarios.substanceId, parsed.substance.id));
        const scenarios = extractScenarios(parsed);
        for (const s of scenarios) {
          await (db as any).insert(substanceScenarios)
            .values({
              substanceId: s.substanceId,
              scenarioKey: s.scenarioKey,
              matchConditions: s.matchConditions,
              specificity: s.specificity,
              score: s.score,
              verdict: s.verdict,
              rationaleFr: s.rationaleFr,
              rationaleEn: s.rationaleEn,
              rationaleAr: s.rationaleAr,
              dossierSectionRef: s.dossierSectionRef,
            });
        }
        counts.scenarios += scenarios.length;

        // Madhab rulings — upsert (composite PK)
        const rulings = extractMadhabRulings(parsed);
        for (const r of rulings) {
          await (db as any).insert(substanceMadhabRulings)
            .values({
              substanceId: r.substanceId,
              madhab: r.madhab,
              ruling: r.ruling,
              contemporarySplit: r.contemporarySplit,
              classicalSources: r.classicalSources ?? [],
              contemporarySources: r.contemporarySources ?? [],
            })
            .onConflictDoUpdate({
              target: [substanceMadhabRulings.substanceId, substanceMadhabRulings.madhab],
              set: {
                ruling: r.ruling,
                contemporarySplit: r.contemporarySplit,
                classicalSources: r.classicalSources ?? [],
                contemporarySources: r.contemporarySources ?? [],
              },
            });
        }
        counts.madhabRulings += rulings.length;
      }
    }
  } else {
    console.log(`      [warn] Substance JSON dir not found: ${JSON_DIR}`);
  }

  // ── 2. Practice families + practices + dossiers + tuples ───────────
  if (fs.existsSync(PRACTICES_DIR)) {
    const familyDirs = fs.readdirSync(PRACTICES_DIR)
      .filter((d) => fs.statSync(path.join(PRACTICES_DIR, d)).isDirectory());

    for (const familyDir of familyDirs) {
      const familyPath = path.join(PRACTICES_DIR, familyDir);

      // Find practice_*.json file
      const practiceFiles = fs.readdirSync(familyPath)
        .filter((f) => f.startsWith("practice_") && f.endsWith(".json"));

      for (const pFile of practiceFiles) {
        const practiceJson = JSON.parse(
          fs.readFileSync(path.join(familyPath, pFile), "utf8"),
        ) as Record<string, unknown>;

        const meta = practiceJson.meta as Record<string, unknown>;
        const practice = practiceJson.practice as Record<string, unknown>;
        const familyId = (meta?.practice_family as string) ?? familyDir;

        // Upsert practice_family using Drizzle ORM
        await (db as any).insert(practiceFamilies)
          .values({
            id: familyId,
            nameFr: familyId,
            nameEn: familyId,
            isActive: true,
          })
          .onConflictDoNothing();
        counts.practiceFamilies++;

        // Upsert practice using Drizzle ORM
        const practiceId = practice.id as string;
        await (db as any).insert(practices)
          .values({
            id: practiceId,
            slug: practiceId.toLowerCase(),
            familyId,
            nameFr: practice.name_fr as string,
            nameEn: practice.name_en as string,
            nameAr: (practice.name_ar as string) ?? null,
            severityTier: practice.severity_tier as number,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: practices.id,
            set: {
              slug: practiceId.toLowerCase(),
              familyId,
              nameFr: practice.name_fr as string,
              nameEn: practice.name_en as string,
              nameAr: (practice.name_ar as string) ?? null,
              severityTier: practice.severity_tier as number,
            },
          });
        counts.practices++;

        // Upsert practice dossier using Drizzle ORM
        const dossierJsonStr = fs.readFileSync(path.join(familyPath, pFile), "utf8");
        const contentHash = createHash("sha256").update(dossierJsonStr).digest("hex");
        const version = (meta?.version as string) ?? "1.0.0";

        const existingPD = await (db as any)
          .select({ contentHash: practiceDossiers.contentHash })
          .from(practiceDossiers)
          .where(eq(practiceDossiers.practiceId, practiceId))
          .where(eq(practiceDossiers.version, version))
          .limit(1);

        if (existingPD.length === 0 || existingPD[0].contentHash !== contentHash) {
          const dossierJson = JSON.parse(dossierJsonStr) as Record<string, unknown>;
          const pdResult = await (db as any).insert(practiceDossiers)
            .values({
              practiceId,
              version,
              schemaVersion: "practice-dossier.v1",
              dossierJson,
              contentHash,
              isActive: true,
            })
            .onConflictDoUpdate({
              target: [practiceDossiers.practiceId, practiceDossiers.version],
              set: {
                dossierJson,
                contentHash,
                isActive: true,
              },
            })
            .returning({ id: practiceDossiers.id });
          counts.practiceDossiers++;

          // Update active_dossier_id on practice
          if (pdResult.length > 0) {
            const dossierId = pdResult[0].id;
            await (db as any).update(practices)
              .set({ activeDossierId: dossierId })
              .where(eq(practices.id, practiceId));
          }
        }
      }

      // Find tuples file(s) in tuples/ subdirectory
      const tuplesDir = path.join(familyPath, "tuples");
      if (fs.existsSync(tuplesDir)) {
        const tupleFiles = fs.readdirSync(tuplesDir)
          .filter((f) => f.endsWith(".json"));

        for (const tFile of tupleFiles) {
          const tuples = parsePracticeTuples(path.join(tuplesDir, tFile));
          for (const tuple of tuples) {
            await (db as any).insert(practiceTuples)
              .values({
                slug: tuple.slug,
                familyId: tuple.familyId,
                dimensions: tuple.dimensions,
                verdictHanafi: tuple.verdictHanafi,
                verdictMaliki: tuple.verdictMaliki,
                verdictShafii: tuple.verdictShafii,
                verdictHanbali: tuple.verdictHanbali,
                requiredEvidence: tuple.requiredEvidence ?? [],
                dossierSectionRef: tuple.dossierSectionRef,
                fatwaRefs: tuple.fatwaRefs ?? [],
                typicalMortalityPctMin: tuple.typicalMortalityPctMin,
                typicalMortalityPctMax: tuple.typicalMortalityPctMax,
                notesFr: tuple.notesFr,
                notesEn: tuple.notesEn,
                notesAr: tuple.notesAr,
                isActive: true,
              })
              .onConflictDoUpdate({
                target: practiceTuples.slug,
                set: {
                  familyId: tuple.familyId,
                  dimensions: tuple.dimensions,
                  verdictHanafi: tuple.verdictHanafi,
                  verdictMaliki: tuple.verdictMaliki,
                  verdictShafii: tuple.verdictShafii,
                  verdictHanbali: tuple.verdictHanbali,
                  requiredEvidence: tuple.requiredEvidence ?? [],
                  dossierSectionRef: tuple.dossierSectionRef,
                  fatwaRefs: tuple.fatwaRefs ?? [],
                  typicalMortalityPctMin: tuple.typicalMortalityPctMin,
                  typicalMortalityPctMax: tuple.typicalMortalityPctMax,
                  notesFr: tuple.notesFr,
                  notesEn: tuple.notesEn,
                  notesAr: tuple.notesAr,
                },
              });
            counts.practiceTuples++;
          }
        }
      }
    }
  } else {
    console.log(`      [warn] Practices dir not found: ${PRACTICES_DIR}`);
  }

  // ── Summary ────────────────────────────────────────────────────────
  const total = counts.substances + counts.dossiers + counts.matchPatterns +
    counts.scenarios + counts.madhabRulings + counts.practiceFamilies +
    counts.practices + counts.practiceDossiers + counts.practiceTuples;

  console.log(`      Substances: ${counts.substances} upserted`);
  console.log(`      Dossiers: ${counts.dossiers} upserted, ${counts.dossiersSkipped} unchanged`);
  console.log(`      Match patterns: ${counts.matchPatterns}`);
  console.log(`      Scenarios: ${counts.scenarios}`);
  console.log(`      Madhab rulings: ${counts.madhabRulings}`);
  console.log(`      Practice families: ${counts.practiceFamilies}`);
  console.log(`      Practices: ${counts.practices}`);
  console.log(`      Practice dossiers: ${counts.practiceDossiers}`);
  console.log(`      Practice tuples: ${counts.practiceTuples}`);

  return total;
}

// ── CLI: run directly with `tsx src/db/seeds/seed-halal-v2.ts` ──
const isMainModule = process.argv[1]?.includes("seed-halal-v2");
if (isMainModule) {
  import("postgres").then(async (pg) => {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const dbUrl = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/optimus_halal";
    const client = pg.default(dbUrl, { max: 1 });
    const db = drizzle(client);
    console.log("[seed-halal-v2] Starting seed...");
    const total = await seedHalalV2(db as any);
    console.log(`[seed-halal-v2] Done — ${total} records seeded.`);
    await client.end();
    process.exit(0);
  }).catch((err) => {
    console.error("[seed-halal-v2] Fatal:", err);
    process.exit(1);
  });
}
