# 15 — Open Data Sourcing Strategy — Analyse Complète

> Naqiy Tier-1 Data Intelligence Blueprint
> Date: 2026-03-05 | Auteur: Claude CTO — Data Scientist / Data Engineer

---

## 1. Executive Summary

Naqiy dispose d'un écosystème de données publiques **exceptionnellement riche** pour une app halal Tier-1 en France. L'analyse couvre **18 sources de données** exploitables, dont **5 prioritaires** qui transforment radicalement la proposition de valeur.

### La découverte majeure : RappelConso V2 + GTIN

Depuis **novembre 2024**, l'API RappelConso V2 inclut les **codes-barres GTIN (EAN-13)** dans ses données. Cela signifie qu'à chaque scan de produit dans Naqiy, on peut instantanément vérifier si le produit fait l'objet d'un **rappel de sécurité alimentaire** par le gouvernement français.

**Impact** : Naqiy devient la seule app halal qui protège aussi la **sécurité physique** du consommateur — pas seulement la conformité religieuse.

```
┌─────────────────────────────────────────────────────────────┐
│                    NAQIY DATA ECOSYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🔴 TEMPS RÉEL (on scan)                                     │
│  ├─ OpenFoodFacts API     │ Ingrédients, additifs, labels    │
│  └─ RappelConso V2 API   │ Alertes rappel par code-barres   │
│                                                               │
│  🟠 QUOTIDIEN (cron 4h CET)                                 │
│  └─ RappelConso sync     │ Cache local rappels actifs        │
│                                                               │
│  🟡 HEBDOMADAIRE                                             │
│  ├─ RASFF CSV import     │ Alertes sécurité EU-wide          │
│  └─ BDS + boycott sync   │ Données éthiques (existant)       │
│                                                               │
│  🟢 RÉFÉRENCE STATIQUE                                       │
│  ├─ E-Numbers halal DB   │ Halal/Haram/Mushbooh par madhab   │
│  ├─ CIQUAL nutrition     │ Composition nutritionnelle FR      │
│  ├─ EU Additive Registry │ Fonctions et limites additifs     │
│  └─ SIRENE entreprises   │ Vérification certifieurs halal    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Source #1 — RappelConso V2 API (GTIN) ⭐⭐⭐

### Fiche technique

| Propriété | Valeur |
|-----------|--------|
| **Éditeur** | DGCCRF (Ministère de l'Économie) |
| **URL API** | `data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso-v2-gtin-espaces` |
| **Licence** | Licence Ouverte v2.0 (Etalab) — usage commercial autorisé |
| **Authentification** | Aucune (accès anonyme) |
| **Rate limit** | 20 000 requêtes/jour |
| **Format** | JSON (UTF-8) |
| **Mise à jour** | Continue (quasi temps réel) |
| **Données depuis** | Mars 2021 |
| **GTIN (codes-barres)** | Depuis novembre 2024, 95%+ de couverture |

### Volume de données

| Métrique | Valeur |
|----------|--------|
| Total rappels (toutes catégories) | 16 788 |
| **Rappels alimentaires** | **12 442** (74,1%) |
| Rappels actifs (date fin ≥ aujourd'hui) | ~254 |
| Nouveaux rappels alimentaires/jour | 6–8 |
| Nouveaux rappels alimentaires/semaine | 40–50 |

### Top sous-catégories alimentaires

| Sous-catégorie | Nombre | Pertinence halal |
|----------------|--------|-----------------|
| Lait et produits laitiers | 3 066 | Moyenne (gélatine, présure) |
| **Viandes** | **2 804** | **Critique** (abattage, contamination) |
| Produits de la pêche | 975 | Haute |
| Plats préparés et snacks | 810 | Haute (composition opaque) |
| Céréales et boulangerie | 763 | Moyenne (alcool, additifs) |
| Aliments diététiques | 730 | Moyenne |
| Produits sucrés | 583 | Moyenne (gélatine) |
| Fruits et légumes | 434 | Basse |

### Top risques (alertes critiques pour nos utilisateurs)

| Risque | Nombre | Impact Naqiy |
|--------|--------|-------------|
| Listeria monocytogenes | 2 973 | Sécurité alimentaire |
| Contaminants chimiques | 1 898 | Sécurité |
| Dépassement pesticides | 1 415 | Santé |
| Salmonella | 1 071 | Sécurité |
| **Allergènes non déclarés** | **568** | **Critique — transparence** |
| **Anomalie d'étiquetage** | **365** | **Critique — confiance** |
| Corps étrangers (verre, métal) | 622 | Sécurité |

### Champ GTIN — Structure du code-barres

Le champ `identification_produits` est un tableau de 5 éléments :

```json
"identification_produits": [
    "3327780013660",                    // [0] GTIN (EAN-13) — LE CODE-BARRES
    "tous les lots",                    // [1] Numéro de lot
    "date limite de consommation",      // [2] Type de date
    "2026-02-17",                       // [3] Date début
    "2026-03-31"                        // [4] Date fin
]
```

### Requêtes API clés pour Naqiy

#### Lookup par code-barres (cas d'usage principal)

```
GET /records
  ?where=identification_produits like '{GTIN}' AND categorie_produit='alimentation'
  &order_by=date_publication desc
  &select=id,libelle,marque_produit,identification_produits,risques_encourus,
          motif_rappel,liens_vers_les_images,date_publication,
          conduites_a_tenir_par_le_consommateur,lien_vers_la_fiche_rappel,
          date_de_fin_de_la_procedure_de_rappel,sous_categorie_produit
  &limit=10
```

#### Rappels récents (sync cron — 7 derniers jours)

```
GET /records
  ?where=categorie_produit='alimentation' AND date_publication >= now(days=-7)
  &order_by=date_publication desc
  &limit=100
```

#### Export complet (seed initial — 12 442 records)

```
GET /exports/json
  ?where=categorie_produit='alimentation'
```

### Architecture d'intégration recommandée

```
┌─────────────────────────────────────────────────────────┐
│                    SCAN FLOW                              │
│                                                           │
│  User scan barcode ──→ Naqiy Backend                     │
│                           │                               │
│                    ┌──────┴──────┐                        │
│                    │             │                        │
│               PostgreSQL    RappelConso API               │
│               cache local   (fallback si                  │
│               (rappels      pas en cache)                 │
│                actifs)                                    │
│                    │             │                        │
│                    └──────┬──────┘                        │
│                           │                               │
│                    Résultat au user :                     │
│                    ⚠️ "Ce produit fait l'objet            │
│                       d'un rappel de sécurité"           │
│                    + motif + risques + actions            │
│                                                           │
│  CRON (toutes les 6h) ──→ Sync rappels actifs            │
│                             ~254 records                  │
│                             → upsert PostgreSQL           │
│                             → invalidate Redis            │
└─────────────────────────────────────────────────────────┘
```

### Schéma DB proposé (Drizzle)

```typescript
export const rappelConso = pgTable("rappel_conso", {
  id:               integer("id").primaryKey(),
  rappelGuid:       text("rappel_guid").unique().notNull(),
  gtin:             text("gtin"),
  lotNumber:        text("lot_number"),
  libelle:          text("libelle").notNull(),
  marqueProduit:    text("marque_produit"),
  sousCategorie:    text("sous_categorie"),
  motifRappel:      text("motif_rappel"),
  risquesEncourus:  text("risques_encourus"),
  conduites:        text("conduites"),
  imageUrls:        text("image_urls").array(),
  ficheUrl:         text("fiche_url"),
  datePublication:  timestamp("date_publication", { withTimezone: true }).notNull(),
  dateFinRappel:    date("date_fin_rappel"),
  zoneVente:        text("zone_vente"),
  distributeurs:    text("distributeurs"),
  createdAt:        timestamp("created_at").defaultNow(),
  updatedAt:        timestamp("updated_at").defaultNow(),
}, (table) => [
  t.index("idx_rappel_conso_gtin").on(table.gtin),
  t.index("idx_rappel_conso_date").on(table.datePublication),
]);
```

### Coût estimé

| Poste | Coût |
|-------|------|
| API RappelConso | **Gratuit** |
| Stockage PostgreSQL (~254 rappels actifs) | Négligeable |
| CRON sync (GitHub Actions, 4×/jour) | Gratuit |
| **Total** | **0 €/mois** |

---

## 3. Source #2 — RASFF (Rapid Alert System for Food and Feed) ⭐⭐

### Fiche technique

| Propriété | Valeur |
|-----------|--------|
| **Éditeur** | Commission Européenne (DG SANTE) |
| **Portail** | `webgate.ec.europa.eu/rasff-window/screen/search` |
| **Dashboard WFSR** | `kb.wfsr.containers.wur.nl/s/rasff_dashboard` (CSV export) |
| **Couverture** | 32 pays EEE |
| **Données depuis** | Juin 2014 (WFSR) |
| **Authentification** | WFSR : compte gratuit requis |
| **Format** | CSV export, pas d'API REST officielle |

### Pertinence Naqiy : 7/10

Alertes pan-européennes sur contamination, substances non autorisées, résidus de pesticides, allergènes non déclarés. Complémentaire à RappelConso (qui est France uniquement).

### Stratégie d'intégration

Import CSV périodique (hebdomadaire) des alertes RASFF → filtrage par pays (France) et catégorie (food) → stockage local → alertes par catégorie de produit (pas par code-barres).

**Complexité** : Moyenne — pas d'API REST, nécessite parsing CSV.

---

## 4. Source #3 — Open Food Facts (EXISTANT — Optimisation) ⭐⭐⭐

### Champs sous-exploités actuellement

Notre intégration actuelle récupère les ingrédients et le Nutri-Score. Voici les champs additionnels à haute valeur :

| Champ | Description | Usage Naqiy |
|-------|-------------|------------|
| `additives_tags` | Liste E-numbers détectés (`["en:e322","en:e471"]`) | **Cross-ref avec table halal E-numbers** |
| `ingredients_analysis_tags` | Tags calculés (`vegan`, `palm-oil-free`) | Enrichir le Health Score |
| `labels_tags` | Labels certifiés (`["en:halal","en:organic"]`) | **Détection auto label halal** |
| `nova_group` | Niveau ultra-transformation (1-4) | Health Score Naqiy |
| `allergens_tags` | Allergènes déclarés | Sécurité alimentaire |
| `categories_tags` | Taxonomie produit | Classification |

### Rate limits actuels

| Endpoint | Limite |
|----------|--------|
| Product by barcode | 100 req/min |
| Search | 10 req/min |
| Facets | 2 req/min |

### Bulk download pour enrichissement offline

| Format | URL | Usage |
|--------|-----|-------|
| JSONL | `static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz` | Sync complète |
| CSV | `static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz` | Analytics |
| Parquet | `huggingface.co/datasets/openfoodfacts/product-database` | Data science |

**Politique** : "1 API call = 1 vrai scan utilisateur" — le scraping est bloqué. Le bulk download est autorisé.

---

## 5. Source #4 — Tables de référence E-Numbers Halal ⭐⭐⭐

### Sources de données

| Source | Format | Couverture | Fiabilité |
|--------|--------|-----------|-----------|
| **Kaggle — Food Ingredients Halal Label** | CSV | ~400 additifs | Haute (LPPOM MUI) |
| **E-Code Halal Check (MUIS Singapour)** | Web | Complet E-numbers | Haute |
| **LODHalal (académique)** | RDF/CSV | OFF + MUI | Haute |
| **Seeds existants Naqiy** | DB | 47 ingrédients × 4 madhabs | Très haute (sources savantes) |

### Additifs critiques halal (déjà dans nos seeds, à enrichir)

| E-Number | Substance | Statut | Raison |
|----------|-----------|--------|--------|
| E120 | Carmine (cochenille) | **Haram** | Dérivé d'insecte |
| E441 | Gélatine | **Haram** | Souvent porc |
| E904 | Shellac (gomme laque) | **Haram** | Dérivé d'insecte |
| E542 | Phosphate d'os | **Haram** | Si porc |
| E471 | Mono/diglycérides | **Mushbooh** | Source variable (animal/végétal) |
| E322 | Lécithine | **Mushbooh** | Généralement soja (halal) |
| E422 | Glycérine | **Mushbooh** | Source variable |
| E470–E483 | Émulsifiants | **Mushbooh** | Source variable |

### Stratégie

Merger les données Kaggle + E-Code + nos rulings savants existants → table de référence unifiée avec statut par madhab (Hanafi, Maliki, Shafi'i, Hanbali).

**Notre avantage compétitif** : Aucune app existante ne croise E-numbers × madhab × sources savantes.

---

## 6. Source #5 — CIQUAL (ANSES) — Composition nutritionnelle ⭐

### Fiche technique

| Propriété | Valeur |
|-----------|--------|
| **Éditeur** | ANSES |
| **URL** | `ciqual.anses.fr` |
| **Version** | 2025 (dernière) |
| **Données** | 3 484 aliments × 74 nutriments |
| **Format** | XLS/XLSX, API communautaire JSON |
| **Licence** | Open data |

### Pertinence Naqiy : 4/10

Enrichissement du Naqiy Health Score avec données nutritionnelles de référence françaises. Pas directement lié au halal mais contribue à la proposition de valeur "santé globale".

---

## 7. Source #6 — SIRENE (INSEE) — Base entreprises ⭐

### Usage Naqiy

Vérification des organismes certificateurs halal enregistrés en France. Cross-référence SIRET → existence légale + secteur d'activité.

| Propriété | Valeur |
|-----------|--------|
| **API** | `api.insee.fr/entreprises/sirene/V3.11` |
| **Auth** | Token INSEE (gratuit) |
| **Format** | JSON |
| **Couverture** | Toutes entreprises françaises |

### Cas d'usage

Quand on affiche un certifieur (AVS, Achahada, etc.) → vérifier via SIRENE que l'organisme est toujours actif et enregistré.

---

## 8. Source #7 — EU Food Additive Database ⭐⭐

### Fiche technique

| Propriété | Valeur |
|-----------|--------|
| **Éditeur** | Commission Européenne |
| **URL** | `food.ec.europa.eu/food-safety/food-improvement-agents/additives/database_en` |
| **Réglementation** | Règlement (CE) n° 1333/2008 |
| **Format** | Web uniquement (pas d'API) |
| **Couverture** | Tous additifs autorisés UE |

### Pertinence Naqiy : 8/10

Liste officielle de tous les additifs autorisés dans l'UE avec leurs fonctions (émulsifiant, colorant, conservateur) et conditions d'utilisation. Essentiel pour déterminer la fonction d'un E-number détecté dans un scan.

**Intégration** : Curation manuelle ou scraping → table locale de référence.

---

## 9. Source #8 — EFSA OpenFoodTox ⭐

Base toxicologique : 5 000+ substances chimiques avec valeurs de référence (ADI, NOAEL). Downloadable sur Zenodo.

**Usage** : Enrichir les fiches additifs avec "cet additif a été réévalué par l'EFSA en [année]" → renforce la crédibilité scientifique de Naqiy.

---

## 10. Matrice d'intégration — Priorisation

### Phase 1 — Sprint immédiat (P0/P1)

| Source | Action | Effort | Impact | ROI |
|--------|--------|--------|--------|-----|
| **RappelConso V2** | Intégrer lookup par GTIN + cron sync | 2-3 jours | **Très haut** — sécurité alimentaire | ⭐⭐⭐⭐⭐ |
| **Open Food Facts** | Consommer `additives_tags`, `labels_tags` | 1 jour | **Haut** — détection auto label halal | ⭐⭐⭐⭐ |

### Phase 2 — Court terme (2-4 semaines)

| Source | Action | Effort | Impact | ROI |
|--------|--------|--------|--------|-----|
| **E-Numbers halal** | Merger Kaggle + seeds existants | 2-3 jours | **Haut** — cross-ref additifs × madhab | ⭐⭐⭐⭐ |
| **EU Additive DB** | Curation table fonctions additifs | 3-5 jours | Moyen | ⭐⭐⭐ |

### Phase 3 — Moyen terme (1-2 mois)

| Source | Action | Effort | Impact | ROI |
|--------|--------|--------|--------|-----|
| **RASFF** | Import CSV hebdo + alertes catégorie | 3-5 jours | Moyen — pan-européen | ⭐⭐⭐ |
| **SIRENE** | Vérification certifieurs | 1-2 jours | Bas | ⭐⭐ |

### Phase 4 — Long terme

| Source | Action | Effort | Impact | ROI |
|--------|--------|--------|--------|-----|
| **CIQUAL** | Enrichissement Health Score | 2-3 jours | Bas | ⭐⭐ |
| **EFSA OpenFoodTox** | Fiches toxicologiques additifs | 3-5 jours | Bas | ⭐ |
| **Codex Alimentarius** | Standards internationaux | 5+ jours | Bas (expansion) | ⭐ |

---

## 11. Architecture cible — Data Pipeline complet

```
┌─────────────────────────────────────────────────────────────────────┐
│                     NAQIY DATA PIPELINE V2                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────────────┐  │
│  │ User scans  │──→│ Naqiy Backend │──→│ PostgreSQL               │  │
│  │ barcode     │   │              │   │  ├─ products (OFF cache) │  │
│  └─────────────┘   │  Enrichment  │   │  ├─ rappel_conso        │  │
│                     │  Pipeline    │   │  ├─ rasff_alerts        │  │
│                     │              │   │  ├─ e_number_halal_ref  │  │
│                     │  1. OFF API  │   │  ├─ additive_functions  │  │
│                     │  2. Cache    │   │  └─ boycott_targets     │  │
│                     │     rappels  │   └──────────────────────────┘  │
│                     │  3. Halal    │                                  │
│                     │     E-nums   │   ┌──────────────────────────┐  │
│                     │  4. Boycott  │   │ Redis                    │  │
│                     │     check    │   │  ├─ rappel:{gtin} (24h) │  │
│                     └──────────────┘   │  ├─ off:{barcode} (1h)  │  │
│                                        │  └─ boycott:* (1h)      │  │
│                                        └──────────────────────────┘  │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    CRON JOBS (GitHub Actions)                    │ │
│  ├─────────────────────────────────────────────────────────────────┤ │
│  │ Toutes les 6h  │ sync-rappelconso   │ ~254 rappels actifs     │ │
│  │ Lun 03:00      │ refresh-stores     │ AVS + Achahada (exist.) │ │
│  │ Mar 03:00      │ refresh-boycott    │ BDS scraping            │ │
│  │ Mer 03:00      │ ingest-alkanz      │ RSS alertes communauté  │ │
│  │ Quotidien 02:00│ refresh-places     │ Google Places enrichm.  │ │
│  │ Hebdo          │ sync-rasff         │ CSV import EU alertes   │ │
│  │ 1er/mois       │ refresh-certifiers │ Trust scores            │ │
│  │ 15/mois        │ cleanup-stale      │ Purge données obsolètes │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    SCAN RESULT ENRICHMENT                       │ │
│  ├─────────────────────────────────────────────────────────────────┤ │
│  │                                                                   │ │
│  │  Barcode scan ──→ OFF API (ingrédients, additifs, labels)       │ │
│  │       │                                                           │ │
│  │       ├──→ Halal Analysis (madhab × ingrédient × ruling)        │ │
│  │       │     └─ E-numbers cross-ref (e_number_halal_ref)         │ │
│  │       │                                                           │ │
│  │       ├──→ Safety Check (rappel_conso + rasff_alerts)           │ │
│  │       │     └─ ⚠️ "Produit rappelé" banner si match            │ │
│  │       │                                                           │ │
│  │       ├──→ Ethics Check (boycott_targets)                        │ │
│  │       │     └─ 🚫 "Marque boycottée BDS" si match              │ │
│  │       │                                                           │ │
│  │       └──→ Health Score (NOVA, Nutri-Score, CIQUAL)             │ │
│  │             └─ Score composite Naqiy Health                      │ │
│  │                                                                   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 12. Coûts d'exploitation

| Source | Coût API | Coût infra | Total/mois |
|--------|----------|-----------|-----------|
| RappelConso | Gratuit | ~0 € (254 records) | **0 €** |
| Open Food Facts | Gratuit | Déjà intégré | **0 €** |
| RASFF CSV | Gratuit | ~0 € | **0 €** |
| E-Numbers reference | Gratuit (Kaggle) | ~0 € | **0 €** |
| CIQUAL | Gratuit | ~0 € | **0 €** |
| SIRENE | Gratuit (quota) | ~0 € | **0 €** |
| EU Additive DB | Gratuit | Curation manuelle | **0 €** |
| Google Places | ~$2/mois | Existant | **~2 €** |
| **TOTAL** | | | **~2 €/mois** |

**Verdict** : L'intégralité du data pipeline Tier-1 coûte moins de 2 €/mois. L'open data français et européen est un avantage compétitif massif pour une app basée en France.

---

## 13. Benchmarks concurrents

| App | RappelConso | RASFF | E-Numbers halal | OFF enrichi | Score |
|-----|-------------|-------|-----------------|-------------|-------|
| **Yuka** | ✅ Intégré | ❌ | ❌ | ✅ Partiel | 3/5 |
| **Halal Check** | ❌ | ❌ | ✅ Basique | ✅ Basique | 2/5 |
| **Scan Halal** | ❌ | ❌ | ✅ Basique | ✅ | 2/5 |
| **Too Good To Go** | ❌ | ❌ | ❌ | ❌ | 0/5 |
| **Naqiy (cible)** | ✅ GTIN match | ✅ Catégorie | ✅ × 4 madhabs | ✅ Complet | **5/5** |

**Naqiy serait la première app à combiner** :
1. Conformité halal par madhab (existant)
2. Alertes de rappel gouvernementales par code-barres (RappelConso)
3. Alertes de sécurité européennes (RASFF)
4. Vérification éthique (boycott BDS)
5. Score santé composite (NOVA + Nutri-Score + additifs)

---

## 14. Recommandations d'implémentation

### Sprint immédiat — RappelConso V2

1. **Migration DB** : Créer table `rappel_conso` (schéma Drizzle ci-dessus)
2. **Seed initial** : Import des 12 442 rappels alimentaires via `/exports/json`
3. **CRON** : `sync-rappelconso` toutes les 6h (rappels derniers 7 jours)
4. **tRPC router** : `rappelConso.checkBarcode({ gtin })` — lookup cache + fallback API
5. **UI scan-result** : Bandeau d'alerte rouge si rappel actif détecté
6. **Notifications push** : Si un produit scanné dans l'historique fait l'objet d'un nouveau rappel

### Points d'attention techniques

- **Parsing GTIN** : Extraire `identification_produits[0]`, filtrer les valeurs vides et `"0000000000000"`
- **Images** : `liens_vers_les_images` utilise `|` comme séparateur → split en array
- **Risques** : `risques_encourus` utilise `|` comme séparateur → split en array
- **Catégorie** : La valeur du filtre est en minuscules : `categorie_produit='alimentation'` (pas "Alimentation")
- **Pagination** : Max 10 000 records via `/records`, utiliser `/exports/json` pour le seed complet
- **Cache Redis** : `rappel:{gtin}` TTL 24h pour éviter les requêtes API répétitives

---

## 15. API data.gouv.fr MCP Server

Un serveur MCP officiel est disponible pour explorer les datasets data.gouv.fr :

```bash
claude mcp add --transport http datagouv https://mcp.data.gouv.fr/mcp
```

Ce MCP permet de :
- Chercher des datasets par mots-clés
- Lire les métadonnées et schémas
- Explorer les ressources disponibles

**Note** : Utile pour la recherche, mais l'intégration production utilisera les APIs REST directement.

---

## 16. Conclusion

L'écosystème open data français et européen offre à Naqiy un avantage compétitif **unique et gratuit** :

1. **RappelConso V2** est la pièce maîtresse — lookup par code-barres, temps réel, gratuit, fiable
2. **Open Food Facts enrichi** (additives_tags, labels_tags) renforce l'analyse halal
3. **RASFF** ajoute une couverture pan-européenne
4. **E-Numbers × madhab** est notre différenciateur — aucune app ne fait ce croisement
5. **SIRENE** valide la légitimité des certifieurs

**Coût total : ~2 €/mois** pour un data pipeline Tier-1 complet.

**Prochaine étape recommandée** : Implémenter l'intégration RappelConso V2 (3 jours de dev) — c'est le meilleur ratio impact/effort de toutes les sources identifiées.
