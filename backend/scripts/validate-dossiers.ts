#!/usr/bin/env tsx
/**
 * Naqiy Halal Engine V2 — Dossier validator.
 *
 * Loads all JSON Schemas from backend/src/schemas/halal-v2/
 * and validates every dossier JSON found in docs/naqiy/.../dossiers_v2/.
 * Exits 0 if all dossiers pass, non-zero otherwise.
 *
 * Also exported as a module for unit tests.
 */

import Ajv, { type ErrorObject, type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMAS_DIR = path.resolve(__dirname, "..", "src", "schemas", "halal-v2");
const DOSSIERS_ROOT = path.resolve(
  __dirname,
  "..", "..",
  "docs", "naqiy", "dossiers-recherches-naqiy", "dossiers_v2",
);

type SchemaKey =
  | "substance-dossier"
  | "practice-dossier"
  | "practice-tuple"
  | "match-pattern"
  | "scenario"
  | "evaluation-trace"
  | "gemini-semantic";

export type SchemaMap = Record<SchemaKey, ValidateFunction>;

export interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[];
}

export function loadSchemas(): SchemaMap {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  const keys: SchemaKey[] = [
    "substance-dossier",
    "practice-dossier",
    "practice-tuple",
    "match-pattern",
    "scenario",
    "evaluation-trace",
    "gemini-semantic",
  ];

  const map = {} as SchemaMap;
  for (const key of keys) {
    const file = path.join(SCHEMAS_DIR, `${key}.schema.v1.json`);
    if (!fs.existsSync(file)) {
      throw new Error(`Schema file not found: ${file}`);
    }
    const raw = fs.readFileSync(file, "utf8");
    const schema = JSON.parse(raw);
    map[key] = ajv.compile(schema);
  }
  return map;
}

export function validateDossier(
  doc: unknown,
  schemaKey: SchemaKey,
  schemas: SchemaMap,
): ValidationResult {
  const validate = schemas[schemaKey];
  const valid = validate(doc) as boolean;
  return {
    valid,
    errors: validate.errors ?? [],
  };
}

interface DossierFile {
  path: string;
  relPath: string;
  schemaKey: SchemaKey;
}

function discoverDossierFiles(): DossierFile[] {
  const files: DossierFile[] = [];

  // Substance dossiers: dossiers_v2/json/naqiy_dossier_*.json
  const jsonDir = path.join(DOSSIERS_ROOT, "json");
  if (fs.existsSync(jsonDir)) {
    for (const entry of fs.readdirSync(jsonDir)) {
      if (entry.endsWith(".json") && entry.startsWith("naqiy_dossier_")) {
        files.push({
          path: path.join(jsonDir, entry),
          relPath: path.join("dossiers_v2", "json", entry),
          schemaKey: inferSchemaKey(entry),
        });
      }
    }
  }

  // Practice dossiers + tuples: dossiers_v2/practices/<family>/
  const practicesDir = path.join(DOSSIERS_ROOT, "practices");
  if (fs.existsSync(practicesDir)) {
    for (const family of fs.readdirSync(practicesDir)) {
      const familyDir = path.join(practicesDir, family);
      if (!fs.statSync(familyDir).isDirectory()) continue;

      // practice_*.json → practice-dossier
      for (const entry of fs.readdirSync(familyDir)) {
        if (entry.startsWith("practice_") && entry.endsWith(".json")) {
          files.push({
            path: path.join(familyDir, entry),
            relPath: path.join("dossiers_v2", "practices", family, entry),
            schemaKey: "practice-dossier",
          });
        }
      }

      // tuples/tuples_*.json → practice-tuple
      const tuplesDir = path.join(familyDir, "tuples");
      if (fs.existsSync(tuplesDir)) {
        for (const entry of fs.readdirSync(tuplesDir)) {
          if (entry.startsWith("tuples_") && entry.endsWith(".json")) {
            files.push({
              path: path.join(tuplesDir, entry),
              relPath: path.join(
                "dossiers_v2", "practices", family, "tuples", entry,
              ),
              schemaKey: "practice-tuple",
            });
          }
        }
      }
    }
  }

  return files;
}

function inferSchemaKey(filename: string): SchemaKey {
  // All naqiy_dossier_*.json in dossiers_v2/json/ are substance dossiers
  // (legacy practice dossiers there get moved to practices/ in Task 12)
  return "substance-dossier";
}

async function main(): Promise<void> {
  const schemas = loadSchemas();
  const files = discoverDossierFiles();

  console.log(`[validate-dossiers] ${files.length} dossier files found`);

  let failed = 0;
  for (const f of files) {
    const raw = fs.readFileSync(f.path, "utf8");
    let doc: unknown;
    try {
      doc = JSON.parse(raw);
    } catch (err) {
      console.error(`❌ ${f.relPath}: invalid JSON — ${(err as Error).message}`);
      failed++;
      continue;
    }

    const result = validateDossier(doc, f.schemaKey, schemas);
    if (result.valid) {
      console.log(`✓  ${f.relPath} (${f.schemaKey})`);
    } else {
      failed++;
      console.error(`❌ ${f.relPath} (${f.schemaKey})`);
      for (const err of result.errors) {
        console.error(`   at ${err.instancePath || "/"}: ${err.message}`);
      }
    }
  }

  if (failed > 0) {
    console.error(`\n[validate-dossiers] FAILED — ${failed}/${files.length} dossiers invalid`);
    process.exit(1);
  }
  console.log(`\n[validate-dossiers] OK — all ${files.length} dossiers valid`);
}

// Only run main() when executed directly, not when imported by tests
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
