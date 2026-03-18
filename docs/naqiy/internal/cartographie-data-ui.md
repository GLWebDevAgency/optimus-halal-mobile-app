# Cartographie Data → UI — Naqiy

> Audit architectural : correspondance entre chaque source de donnees et son affichage frontend.
> Date : 2026-03-09 | Version : 1.0

---

## 1. ECRAN SCAN RESULT — Le coeur de Naqiy

**Route** : `/scan-result?barcode=<barcode>`
**Procedure** : `scan.scanBarcode` (mutation, quotaChecked)
**Complexite** : 12 etapes, 5 Promise.all, 817K produits DB-first

### 1.1 Hero (50% viewport) — Verdict instantane

| Champ UI | Source Backend | Table/Service | Type | Couverture |
|---|---|---|---|---|
| Icone statut (check/danger/help) | `halalAnalysis.status` | Compute runtime | halal/haram/doubtful/unknown | 100% |
| Couleur verdict (vert/rouge/orange/gris) | `halalAnalysis.status` | Compute runtime | Mapping couleur hardcode front | 100% |
| Texte verdict ("Halal", "Haram"...) | `halalAnalysis.status` | Compute runtime + i18n | `scan.verdict.*` | 100% |
| Trust ring (% confiance) | `halalAnalysis.confidence` | Compute runtime (0-100) | number | 100% |
| Nom produit | `product.name` | `products.name` | varchar 255 | 99.8% (OFF) |
| Marque | `product.brand` | `products.brand` | varchar 255 | ~85% (OFF) |
| Code-barres | `input.barcode` | Input utilisateur | string 4-14 | 100% |
| Image produit | `product.imageUrl` | `products.image_url` | URL | 93.8% (OFF) |
| Badge "Nouveau" | `isNewProduct` | `lookupResult.source === "off_new"` | boolean | 100% |

### 1.2 Carte Certifieur (glass-morphism)

| Champ UI | Source Backend | Table/Service | Type | Couverture |
|---|---|---|---|---|
| Logo certifieur | `certifierData.id` | Hardcode front (assets locaux) | Image locale | 18/18 certifieurs |
| Nom certifieur | `certifierData.name` | `certifiers.name` | varchar | 18/18 |
| Trust Score badge | `certifierData.trustScore` | `certifier-score.service.ts` (runtime) | 0-100 | 18/18 |
| Score par madhab | `certifierData.trustScore[Madhab]` | 4 colonnes computees | 0-100 x4 | 18/18 |
| Tick "verifie" | `certifierData.lastVerifiedAt` | `certifiers.last_verified_at` | Date | 18/18 |
| Site web | `certifierData.website` | `certifiers.website` | URL | 16/18 |
| Detail 4 blocs | `certifierData.detail.blocks` | `computeTrustScoreDetail()` | 4 x 0-100 | 18/18 |
| Niveau de preuve | `certifierData.detail.evidenceLevel` | `certifiers.evidence_level` | enum 4 | 18/18 |
| 11 pratiques | `certifierData.practices.*` | `certifiers.*` (11 booleens) | bool/null | 18/18 |

**Gap identifie** : Le `certifierData.halalAssessment` (boolean) est renvoye mais jamais affiche sur le front.

### 1.3 Onglet Ingredients

| Champ UI | Source Backend | Table/Service | Type | Couverture |
|---|---|---|---|---|
| Liste ingredients | `product.ingredients` | `products.ingredients` (array) | string[] | 44.2% (OFF) |
| AI extraction | `aiEnrichment` | `ai-extract/` (Gemini/GPT/Claude) | ExtractionResult | ~44% |
| Additifs problematiques | `halalAnalysis.reasons[type=additive]` | `additives` (560 rows) | code+nom+status | 100% des detectes |
| Statut par additif | `halalAnalysis.reasons[].status` | `additives.halal_status_default` + `isVegetarian` override | enum | 560/560 |
| Rulings ingredients | `ingredientRulings[]` | `ingredient_rulings` (47 rows) | pattern+ruling | 47 patterns |
| Verdicts madhab | `madhabVerdicts[]` | `additive_madhab_rulings` + compute | 4 ecoles x worst | ~150 rulings |
| Conflits par ecole | `madhabVerdicts[].conflictingAdditives` | JOIN madhab_rulings+additives | code+ruling+ref | 150+ |
| References savantes | `madhabVerdicts[].scholarlyReference` | `scholarly_citations` | texte | ~80% des rulings |

**Gap identifie** :
- `ingredientRulings[].scholarlyReference` existe en API mais le front ne l'affiche pas (le bottom sheet madhab le fait, mais pas l'onglet ingredients)
- `halalAnalysis.analysisSource` (ex: "Naqiy . Certifieur identifie via marque connue") — texte explicatif non affiche
- Les flags `isVegetarian`/`isVegan` des additifs (V2 BoycottX) ne sont pas encore affiches individuellement

### 1.4 Onglet Nutrition

| Champ UI | Source Backend | Table/Service | Type | Couverture |
|---|---|---|---|---|
| Nutri-Score (A-E) | `offExtras.nutriscoreGrade` | `products.nutriscore_grade` (OFF) | a-e | 99.8% |
| NOVA Group (1-4) | `offExtras.novaGroup` | `products.nova_group` (OFF) | 1-4 | ~80% |
| Eco-Score (A-E) | `offExtras.ecoscoreGrade` | `products.ecoscore_grade` (OFF) | a-e | ~60% |
| Health Score Naqiy | `healthScore.score` | `health-score.service.ts` (V2) | 0-100 | 100% (compute) |
| Label score ("excellent"...) | `healthScore.label` | Compute runtime | 5 niveaux | 100% |
| Confiance donnees | `healthScore.dataConfidence` | Compute runtime | high/medium/low/insufficient | 100% |
| 5 axes radar | `healthScore.axes.*` | Compute (nutrition/processing/additives/profile/origins) | 5 x score | 100% |
| Anomalies nutriments | `healthScore.nutrientAnomalies` | Compute vs OFF nutriscore_data | array | ~2% produits |
| Cap additif | `healthScore.cappedByAdditive` | Compute (E950, E951...) | boolean | 100% |
| Allergenes | `offExtras.allergensTags` | `products.allergens_tags` (OFF) | string[] | 18.8% |
| Traces | `offExtras.tracesTags` | `products.traces_tags` (OFF) | string[] | ~15% |
| Labels | `offExtras.labelsTags` | `products.labels_tags` (OFF) | string[] | 49.7% |
| Origines | `offExtras.origins` | `products.origins_tags` (OFF) | string | ~30% |
| Lieux fabrication | `offExtras.manufacturingPlaces` | `products.manufacturing_places` (OFF) | string | ~25% |
| AI NOVA estimate | `aiEnrichment.novaEstimate` | AI extraction | 1-4 | ~20% |
| AI alcool detecte | `aiEnrichment.containsAlcohol` | AI extraction | boolean | ~20% |
| AI bio detecte | `aiEnrichment.isOrganic` | AI extraction | boolean | ~20% |
| AI allergenes hints | `aiEnrichment.allergenHints` | AI extraction | string[] | ~20% |
| Tags analyse ingredients | `offExtras.ingredientsAnalysisTags` | OFF | string[] | ~40% |

**Gap identifie** :
- Les 8 macronutriments detailles (`energyKcal100g`, `fat100g`, `saturatedFat100g`, `carbohydrates100g`, `sugars100g`, `fiber100g`, `proteins100g`, `salt100g`) sont en DB mais PAS dans la reponse `scanBarcode` ni affiches. **Opportunite** : afficher un tableau nutritionnel complet.
- `products.serving_size` et `products.quantity` en DB mais pas renvoyes ni affiches.
- `nutriscore.service.ts` existe mais n'est pas utilise (le Health Score V2 le remplace).

### 1.5 Onglet Certifications / Alertes

| Champ UI | Source Backend | Table/Service | Type | Couverture |
|---|---|---|---|---|
| Boycott actif | `boycott.isBoycotted` | `boycott_targets` (120+ rows) | boolean | 100% |
| Cibles boycott | `boycott.targets[]` | `boycott_targets` | companyName+level+reason | 120+ |
| Alertes perso (allergenes) | `personalAlerts[type=allergen]` | `allergen.service.ts` x profil user | severity+title+desc | Si profil configure |
| Alertes perso (sante) | `personalAlerts[type=health]` | `additives.risk_pregnant/children` x profil | severity+title+desc | 560 additifs verifies |
| Community verified count | `communityVerifiedCount` | `scans` COUNT DISTINCT userId | number | 100% |

**Gap identifie** :
- `personalAlerts[type=boycott]` n'est jamais genere cote backend — le boycott est renvoye separement mais pas comme alerte personnelle
- La severite boycott (`high/medium/low`) n'est pas mappee a la couleur front de maniere coherente

### 1.6 Barre d'actions (bas fixe)

| Action UI | Backend | Table | Etat |
|---|---|---|---|
| Favori (coeur) | `favorites.add/remove` | `favorites` | OK |
| Partage (screenshot) | `captureAndShareCard` | Aucun (local) | OK |
| Signaler | `report.createReport` | `reports` | OK |
| "Ou acheter?" | Deep-link `/map?barcode=X` | Pas de query barcode-to-store | **Gap** : pas de lien produit→magasin |

### 1.7 Donnees renvoyees mais NON affichees

| Champ API | Type | Raison probable |
|---|---|---|
| `scan.id` | uuid | Usage interne (curseur historique) |
| `scan.latitude/longitude` | coords | Pas de carte de scan |
| `product.offData` | Record complet | Trop volumineux pour UI |
| `remainingScans` | number | Affiche uniquement quand < 2 |
| `levelUp.previousLevel` | number | Seul `newLevel` affiche en celebration |
| `certifierData.halalAssessment` | boolean | Doublon avec trustScore > 0 |

---

## 2. ECRAN HOME

**Route** : `/(tabs)/index`

### 2.1 Hero Header

| Champ UI | Source Backend | Table | Couverture |
|---|---|---|---|
| Avatar | `user.profilePhotoUrl` | `users.avatar_url` | ~5% (peu uploade) |
| Nom / Salam | `user.displayName` | `users.display_name` | 100% |
| Niveau | `user.level` | `users.level` | 100% |
| XP progress | `user.experiencePoints` | `users.experience_points` | 100% |
| Streak badge | `user.currentStreak` | `users.current_streak` | 100% |

### 2.2 Quick Actions (2x2)

| Action | Deep-link | Backend | Etat |
|---|---|---|---|
| Scanner | `/(tabs)/scanner` | Aucun | OK |
| Magasins | `/(tabs)/map` | `store.nearby` | OK |
| Marketplace | `/(tabs)/marketplace` | Aucun (coming soon) | Coming soon |
| Historique | `/settings/scan-history` | `scan.getHistory` | OK |

### 2.3 Contenu

| Section | Source Backend | Table | Couverture |
|---|---|---|---|
| Alertes featured | `alert.list` (limit 2-3) | `alerts` (30+ rows) | OK |
| Articles featured | `article.list` (limit 3) | `articles` (30+ rows) | OK |
| Favoris rapides | `favorites.list` | `favorites` + `products` | OK |
| Magasins proches | `store.nearby` | `stores` (400) + Google Places | OK |

**Gap identifie** :
- Pas de "produits scannes recemment" sur le home (il faut aller dans Historique)
- Pas de "stats du jour" (nombre de scans, produits halal decouverts)
- Pas de "certifieur du mois" ou contenu editorial rotatif

---

## 3. ECRAN MAP

**Route** : `/(tabs)/map`
**Procedure** : `store.nearby` (query, publicProcedure)

### 3.1 Marqueurs carte

| Champ UI | Source Backend | Table | Couverture |
|---|---|---|---|
| Position (lat/lng) | `store.latitude/longitude` | `stores.latitude/longitude` | 100% |
| Icone par type | `store.storeType` | `stores.store_type` | 100% |
| Badge certifieur | `store.certifier` | `stores.certifier` | 100% |
| Clustering | Frontend (Mapbox ShapeSource) | Aucun | OK |

### 3.2 Bottom Sheet — Liste magasins

| Champ UI | Source Backend | Table | Couverture |
|---|---|---|---|
| Nom magasin | `store.name` | `stores.name` | 100% |
| Logo | `store.logoUrl` | `stores.logo_url` (Achahada) | ~30% |
| Adresse | `store.address` | `stores.address` | 100% |
| Telephone | `store.phone` | `stores.phone` | ~60% |
| Certifieur | `store.certifierName` | `stores.certifier_name` | 100% |
| Note Google | `store.averageRating` | `stores.average_rating` (Google Places) | 383/400 |
| Nb avis | `store.reviewCount` | `stores.review_count` (Google) | 383/400 |
| Distance | `store.distance` | Compute `ST_DWithin()` | 100% (si GPS) |
| Statut ouverture | `store.openStatus` | Compute vs `store_hours` | 383/400 |
| Heure fermeture | `store.closeTime` | `store_hours.close_time` | 383/400 |

### 3.3 Bottom Sheet — Detail magasin

| Champ UI | Source Backend | Table | Couverture |
|---|---|---|---|
| Horaires 7j | `store.hours[]` | `store_hours` (7 rows/magasin) | 383/400 |
| Avis Google | `store.googleReviewsData[]` | `google_reviews` (1827 rows) | 383/400 |
| Histogramme notes | `store.ratingHistogram` | Compute sur google_reviews | 383/400 |
| Photo Google | Via `store.imageUrl` | Google Places photo | ~50% |
| Bouton itineraire | Deep-link Maps/Waze | Aucun backend | OK |
| Bouton appeler | `store.phone` | `stores.phone` | ~60% |
| Favori magasin | `favorites.isStoreFavorite` | `store_favorites` | OK |

### 3.4 Filtres

| Filtre UI | Champ backend | Valeurs | Etat |
|---|---|---|---|
| Type magasin | `storeType` | butcher/restaurant/supermarket/bakery/wholesaler/abattoir | OK |
| Certifieur | `certifiers[]` | avs/achahada/argml/mosquee_de_paris/mosquee_de_lyon | OK |
| Ouvert maintenant | `openNow` | boolean | OK |
| Certifie halal | `halalCertifiedOnly` | boolean | OK |
| Note min | `minRating` | 0-5 | OK |

**Gap identifie** :
- Pas de filtre "magasin avec reviews" (utile pour la confiance)
- Pas de filtre "rayon km" visible dans l'UI (hardcode a 5km par defaut)
- Les magasins Leclerc (836 extraits) ne sont pas integres
- Pas de lien inverse "produit → magasins qui le vendent" (le bouton "Ou acheter?" n'a pas de logique backend)

---

## 4. ECRAN PROFILE

**Route** : `/(tabs)/profile`
**Procedure** : `auth.me` (query)

| Champ UI | Source Backend | Table | Couverture |
|---|---|---|---|
| Avatar | `user.profilePhotoUrl` | `users.avatar_url` | ~5% |
| Nom | `user.displayName` | `users.display_name` | 100% |
| Email | `user.email` | `users.email` | 100% |
| Niveau | `user.level` | `users.level` | 100% |
| Tier (free/premium) | `user.subscriptionTier` | `users.subscription_tier` | 100% |
| Date inscription | `user.createdAt` | `users.created_at` | 100% |
| Nb favoris | `favorites.list` (count) | `favorites` | OK |
| Points | `loyalty.getBalance` | `users.experience_points` | OK |
| Streak | `user.currentStreak` | `users.current_streak` | OK |

---

## 5. ECRAN ALERTES

**Route** : `/(tabs)/alerts`
**Procedure** : `alert.list` (query, cursor-based)

| Champ UI | Source Backend | Table | Couverture |
|---|---|---|---|
| Titre alerte | `alert.title` | `alerts.title` | 30+ |
| Resume | `alert.description` | `alerts.description` | 30+ |
| Severite (gradient) | `alert.severity` | `alerts.severity` | info/warning/critical |
| Image | `alert.imageUrl` (implicite) | Non en schema | **Gap** : pas de champ image en DB |
| Date | `alert.publishedAt` | `alerts.published_at` | 100% |
| Source URL | implicite | Non en schema alerts | **Gap** : pas de lien source |
| Categorie | `alert.categoryId` | `alert_categories.id` | OK |
| Lu/non-lu | `alert.markAsRead` | `alert_read_status` | OK |
| Nb non-lues | `alert.getUnreadCount` | Compute COUNT | OK |

**Gap identifie** :
- Pas de champ `image_url` dans la table `alerts` — les alertes n'ont pas d'illustration
- Pas de champ `source_url` pour lier vers la source originale (Al-Kanz, RappelConso)
- Pas de push notification quand une alerte critique est publiee (le service push existe mais pas de trigger automatique)

---

## 6. ECRAN CERTIFIER RANKING

**Route** : `/settings/certifier-ranking`
**Procedure** : `certifier.ranking` (query)

| Champ UI | Source Backend | Table | Couverture |
|---|---|---|---|
| Logo | Assets locaux | Hardcode front | 18/18 |
| Nom | `certifier.name` | `certifiers.name` | 18/18 |
| Trust Score | `certifier.trustScore` | Compute runtime | 18/18 |
| Site web | `certifier.website` | `certifiers.website` | 16/18 |

**Gap identifie** :
- Le ranking ne montre PAS les 4 scores madhab (disponibles en API)
- Pas de detail pratiques (11 flags) dans la vue liste — seulement dans scan result
- Les `certifier_events` (15+ controverses) ne sont pas affiches dans le ranking
- Le `evidenceLevel` n'est pas affiche dans le ranking

---

## 7. ECRAN BOYCOTT LIST

**Route** : `/settings/boycott-list`
**Procedure** : `boycott.list` (query)

| Champ UI | Source Backend | Table | Couverture |
|---|---|---|---|
| Nom entreprise | `target.companyName` | `boycott_targets.company_name` | 120+ |
| Niveau boycott | `target.boycottLevel` | `boycott_targets.boycott_level` | enum 4 |
| Severite | `target.severity` | `boycott_targets.severity` | high/medium/low |
| Raison | `target.reasonSummary` | `boycott_targets.reason_summary` | 120+ |
| Source | `target.sourceUrl` | `boycott_targets.source_url` | 120+ |
| Logo | `target.logoUrl` | `boycott_targets.logo_url` | ~30% |

**Gap identifie** :
- `boycott_targets.brands` (array de marques filles) n'est pas affiche — l'utilisateur ne sait pas quelles MARQUES sont concernees
- `boycott_targets.barcode_prefix` n'est pas exploite visuellement (scanner un produit Nestle devrait montrer le boycott)
- Pas de recherche textuelle dans la liste boycott

---

## 8. ECRAN ADDITIFS (encyclopedie)

**Route** : `/settings/additives` (implicite)
**Procedure** : `additive.list`, `additive.getByCode`

| Champ UI | Source Backend | Table | Couverture |
|---|---|---|---|
| Code E | `additive.code` | `additives.code` | 560 |
| Nom FR | `additive.nameFr` | `additives.name_fr` | 560 |
| Nom EN | `additive.nameEn` | `additives.name_en` | ~500 |
| Categorie | `additive.category` | `additives.category` | 560 |
| Statut halal | `additive.halalStatusDefault` | `additives.halal_status_default` | 560 |
| Toxicite | `additive.toxicityLevel` | `additives.toxicity_level` | 140 (curates) |
| EFSA | `additive.efsaStatus` | `additives.efsa_status` | 140 |
| Risque enceinte | `additive.riskPregnant` | `additives.risk_pregnant` | 140 |
| Risque enfants | `additive.riskChildren` | `additives.risk_children` | 140 |
| Rulings madhab | `additive.madhabRulings[]` | `additive_madhab_rulings` | 150+ |
| Vegetarien | `additive.isVegetarian` | `additives.is_vegetarian` | 547 (BoycottX) |
| Vegan | `additive.isVegan` | `additives.is_vegan` | 547 (BoycottX) |

**Gap identifie** :
- Les 420 additifs BoycottX ont `toxicityLevel=safe` et `efsaStatus=approved` par defaut — ce n'est pas verifie
- `additives.origin` (plant/animal/synthetic/mineral/insect/mixed) est en DB mais pas affiche dans la liste
- `additives.health_effects_fr` est NULL pour les 420 BoycottX (seulement 140 Naqiy ont du contenu)
- `additives.name_ar` est NULL pour tous — pas de traduction arabe des additifs
- `additives.halal_explanation_fr` n'est pas affiche dans l'encyclopedie (seulement dans scan result)

---

## 9. ECRAN HISTORIQUE SCANS

**Route** : `/settings/scan-history`
**Procedure** : `scan.getHistory` (query, cursor-based)

| Champ UI | Source Backend | Table | Couverture |
|---|---|---|---|
| Nom produit | `item.product.name` | `products.name` | 99.8% |
| Marque | `item.product.brand` | `products.brand` | ~85% |
| Image | `item.product.imageUrl` | `products.image_url` | 93.8% |
| Statut halal | `item.halalStatus` | `scans.halal_status` | 100% |
| Confiance | `item.confidenceScore` | `scans.confidence_score` | 100% |
| Date scan | `item.scannedAt` | `scans.scanned_at` | 100% |
| Trust score certifieur | `item.certifier.trustScore` | Compute batch runtime | Si certifie |

**Gap identifie** :
- Pas de filtres (par statut halal, par date, par categorie)
- Pas de recherche textuelle dans l'historique
- Le `certifier.certifierName` n'est pas dans la reponse getHistory (seulement trustScore)

---

## 10. DONNEES EN DB NON EXPLOITEES PAR LE FRONT

### 10.1 Products V2 — Colonnes inutilisees

| Colonne DB | Type | Source | Raison non-utilisee |
|---|---|---|---|
| `generic_name` | varchar | OFF | Doublon approximatif de `name` |
| `brand_owner` | varchar | OFF | Rarement different de `brand` |
| `quantity` | varchar | OFF | Ex: "500g" — utile pour comparaison prix |
| `serving_size` | varchar | OFF | Ex: "30g" — utile pour nutrition/portion |
| `emb_codes` | text[] | OFF | Codes emballeur (tracabilite) — technique |
| `image_ingredients_url` | URL | OFF | Photo ingredients OCR — pourrait etre affichee |
| `image_nutrition_url` | URL | OFF | Photo tableau nutritionnel — pourrait etre affichee |
| `completeness` | float | OFF | Score 0-1 de completude OFF |
| `off_last_modified` | timestamp | OFF | Date derniere modif OFF |
| `data_sources` | text[] | OFF | Toujours ["off"] |
| `analysis_version` | int | Interne | Toujours 2 |

**Opportunites** :
- Afficher `image_ingredients_url` et `image_nutrition_url` comme photos zoomables
- Utiliser `quantity` + `serving_size` pour un calcul "par portion" du health score
- Utiliser `completeness` comme indicateur de fiabilite des donnees

### 10.2 Users — Colonnes sous-exploitees

| Colonne DB | Utilisation actuelle | Potentiel |
|---|---|---|
| `dietary_restrictions` | Stocke mais pas utilise en analyse | Filtrer produits incompatibles |
| `bio` | Stocke, affiche nulle part | Profil social / communaute |
| `city` | Stocke | Auto-configurer la carte initiale |
| `biometric_enabled` | Flag seulement | Pas de biometrie implementee |
| `streak_freeze_count` | Achat via points | Pas d'UI pour acheter |

### 10.3 Stores — Champs sous-exploites

| Colonne DB | Source | Potentiel |
|---|---|---|
| Google Photos (via Places) | google-places-data.json | Carousel photos dans detail magasin |
| `store_subscriptions` | Table B2B | Pas de workflow magasin-proprietaire |

### 10.4 Scholarly Sources — Jamais affichees en front

Les 50+ sources savantes et 150+ citations ne sont accessibles qu'en lecture API (`scholarly.*`), mais AUCUN ecran frontend ne les affiche. C'est un tresor de contenu inutilise.

**Opportunite** : Onglet "Sources" dans scan result avec les references fiqh utilisees pour le verdict.

---

## 11. SYNERGIES DATA NON EXPLOITEES

### 11.1 Produit → Magasin (lien manquant)

**Etat actuel** : Le bouton "Ou acheter?" existe en UI mais n'a AUCUNE logique backend.
**Donnees disponibles** : `brand_certifiers` mappe marque→certifieur, `stores` mappe magasin→certifieur.
**Synergie possible** : `produit.certifierId` → `stores WHERE certifier = X AND nearby` = "Ce produit est certifie par AVS, voici les magasins AVS proches de vous".

### 11.2 Boycott → Scan (detection passive)

**Etat actuel** : Le boycott est verifie dans `scanBarcode` mais la liste boycott est un ecran separe.
**Synergie possible** : Quand un scan detecte un boycott, proposer des ALTERNATIVES halal du meme type de produit (`product.getAlternatives` existe deja en API).

### 11.3 Additifs → Health Score (enrichissement)

**Etat actuel** : Le health score utilise `toxicityLevel` et `efsaStatus` des additifs.
**Donnees BoycottX non exploitees** : `isVegetarian`/`isVegan` pourraient alimenter un axe "naturalite" du health score.

### 11.4 Certifier Events → Timeline (non affichee)

**Etat actuel** : 15+ evenements de controverse sont en DB avec dates, sources, impact sur trust score.
**Non affiche** : Aucun ecran ne montre la timeline d'un certifieur (controverses, ameliorations).
**Synergie possible** : Onglet "Historique" dans la fiche certifieur avec timeline visuelle.

### 11.5 Google Reviews → Trust communautaire

**Etat actuel** : 1827 avis Google importes, affiches dans le detail magasin.
**Non exploite** : Pas de NLP/sentiment sur les avis pour detecter des problemes halal mentionnes dans les commentaires.

### 11.6 OFF ingredients_analysis_tags → Vegan/Vegetarien produit

**Etat actuel** : `ingredientsAnalysisTags` est renvoye dans `offExtras` mais jamais interprete.
**Valeurs OFF** : `en:vegan`, `en:vegetarian`, `en:non-vegan`, `en:palm-oil-free`, etc.
**Synergie possible** : Afficher badges "Vegan", "Vegetarien", "Sans huile de palme" sur le scan result.

### 11.7 Macronutriments → Tableau nutritionnel

**Etat actuel** : 8 macronutriments en DB (`energyKcal100g` etc.) mais pas renvoyes dans la reponse scan.
**Synergie possible** : Ajouter un sous-onglet "Tableau nutritionnel" avec les 8 valeurs + le `serving_size`.

---

## 12. APKS A ANALYSER (Prochaine phase)

### 12.1 Yuka (PRIORITE P0)

**APK** : `io.yuka.android-4.32.2-745.zip` (75 MB)
**Statut** : Archive, non decompile

**Donnees attendues** :
- Algorithme NutriScore / scoring nutritionnel (benchmark vs Health Score V2)
- Base additifs (potentiellement 1000+ avec evaluations sante)
- Categorisation produits (types, sous-types)
- UX patterns (presentation scan result, comparaison)
- Modele premium (features payantes vs gratuites)

**Integration potentielle** :
- Enrichir les 420 additifs BoycottX avec des donnees sante Yuka (toxicite, ADI)
- Benchmarker le Health Score V2 contre l'algo Yuka
- S'inspirer de l'UX pour l'onglet nutrition

### 12.2 Metro (PRIORITE P1)

**APK** : `de.metro.alex.customer.digitalcard.metro-3.78.zip` (21 MB)
**Statut** : Archive, non decompile

**Donnees attendues** :
- Catalogue produits B2B (viandes, produits frais)
- Tracabilite viande (origine, abattoir, age, race)
- Certifications (halal, bio, AOP, Label Rouge)
- Fournisseurs Metro Cash & Carry

**Integration potentielle** :
- Enrichir la tracabilite viande (champs Carrefour documentes mais pas remplis)
- Ajouter Metro comme source de magasins professionnels

---

## 13. MATRICE DE PRIORITE — Actions identifiees

### Victoires rapides (1-2h)

| # | Action | Impact | Effort |
|---|---|---|---|
| 1 | Ajouter `image_ingredients_url` + `image_nutrition_url` dans la reponse scan | UX ++++ | Faible |
| 2 | Interpreter `ingredientsAnalysisTags` pour badges vegan/vegetarien/palm-oil | UX +++ | Faible |
| 3 | Ajouter les 8 macronutriments dans la reponse scan | Data completude | Faible |
| 4 | Afficher `additives.origin` dans l'encyclopedie | Transparence | Faible |
| 5 | Afficher `boycott_targets.brands` (marques filles) dans la liste | UX ++ | Faible |

### Ameliorations moyennes (4-8h)

| # | Action | Impact | Effort |
|---|---|---|---|
| 6 | Lien produit→magasin via certifieur commun | Feature strategique | Moyen |
| 7 | Timeline certifieur events | Transparence | Moyen |
| 8 | Ecran "Sources savantes" dans scan result | Credibilite | Moyen |
| 9 | Filtres + recherche dans historique scans | UX +++ | Moyen |
| 10 | Push notifications automatiques pour alertes critiques | Engagement | Moyen |

### Chantiers structurants (1-3 jours)

| # | Action | Impact | Effort |
|---|---|---|---|
| 11 | Decompiler et analyser Yuka APK | Benchmark + enrichissement | Eleve |
| 12 | Tableau nutritionnel complet (par 100g et par portion) | Feature premium | Eleve |
| 13 | NLP sur Google Reviews pour detection problemes halal | Innovation | Eleve |
| 14 | Integration magasins Leclerc (836 stores) | Couverture geographique | Eleve |
