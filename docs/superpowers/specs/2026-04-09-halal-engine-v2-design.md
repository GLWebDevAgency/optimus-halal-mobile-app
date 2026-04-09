# Naqiy Halal Engine V2 — Design Spec

**Status:** Draft → Approved for implementation
**Date:** 2026-04-09
**Branch:** `feat/halal-engine-v2`
**Author:** Architecture review, co-written with user
**Supersedes:** V1 `ingredient_rulings` flat-table + editorial certifier deltas

---

## 0. Mission & principes directeurs

**Mission.** Transformer un scan code-barres en un verdict halal **contextuel, scholarly-traceable, madhab-aware, audit-ready, multilingue**, livré en < 400 ms, avec une UI qui parle au grand public ET au chercheur en fiqh.

**Les 12 commandements non négociables :**

1. **Separation of concerns** — Halal ≠ Santé ≠ Personnel ≠ Boycott ≠ Alternatives. 5 engines, 1 orchestration.
2. **Two-track halal evaluation** — un produit certifié passe par `CertifierTrustEngine`, pas par l'analyse ingrédient.
3. **Scholarly traceability** — jamais un verdict sans fatwa source citable. Zéro "trust me".
4. **Declarative-first** — ajouter une substance ou une pratique = ajouter un JSON, pas du code.
5. **Spec-driven** — JSON Schemas versionnés, CI bloque si violation.
6. **Contextual scoring** — (substance × catégorie × usage × certification × madhab × strictness) → score.
7. **Single Gemini call per scan, vocabulary-aware** — extraction + classification + détection multilingue en 1 passage.
8. **DB-first resolution** — 99 % des scans ne touchent jamais OFF.
9. **Freemium fair** — le moteur est identique pour tous ; seuls le contexte personnel et le drill-down scholarly sont gated.
10. **Audit immutable** — chaque scan = ligne `halal_evaluations` rejouable.
11. **i18n natif** — FR / EN / AR dans les dossiers, zéro traduction runtime.
12. **Dossier-anchored scoring** — aucun score éditorial arbitraire. Chaque score provient d'une ligne de dossier traçable.

---

## 1. Architecture — vue 4 couches

```
┌────────────────────────────────────────────────────────────────┐
│ UI LAYER (React Native — Expo Router)                          │
│ ScanResultScreen                                               │
│  ├─ HalalCard       variant ∈ {certified, analyzed}            │
│  ├─ CertifierCard   (si certified)                             │
│  ├─ BoycottCard     (conditional)                              │
│  ├─ HealthCard                                                 │
│  ├─ PersonalAlerts  (gated)                                    │
│  └─ AlternativesRail                                           │
└────────────────────────────────────────────────────────────────┘
                              ▲  ScanResultDTO (tRPC)
┌────────────────────────────────────────────────────────────────┐
│ ORCHESTRATION LAYER — ScanOrchestratorV2                       │
│  Stage 0  ContextBuilder                                       │
│  Stage 1  ProductResolver (DB → OFF)                           │
│  Stage 2  GeminiSemanticExtractor V2                           │
│  Stage 3  ProductContextAssembler                              │
│  Stage 4  ROUTING (certified? → CertifiedTrack else Analyzed)  │
│  Stage 5  Parallel secondary engines                           │
│  Stage 6  AlternativesEngine (non-blocking)                    │
│  Stage 7  Persist + telemetry                                  │
│  Stage 8  ResponseAssembler                                    │
└────────────────────────────────────────────────────────────────┘
                              ▲
┌────────────────────────────────────────────────────────────────┐
│ DOMAIN ENGINE LAYER                                            │
│  CertifierTrustEngine │ HalalEngineV2 (substances)             │
│  HealthEngineV2 │ PersonalEngine │ BoycottEngine │ AltEngine   │
│  ─────────────────────────────────────────────────────────     │
│  DossiersBridge (unique source scholarly, serves both tracks)  │
│   ├─ substance_dossiers (shellac, carmine, e471…)              │
│   └─ practice_dossiers (stunning, mechanical, ahl kitab…)      │
└────────────────────────────────────────────────────────────────┘
                              ▲
┌────────────────────────────────────────────────────────────────┐
│ DATA LAYER (Postgres)                                          │
│  products │ substances │ substance_dossiers │ match_patterns   │
│  substance_scenarios │ substance_madhab_rulings                │
│  practices │ practice_dossiers │ practice_tuples               │
│  certifier_tuple_acceptance                                    │
│  certifiers │ certifier_events │ brand_certifiers              │
│  certifier_reports │ charter_versions │ user_charter_signatures│
│  halal_evaluations │ boycott_targets                           │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Two-Track Evaluation — le cœur du design

| Track | Déclencheur | Moteur primaire | Source de confiance | UI |
|---|---|---|---|---|
| **Certified Track** | `labels_tags` ou brand match un certifieur connu | `CertifierTrustEngine` | Practice tuples dossier-anchored | `HalalCard variant="certified"` |
| **Analyzed Track** | Pas de certification | `HalalEngineV2` (substance modules) | Dossiers substance + score_matrix contextuelle | `HalalCard variant="analyzed"` |

**Règle d'or :** un produit certifié par un organisme grade ≥ N٢ n'a pas à subir l'analyse d'ingrédients pour son verdict primaire. La certification est le verdict. On affiche **pourquoi** on fait confiance au certifieur, ancré sur ses pratiques documentées et les dossiers fiqh correspondants. Une analyse ingrédient **défensive** tourne en arrière-plan pour détecter un contredit manifeste (ex. porc explicite sur produit certifié → downgrade immédiat).

---

## 3. Practice Tuple Framework (PTF) — généralisation extensible

### 3.1 Principe

Aucune pratique d'abattage / transformation réglementée ne se code comme un booléen. Elle se décompose en **tuple multi-dimensionnel** dont **chaque combinaison a un verdict scholarly ancré dans un dossier**. Le PTF est le pattern unique pour TOUTES les familles de pratiques, présentes et futures.

### 3.2 Schéma

```sql
CREATE TABLE practice_tuples (
  id                    text PRIMARY KEY,
  practice_family       text NOT NULL,      -- "stunning"|"mechanical_slaughter"|"ahl_kitab"|…
  dimensions            jsonb NOT NULL,     -- décomposition custom par famille
  verdict_hanafi        smallint NOT NULL,  -- 0..100 literal from dossier
  verdict_maliki        smallint NOT NULL,
  verdict_shafii        smallint NOT NULL,
  verdict_hanbali       smallint NOT NULL,
  required_evidence     text[] NOT NULL DEFAULT '{}',
  dossier_id            uuid NOT NULL REFERENCES practice_dossiers(id),
  dossier_section_ref   text NOT NULL,      -- "STUNNED_MEAT_V1 §6 row 9"
  fatwa_refs            text[] NOT NULL,
  notes_fr              text,
  notes_ar              text,
  is_active             boolean DEFAULT true,
  created_at            timestamptz DEFAULT now()
);
CREATE INDEX idx_practice_tuples_family ON practice_tuples(practice_family);
CREATE INDEX idx_practice_tuples_dims   ON practice_tuples USING GIN (dimensions jsonb_path_ops);

CREATE TABLE certifier_tuple_acceptance (
  certifier_id          text NOT NULL REFERENCES certifiers(id),
  practice_tuple_id     text NOT NULL REFERENCES practice_tuples(id),
  stance                text NOT NULL CHECK (stance IN ('accepts','rejects','unknown','conditional')),
  evidence_level        text NOT NULL CHECK (evidence_level IN
                        ('third_party_audit','fulltime_muslim_inspector',
                         'audit_report_self','protocol_published','declaration','none')),
  evidence_details      jsonb,            -- champs custom par famille
  since                 date,
  last_verified_at      timestamptz,
  verified_by_user_id   uuid REFERENCES users(id),
  PRIMARY KEY (certifier_id, practice_tuple_id)
);
```

### 3.3 Matrice stunning — extraction littérale du dossier STUNNED_MEAT (pilote)

| Tuple id | Dimensions | Hanafi | Maliki | Shafi'i | Hanbali | Dossier ref |
|---|---|---|---|---|---|---|
| `CATTLE_NOSTUN_MANUAL` | cattle, no_stun, muslim, per_animal | 98 | 98 | 98 | 98 | STUNNED_V1§6 r1 |
| `CATTLE_ESTUN_HEAD_ONLY_REV` | cattle, electric_head_only, reversible, IIFA params | 72 | 75 | 78 | 70 | STUNNED_V1§6 r2 |
| `CATTLE_CAPTIVE_BOLT_PENETRATING` | cattle, captive_bolt_penetrating | 0 | 0 | 0 | 0 | STUNNED_V1§6 r9 |
| `CATTLE_CAPTIVE_BOLT_NONPEN` | cattle, captive_bolt_nonpenetrating | 62 | 65 | 68 | 60 | STUNNED_V1§6 r11 |
| `SHEEP_NOSTUN_MANUAL` | sheep, no_stun, muslim | 98 | 98 | 98 | 98 | STUNNED_V1§6 r1 |
| `SHEEP_ESTUN_HEAD_ONLY_REV` | sheep, electric_head_only, reversible, IIFA params | 72 | 75 | 78 | 70 | STUNNED_V1§6 r2 |
| `SHEEP_ESTUN_HEAD_TO_BODY` | sheep, electric_head_to_body (EU std, arrêt cardiaque) | 2 | 2 | 2 | 2 | STUNNED_V1§6 r6 |
| `POULTRY_NOSTUN_MANUAL` | poultry, no_stun, muslim, per_animal | 98 | 98 | 98 | 98 | STUNNED_V1§6 r1 |
| `POULTRY_SEMIAUTO_MUSLIM_CUTTERS` | poultry, semi_auto_muslim_cutters | 90 | 92 | 95 | 92 | MECH_SLAUGHTER_V2§7 |
| `POULTRY_WATERBATH_STANDARD` | poultry, electric_waterbath, mortality 10-30% | 5 | 5 | 15 | 3 | STUNNED_V1§6 r9 |
| `POULTRY_WATERBATH_REDUCED_VERIFIED` | poultry, electric_waterbath, reduced params, wake tests, backup cutters | 30 | 40 | 45 | 30 | STUNNED_V1§7 (ARGML note) |
| `POULTRY_CO2_HIGH` | poultry, co2_high (>70%) | 2 | 2 | 5 | 2 | STUNNED_V1§6 r11 |
| `POULTRY_CO2_LOW` | poultry, co2_low (<55%) | 35 | 40 | 45 | 30 | STUNNED_V1§6 r10 |
| `MECH_SLAUGHTER_FULL_CERTIFIED_MUSLIM_OPERATOR` | poultry, mech_full, tasmiya_at_startup, certified | 45 | 65 | 78 | 60 | MECH_SLAUGHTER_V2§7 |
| `MECH_SLAUGHTER_RECORDED_BISMILLAH` | poultry, mech_full, recorded_bismillah | 5 | 5 | 15 | 3 | MECH_SLAUGHTER_V2§7 |

**Chaque ligne est littéralement extraite d'une matrice NaqiyScore de dossier.** Zéro éditorial. La CI rejette tout tuple sans `dossier_section_ref` valide.

### 3.4 Roadmap des 12 familles de pratiques

Chaque famille suit **le même pattern** — dossier → tuples → seed → engine (sans changement).

1. `stunning` — 15 tuples pilotes (§3.3)
2. `mechanical_slaughter` — à extraire du dossier MECHANICAL_SLAUGHTER_POULTRY
3. `ahl_kitab` — dimensions : operator_religion, country, tasmiya_stance, blessing
4. `tasmiya_protocol` — per_animal / at_startup / recorded / written / absent
5. `cross_contamination_pork` — shared_line, cleaning_protocol, segregation_hours
6. `traceability` — lot_to_animal, anonymous, unclear_origin
7. `transport_prestun` — long_distance, stress, fasting
8. `supervision_model` — fulltime_muslim / audit / declaration
9. `meat_origin_country` — eu_exempt / eu_nonexempt / third_country
10. `blessing_invocation` — valid / recorded / written / chanted
11. `slaughterer_qualification` — trained_certified / self_declared
12. `post_slaughter_treatment` — post_elec / hot_bath / plucking

### 3.5 Extensibility guarantee

**Ajouter une famille n'altère aucun code engine.** Procédure :

1. Créer `docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/practices/FAMILY_X.md` + `.json`
2. Passer la validation JSON Schema (CI)
3. Seed `practice_tuples` rows avec `dimensions jsonb` custom
4. Audit `certifier_tuple_acceptance` pour les certifieurs concernés
5. L'UI drill-down rend automatiquement le dossier (trilingue)

---

## 4. Data Model V2 — consolidé

### 4.1 Tables nouvelles

```sql
-- Substances (AnalyzedTrack)
substances                     (id, slug, names_fr/en/ar, e_numbers[], tier,
                                priority_score, fiqh_issues[], issue_type,
                                active_dossier_id, is_active)
substance_dossiers             (id, substance_id, version, schema_version,
                                dossier_json, content_hash, verified_at,
                                verification_passes, fatwas_count, is_active)
substance_match_patterns       (substance_id, pattern_type, pattern_value,
                                lang, priority, confidence, source)
substance_scenarios            (substance_id, scenario_key, match_conditions jsonb,
                                specificity, score, verdict, rationale_fr/en/ar)
substance_madhab_rulings       (substance_id, madhab, ruling, contemporary_split,
                                classical_sources[], contemporary_sources[])

-- Practices (CertifiedTrack) — cf §3
practices                      (id, slug, names, severity_tier, active_dossier_id)
practice_dossiers              (id, practice_id, version, schema_version,
                                dossier_json, content_hash, verified_at, is_active)
practice_tuples                (id, practice_family, dimensions jsonb, verdict_*,
                                required_evidence[], dossier_id, dossier_section_ref,
                                fatwa_refs[], notes_fr, notes_ar, is_active)
certifier_tuple_acceptance     (certifier_id, practice_tuple_id, stance,
                                evidence_level, evidence_details jsonb,
                                since, last_verified_at, verified_by_user_id)

-- Naqiy Watch — cf §13
certifier_reports              (id, reporter_user_id, certifier_id, practice_tuple_id,
                                product_barcode, category, title, description_fr,
                                evidence_urls[], evidence_types[], location,
                                date_observed, charter_version, charter_signed_at,
                                status, priority, assigned_admin_id, reviewed_at,
                                review_notes, decision_rationale, resulting_event_id,
                                created_at, updated_at)
charter_versions               (id, effective_from, content_fr/en/ar, hash, is_current)
user_charter_signatures        (user_id, charter_id, signed_at, ip_address, user_agent)
report_corroborations          (report_id, user_id, evidence_urls[], note, created_at)

-- Audit
halal_evaluations              (id, scan_id, product_id, user_id, engine_version,
                                user_madhab, user_strictness, user_tier,
                                track (certified|analyzed), modules_fired[],
                                final_score, final_verdict, trace jsonb,
                                duration_ms, created_at)
```

### 4.2 Colonnes ajoutées à `products`

```sql
ALTER TABLE products
  ADD COLUMN categories_tags     text[],
  ADD COLUMN food_groups_tags    text[],
  ADD COLUMN states_tags         text[],
  ADD COLUMN data_quality_tags   text[],
  ADD COLUMN packaging_tags      text[],
  ADD COLUMN origins_tags        text[],
  ADD COLUMN gemini_extract      jsonb,
  ADD COLUMN gemini_extract_hash text,
  ADD COLUMN halal_engine_version text,
  ADD COLUMN halal_track         text;  -- "certified" | "analyzed"
```

### 4.3 Legacy gated

- `ingredient_rulings` → feature flag `use_legacy_ingredient_rulings`, retrait Phase 9
- `additives` table → conservée, utilisée par HealthEngine (toxicology)
- `certifiers`, `certifier_events`, `additive_madhab_rulings` → conservés, **étendus** via jointures
- `brand_certifiers`, `boycott_targets`, `recommendation.service` → conservés

---

## 5. Gemini V2 — Extraction sémantique vocabulary-aware

### 5.1 Nouveau champ obligatoire dans chaque dossier substance

```json
{
  "substance": {
    "id": "SHELLAC",
    "match_vocabulary": {
      "canonical_fr": "gomme-laque",
      "canonical_en": "shellac",
      "canonical_ar": "صمغ اللك",
      "synonyms_fr": ["gomme laque", "gommelaque", "laque de confiseur", "résine de laque"],
      "synonyms_en": ["lac resin", "confectioner's glaze", "pharmaceutical glaze"],
      "synonyms_ar": ["الشيلاك", "إفرازات حشرة اللك", "راتنج اللك"],
      "synonyms_other": {
        "de": ["schellack"], "es": ["goma laca"], "it": ["gommalacca"],
        "tr": ["gomalak"], "ur": ["شیلاک"]
      },
      "e_numbers": ["E904"],
      "off_tags": ["en:e904", "en:shellac"],
      "semantic_descriptors": [
        "natural coating from insect secretion",
        "enrobage brillant d'origine animale"
      ],
      "disambiguation_hints": {
        "not_to_confuse_with": ["beeswax", "carnauba"],
        "context_clues": ["candy", "apple", "tablet", "fruit"]
      }
    }
  }
}
```

### 5.2 Vocabulary builder — runtime

`backend/src/services/ai-extract/vocabulary.ts` charge les `match_vocabulary` depuis tous les dossiers actifs au boot, fusionne, cache en mémoire avec signature `sha256(all_content_hashes)`. Hot-reload via endpoint admin quand un dossier est mis à jour.

### 5.3 Prompt Gemini V2 — structure

```
You are the Naqiy halal semantic extractor. In a SINGLE pass you do:

JOB 1 — Normalize ingredient list (flat, deduplicated, qualifiers preserved).
JOB 2 — Classify product: product_category from closed enum, product_usage,
         meat_classification if applicable (species detection).
JOB 3 — Semantically match the text against the CLOSED SUBSTANCE VOCABULARY below.
         Consider: exact match, aliases (all languages), OCR typos, transliteration,
         contextual descriptors, OFF taxonomy tags. Respect disambiguation hints.
         Only emit substance_id when confidence ≥ 0.6.

OUTPUT single JSON matching the provided schema.

[SUBSTANCE VOCABULARY — injected from active dossiers]
SHELLAC:
  canonical: gomme-laque | shellac | صمغ اللك
  aliases: gomme laque, lac resin, confectioner's glaze, schellack, gomalak, …
  e_numbers: E904  |  off_tags: en:e904, en:shellac
  descriptors: enrobage brillant insecte, natural coating from insect secretion
  not_confuse_with: beeswax, carnauba
─────
CARMINE: …
```

### 5.4 Contract `GeminiSemanticResult`

```ts
interface GeminiSemanticResult {
  // Layer 1 — Normalization (legacy preserved)
  ingredients: string[];
  additives: string[];
  lang: string;

  // Layer 2 — Classification
  product_category:
    | "candy" | "chocolate" | "biscuit" | "bread" | "cheese" | "yogurt"
    | "milk_beverage" | "meat" | "poultry" | "fish" | "spread" | "snack"
    | "beverage_soft" | "beverage_energy" | "tablet_pharma" | "supplement"
    | "cosmetic_topical" | "fresh_fruit" | "prepared_meal" | "sauce" | "other";
  product_usage: "ingestion" | "topical" | "medicinal";
  meat_classification: {
    is_meat: boolean;
    species: "cattle"|"sheep"|"goat"|"poultry"|"rabbit"|"mixed"|"unknown";
    product_type: "whole_muscle"|"ground"|"processed"|"charcuterie";
    confidence: number;
  } | null;

  // Layer 3 — Halal semantic matching
  detected_substances: Array<{
    substance_id: string;                    // from closed vocabulary
    matched_term: string;                    // exact phrase from source text
    match_source: "canonical_fr"|"canonical_en"|"canonical_ar"
                  |"alias"|"descriptor"|"off_tag"|"e_number"|"semantic";
    confidence: number;                      // 0..1
    context_note?: string;
  }>;
  animal_source_hints: Array<{ term: string; certainty: "explicit"|"ambiguous"|"likely" }>;
  alcohol_context: {
    present: boolean;
    role: "none"|"ingredient"|"solvent_flavor"|"trace"|"vinegar_takhallul";
    substrate?: string;
  };

  // Layer 4 — Health (conservé)
  novaEstimate: 1|2|3|4;
  allergenHints: string[];
  containsAlcohol: boolean;
  isOrganic: boolean;
}
```

### 5.5 Skip conditions & fallback

- **Cache hit** : `products.gemini_extract_hash === sha256(text)` → reuse.
- **Fast-path OFF trustworthy** : `completeness ≥ 0.9 ∧ structured ingredients ∧ no "ingredients-to-be-completed"` → OFF structured + pg_trgm fuzzy match on `substance_match_patterns`. Pas de Gemini appelé. Confidence -15 %.
- **Gemini down** (circuit open) : fallback dégradé identique, `extraction_source: "vocabulary_fuzzy"`.

### 5.6 Config technique

- Modèle : `gemini-2.5-flash`
- `temperature: 0`, `thinkingBudget: 0`, `maxOutputTokens: 8192`
- `responseMimeType: "application/json"`, `responseSchema` strict
- Redis L2 cache SHA256(text) TTL 7j + jitter
- Circuit breaker 3 fails / 5 min → 10 min cooldown

---

## 6. Pipeline V2 — 9 stages

```
╔════════════════════════════════════════════════════════════════╗
║ STAGE 0 — CONTEXT BUILDER                                      ║
║   user = loadUser() | ANONYMOUS                                ║
║   entitlements = resolveEntitlements(user)                     ║
║                                                                ║
║   Two contexts are built and separated at the type level:     ║
║                                                                ║
║   HalalEvaluationContext (PURE — passed to Halal engines):    ║
║     { madhab, strictness, species?, lang }                     ║
║     ZERO tier/entitlement/user fields. This is a type-level   ║
║     invariant: HalalEngineV2 and CertifierTrustEngine imports │
║     ONLY accept this shape. It is impossible to branch engine │
║     logic on user tier. Enforces ethical parity (§18.4).      │
║                                                                ║
║   RequestContext (passed to ResponseAssembler / gating):      ║
║     { userId, tier, entitlements, allergens[], isPregnant,    ║
║       hasChildren, boycottOptIn, lang, scanRequestId }        ║
║     Gating + personalization happen ONLY in Stage 8.          ║
╠════════════════════════════════════════════════════════════════╣
║ STAGE 1 — PRODUCT RESOLUTION                                   ║
║   resolveProduct(db, barcode) → {product, offData, source}     ║
║   Sources: db_fresh | db_stale (bg refresh) | miss (OFF)       ║
║   Ingest V2 fields: categories_tags, food_groups_tags,         ║
║     states_tags, data_quality_tags, packaging_tags, origins    ║
╠════════════════════════════════════════════════════════════════╣
║ STAGE 2 — GEMINI SEMANTIC EXTRACTION V2                        ║
║   Skip if cache hit or fast-path conditions met                ║
║   Else call Gemini with injected SUBSTANCE_VOCABULARY          ║
║   → GeminiSemanticResult                                       ║
╠════════════════════════════════════════════════════════════════╣
║ STAGE 3 — PRODUCT CONTEXT ASSEMBLY                             ║
║   productContext = merge(offData, gemini, scanContext.lang)    ║
╠════════════════════════════════════════════════════════════════╣
║ STAGE 4 — HALAL TRACK ROUTING                                  ║
║   CertificationResolver :                                      ║
║     1. labels_tags → certifier_id (DB map)                     ║
║     2. fallback: brand_certifiers lookup via brand             ║
║     3. certifier.grade < N٥ → isCertified=true                 ║
║   ├─ isCertified → CertifierTrustEngine.evaluate()             ║
║   └─ else        → HalalEngineV2.evaluate()                    ║
║   Both produce HalalReport (same DTO, different shape)         ║
╠════════════════════════════════════════════════════════════════╣
║ STAGE 5 — PARALLEL SECONDARY ENGINES                           ║
║   Promise.all([HealthEngine, PersonalEngine, BoycottEngine])   ║
╠════════════════════════════════════════════════════════════════╣
║ STAGE 6 — ALTERNATIVES (async, non-blocking)                   ║
║   If verdict mashbooh|avoid|haram OR tier ∈ {trial,premium}    ║
║   → AlternativesEngine.find()                                  ║
╠════════════════════════════════════════════════════════════════╣
║ STAGE 7 — PERSIST + TELEMETRY                                  ║
║   INSERT halal_evaluations (trace immuable)                    ║
║   INSERT scans + UPDATE users (gamification)                   ║
║   Emit telemetry {track, engine_version, duration, modules}    ║
╠════════════════════════════════════════════════════════════════╣
║ STAGE 8 — RESPONSE ASSEMBLY                                    ║
║   ScanResultDTO = { product, halal, certifier?, boycott?,      ║
║                     health, personal, alternatives?, context,  ║
║                     gamification }                             ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 7. CertifiedTrack — CertifierTrustEngine (dossier-anchored)

### 7.1 Formule canonique

```
For certifier C, madhab M, optional species S:

  1. RESOLVE ACCEPTED TUPLES
     acceptedTuples(C, S?) = { t : acceptance(C,t).stance ∈ {accepts,conditional}
                                   ∧ (S is null OR t.dimensions.species == S) }

  2. ADJUST SCORE PER TUPLE (evidence modifier)
     For each t in acceptedTuples :
       base = practice_tuples[t].verdict[M]
       adjusted = applyEvidenceModifier(base, acceptance(C,t).evidence_level,
                                        requires_mortality_publication,
                                        mortality_verified,
                                        requires_wake_tests, wake_tests_performed)

     applyEvidenceModifier :
       third_party_audit            → +0
       fulltime_muslim_inspector    → -2
       audit_report_self            → -5
       protocol_published only      → -8
       declaration                  → -12
       none                         → floor to 10
       [+ cumulative required_evidence penalties: -10 missing mortality data,
        -8 missing wake tests]

  3. BASELINE = min(adjusted[t] for t in acceptedTuples)

  4. LIVE EVENTS DECAY PENALTY
     eventsPenalty = Σ |event.scoreImpact| × exp(-ln(2) × months_since / 12)

  5. STRICTNESS OVERLAY (delta ∈ [-∞, 0], never positive)
     relaxed    : 0
     moderate   : 0
     strict     : -5
     very_strict: -10, downgrade 1 grade if any accepted tuple ≤ 50
     NOTE: strictness never INCREASES a score above the scholarly baseline.
     A "relaxed" user still cannot receive a score better than the worst
     tuple they accept — relaxed only means strictness doesn't penalize.

  6. FINAL
     trustScore[C, M, S?] = clip(baseline - eventsPenalty + strictnessDelta, 0, 100)

  7. HARD INVARIANT (anti-drift)
     trustScore[C, M, S?] ≤ baseline[C, M, S?]
     No modifier ever exceeds worst accepted practice for this madhab.
     This is a property-based test gate in CI — any violation fails the build.
```

**Invariant correction note (review 2026-04-09):** the previous draft had `relaxed: +3` which mathematically contradicted the anti-drift invariant. The strictness overlay is now monotonically non-positive. See Appendix C for the full review log.

### 7.2 Seuils de grade

| Grade | Libellé | Plage | Verdict projeté |
|---|---|---|---|
| **N١** | Excellence | ≥ 85 | HALAL |
| **N٢** | Confiance | 70-84 | HALAL |
| **N٣** | Acceptable | 55-69 | HALAL_WITH_CAUTION |
| **N٤** | Questionable | 35-54 | MASHBOOH |
| **N٥** | Non recommandé | < 35 | AVOID |

### 7.3 Species-weighted evaluation (activée par défaut)

Quand `productContext.meat_classification.species ≠ unknown`, le baseline est recalculé **uniquement sur les tuples de cette espèce**. Résultat : un certifieur peut être N١ sur bœuf et N٥ sur poulet pour le même utilisateur.

### 7.4 Exemple ARGML — 4 scans, 4 vérités

**Scan 1 — Steak bœuf, Hanafi, moderate**
```
acceptedTuples = { CATTLE_NOSTUN_MANUAL(98) }
evidence: fulltime_muslim → 96
baseline = 96 → Trust 96 → N١ (Excellence) → HALAL
```

**Scan 2 — Escalope poulet, Hanafi, moderate**
```
acceptedTuples = {
  POULTRY_WATERBATH_REDUCED_VERIFIED(30)
    evidence: fulltime_muslim (-2), mortality_unpublished (-10), wake_tests_ok (-0)
    adjusted = 18
  POULTRY_SEMIAUTO_MUSLIM_CUTTERS_BACKUP(90)
    adjusted = 88
}
baseline = min(18, 88) = 18 → Trust 18 → N٥ (Non recommandé) → AVOID
```

**Scan 3 — Escalope poulet, Shafi'i, relaxed**
```
POULTRY_WATERBATH_REDUCED_VERIFIED(45) → adjusted 33
POULTRY_SEMIAUTO(95) → adjusted 93
baseline = 33, strictness relaxed 0 = 33 → N٥ → AVOID
```

**Scan 4 — Même poulet, Shafi'i, mortalité maintenant publiée et vérifiée**
```
POULTRY_WATERBATH_REDUCED_VERIFIED(45) → adjusted 43 (penalty levée)
baseline = 43, relaxed 0 = 43 → N٤ → MASHBOOH
```

### 7.5 Defensive ingredient cross-check

Même sur produit certifié, `HalalEngineV2.matchModules()` tourne en mode silencieux sur `productContext`. Si une substance HARAM explicite est détectée (ex. "porc" explicite, alcool >0.5 %), le verdict est **rétrogradé** avec un flag `certification_contradicted`. C'est la protection contre erreurs d'étiquetage ou faux certificats.

### 7.6 Report builder — variant="certified"

```ts
HalalReport (certified variant) = {
  verdict, score, confidence, tier: "certified",
  headline_fr/en/ar,
  certifier: { id, name, logo_url, grade, trustScore, country },
  practice_signals: PracticeSignal[],  // ordonné par baseline ascendant (maillon faible premier)
  defensive_warnings: [],               // rare
  madhab_applied, species_evaluated,
  strictness_applied,
  engine_version,
  dossier_deep_links: [practice_tuple_id...]
}

PracticeSignal = {
  practice_tuple_id,
  family,                  // "stunning"|…
  display_name_fr/ar,
  stance: "accepts"|"rejects"|"conditional",
  dimensions_summary_fr,   // "Électronarcose bain d'eau volaille (paramètres réduits)"
  madhab_verdict_score,
  evidence_level,
  is_blocking: boolean,    // true si tuple = min(baseline)
  dossier_section_ref,
  fatwa_count,
  summary_fr: string,      // 1-2 lignes
  alternative_for_species?: string  // "équivalent bœuf serait Trust 96"
}
```

---

## 8. AnalyzedTrack — HalalEngineV2 (substance modules)

### 8.1 Algorithme

```ts
class HalalEngineV2 {
  async evaluate(product, scan): Promise<HalalReport> {
    // STEP 1 — Module matching (multi-source)
    const matches = await this.matchModules(product);
    //   Sources et priorités :
    //     100 gemini.detected_substances
    //     80  additives_tags → e_number patterns
    //     70  ingredients[] OFF id (en:whey-powder)
    //     50  keyword on normalized text
    //     30  pg_trgm fuzzy fallback
    //   Dedup: one substance_id fires once, highest-priority source wins.

    if (matches.length === 0) return this.buildAnalyzedCleanReport();

    // STEP 2 — Evaluate each module
    const verdicts: ModuleVerdict[] = [];
    for (const match of matches) {
      const dossier = await this.dossiers.getActive(match.substance_id);
      const scenarios = await this.scenarios.forSubstance(match.substance_id);
      const selected = selectMostSpecific(scenarios, {
        category: product.category,
        usage: product.usage,
        certified_halal: false,
        madhab: scan.madhab,
        strictness: scan.strictness,
      });
      // Fallback: dossier.naqiy_position global
      const madhabRuling = await this.madhabRulings.get(match.substance_id, scan.madhab);
      const adjustedScore = applyMadhabDelta(selected.score, madhabRuling);
      verdicts.push({
        substance_id: match.substance_id,
        score: adjustedScore,
        verdict: selected.verdict,
        scenario_key: selected.scenario_key,
        rationale: selected.rationale_fr,
        madhab_note: madhabRuling?.contemporary_split ? "..." : null,
        fatwa_refs: dossier.fatwa_sources,
        dossier_id: dossier.id,
      });
    }

    // STEP 3 — Aggregation
    const final = aggregate(verdicts, scan.strictness);
    //   - Any HARAM → final HARAM
    //   - Else weighted min by (substance.tier × verdict_gravity)
    //   - Score→verdict matrix:
    //       ≥90 HALAL / 70-89 HALAL_WITH_CAUTION /
    //       40-69 MASHBOOH / 20-39 AVOID / <20 HARAM
    //   - Apply strictness overlay

    // STEP 4 — Report builder (variant="analyzed")
    return this.buildReport(final, verdicts, product, scan);
  }
}
```

### 8.2 ModuleRegistry — hybride déclaratif + TS hooks

Modules par défaut **auto-générés** depuis `substance_dossiers + scenarios + madhab_rulings`. ~95 % des substances restent pur JSON. ~5 % ont un hook TS (`VINEGAR` istihalah conditional, `VANILLA_EXTRACT` cuisson-aware, `ALCOHOL_FLAVORINGS` trace threshold).

---

## 9. HealthEngineV2

Conservé dans l'esprit (existe déjà), **nettoyé de toute logique halal**. Calcule :
- Nutri-Score (grade A-E)
- NOVA (1-4)
- Additifs toxicology (via `additives` table)
- Profile risk (pregnancy/children from `riskPregnant`/`riskChildren` flags)
- Allergens (via `allergens_tags`)

Consomme `productContext.substances_detected` uniquement pour l'axe "additifs préoccupants". Retourne `HealthReport { grade, score, axes[], warnings[], cross_ref_halal[] }` avec chips pointant vers HalalCard.

---

## 10. PersonalEngine

Extrait du scan router actuel, devient service dédié.
- Input : `productContext + scanContext.{allergens, isPregnant, hasChildren}`
- Output : `PersonalReport { alerts: [{type, severity, title, description, icon}], upsell_hint? }`
- Gating : si `entitlements.canAllergenProfile = false` → `alerts:[], upsell_hint:"allergens_profile"`

---

## 11. BoycottEngine + AlternativesEngine

### 11.1 BoycottEngine

- Toujours exécuté si `scanContext.boycottOptIn === true`
- Output : `BoycottReport { matched, level, brand, target_name, reasons_summary_fr/ar, sources[], alternatives_available, dossier_id }`
- **Jamais gated par tier** — signal éthique universel
- UI : card rouge discrète entre HalalCard et HealthCard

### 11.2 AlternativesEngine

- Stage 6 non-blocking (second round-trip possible)
- Query `products` : same category, halal certified, respect boycott, respect allergens
- Ranking : (certified first) > (certifier trust N١>N٢>…) > (popularity)
- Output : `AlternativesReport { items: AlternativeProduct[≤5], strategy }`

---

## 12. Freemium entitlements

```ts
type Tier = "free" | "trial" | "premium";

interface Entitlements {
  tier: Tier;
  trial_days_remaining: number;
  scans_per_day_limit: number | null;

  // Baseline (ALL)
  canSelectMadhab: boolean;          // true
  canSeeBoycott: boolean;            // true
  canSeeBoycottReasons: boolean;     // true
  canSeeBasicHalalVerdict: boolean;  // true
  canSeeCertifierGrade: boolean;     // true (critical)
  canSeeSignalsCount: boolean;       // true
  canReportCertifier: boolean;       // true (Naqiy Watch)

  // Premium / trial only
  canSetStrictness: boolean;
  canHealthProfile: boolean;
  canAllergenProfile: boolean;
  canSeeFullDossier: boolean;
  canSeeScholarlySources: boolean;
  canSeePracticeDossiers: boolean;
  canSeeAlternatives: boolean;
  canSeePersonalAlerts: boolean;
  canExportAudit: boolean;
}
```

**Principe éthique :** le moteur et le verdict sont identiques pour tous. Gated uniquement : profondeur scholarly + contexte personnel. Madhab reste gratuit (préférence religieuse). Boycott jamais gated. Signalement Naqiy Watch jamais gated (après signature charte).

---

## 13. Naqiy Watch — Signalement communautaire

### 13.1 Principes

- Jamais anonyme côté admin.
- Charte signée obligatoire à la 1ère utilisation (versionnée).
- Preuves requises (≥ 1 URL photo/vidéo/doc).
- Workflow : `submitted → under_review → verified|rejected|insufficient_evidence`.
- Impact sur TrustScore **uniquement après** validation admin via `certifier_events`.
- Transparence : rapport public anonymisé sur fiche certifieur.

### 13.2 Workflow

```
USER submits report (charter signed, ≥1 evidence, description ≥100 chars)
  │ rate limit: 3/user/7j ; auto-dedup same certifier+practice+user <30j
  ▼
status = submitted → notify naqiy-admins role
  ├─ manifestly bad → status=rejected
  ├─ needs info    → status=insufficient_evidence
  └─ serious       → status=under_review, assigned_admin_id set
       ▼
Admin investigation (contact certifier, additional evidence, dossier context)
  ├─ UNVERIFIED → status=rejected
  └─ VERIFIED   → status=verified
                  → INSERT certifier_events (
                      event_type = "community_report_verified",
                      score_impact = f(severity, category),
                      sources = evidence_urls,
                      linked_report_id = report.id
                    )
                  → TrustScore recalculates automatically
                  → reporter gains XP + rep badge
                  → public certifier page shows anonymized summary
```

### 13.3 Score impact par catégorie

| Catégorie | Min | Max |
|---|---|---|
| `fraud_labeling` | −25 | −40 |
| `protocol_violation` | −15 | −30 |
| `hygiene_contamination` | −20 | −35 |
| `slaughter_practice_abuse` | −15 | −30 |
| `documentation_missing` | −5 | −15 |
| `transparency_lack` | −3 | −10 |

Amplitude exacte décidée par admin à validation, traçable dans `review_notes`. Décroissance exponentielle standard (half-life 12 mois).

### 13.4 UI — 3 surfaces

1. **User** : bouton `[ Signaler un manquement › ]` sur fiche certifieur / post-scan. Formulaire : catégorie, description, upload, date, lieu, checkbox charte.
2. **Admin** : dashboard `Naqiy Watch` avec file triage, vue détaillée, templates de contact certifieur, décision.
3. **Public** : historique anonymisé des reports verified sur fiche certifieur.

### 13.5 Anti-abus

- Rate limit : 3/7j. 10 rejets cumulés → droit de signaler suspendu.
- Reporter reputation : verified +5, rejected −3. Rep > 20 → priorité triage.
- Charter re-signature si version change.
- Droit de réponse certifieur obligatoire avant publication.
- Audit trail immuable (RGPD via pseudonymisation sur suppression compte).

### 13.6 Engine link

`certifier-score.service` lit déjà `certifier_events`. Watch y pousse des événements typés. **Zéro couplage** — la formule §7.1 fonctionne telle quelle.

---

## 14. UI — Scan Result Screen refonte

### 14.1 Structure verticale (scroll)

```
[Header] [Product hero + name + community scans]
[HalalCard — variant: certified | analyzed]
[CertifierCard — si certified]
[BoycottCard — conditional]
[HealthCard]
[PersonalAlerts — gated]
[AlternativesRail]
```

### 14.2 HalalCard variant="certified"

```
◉ AVOID        Trust 18 · Grade N٥
« Certifieur non aligné pour ce produit »
[Logo ARGML]  Madhab: Hanafi · Poulet

⚠ Point bloquant scholarly
  Électronarcose bain d'eau volaille (paramètres réduits)
  → Position majoritaire HARAM (IIFA, Lajnah, Dar al-Iftaa)
  → Taux mortalité pré-abattage non publié/audité
  → Votre école (Hanafi): score 30 dans le dossier
  [ Voir dossier STUNNED_MEAT § volaille › ]

✓ Points positifs
  • Inspection musulmane temps plein
  • Tasmiya individuelle sur convoyeur (back-up)
  • Bovins/ovins sans étourdissement (score 98)

Pour un Shafi'i moderate : Trust 43 (N٤).
Pour un steak de bœuf ARGML : Trust 96 (N١).

[ Voir le profil du certifieur › ]
Analyse ingrédients : 0 alerte [développer]
```

### 14.3 HalalCard variant="analyzed"

```
◉ MASHBOOH             Score 45/100
« Discutable selon votre école »
[Hanafi ▾] Madhab actif

Signaux détectés (2)
🐞 Shellac (E904)        30 ›
   Insectes · 12 fatwas
🧪 E471 mono/diglyc.     40 ›
   Source animale/végétale ?

[ Voir l'analyse complète ]
```

### 14.4 Drill-down — onglets trilingues

Commun aux deux variants. Ouvert depuis un signal ou une pratique.

```
[Signal/Pratique] — Nom canonique
Score Naqiy · Verdict
[Résumé] [4 Madhabs] [Fatwas] [Istihalah/Technique] [Sources]
— contenu rendu depuis dossier_json trilingue, zéro traduction runtime —
```

### 14.5 Cross-ref Health ↔ Halal

Chips discrets : HealthCard → "↔ E904, E471 aussi analysés dans Halal" (scroll). HalalCard → "↔ Voir impact santé". Aucun signal ne vit dans les deux cards — angles orthogonaux.

---

## 15. Spec-driven — 7 JSON Schemas versionnés

`backend/src/schemas/halal-v2/`

1. `substance-dossier.schema.v1.json`
2. `practice-dossier.schema.v1.json`
3. `practice-tuple.schema.v1.json`
4. `match-pattern.schema.v1.json`
5. `scenario.schema.v1.json`
6. `evaluation-trace.schema.v1.json`
7. `gemini-semantic.schema.v1.json`

**CI workflow** (`.github/workflows/validate-dossiers.yml`) :
- Valide tous les `dossiers_v2/json/*.json` contre schemas
- Vérifie cohérence IDs ↔ `naqiy_substance_pipeline.json`
- Vérifie chaque substance_id dans scenarios existe
- Vérifie chaque practice_tuple a `dossier_section_ref` valide
- Refuse merge si divergence

**Dossier compiler** (`scripts/compile-dossiers.ts`) :
- Tourné par `db/entrypoint.ts` à chaque deploy, idempotent via `content_hash`
- Lit JSON → seed/upsert `substances`, `substance_dossiers`, `substance_match_patterns`, `substance_scenarios`, `substance_madhab_rulings`, `practices`, `practice_dossiers`, `practice_tuples`
- Génère `gemini-vocabulary.cache.json` (vocabulaire fusionné)
- Log diff si content_hash change

---

## 16. Observabilité & qualité

### 16.1 Telemetry
`halal_evaluations.trace` jsonb contient modules_fired, scenario/tuple key, confidence, durée, source d'extraction. Dashboards Grafana :
- Top substances fired / week
- Taux MASHBOOH par madhab
- Répartition certified vs analyzed track
- Convergence shadow V1↔V2 (phase migration)
- Latency p50/p95/p99 par stage

### 16.2 Golden corpus
`backend/src/__tests__/fixtures/halal/golden/` — 200 produits réels × 5 madhabs × 2 tracks. CI runs en continu.

### 16.3 Multilingual matching fixtures
`backend/src/__tests__/fixtures/gemini-matching/` — FR typo, arabe, allemand, descriptions implicites, faux-positifs. CI budget-limited real-Gemini runs.

### 16.4 Feedback loop
`scan_feedback.evaluation_id` → linke feedback à un trace → base training future.

---

## 17. Plan de migration — 9 phases

| Phase | Objet | Critère de sortie |
|---|---|---|
| **0 — Foundation** | 7 JSON Schemas figés. Fix dossiers existants (bug SHELLAC id, harmonisation, ajout `match_vocabulary` et `practice_tuples` extraction). CI validation. | `pnpm validate:dossiers` green |
| **1 — Data model** | Migrations Phase 1 tables. Dossier compiler. Seed 12+ substances + 15+ practice_tuples stunning. | Seeds OK, données visibles en DB |
| **2 — Gemini V2** | Vocabulary builder + provider + prompt V2 + schema. Feature-flag `gemini_v2`. Shadow mode sur 10k scans. | Convergence shadow ≥ 95 % |
| **2bis — Naqiy Watch MVP** | Charter system + user form + admin dashboard + workflow + integration `certifier_events`. Parallèle de Phase 2. | 3 reports de test end-to-end |
| **3 — HalalEngineV2 (Analyzed)** | TDD : ModuleRegistry, Scenario Selector, Madhab Filter, Aggregator. Feature-flag `halal_engine_v2`. Shadow mode. | Convergence V1↔V2 ≥ 95 % golden corpus |
| **4 — CertifierTrustEngine (Certified)** | Réécriture service selon §7.1. `certifier_tuple_acceptance` seed top-15 FR/UK. Shadow mode. | Top-15 certifieurs retournent rapports |
| **5 — Orchestrator + engines refactor** | `ScanOrchestratorV2` stage-by-stage. PersonalEngine + BoycottEngine services dédiés. Response DTO V2 derrière `scan.scanBarcodeV2`. | Contract tests green |
| **6 — UI refonte** | HalalCard 2 variants, CertifierCard, drill-down tabs trilingues, séparation Health, paywall, freemium gating. | QA 3 tiers × 5 madhabs × 2 tracks |
| **7 — Backfill dossiers** | Compléter 42 substances (tiers 1-2 prio). Practice dossiers (mechanical, ahl kitab, supervision, contamination, traceability). Vocabulaire enrichi. | Couverture ≥ 80 % additifs OFF top 100 |
| **8 — Cleanup** | Kill switch `ingredient_rulings` legacy. Retrait feature flags. Kill `scan.scanBarcode` v1. | Legacy removed |

---

## 18. Invariants & garanties formelles

1. **Anti-drift** : `trustScore[C,M,S] ≤ baseline[C,M,S]`. Aucun bonus ne peut dépasser le maillon faible.
2. **Scholarly traceability** : chaque score en DB pointe vers `dossier_section_ref`. CI rejette les lignes sans ref.
3. **Track consistency** : un produit ne peut pas basculer entre certified/analyzed en cours de vie sans migration explicite de son `halal_engine_version`.
4. **Freemium ethical parity** : `HalalReport.verdict` et `HalalReport.score` ne dépendent JAMAIS de `scanContext.tier`. Test property-based en CI.
5. **Vocabulary-dossier sync** : `gemini-vocabulary.cache.json` hash = `sha256(all active substance_dossiers content_hashes)`. Mismatch bloque le boot.
6. **Madhab independence** : pour un même (product, certifier/substances), 5 madhabs produisent 5 scores cohérents (aucun score ne peut décroître quand on passe d'un madhab plus strict à un plus permissif, modulo deltas explicites).
7. **Evidence monotonicity** : dégrader `evidence_level` ne peut jamais augmenter le score d'une acceptance.

---

## 19. Ce qui est conservé du V1

- `product-lookup.service` DB-first resolution
- `certifiers` table + `certifier_events` (formule recalculée mais table inchangée)
- `ai-extract/` orchestrator, circuit breaker, Redis L2 cache
- `additives` + `additive_madhab_rulings` (HealthEngine)
- `brand_certifiers` fallback
- `boycott_targets` table
- `recommendation.service` (base AlternativesEngine)
- Subscription tiers + trial logic
- `scan_feedback` table
- 12 dossiers v2 JSON (à enrichir en Phase 0)
- `getCertifierScores` cache (clé invalidée à chaque release)

---

## 20. Roadmap post-V2

- **Ijma visualisation** : graphe des convergences/divergences institutionnelles par substance/pratique
- **Certifier Score comparé** : side-by-side pour un même produit
- **Community voting** sur tuples contestés (weight = reputation)
- **ML feedback loop** : training d'un modèle léger sur `halal_evaluations.trace` + `scan_feedback` pour suggérer des nouvelles substances à dossier
- **API publique scholarly** : endpoints read-only des dossiers pour chercheurs / devs tiers

---

## Appendix A — Glossaire scholarly

| Terme | Définition |
|---|---|
| **Dhakāt** | Abattage rituel islamique |
| **Tasmiyah** | Invocation « Bismillah » au moment de l'abattage |
| **Istihalah** | Transformation chimique complète rendant une substance impure pure |
| **Maytah** | Charogne — animal mort sans abattage rituel valide |
| **Mawqūdhah** | Animal battu/assommé à mort avant égorgement — ḥarām (Coran 5:3) |
| **Ijma** | Consensus des savants |
| **Khilāf** | Divergence savante |
| **Madhab** | École juridique (Hanafi, Maliki, Shafi'i, Hanbali) |
| **Ahl al-Kitāb** | Gens du Livre (juifs, chrétiens) |
| **Ḥayāt mustaqirrah** | Vie résiduelle stable au moment de la coupe |
| **Ālah** | Instrument |
| **Dhābiḥ** | Abatteur |

## Appendix B — Références dossiers sources

- `DOSSIER_STUNNED_MEAT_V1.md` — matrice scoring §6, données scientifiques §8
- `DOSSIER_STUNNED_MEAT_V2.md` — corrections fatwas, ajouts IIFA
- `DOSSIER_MECHANICAL_SLAUGHTER_POULTRY_V2.md` — matrice §7, 8 fatwas institutionnelles
- `DOSSIER_AHL_KITAB_MEAT_V2.md` — à extraire en Phase 0
- Autres substance dossiers — `dossiers_v2/json/*.json`
- `naqiy_substance_pipeline.json` — registre canonique 42 substances

---

---

## Appendix C — Port interfaces (hexagonal layering)

All domain engines depend on these interfaces, never on concrete infrastructure. Each interface is a separate file in `backend/src/domain/ports/`. Implementations live in `backend/src/infra/`.

```ts
// backend/src/domain/ports/dossier-repo.ts
export interface IDossierRepo {
  getActiveSubstance(substanceId: string): Promise<SubstanceDossier | null>;
  getActivePractice(practiceId: string): Promise<PracticeDossier | null>;
  batchGetSubstances(ids: string[]): Promise<Map<string, SubstanceDossier>>;
}

// backend/src/domain/ports/scenario-repo.ts
export interface IScenarioRepo {
  forSubstance(substanceId: string): Promise<SubstanceScenario[]>;
  batchForSubstances(ids: string[]): Promise<Map<string, SubstanceScenario[]>>;
}

// backend/src/domain/ports/tuple-repo.ts
export interface IPracticeTupleRepo {
  acceptedByCertifier(
    certifierId: string,
    family?: string,
    species?: string,
  ): Promise<Array<{ tuple: PracticeTuple; acceptance: TupleAcceptance }>>;
}

// backend/src/domain/ports/gemini-provider.ts
export interface IGeminiSemanticProvider {
  extract(
    ingredientsText: string,
    productHint: { name?: string; brand?: string; categories?: string[] },
    vocabularyVersion: string,
  ): Promise<GeminiSemanticResult>;
}

// backend/src/domain/ports/certifier-resolver.ts
export interface ICertifierResolver {
  resolveFromProduct(product: ProductContext): Promise<ResolvedCertifier | null>;
}

// backend/src/domain/ports/evaluation-store.ts
export interface IEvaluationStore {
  persist(eval: HalalEvaluation): Promise<void>;
  getById(id: string): Promise<HalalEvaluation | null>;
  byProduct(productId: string, limit: number): Promise<HalalEvaluation[]>;
}
```

**Dependency direction rule:** `domain/*` imports nothing from `infra/*`, `trpc/*`, `db/*`. Enforced by ESLint boundary plugin (added in Phase 1).

---

## Appendix D — Known Issues Tracker (post-review 2026-04-09)

World-class architectural review identified 23 issues (8 CRITICAL, 15 HIGH/MEDIUM). Each issue has a phase assignment. Fixing a CRITICAL outside its phase is forbidden unless CI gate requires it.

### CRITICAL

| # | Issue | Fix in | Resolution plan |
|---|---|---|---|
| C1 | Freemium ethical parity not type-enforced — engines received full scanContext with tier | **Fixed in §6 Stage 0** | Split `HalalEvaluationContext` (pure) from `RequestContext`. Engines import only the first. Property-based test in Phase 3 CI. |
| C2 | Strictness overlay `relaxed: +3` contradicts anti-drift invariant §18.1 | **Fixed in §7.1** | Strictness delta is now monotonically non-positive. Invariant §18.1 strengthened to property test. |
| C3 | `certifier_tuple_acceptance` has no temporal dimension — replay of past scans returns current verdict | **Phase 1** (data model) | Add SCD type 2 columns `valid_from, valid_to` + snapshot `trace.acceptance_snapshot` into `halal_evaluations`. Migration must preserve replayability. |
| C4 | Naqiy Watch GDPR pseudonymization conflicts with event-sourced audit trail | **Phase 2bis** | Separate `reporter_pseudonym_id` (stable one-way hash, survives Art.17) in audit tables from `reporter_user_id` in mutable `report_owners` table. Document SAR flow explicitly. |
| C5 | Stage 7 persistence has no transaction boundary; no client-side idempotency key | **Phase 5** (orchestrator) | `scan_request_id = UUIDv7` client-generated, passed in tRPC input. Stage 7 wraps all writes in one tx. Gamification becomes outbox event. |
| C6 | Gemini prompt injection surface — no delimiter framing, no output-substring guard | **Phase 2** (Gemini V2) | (a) sentinel-delimited user text block, (b) post-validate every `matched_term` is a substring of source, (c) reject non-schema responses + fallback. |
| C7 | Cache key `sha256(text)` is under-specified; hot-reload invalidates all caches | **Phase 2** | `key = sha256(text ‖ category_hint ‖ prompt_version ‖ vocabulary_hash)`. Per-substance vocabulary hashes. Singleflight coalescing. |
| C8 | `applyEvidenceModifier` penalty stacking order undefined | **Phase 4** (CertifierTrustEngine) | Exact order of operations documented. Unit test matrix. Cap at -30 total. |

### HIGH

| # | Issue | Fix in |
|---|---|---|
| H9 | Defensive ingredient cross-check parallel sequencing unclear | Phase 5 — explicit DAG |
| H10 | `ALTER TABLE products` — 11 new columns, zero-downtime checklist required | Phase 1 — all cols NULL, PG11+ metadata-only |
| H11 | `practice_tuples.id text PRIMARY KEY` is fragile for history | Phase 1 — UUID PK + unique `slug` constraint |
| H12 | `practice_tuples.dimensions jsonb` has no per-family schema | Phase 1 — `practice_families` table + JSON Schema per family |
| H13 | Species filter undefined when empty intersection | Phase 4 — fallback to unknown-species floor |
| H14 | `AlternativesEngine` query is N+1 / missing indexes | Phase 5 — composite `(category, halal_track, certifier_id)` index + materialized candidate table |
| H15 | No error taxonomy in `halal_evaluations.trace` | Phase 5 — add `status enum('ok','degraded','failed')` + `degradation_reason` as first-class columns |
| H16 | Vocabulary hot-reload = singleton, breaks blue/green | Phase 2 — pin vocabulary version per-request |
| H17 | `HalalEngineV2.evaluate` has sequential awaits inside for-loop (N+1) | Phase 3 — batch-load all dossiers/scenarios/rulings after `matchModules` |
| H18 | `canSeeAlternatives` gates at render but compute runs | Phase 5 — gate at compute level |
| H19 | Dossier compiler has no rollback plan | Phase 1 — keep N previous versions, `is_active` toggle, rollback command |
| H20 | Prompt version not in cache key | Phase 2 — covered by C7 |
| H21 | No port interfaces — tests can't mock deps | **Fixed in Appendix C** |
| H22 | Tuple `notes_fr/ar` but no `notes_en` — breaks trilingual claim | **Phase 0** — add `notes_en` to `practice-tuple.schema.v1.json` (Task 4) |
| H23 | Migration kill-switches + convergence metric undefined | Phase 2 — define flag store (DB table `feature_flags`, already exists) + convergence = `verdict_exact_match AND score_within(±3)` |

### MEDIUM

- M1  Arabic numeral grades N١…N٥ — DB storage encoding. **Fix:** store as ASCII `N1..N5`, render Arabic in UI only.
- M2  `thinkingBudget: 0` SDK compatibility check — Phase 2 integration test.
- M3  Defensive alcohol >0.5 % threshold unsourced — Phase 0 add citation to spec §7.5.
- M4  Watch rejection appeal flow — Phase 2bis.
- M5  VoiceOver / RTL accessibility annotations — Phase 6 UI.
- M6  HealthEngine `additives` table still joined to `additive_madhab_rulings` — Phase 3 drop cross-coupling.
- M7  `scan_id` FK undefined — Phase 1 migration.
- M8  Mobile/backend schema version negotiation — Phase 5 add `X-Naqiy-Schema-Version` header.
- M9  `scan_feedback.evaluation_id` cascade behavior — Phase 5.
- M10 JSON-Schema → TS types contract drift — **Phase 0** add `json-schema-to-typescript` step.
- M11 `canSeeBoycott` field in entitlements is dead code — Phase 5 remove.
- M12 `/scan` rate limit preservation confirmed — Phase 5 acceptance criterion.

### Resolution tracking

Each fix must reference its CRITICAL/HIGH number in the commit message (e.g., `feat(engine): apply C3 SCD type 2 on certifier_tuple_acceptance`). Phase exit criteria include "all issues assigned to this phase resolved".

---

**End of spec.** Ready for `superpowers:writing-plans` → implementation plan.
