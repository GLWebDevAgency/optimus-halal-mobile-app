# Naqiy Trust Index V5.1 — Data Dictionary

> Developer reference for every database table, JSON source field, TypeScript type, and data pipeline involved in the Trust Score system.
>
> **Version**: V5.1 | **Last updated**: 2026-03-06 | **Schema source**: `backend/src/db/schema/certifiers.ts`

---

## Table of Contents

1. [Database Schema](#1-database-schema)
2. [JSON Source: certification-list.json](#2-json-source-certification-listjson)
3. [TypeScript Types](#3-typescript-types)
4. [Key Functions](#4-key-functions)
5. [Data Pipeline](#5-data-pipeline)
6. [API Response Shape](#6-api-response-shape)
7. [Field Mapping: JSON to DB to PracticeInputs](#7-field-mapping-json-to-db-to-practiceinputs)
8. [Constants](#8-constants)
9. [Related Documents](#9-related-documents)

---

## 1. Database Schema

### Table: `certifiers`

Primary reference table for halal certifier practice flags and materialized scores.

| Column | Type | Default | Nullable | Description |
|---|---|---|---|---|
| `id` | `VARCHAR(100)` PK | -- | NOT NULL | Matches `certification-list.json` `id` field |
| `name` | `VARCHAR(255)` | -- | NOT NULL | Certifier display name |
| `website` | `TEXT` | `NULL` | YES | Official website URL |
| `creation_year` | `INTEGER` | `NULL` | YES | Year of creation |
| `controllers_are_employees` | `BOOLEAN` | `NULL` | YES | Independent salaried controllers |
| `controllers_present_each_production` | `BOOLEAN` | `NULL` | YES | Present at every production run |
| `has_salaried_slaughterers` | `BOOLEAN` | `NULL` | YES | Slaughterers employed by certifier |
| `accepts_mechanical_slaughter` | `BOOLEAN` | `NULL` | YES | Accepts mechanical poultry slaughter |
| `accepts_electronarcosis` | `BOOLEAN` | `NULL` | YES | Accepts poultry electronarcosis |
| `accepts_post_slaughter_electrocution` | `BOOLEAN` | `NULL` | YES | Accepts post-slaughter electrocution |
| `accepts_stunning` | `BOOLEAN` | `NULL` | YES | Accepts stunning for cattle/calves/lambs |
| `accepts_vsm` | `BOOLEAN` | `NULL` | YES | Accepts VSM (Viande Separee Mecaniquement) |
| `transparency_public_charter` | `BOOLEAN` | `NULL` | YES | Public charter / cahier des charges |
| `transparency_audit_reports` | `BOOLEAN` | `NULL` | YES | Publishes audit/control reports |
| `transparency_company_list` | `BOOLEAN` | `NULL` | YES | Publishes list of certified companies |
| `controversy_penalty` | `INTEGER` | `0` | NOT NULL | Static legacy penalty from JSON (-50 to 0). Runtime uses `certifier_events` instead. |
| `halal_assessment` | `BOOLEAN` | `false` | NOT NULL | Derived verdict (NOT a score input) |
| `evidence_level` | `VARCHAR(20)` | `'declared'` | YES | `verified` / `declared` / `inferred` / `unknown` |
| `trust_score` | `INTEGER` | `0` | NOT NULL | Naqiy editorial score (0-100). Seeded as 0; runtime engine is authoritative. |
| `trust_score_hanafi` | `INTEGER` | `0` | NOT NULL | Hanafi-weighted score |
| `trust_score_shafii` | `INTEGER` | `0` | NOT NULL | Shafi'i-weighted score |
| `trust_score_maliki` | `INTEGER` | `0` | NOT NULL | Maliki-weighted score |
| `trust_score_hanbali` | `INTEGER` | `0` | NOT NULL | Hanbali-weighted score |
| `notes` | `TEXT[]` | `NULL` | YES | Array of editorial notes |
| `is_active` | `BOOLEAN` | `true` | NOT NULL | Soft delete flag |
| `created_at` | `TIMESTAMPTZ` | `NOW()` | NOT NULL | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOW()` | NOT NULL | Auto-updated via Drizzle `$onUpdateFn` |

**Indexes:**

| Index Name | Column(s) |
|---|---|
| `certifiers_trust_score_idx` | `trust_score` |
| `certifiers_halal_assessment_idx` | `halal_assessment` |

**Drizzle type exports:**

```typescript
export type Certifier = typeof certifiers.$inferSelect;
export type NewCertifier = typeof certifiers.$inferInsert;
```

---

### Table: `certifier_events`

Controversy timeline for radical transparency. Each event is verified from 2+ independent sources.

| Column | Type | Default | Nullable | Description |
|---|---|---|---|---|
| `id` | `UUID` PK | `gen_random_uuid()` | NOT NULL | Stable UUID (fixed in seed for idempotent upsert) |
| `certifier_id` | `VARCHAR(100)` FK | -- | NOT NULL | References `certifiers(id)` ON DELETE CASCADE |
| `event_type` | `VARCHAR(30)` | -- | NOT NULL | `controversy` / `separation` / `improvement` / `sanction` |
| `severity` | `VARCHAR(20)` | -- | NOT NULL | `critical` / `major` / `minor` / `positive` |
| `title_fr` | `VARCHAR(255)` | -- | NOT NULL | Event title (French) |
| `description_fr` | `TEXT` | -- | NOT NULL | Event details (French) |
| `source_name` | `VARCHAR(100)` | -- | NOT NULL | Source attribution (e.g. "Al-Kanz", "L214", "ASIDCOM") |
| `source_url` | `TEXT` | `NULL` | YES | Source link |
| `occurred_at` | `DATE` | -- | NOT NULL | When the event happened |
| `resolved_at` | `DATE` | `NULL` | YES | When resolved (`NULL` = ongoing) |
| `resolution_status` | `VARCHAR(30)` | -- | NOT NULL | `resolved` / `partially_resolved` / `ongoing` / `improvement` |
| `resolution_note_fr` | `TEXT` | `NULL` | YES | Resolution details (French) |
| `score_impact` | `INTEGER` | `0` | NOT NULL | Penalty value (-30 to +5). Added to raw before sigmoid. |
| `is_active` | `BOOLEAN` | `true` | NOT NULL | `false` = resolved/excluded from score computation |
| `created_at` | `TIMESTAMPTZ` | `NOW()` | NOT NULL | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOW()` | NOT NULL | Auto-updated via Drizzle `$onUpdateFn` |

**Indexes:**

| Index Name | Column(s) |
|---|---|
| `certifier_events_certifier_id_idx` | `certifier_id` |
| `certifier_events_type_idx` | `event_type` |
| `certifier_events_active_idx` | `is_active` |

**Drizzle type exports:**

```typescript
export type CertifierEvent = typeof certifierEvents.$inferSelect;
export type NewCertifierEvent = typeof certifierEvents.$inferInsert;
```

---

## 2. JSON Source: `certification-list.json`

**Path:** `backend/asset/certification-list.json`

Root structure: array of certifier entries. Currently 18 French halal certifiers.

### Entry schema

```jsonc
{
  "id": "achahada",                                    // string — PK, slug format
  "name": "ACHAHADA",                                  // string — display name
  "website": "https://www.achahada.com",               // string — official URL (empty string = no website)
  "creationYear": 2009,                                // number | null

  // Practice indicators (8 booleans)
  "controllersAreEmployees": true,                     // boolean | null
  "controllersPresentEachProduction": true,            // boolean | null
  "hasSalariedSlaughterers": false,                    // boolean | null
  "acceptsMechanicalPoultrySlaughter": false,          // boolean | null
  "acceptsPoultryElectronarcosis": false,              // boolean | null
  "acceptsPoultryElectrocutionPostSlaughter": false,   // boolean | null
  "acceptsStunningForCattleCalvesLambs": false,        // boolean | null
  "acceptsVsm": false,                                // boolean | null

  // Transparency indicators (3 booleans)
  "transparencyPublicCharter": true,                   // boolean | null
  "transparencyAuditReports": false,                   // boolean | null
  "transparencyCompanyList": true,                     // boolean | null

  // Assessment and meta
  "halal-assessment": true,                            // boolean | null — note: hyphenated key
  "controversyPenalty": 0,                             // number — legacy static penalty (runtime uses events)
  "evidenceLevel": "declared",                         // string — verified/declared/inferred/unknown
  "evidenceSources": [                                 // string[] — where the data comes from
    "achahada.com — charte halal et liste d'entreprises certifiees"
  ],
  "notes": [                                           // string[] — editorial notes
    "Charte halal publique sur achahada.com."
  ]
}
```

**Important:** The JSON uses descriptive field names (e.g. `acceptsMechanicalPoultrySlaughter`) while the DB uses short column names (e.g. `accepts_mechanical_slaughter`). The mapping is handled by the seed transformer in `backend/src/db/seeds/certifiers.ts`.

---

## 3. TypeScript Types

All types are defined in `backend/src/db/schema/certifiers.ts` unless otherwise noted.

### WeightSet

Per-indicator weight coefficients. One instance per madhab + one editorial.

```typescript
interface WeightSet {
  controllersAreEmployees: number;
  controllersPresentEachProduction: number;
  hasSalariedSlaughterers: number;
  acceptsMechanicalSlaughter: number;
  acceptsElectronarcosis: number;
  acceptsPostSlaughterElectrocution: number;
  acceptsStunning: number;
  acceptsVsm: number;
  transparencyBonus: number;  // per-indicator (applied up to 3x)
}
```

### PracticeInputs

Input to all score computation functions. Uses descriptive field names.

```typescript
interface PracticeInputs {
  controllersAreEmployees: boolean | null;
  controllersPresentEachProduction: boolean | null;
  hasSalariedSlaughterers: boolean | null;
  acceptsMechanicalPoultrySlaughter: boolean | null;
  acceptsPoultryElectronarcosis: boolean | null;
  acceptsPoultryElectrocutionPostSlaughter: boolean | null;
  acceptsStunningForCattleCalvesLambs: boolean | null;
  acceptsVsm: boolean | null;
  transparencyPublicCharter?: boolean | null;
  transparencyAuditReports?: boolean | null;
  transparencyCompanyList?: boolean | null;
  controversyPenalty?: number;
}
```

### TrustScoreDetail

Returned by `computeTrustScoreDetail()`. Contains the composite score, 4 semantic blocks for the UI breakdown, and metadata.

```typescript
export interface TrustScoreDetail {
  score: number;
  blocks: {
    ritualValidity: number;        // 0-100 — Bloc A: negative practices avoided
    operationalAssurance: number;  // 0-100 — Bloc B: positive practices present
    productQuality: number;        // 0-100 — Bloc C: tayyib (VSM)
    transparency: number;          // 0-100 — Bloc D: transparency + controversy
  };
  cap?: number;                    // Present only if a cap was applied
  evidenceLevel: EvidenceLevel;
}
```

### EvidenceLevel

```typescript
export type EvidenceLevel = "verified" | "declared" | "inferred" | "unknown";
```

### MadhabKey

```typescript
export type MadhabKey = "hanafi" | "shafii" | "maliki" | "hanbali";
```

### CertifierScores (from `certifier-score.service.ts`)

```typescript
export interface CertifierScores {
  trustScore: number;
  trustScoreHanafi: number;
  trustScoreShafii: number;
  trustScoreMaliki: number;
  trustScoreHanbali: number;
  controversyPenalty: number;
}
```

### CertifierPractices (from `certifier-score.service.ts`)

```typescript
export interface CertifierPractices {
  controllersAreEmployees: boolean | null;
  controllersPresentEachProduction: boolean | null;
  hasSalariedSlaughterers: boolean | null;
  acceptsMechanicalSlaughter: boolean | null;
  acceptsElectronarcosis: boolean | null;
  acceptsPostSlaughterElectrocution: boolean | null;
  acceptsStunning: boolean | null;
  acceptsVsm: boolean | null;
  transparencyPublicCharter: boolean | null;
  transparencyAuditReports: boolean | null;
  transparencyCompanyList: boolean | null;
}
```

Note: `CertifierPractices` uses the **DB column names** (short form), not the `PracticeInputs` descriptive names.

### CertifierWithScores (from `certifier-score.service.ts`)

```typescript
export interface CertifierWithScores {
  id: string;
  name: string;
  website: string | null;
  halalAssessment: boolean;
  scores: CertifierScores;
  practices: CertifierPractices;
  detail: TrustScoreDetail;
}
```

---

## 4. Key Functions

All functions are in `backend/src/db/schema/certifiers.ts` unless otherwise noted.

### Score Computation Pipeline

| Function | Signature | Description |
|---|---|---|
| `computeRawScore` | `(practices: PracticeInputs, weights: WeightSet) => number` | Sum of weighted indicators. Positive: `true` = bonus, `null` = -3 penalty, `false` = 0. Negative: `true` = penalty, `false`/`null` = 0. Adds transparency bonus and controversy penalty. |
| `normalizeScore` | `(raw: number, weights: WeightSet) => number` | Sigmoid normalization to 0-100. Centered at `raw=0`, steepness `k=0.06`. Renormalized so `maxRaw` maps to 100, `minRaw` maps to 0. |
| `applyCaps` | `(practices: PracticeInputs, sigmoidScore: number) => { score: number; cap?: number }` | Post-sigmoid guardrails. 3 critical negatives -> cap 35. 2 critical negatives -> cap 55. 0 positive indicators -> cap 45. |
| `computeTrustScore` | `(practices: PracticeInputs) => number` | Full pipeline: `computeRawScore` -> `normalizeScore` -> `applyCaps`. Uses `NAQIY_EDITORIAL_WEIGHTS`. |
| `computeTrustScoreForMadhab` | `(practices: PracticeInputs, madhab: MadhabKey) => number` | Same pipeline with madhab-specific weight table from `MADHAB_WEIGHTS`. |
| `computeAllTrustScores` | `(practices: PracticeInputs) => { trustScore, trustScoreHanafi, trustScoreShafii, trustScoreMaliki, trustScoreHanbali }` | Computes all 5 scores (editorial + 4 madhabs) in a single call. |
| `computeTrustScoreDetail` | `(practices: PracticeInputs, weights?: WeightSet) => TrustScoreDetail` | Full score + 4 semantic blocks + cap + evidence level. Defaults to editorial weights. |

### Evidence and Controversy

| Function | Signature | Description |
|---|---|---|
| `inferEvidenceLevel` | `(practices: PracticeInputs) => EvidenceLevel` | Determines evidence level from null count across 6 core practice fields. 0 nulls = `declared`, 1-2 = `inferred`, 3+ = `unknown`. `verified` requires explicit marking in JSON. |
| `computeControversyPenalty` | `(events: EventForDecay[], referenceDate?: Date) => number` | Time-decayed penalty from events. Formula: `SUM(scoreImpact * e^(-lambda * yearsAgo))`. Half-life = 5 years. Inactive events excluded. Clamped to [-50, 0]. |

### Runtime Service (`backend/src/services/certifier-score.service.ts`)

| Function | Signature | Description |
|---|---|---|
| `getCertifierScores` | `(db: Database, redis: Redis, certifierId: string) => Promise<CertifierWithScores \| null>` | Single certifier: loads raw flags + events from DB, computes dynamic penalty, computes all scores, caches in Redis (TTL 1h). |
| `getAllCertifierScores` | `(db: Database, redis: Redis) => Promise<CertifierWithScores[]>` | Batch computation for all active certifiers. Loads all events in one query (avoids N+1). Returns sorted by editorial `trustScore` descending. Cache key: `certifier:scores:v5:all`. |

---

## 5. Data Pipeline

```
certification-list.json
        |
        v
  seed (backend/src/db/seeds/certifiers.ts)
  transformCertifier() maps JSON fields to DB columns
  trust_score columns seeded as 0 (not pre-computed)
        |
        v
  DB: certifiers table (raw practice booleans)
  DB: certifier_events table (controversy timeline)
        |
        v
  certifier-score.service.ts (runtime computation)
    1. Read raw flags from certifiers table
    2. Read active events from certifier_events table
    3. computeControversyPenalty() with time-decay
    4. computeAllTrustScores() with dynamic penalty
    5. computeTrustScoreDetail() for block breakdown
    6. Cache result in Redis (TTL 1h)
        |
        v
  scan.ts tRPC router
  getCertifierScores(db, redis, certifierId)
  Returns scores + practices + detail to frontend
```

### Why runtime computation instead of seed-time?

1. **Time-decay**: `computeControversyPenalty` uses `e^(-lambda*t)` -- the penalty changes daily as events age.
2. **Weight tuning**: If weights in `MADHAB_WEIGHTS` or `NAQIY_EDITORIAL_WEIGHTS` are adjusted, scores update immediately without re-seeding.
3. **Separation of concerns**: Seed = raw data ingestion. Runtime engine = intelligence layer.

### Redis Cache Strategy

| Cache Key | TTL | Content |
|---|---|---|
| `certifier:scores:v5:{certifierId}` | 3600s (1h) | Single `CertifierWithScores` object |
| `certifier:scores:v5:all` | 3600s (1h) | Array of all `CertifierWithScores`, sorted by editorial score desc |

Cache is managed via `withCache()` from `backend/src/lib/cache.ts`. No explicit invalidation -- TTL-based expiry only. Events change rarely enough that 1h staleness is acceptable.

---

## 6. API Response Shape

In the `scan.ts` tRPC router, when a product has a recognized certifier, the response includes `certifierData`:

```typescript
certifierData: {
  id: string;
  name: string;
  trustScore: number;
  trustScoreHanafi: number;
  trustScoreShafii: number;
  trustScoreMaliki: number;
  trustScoreHanbali: number;
  website: string | null;
  halalAssessment: boolean;
  practices: {
    controllersAreEmployees: boolean | null;
    controllersPresentEachProduction: boolean | null;
    hasSalariedSlaughterers: boolean | null;
    acceptsMechanicalSlaughter: boolean | null;
    acceptsElectronarcosis: boolean | null;
    acceptsPostSlaughterElectrocution: boolean | null;
    acceptsStunning: boolean | null;
    acceptsVsm: boolean | null;
    transparencyPublicCharter: boolean | null;
    transparencyAuditReports: boolean | null;
    transparencyCompanyList: boolean | null;
  };
  detail: {
    score: number;
    blocks: {
      ritualValidity: number;
      operationalAssurance: number;
      productQuality: number;
      transparency: number;
    };
    cap?: number;
    evidenceLevel: 'verified' | 'declared' | 'inferred' | 'unknown';
  };
} | null
```

When the certifier is not found or the product has no certifier, `certifierData` is `null`.

---

## 7. Field Mapping: JSON to DB to PracticeInputs

Three naming conventions coexist. The seed transformer and the runtime service each handle their respective mapping.

| JSON (certification-list.json) | DB Column (certifiers) | PracticeInputs field |
|---|---|---|
| `controllersAreEmployees` | `controllers_are_employees` | `controllersAreEmployees` |
| `controllersPresentEachProduction` | `controllers_present_each_production` | `controllersPresentEachProduction` |
| `hasSalariedSlaughterers` | `has_salaried_slaughterers` | `hasSalariedSlaughterers` |
| `acceptsMechanicalPoultrySlaughter` | `accepts_mechanical_slaughter` | `acceptsMechanicalPoultrySlaughter` |
| `acceptsPoultryElectronarcosis` | `accepts_electronarcosis` | `acceptsPoultryElectronarcosis` |
| `acceptsPoultryElectrocutionPostSlaughter` | `accepts_post_slaughter_electrocution` | `acceptsPoultryElectrocutionPostSlaughter` |
| `acceptsStunningForCattleCalvesLambs` | `accepts_stunning` | `acceptsStunningForCattleCalvesLambs` |
| `acceptsVsm` | `accepts_vsm` | `acceptsVsm` |
| `transparencyPublicCharter` | `transparency_public_charter` | `transparencyPublicCharter` |
| `transparencyAuditReports` | `transparency_audit_reports` | `transparencyAuditReports` |
| `transparencyCompanyList` | `transparency_company_list` | `transparencyCompanyList` |
| `halal-assessment` | `halal_assessment` | -- (not a score input) |
| `controversyPenalty` | `controversy_penalty` | `controversyPenalty` (runtime: from events) |
| `evidenceLevel` | `evidence_level` | -- (computed by `inferEvidenceLevel`) |
| `evidenceSources` | -- (not stored in DB) | -- |
| `notes` | `notes` | -- |

**Mapping code locations:**
- JSON -> DB: `transformCertifier()` in `backend/src/db/seeds/certifiers.ts`
- DB -> PracticeInputs: inline in `getCertifierScores()` / `getAllCertifierScores()` in `backend/src/services/certifier-score.service.ts`

---

## 8. Constants

### Scoring Constants

| Constant | Value | Location | Description |
|---|---|---|---|
| `SIGMOID_K` | `0.06` | `certifiers.ts` | Steepness of sigmoid normalization curve |
| `NULL_POSITIVE_PENALTY` | `-3` | `certifiers.ts` | Penalty for `null` on positive indicators (opacity reduces trust) |
| `CONTROVERSY_HALF_LIFE_YEARS` | `5` | `certifiers.ts` | Half-life for time-decay of controversy penalty |
| `CONTROVERSY_LAMBDA` | `ln(2) / 5 ~ 0.1386` | `certifiers.ts` | Decay constant derived from half-life |

### Cap Thresholds

| Condition | Cap Value | Rationale |
|---|---|---|
| 3 critical negatives accepted (mechanical + stunning + electronarcosis) | 35 | Prevents compensatory scoring from good practices |
| 2 critical negatives accepted | 55 | Moderate cap |
| 0 positive indicators (no controllers, no slaughterers) | 45 | No operational assurance = hard ceiling |

### Weight Tables

**Naqiy Editorial Weights** (`NAQIY_EDITORIAL_WEIGHTS`):

| Indicator | Weight | Category |
|---|---|---|
| `controllersAreEmployees` | +15 | Positive |
| `controllersPresentEachProduction` | +15 | Positive |
| `hasSalariedSlaughterers` | +10 | Positive |
| `acceptsMechanicalSlaughter` | -20 | Negative (critical) |
| `acceptsStunning` | -18 | Negative (critical) |
| `acceptsElectronarcosis` | -12 | Negative (critical) |
| `acceptsVsm` | -8 | Negative (tayyib) |
| `acceptsPostSlaughterElectrocution` | -2 | Negative (marginal) |
| `transparencyBonus` | +5 | Bonus (per indicator, max 3x) |

**Max raw**: +55 (all positives + 3x transparency). **Min raw**: -69 (3 null penalties + all negatives).

**Per-Madhab Weights** (`MADHAB_WEIGHTS`):

| Indicator | Hanafi | Shafi'i | Maliki | Hanbali | Basis |
|---|---|---|---|---|---|
| `controllersAreEmployees` | +15 | +15 | +15 | +15 | A |
| `controllersPresentEachProduction` | +15 | +15 | +15 | +15 | A |
| `hasSalariedSlaughterers` | +15 | +10 | +5 | +12 | A |
| `acceptsMechanicalSlaughter` | -25 | -18 | -14 | -22 | A+B |
| `acceptsStunning` | -20 | -14 | -10 | -18 | B+C |
| `acceptsElectronarcosis` | -14 | -10 | -6 | -13 | B+C |
| `acceptsPostSlaughterElectrocution` | -3 | -2 | -1 | -3 | A+C |
| `acceptsVsm` | -8 | -7 | -5 | -8 | B |
| `transparencyBonus` | +5 | +5 | +5 | +5 | -- |

**Basis key**: A = classical textual, B = contemporary derived, C = empirical/operational.

**Hierarchy invariant** (enforced in all schools): `|mechanical| > |stunning| > |electronarcosis|`

**Cross-school order** (strictest to most permissive): Hanafi > Hanbali > Shafi'i > Maliki

---

## 9. Related Documents

| Document | Path |
|---|---|
| Trust Score Formula (algorithm deep-dive) | [trust-score-formula.md](trust-score-formula.md) |
| Trust Score Complete (full methodology) | [trust-score-complete.md](trust-score-complete.md) |
| Madhab Weights (fiqh sourcing for every weight) | [trust-score-madhab-weights.md](trust-score-madhab-weights.md) |
| Trust Score Whitepaper (investor/public) | [trust-score-whitepaper.md](trust-score-whitepaper.md) |
| Trust Score Roadmap (planned improvements) | [trust-score-roadmap.md](trust-score-roadmap.md) |
| Trust Score Changelog (version history) | [trust-score-changelog.md](trust-score-changelog.md) |

### Source Files

| File | Role |
|---|---|
| `backend/src/db/schema/certifiers.ts` | Schema, types, weight tables, all computation functions |
| `backend/src/services/certifier-score.service.ts` | Runtime scoring engine with Redis cache |
| `backend/src/db/seeds/certifiers.ts` | JSON-to-DB seed transformer |
| `backend/src/db/seeds/seed-certifier-events.ts` | Event timeline seed data |
| `backend/asset/certification-list.json` | Raw certifier practice data (18 entries) |
| `backend/src/trpc/routers/scan.ts` | API endpoint that returns certifier scores to frontend |
