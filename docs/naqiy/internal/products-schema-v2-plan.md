# Products Schema V2 — Plan de migration

> Date: 2026-03-08
> Auteur: Naqiy Engineering
> Status: DRAFT — En attente de validation

## Contexte

Le schema `products` V1 est un staging area minimaliste (17 colonnes).
Le runtime `scan.ts` extrait les champs critiques du blob `offData` (jsonb) a chaque scan.
C'est inefficace : pas d'index, pas de requetes, pas de qualite mesuree.

V2 denormalise les champs critiques pour :
1. Permettre la recherche et le filtrage cote frontend
2. Pre-calculer la qualite des donnees
3. Supporter l'enrichissement multi-sources (OFF, Carrefour, Scene7)
4. Indexer les allergenes et traces pour l'analyse halal

## Principe : MIGRATION ADDITIVE UNIQUEMENT

- Zero colonne supprimee ou renommee
- Toutes les nouvelles colonnes ont des defaults (nullable ou valeur par defaut)
- Le code existant (`scan.ts`, `product.ts`, `barcode.service.ts`) continue de fonctionner
- Les nouvelles colonnes sont populees par le pipeline d'import (pas de migration de donnees bloquante)

---

## Nouvelles colonnes

### Bloc A — Identite produit enrichie

| Colonne | Type | Default | Source | Raison |
|---|---|---|---|---|
| `generic_name` | varchar(500) | null | OFF `generic_name` | Nom generique (ex: "Pate a tartiner aux noisettes") |
| `brand_owner` | varchar(255) | null | OFF `brand_owner` | Groupe proprietaire (ex: "Ferrero") |
| `quantity` | varchar(100) | null | OFF `quantity` | Contenance (ex: "750g", "1.5L") |
| `serving_size` | varchar(100) | null | OFF `serving_size` | Portion de reference |
| `countries_tags` | text[] | null | OFF `countries_tags` | Pays de vente (ex: ["en:france"]) |

### Bloc B — Ingredients & Allergenes (CRITIQUE pour halal)

| Colonne | Type | Default | Source | Raison |
|---|---|---|---|---|
| `ingredients_text` | text | null | OFF `ingredients_text` | Texte brut complet (vs tableau split actuel) |
| `allergens_tags` | text[] | null | OFF `allergens_tags` | Allergenes declares (ex: ["en:gluten", "en:milk"]) |
| `traces_tags` | text[] | null | OFF `traces_tags` | Traces possibles (ex: ["en:nuts", "en:eggs"]) |
| `additives_tags` | text[] | null | OFF `additives_tags` | Additifs (ex: ["en:e471", "en:e322"]) |
| `ingredients_analysis_tags` | text[] | null | OFF `ingredients_analysis_tags` | Tags d'analyse (vegan, vegetarian, palm oil) |

### Bloc C — Nutrition denormalisee

| Colonne | Type | Default | Source | Raison |
|---|---|---|---|---|
| `nutriscore_grade` | varchar(1) | null | OFF `nutriscore_grade` | Grade A-E pour HealthScore |
| `nova_group` | smallint | null | OFF `nova_group` | Groupe NOVA 1-4 pour HealthScore |
| `ecoscore_grade` | varchar(1) | null | OFF `ecoscore_grade` | Grade A-E eco |
| `energy_kcal_100g` | real | null | OFF nutriments | kcal/100g |
| `fat_100g` | real | null | OFF nutriments | Lipides/100g |
| `saturated_fat_100g` | real | null | OFF nutriments | AGS/100g |
| `carbohydrates_100g` | real | null | OFF nutriments | Glucides/100g |
| `sugars_100g` | real | null | OFF nutriments | Sucres/100g |
| `fiber_100g` | real | null | OFF nutriments | Fibres/100g |
| `proteins_100g` | real | null | OFF nutriments | Proteines/100g |
| `salt_100g` | real | null | OFF nutriments | Sel/100g |

### Bloc D — Labels & Certifications

| Colonne | Type | Default | Source | Raison |
|---|---|---|---|---|
| `labels_tags` | text[] | null | OFF `labels_tags` | Tous les labels (halal, bio, vegan...) |
| `emb_codes` | varchar(255) | null | OFF `emb_codes` | Codes emballeur (tracabilite) |

### Bloc E — Origine & Tracabilite

| Colonne | Type | Default | Source | Raison |
|---|---|---|---|---|
| `origins_tags` | text[] | null | OFF `origins_tags` | Origine des ingredients |
| `manufacturing_places` | varchar(500) | null | OFF `manufacturing_places` | Lieux de fabrication |

### Bloc F — Images multi-sources

| Colonne | Type | Default | Source | Raison |
|---|---|---|---|---|
| `image_ingredients_url` | text | null | OFF `image_ingredients_url` | Photo liste ingredients |
| `image_nutrition_url` | text | null | OFF `image_nutrition_url` | Photo tableau nutritionnel |
| `image_front_url` | text | null | OFF `image_front_url` | Photo face avant (HD) |
| `image_r2_key` | varchar(255) | null | R2 pipeline | Cle image hebergee sur R2 Naqiy |

### Bloc G — Qualite & Provenance

| Colonne | Type | Default | Source | Raison |
|---|---|---|---|---|
| `completeness` | real | null | OFF `completeness` | Score 0.0-1.0 de completude OFF |
| `data_sources` | text[] | '{}' | Pipeline | Sources de donnees (ex: ["off", "carrefour_vtex"]) |
| `off_last_modified` | timestamptz | null | OFF `last_modified_datetime` | Derniere modif OFF |
| `analysis_version` | smallint | 1 | Code | Version algo halal (pour re-analyse) |

---

## Index supplementaires

| Index | Colonnes | Type | Raison |
|---|---|---|---|
| `products_countries_gin_idx` | `countries_tags` | GIN | Filtrage par pays |
| `products_labels_gin_idx` | `labels_tags` | GIN | Recherche produits halal/bio/vegan |
| `products_allergens_gin_idx` | `allergens_tags` | GIN | Match allergenes utilisateur |
| `products_additives_gin_idx` | `additives_tags` | GIN | Recherche par additif |
| `products_completeness_idx` | `completeness` | BTREE | Tri par qualite |
| `products_brand_idx` | `brand` | BTREE | Recherche par marque |

---

## Impact sur le code existant

### Fichiers a modifier

| Fichier | Changement | Breaking? |
|---|---|---|
| `backend/src/db/schema/products.ts` | Ajout 30 colonnes + 6 index | Non |
| `backend/src/trpc/routers/scan.ts` | Lire depuis colonnes au lieu de `offData` | Non (fallback) |
| `backend/src/trpc/routers/product.ts` | Filtres enrichis (allergenes, labels) | Non |
| `backend/src/services/barcode.service.ts` | Populate les nouvelles colonnes au lookup | Non |
| `backend/src/db/seeds/seed-dev-products.ts` | Populate les nouvelles colonnes | Non |
| `backend/drizzle/` | Nouvelle migration 0017 | N/A |

### Strategie de population

1. **Produits existants** : Script de backfill qui extrait les champs de `offData` jsonb
2. **Nouveaux produits** : `barcode.service.ts` populate au lookup OFF
3. **Bulk import** : Pipeline OFF CSV qui insere directement dans les nouvelles colonnes
4. **Enrichissement** : Pipeline Carrefour/Scene7 qui met a jour les colonnes image et data_sources

### Aucun champ supprime

Les colonnes V1 restent :
- `ingredients` (text[]) → coexiste avec `ingredients_text` (text brut)
- `nutritionFacts` (jsonb) → coexiste avec les colonnes nutriments denormalisees
- `offData` (jsonb) → reste pour le blob complet OFF
- `category` (varchar) → coexiste avec les tags OFF

---

## Estimation volume

| Source | Produits | Avec ingredients | Avec nutrition | Taille DB estimee |
|---|:---:|:---:|:---:|:---:|
| OFF France (completeness > 0.3) | ~150K | ~90K | ~85K | ~500 MB |
| OFF France (completeness > 0.5) | ~60K | ~55K | ~50K | ~200 MB |
| OFF France halal-tagged | ~3K | ~2.5K | ~2K | ~10 MB |
| Carrefour VTEX (perdu) | 2K | 2K | — | ~8 MB |
| Dev seed actuel | 42 | 42 | 42 | <1 MB |

**Recommandation** : Importer OFF completeness > 0.3 = ~150K produits.
C'est un bon compromis couverture/qualite. Les produits incomplets servent
quand meme pour le barcode lookup (nom + image + marque).

---

## Phases d'execution

### Phase A : Schema migration (cette PR)
1. Modifier `products.ts` — ajouter 30 colonnes + 6 index
2. Generer migration Drizzle 0017
3. Tester migration sur DB dev

### Phase B : Backfill produits existants
1. Script qui lit `offData` jsonb des 42 produits dev
2. Extrait et ecrit dans les nouvelles colonnes

### Phase C : Pipeline d'import OFF bulk
1. Telecharger CSV OFF (~1.2 GB gz)
2. Stream-process avec Node.js/Python
3. Filtrer : France + completeness > 0.3
4. Inserer par batch de 1000 (upsert on barcode)
5. Pre-calculer halal status basique (labels + ingredients keywords)

### Phase D : Enrichissement
1. Scene7 : tester chaque EAN contre le CDN, stocker `image_r2_key`
2. Carrefour : quand les APIs redeviennent accessibles
3. Re-analyse halal periodique (quand `analysis_version` < current)
