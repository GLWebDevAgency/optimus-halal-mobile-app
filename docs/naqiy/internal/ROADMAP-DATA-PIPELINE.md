# Naqiy Data Pipeline — Roadmap Post-MVP

> Spec designée le 2026-03-14. À implémenter après lancement et traction (1000+ users).

## Décisions validées

| Question | Décision |
|----------|----------|
| Scope batch | 361K produits avec `ingredientsText`, le reste enrichi au scan utilisateur |
| Pré-calcul madhabs | 4 madhabs + Naqiy Score (verdict le plus strict) |
| Data quality | Completeness score + Data lineage |
| Re-enrichissement | Event-based + cron mensuel top 10K |
| Quality gates | Gates avant écriture DB + monitoring post-enrichissement |
| Health Score V3 | Déjà implémenté — à intégrer dans le batch |
| Naqiy Score | `min()` des 4 verdicts madhabs (philosophie al-wara') |
| Exécution batch | Script CLI avec checkpoint (`pnpm run enrich-batch`) |
| Interface mobile | Scan router = smart cache reader, zero changement mobile |
| Architecture | Approche "Monolith Pipeline" — `enrichProduct()` unique |

## Architecture cible

```
── BATCH ENRICHMENT (offline, one-shot ~30h) ──────────
361K produits × Pipeline unifié :
  1. sanitize(ingredientsText)
  2. Gemini Flash → ingredients[], additives[], novaEstimate, allergens
  3. Halal v2 analysis ×4 madhabs → verdicts
  4. Naqiy Score → min(4 verdicts)
  5. Health Score V3 → score, axes, anomalies, label
  6. Allergen normalization → format en:xxx
  7. Completeness score (0-100)
  8. Data lineage JSONB
  9. WRITE tout en DB

── SCAN TEMPS RÉEL (post-batch) ───────────────────────
  Produit enriched → RETOUR IMMÉDIAT (~50ms)
  Produit non-enriched → pipeline complet → update DB → retour

── BACKGROUND REFRESH (cron mensuel) ──────────────────
  Top 10K produits les plus scannés > 30 jours → re-enrich
```

## Nouvelles colonnes DB

```sql
halal_verdicts          JSONB     -- [{madhab, status, conflicts}] ×4
naqiy_verdict           VARCHAR   -- halal/doubtful/haram/unknown
ingredient_rulings_cache JSONB    -- résultat matchIngredientRulings
health_score_v3         SMALLINT  -- 0-100
health_label            VARCHAR   -- excellent/good/mediocre/bad
health_axes             JSONB     -- {nutrition, additives, nova, beverageSugar}
completeness_score      SMALLINT  -- 0-100
data_lineage            JSONB     -- {ingredients: {source, version, at}, ...}
enriched_at             TIMESTAMPTZ
```

## Quality Gates (avant écriture DB)

| Gate | Règle | Action |
|------|-------|--------|
| Gemini hallucination | >30 ingrédients pour produit simple | Flag `review_needed` |
| Incohérence halal | Verdict halal + containsAlcohol | Flag `anomaly` |
| Health score aberrant | Score >80 + additifs dangereux | Recalcul forcé |
| Nutrients impossibles | lipides+glucides+protéines > 100g | Marque `unreliable` |
| Doublons sémantiques | même ingrédient en 3 langues | Déduplique |

## 15 Gaps identifiés (audit 2026-03-14)

1. Pas de validation Zod sur réponse OFF API
2. ingredientsText tronqué à 10K sans boundary linguistique
3. Bulk import: split naïf des ingrédients (virgule)
4. Bulk import: pas de sanitizeOffProduct()
5. AI extraction reçoit texte non sanitisé ← **FIXÉ dans quick fix MVP**
6. Cache key mismatch AI vs halal analysis
7. Vision service sans rate limit / circuit breaker / cache
8. Allergens bulk (texte libre) ≠ allergens scan (tags structurés)
9. 3 copies normalisation E-code ← **FIXÉ dans quick fix MVP**
10. nutriscoreGrade accepte tout caractère
11. novaEstimate float non coercé
12. Allergen normalization incomplète (noix variants)
13. Word-boundary regex ASCII-only fallback
14. offData JSONB sans size limit
15. Background refresh écrase sans re-enrichir

## Coût estimé

| Composant | Coût |
|-----------|------|
| Gemini Flash batch | ~$50 |
| Railway compute | ~$5 |
| Dev (pipeline + migrations + tests) | ~5 jours |

## Priorité d'exécution post-MVP

```
Sprint 1 (semaine 1 post-lancement) :
  - Migration DB (nouvelles colonnes)
  - enrichProduct() pipeline function
  - Intégrer dans scan router (smart cache reader)

Sprint 2 (semaine 2) :
  - Batch script CLI avec checkpoint
  - Lancer batch sur les 361K produits
  - Naqiy Score computation

Sprint 3 (semaine 3) :
  - Quality gates
  - Completeness score + lineage
  - Cron mensuel re-enrichissement

Sprint 4 (semaine 4) :
  - Monitoring dashboard
  - Fix remaining gaps (1-15)
```
