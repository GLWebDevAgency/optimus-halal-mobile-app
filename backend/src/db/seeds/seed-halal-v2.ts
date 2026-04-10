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
import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
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

      // Upsert substance
      await db.execute(sql`
        INSERT INTO substances (id, slug, name_fr, name_en, name_ar, e_numbers, tier, priority_score, fiqh_issues, issue_type, is_active, created_at)
        VALUES (
          ${parsed.substance.id},
          ${parsed.substance.slug},
          ${parsed.substance.nameFr},
          ${parsed.substance.nameEn},
          ${parsed.substance.nameAr},
          ${parsed.substance.eNumbers},
          ${parsed.substance.tier},
          ${parsed.substance.priorityScore},
          ${parsed.substance.fiqhIssues},
          ${parsed.substance.issueType},
          ${parsed.substance.isActive},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          name_fr = EXCLUDED.name_fr,
          name_en = EXCLUDED.name_en,
          name_ar = EXCLUDED.name_ar,
          e_numbers = EXCLUDED.e_numbers,
          tier = EXCLUDED.tier,
          priority_score = EXCLUDED.priority_score,
          fiqh_issues = EXCLUDED.fiqh_issues,
          issue_type = EXCLUDED.issue_type,
          is_active = EXCLUDED.is_active
      `);
      counts.substances++;

      // Check content_hash to decide if dossier needs update
      const existing = await db.execute(sql`
        SELECT content_hash FROM substance_dossiers
        WHERE substance_id = ${parsed.dossier.substanceId}
          AND version = ${parsed.dossier.version}
        LIMIT 1
      `);

      if (existing.length > 0 && (existing[0] as Record<string, unknown>).content_hash === parsed.dossier.contentHash) {
        counts.dossiersSkipped++;
      } else {
        // Upsert dossier
        const dossierResult = await db.execute(sql`
          INSERT INTO substance_dossiers (substance_id, version, schema_version, dossier_json, content_hash, verified_at, verification_passes, fatwa_count, is_active, created_at)
          VALUES (
            ${parsed.dossier.substanceId},
            ${parsed.dossier.version},
            ${parsed.dossier.schemaVersion},
            ${JSON.stringify(parsed.dossier.dossierJson)}::jsonb,
            ${parsed.dossier.contentHash},
            ${parsed.dossier.verifiedAt},
            ${parsed.dossier.verificationPasses},
            ${parsed.dossier.fatwaCount},
            ${parsed.dossier.isActive},
            NOW()
          )
          ON CONFLICT (substance_id, version) DO UPDATE SET
            schema_version = EXCLUDED.schema_version,
            dossier_json = EXCLUDED.dossier_json,
            content_hash = EXCLUDED.content_hash,
            verified_at = EXCLUDED.verified_at,
            verification_passes = EXCLUDED.verification_passes,
            fatwa_count = EXCLUDED.fatwa_count,
            is_active = EXCLUDED.is_active
          RETURNING id
        `);
        counts.dossiers++;

        // Update active_dossier_id on substance if this dossier is active
        if (parsed.dossier.isActive && dossierResult.length > 0) {
          const dossierId = (dossierResult[0] as Record<string, unknown>).id as string;
          await db.execute(sql`
            UPDATE substances SET active_dossier_id = ${dossierId}::uuid
            WHERE id = ${parsed.substance.id}
          `);
        }

        // Delete old match patterns + scenarios for this substance, re-insert
        await db.execute(sql`
          DELETE FROM substance_match_patterns WHERE substance_id = ${parsed.substance.id}
        `);
        const patterns = extractMatchPatterns(parsed);
        for (const p of patterns) {
          await db.execute(sql`
            INSERT INTO substance_match_patterns (substance_id, pattern_type, pattern_value, lang, priority, confidence, source)
            VALUES (${p.substanceId}, ${p.patternType}, ${p.patternValue}, ${p.lang}, ${p.priority}, ${p.confidence}, ${p.source})
          `);
        }
        counts.matchPatterns += patterns.length;

        await db.execute(sql`
          DELETE FROM substance_scenarios WHERE substance_id = ${parsed.substance.id}
        `);
        const scenarios = extractScenarios(parsed);
        for (const s of scenarios) {
          await db.execute(sql`
            INSERT INTO substance_scenarios (substance_id, scenario_key, match_conditions, specificity, score, verdict, rationale_fr, rationale_en, rationale_ar, dossier_section_ref)
            VALUES (${s.substanceId}, ${s.scenarioKey}, ${JSON.stringify(s.matchConditions)}::jsonb, ${s.specificity}, ${s.score}, ${s.verdict}, ${s.rationaleFr}, ${s.rationaleEn}, ${s.rationaleAr}, ${s.dossierSectionRef})
          `);
        }
        counts.scenarios += scenarios.length;

        // Madhab rulings — upsert (composite PK)
        const rulings = extractMadhabRulings(parsed);
        for (const r of rulings) {
          await db.execute(sql`
            INSERT INTO substance_madhab_rulings (substance_id, madhab, ruling, contemporary_split, classical_sources, contemporary_sources)
            VALUES (${r.substanceId}, ${r.madhab}, ${r.ruling}, ${r.contemporarySplit}, ${r.classicalSources}, ${r.contemporarySources})
            ON CONFLICT (substance_id, madhab) DO UPDATE SET
              ruling = EXCLUDED.ruling,
              contemporary_split = EXCLUDED.contemporary_split,
              classical_sources = EXCLUDED.classical_sources,
              contemporary_sources = EXCLUDED.contemporary_sources
          `);
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

        // Upsert practice_family
        await db.execute(sql`
          INSERT INTO practice_families (id, name_fr, name_en, is_active)
          VALUES (${familyId}, ${familyId}, ${familyId}, true)
          ON CONFLICT (id) DO NOTHING
        `);
        counts.practiceFamilies++;

        // Upsert practice
        const practiceId = practice.id as string;
        await db.execute(sql`
          INSERT INTO practices (id, slug, family_id, name_fr, name_en, name_ar, severity_tier, is_active, created_at)
          VALUES (
            ${practiceId},
            ${practiceId.toLowerCase()},
            ${familyId},
            ${practice.name_fr as string},
            ${practice.name_en as string},
            ${(practice.name_ar as string) ?? null},
            ${practice.severity_tier as number},
            true,
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            slug = EXCLUDED.slug,
            family_id = EXCLUDED.family_id,
            name_fr = EXCLUDED.name_fr,
            name_en = EXCLUDED.name_en,
            name_ar = EXCLUDED.name_ar,
            severity_tier = EXCLUDED.severity_tier
        `);
        counts.practices++;

        // Upsert practice dossier
        const dossierJsonStr = fs.readFileSync(path.join(familyPath, pFile), "utf8");
        const contentHash = createHash("sha256").update(dossierJsonStr).digest("hex");
        const version = (meta?.version as string) ?? "1.0.0";

        const existingPD = await db.execute(sql`
          SELECT content_hash FROM practice_dossiers
          WHERE practice_id = ${practiceId} AND version = ${version}
          LIMIT 1
        `);

        if (existingPD.length === 0 || (existingPD[0] as Record<string, unknown>).content_hash !== contentHash) {
          const pdResult = await db.execute(sql`
            INSERT INTO practice_dossiers (practice_id, version, schema_version, dossier_json, content_hash, is_active, created_at)
            VALUES (
              ${practiceId},
              ${version},
              ${"practice-dossier.v1"},
              ${dossierJsonStr}::jsonb,
              ${contentHash},
              true,
              NOW()
            )
            ON CONFLICT (practice_id, version) DO UPDATE SET
              dossier_json = EXCLUDED.dossier_json,
              content_hash = EXCLUDED.content_hash,
              is_active = EXCLUDED.is_active
            RETURNING id
          `);
          counts.practiceDossiers++;

          // Update active_dossier_id on practice
          if (pdResult.length > 0) {
            const dossierId = (pdResult[0] as Record<string, unknown>).id as string;
            await db.execute(sql`
              UPDATE practices SET active_dossier_id = ${dossierId}::uuid
              WHERE id = ${practiceId}
            `);
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
            await db.execute(sql`
              INSERT INTO practice_tuples (slug, family_id, dimensions, verdict_hanafi, verdict_maliki, verdict_shafii, verdict_hanbali, required_evidence, dossier_section_ref, fatwa_refs, typical_mortality_pct_min, typical_mortality_pct_max, notes_fr, notes_en, notes_ar, is_active, created_at)
              VALUES (
                ${tuple.slug},
                ${tuple.familyId},
                ${JSON.stringify(tuple.dimensions)}::jsonb,
                ${tuple.verdictHanafi},
                ${tuple.verdictMaliki},
                ${tuple.verdictShafii},
                ${tuple.verdictHanbali},
                ${tuple.requiredEvidence},
                ${tuple.dossierSectionRef},
                ${tuple.fatwaRefs},
                ${tuple.typicalMortalityPctMin},
                ${tuple.typicalMortalityPctMax},
                ${tuple.notesFr},
                ${tuple.notesEn},
                ${tuple.notesAr},
                true,
                NOW()
              )
              ON CONFLICT (slug) DO UPDATE SET
                family_id = EXCLUDED.family_id,
                dimensions = EXCLUDED.dimensions,
                verdict_hanafi = EXCLUDED.verdict_hanafi,
                verdict_maliki = EXCLUDED.verdict_maliki,
                verdict_shafii = EXCLUDED.verdict_shafii,
                verdict_hanbali = EXCLUDED.verdict_hanbali,
                required_evidence = EXCLUDED.required_evidence,
                dossier_section_ref = EXCLUDED.dossier_section_ref,
                fatwa_refs = EXCLUDED.fatwa_refs,
                typical_mortality_pct_min = EXCLUDED.typical_mortality_pct_min,
                typical_mortality_pct_max = EXCLUDED.typical_mortality_pct_max,
                notes_fr = EXCLUDED.notes_fr,
                notes_en = EXCLUDED.notes_en,
                notes_ar = EXCLUDED.notes_ar
            `);
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
