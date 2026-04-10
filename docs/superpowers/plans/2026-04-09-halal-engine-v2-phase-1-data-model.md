# Halal Engine V2 — Phase 1: Data Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create all V2 database tables (Drizzle ORM schemas + hand-written SQL migrations), extend the products table, build the dossier compiler that seeds substances/practices/tuples from the Phase 0 JSON corpus, and wire it into the deploy entrypoint.

**Architecture:** Phase 1 is data-only — no engine code, no API changes, no UI. The output is a fully seeded V2 data layer that Phase 2 (Gemini V2) and Phase 3 (HalalEngineV2) can consume. All new tables coexist with V1 tables. Zero breaking changes to existing flows.

**Tech Stack:** Drizzle ORM v0.36+, PostgreSQL 17, tsx scripts, vitest, hand-written SQL migrations (project convention — no `drizzle-kit generate`).

**Spec reference:** [2026-04-09-halal-engine-v2-design.md](../specs/2026-04-09-halal-engine-v2-design.md) §4 (Data Model), §3 (PTF), §13 (Naqiy Watch), Appendix D issues C3, H10, H11, H12, H15, H19.

**Branch:** `feat/halal-engine-v2` (continues from Phase 0 tag `halal-v2-phase-0`).

**Pre-Phase check:** Confirm `pnpm validate:dossiers` still passes (Phase 0 gate).

**Critical issue awareness (from Appendix D):**
- **C3**: `certifier_tuple_acceptance` must have SCD type 2 (`valid_from`/`valid_to`)
- **H10**: All new `products` columns MUST be nullable (zero-downtime PG metadata-only ADD COLUMN)
- **H11**: `practice_tuples` uses UUID PK + unique `slug` constraint
- **H12**: Per-family dimension validation via `practice_families` table
- **H15**: `halal_evaluations` gets first-class `status` enum + `degradation_reason`
- **H19**: Dossier compiler preserves N previous dossier versions via `is_active` toggle

---

## File Structure

```
backend/
  src/
    db/
      schema/
        substances.ts              (Task 1)
        substance-dossiers.ts      (Task 1)
        substance-match-patterns.ts (Task 1)
        substance-scenarios.ts     (Task 1)
        substance-madhab-rulings.ts (Task 1)
        practices.ts               (Task 2)
        practice-dossiers.ts       (Task 2)
        practice-tuples.ts         (Task 2)
        practice-families.ts       (Task 2)
        certifier-tuple-acceptance.ts (Task 3)
        halal-evaluations.ts       (Task 4)
        certifier-reports.ts       (Task 5)
        charter-versions.ts        (Task 5)
        index.ts                   (Task 6 — add exports)
      seeds/
        compile-dossiers.ts        (Task 7)
        seed-substances.ts         (Task 7)
        seed-practice-tuples.ts    (Task 7)
  drizzle/
    0037_halal_v2_substances.sql     (Task 8)
    0038_halal_v2_practices.sql      (Task 8)
    0039_halal_v2_certifier_tuples.sql (Task 8)
    0040_halal_v2_evaluations.sql    (Task 8)
    0041_halal_v2_naqiy_watch.sql    (Task 8)
    0042_products_v2_engine_cols.sql  (Task 8)
  __tests__/
    unit/
      compile-dossiers.test.ts     (Task 7)
```

---

## Task 1: Drizzle schemas — Substances (5 tables)

**Files:**
- Create: `backend/src/db/schema/substances.ts`
- Create: `backend/src/db/schema/substance-dossiers.ts`
- Create: `backend/src/db/schema/substance-match-patterns.ts`
- Create: `backend/src/db/schema/substance-scenarios.ts`
- Create: `backend/src/db/schema/substance-madhab-rulings.ts`

- [ ] **Step 1.1: Create `substances.ts`**

```typescript
import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const substances = pgTable(
  "substances",
  {
    id: t.varchar({ length: 50 }).primaryKey(),         // "SHELLAC", "E471"
    slug: t.varchar({ length: 50 }).unique().notNull(),
    nameFr: t.varchar("name_fr", { length: 255 }).notNull(),
    nameEn: t.varchar("name_en", { length: 255 }).notNull(),
    nameAr: t.varchar("name_ar", { length: 255 }),
    eNumbers: t.text("e_numbers").array().default([]),
    tier: t.smallint().notNull(),                        // 1..4
    priorityScore: t.smallint("priority_score").notNull(), // 0..100
    fiqhIssues: t.text("fiqh_issues").array().notNull(),
    issueType: t.varchar("issue_type", { length: 30 }).notNull(),
    activeDossierId: t.uuid("active_dossier_id"),        // FK added after dossiers table
    isActive: t.boolean("is_active").default(true).notNull(),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    t.index("substances_tier_idx").on(table.tier),
    t.index("substances_priority_idx").on(table.priorityScore),
  ]
);

export type Substance = typeof substances.$inferSelect;
export type NewSubstance = typeof substances.$inferInsert;
```

- [ ] **Step 1.2: Create `substance-dossiers.ts`**

```typescript
import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { substances } from "./substances.js";

export const substanceDossiers = pgTable(
  "substance_dossiers",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    substanceId: t.varchar("substance_id", { length: 50 }).notNull()
      .references(() => substances.id, { onDelete: "cascade" }),
    version: t.varchar({ length: 20 }).notNull(),
    schemaVersion: t.varchar("schema_version", { length: 30 }).notNull(),
    dossierJson: t.jsonb("dossier_json").notNull(),
    contentHash: t.varchar("content_hash", { length: 64 }).notNull(),
    verifiedAt: t.timestamp("verified_at", { withTimezone: true }),
    verificationPasses: t.smallint("verification_passes"),
    fatwaCount: t.smallint("fatwa_count"),
    isActive: t.boolean("is_active").default(false).notNull(),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    t.uniqueIndex("substance_dossiers_substance_version_idx")
      .on(table.substanceId, table.version),
    t.index("substance_dossiers_json_gin_idx").using("gin", table.dossierJson),
  ]
);

export type SubstanceDossier = typeof substanceDossiers.$inferSelect;
export type NewSubstanceDossier = typeof substanceDossiers.$inferInsert;
```

- [ ] **Step 1.3: Create `substance-match-patterns.ts`**

```typescript
import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { substances } from "./substances.js";

export const substanceMatchPatterns = pgTable(
  "substance_match_patterns",
  {
    id: t.bigserial({ mode: "number" }).primaryKey(),
    substanceId: t.varchar("substance_id", { length: 50 }).notNull()
      .references(() => substances.id, { onDelete: "cascade" }),
    patternType: t.varchar("pattern_type", { length: 30 }).notNull(),
    patternValue: t.text("pattern_value").notNull(),
    lang: t.varchar({ length: 5 }),
    priority: t.smallint().default(50).notNull(),
    confidence: t.real().default(1.0).notNull(),
    source: t.varchar({ length: 30 }).default("dossier_compiler").notNull(),
  },
  (table) => [
    t.index("smp_type_value_idx").on(table.patternType, table.patternValue),
    t.index("smp_substance_idx").on(table.substanceId),
  ]
);

export type SubstanceMatchPattern = typeof substanceMatchPatterns.$inferSelect;
export type NewSubstanceMatchPattern = typeof substanceMatchPatterns.$inferInsert;
```

- [ ] **Step 1.4: Create `substance-scenarios.ts`**

```typescript
import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { substances } from "./substances.js";

export const substanceScenarios = pgTable(
  "substance_scenarios",
  {
    id: t.bigserial({ mode: "number" }).primaryKey(),
    substanceId: t.varchar("substance_id", { length: 50 }).notNull()
      .references(() => substances.id, { onDelete: "cascade" }),
    scenarioKey: t.varchar("scenario_key", { length: 80 }).notNull(),
    matchConditions: t.jsonb("match_conditions").notNull(),
    specificity: t.smallint().notNull(),
    score: t.smallint().notNull(),
    verdict: t.varchar({ length: 30 }).notNull(),
    rationaleFr: t.text("rationale_fr").notNull(),
    rationaleEn: t.text("rationale_en"),
    rationaleAr: t.text("rationale_ar"),
    dossierSectionRef: t.varchar("dossier_section_ref", { length: 100 }),
  },
  (table) => [
    t.uniqueIndex("ss_substance_scenario_idx")
      .on(table.substanceId, table.scenarioKey),
    t.index("ss_substance_specificity_idx")
      .on(table.substanceId, table.specificity),
  ]
);

export type SubstanceScenario = typeof substanceScenarios.$inferSelect;
export type NewSubstanceScenario = typeof substanceScenarios.$inferInsert;
```

- [ ] **Step 1.5: Create `substance-madhab-rulings.ts`**

```typescript
import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { substances } from "./substances.js";

export const substanceMadhabRulings = pgTable(
  "substance_madhab_rulings",
  {
    substanceId: t.varchar("substance_id", { length: 50 }).notNull()
      .references(() => substances.id, { onDelete: "cascade" }),
    madhab: t.varchar({ length: 10 }).notNull(),
    ruling: t.varchar({ length: 20 }).notNull(),
    contemporarySplit: t.boolean("contemporary_split").default(false).notNull(),
    classicalSources: t.text("classical_sources").array().default([]),
    contemporarySources: t.text("contemporary_sources").array().default([]),
  },
  (table) => [
    t.primaryKey({ columns: [table.substanceId, table.madhab] }),
  ]
);

export type SubstanceMadhabRuling = typeof substanceMadhabRulings.$inferSelect;
export type NewSubstanceMadhabRuling = typeof substanceMadhabRulings.$inferInsert;
```

- [ ] **Step 1.6: Verify TypeScript compiles**

```bash
cd backend && pnpm exec tsc --noEmit src/db/schema/substances.ts src/db/schema/substance-dossiers.ts src/db/schema/substance-match-patterns.ts src/db/schema/substance-scenarios.ts src/db/schema/substance-madhab-rulings.ts 2>&1 | head -20
```

Expected: no errors (or only pre-existing ones from other files).

- [ ] **Step 1.7: Commit**

```bash
git add backend/src/db/schema/substances.ts \
        backend/src/db/schema/substance-dossiers.ts \
        backend/src/db/schema/substance-match-patterns.ts \
        backend/src/db/schema/substance-scenarios.ts \
        backend/src/db/schema/substance-madhab-rulings.ts
git commit -m "feat(schema): add V2 substance tables (5 Drizzle schemas)

substances, substance_dossiers, substance_match_patterns,
substance_scenarios, substance_madhab_rulings — per spec §4.1.

Part of feat/halal-engine-v2 Phase 1 (data model)."
```

---

## Task 2: Drizzle schemas — Practices (4 tables)

**Files:**
- Create: `backend/src/db/schema/practice-families.ts`
- Create: `backend/src/db/schema/practices.ts`
- Create: `backend/src/db/schema/practice-dossiers.ts`
- Create: `backend/src/db/schema/practice-tuples.ts`

- [ ] **Step 2.1: Create `practice-families.ts` (per H12 — dimension schema per family)**

```typescript
import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const practiceFamilies = pgTable(
  "practice_families",
  {
    id: t.varchar({ length: 50 }).primaryKey(), // "stunning", "mechanical_slaughter"
    nameFr: t.varchar("name_fr", { length: 100 }).notNull(),
    nameEn: t.varchar("name_en", { length: 100 }).notNull(),
    dimensionSchema: t.jsonb("dimension_schema"),  // JSON Schema for dimensions validation
    isActive: t.boolean("is_active").default(true).notNull(),
  }
);

export type PracticeFamily = typeof practiceFamilies.$inferSelect;
export type NewPracticeFamily = typeof practiceFamilies.$inferInsert;
```

- [ ] **Step 2.2: Create `practices.ts`**

```typescript
import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { practiceFamilies } from "./practice-families.js";

export const practices = pgTable(
  "practices",
  {
    id: t.varchar({ length: 50 }).primaryKey(), // "STUNNING", "MECHANICAL_SLAUGHTER"
    slug: t.varchar({ length: 50 }).unique().notNull(),
    familyId: t.varchar("family_id", { length: 50 }).notNull()
      .references(() => practiceFamilies.id),
    nameFr: t.varchar("name_fr", { length: 255 }).notNull(),
    nameEn: t.varchar("name_en", { length: 255 }).notNull(),
    nameAr: t.varchar("name_ar", { length: 255 }),
    severityTier: t.smallint("severity_tier").notNull(),
    activeDossierId: t.uuid("active_dossier_id"),
    isActive: t.boolean("is_active").default(true).notNull(),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    t.index("practices_family_idx").on(table.familyId),
  ]
);

export type Practice = typeof practices.$inferSelect;
export type NewPractice = typeof practices.$inferInsert;
```

- [ ] **Step 2.3: Create `practice-dossiers.ts`**

```typescript
import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { practices } from "./practices.js";

export const practiceDossiers = pgTable(
  "practice_dossiers",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    practiceId: t.varchar("practice_id", { length: 50 }).notNull()
      .references(() => practices.id, { onDelete: "cascade" }),
    version: t.varchar({ length: 20 }).notNull(),
    schemaVersion: t.varchar("schema_version", { length: 30 }).notNull(),
    dossierJson: t.jsonb("dossier_json").notNull(),
    contentHash: t.varchar("content_hash", { length: 64 }).notNull(),
    verifiedAt: t.timestamp("verified_at", { withTimezone: true }),
    isActive: t.boolean("is_active").default(false).notNull(),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    t.uniqueIndex("practice_dossiers_practice_version_idx")
      .on(table.practiceId, table.version),
  ]
);

export type PracticeDossier = typeof practiceDossiers.$inferSelect;
export type NewPracticeDossier = typeof practiceDossiers.$inferInsert;
```

- [ ] **Step 2.4: Create `practice-tuples.ts` (per H11 — UUID PK + slug unique)**

```typescript
import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { practiceFamilies } from "./practice-families.js";
import { practiceDossiers } from "./practice-dossiers.js";

export const practiceTuples = pgTable(
  "practice_tuples",
  {
    id: t.uuid().defaultRandom().primaryKey(),       // H11: UUID PK for history stability
    slug: t.varchar({ length: 80 }).unique().notNull(), // human-readable ("CATTLE_NOSTUN_MANUAL")
    familyId: t.varchar("family_id", { length: 50 }).notNull()
      .references(() => practiceFamilies.id),
    dimensions: t.jsonb().notNull(),
    verdictHanafi: t.smallint("verdict_hanafi").notNull(),
    verdictMaliki: t.smallint("verdict_maliki").notNull(),
    verdictShafii: t.smallint("verdict_shafii").notNull(),
    verdictHanbali: t.smallint("verdict_hanbali").notNull(),
    requiredEvidence: t.text("required_evidence").array().default([]),
    dossierId: t.uuid("dossier_id")
      .references(() => practiceDossiers.id),
    dossierSectionRef: t.varchar("dossier_section_ref", { length: 200 }).notNull(),
    fatwaRefs: t.text("fatwa_refs").array().default([]),
    typicalMortalityPctMin: t.real("typical_mortality_pct_min"),
    typicalMortalityPctMax: t.real("typical_mortality_pct_max"),
    notesFr: t.text("notes_fr"),
    notesEn: t.text("notes_en"),
    notesAr: t.text("notes_ar"),
    isActive: t.boolean("is_active").default(true).notNull(),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    t.index("pt_family_idx").on(table.familyId),
    t.index("pt_dims_gin_idx").using("gin", table.dimensions),
  ]
);

export type PracticeTuple = typeof practiceTuples.$inferSelect;
export type NewPracticeTuple = typeof practiceTuples.$inferInsert;
```

- [ ] **Step 2.5: Verify + commit**

```bash
cd backend && pnpm exec tsc --noEmit src/db/schema/practice-families.ts src/db/schema/practices.ts src/db/schema/practice-dossiers.ts src/db/schema/practice-tuples.ts 2>&1 | head -10
git add backend/src/db/schema/practice-families.ts \
        backend/src/db/schema/practices.ts \
        backend/src/db/schema/practice-dossiers.ts \
        backend/src/db/schema/practice-tuples.ts
git commit -m "feat(schema): add V2 practice tables (4 Drizzle schemas)

practice_families (H12 dimension schema per family),
practices, practice_dossiers, practice_tuples (H11 UUID PK + slug).

Part of feat/halal-engine-v2 Phase 1."
```

---

## Task 3: Drizzle schema — Certifier Tuple Acceptance (C3 SCD type 2)

**Files:**
- Create: `backend/src/db/schema/certifier-tuple-acceptance.ts`

- [ ] **Step 3.1: Create schema with SCD type 2 columns**

```typescript
import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { certifiers } from "./certifiers.js";
import { practiceTuples } from "./practice-tuples.js";
import { users } from "./users.js";

export const certifierTupleAcceptance = pgTable(
  "certifier_tuple_acceptance",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    certifierId: t.varchar("certifier_id", { length: 100 }).notNull()
      .references(() => certifiers.id, { onDelete: "cascade" }),
    practiceTupleId: t.uuid("practice_tuple_id").notNull()
      .references(() => practiceTuples.id, { onDelete: "cascade" }),
    stance: t.varchar({ length: 20 }).notNull(),      // accepts|rejects|unknown|conditional
    evidenceLevel: t.varchar("evidence_level", { length: 30 }).notNull(),
    evidenceDetails: t.jsonb("evidence_details"),
    since: t.date(),
    lastVerifiedAt: t.timestamp("last_verified_at", { withTimezone: true }),
    verifiedByUserId: t.uuid("verified_by_user_id")
      .references(() => users.id, { onDelete: "set null" }),
    // C3: SCD type 2 for temporal dimension — enables audit replay
    validFrom: t.timestamp("valid_from", { withTimezone: true }).defaultNow().notNull(),
    validTo: t.timestamp("valid_to", { withTimezone: true }),  // null = current
    isCurrent: t.boolean("is_current").default(true).notNull(),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Current acceptance lookup: certifier × tuple × is_current
    t.index("cta_certifier_current_idx")
      .on(table.certifierId, table.isCurrent)
      .where(t.sql`is_current = true`),
    t.index("cta_tuple_idx").on(table.practiceTupleId),
    // Unique: one current acceptance per certifier × tuple
    t.uniqueIndex("cta_certifier_tuple_current_idx")
      .on(table.certifierId, table.practiceTupleId)
      .where(t.sql`is_current = true`),
  ]
);

export type CertifierTupleAcceptance = typeof certifierTupleAcceptance.$inferSelect;
export type NewCertifierTupleAcceptance = typeof certifierTupleAcceptance.$inferInsert;
```

- [ ] **Step 3.2: Verify + commit**

```bash
git add backend/src/db/schema/certifier-tuple-acceptance.ts
git commit -m "feat(schema): add certifier_tuple_acceptance with SCD type 2 (C3)

Temporal dimension (valid_from, valid_to, is_current) enables replay
of past scans with the certifier acceptance that was active at scan
time. Resolves CRITICAL C3 from spec Appendix D.

Part of feat/halal-engine-v2 Phase 1."
```

---

## Task 4: Drizzle schema — Halal Evaluations (H15 status enum)

**Files:**
- Create: `backend/src/db/schema/halal-evaluations.ts`

- [ ] **Step 4.1: Create schema**

```typescript
import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { products } from "./products.js";
import { scans } from "./scans.js";
import { users } from "./users.js";

export const evaluationStatusEnum = pgEnum("evaluation_status", [
  "ok",
  "degraded",
  "failed",
]);

export const halalEvaluations = pgTable(
  "halal_evaluations",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    scanId: t.uuid("scan_id").references(() => scans.id, { onDelete: "set null" }),
    productId: t.uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    userId: t.uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    engineVersion: t.varchar("engine_version", { length: 30 }).notNull(),
    userMadhab: t.varchar("user_madhab", { length: 10 }),
    userStrictness: t.varchar("user_strictness", { length: 15 }),
    userTier: t.varchar("user_tier", { length: 10 }),
    track: t.varchar({ length: 15 }).notNull(),  // "certified" | "analyzed"
    modulesFired: t.text("modules_fired").array().default([]),
    finalScore: t.smallint("final_score"),
    finalVerdict: t.varchar("final_verdict", { length: 30 }),
    // H15: first-class status + degradation reason
    status: evaluationStatusEnum("status").default("ok").notNull(),
    degradationReason: t.varchar("degradation_reason", { length: 100 }),
    trace: t.jsonb().notNull(),
    durationMs: t.integer("duration_ms"),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    t.index("he_product_idx").on(table.productId),
    t.index("he_created_idx").on(table.createdAt),
    t.index("he_status_idx").on(table.status),
    t.index("he_user_idx").on(table.userId),
  ]
);

export type HalalEvaluation = typeof halalEvaluations.$inferSelect;
export type NewHalalEvaluation = typeof halalEvaluations.$inferInsert;
```

- [ ] **Step 4.2: Verify + commit**

```bash
git add backend/src/db/schema/halal-evaluations.ts
git commit -m "feat(schema): add halal_evaluations with status enum (H15)

Immutable audit log for every scan evaluation. Includes engine version,
track (certified/analyzed), modules_fired, trace jsonb, and first-class
status/degradation_reason per H15. Resolves HIGH H15 from Appendix D.

Part of feat/halal-engine-v2 Phase 1."
```

---

## Task 5: Drizzle schemas — Naqiy Watch (3 tables)

**Files:**
- Create: `backend/src/db/schema/certifier-reports.ts`
- Create: `backend/src/db/schema/charter-versions.ts`

- [ ] **Step 5.1: Create `charter-versions.ts`**

```typescript
import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const charterVersions = pgTable(
  "charter_versions",
  {
    id: t.varchar({ length: 30 }).primaryKey(),     // "watch_v1_2026_04"
    effectiveFrom: t.date("effective_from").notNull(),
    contentFr: t.text("content_fr").notNull(),
    contentEn: t.text("content_en").notNull(),
    contentAr: t.text("content_ar").notNull(),
    hash: t.varchar({ length: 64 }).notNull(),
    isCurrent: t.boolean("is_current").default(false).notNull(),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  }
);

export const userCharterSignatures = pgTable(
  "user_charter_signatures",
  {
    userId: t.uuid("user_id").notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    charterId: t.varchar("charter_id", { length: 30 }).notNull()
      .references(() => charterVersions.id),
    signedAt: t.timestamp("signed_at", { withTimezone: true }).defaultNow().notNull(),
    ipAddress: t.varchar("ip_address", { length: 45 }),
    userAgent: t.text("user_agent"),
  },
  (table) => [
    t.primaryKey({ columns: [table.userId, table.charterId] }),
  ]
);

export type CharterVersion = typeof charterVersions.$inferSelect;
export type UserCharterSignature = typeof userCharterSignatures.$inferSelect;
```

- [ ] **Step 5.2: Create `certifier-reports.ts`**

```typescript
import { pgTable, pgEnum } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { certifiers } from "./certifiers.js";
import { practiceTuples } from "./practice-tuples.js";
import { certifierEvents } from "./certifiers.js";

export const reportCategoryEnum = pgEnum("report_category", [
  "fraud_labeling",
  "protocol_violation",
  "hygiene_contamination",
  "slaughter_practice_abuse",
  "documentation_missing",
  "transparency_lack",
  "other",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "submitted",
  "under_review",
  "verified",
  "rejected",
  "insufficient_evidence",
  "duplicate",
]);

export const certifierReports = pgTable(
  "certifier_reports",
  {
    id: t.uuid().defaultRandom().primaryKey(),
    reporterUserId: t.uuid("reporter_user_id").notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    // C4: pseudonymization — reporter_pseudonym_id for audit trail (survives Art.17)
    reporterPseudonymId: t.varchar("reporter_pseudonym_id", { length: 64 }).notNull(),
    certifierId: t.varchar("certifier_id", { length: 100 }).notNull()
      .references(() => certifiers.id),
    practiceTupleId: t.uuid("practice_tuple_id")
      .references(() => practiceTuples.id, { onDelete: "set null" }),
    productBarcode: t.varchar("product_barcode", { length: 50 }),
    category: reportCategoryEnum("category").notNull(),
    title: t.varchar({ length: 255 }).notNull(),
    descriptionFr: t.text("description_fr").notNull(),
    evidenceUrls: t.text("evidence_urls").array().notNull(),
    evidenceTypes: t.text("evidence_types").array().notNull(),
    location: t.text(),
    dateObserved: t.date("date_observed"),
    charterVersion: t.varchar("charter_version", { length: 30 }).notNull(),
    charterSignedAt: t.timestamp("charter_signed_at", { withTimezone: true }).notNull(),
    status: reportStatusEnum("status").default("submitted").notNull(),
    priority: t.smallint().default(3).notNull(),
    assignedAdminId: t.uuid("assigned_admin_id")
      .references(() => users.id, { onDelete: "set null" }),
    reviewedAt: t.timestamp("reviewed_at", { withTimezone: true }),
    reviewNotes: t.text("review_notes"),
    decisionRationale: t.text("decision_rationale"),
    resultingEventId: t.uuid("resulting_event_id")
      .references(() => certifierEvents.id, { onDelete: "set null" }),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    t.index("cr_certifier_status_idx").on(table.certifierId, table.status),
    t.index("cr_admin_status_idx").on(table.assignedAdminId, table.status),
    t.index("cr_reporter_idx").on(table.reporterUserId),
  ]
);

export const reportCorroborations = pgTable(
  "report_corroborations",
  {
    reportId: t.uuid("report_id").notNull()
      .references(() => certifierReports.id, { onDelete: "cascade" }),
    userId: t.uuid("user_id").notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    evidenceUrls: t.text("evidence_urls").array().notNull(),
    note: t.text(),
    createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    t.primaryKey({ columns: [table.reportId, table.userId] }),
  ]
);

export type CertifierReport = typeof certifierReports.$inferSelect;
export type NewCertifierReport = typeof certifierReports.$inferInsert;
export type ReportCorroboration = typeof reportCorroborations.$inferSelect;
```

- [ ] **Step 5.3: Verify + commit**

```bash
git add backend/src/db/schema/charter-versions.ts \
        backend/src/db/schema/certifier-reports.ts
git commit -m "feat(schema): add Naqiy Watch tables (C4 GDPR pseudonymization)

charter_versions, user_charter_signatures, certifier_reports (with
reporter_pseudonym_id for GDPR Art.17 compliance per C4),
report_corroborations.

Part of feat/halal-engine-v2 Phase 1."
```

---

## Task 6: Update schema index.ts + products columns

**Files:**
- Modify: `backend/src/db/schema/index.ts`
- Modify: `backend/src/db/schema/products.ts`

- [ ] **Step 6.1: Add new exports to index.ts**

Append to `backend/src/db/schema/index.ts`:

```typescript
// ── Halal Engine V2 ──
export * from "./substances.js";
export * from "./substance-dossiers.js";
export * from "./substance-match-patterns.js";
export * from "./substance-scenarios.js";
export * from "./substance-madhab-rulings.js";
export * from "./practice-families.js";
export * from "./practices.js";
export * from "./practice-dossiers.js";
export * from "./practice-tuples.js";
export * from "./certifier-tuple-acceptance.js";
export * from "./halal-evaluations.js";
export * from "./charter-versions.js";
export * from "./certifier-reports.js";
```

- [ ] **Step 6.2: Add V2 engine columns to products.ts**

After the `dataQualityReasons` line in `products.ts`, add:

```typescript
    // ── V2: HALAL ENGINE V2 ─────────────────────────────────────
    // H10: ALL new columns are nullable for zero-downtime ADD COLUMN
    categoriesTags: t.text("categories_tags").array(),
    foodGroupsTags: t.text("food_groups_tags").array(),
    statesTags: t.text("states_tags").array(),
    packagingTags: t.text("packaging_tags").array(),
    geminiExtract: t.jsonb("gemini_extract"),
    geminiExtractHash: t.varchar("gemini_extract_hash", { length: 64 }),
    halalEngineVersion: t.varchar("halal_engine_version", { length: 30 }),
    halalTrack: t.varchar("halal_track", { length: 15 }),
```

Note: `originsTags` already exists, `dataQualityTags` is already covered by `dataQualityFlag`+`dataQualityReasons`.

- [ ] **Step 6.3: Verify + commit**

```bash
cd backend && pnpm exec tsc --noEmit 2>&1 | head -10
git add backend/src/db/schema/index.ts backend/src/db/schema/products.ts
git commit -m "feat(schema): export V2 tables + add engine columns to products (H10)

All new products columns are nullable for zero-downtime PG ADD COLUMN
per H10. Adds categoriesTags, foodGroupsTags, statesTags, packagingTags,
geminiExtract, geminiExtractHash, halalEngineVersion, halalTrack.

Part of feat/halal-engine-v2 Phase 1."
```

---

## Task 7: Dossier compiler + seeds (TDD)

**Files:**
- Create: `backend/src/db/seeds/compile-dossiers.ts`
- Create: `backend/src/__tests__/unit/compile-dossiers.test.ts`

This is the core of Phase 1 — the script that reads Phase 0 JSON dossiers from disk and seeds the V2 tables. It must be idempotent (content_hash-based upsert) and preserve N previous dossier versions (H19).

- [ ] **Step 7.1: Write failing test**

Create `backend/src/__tests__/unit/compile-dossiers.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import path from "node:path";
import {
  parseSubstanceDossier,
  extractMatchPatterns,
  extractScenarios,
  extractMadhabRulings,
  parsePracticeTuples,
  type ParsedSubstance,
} from "../../db/seeds/compile-dossiers.js";

const DOSSIERS_ROOT = path.resolve(
  __dirname, "..", "..", "..", "..",
  "docs", "naqiy", "dossiers-recherches-naqiy", "dossiers_v2",
);

describe("compile-dossiers", () => {
  describe("parseSubstanceDossier", () => {
    it("parses SHELLAC dossier into substance + dossier records", () => {
      const filePath = path.join(DOSSIERS_ROOT, "json", "naqiy_dossier_SHELLAC_v2.json");
      const result = parseSubstanceDossier(filePath);
      expect(result).not.toBeNull();
      expect(result!.substance.id).toBe("SHELLAC");
      expect(result!.substance.tier).toBeGreaterThanOrEqual(1);
      expect(result!.substance.tier).toBeLessThanOrEqual(4);
      expect(result!.dossier.contentHash).toHaveLength(64);
      expect(result!.dossier.schemaVersion).toBe("substance-dossier.v1");
    });
  });

  describe("extractMatchPatterns", () => {
    it("extracts patterns from SHELLAC match_vocabulary", () => {
      const filePath = path.join(DOSSIERS_ROOT, "json", "naqiy_dossier_SHELLAC_v2.json");
      const parsed = parseSubstanceDossier(filePath)!;
      const patterns = extractMatchPatterns(parsed);
      expect(patterns.length).toBeGreaterThan(5); // at least canonical + synonyms + e_numbers + off_tags
      expect(patterns.some(p => p.patternType === "e_number" && p.patternValue === "E904")).toBe(true);
      expect(patterns.some(p => p.patternType === "keyword_fr" && p.patternValue.includes("gomme"))).toBe(true);
      expect(patterns.some(p => p.patternType === "off_tag" && p.patternValue === "en:e904")).toBe(true);
    });
  });

  describe("extractScenarios", () => {
    it("extracts score_matrix scenarios from SHELLAC", () => {
      const filePath = path.join(DOSSIERS_ROOT, "json", "naqiy_dossier_SHELLAC_v2.json");
      const parsed = parseSubstanceDossier(filePath)!;
      const scenarios = extractScenarios(parsed);
      expect(scenarios.length).toBeGreaterThanOrEqual(1);
      for (const s of scenarios) {
        expect(s.score).toBeGreaterThanOrEqual(0);
        expect(s.score).toBeLessThanOrEqual(100);
        expect(s.substanceId).toBe("SHELLAC");
      }
    });
  });

  describe("extractMadhabRulings", () => {
    it("extracts 4 madhab rulings from SHELLAC", () => {
      const filePath = path.join(DOSSIERS_ROOT, "json", "naqiy_dossier_SHELLAC_v2.json");
      const parsed = parseSubstanceDossier(filePath)!;
      const rulings = extractMadhabRulings(parsed);
      expect(rulings).toHaveLength(4);
      expect(rulings.map(r => r.madhab).sort()).toEqual(["hanbali", "hanafi", "maliki", "shafii"]);
    });
  });

  describe("parsePracticeTuples", () => {
    it("parses 15 stunning tuples from the tuples file", () => {
      const filePath = path.join(
        DOSSIERS_ROOT, "practices", "stunning", "tuples", "tuples_stunning.json",
      );
      const tuples = parsePracticeTuples(filePath);
      expect(tuples).toHaveLength(15);
      for (const t of tuples) {
        expect(t.slug).toMatch(/^[A-Z][A-Z0-9_]+$/);
        expect(t.verdictHanafi).toBeGreaterThanOrEqual(0);
        expect(t.verdictHanafi).toBeLessThanOrEqual(100);
        expect(t.dossierSectionRef.length).toBeGreaterThan(5);
      }
    });
  });
});
```

- [ ] **Step 7.2: Run test — expect fail (module not found)**

```bash
cd backend && pnpm vitest run src/__tests__/unit/compile-dossiers.test.ts
```

Expected: FAIL.

- [ ] **Step 7.3: Write the compiler implementation**

Create `backend/src/db/seeds/compile-dossiers.ts` — this is a substantial file. The implementer subagent will write it following the test contract. Key functions:

- `parseSubstanceDossier(filePath)` — read JSON, extract substance + dossier record + content_hash
- `extractMatchPatterns(parsed)` — from `match_vocabulary`, generate flat pattern rows
- `extractScenarios(parsed)` — from `score_matrix`, generate scenario rows
- `extractMadhabRulings(parsed)` — from `madhab_positions`, generate 4 ruling rows
- `parsePracticeTuples(filePath)` — read tuples JSON, generate tuple rows with UUID slugs

Each function is a **pure function** (no DB calls). The DB write logic is in `seedAll()` which is called from `db/entrypoint.ts` at deploy.

- [ ] **Step 7.4: Run test — expect pass**

```bash
cd backend && pnpm vitest run src/__tests__/unit/compile-dossiers.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 7.5: Commit**

```bash
git add backend/src/db/seeds/compile-dossiers.ts \
        backend/src/__tests__/unit/compile-dossiers.test.ts
git commit -m "feat(seeds): add dossier compiler with TDD (H19 version preservation)

Pure functions: parseSubstanceDossier, extractMatchPatterns,
extractScenarios, extractMadhabRulings, parsePracticeTuples.
Content-hash based idempotency. Preserves previous dossier versions
via is_active toggle (H19).

5 unit tests covering all extraction functions.

Part of feat/halal-engine-v2 Phase 1."
```

---

## Task 8: Hand-written SQL migrations (6 files)

**Files:**
- Create: `backend/drizzle/0037_halal_v2_substances.sql`
- Create: `backend/drizzle/0038_halal_v2_practices.sql`
- Create: `backend/drizzle/0039_halal_v2_certifier_tuples.sql`
- Create: `backend/drizzle/0040_halal_v2_evaluations.sql`
- Create: `backend/drizzle/0041_halal_v2_naqiy_watch.sql`
- Create: `backend/drizzle/0042_products_v2_engine_cols.sql`

Each migration mirrors the Drizzle schema exactly, uses `IF NOT EXISTS` guards (project convention from existing migrations), and is designed for zero-downtime on an 817K-row products table.

The implementer subagent will write SQL that mirrors the Drizzle schemas from Tasks 1-6 exactly. This is mechanical but critical — every column name, type, and constraint must match.

- [ ] **Step 8.1-8.6: Write 6 SQL migration files**

Each file translates the corresponding Drizzle schema to raw SQL. Use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `DO $$ ... $$ ` blocks for enums.

- [ ] **Step 8.7: Verify migrations are syntactically valid**

```bash
cd backend && for f in drizzle/003[7-9]*.sql drizzle/004[0-2]*.sql; do
  echo "--- $f ---"
  head -3 "$f"
done
```

- [ ] **Step 8.8: Commit**

```bash
git add backend/drizzle/0037_halal_v2_substances.sql \
        backend/drizzle/0038_halal_v2_practices.sql \
        backend/drizzle/0039_halal_v2_certifier_tuples.sql \
        backend/drizzle/0040_halal_v2_evaluations.sql \
        backend/drizzle/0041_halal_v2_naqiy_watch.sql \
        backend/drizzle/0042_products_v2_engine_cols.sql
git commit -m "feat(db): add 6 V2 migrations (substances + practices + evaluations + watch + products)

0037: substances, substance_dossiers, substance_match_patterns,
      substance_scenarios, substance_madhab_rulings
0038: practice_families, practices, practice_dossiers, practice_tuples
0039: certifier_tuple_acceptance (C3 SCD type 2)
0040: halal_evaluations (H15 status enum)
0041: charter_versions, user_charter_signatures,
      certifier_reports (C4 GDPR), report_corroborations
0042: ALTER products ADD 8 nullable V2 columns (H10)

All use IF NOT EXISTS guards. Zero-downtime on 817K products.

Part of feat/halal-engine-v2 Phase 1."
```

---

## Task 9: Wire compiler into deploy entrypoint

**Files:**
- Modify: `backend/src/db/entrypoint.ts`
- Modify: `backend/src/db/seeds/run-all.ts`

- [ ] **Step 9.1: Add V2 dossier compilation to run-all.ts**

Read `backend/src/db/seeds/run-all.ts` to understand the existing seed pipeline. Add a new module at the end that calls the dossier compiler's `seedAll()` function. Make it conditional on an env var `HALAL_V2_SEED=true` (feature flag for safe rollout).

- [ ] **Step 9.2: Verify existing seeds still pass (no regression)**

```bash
cd backend && pnpm exec tsc --noEmit 2>&1 | head -10
```

- [ ] **Step 9.3: Commit**

```bash
git add backend/src/db/entrypoint.ts backend/src/db/seeds/run-all.ts
git commit -m "feat(seeds): wire V2 dossier compiler into deploy entrypoint

Gated behind HALAL_V2_SEED=true env var for safe rollout.
When enabled, runs after Phase 2 seed: compile-dossiers reads
the Phase 0 JSON corpus and seeds substances, patterns, scenarios,
madhab_rulings, practices, and tuples.

Part of feat/halal-engine-v2 Phase 1."
```

---

## Task 10: Phase 1 verification

- [ ] **Step 10.1: Run all unit tests**

```bash
cd backend && pnpm test:unit
```

Expected: all existing tests pass + 5 new compile-dossiers tests pass.

- [ ] **Step 10.2: Run dossier validator**

```bash
cd backend && pnpm validate:dossiers
```

Expected: 11/11 valid (Phase 0 gate preserved).

- [ ] **Step 10.3: Verify TypeScript compiles cleanly**

```bash
cd backend && pnpm exec tsc --noEmit
```

Expected: no NEW errors from V2 schema files.

- [ ] **Step 10.4: Tag phase completion**

```bash
git tag -a halal-v2-phase-1 -m "Halal Engine V2 — Phase 1 (Data Model) complete

- 13 new Drizzle schema files (substances×5, practices×4,
  certifier_tuple_acceptance, halal_evaluations, naqiy_watch×3)
- 6 hand-written SQL migrations (0037-0042)
- 8 new columns on products (nullable, zero-downtime)
- Dossier compiler with 5 unit tests (TDD)
- Deploy entrypoint integration (gated behind HALAL_V2_SEED)
- Resolves: C3, C4, H10, H11, H12, H15, H19 from Appendix D"
```

- [ ] **Step 10.5: Push**

```bash
git push origin feat/halal-engine-v2
git push origin halal-v2-phase-1
```

---

## Phase 1 Exit Criteria

1. ✅ 13 Drizzle schema files compile cleanly
2. ✅ 6 SQL migrations exist (0037-0042) with IF NOT EXISTS guards
3. ✅ products table gets 8 new nullable columns
4. ✅ Dossier compiler passes 5 unit tests
5. ✅ Deploy entrypoint wired (gated behind env var)
6. ✅ Existing tests unbroken
7. ✅ Appendix D issues C3, C4, H10, H11, H12, H15, H19 resolved
8. ✅ Tag `halal-v2-phase-1` pushed

## Next phase

Phase 2: Gemini V2 (vocabulary builder + provider + prompt V2 + shadow mode).

---

**End of Phase 1 plan.**
