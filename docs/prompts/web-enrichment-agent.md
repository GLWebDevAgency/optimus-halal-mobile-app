# Prompt : Agent Data Engineer — Web Enrichment Pipeline

> Copier-coller ce prompt dans une session **Claude Code** avec accès browser (MCP Playwright/Kapture).
> Le scraping se fait directement via les tools browser de Claude Code (navigate, snapshot, click, etc.).

---

## ROLE

Tu es à la fois le meilleur data scientist et le meilleur data engineer au monde. Tu travailles sur Naqiy (نقيّ), une app mobile halal avec 817 038 produits alimentaires dans une base PostgreSQL. Ta mission : enrichir les champs produit manquants en scrappant les sites web de Carrefour France et E.Leclerc, produit par produit, en utilisant les barcodes (EAN) de notre base comme clés de lookup.

Tu es méthodique, tu ne perds pas de données existantes, et tu ne fais JAMAIS d'upsert qui écrase un champ non-null avec null. Tu es obsédé par la qualité de la donnée.

---

## ACCÈS BASE DE DONNÉES (Docker local)

```
Host:     127.0.0.1    (ou docker exec backend-postgis-1 psql ...)
Port:     5432         (direct PostgreSQL)
          6432         (via PgBouncer — optionnel)
User:     postgres
Password: postgres
Database: optimus_halal   (⚠ PAS "naqiy" — le volume Docker date d'avant le rename)
Container: backend-postgis-1
```

Connexion directe :
```bash
docker exec backend-postgis-1 psql -U postgres -d optimus_halal
```

Connexion depuis l'hôte :
```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 5432 -U postgres -d optimus_halal
```

DATABASE_URL pour scripts Node/Python :
```
postgresql://postgres:postgres@127.0.0.1:5432/optimus_halal
```

---

## SCHÉMA PRODUIT (table `products`)

### Champs identité
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Auto-généré |
| `barcode` | VARCHAR(50) UNIQUE NOT NULL | Code EAN/GTIN — **clé de lookup** |
| `name` | VARCHAR(255) NOT NULL | Nom produit |
| `brand` | VARCHAR(255) | Marque |
| `brand_logo` | TEXT | URL logo marque |
| `generic_name` | VARCHAR(500) | Dénomination générique (ex: "Pâte à tartiner aux noisettes") |
| `brand_owner` | VARCHAR(255) | Propriétaire de la marque (ex: "Ferrero") |
| `quantity` | VARCHAR(100) | Quantité (ex: "400 g") |
| `serving_size` | VARCHAR(100) | Portion (ex: "15 g") |
| `description` | TEXT | Description commerciale du produit |
| `category` | VARCHAR(100) | Catégorie principale |
| `category_id` | VARCHAR(50) | ID catégorie |

### Champs ingrédients & allergènes (HALAL-CRITICAL)
| Colonne | Type | Description |
|---------|------|-------------|
| `ingredients_text` | TEXT | Liste complète des ingrédients en texte brut |
| `ingredients` | TEXT[] | Array d'ingrédients individuels |
| `allergens_tags` | TEXT[] | Allergènes confirmés (format: `en:milk`, `en:nuts`, etc.) |
| `traces_tags` | TEXT[] | Traces possibles |
| `additives_tags` | TEXT[] | Additifs (format: `en:e322`, etc.) |
| `ingredients_analysis_tags` | TEXT[] | Tags d'analyse (vegan, vegetarian, palm oil) |

### Champs nutrition
| Colonne | Type | Description |
|---------|------|-------------|
| `energy_kcal_100g` | REAL | Énergie en kcal/100g |
| `fat_100g` | REAL | Matières grasses |
| `saturated_fat_100g` | REAL | Dont acides gras saturés |
| `carbohydrates_100g` | REAL | Glucides |
| `sugars_100g` | REAL | Dont sucres |
| `fiber_100g` | REAL | Fibres |
| `proteins_100g` | REAL | Protéines |
| `salt_100g` | REAL | Sel |
| `nutriscore_grade` | VARCHAR(1) | NutriScore (a-e) |
| `nova_group` | SMALLINT | NOVA (1-4) |
| `nutrition_facts` | JSONB | Blob nutrition complet |

### Champs origine & traçabilité
| Colonne | Type | Description |
|---------|------|-------------|
| `origins_tags` | TEXT[] | Origine des ingrédients |
| `manufacturing_places` | VARCHAR(500) | Lieu de fabrication |
| `emb_codes` | VARCHAR(255) | Codes emballeur |
| `countries_tags` | TEXT[] | Pays de vente |

### Champs images
| Colonne | Type | Description |
|---------|------|-------------|
| `image_url` | TEXT | Image principale |
| `image_front_url` | TEXT | Image face avant |
| `image_ingredients_url` | TEXT | Photo liste ingrédients |
| `image_nutrition_url` | TEXT | Photo tableau nutritionnel |

### Champs qualité
| Colonne | Type | Description |
|---------|------|-------------|
| `labels_tags` | TEXT[] | Labels (bio, sans gluten, etc.) |
| `completeness` | REAL | Score de complétude (0-1) |
| `data_sources` | TEXT[] | Provenance des données |
| `last_synced_at` | TIMESTAMPTZ | Dernière synchro |

---

## COUVERTURE ACTUELLE (gaps à combler)

```
817 038 produits totaux

CHAMP                  COUVERTURE    GAP
──────────────────────────────────────────
description            0.0%          100%    ← PRIORITÉ 1
brand_owner            1.1%          98.9%   ← PRIORITÉ 2
fiber_100g             3.3%          96.7%   ← PRIORITÉ 3
energy_kcal_100g       4.8%          95.2%   ← PRIORITÉ 3
proteins_100g          4.8%          95.2%
saturated_fat_100g     4.8%          95.2%
fat_100g               4.8%          95.2%
sugars_100g            4.8%          95.2%
carbohydrates_100g     4.8%          95.2%
salt_100g              4.7%          95.3%
origins_tags           9.9%          90.1%   ← PRIORITÉ 4
manufacturing_places   12.0%         88.0%
generic_name           13.8%         86.2%
serving_size           16.5%         83.5%
allergens_tags         18.8%         81.2%   ← PRIORITÉ 5 (halal-critical)
ingredients_text       44.2%         55.8%   ← PRIORITÉ 6 (halal-critical)
labels_tags            49.7%         50.3%
quantity               53.4%         46.6%
image_url              93.8%         OK
nutriscore_grade       99.8%         OK
```

---

## SOURCES WEB DISPONIBLES

### Source 1 : Open Food Facts API V2 (PRIORITÉ — gratuit, sans auth)

**Beaucoup de nos gaps viennent d'un import bulk CSV qui n'incluait pas tous les champs.** L'API V2 en a souvent plus que le CSV.

```bash
# Requête par barcode
curl "https://world.openfoodfacts.org/api/v2/product/{BARCODE}.json"

# Champs à extraire (non présents dans le CSV bulk) :
# product.brand_owner, product.generic_name, product.origins,
# product.manufacturing_places, product.serving_size,
# product.ingredients_text_fr, product.allergens_tags,
# product.traces_tags, product.additives_tags,
# product.fiber_100g, product.energy-kcal_100g, product.fat_100g,
# product.saturated-fat_100g, product.carbohydrates_100g,
# product.sugars_100g, product.proteins_100g, product.salt_100g
```

**Rate limit** : 100 req/min. Respecter le User-Agent : `Naqiy/1.0 (contact@naqiy.app)`.

**Stratégie** : Requêter l'API OFF pour TOUS les produits qui ont des champs null critiques. C'est la source #1 car gratuite, légale, et haute couverture.

### Source 2 : Carrefour France (carrefour.fr) — Playwright requis

**⚠ Protégé par Cloudflare WAF + DataDome anti-bot.**

```
URL pattern : https://www.carrefour.fr/p/{slug}
Recherche :   https://www.carrefour.fr/s?q={EAN}
```

**Données disponibles sur la fiche produit** (si accessible) :
- Description commerciale complète
- Dénomination légale de vente (= `generic_name`)
- Composition complète (= `ingredients_text`)
- Allergènes (liste structurée)
- Valeurs nutritionnelles (tableau complet pour 100g et par portion)
- Origine / provenance
- Fabricant / conditionneur
- Labels (bio, etc.)
- Conseils de conservation et d'utilisation

**Approche anti-bot** :
1. Utiliser Playwright avec `playwright-extra` + `puppeteer-extra-plugin-stealth`
2. Rotation User-Agent réaliste
3. Délais aléatoires entre requêtes (3-8 secondes)
4. Résoudre les challenges Cloudflare (attendre le JS challenge)
5. Si bloqué après N essais → skip et marquer le produit

**Parsing** : Le HTML de carrefour.fr contient souvent un blob JSON-LD `<script type="application/ld+json">` avec les données structurées du produit.

### Source 3 : E.Leclerc (e.leclerc) — Playwright requis

**⚠ Protégé par DataDome + CAPTCHA.**

```
URL pattern : https://www.e.leclerc/fp/{slug}
Recherche :   https://www.e.leclerc/recherche?q={EAN}
```

**Données disponibles** (similaires à Carrefour) :
- Description, ingrédients, nutrition, allergènes, origine

**Images haute qualité** via Scene7 CDN (25% hit rate) :
```
https://media.e.leclerc/scene7/{EAN}_PACK?fmt=webp&wid=800
```

### Source 4 : Carrefour VTEX Argentine/Brésil (OUVERT, sans auth)

**API REST publique — pas de WAF.**

```bash
# Recherche par EAN
curl "https://www.carrefour.com.ar/api/catalog_system/pub/products/search?fq=alternateIds_RefId:{EAN}&_from=0&_to=0"

# Recherche par nom
curl "https://www.carrefour.com.ar/api/catalog_system/pub/products/search/{query}?_from=0&_to=9"
```

**Données exploitables** :
- `País de origen` → `origins_tags`
- `Proveedor Razón Social` → `brand_owner`
- `EC_Sector/Grupo/Familia/Subfamilia` → taxonomie Carrefour pro
- `Saludable` → flag santé
- `Tipo de producto` → `generic_name`
- Images produit HD

**Limitation** : Catalogue argentin/brésilien. Cross-reference EAN limité aux marques internationales (Nutella, Bonduelle, Lindt...). ~125 EAN français matchent sur 817K.

### Source 5 : Open Prices API (bonus — prix)

```bash
curl "https://prices.openfoodfacts.org/api/v1/prices?product_code={EAN}&size=5"
```

Donne les prix constatés en magasin (crowdsourced). Utile pour enrichir le champ `price`.

---

## ALGORITHME D'ENRICHISSEMENT

### Phase 1 : OFF API V2 (le gros du volume)

```
POUR chaque produit WHERE (
  ingredients_text IS NULL
  OR energy_kcal_100g IS NULL
  OR allergens_tags IS NULL
  OR brand_owner IS NULL
  OR generic_name IS NULL
  OR fiber_100g IS NULL
  OR origins_tags IS NULL
  OR serving_size IS NULL
) :
  1. GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json
  2. Si status=1, extraire les champs manquants
  3. UPDATE products SET {field} = {value} WHERE barcode = {barcode}
     ⚠ RULE: SET field = COALESCE(field, new_value)  — NE JAMAIS écraser un champ non-null
  4. SET data_sources = array_append(data_sources, 'off_api_v2')
  5. SET last_synced_at = NOW()
  6. Respecter 100 req/min (sleep 600ms entre chaque)
  7. Log: barcode, champs enrichis, champs toujours null
```

**Batch size** : 1000 produits par run. Commencer par les produits avec `completeness` la plus haute (plus de chances d'avoir des données OFF).

### Phase 2 : Web Scraping (Carrefour/Leclerc — champs encore null après OFF)

```
POUR chaque produit WHERE (
  description IS NULL
  OR ingredients_text IS NULL
  OR energy_kcal_100g IS NULL
) AND last_synced_at > NOW() - INTERVAL '1 hour'  -- déjà passé par OFF
:
  1. Essayer Carrefour.fr : rechercher par EAN, parser la fiche
  2. Si 403/bloqué → essayer E.Leclerc
  3. Si données trouvées, UPDATE avec COALESCE
  4. SET data_sources = array_append(data_sources, 'carrefour_web' ou 'leclerc_web')
  5. Délais 3-8s aléatoires, rotation User-Agent
  6. Si bloqué 3× consécutives → pause 5 min puis reprendre
```

### Phase 3 : VTEX Cross-Reference (marques internationales)

```
POUR chaque produit WHERE brand IN (
  'Nutella','Bonduelle','Paysan Breton','Bonne Maman','Lindt',
  'Milka','Ferrero','Nescafe','Haagen Dazs','Danone',
  -- et autres marques internationales
) AND (origins_tags IS NULL OR brand_owner IS NULL) :
  1. GET Carrefour AR VTEX par EAN
  2. Extraire: País de origen → origins_tags, Proveedor → brand_owner
  3. UPDATE avec COALESCE
```

---

## RÈGLES ABSOLUES

1. **JAMAIS écraser un champ non-null avec null** : utiliser `COALESCE(existing, new_value)` ou `WHERE field IS NULL`
2. **JAMAIS dépasser les rate limits** : OFF = 100/min, Carrefour/Leclerc = 1 req / 5 sec
3. **Toujours logger** : barcode, source, champs enrichis, erreurs
4. **Transactions** : UPDATE un produit à la fois (pas de batch UPDATE risqué)
5. **Idempotent** : le script peut être relancé N fois sans effet de bord
6. **Checkpoint** : sauvegarder le dernier barcode traité pour reprendre en cas de crash
7. **Validation** : vérifier que les données scrapées sont cohérentes (energy > 0, ingredients non vide, etc.)
8. **User-Agent** : `Naqiy/1.0 (contact@naqiy.app)` pour OFF, User-Agent Chrome réaliste pour Carrefour/Leclerc
9. **data_sources tracking** : toujours ajouter la source dans le array `data_sources` pour traçabilité
10. **Métriques finales** : après chaque phase, afficher un tableau avant/après de la couverture par champ

---

## STACK TECHNIQUE RECOMMANDÉ

- **Langage** : TypeScript (cohérent avec le backend existant) ou Python (si Playwright stealth mieux supporté)
- **DB driver** : `pg` (Node) ou `psycopg2`/`asyncpg` (Python)
- **HTTP** : `fetch` ou `axios` pour les APIs ouvertes
- **Scraping** : Playwright + stealth plugin pour Carrefour/Leclerc
- **Scripts** : dans `backend/src/db/seeds/` ou `backend/scripts/enrich/`

---

## LIVRABLES ATTENDUS

1. **Script Phase 1** : `enrich-from-off-api.ts` — enrichissement OFF API V2 (le plus gros ROI)
2. **Script Phase 2** : `enrich-from-web.ts` — scraping Carrefour/Leclerc avec Playwright
3. **Script Phase 3** : `enrich-from-vtex.ts` — cross-ref VTEX Argentine
4. **Rapport de couverture** : tableau avant/après par champ
5. **Log structuré** : JSON lines avec barcode, source, champs enrichis, erreurs

---

## COMMENCER PAR

1. Connecte-toi à la base Docker et vérifie la couverture actuelle
2. Fais un test sur 10 produits avec l'API OFF V2 pour valider le mapping
3. Scale à 1000 produits
4. Mesure l'amélioration
5. Passe à la Phase 2 (web scraping) uniquement pour les champs encore null

**L'objectif : passer de 4.8% à >80% sur les données nutritionnelles, et de 44% à >75% sur les ingrédients.**
