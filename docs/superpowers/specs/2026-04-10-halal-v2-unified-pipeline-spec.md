# Halal Engine V2 — Unified Pipeline Spec (V1 + V2 Fusion)

**Date:** 2026-04-10
**Status:** Approved for implementation
**Context:** The V2 was initially built as a parallel engine that broke V1 data flows. This spec defines the correct approach: V2 = V1 complete + Gemini-augmented enrichments injected at precise points.

---

## 1. V1 Cartographie complète — ce qu'on NE PEUT PAS perdre

### V1 scanBarcode Flow (13 étapes, 28 champs retour)

```
ÉTAPE 0 — User Profile
  userProfile = { madhab, halalStrictness, allergens, isPregnant, hasChildren }
  analysisOptions = { madhab, strictness }

ÉTAPE 1 — Product Resolution (DB-first, OFF fallback)
  resolveProduct(barcode) → { product (66 cols), offData }
  backfillProductFromOff() si legacy

ÉTAPE 2 — analyzeHalalStatus() — LE CŒUR
  Input: ingredientsText(FR prio), additives_tags, labels_tags, analysis_tags
  TIER 1: labels_tags → normalizeCertifierTag() → LABEL_TAG_TO_CERTIFIER_ID
          → match: return HALAL certified (0.95)
  TIER 1c: brand fallback → lookupBrandCertifier(brand)
  TIER 2: lookupAdditives(additives_tags, madhab)
          → DB additives + additiveMadhabRulings + isVegetarian override
          → hasVegetalOriginContext() regex
  TIER 3: matchIngredientRulings(ingredientsText, madhab)
          → 47 patterns, normalize, testPattern, resolveRulingForMadhab
  Aggregation: worstStatus + strictness overlay
  Output: { status, confidence, tier, reasons[], certifierName, certifierId }

ÉTAPE 3 — Sync product halal status (write-through DB)

ÉTAPE 4 — AI Extraction (Gemini, post-analysis ⚠️ BUG V1)
  smartExtractIngredients() → ingredients[] nettoyés + aiEnrichment
  Persist products.ingredients

ÉTAPE 5 — Parallel enrichment
  checkBoycott(brand)
  communityCount
  matchIngredientRulings(text, madhab) ← 2ème appel ⚠️ BUG V1

ÉTAPE 6 — Personal Alerts
  matchAllergens(allergens, allergens_tags, traces_tags)
  riskPregnant/riskChildren × additives

ÉTAPE 7 — Health Score V3
  computeHealthScore() — 4 axes + data quality gate
  DataReconciler + BeverageIntelligence

ÉTAPE 8 — Madhab Verdicts (4 écoles)
  computeMadhabVerdicts() → conflictingAdditives + conflictingIngredients

ÉTAPE 9 — Certifier enrichment (LIVE trust scores)
  getCertifierScores(certifierId) → trustScore×5, trustGrade, practices, detail

ÉTAPE 10 — Dietary + Nutrients + Special product + Score exclusion

ÉTAPE 11 — Gamification (scan, XP, streak, level-up)

ÉTAPE 12 — Quota management (DB + Redis)

RETURN: 28 champs
```

### V1 Return Shape (28 champs — TOUS conservés en V2)

```typescript
{
  scan, product, isNewProduct,
  halalAnalysis,           // { status, confidence, tier, reasons[], certifierName, certifierId, analysisSource }
  boycott,                 // { isBoycotted, targets[] }
  offExtras,               // { nutriscoreGrade, novaGroup, allergensTags, labelsTags, ... }
  healthScore,             // { score, label, axes{nutrition,additives,processing,profile}, bonuses, ... }
  aiEnrichment,            // { novaEstimate, allergenHints, containsAlcohol, isOrganic }
  personalAlerts,          // [{ type, severity, title, description }]
  communityVerifiedCount,
  madhabVerdicts,          // [{ madhab, status, conflictingAdditives[], conflictingIngredients[] }]
  ingredientRulings,       // [{ pattern, ruling, confidence, scholarlyReference, fatwaSourceName }]
  certifierData,           // { id, name, trustScore×5, trustGrade, practices, detail, ... }
  dietaryAnalysis,         // { containsGluten, containsLactose, containsPalmOil, isVegetarian, isVegan }
  nutrientBreakdown,       // [{ key, name, value, unit, percentage, level, isPositive }]
  specialProduct,          // { type, bypassNutriScore, qualityRatio } | null
  scoreExclusion,          // reason | null
  additiveHealthEffects,   // { [code]: { type, confirmed } }
  detectedAdditives,       // [{ code, nameFr, halalStatusDefault, toxicityLevel, risks... }]
  beverageAnalysis,        // { subcategory, scoreModifier, ... } | null
  dataReconciliation,      // { conflicts, coverage, completeness } | null
  levelUp,                 // { previousLevel, newLevel, newXp } | null
  remainingScans,          // number | null
}
```

### V1 Certifier Detection (CRITIQUE — ne pas perdre)

```
OFF labels_tags examples:
  "fr:controle-grande-mosquee-de-lyon-halal" → ARGML
  "fr:certification-avs" → AVS
  "fr:controle-de-la-mosquee-d-evry-courcouronnes" → ACMIF
  "en:halal" → generic halal

normalizeCertifierTag() strips prefixes:
  "certification-halal-", "certification-", "certifie-", "controle-de-la-", etc.

LABEL_TAG_TO_CERTIFIER_ID: 17 certifieurs FR/UK hardcoded
  avs, achahada, argml, sfcvh, acmif, arrissala, halal-services, etc.

Brand fallback: lookupBrandCertifier(brand) via brand_certifiers table
```

---

## 2. Arbre V2 Unifié — Gemini-Augmented Pipeline

```
STAGE 0 — CONTEXT (V1 inchangé)
  userProfile + quotaCheck + deviceId

STAGE 1 — PRODUCT RESOLUTION (V1 inchangé)
  resolveProduct(barcode) → { product(66 cols), offData }

STAGE 2 — GEMINI V2 ENRICHED EXTRACTION (pivot V2)
  UN SEUL appel Gemini qui fait TOUT :
  Input:
    - ingredients_text (FR prioritaire)
    - product_name, brands, categories
    - labels_tags → Gemini matche aussi les certifieurs
    - SUBSTANCE_VOCABULARY injecté (from DB)
    - CERTIFIER_VOCABULARY injecté (NOUVEAU — 17 certifieurs avec labels connus)
  Output:
    ingredients[], additives[], lang,
    product_category, product_usage, meat_classification,
    detected_substances[],
    detected_certifier: { certifier_id, matched_label, confidence } | null,
    animal_source_hints[], alcohol_context,
    novaEstimate, allergenHints, containsAlcohol, isOrganic
  Fallback: V1 regex + OFF structuré
  Cache: sha256(text|categories|prompt_version|vocab_hash)
  Persist: products.gemini_extract + gemini_extract_hash

STAGE 3 — HALAL ANALYSIS V2 (V1 amélioré + V2 enrichi)
  analyzeHalalStatusV2():
    TIER 1 — Certification (V1 + Gemini boost)
      a) V1: labels_tags → normalizeCertifierTag → LABEL_TAG_MAP
      b) NOUVEAU: Gemini detected_certifier cross-valide/enrichit
      c) V1: brand fallback
    TIER 2 — Additifs (V1 + Gemini additives[])
      a) V1: OFF additives_tags → lookupAdditives(DB, madhab)
      b) NOUVEAU: Gemini additives[] complète ce que OFF a manqué
    TIER 3 — Ingrédients (V1 sur texte Gemini-nettoyé)
      a) V1: matchIngredientRulings() — MAIS sur texte propre Gemini
      b) Fix bug V1: UN SEUL appel, résultat réutilisé
    TIER 4 — Substances V2 (NOUVEAU)
      Pour chaque Gemini detected_substance:
        a) Lookup substance_dossiers
        b) Select scenario (category × usage × certified)
        c) Apply madhab filter
        d) Enrichir reason V1 avec données scholarly
    Aggregation: worst-case V1 + pondération V2

STAGE 4 — CERTIFIER TRUST (V1 + V2 enrichi)
  V1: getCertifierScores() → trustScore×5, practices, detail
  V2: practice tuples (species-weighted), blocking points, cross-madhab

STAGE 5 — PARALLEL ENRICHMENTS (V1 complet)
  boycott, madhabVerdicts, healthScore, dietary, nutrients,
  beverage, personalAlerts, communityCount — TOUS conservés

STAGE 6 — GAMIFICATION + QUOTA (V1 complet)

STAGE 7 — DECISION FLOW TRACE (V2 nouveau)
  buildDecisionFlow() + INSERT halal_evaluations

STAGE 8 — RESPONSE (V1 superset)
  return {
    ...V1_28_CHAMPS,  // 100% backward compatible
    v2: {
      substanceSignals[], certifierTrust, productClassification,
      decisionFlow[], engineVersion, evaluationId
    }
  }
```

---

## 3. Bugs V1 corrigés par V2

1. **Gemini APRÈS l'analyse halal** → V2: Gemini AVANT (Stage 2 avant Stage 3)
2. **matchIngredientRulings appelé 2x** → V2: 1 seul appel, réutilisé
3. **Pas de trace d'audit** → V2: halal_evaluations + decision_flow
4. **Trust score éditorial pur** → V2: enrichi practice tuples

## 4. Ce que V2 AJOUTE (5 enrichissements)

| # | Enrichissement | Point d'injection | Données |
|---|---|---|---|
| A | Gemini V2 vocabulary-aware | Remplace smartExtractIngredients() — AVANT analyse | substances, category, certifier, alcohol |
| B | Substance dossiers | Après TIER 3 analyse halal | dossier_json, fatwa_count, score_matrix |
| C | Practice tuples | Après getCertifierScores() | tuples_evaluated, species_trust, blocking |
| D | Certifier matching Gemini | Cross-valide TIER 1 | detected_certifier avec confidence |
| E | Decision flow trace | Après tout | decision_flow: string[], halal_evaluations |

## 5. UI Approach

L'écran V2 (`ScanResultScreenV2`) :
- **Consomme les 28 champs V1** pour le contenu existant
- **Consomme `v2.*`** pour les enrichissements (substance signals, certifier trust V2, trace)
- **Layout Stitch** "Scholarly Sanctuary" — scroll vertical unique, surface-on-surface, NaqiyGradeBadge strip
- **Hero existant** conservé (déjà bon)
- **Plus de TabBar horizontal** — tout en scroll vertical
- **Gating freemium** sur les éléments V2 (dossiers scholarly, trace = premium)

## 6. Implementation strategy

Le `scanBarcodeV2` n'est PAS un nouveau endpoint séparé.
C'est le `scanBarcode` V1 existant avec les 5 enrichissements injectés chirurgicalement.
Feature flag `halalEngineV2Enabled` active/désactive les enrichissements V2.
Quand disabled: le scan tourne en V1 pur (aucune régression possible).
Quand enabled: V1 + enrichissements V2 = superset.

---

**End of spec. Ready for implementation in fresh session.**
