# Halal Engine V2 — Phase 0: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Freeze the V2 data contracts (7 JSON Schemas), fix structural defects in the 12 existing dossiers, enrich every substance dossier with `match_vocabulary`, seed the first pilot `practice_tuples` for the stunning family, and wire a CI workflow that blocks merges if any dossier violates the schemas.

**Architecture:** Pure data + validation layer. No engine code yet. No DB migrations. The output is a set of schema files, corrected dossiers, a validator script + vitest suite, and a GitHub Actions workflow. After Phase 0, every dossier in the repo is guaranteed schema-valid and every change to a dossier is gated by CI.

**Tech Stack:** TypeScript, Node 20+, `ajv` (JSON Schema validator), `ajv-formats`, vitest, tsx, GitHub Actions.

**Spec reference:** [docs/superpowers/specs/2026-04-09-halal-engine-v2-design.md](../specs/2026-04-09-halal-engine-v2-design.md), sections §3 (PTF), §5 (Gemini vocabulary), §15 (JSON Schemas), §17 Phase 0.

**Branch:** `feat/halal-engine-v2` (already created from `main`).

---

## File Structure

```
backend/
  src/
    schemas/
      halal-v2/
        substance-dossier.schema.v1.json        (Task 2)
        practice-dossier.schema.v1.json         (Task 3)
        practice-tuple.schema.v1.json           (Task 4)
        match-pattern.schema.v1.json            (Task 5)
        scenario.schema.v1.json                 (Task 6)
        evaluation-trace.schema.v1.json         (Task 7)
        gemini-semantic.schema.v1.json          (Task 8)
        README.md                               (Task 2)
  scripts/
    validate-dossiers.ts                        (Task 9)
  __tests__/
    unit/
      validate-dossiers.test.ts                 (Task 9)

docs/
  naqiy/
    dossiers-recherches-naqiy/
      dossiers_v2/
        json/
          naqiy_dossier_SHELLAC_v2.json         (Task 10 — fix id)
          naqiy_dossier_CARMINE_v2.json         (Task 11 — add match_vocabulary)
          naqiy_dossier_E471_v2.json            (Task 11)
          naqiy_dossier_GELATIN_v2.json         (Task 11)
          naqiy_dossier_RENNET_v2.json          (Task 11)
          naqiy_dossier_GLYCEROL_v2.json        (Task 11)
          naqiy_dossier_SOY_LECITHIN_v2.json    (Task 11)
          naqiy_dossier_ALCOHOL_FLAVORINGS_v2.json (Task 11)
          naqiy_dossier_LACTOSE_WHEY_v2.json    (Task 11)
          naqiy_dossier_STUNNED_MEAT_v2.json    (Task 12 — move to practices/)
          naqiy_dossier_MECHANICAL_SLAUGHTER_POULTRY_v2.json (Task 12)
          naqiy_dossier_AHL_KITAB_MEAT_v2.json  (Task 12)
        practices/                              (Task 12 — new folder)
          stunning/
            practice_STUNNING.json              (Task 12)
            tuples/
              tuples_stunning.json              (Task 13)

.github/
  workflows/
    validate-dossiers.yml                       (Task 14)
```

**Responsibilities:**
- `backend/src/schemas/halal-v2/*.json` — canonical JSON Schemas, versioned, hand-written, committed
- `backend/scripts/validate-dossiers.ts` — loads all dossier JSONs from `docs/naqiy/...`, validates each against its schema, exits non-zero on any violation
- `backend/src/__tests__/unit/validate-dossiers.test.ts` — unit test that invokes the validator against a fixture set (valid + intentionally broken) to guarantee the validator itself is correct
- `docs/naqiy/.../dossiers_v2/json/*.json` — existing substance dossiers, enriched with `match_vocabulary`, id bug fixed
- `docs/naqiy/.../dossiers_v2/practices/` — new directory for practice dossiers and their tuples
- `.github/workflows/validate-dossiers.yml` — CI gate; runs on every PR that touches dossiers or schemas

---

## Task 1: Install JSON Schema tooling

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1.1: Add ajv and ajv-formats as devDependencies**

Run from repo root:
```bash
cd backend && pnpm add -D ajv@^8.17.0 ajv-formats@^3.0.1
```

Expected: `package.json` gets two new entries under `devDependencies`. `pnpm-lock.yaml` updates.

- [ ] **Step 1.2: Verify installation**

```bash
cd backend && pnpm list ajv ajv-formats
```

Expected output contains:
```
ajv 8.17.x
ajv-formats 3.0.x
```

- [ ] **Step 1.3: Commit**

```bash
git add backend/package.json backend/pnpm-lock.yaml
git commit -m "chore(backend): add ajv + ajv-formats for V2 schema validation"
```

---

## Task 2: Create the substance-dossier JSON Schema

**Files:**
- Create: `backend/src/schemas/halal-v2/substance-dossier.schema.v1.json`
- Create: `backend/src/schemas/halal-v2/README.md`

- [ ] **Step 2.1: Create the schemas directory and README**

Create `backend/src/schemas/halal-v2/README.md` with:

```markdown
# Halal Engine V2 — JSON Schemas

Canonical schemas for the V2 dossier-anchored halal engine.
**These files are the source of truth.** Every dossier JSON in
`docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/` MUST validate
against the matching schema.

## Schemas

| File | Validates | Dossiers path |
|---|---|---|
| `substance-dossier.schema.v1.json` | Substance dossiers (shellac, carmine, e471, gelatin...) | `dossiers_v2/json/naqiy_dossier_*.json` |
| `practice-dossier.schema.v1.json` | Practice dossiers (stunning, mechanical slaughter, ahl kitab...) | `dossiers_v2/practices/*/practice_*.json` |
| `practice-tuple.schema.v1.json` | Tuple arrays (species × method × variant) | `dossiers_v2/practices/*/tuples/tuples_*.json` |
| `match-pattern.schema.v1.json` | Runtime match patterns (compiled from dossiers) | DB seed |
| `scenario.schema.v1.json` | Score_matrix scenarios (exploded from dossiers) | DB seed |
| `evaluation-trace.schema.v1.json` | `halal_evaluations.trace` audit log structure | DB row |
| `gemini-semantic.schema.v1.json` | Gemini V2 provider output contract | Runtime |

## Validation

Run locally: `cd backend && pnpm validate:dossiers`
CI: `.github/workflows/validate-dossiers.yml` blocks PRs on violation.

## Versioning

Schemas are versioned (`.v1.json`). Breaking changes create a new
version (`.v2.json`) and the old one stays active until all dossiers
migrate. Never edit a published schema in place.
```

- [ ] **Step 2.2: Write the substance-dossier schema**

Create `backend/src/schemas/halal-v2/substance-dossier.schema.v1.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://naqiy.app/schemas/halal-v2/substance-dossier.v1.json",
  "title": "Naqiy Substance Dossier V1",
  "description": "Canonical structure for a substance dossier (Tier 1-4 halal-sensitive ingredient). Each dossier file in dossiers_v2/json/ MUST validate against this schema.",
  "type": "object",
  "required": ["meta", "substance", "core_fiqhi_concepts", "fatwas_summary", "madhab_positions", "naqiy_position"],
  "additionalProperties": true,
  "properties": {
    "meta": {
      "type": "object",
      "required": ["dossier_id", "version", "generated_at", "language_primary", "languages"],
      "properties": {
        "dossier_id": { "type": "string", "pattern": "^SUBST-[0-9]{3}$" },
        "version": { "type": "string", "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$" },
        "generated_at": { "type": "string", "format": "date" },
        "language_primary": { "type": "string", "enum": ["fr", "en", "ar"] },
        "languages": {
          "type": "array",
          "items": { "type": "string", "enum": ["fr", "en", "ar"] },
          "minItems": 1
        },
        "generator": { "type": "string" },
        "anti_hallucination_protocol": { "type": "string" },
        "verification_passes": { "type": "integer", "minimum": 0 },
        "fatwas_verified_count": { "type": "integer", "minimum": 0 },
        "key_finding": { "type": "string" }
      }
    },
    "substance": {
      "type": "object",
      "required": ["id", "primary_name_fr", "primary_name_en", "issue_type", "match_vocabulary"],
      "properties": {
        "id": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]+$" },
        "primary_name_fr": { "type": "string", "minLength": 2 },
        "primary_name_en": { "type": "string", "minLength": 2 },
        "primary_name_ar": { "type": "string" },
        "e_number": { "type": ["string", "null"] },
        "ins_number": { "type": ["string", "null"] },
        "cas_number": { "type": ["string", "null"] },
        "source_organism": { "type": ["string", "null"] },
        "origin": { "type": ["string", "null"] },
        "issue_type": {
          "type": "string",
          "enum": ["INSECT", "ANIMAL_FAT", "ENZYME", "ALCOHOL", "SLAUGHTER", "SOURCE_IDENTIFICATION", "PROCESS", "OTHER"]
        },
        "description_fr": { "type": "string" },
        "match_vocabulary": {
          "type": "object",
          "required": ["canonical_fr", "canonical_en"],
          "properties": {
            "canonical_fr": { "type": "string", "minLength": 2 },
            "canonical_en": { "type": "string", "minLength": 2 },
            "canonical_ar": { "type": "string" },
            "synonyms_fr": { "type": "array", "items": { "type": "string" }, "default": [] },
            "synonyms_en": { "type": "array", "items": { "type": "string" }, "default": [] },
            "synonyms_ar": { "type": "array", "items": { "type": "string" }, "default": [] },
            "synonyms_other": {
              "type": "object",
              "patternProperties": {
                "^[a-z]{2}$": { "type": "array", "items": { "type": "string" } }
              },
              "additionalProperties": false
            },
            "e_numbers": { "type": "array", "items": { "type": "string", "pattern": "^E[0-9]{3,4}[a-z]?$" }, "default": [] },
            "off_tags": { "type": "array", "items": { "type": "string", "pattern": "^[a-z]{2}:[a-z0-9-]+$" }, "default": [] },
            "semantic_descriptors": { "type": "array", "items": { "type": "string" }, "default": [] },
            "disambiguation_hints": {
              "type": "object",
              "properties": {
                "not_to_confuse_with": { "type": "array", "items": { "type": "string" } },
                "context_clues": { "type": "array", "items": { "type": "string" } }
              }
            }
          }
        }
      }
    },
    "core_fiqhi_concepts": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["en", "fr", "principle"],
        "properties": {
          "ar": { "type": "string" },
          "en": { "type": "string" },
          "fr": { "type": "string" },
          "principle": { "type": "string" }
        }
      }
    },
    "fatwas_summary": {
      "type": "object",
      "required": ["halal_count", "haram_count"],
      "properties": {
        "halal_count": { "type": "integer", "minimum": 0 },
        "haram_count": { "type": "integer", "minimum": 0 },
        "halal_institutions": { "type": "array", "items": { "type": "object" } },
        "haram_institutions": { "type": "array", "items": { "type": "object" } }
      }
    },
    "madhab_positions": {
      "type": "object",
      "required": ["hanafi", "maliki", "shafi'i", "hanbali"],
      "properties": {
        "hanafi": { "type": "object" },
        "maliki": { "type": "object" },
        "shafi'i": { "type": "object" },
        "hanbali": { "type": "object" }
      }
    },
    "naqiy_position": {
      "type": "object",
      "required": ["global_score", "verdict_internal_ingestion"],
      "properties": {
        "global_score": { "type": "integer", "minimum": 0, "maximum": 100 },
        "verdict_internal_ingestion": { "type": "string" },
        "verdict_external_cosmetic": { "type": "string" },
        "rationale": { "type": "string" }
      }
    },
    "score_matrix": {
      "type": "object",
      "patternProperties": {
        "^scenario_": {
          "type": "object",
          "required": ["context", "score", "verdict", "rationale"],
          "properties": {
            "context": { "type": "string" },
            "score": { "type": "integer", "minimum": 0, "maximum": 100 },
            "verdict": { "type": "string" },
            "rationale": { "type": "string" }
          }
        }
      }
    }
  }
}
```

- [ ] **Step 2.3: Sanity check — JSON is valid**

```bash
cd backend && node -e "JSON.parse(require('fs').readFileSync('src/schemas/halal-v2/substance-dossier.schema.v1.json','utf8')); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 2.4: Commit**

```bash
git add backend/src/schemas/halal-v2/
git commit -m "feat(schemas): add substance-dossier v1 JSON schema + README"
```

---

## Task 3: Create the practice-dossier JSON Schema

**Files:**
- Create: `backend/src/schemas/halal-v2/practice-dossier.schema.v1.json`

- [ ] **Step 3.1: Write the practice-dossier schema**

Create `backend/src/schemas/halal-v2/practice-dossier.schema.v1.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://naqiy.app/schemas/halal-v2/practice-dossier.v1.json",
  "title": "Naqiy Practice Dossier V1",
  "description": "Structure for a practice dossier (stunning, mechanical slaughter, ahl kitab, etc.). Mirrors substance-dossier where possible. Tuples are in a separate file (see practice-tuple schema).",
  "type": "object",
  "required": ["meta", "practice", "core_fiqhi_concepts", "fatwas_summary", "madhab_positions", "naqiy_position"],
  "additionalProperties": true,
  "properties": {
    "meta": {
      "type": "object",
      "required": ["dossier_id", "version", "generated_at", "language_primary", "languages", "practice_family"],
      "properties": {
        "dossier_id": { "type": "string", "pattern": "^PRAC-[0-9]{3}$" },
        "version": { "type": "string", "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$" },
        "generated_at": { "type": "string", "format": "date" },
        "language_primary": { "type": "string", "enum": ["fr", "en", "ar"] },
        "languages": { "type": "array", "items": { "type": "string", "enum": ["fr", "en", "ar"] }, "minItems": 1 },
        "practice_family": {
          "type": "string",
          "enum": ["stunning", "mechanical_slaughter", "ahl_kitab", "tasmiya_protocol", "cross_contamination", "traceability", "transport_prestun", "supervision_model", "meat_origin_country", "blessing_invocation", "slaughterer_qualification", "post_slaughter_treatment"]
        },
        "verification_passes": { "type": "integer", "minimum": 0 },
        "fatwas_verified_count": { "type": "integer", "minimum": 0 }
      }
    },
    "practice": {
      "type": "object",
      "required": ["id", "name_fr", "name_en", "severity_tier"],
      "properties": {
        "id": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]+$" },
        "name_fr": { "type": "string", "minLength": 2 },
        "name_en": { "type": "string", "minLength": 2 },
        "name_ar": { "type": "string" },
        "severity_tier": { "type": "integer", "minimum": 1, "maximum": 4 },
        "description_fr": { "type": "string" }
      }
    },
    "core_fiqhi_concepts": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["en", "fr", "principle"]
      }
    },
    "fatwas_summary": {
      "type": "object",
      "required": ["halal_count", "haram_count"]
    },
    "madhab_positions": {
      "type": "object",
      "required": ["hanafi", "maliki", "shafi'i", "hanbali"]
    },
    "naqiy_position": {
      "type": "object",
      "required": ["global_score", "verdict_default"],
      "properties": {
        "global_score": { "type": "integer", "minimum": 0, "maximum": 100 },
        "verdict_default": { "type": "string" },
        "rationale": { "type": "string" }
      }
    }
  }
}
```

- [ ] **Step 3.2: Sanity check**

```bash
cd backend && node -e "JSON.parse(require('fs').readFileSync('src/schemas/halal-v2/practice-dossier.schema.v1.json','utf8')); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3.3: Commit**

```bash
git add backend/src/schemas/halal-v2/practice-dossier.schema.v1.json
git commit -m "feat(schemas): add practice-dossier v1 JSON schema"
```

---

## Task 4: Create the practice-tuple JSON Schema

**Files:**
- Create: `backend/src/schemas/halal-v2/practice-tuple.schema.v1.json`

- [ ] **Step 4.1: Write the practice-tuple schema**

Create `backend/src/schemas/halal-v2/practice-tuple.schema.v1.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://naqiy.app/schemas/halal-v2/practice-tuple.v1.json",
  "title": "Naqiy Practice Tuple V1",
  "description": "Array of practice tuples for a single practice family. Each tuple is a scholarly-scored combination of (dimensions × madhab verdict × required evidence) with literal dossier traceback.",
  "type": "object",
  "required": ["practice_family", "source_dossier", "tuples"],
  "additionalProperties": false,
  "properties": {
    "practice_family": {
      "type": "string",
      "enum": ["stunning", "mechanical_slaughter", "ahl_kitab", "tasmiya_protocol", "cross_contamination", "traceability", "transport_prestun", "supervision_model", "meat_origin_country", "blessing_invocation", "slaughterer_qualification", "post_slaughter_treatment"]
    },
    "source_dossier": {
      "type": "object",
      "required": ["dossier_id", "version"],
      "properties": {
        "dossier_id": { "type": "string", "pattern": "^PRAC-[0-9]{3}$" },
        "version": { "type": "string" }
      }
    },
    "tuples": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["id", "dimensions", "verdicts", "dossier_section_ref", "fatwa_refs"],
        "additionalProperties": false,
        "properties": {
          "id": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]+$" },
          "dimensions": {
            "type": "object",
            "description": "Free-form JSON object describing the tuple dimensions. Schema-free to support arbitrary families.",
            "additionalProperties": true
          },
          "verdicts": {
            "type": "object",
            "required": ["hanafi", "maliki", "shafii", "hanbali"],
            "additionalProperties": false,
            "properties": {
              "hanafi": { "type": "integer", "minimum": 0, "maximum": 100 },
              "maliki": { "type": "integer", "minimum": 0, "maximum": 100 },
              "shafii": { "type": "integer", "minimum": 0, "maximum": 100 },
              "hanbali": { "type": "integer", "minimum": 0, "maximum": 100 }
            }
          },
          "required_evidence": {
            "type": "array",
            "items": { "type": "string" },
            "default": []
          },
          "dossier_section_ref": {
            "type": "string",
            "minLength": 5,
            "description": "Human-readable traceback, e.g. 'STUNNED_V1 §6 row 9'"
          },
          "fatwa_refs": {
            "type": "array",
            "items": { "type": "string" },
            "minItems": 0
          },
          "typical_mortality_pct_min": { "type": ["number", "null"], "minimum": 0, "maximum": 100 },
          "typical_mortality_pct_max": { "type": ["number", "null"], "minimum": 0, "maximum": 100 },
          "notes_fr": { "type": "string" },
          "notes_ar": { "type": "string" },
          "is_active": { "type": "boolean", "default": true }
        }
      }
    }
  }
}
```

- [ ] **Step 4.2: Sanity check + commit**

```bash
cd backend && node -e "JSON.parse(require('fs').readFileSync('src/schemas/halal-v2/practice-tuple.schema.v1.json','utf8')); console.log('ok')"
git add backend/src/schemas/halal-v2/practice-tuple.schema.v1.json
git commit -m "feat(schemas): add practice-tuple v1 JSON schema"
```

Expected: `ok`, then commit succeeds.

---

## Task 5: Create the match-pattern JSON Schema

**Files:**
- Create: `backend/src/schemas/halal-v2/match-pattern.schema.v1.json`

- [ ] **Step 5.1: Write the schema**

Create `backend/src/schemas/halal-v2/match-pattern.schema.v1.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://naqiy.app/schemas/halal-v2/match-pattern.v1.json",
  "title": "Naqiy Match Pattern V1",
  "description": "Runtime detection pattern compiled from substance_dossiers.match_vocabulary. Used by HalalEngineV2 matchModules.",
  "type": "object",
  "required": ["substance_id", "pattern_type", "pattern_value", "priority", "confidence"],
  "additionalProperties": false,
  "properties": {
    "substance_id": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]+$" },
    "pattern_type": {
      "type": "string",
      "enum": ["off_tag", "e_number", "keyword_fr", "keyword_en", "keyword_ar", "keyword_other", "regex", "category_tag", "semantic_descriptor"]
    },
    "pattern_value": { "type": "string", "minLength": 1 },
    "lang": { "type": ["string", "null"], "pattern": "^[a-z]{2}$" },
    "priority": { "type": "integer", "minimum": 0, "maximum": 100 },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
    "source": { "type": "string", "default": "dossier_compiler" }
  }
}
```

- [ ] **Step 5.2: Sanity check + commit**

```bash
cd backend && node -e "JSON.parse(require('fs').readFileSync('src/schemas/halal-v2/match-pattern.schema.v1.json','utf8')); console.log('ok')"
git add backend/src/schemas/halal-v2/match-pattern.schema.v1.json
git commit -m "feat(schemas): add match-pattern v1 JSON schema"
```

Expected: `ok`, commit succeeds.

---

## Task 6: Create the scenario JSON Schema

**Files:**
- Create: `backend/src/schemas/halal-v2/scenario.schema.v1.json`

- [ ] **Step 6.1: Write the schema**

Create `backend/src/schemas/halal-v2/scenario.schema.v1.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://naqiy.app/schemas/halal-v2/scenario.v1.json",
  "title": "Naqiy Substance Scenario V1",
  "description": "Exploded score_matrix row — one scenario per row, with match conditions and per-madhab/strictness score.",
  "type": "object",
  "required": ["substance_id", "scenario_key", "match_conditions", "score", "verdict", "rationale_fr"],
  "additionalProperties": false,
  "properties": {
    "substance_id": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]+$" },
    "scenario_key": { "type": "string", "minLength": 3 },
    "match_conditions": {
      "type": "object",
      "description": "Context filters. All must be satisfied for this scenario to apply.",
      "additionalProperties": true,
      "properties": {
        "category": { "type": ["string", "array", "null"] },
        "usage": { "type": ["string", "null"] },
        "certified_halal": { "type": ["boolean", "null"] },
        "madhab": { "type": ["string", "array", "null"] },
        "strictness": { "type": ["string", "array", "null"] },
        "species": { "type": ["string", "array", "null"] }
      }
    },
    "specificity": { "type": "integer", "minimum": 0, "description": "Number of non-null match_conditions; higher = more specific" },
    "score": { "type": "integer", "minimum": 0, "maximum": 100 },
    "verdict": {
      "type": "string",
      "enum": ["halal", "halal_with_caution", "mashbooh", "avoid", "haram"]
    },
    "rationale_fr": { "type": "string", "minLength": 5 },
    "rationale_en": { "type": "string" },
    "rationale_ar": { "type": "string" },
    "dossier_section_ref": { "type": "string" }
  }
}
```

- [ ] **Step 6.2: Sanity check + commit**

```bash
cd backend && node -e "JSON.parse(require('fs').readFileSync('src/schemas/halal-v2/scenario.schema.v1.json','utf8')); console.log('ok')"
git add backend/src/schemas/halal-v2/scenario.schema.v1.json
git commit -m "feat(schemas): add scenario v1 JSON schema"
```

---

## Task 7: Create the evaluation-trace JSON Schema

**Files:**
- Create: `backend/src/schemas/halal-v2/evaluation-trace.schema.v1.json`

- [ ] **Step 7.1: Write the schema**

Create `backend/src/schemas/halal-v2/evaluation-trace.schema.v1.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://naqiy.app/schemas/halal-v2/evaluation-trace.v1.json",
  "title": "Naqiy Evaluation Trace V1",
  "description": "Immutable audit trace stored in halal_evaluations.trace jsonb. Documents every scoring decision for replayability.",
  "type": "object",
  "required": ["engine_version", "track", "stages", "final"],
  "additionalProperties": false,
  "properties": {
    "engine_version": { "type": "string" },
    "track": { "type": "string", "enum": ["certified", "analyzed"] },
    "gemini_source": { "type": "string", "enum": ["live", "cache", "fast_path_off", "fallback_regex", "unavailable"] },
    "stages": {
      "type": "object",
      "properties": {
        "resolve_ms": { "type": "number" },
        "extract_ms": { "type": "number" },
        "engine_ms": { "type": "number" },
        "total_ms": { "type": "number" }
      }
    },
    "modules_fired": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["substance_id", "score", "scenario_key"],
        "properties": {
          "substance_id": { "type": "string" },
          "score": { "type": "integer", "minimum": 0, "maximum": 100 },
          "scenario_key": { "type": "string" },
          "match_source": { "type": "string" },
          "match_priority": { "type": "integer" },
          "madhab_note": { "type": ["string", "null"] }
        }
      }
    },
    "tuples_evaluated": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["practice_tuple_id", "base_score", "adjusted_score", "evidence_level"],
        "properties": {
          "practice_tuple_id": { "type": "string" },
          "base_score": { "type": "integer" },
          "adjusted_score": { "type": "integer" },
          "evidence_level": { "type": "string" }
        }
      }
    },
    "certifier_id": { "type": ["string", "null"] },
    "species_evaluated": { "type": ["string", "null"] },
    "final": {
      "type": "object",
      "required": ["verdict", "score", "confidence"],
      "properties": {
        "verdict": { "type": "string" },
        "score": { "type": "integer", "minimum": 0, "maximum": 100 },
        "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
      }
    }
  }
}
```

- [ ] **Step 7.2: Sanity check + commit**

```bash
cd backend && node -e "JSON.parse(require('fs').readFileSync('src/schemas/halal-v2/evaluation-trace.schema.v1.json','utf8')); console.log('ok')"
git add backend/src/schemas/halal-v2/evaluation-trace.schema.v1.json
git commit -m "feat(schemas): add evaluation-trace v1 JSON schema"
```

---

## Task 8: Create the gemini-semantic JSON Schema

**Files:**
- Create: `backend/src/schemas/halal-v2/gemini-semantic.schema.v1.json`

- [ ] **Step 8.1: Write the schema**

Create `backend/src/schemas/halal-v2/gemini-semantic.schema.v1.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://naqiy.app/schemas/halal-v2/gemini-semantic.v1.json",
  "title": "Naqiy Gemini V2 Semantic Result",
  "description": "Contract for the GeminiSemanticResult returned by the ai-extract V2 provider.",
  "type": "object",
  "required": ["ingredients", "additives", "lang", "product_category", "product_usage", "detected_substances", "alcohol_context", "novaEstimate", "allergenHints", "containsAlcohol", "isOrganic"],
  "additionalProperties": false,
  "properties": {
    "ingredients": { "type": "array", "items": { "type": "string" } },
    "additives": { "type": "array", "items": { "type": "string", "pattern": "^e[0-9]{3,4}[a-z]?$" } },
    "lang": { "type": "string", "pattern": "^[a-z]{2}$" },
    "product_category": {
      "type": "string",
      "enum": ["candy", "chocolate", "biscuit", "bread", "cheese", "yogurt", "milk_beverage", "meat", "poultry", "fish", "spread", "snack", "beverage_soft", "beverage_energy", "tablet_pharma", "supplement", "cosmetic_topical", "fresh_fruit", "prepared_meal", "sauce", "other"]
    },
    "product_usage": { "type": "string", "enum": ["ingestion", "topical", "medicinal"] },
    "meat_classification": {
      "type": ["object", "null"],
      "required": ["is_meat", "species", "product_type", "confidence"],
      "properties": {
        "is_meat": { "type": "boolean" },
        "species": { "type": "string", "enum": ["cattle", "sheep", "goat", "poultry", "rabbit", "mixed", "unknown"] },
        "product_type": { "type": "string", "enum": ["whole_muscle", "ground", "processed", "charcuterie"] },
        "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
      }
    },
    "detected_substances": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["substance_id", "matched_term", "match_source", "confidence"],
        "properties": {
          "substance_id": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]+$" },
          "matched_term": { "type": "string" },
          "match_source": { "type": "string", "enum": ["canonical_fr", "canonical_en", "canonical_ar", "alias", "descriptor", "off_tag", "e_number", "semantic"] },
          "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
          "context_note": { "type": "string" }
        }
      }
    },
    "animal_source_hints": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["term", "certainty"],
        "properties": {
          "term": { "type": "string" },
          "certainty": { "type": "string", "enum": ["explicit", "ambiguous", "likely"] }
        }
      }
    },
    "alcohol_context": {
      "type": "object",
      "required": ["present", "role"],
      "properties": {
        "present": { "type": "boolean" },
        "role": { "type": "string", "enum": ["none", "ingredient", "solvent_flavor", "trace", "vinegar_takhallul"] },
        "substrate": { "type": "string" }
      }
    },
    "novaEstimate": { "type": "integer", "minimum": 1, "maximum": 4 },
    "allergenHints": { "type": "array", "items": { "type": "string" } },
    "containsAlcohol": { "type": "boolean" },
    "isOrganic": { "type": "boolean" }
  }
}
```

- [ ] **Step 8.2: Sanity check + commit**

```bash
cd backend && node -e "JSON.parse(require('fs').readFileSync('src/schemas/halal-v2/gemini-semantic.schema.v1.json','utf8')); console.log('ok')"
git add backend/src/schemas/halal-v2/gemini-semantic.schema.v1.json
git commit -m "feat(schemas): add gemini-semantic v1 JSON schema"
```

All 7 schemas now exist.

---

## Task 9: Build the validator script + unit tests (TDD)

**Files:**
- Create: `backend/scripts/validate-dossiers.ts`
- Create: `backend/src/__tests__/unit/validate-dossiers.test.ts`
- Create: `backend/src/__tests__/fixtures/dossiers/valid-substance.json`
- Create: `backend/src/__tests__/fixtures/dossiers/invalid-substance-missing-id.json`
- Create: `backend/src/__tests__/fixtures/dossiers/invalid-substance-bad-score.json`
- Modify: `backend/package.json` (add `validate:dossiers` script)

- [ ] **Step 9.1: Create test fixtures — one valid substance dossier**

Create `backend/src/__tests__/fixtures/dossiers/valid-substance.json`:

```json
{
  "meta": {
    "dossier_id": "SUBST-999",
    "version": "1.0.0",
    "generated_at": "2026-04-09",
    "language_primary": "fr",
    "languages": ["fr", "en", "ar"]
  },
  "substance": {
    "id": "TEST_SUBSTANCE",
    "primary_name_fr": "Substance de test",
    "primary_name_en": "Test substance",
    "issue_type": "OTHER",
    "match_vocabulary": {
      "canonical_fr": "substance de test",
      "canonical_en": "test substance",
      "synonyms_fr": [],
      "synonyms_en": [],
      "e_numbers": [],
      "off_tags": [],
      "semantic_descriptors": []
    }
  },
  "core_fiqhi_concepts": [
    { "en": "test", "fr": "test", "principle": "test principle" }
  ],
  "fatwas_summary": { "halal_count": 0, "haram_count": 0 },
  "madhab_positions": {
    "hanafi": {},
    "maliki": {},
    "shafi'i": {},
    "hanbali": {}
  },
  "naqiy_position": {
    "global_score": 50,
    "verdict_internal_ingestion": "mashbooh"
  }
}
```

- [ ] **Step 9.2: Create test fixture — invalid (missing id)**

Create `backend/src/__tests__/fixtures/dossiers/invalid-substance-missing-id.json`:

```json
{
  "meta": {
    "version": "1.0.0",
    "generated_at": "2026-04-09",
    "language_primary": "fr",
    "languages": ["fr"]
  },
  "substance": {
    "id": "TEST",
    "primary_name_fr": "Test",
    "primary_name_en": "Test",
    "issue_type": "OTHER",
    "match_vocabulary": { "canonical_fr": "test", "canonical_en": "test" }
  },
  "core_fiqhi_concepts": [],
  "fatwas_summary": { "halal_count": 0, "haram_count": 0 },
  "madhab_positions": { "hanafi": {}, "maliki": {}, "shafi'i": {}, "hanbali": {} },
  "naqiy_position": { "global_score": 50, "verdict_internal_ingestion": "x" }
}
```

(Note: `meta.dossier_id` is missing.)

- [ ] **Step 9.3: Create test fixture — invalid (score out of range)**

Create `backend/src/__tests__/fixtures/dossiers/invalid-substance-bad-score.json`:

```json
{
  "meta": {
    "dossier_id": "SUBST-998",
    "version": "1.0.0",
    "generated_at": "2026-04-09",
    "language_primary": "fr",
    "languages": ["fr"]
  },
  "substance": {
    "id": "TEST",
    "primary_name_fr": "Test",
    "primary_name_en": "Test",
    "issue_type": "OTHER",
    "match_vocabulary": { "canonical_fr": "test", "canonical_en": "test" }
  },
  "core_fiqhi_concepts": [],
  "fatwas_summary": { "halal_count": 0, "haram_count": 0 },
  "madhab_positions": { "hanafi": {}, "maliki": {}, "shafi'i": {}, "hanbali": {} },
  "naqiy_position": { "global_score": 150, "verdict_internal_ingestion": "x" }
}
```

(Note: `global_score` is 150, exceeds max 100.)

- [ ] **Step 9.4: Write the failing validator test**

Create `backend/src/__tests__/unit/validate-dossiers.test.ts`:

```typescript
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
```

- [ ] **Step 9.5: Run test — expect failure (module not found)**

```bash
cd backend && pnpm vitest run src/__tests__/unit/validate-dossiers.test.ts
```

Expected: FAIL. Error about missing `../../../scripts/validate-dossiers.js`.

- [ ] **Step 9.6: Write minimal validator script**

Create `backend/scripts/validate-dossiers.ts`:

```typescript
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
```

- [ ] **Step 9.7: Run test — expect pass**

```bash
cd backend && pnpm vitest run src/__tests__/unit/validate-dossiers.test.ts
```

Expected: 4 tests PASS (`loads all 7 schemas`, `accepts valid`, `rejects missing id`, `rejects bad score`).

- [ ] **Step 9.8: Add `validate:dossiers` package script**

Edit `backend/package.json`. In the `scripts` section, add after `"test:coverage"`:

```json
"validate:dossiers": "tsx scripts/validate-dossiers.ts",
```

- [ ] **Step 9.9: Run the script against the current repo — expect failures**

```bash
cd backend && pnpm validate:dossiers
```

Expected: **non-zero exit, several dossiers fail.** This is normal — the existing 12 dossiers don't yet have `match_vocabulary` and the SHELLAC id bug exists. These failures are the work items of Tasks 10-13. Save the stderr output, it's your TODO list.

- [ ] **Step 9.10: Commit**

```bash
git add backend/scripts/validate-dossiers.ts \
        backend/src/__tests__/unit/validate-dossiers.test.ts \
        backend/src/__tests__/fixtures/dossiers/ \
        backend/package.json
git commit -m "feat(backend): add V2 dossier validator script + unit tests"
```

---

## Task 10: Fix the SHELLAC `dossier_id` bug

**Files:**
- Modify: `docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/json/naqiy_dossier_SHELLAC_v2.json`

The existing file says `"dossier_id": "SUBST-008"` but per `naqiy_substance_pipeline.json`, SUBST-008 = L-Cystéine and Shellac = SUBST-012. Fix it.

- [ ] **Step 10.1: Read the file and fix the id**

Change line 3 from:
```json
"dossier_id": "SUBST-008",
```
to:
```json
"dossier_id": "SUBST-012",
```

(Use the Edit tool with precise old_string/new_string.)

- [ ] **Step 10.2: Re-run validator — SHELLAC should now only fail on missing `match_vocabulary`**

```bash
cd backend && pnpm validate:dossiers 2>&1 | grep SHELLAC
```

Expected: SHELLAC still fails but only on `match_vocabulary` — the id error is gone.

- [ ] **Step 10.3: Commit**

```bash
git add docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/json/naqiy_dossier_SHELLAC_v2.json
git commit -m "fix(dossiers): correct SHELLAC dossier_id SUBST-008 → SUBST-012

Per naqiy_substance_pipeline.json, SUBST-008 = L-Cystéine and
SUBST-012 = Shellac. Bug was a copy-paste from another dossier."
```

---

## Task 11: Add `match_vocabulary` to every substance dossier

**Files:** all 9 substance dossier JSONs in `docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/json/`:
- `naqiy_dossier_SHELLAC_v2.json`
- `naqiy_dossier_CARMINE_v2.json`
- `naqiy_dossier_E471_v2.json`
- `naqiy_dossier_GELATIN_v2.json`
- `naqiy_dossier_RENNET_v2.json`
- `naqiy_dossier_GLYCEROL_v2.json`
- `naqiy_dossier_SOY_LECITHIN_v2.json`
- `naqiy_dossier_ALCOHOL_FLAVORINGS_v2.json`
- `naqiy_dossier_LACTOSE_WHEY_v2.json`

The three slaughter dossiers (STUNNED_MEAT, MECHANICAL_SLAUGHTER_POULTRY, AHL_KITAB_MEAT) are handled in Task 12 — they become practice dossiers.

- [ ] **Step 11.1: Add SHELLAC `match_vocabulary`**

In `naqiy_dossier_SHELLAC_v2.json`, inside the `substance` object, add a `match_vocabulary` field after `description_fr`:

```json
"match_vocabulary": {
  "canonical_fr": "gomme-laque",
  "canonical_en": "shellac",
  "canonical_ar": "صمغ اللك",
  "synonyms_fr": [
    "gomme laque", "gommelaque", "laque de confiseur",
    "résine de laque", "agent d'enrobage e904"
  ],
  "synonyms_en": [
    "lac resin", "confectioner's glaze", "pharmaceutical glaze",
    "resinous glaze", "lac dye"
  ],
  "synonyms_ar": [
    "الشيلاك", "إفرازات حشرة اللك", "راتنج اللك"
  ],
  "synonyms_other": {
    "de": ["schellack"],
    "es": ["goma laca"],
    "it": ["gommalacca"],
    "tr": ["gomalak"],
    "ur": ["شیلاک"]
  },
  "e_numbers": ["E904"],
  "off_tags": ["en:e904", "en:shellac"],
  "semantic_descriptors": [
    "natural coating from insect secretion",
    "enrobage brillant d'origine animale",
    "résine issue de l'insecte lac"
  ],
  "disambiguation_hints": {
    "not_to_confuse_with": ["beeswax", "carnauba"],
    "context_clues": ["candy", "apple", "tablet", "fruit", "confectionery"]
  }
}
```

- [ ] **Step 11.2: Add CARMINE `match_vocabulary`**

In `naqiy_dossier_CARMINE_v2.json`:

```json
"match_vocabulary": {
  "canonical_fr": "carmin",
  "canonical_en": "carmine",
  "canonical_ar": "قرمز",
  "synonyms_fr": ["cochenille", "acide carminique", "colorant carmin", "rouge carmin"],
  "synonyms_en": ["cochineal", "carminic acid", "natural red 4", "crimson lake"],
  "synonyms_ar": ["قرميز", "كوشنيل", "حشرة القرمز"],
  "synonyms_other": {
    "de": ["karmin", "cochenille"],
    "es": ["cochinilla", "carmín"],
    "it": ["cocciniglia", "carminio"]
  },
  "e_numbers": ["E120"],
  "off_tags": ["en:e120", "en:cochineal", "en:carmine"],
  "semantic_descriptors": [
    "red dye from Dactylopius coccus insect",
    "colorant rouge extrait d'insectes",
    "pigment animal rouge"
  ],
  "disambiguation_hints": {
    "not_to_confuse_with": ["beetroot red", "e162", "anthocyanin", "e163"],
    "context_clues": ["candy", "yogurt", "sausage", "lipstick"]
  }
}
```

- [ ] **Step 11.3: Add E471 `match_vocabulary`**

In `naqiy_dossier_E471_v2.json`:

```json
"match_vocabulary": {
  "canonical_fr": "mono- et diglycérides d'acides gras",
  "canonical_en": "mono- and diglycerides of fatty acids",
  "canonical_ar": "أحادي وثنائي الغليسريدات الدهنية",
  "synonyms_fr": [
    "mono et diglycérides", "monoglycérides", "diglycérides",
    "émulsifiant e471", "mono-diglycérides d'acides gras"
  ],
  "synonyms_en": [
    "monoglycerides", "diglycerides", "mono-diglycerides",
    "emulsifier e471", "glyceryl monostearate"
  ],
  "synonyms_ar": ["مستحلب إي 471", "أحادي الغليسريد"],
  "synonyms_other": {
    "de": ["mono- und diglyceride von speisefettsäuren"],
    "es": ["mono y diglicéridos de ácidos grasos"],
    "it": ["mono e digliceridi degli acidi grassi"]
  },
  "e_numbers": ["E471", "E472a", "E472b", "E472c", "E472d", "E472e", "E472f"],
  "off_tags": ["en:e471", "en:e472a", "en:e472b", "en:e472c", "en:e472d", "en:e472e"],
  "semantic_descriptors": [
    "emulsifier from fatty acids",
    "émulsifiant d'origine animale ou végétale",
    "ester de glycérol"
  ],
  "disambiguation_hints": {
    "not_to_confuse_with": ["lecithin", "e322"],
    "context_clues": ["bread", "margarine", "ice cream", "biscuit", "spread"]
  }
}
```

- [ ] **Step 11.4: Add GELATIN `match_vocabulary`**

In `naqiy_dossier_GELATIN_v2.json`:

```json
"match_vocabulary": {
  "canonical_fr": "gélatine",
  "canonical_en": "gelatin",
  "canonical_ar": "جيلاتين",
  "synonyms_fr": [
    "gélatine bovine", "gélatine porcine", "gélatine de porc",
    "gélatine alimentaire", "gélatine de boeuf", "gelatine"
  ],
  "synonyms_en": [
    "gelatine", "bovine gelatin", "porcine gelatin", "pork gelatin",
    "beef gelatin", "edible gelatin"
  ],
  "synonyms_ar": ["جيلاتين بقري", "جيلاتين خنزير", "جيلاتين حلال"],
  "synonyms_other": {
    "de": ["gelatine", "speisegelatine"],
    "es": ["gelatina"],
    "it": ["gelatina"],
    "tr": ["jelatin"]
  },
  "e_numbers": ["E441"],
  "off_tags": ["en:gelatin", "en:pork-gelatin", "en:beef-gelatin", "en:e441"],
  "semantic_descriptors": [
    "collagen protein from animal skin and bones",
    "protéine animale de peau et d'os",
    "gélifiant d'origine animale"
  ],
  "disambiguation_hints": {
    "not_to_confuse_with": ["agar-agar", "pectin", "carrageenan", "fish gelatin"],
    "context_clues": ["gummy", "jelly", "marshmallow", "yogurt", "capsule"]
  }
}
```

- [ ] **Step 11.5: Add RENNET `match_vocabulary`**

In `naqiy_dossier_RENNET_v2.json`:

```json
"match_vocabulary": {
  "canonical_fr": "présure",
  "canonical_en": "rennet",
  "canonical_ar": "منفحة",
  "synonyms_fr": [
    "présure animale", "présure microbienne", "présure végétale",
    "chymosine", "enzyme coagulante", "coagulant fromager"
  ],
  "synonyms_en": [
    "chymosin", "microbial rennet", "vegetable rennet",
    "animal rennet", "cheese coagulant", "calf rennet"
  ],
  "synonyms_ar": ["إنفحة", "أنزيم منفحة"],
  "synonyms_other": {
    "de": ["lab", "labferment", "mikrobielles lab"],
    "es": ["cuajo"],
    "it": ["caglio"],
    "tr": ["peynir mayası"]
  },
  "e_numbers": ["E1105"],
  "off_tags": ["en:rennet", "en:animal-rennet", "en:microbial-rennet"],
  "semantic_descriptors": [
    "enzyme for milk coagulation",
    "enzyme d'estomac de veau",
    "coagulant enzymatique pour fromage"
  ],
  "disambiguation_hints": {
    "not_to_confuse_with": ["lipase", "pepsin", "protease"],
    "context_clues": ["cheese", "fromage", "cheddar", "parmigiano", "mozzarella"]
  }
}
```

- [ ] **Step 11.6: Add GLYCEROL `match_vocabulary`**

In `naqiy_dossier_GLYCEROL_v2.json`:

```json
"match_vocabulary": {
  "canonical_fr": "glycérol",
  "canonical_en": "glycerol",
  "canonical_ar": "غليسرول",
  "synonyms_fr": ["glycérine", "glycérine végétale", "e422", "humectant glycérol"],
  "synonyms_en": ["glycerin", "glycerine", "vegetable glycerin", "glycerol monostearate"],
  "synonyms_ar": ["غليسرين", "جليسرول"],
  "synonyms_other": {
    "de": ["glycerin", "glyzerin"],
    "es": ["glicerina", "glicerol"],
    "it": ["glicerolo", "glicerina"]
  },
  "e_numbers": ["E422"],
  "off_tags": ["en:e422", "en:glycerol", "en:glycerin"],
  "semantic_descriptors": [
    "sugar alcohol used as humectant",
    "humectant alcool sucré",
    "peut provenir de graisses animales"
  ],
  "disambiguation_hints": {
    "not_to_confuse_with": ["sorbitol", "xylitol"],
    "context_clues": ["candy", "icing", "toothpaste", "pharma", "cosmetic"]
  }
}
```

- [ ] **Step 11.7: Add SOY_LECITHIN `match_vocabulary`**

In `naqiy_dossier_SOY_LECITHIN_v2.json`:

```json
"match_vocabulary": {
  "canonical_fr": "lécithine de soja",
  "canonical_en": "soy lecithin",
  "canonical_ar": "ليسيثين الصويا",
  "synonyms_fr": [
    "lécithine", "e322", "lécithines", "émulsifiant e322",
    "lécithine de tournesol", "lécithine d'oeuf"
  ],
  "synonyms_en": [
    "lecithin", "e322", "sunflower lecithin", "egg lecithin",
    "emulsifier e322", "phosphatidylcholine"
  ],
  "synonyms_ar": ["ليسيثين", "مستحلب إي 322"],
  "synonyms_other": {
    "de": ["sojalecithin", "lecithin"],
    "es": ["lecitina de soja"],
    "it": ["lecitina di soia"]
  },
  "e_numbers": ["E322"],
  "off_tags": ["en:e322", "en:soya-lecithin", "en:lecithins"],
  "semantic_descriptors": [
    "emulsifier from soybeans",
    "émulsifiant extrait du soja",
    "phospholipide végétal"
  ],
  "disambiguation_hints": {
    "not_to_confuse_with": ["e471", "monoglycerides"],
    "context_clues": ["chocolate", "margarine", "bread", "biscuit"]
  }
}
```

- [ ] **Step 11.8: Add ALCOHOL_FLAVORINGS `match_vocabulary`**

In `naqiy_dossier_ALCOHOL_FLAVORINGS_v2.json`:

```json
"match_vocabulary": {
  "canonical_fr": "alcool dans les arômes",
  "canonical_en": "alcohol in flavorings",
  "canonical_ar": "الكحول في النكهات",
  "synonyms_fr": [
    "éthanol", "alcool éthylique", "arôme naturel de vanille",
    "extrait de vanille", "arôme alcoolisé", "support d'arôme alcool"
  ],
  "synonyms_en": [
    "ethanol", "ethyl alcohol", "vanilla extract", "natural flavor",
    "flavoring carrier alcohol", "alcohol-based extract"
  ],
  "synonyms_ar": ["إيثانول", "كحول إثيلي", "مستخلص الفانيليا"],
  "synonyms_other": {
    "de": ["ethanol", "vanilleextrakt"],
    "es": ["etanol", "extracto de vainilla"]
  },
  "e_numbers": [],
  "off_tags": ["en:ethanol", "en:natural-flavouring", "en:vanilla-extract"],
  "semantic_descriptors": [
    "alcohol as solvent in flavor extracts",
    "solvant alcoolique d'arôme",
    "traces résiduelles d'éthanol"
  ],
  "disambiguation_hints": {
    "not_to_confuse_with": ["vinegar", "vinaigre", "sugar alcohols", "sorbitol"],
    "context_clues": ["ice cream", "cake", "chocolate", "yogurt", "beverage"]
  }
}
```

- [ ] **Step 11.9: Add LACTOSE_WHEY `match_vocabulary`**

In `naqiy_dossier_LACTOSE_WHEY_v2.json`:

```json
"match_vocabulary": {
  "canonical_fr": "lactosérum",
  "canonical_en": "whey",
  "canonical_ar": "مصل الحليب",
  "synonyms_fr": [
    "petit-lait", "protéines de lactosérum", "whey protein",
    "lactose", "poudre de lactosérum", "caséine"
  ],
  "synonyms_en": [
    "whey protein", "whey powder", "lactose", "casein",
    "milk whey", "whey concentrate", "whey isolate"
  ],
  "synonyms_ar": ["شرش اللبن", "بروتين مصل الحليب", "لاكتوز", "كازين"],
  "synonyms_other": {
    "de": ["molke", "molkepulver", "molkenprotein"],
    "es": ["suero de leche", "lactosuero"],
    "it": ["siero di latte"]
  },
  "e_numbers": [],
  "off_tags": ["en:whey", "en:whey-powder", "en:whey-protein", "en:lactose", "en:casein"],
  "semantic_descriptors": [
    "milk byproduct from cheese making",
    "sous-produit de la fabrication fromagère",
    "peut contenir traces de présure"
  ],
  "disambiguation_hints": {
    "not_to_confuse_with": ["milk powder", "cream", "butter"],
    "context_clues": ["protein bar", "biscuit", "bread", "supplement"]
  }
}
```

- [ ] **Step 11.10: Re-run the validator — the 9 substance dossiers should all pass**

```bash
cd backend && pnpm validate:dossiers 2>&1 | tee /tmp/validate.log
```

Expected: the 9 substance dossiers (SHELLAC, CARMINE, E471, GELATIN, RENNET, GLYCEROL, SOY_LECITHIN, ALCOHOL_FLAVORINGS, LACTOSE_WHEY) all show `✓`. The 3 slaughter dossiers still fail (they are treated as substance-dossier but will be moved to practices/ in Task 12).

- [ ] **Step 11.11: Commit**

```bash
git add docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/json/naqiy_dossier_SHELLAC_v2.json \
        docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/json/naqiy_dossier_CARMINE_v2.json \
        docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/json/naqiy_dossier_E471_v2.json \
        docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/json/naqiy_dossier_GELATIN_v2.json \
        docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/json/naqiy_dossier_RENNET_v2.json \
        docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/json/naqiy_dossier_GLYCEROL_v2.json \
        docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/json/naqiy_dossier_SOY_LECITHIN_v2.json \
        docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/json/naqiy_dossier_ALCOHOL_FLAVORINGS_v2.json \
        docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/json/naqiy_dossier_LACTOSE_WHEY_v2.json
git commit -m "feat(dossiers): enrich 9 substance dossiers with match_vocabulary

Adds canonical names (fr/en/ar), multilingual synonyms, E-numbers,
OFF tags, semantic descriptors and disambiguation hints per the V2
spec §5. This vocabulary will be injected into the Gemini V2 prompt
as the closed substance matching dictionary.

Part of feat/halal-engine-v2 Phase 0."
```

---

## Task 12: Move slaughter dossiers to `practices/` and build STUNNING practice dossier

**Files:**
- Create: `docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/practices/stunning/practice_STUNNING.json`
- Move: `docs/naqiy/.../dossiers_v2/json/naqiy_dossier_STUNNED_MEAT_v2.json` → `docs/naqiy/.../dossiers_v2/practices/stunning/_source_stunned_meat_v2.json` (archived, keeps the scholarly content accessible)
- Move: `naqiy_dossier_MECHANICAL_SLAUGHTER_POULTRY_v2.json` → `practices/mechanical_slaughter/_source_mechanical_slaughter_v2.json`
- Move: `naqiy_dossier_AHL_KITAB_MEAT_v2.json` → `practices/ahl_kitab/_source_ahl_kitab_v2.json`

The existing slaughter dossiers are substance-shaped but conceptually practice dossiers. We archive them under their practice family and create a properly-structured `practice_STUNNING.json` that wraps the scholarly content. Mechanical/ahl-kitab practice dossiers will be structured in Phase 7 (backfill). Phase 0 only needs STUNNING fully wired, because it's the pilot for tuples (Task 13).

- [ ] **Step 12.1: Create the practices directory tree**

```bash
cd /Users/limameghassene/development/optimus-halal-mobile-app
mkdir -p docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/practices/stunning/tuples
mkdir -p docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/practices/mechanical_slaughter/tuples
mkdir -p docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/practices/ahl_kitab/tuples
```

Expected: 3 directories created.

- [ ] **Step 12.2: Move the 3 slaughter dossiers to their archive locations**

```bash
cd /Users/limameghassene/development/optimus-halal-mobile-app
git mv docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/json/naqiy_dossier_STUNNED_MEAT_v2.json \
       docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/practices/stunning/_source_stunned_meat_v2.json

git mv docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/json/naqiy_dossier_MECHANICAL_SLAUGHTER_POULTRY_v2.json \
       docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/practices/mechanical_slaughter/_source_mechanical_slaughter_v2.json

git mv docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/json/naqiy_dossier_AHL_KITAB_MEAT_v2.json \
       docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/practices/ahl_kitab/_source_ahl_kitab_v2.json
```

The `_source_` prefix tells the validator to skip them (they don't start with `practice_`).

- [ ] **Step 12.3: Create the STUNNING practice dossier**

Create `docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/practices/stunning/practice_STUNNING.json`:

```json
{
  "meta": {
    "dossier_id": "PRAC-001",
    "version": "1.0.0",
    "generated_at": "2026-04-09",
    "language_primary": "fr",
    "languages": ["fr", "en", "ar"],
    "practice_family": "stunning",
    "verification_passes": 2,
    "fatwas_verified_count": 8
  },
  "practice": {
    "id": "STUNNING",
    "name_fr": "Étourdissement pré-abattage",
    "name_en": "Pre-slaughter stunning",
    "name_ar": "التخدير قبل الذبح",
    "severity_tier": 1,
    "description_fr": "Techniques utilisées pour rendre un animal inconscient ou l'immobiliser avant l'égorgement. Méthodes variables par espèce (électrique tête-seule, tête-corps, bain d'eau, captive bolt, CO2). L'enjeu scholarly central : l'animal doit être vivant au moment de la section des vaisseaux. Toute méthode qui tue avant l'égorgement rend l'animal maytah (charogne) ou mawqudhah (Coran 5:3)."
  },
  "core_fiqhi_concepts": [
    {
      "ar": "الحياة المستقرة",
      "en": "Stable residual life",
      "fr": "Vie résiduelle stable",
      "principle": "L'animal doit présenter des signes de vie (mouvement, écoulement normal du sang) au moment où le couteau sectionne les vaisseaux du cou. Critère unanime des 4 madhabs."
    },
    {
      "ar": "المنخنقة والموقوذة",
      "en": "Suffocated and beaten-to-death",
      "fr": "Étranglé et assommé à mort",
      "principle": "Interdits par texte coranique explicite (5:3). Un animal mort par étourdissement entre dans l'une de ces deux catégories selon la méthode."
    }
  ],
  "fatwas_summary": {
    "halal_count": 5,
    "haram_count": 3,
    "halal_institutions": [
      { "name": "IIFA Résolution 95 (1997)", "url": "https://iifa-aifi.org/en/32542.html", "principle": "Conditionnel — animal vivant au moment de l'abattage" },
      { "name": "Dar al-Iftaa Egypt #12912", "url": "https://www.dar-alifta.org/ar/fatwa/details/12912/" },
      { "name": "Lajnah Daimah", "country": "Saudi Arabia" },
      { "name": "MUI Indonesia", "url": "https://halalmui.org" },
      { "name": "JAKIM Malaysia", "url": "https://myehalal.halal.gov.my" }
    ],
    "haram_institutions": [
      { "name": "HMC UK", "url": "https://halalhmc.org" },
      { "name": "ECFR", "scholar": "al-Qaradawi" },
      { "name": "Darul Uloom Deoband" }
    ]
  },
  "madhab_positions": {
    "hanafi": {
      "classical": "HALAL if animal alive at slaughter",
      "contemporary_split": "Deobandi restrictive on poultry waterbath",
      "key_scholars": ["Mufti Taqi Usmani", "Darul Iftaa Birmingham"]
    },
    "maliki": {
      "classical": "HALAL if animal alive at slaughter",
      "pragmatic": "Maghreb institutions accept reversible stunning"
    },
    "shafi'i": {
      "classical": "HALAL if animal alive at slaughter",
      "permissive": "Tasmiya is sunnah not condition — more lenient overall"
    },
    "hanbali": {
      "classical": "HALAL if animal alive at slaughter",
      "contemporary": "Lajnah Daimah most analytical — explicit poultry prohibition"
    }
  },
  "naqiy_position": {
    "global_score": 50,
    "verdict_default": "MASHBOOH on European market by default — HALAL only with credible certification proving survival AND species-appropriate method",
    "rationale": "Stunning is a family of 15+ techniques, each with different mortality profile. Cannot be evaluated as a single boolean. See practice_tuples for per-combination scores sourced from STUNNED_MEAT V1 §6 and MECHANICAL_SLAUGHTER V2 §7."
  }
}
```

- [ ] **Step 12.4: Re-run validator**

```bash
cd backend && pnpm validate:dossiers
```

Expected: the 9 substance dossiers pass AND `practice_STUNNING.json` passes. No files fail. **Exit code 0.**

- [ ] **Step 12.5: Commit**

```bash
git add docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/practices/
git commit -m "feat(dossiers): introduce practices/ tree + STUNNING practice dossier

- Creates practices/{stunning,mechanical_slaughter,ahl_kitab}/tuples/ tree
- Archives the 3 legacy slaughter JSONs under their respective family
  as _source_ files (validator skips them)
- Creates practice_STUNNING.json wrapping the scholarly content as a
  proper PracticeDossier matching the V2 schema
- Mechanical slaughter and ahl kitab practice dossiers are deferred
  to Phase 7 (backfill) — STUNNING is the pilot for tuples in Task 13

Part of feat/halal-engine-v2 Phase 0."
```

---

## Task 13: Seed STUNNING practice tuples (the dossier-anchored matrix)

**Files:**
- Create: `docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/practices/stunning/tuples/tuples_stunning.json`

This is the literal translation of §3.3 of the spec — the scholarly matrix extracted from STUNNED_MEAT V1 §6 and MECHANICAL_SLAUGHTER V2 §7. Every verdict score has a `dossier_section_ref` traceback.

- [ ] **Step 13.1: Create the tuples file**

Create `docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/practices/stunning/tuples/tuples_stunning.json`:

```json
{
  "practice_family": "stunning",
  "source_dossier": {
    "dossier_id": "PRAC-001",
    "version": "1.0.0"
  },
  "tuples": [
    {
      "id": "CATTLE_NOSTUN_MANUAL",
      "dimensions": {
        "species": "cattle",
        "method": "no_stun",
        "operator": "muslim",
        "tasmiya": "per_animal"
      },
      "verdicts": { "hanafi": 98, "maliki": 98, "shafii": 98, "hanbali": 98 },
      "required_evidence": [],
      "dossier_section_ref": "STUNNED_V1 §6 row 1 (sans étourdissement certifié)",
      "fatwa_refs": ["IIFA-95-1997", "LAJNAH-DAIMAH"],
      "notes_fr": "Abattage manuel traditionnel — gold standard unanime",
      "is_active": true
    },
    {
      "id": "CATTLE_ESTUN_HEAD_ONLY_REV",
      "dimensions": {
        "species": "cattle",
        "method": "electric_head_only",
        "reversibility": "reversible",
        "params": "IIFA_standard_100_400V_2_2.5A_3_6s"
      },
      "verdicts": { "hanafi": 72, "maliki": 75, "shafii": 78, "hanbali": 70 },
      "required_evidence": ["mortality_rate_published", "wake_tests_performed"],
      "dossier_section_ref": "STUNNED_V1 §6 row 2 + DAR_IFTAA_EGYPT_12912",
      "fatwa_refs": ["DAR-IFTAA-EGYPT-12912", "IIFA-95-1997", "MUI-FATWA"],
      "typical_mortality_pct_min": 0,
      "typical_mortality_pct_max": 5,
      "notes_fr": "Réversible par conception — paramètres IIFA obligatoires. Vérification individuelle de la survie requise.",
      "is_active": true
    },
    {
      "id": "CATTLE_CAPTIVE_BOLT_PENETRATING",
      "dimensions": {
        "species": "cattle",
        "method": "captive_bolt_penetrating"
      },
      "verdicts": { "hanafi": 0, "maliki": 0, "shafii": 0, "hanbali": 0 },
      "required_evidence": [],
      "dossier_section_ref": "STUNNED_V1 §6 row 9 (tige captive pénétrante)",
      "fatwa_refs": ["IIFA-95-1997", "DAR-IFTAA-EGYPT-12912"],
      "typical_mortality_pct_min": 84,
      "typical_mortality_pct_max": 98,
      "notes_fr": "Destruction cérébrale — unanimement haram par toutes les institutions.",
      "is_active": true
    },
    {
      "id": "CATTLE_CAPTIVE_BOLT_NONPENETRATING",
      "dimensions": {
        "species": "cattle",
        "method": "captive_bolt_nonpenetrating"
      },
      "verdicts": { "hanafi": 62, "maliki": 65, "shafii": 68, "hanbali": 60 },
      "required_evidence": ["mortality_rate_published"],
      "dossier_section_ref": "STUNNED_V1 §3.1 IIFA permet non-pénétrant",
      "fatwa_refs": ["IIFA-95-1997"],
      "notes_fr": "Non pénétrant — permis par IIFA sous conditions. Plus strictement regardé par Deobandis.",
      "is_active": true
    },
    {
      "id": "SHEEP_NOSTUN_MANUAL",
      "dimensions": {
        "species": "sheep",
        "method": "no_stun",
        "operator": "muslim"
      },
      "verdicts": { "hanafi": 98, "maliki": 98, "shafii": 98, "hanbali": 98 },
      "required_evidence": [],
      "dossier_section_ref": "STUNNED_V1 §6 row 1",
      "fatwa_refs": ["UNANIMOUS"],
      "is_active": true
    },
    {
      "id": "SHEEP_ESTUN_HEAD_ONLY_REV",
      "dimensions": {
        "species": "sheep",
        "method": "electric_head_only",
        "reversibility": "reversible",
        "params": "IIFA_standard_100_400V_0.75_1A_3_6s"
      },
      "verdicts": { "hanafi": 72, "maliki": 75, "shafii": 78, "hanbali": 70 },
      "required_evidence": ["mortality_rate_published", "wake_tests_performed"],
      "dossier_section_ref": "STUNNED_V1 §6 row 2 + DAR_IFTAA_EGYPT_12912",
      "fatwa_refs": ["DAR-IFTAA-EGYPT-12912", "IIFA-95-1997"],
      "typical_mortality_pct_min": 0,
      "typical_mortality_pct_max": 5,
      "is_active": true
    },
    {
      "id": "SHEEP_ESTUN_HEAD_TO_BODY",
      "dimensions": {
        "species": "sheep",
        "method": "electric_head_to_body",
        "reversibility": "nonreversible"
      },
      "verdicts": { "hanafi": 2, "maliki": 2, "shafii": 2, "hanbali": 2 },
      "required_evidence": [],
      "dossier_section_ref": "STUNNED_V1 §6 row 6 (tête-corps standard EU)",
      "fatwa_refs": ["IIFA-95-1997", "UNANIMOUS"],
      "typical_mortality_pct_min": 90,
      "typical_mortality_pct_max": 99,
      "notes_fr": "Arrêt cardiaque par fibrillation ventriculaire — méthode conçue pour tuer. Unanimement haram.",
      "is_active": true
    },
    {
      "id": "POULTRY_NOSTUN_MANUAL",
      "dimensions": {
        "species": "poultry",
        "method": "no_stun",
        "operator": "muslim",
        "tasmiya": "per_animal"
      },
      "verdicts": { "hanafi": 98, "maliki": 98, "shafii": 98, "hanbali": 98 },
      "required_evidence": [],
      "dossier_section_ref": "STUNNED_V1 §6 row 1 + MECH_V2 §7 hand slaughter",
      "fatwa_refs": ["UNANIMOUS"],
      "is_active": true
    },
    {
      "id": "POULTRY_SEMIAUTO_MUSLIM_CUTTERS",
      "dimensions": {
        "species": "poultry",
        "method": "semi_auto_muslim_cutters",
        "operator": "muslim",
        "tasmiya": "per_animal",
        "backup_slaughtermen": true
      },
      "verdicts": { "hanafi": 90, "maliki": 92, "shafii": 95, "hanbali": 92 },
      "required_evidence": ["fulltime_muslim_inspector"],
      "dossier_section_ref": "MECH_V2 §7 semi-automatisé",
      "fatwa_refs": ["MUI", "JAKIM", "IIFA-95-1997"],
      "notes_fr": "Satisfait toutes les positions savantes — consensus contemporain.",
      "is_active": true
    },
    {
      "id": "POULTRY_WATERBATH_STANDARD",
      "dimensions": {
        "species": "poultry",
        "method": "electric_waterbath",
        "variant": "standard_industry",
        "params": "high_voltage"
      },
      "verdicts": { "hanafi": 5, "maliki": 5, "shafii": 15, "hanbali": 3 },
      "required_evidence": [],
      "dossier_section_ref": "STUNNED_V1 §6 row 9 (bain d'eau standard industriel)",
      "fatwa_refs": ["IIFA-95-1997", "LAJNAH-DAIMAH", "DAR-IFTAA-EGYPT", "ECFR", "HMC"],
      "typical_mortality_pct_min": 10,
      "typical_mortality_pct_max": 30,
      "notes_fr": "Taux mortalité pré-abattage 10-30% (études EFSA). Haram majoritaire — contredit la condition de vie au moment de l'abattage.",
      "is_active": true
    },
    {
      "id": "POULTRY_WATERBATH_REDUCED_VERIFIED",
      "dimensions": {
        "species": "poultry",
        "method": "electric_waterbath",
        "variant": "reduced_params_verified",
        "wake_tests": true,
        "backup_slaughtermen": true
      },
      "verdicts": { "hanafi": 30, "maliki": 40, "shafii": 45, "hanbali": 30 },
      "required_evidence": ["mortality_rate_published", "wake_tests_performed", "fulltime_muslim_inspector"],
      "dossier_section_ref": "STUNNED_V1 §7 (note ARGML) + DAR_IFTAA_EGYPT_12912 (conditions techniques)",
      "fatwa_refs": ["DAR-IFTAA-EGYPT-12912", "IIFA-95-1997-conditional"],
      "typical_mortality_pct_min": 1,
      "typical_mortality_pct_max": 10,
      "notes_fr": "Position permissive minoritaire si protocole vérifié. La position majoritaire reste haram pour volaille. ARGML opère dans cette case.",
      "is_active": true
    },
    {
      "id": "POULTRY_CO2_HIGH",
      "dimensions": {
        "species": "poultry",
        "method": "co2",
        "concentration_pct_min": 70
      },
      "verdicts": { "hanafi": 2, "maliki": 2, "shafii": 5, "hanbali": 2 },
      "required_evidence": [],
      "dossier_section_ref": "STUNNED_V1 §6 row 11",
      "fatwa_refs": ["UNANIMOUS"],
      "notes_fr": "Létal par asphyxie (>70%) — munkhaniqah, unanimement haram.",
      "is_active": true
    },
    {
      "id": "POULTRY_CO2_LOW",
      "dimensions": {
        "species": "poultry",
        "method": "co2",
        "concentration_pct_max": 55
      },
      "verdicts": { "hanafi": 35, "maliki": 40, "shafii": 45, "hanbali": 30 },
      "required_evidence": ["mortality_rate_published"],
      "dossier_section_ref": "STUNNED_V1 §6 row 10 + MUI position",
      "fatwa_refs": ["MUI", "IIFA-95-1997-conditional"],
      "notes_fr": "Faible concentration — disputé. Minorité permissive.",
      "is_active": true
    },
    {
      "id": "MECH_SLAUGHTER_FULL_CERTIFIED_MUSLIM_OPERATOR",
      "dimensions": {
        "species": "poultry",
        "method": "mechanical_full",
        "tasmiya": "at_startup",
        "operator": "muslim",
        "certified_halal_body": true
      },
      "verdicts": { "hanafi": 45, "maliki": 65, "shafii": 78, "hanbali": 60 },
      "required_evidence": ["fulltime_muslim_inspector", "protocol_published"],
      "dossier_section_ref": "MECH_V2 §7 mécanique complet certifié",
      "fatwa_refs": ["MUI", "JAKIM", "IIFA-95-1997"],
      "notes_fr": "Débat central : Deobandi rejette (seul le 1er poulet halal), IIFA/MUI acceptent (opération continue = un acte). Shafi'i significativement plus permissif car tasmiya est sunna.",
      "is_active": true
    },
    {
      "id": "MECH_SLAUGHTER_RECORDED_BISMILLAH",
      "dimensions": {
        "species": "poultry",
        "method": "mechanical_full",
        "tasmiya": "recorded"
      },
      "verdicts": { "hanafi": 5, "maliki": 5, "shafii": 15, "hanbali": 3 },
      "required_evidence": [],
      "dossier_section_ref": "MECH_V2 §7 bismillah enregistré",
      "fatwa_refs": ["UNANIMOUS-REJECTED"],
      "notes_fr": "Unanimement rejeté — invocation enregistrée n'est pas une tasmiya valide.",
      "is_active": true
    }
  ]
}
```

- [ ] **Step 13.2: Re-run validator**

```bash
cd backend && pnpm validate:dossiers
```

Expected: all dossiers pass including the new `tuples_stunning.json`. Exit code 0. 15 tuples loaded.

- [ ] **Step 13.3: Commit**

```bash
git add docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/practices/stunning/tuples/tuples_stunning.json
git commit -m "feat(dossiers): seed 15 stunning practice tuples from dossier matrix

Literal translation of STUNNED_MEAT V1 §6 and MECHANICAL_SLAUGHTER V2
§7 scholarly scoring matrices into the PTF (Practice Tuple Framework)
format. Each tuple has per-madhab scores + dossier_section_ref
traceback + fatwa_refs.

Pilot set covering cattle/sheep/poultry × no_stun/electric_head_only/
head_to_body/waterbath (standard + reduced verified)/captive_bolt/
co2/mechanical_full/recorded_bismillah.

This is the scholarly ground-truth that HalalEngineV2 CertifierTrust
Engine will consume in Phase 4 to compute certifier trust scores
with the hard invariant: trustScore ≤ min(tuple_score) for accepted
practices in the user's madhab. Species-weighted by default.

Part of feat/halal-engine-v2 Phase 0."
```

---

## Task 14: Add the CI GitHub Actions workflow

**Files:**
- Create: `.github/workflows/validate-dossiers.yml`

- [ ] **Step 14.1: Create the workflow**

Create `.github/workflows/validate-dossiers.yml`:

```yaml
name: Validate Halal V2 Dossiers

on:
  pull_request:
    paths:
      - 'docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/**'
      - 'backend/src/schemas/halal-v2/**'
      - 'backend/scripts/validate-dossiers.ts'
      - 'backend/src/__tests__/unit/validate-dossiers.test.ts'
  push:
    branches: [main, 'feat/halal-engine-v2']
    paths:
      - 'docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/**'
      - 'backend/src/schemas/halal-v2/**'
      - 'backend/scripts/validate-dossiers.ts'

jobs:
  validate:
    name: Validate dossiers against V2 schemas
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: backend/pnpm-lock.yaml

      - name: Install backend deps
        working-directory: backend
        run: pnpm install --frozen-lockfile

      - name: Run validator unit tests
        working-directory: backend
        run: pnpm vitest run src/__tests__/unit/validate-dossiers.test.ts

      - name: Validate all dossiers against schemas
        working-directory: backend
        run: pnpm validate:dossiers
```

- [ ] **Step 14.2: Commit**

```bash
git add .github/workflows/validate-dossiers.yml
git commit -m "ci: add validate-dossiers workflow — block PRs on V2 schema violation

Runs the validator unit tests + the full dossier sweep on any PR that
touches dossiers, schemas, or the validator itself. Also runs on push
to main and feat/halal-engine-v2.

Establishes the Phase 0 guarantee: from now on, every change to a
dossier or schema is CI-gated."
```

---

## Task 15: Final Phase 0 verification

**Files:** none modified — this is a checkpoint.

- [ ] **Step 15.1: Run the full validator once more**

```bash
cd backend && pnpm validate:dossiers
```

Expected output (order may vary):
```
[validate-dossiers] 11 dossier files found
✓  dossiers_v2/json/naqiy_dossier_SHELLAC_v2.json (substance-dossier)
✓  dossiers_v2/json/naqiy_dossier_CARMINE_v2.json (substance-dossier)
✓  dossiers_v2/json/naqiy_dossier_E471_v2.json (substance-dossier)
✓  dossiers_v2/json/naqiy_dossier_GELATIN_v2.json (substance-dossier)
✓  dossiers_v2/json/naqiy_dossier_RENNET_v2.json (substance-dossier)
✓  dossiers_v2/json/naqiy_dossier_GLYCEROL_v2.json (substance-dossier)
✓  dossiers_v2/json/naqiy_dossier_SOY_LECITHIN_v2.json (substance-dossier)
✓  dossiers_v2/json/naqiy_dossier_ALCOHOL_FLAVORINGS_v2.json (substance-dossier)
✓  dossiers_v2/json/naqiy_dossier_LACTOSE_WHEY_v2.json (substance-dossier)
✓  dossiers_v2/practices/stunning/practice_STUNNING.json (practice-dossier)
✓  dossiers_v2/practices/stunning/tuples/tuples_stunning.json (practice-tuple)

[validate-dossiers] OK — all 11 dossiers valid
```
Exit code 0.

- [ ] **Step 15.2: Run the unit test suite**

```bash
cd backend && pnpm vitest run src/__tests__/unit/validate-dossiers.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 15.3: Verify no uncommitted changes**

```bash
git status
```

Expected: `working tree clean`.

- [ ] **Step 15.4: Tag the phase completion**

```bash
git tag -a halal-v2-phase-0 -m "Halal Engine V2 — Phase 0 (Foundation) complete

- 7 JSON Schemas committed (substance, practice, tuple, match-pattern,
  scenario, evaluation-trace, gemini-semantic)
- Validator script + unit tests
- 9 substance dossiers enriched with match_vocabulary
- SHELLAC id bug fixed (SUBST-008 → SUBST-012)
- STUNNING practice dossier + 15 tuples (dossier-anchored matrix)
- CI workflow gating all future dossier changes"
```

- [ ] **Step 15.5: Push the branch**

```bash
git push -u origin feat/halal-engine-v2
git push origin halal-v2-phase-0
```

Expected: branch + tag pushed to origin. CI runs automatically.

---

## Phase 0 Exit Criteria

Phase 0 is complete when:

1. ✅ All 7 JSON Schemas exist in `backend/src/schemas/halal-v2/`
2. ✅ `pnpm validate:dossiers` exits 0 on the current repo
3. ✅ Validator unit test suite (4 tests) passes
4. ✅ SHELLAC id bug is fixed
5. ✅ 9 substance dossiers have `match_vocabulary` filled multilingual
6. ✅ STUNNING practice dossier exists at `practices/stunning/practice_STUNNING.json`
7. ✅ 15 stunning tuples seeded with per-madhab scores + dossier refs
8. ✅ CI workflow `.github/workflows/validate-dossiers.yml` runs on PRs
9. ✅ Branch `feat/halal-engine-v2` is pushed, tagged `halal-v2-phase-0`

## What Phase 0 deliberately does NOT do

- ❌ No DB migrations (that's Phase 1)
- ❌ No engine code (that's Phases 2-5)
- ❌ No UI changes (that's Phase 6)
- ❌ No Gemini prompt changes yet (that's Phase 2)
- ❌ Mechanical slaughter and ahl kitab practice dossiers stay in their
  archived `_source_` form — they get proper structuring in Phase 7

## Next phase

After Phase 0 merges (or after this branch accumulates phases 1-8 then merges), the next plan file to write is:

`docs/superpowers/plans/2026-04-XX-halal-engine-v2-phase-1-data-model.md`

which will cover: Drizzle migrations for the V2 tables (§4 of spec), dossier compiler script, DB seeds.

---

**End of Phase 0 plan.**
