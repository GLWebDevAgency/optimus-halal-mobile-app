import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs";
import {
  loadSchemas,
  validateDossier,
  type ValidationResult,
} from "../../../scripts/validate-dossiers.js";

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures", "dossiers");

function loadFixture(name: string): unknown {
  const raw = fs.readFileSync(path.join(FIXTURES_DIR, name), "utf8");
  return JSON.parse(raw);
}

describe("validate-dossiers", () => {
  it("loads all 7 schemas from src/schemas/halal-v2", () => {
    const schemas = loadSchemas();
    expect(Object.keys(schemas).sort()).toEqual([
      "evaluation-trace",
      "gemini-semantic",
      "match-pattern",
      "practice-dossier",
      "practice-tuple",
      "scenario",
      "substance-dossier",
    ]);
  });

  it("accepts a valid substance dossier", () => {
    const schemas = loadSchemas();
    const doc = loadFixture("valid-substance.json");
    const result: ValidationResult = validateDossier(
      doc,
      "substance-dossier",
      schemas,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects a substance dossier missing meta.dossier_id", () => {
    const schemas = loadSchemas();
    const doc = loadFixture("invalid-substance-missing-id.json");
    const result = validateDossier(doc, "substance-dossier", schemas);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.instancePath.includes("meta"))).toBe(true);
  });

  it("rejects a substance dossier with global_score out of range", () => {
    const schemas = loadSchemas();
    const doc = loadFixture("invalid-substance-bad-score.json");
    const result = validateDossier(doc, "substance-dossier", schemas);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.instancePath.includes("global_score")),
    ).toBe(true);
  });
});
