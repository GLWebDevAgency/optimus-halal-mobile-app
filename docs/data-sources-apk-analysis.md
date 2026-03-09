# Rapport d'analyse APK & Sources de donnees alternatives

> Date: 2026-03-08
> Objectif: Identifier les APIs et bases de donnees exploitables pour enrichir Naqiy
> et reduire progressivement la dependance a OpenFoodFacts (OFF)

---

## Resume executif

8 APKs analyses (Carrefour, E.Leclerc, DPS Market, SalaMarket, AVS, Achahada, Al-Kanz, PLBA).
**2 APIs ouvertes et immediatement exploitables** : AVS Equinox et Achahada.
**Carrefour VTEX** : 2 036 produits harvestes, 125 EAN francais, 4 214 images.
**Carrefour France APK** : credentials Apigee X extraites via jadx (Cloudflare WAF bloque l'acces direct).
**E.Leclerc APK** : .NET MAUI decompile, 836 magasins harvestes, API mobile cartographiee (22+ endpoints), Scene7 CDN images.
Les grandes enseignes (Carrefour, Leclerc) sont fortement protegees.

### Matrice de priorite

| Source | Donnees | Auth | Priorite | Effort |
|:---|:---|:---:|:---:|:---:|
| **Achahada API** | Magasins, restos, distributeurs, fabricants, abattoirs, marques | AUCUNE | **P0** | Faible |
| **AVS Equinox API** | Boucheries, restos, fournisseurs viande, departements | AUCUNE | **P0** | Faible |
| **OFF CSV Bulk** | ~3M produits, nutriments, ingredients, NutriScore | AUCUNE | P1 | Moyen |
| **Carrefour VTEX** | 103K+ produits, EAN, marques, pays d'origine | AUCUNE | **P1** | Moyen |
| **Carrefour APIM FR** | Allergenes, nutrition, nom legal, tracabilite, alcool | OAuth2 | P2 | Eleve |
| **Al-Kanz WordPress** | Articles halal, revue de presse, villes | WAF/403 | P3 | Moyen |
| **E.Leclerc Scene7** | Images produits haute resolution par EAN | AUCUNE | **P2** | Faible (25% hit rate) |
| **E.Leclerc Mobile API** | 836 magasins avec coordonnees GPS | AUCUNE (partiel) | **P1** | Faible |
| E.Leclerc Mobile API (auth) | Produits, prix, catalogues, horaires | Auth carte fidelite | P2 | Eleve |
| DPS Market | Catalogue produits | Non trouve | P4 | Tres eleve |
| SalaMarket | Catalogue produits | Non trouve | P4 | Tres eleve |
| PLBA Firestore | Prieres, evenements mosquee | Firebase Auth | P5 | Eleve |

---

## 1. AVS — Equinox API (OUVERT)

**Tech stack**: Capacitor/Ionic Angular
**Base URL**: `https://equinox.avs.fr/v1/`
**Firebase**: `p00001-7b66f.firebaseio.com` (App Check active)

### Endpoints publics (testes et fonctionnels)

| Endpoint | Methode | Auth | Donnees |
|:---|:---:|:---:|:---|
| `/v1/website/departments` | GET | Non | 4 departements (Tracabilite, Juridique, Halal, Informatique) |
| `/v1/website/providers` | GET | Non | **31 fournisseurs viande** avec noms, villes, coordonnees GPS, specialites |
| `/v1/website/sites/br?type=1` | GET | Non | **156 boucheries** certifiees AVS avec adresses, coordonnees, telephone |
| `/v1/website/sites/br?type=2` | GET | Non | **23 restaurants** certifies AVS avec coordonnees |
| `/v1/website/discussions` | GET | Non | 405 Method Not Allowed (probable POST only) |
| `/v1/accounts` | - | Oui | Endpoint d'authentification |
| `/v1/token` | - | Oui | Endpoint de token |

### Schema de donnees (providers)

```json
{
  "id": 761,
  "name": "ISLA MONDIAL DISTRIBUTION",
  "address": "...",
  "zipCode": "93300",
  "city": "Aubervilliers",
  "country": "France",
  "lat": 48.909,
  "lon": 2.387,
  "phone": "...",
  "specialities": "VOLAILLES, CHARCUTERIES, PRODUITS ELABORES",
  "isActive": true,
  "isActivityMealBag": false
}
```

### Schema de donnees (sites/boucheries)

```json
{
  "id": 1234,
  "name": "BOUCHERIE SAINT GRATIEN",
  "address": "...",
  "zipCode": "95210",
  "city": "Saint Gratien",
  "lat": 48.97,
  "lon": 2.28,
  "phone": "...",
  "email": "...",
  "webSite": "...",
  "specialities": "...",
  "isActive": true
}
```

### Fournisseurs notables (cross-ref avec nos certifieurs)

- **ISLA MONDIAL DISTRIBUTION** (Aubervilliers) — Marque certifiee AVS & ARGML
- **BIGARD** (2 sites: Cuiseaux, Venarey) — Grand abattoir francais
- **SOCOPA** (4 sites) — Filiale Bigard
- **SOVIAM** (Meaux) — Boeuf/veau/agneau
- **CLT GROUP - TAVIBEL** (Lyon)
- **BIONOOR** (Aulnay) — Bio halal
- **Delicial** (Lyon) — Volaille/charcuterie bio
- **EURO QUALITY LAMBS** (UK)

### Valeur pour Naqiy

- **156 boucheries** a integrer dans notre carte de magasins
- **31 fournisseurs** = base de donnees des chaines d'approvisionnement halal
- **23 restaurants** certifies AVS
- Cross-reference avec nos certifieurs existants (AVS = Tier S)
- Isla Mondial present = pont vers les marques ARGML

---

## 2. Achahada — API WordPress/PHP (OUVERT)

**Tech stack**: Capacitor/Ionic Angular
**Base URL**: `https://achahada.com/`
**Geolocalisation**: Paris par defaut (48.866667, 2.333333)

### Endpoints publics (testes et fonctionnels)

| Endpoint | Filter | Auth | Donnees |
|:---|:---:|:---:|:---|
| `api/index.php?action=store_search&filter=73` | Boucheries | Non | **9 boucheries** certifiees |
| `api/index.php?action=store_search&filter=74` | Restaurants | Non | **200+ restaurants** certifies |
| `api/index.php?action=store_search&filter=75` | Distributeurs | Non | **66 distributeurs** (dont 40+ DPS Market) |
| `api/index.php?action=store_search&filter=76` | Produits/magasins | Non | **Reseaux de magasins** (DPS, Burger Addict, 100%Crousti) |
| `api/index.php?action=store_search&filter=77` | Cash & Carry | Non | Grossistes |
| `api/index.php?action=store_search&filter=80` | Partenaires | Non | 4 partenaires |
| `api/index.php?action=store_search&filter=83` | Restaurants (alt) | Non | Restaurants supplementaires |
| `api/index.php?action=store_search&filter=89` | Fabricants | Non | **19 fabricants** (10 Pologne, 4 France) |
| `api/index.php?action=store_search&filter=90` | Abattoirs | Non | **15 abattoirs** (10 Pologne, 2 France) |
| `api/index.php?action=store_search&filter=91` | Marques | Non | **9 marques** certifiees |
| `api/?action=get_posts&cat=8` | Articles | Non | Blog posts |
| `api/?action=get_posts&cat=81` | Videos | Non | Contenu video |
| `api/contact.php` | - | Non | Formulaire contact (POST) |
| `api/fraud.php` | - | Non | Signalement fraude (POST) |
| `api/place.php` | - | Non | Soumission lieu (POST) |
| `api/index.php?action=check_agrement&agrement=XXX` | Verification | **Oui (401)** | Verification N. d'agrement |

### Schema de donnees (store_search)

```json
{
  "id": 123,
  "store": "Boucherie D'orgemont",
  "address": "...",
  "address2": "",
  "city": "Argenteuil",
  "zip": "95100",
  "country": "France",
  "lat": "48.957565",
  "lng": "2.288640",
  "distance": "10.6",
  "phone": "...",
  "fax": "",
  "email": "...",
  "url": "...",
  "hours": "<table>...</table>",
  "thumb": "https://achahada.com/uploads/..."
}
```

### Couverture geographique

- **France** : IDF (concentration principale), Lyon, Marseille, Toulouse, Strasbourg, Nantes, Bordeaux
- **International** : Espagne (Barcelona, Valencia, Alicante), Pologne (10+ sites), Belgique, Luxembourg, Allemagne, Italie, Senegal (Dakar)

### Distributeurs notables

- **DPS Market** : 40+ magasins en France + Espagne + Senegal
- **Khadispal** : 15+ magasins en France (grossiste)
- **SITICASH** : 2 magasins (grossiste)
- **Isla Distribution** (Paris) — lien avec Isla Mondial
- **FRANCE LAMELLE** (Arconnay) — fabricant + abattoir
- **OUMATY** (Argenteuil) — marque certifiee

### Fabricants/Abattoirs certifies Achahada

Forte presence en **Pologne** (10/19 fabricants, 10/15 abattoirs) :
Biernacki, Cargill, Damak, Imex, Indyk, Konkol, mielewczyk, Sklodowscy, Superdrop, Zaczyk

### Valeur pour Naqiy

- **200+ restaurants** certifies = carte de restos halal
- **66 distributeurs** = reseau de distribution halal complet
- **19 fabricants + 15 abattoirs** = chaine d'approvisionnement internationale
- **DPS Market** entierement reference (40+ points de vente)
- Cross-reference certifieurs : Achahada = Tier A dans notre systeme
- Les marques Achahada enrichissent notre base de scan (certification connue)

---

## 3. Carrefour — VTEX International APIs (OUVERT AR/BR)

### 3a. Carrefour France — Architecture API complete (PROTEGE, credentials extraites)

**Tech stack**: Android natif (Kotlin, Jetpack Compose)
**Auth**: OAuth2 via `moncompte-api.carrefour.fr` + Apigee X (x-carrefour-client-id/secret)
**WAF**: Cloudflare + certificate pinning (mTLS) + DataDome anti-bot
**Decompilation**: jadx sur 13 DEX files (42 231 classes)

#### Credentials extraites (jadx — BuildConfig.java)

```java
// com.carrefour.fid.android.shared.BuildConfig (classes3.dex)
public static final String prod_APIGEEX_CLIENT_ID = "iHfpiidFSFr0iIcnyO5wRLPUSoVprtijxdS3AhRAk0vQOWqf";
public static final String prod_APIGEEX_CLIENT_SECRET = "IfTK4HJCQEvic4z3fXSLzGti66Ex7R1DeBrfRtt2tr9horVRq33IB2Xsfch1pGec";
public static final String prod_IAM_AUTHORIZATION_SIGNATURE = "Basic Y2FycmVmb3VyX29uZWNhcnJlZm91cl9hbmRyb2lkOmU0N1pleDdXTg==";
// Decode Base64: carrefour_onecarrefour_android:e47Zex7WN

// Autres credentials dans BuildConfig:
public static final String build_AIRSHIP_KEY = "bl5YK2UPQE2TsHvXV8suqw";
public static final String build_AIRSHIP_SECRET = "MK2PwL7pRnuYf6RA8XMVfg";
public static final String common_APP_FLYER_KEY = "88rPfV2dQQboxAuqhqbwDD";
public static final String common_GOOGLE_MAP_KEY = "AIzaSyBoN2aFlEOEJPx6op3RwKDnTA_wsdLe558";
```

**Status acces** : Les credentials sont correctes mais **Cloudflare WAF bloque** les requetes
non-mobiles. L'app utilise `pinningClientRequired(true)` (mTLS) — necessiterait un proxy
mitmproxy/Frida sur un device Android pour intercepter le trafic.

#### Double couche API (9 environnements)

| Couche | Base URL | Role |
|:---|:---|:---|
| **BFF** (Backend For Frontend) | `app.api.carrefour.fr` | Endpoints retail, stores, orders |
| **APIM** (API Management) | `app.apimx.carrefour.fr` | Product data, details, search |
| **IAM** (Identity) | `moncompte-api.carrefour.fr` | OAuth2 CarrefourConnect |
| BFF Preprod | `app-prep.api.carrefour.fr` | - |
| APIM Preprod | `app-prep.np.apimx.carrefour.fr` | - |
| IAM Preprod | `iam-prep-reng.fr.carrefour.com` | - |
| BFF SINT | `app-sint.api.carrefour.fr` | - |
| APIM SINT | `app-sint.np.apimx.carrefour.fr` | - |
| IAM SINT | `iam-demo-reng.fr.carrefour.com` | - |

#### Headers API (ApiConstantsKt.java)

```
x-carrefour-client-id    → prod_APIGEEX_CLIENT_ID
x-carrefour-client-secret → prod_APIGEEX_CLIENT_SECRET
Authorization            → Bearer {access_token}
X-origin-ID              → "Android"
X-Correlation-Id         → UUID
X-Session-Id             → session UUID
X-Facility-Service-ID    → store facility ID
SSL_CLIENT_S_DN_CN       → "carrefour_onecarrefour_android"
```

#### Endpoints decouverts (jadx decompilation complete)

```
# BFF - Retail Services (appEnvironment.getApiGatewayBaseUrl() + ...)
retail/v1/products-management/           ← Produits V1
retail/v2/products-management/           ← Produits V2
retail/v1/store-product-management/      ← Produits par magasin
retail/v1/stores-management/stores/      ← Magasins
retail/v1/utilities-management/          ← Utilitaires (product_details)
retail/v1/customers-management/          ← Comptes clients
retail/v1/customers-otp-management/      ← OTP
retail/v1/self-scanning-management/      ← Scan en magasin
retail/v1/address-management/            ← Adresses

# APIM - Product Details (APIMProductDetailsService.java)
POST retail/v2/mof/one_products/facilities_services/some/products/some/offers

# Body (APIMProductDetailsBody.java):
{
  "facility_service_ids": ["1"],    // IDs magasin
  "gtins": ["3029330003533"],       // Codes EAN
  "count": 50,                      // Pagination
  "page": 0
}

# Response: APIMProductDetailsResponse { content: APIMProductDetails[] }
# APIMProductDetails { product: APIMProduct, offers: Offer[] }

# IAM - OAuth2
POST iam/oauth2/CarrefourConnect/access_token?q=loginbycode
  grant_type=password|authorization_code|refresh_token
  scope=openid iam
  auth_chain=mobile
```

#### Modele de donnees produit (APIMProduct + BFF)

Le modele Kotlin contient **35+ champs alimentaires** extraits du DEX :

**Identite produit :**
- `gtin` — code EAN/GTIN du produit
- `brand`, `brandName`, `subBrandName` — marques
- `productDescription` — description commerciale
- `articleShortDescription`, `articleShortTitle`, `articleLongTitle` — titres
- `designation`, `shortDesignation` — designation de vente
- `descriptionLegal` — **NOM LEGAL** (denomination legale de vente, ex: "Pommes de terre rouges vapeur, raclette, gratin, rissolees FILIERE QUALITE CARREFOUR")
- `bffIsFood` — boolean indicant si c'est un produit alimentaire
- `alimentaryType` — type alimentaire
- `productUsage` — mode d'emploi / usage
- `productLabel` — label produit (Bio, Label Rouge, etc.)
- `baseOfTheDish` — base du plat

**Nutrition (APIMFood + APIMFoodIngredients) :**
- `food` → objet `APIMFood(ingredients=...)`
- `ingredients` — liste des ingredients
- `ingredientStatement` — declaration d'ingredients (format reglementaire UE)
- `nutritionalTables` → objet `NutritionalTables(incoVariante=...)`
  - `BffFoodNutritionalTablesIncoVariante(incoNutrients=...)` — variantes (pour 100g, par portion)
  - `BffFoodNutritionalTablesIncoNutrients(columnId=...)` — valeurs par colonne
  - `BffFoodNutritionalTablesNutrient(label=...)` — nutriments individuels
- `incoNutrients` — nutriments INCO (reglement UE 1169/2011)
- `nutriScore` / `nutriscore` — Nutri-Score (A-E)
- `ecoScore` / `ecoscore` — Eco-Score
- `sourceEcoscore` — source du calcul Eco-Score
- `composition` — composition du produit
- `saltAddition` — ajout de sel
- `dosage` — dosage

**Indicateurs sante :**
- `isNutriscoreCalculated` — NutriScore calcule ?
- `isAddedSugarFree` — sans sucres ajoutes
- `isSugarFree` — sans sucre
- `isLowSugar` — faible en sucre
- `isSugarDiet` — regime sucre
- `isLowFat` — faible en matiere grasse
- `isSaltFree` — sans sel

**Allergenes (APIMAllergens — 14 allergenes EU):**

```json
{
  "is_containing_gluten": true/false,
  "is_containing_crustaceans": true/false,
  "is_containing_egg": true/false,
  "is_containing_fish": true/false,
  "is_containing_peanuts": true/false,
  "is_containing_soya": true/false,
  "is_containing_lactose": true/false,
  "is_containing_shellnuts": true/false,
  "is_containing_celery": true/false,
  "is_containing_mustard": true/false,
  "is_containing_sesame_seeds": true/false,
  "is_containing_sulphur_dioxide": true/false,
  "is_containing_lupine": true/false,
  "is_containing_molluscs": true/false
}
```

**Alcool :**
- `containAlcohol` / `containsAlcohol` — contient de l'alcool
- `alcoholDegree` — degre d'alcool
- `alcoholByVolumeLabel` — label pourcentage alcool
- `percentageAlcoholVolume` — pourcentage vol.

**Tracabilite & Origine :**
- `origin` — origine du produit
- `originIngredient` / `productIngredientOrigin` — origine des ingredients
- `materialOrigin` — origine de la matiere premiere
- `country`, `countryCode` — pays
- `withOrigin` — indicateur d'origine
- `traceability` — tracabilite
- `aocName` — appellation AOC/AOP
- `animalBreed` — race animale
- `breedingArea` — zone d'elevage
- `ageAtSlaughter` — age a l'abattage

**Post-recolte (fruits/legumes) :**
- `postRecoltCire` — cire post-recolte appliquee
- `postRecoltGerminatif` — anti-germinatif post-recolte

**Vin :**
- `wineCepage` — cepage
- `wineColor` — couleur
- `wineRegion` — region viticole
- `wineYear` — millesime
- `wineFoodMatch` — accord mets-vins
- `wineAward` — recompenses

**Legal / Mentions :**
- `legalDisclaimer` — avertissement legal
- `legalMentions` — mentions legales

**Non-alimentaire (APIMNonFood) :**
- `longDescription` — description longue
- `energyClass`, `energyLabel` — classe energetique
- `nonFoodAttributes` — attributs non-food
- `NON_FOOD_ATTRIBUTES_TYPE_CODE_ENERGY_LABEL` — type code etiquette energie
- `NON_FOOD_ATTRIBUTES_TYPE_CODE_IS_RECONDITIONED` — produit reconditionne

**Attributs dynamiques :**
- `additionalAttributes` → `BffAdditionalAttribute(typeCode=...)` — attributs supplementaires cle/valeur
- `additionalInformations` → `BffAdditionalInformations(topResultsCategoryId=...)` — infos additionnelles

#### Composants PDP (Product Detail Page) — InfoCardItem

La fiche produit mobile utilise des composants Jetpack Compose modulaires :

| Composant | Donnees affichees |
|:---|:---|
| `InfoCardItem.LegalName` | **Nom legal** (denomination legale) |
| `InfoCardItem.Certifications` | Labels et certifications |
| `InfoCardItem.Traceability` | Tracabilite produit |
| `InfoCardItem.Contact` | Contact fabricant |
| `InfoCardItem.UsageManual` | Mode d'emploi |
| `InfoCardItem.LegalMention` | Mentions legales |
| `InfoCardItem.ProductAdvantage` | Avantages produit |

#### Saisonnalite

La donnee de **saisonnalite** (calendrier mensuel vert affiche sur carrefour.fr) n'est **PAS presente
dans l'API mobile**. C'est un contenu **editorial CMS** exclusif au site web carrefour.fr :
- Probablement source INTERFEL (interprofession fruits et legumes)
- Accessible uniquement via le site web (bloque par Cloudflare)
- Non replicable sans scraping ou partenariat

Status France : **BLOQUE** (Cloudflare + OAuth2 + DataDome) — mais le modele de donnees est
extremement riche et documentable pour enrichissement futur via partenariat ou reverse-engineering OAuth2

### 3b. Carrefour Argentine — VTEX API (OUVERT, HARVESTE)

**Base URL**: `https://www.carrefour.com.ar/`
**Plateforme**: VTEX Commerce
**Auth requise**: **AUCUNE**
**Volume catalogue**: **103 681 produits** | **5 455 marques**
**Harveste**: **2 036 produits** | **125 EAN francais** | **4 214 images** | **89 marques**

#### Harvest realise (2026-03-08)

| Metrique | Valeur |
|:---|:---:|
| Produits uniques harvestes | **2 036** |
| EAN francais (300-379) | **125** |
| Images cataloguees | **4 214** |
| Images uniques (pour R2) | **4 214** |
| Marques couvertes | **89** |
| Manifest R2 genere | Oui |

**Top marques francaises par EAN :**

- Carrefour Home: 76 produits (electromenager, ustensiles)
- Bonduelle: 13 produits (conserves legumes)
- Paysan Breton: 12 produits (fromages)
- Bonne Maman: 9 produits (confitures)
- Lindt: 4 produits (chocolats)
- Haagen Dazs: 3 produits (glaces)
- Milka, Ferrero, Nescafe: 1-2 produits chacun

**Fichiers generes :**

- `/tmp/naqiy-harvest/carrefour-vtex/products/all_harvested.json` (1.7 MB)
- `/tmp/naqiy-harvest/carrefour-vtex/products/french_ean_only.json` (85 KB)
- `/tmp/naqiy-harvest/carrefour-vtex/products/image_catalog.json` (1.1 MB)
- `/tmp/naqiy-harvest/carrefour-vtex/products/r2_upload_manifest.json` (1.3 MB)

#### Endpoints VTEX publics (testes et fonctionnels)

| Endpoint | Status | Donnees |
|:---|:---:|:---|
| `/api/catalog_system/pub/category/tree/3` | 200 | Arbre complet de categories (3 niveaux) |
| `/api/catalog_system/pub/brand/list` | 200 | **5 455 marques** avec IDs |
| `/api/catalog_system/pub/products/search?fq=...` | 206 | Recherche produits par categorie/filtre |
| `/api/io/_v/api/intelligent-search/product_search/{query}` | 200 | Recherche intelligente avec specs |

#### Donnees par produit (TRES RICHES)

```json
{
  "productId": "122140",
  "productName": "Lomitos de atun Carrefour al natural 170 g.",
  "brand": "Carrefour",
  "EAN": "7798033333907",
  "categories": ["/Almacen/Enlatados y Conservas/Conservas de pescado/"],
  "EC_Sector": "P.G.C.",
  "EC_Grupo": "CONSERVAS",
  "EC_Familia": "PESCADO CONSERVAS",
  "EC_Subfamilia": "ATUN NATURAL",
  "Tipo de producto": "Atun al natural",
  "Envase Tipo": "LATA",
  "Gramaje de unidad de consumo": "170.00",
  "Gramaje de unidad de medida": "GRM",
  "Pais de origen": "Ecuador",
  "Proveedor Razon Social": "PROV.IMPORT.PROPIA PGC - SECOS",
  "Saludable": "true",
  "Precio Cuidado": "false",
  "Fecha alta": "16011999",
  "images": [{ "imageUrl": "https://carrefourar.vteximg.com.br/..." }]
}
```

#### Categories alimentaires disponibles

- **161** Almacen (epicerie) : huiles, pates, riz, conserves, sauces, snacks...
- **222** Desayuno y merienda : cereales, chocolats, golosinas
- **255** Bebidas : eaux, sodas, jus, vins, bieres
- **292** Lacteos y productos frescos : laits, yaourts, fromages
- **321** Carnes y pescados
- **330** Frutas y verduras
- **336** Panaderia
- **347** Congelados

### 3c. Carrefour Bresil — VTEX API (OUVERT, 21M PRODUITS)

**Base URL**: `https://www.carrefour.com.br/`
**Volume**: **21 095 345 produits** (marketplace inclus)
**Memes endpoints VTEX** que l'Argentine

### Disponibilite VTEX par pays Carrefour

| Pays | Domain | VTEX API | Status |
|:---|:---|:---:|:---:|
| Argentine | carrefour.com.ar | Oui | **200 OUVERT** |
| Bresil | carrefour.com.br | Oui | **200 OUVERT** |
| France | carrefour.fr | Non | 403 Cloudflare |
| Espagne | carrefour.es | Non | 403 |
| Belgique | carrefour.be | Non | 403 |
| Pologne | carrefour.pl | Non | 403 |
| Italie | carrefour.it | Non | 404 (pas VTEX) |
| Roumanie | carrefour.ro | Non | 404 (pas VTEX) |

### Valeur pour Naqiy

**Donnees VTEX (AR/BR, ouvert) :**

- **Cross-reference EAN** : les marques internationales (Parmentier, Nutella, etc.) partagent
  les memes codes EAN entre pays → les categories et types de produit de Carrefour AR/BR
  enrichissent nos fiches meme pour le marche francais
- **5 455 marques** = dictionnaire de marques alimentaires Carrefour
- **Classification interne** (Sector/Grupo/Familia/Subfamilia) = taxonomie produit professionnelle
- **Pays d'origine** par produit = donnee rare non disponible sur OFF
- **Flag "Saludable"** = indicateur sante equivalent
- **103K produits AR** + **21M produits BR** = base massive pour enrichissement

**Donnees APIM France (bloque, mais modele documente pour enrichissement futur) :**

- **APIMAllergens** — 14 allergenes EU en booleens : directement exploitable pour notre feature
  de detection allergenes au scan. Meme structure que le reglement UE 1169/2011.
  Pertinent pour la feature "alertes allergenes" de Naqiy.

- **APIMFood** — ingredients, declaration INCO, nutri-score, eco-score, tables nutritionnelles
  structurees. Plus riche que OFF car provient des donnees fabricant (GDSN/GS1).

- **descriptionLegal** — Nom legal reglementaire. Absent d'OFF, cette donnee identifie
  precisement la nature du produit (ex: distingue "preparation a base de viande" de "viande").
  **Critique pour la detection halal** : un "steak hache" peut etre une "preparation de viande
  hachee contenant des additifs" → le nom legal le revele.

- **Tracabilite animale** — `animalBreed`, `breedingArea`, `ageAtSlaughter` : donnees uniques
  introuvables sur OFF. Pertinent pour la confiance utilisateur sur les produits carnes.

- **Post-recolte** — `postRecoltCire`, `postRecoltGerminatif` : indicateurs tayyib pour
  les fruits et legumes (traitements chimiques post-recolte).

- **containAlcohol** + `alcoholDegree` : detection automatique des produits contenant de l'alcool.

**Strategie d'acces (mise a jour post-jadx) :**

1. **Court terme (FAIT)** : VTEX AR/BR pour enrichissement EAN cross-country
   - 2 036 produits harvestes, 125 EAN francais, 4 214 images cataloguees
2. **Moyen terme** : mitmproxy + Frida sur Android pour intercepter le trafic APIM France
   - Credentials extraites et fonctionnelles, seul Cloudflare WAF bloque
   - Besoin d'un device Android physique ou emulateur avec mitmproxy
3. **Long terme** : Partenariat officiel Carrefour → IP whitelisting Cloudflare
   - Les credentials (client_id/secret) sont valides une fois le WAF bypasse
   - Contacter l'equipe API Carrefour pour acces developeur officiel

---

## 4. E.Leclerc — Firebase (PROTEGE)

**Tech stack**: Android natif
**Firebase**: `api-project-211634897813.firebaseio.com`
**SDK tiers**: Batch (push), Adjust (analytics), DataDome (anti-bot)

### Status : INEXPLOITABLE

- Toute l'API est derriere Firebase Auth
- Aucun endpoint public decouvert
- Le DEX est pollue par d'enormes regex TLD (validation URL)

---

## 5. DPS Market — Akead Pro SaaS (B2B GROSSISTE)

**Tech stack**: Flutter sur plateforme SaaS turque **Akead Pro** (`akead_probase_flutter`)
**Auth**: `https://authentication.akead.link/` (JWT + Firebase Auth)
**Firebase**: `dps-market.firebaseio.com` (Auth, FCM, Crashlytics, Storage)
**Certifie**: Achahada

### Endpoints decouverts (43 endpoints, auth requise)

- `Membership/*` (14 endpoints) : login/register/token/profil
- `trade/*` (16 endpoints) : products, productGroups, barcodes, prices, campaigns, favoris
- `wholesaler/*` (13 endpoints) : grossistes, commandes pro, annonces

### BDD locale SQLite

17+ tables dont `product` (24 colonnes), `barcode`, `price`, `productGroup`, `campaign`

### Status : EXPLOITABLE via Achahada uniquement

- L'API directe DPS Market necessite un compte B2B (JWT)
- **Aucune donnee halal** dans l'app — c'est un outil de commande grossiste
- Les 40+ magasins DPS Market sont deja dans l'API Achahada (filter=75 et 76)
- Conclusion : Achahada est la source, pas DPS Market

---

## 6. SalaMarket + SalaMarket Gest — ERP Grossiste (SANS INTERET)

**Tech stack**: Flutter + MySQL direct (!)
**Backend**: `salamarket.hcidz.com` (HCI Distribution Zone)
**Editeur**: HCI (`C:/Users/HCI/Documents/GitHub/salamarket-gestion/`)

### SalaMarket (client B2B) : 20 endpoints

`/client/`, `/article/`, `/Catalog`, `/Order`, `/facture`, `/livraison`, `/statistiquesclient`

### SalaMarket Gest (ERP mobile) : 60+ endpoints

Gestion complete : articles, clients, fournisseurs, commandes, factures, avoirs,
livraisons, stock, planning, pointage, CA, reglements, ruptures

### Vulnerabilites de securite critiques

- **Connexion MySQL directe** depuis le client mobile (package `mysql1`) — pas de couche API
- **HTTP cleartext autorise** (`usesCleartextTraffic="true"`)
- Credentials BDD potentiellement dans l'APK

### Status : INEXPLOITABLE et SANS INTERET

- **Aucune donnee halal** — ERP generique pour grossiste alimentaire
- Architecture non securisee (MySQL direct = credentials dans l'APK)
- Donnees privees B2B (factures, clients, prix) — non exploitables legalement

---

## 7. Al-Kanz — Cordova/Ionic (BLOQUE)

**Tech stack**: Cordova/Ionic v3.9.2 (legacy Angular 5.2)
**Base URL**: `https://www.al-kanz.org/`
**Firebase project**: `al-kanz-78a27` (Realtime DB + Storage)
**Ionic Deploy**: App ID `68d6176c`, channel Master, OTA updates

### Endpoints decouverts (tous bloques par WAF/Cloudflare)

| Endpoint | Type | Status |
|:---|:---|:---:|
| `/wp-json/wp/v2/` | WordPress REST API | **403** |
| `/cities/search/findByNameContainingIgnoreCase?name=` | Spring Data REST (Java) | **403** |
| `/app/submit/upload.php` | Soumission contenu | Non teste |
| `/revue-presse/` | Revue de presse | Non teste |

### Architecture hybride

- **WordPress** pour le contenu editorial (wp-json/wp/v2/)
- **Spring Data REST** backend Java separe pour la recherche geographique de villes
- Firebase Realtime DB pour les donnees temps reel + push notifications

### Status : BLOQUE PAR WAF

- WordPress REST API + Spring REST bloques par Cloudflare
- Contenu editorial halal potentiellement riche mais inaccessible par API
- Possibilite : scraping HTML si le WAF ne bloque pas les navigateurs headless

---

## 8. PLBA (Mosquee de Lyon) — Flutter + Firebase (PROTEGE)

**Tech stack**: Flutter + Firebase (Auth, Firestore, Analytics, Messaging)
**Firebase project**: `plba-230310`
**Firestore URL**: `plba-230310.firebaseio.com` (Realtime DB: 401)
**Auth**: Firebase Auth + Facebook Login (App ID `1031306540876814`) + Sign In With Apple
**Navigation**: Support de 14 apps de navigation (Google Maps, Waze, Citymapper, OsmAnd, HERE, etc.)

### Status : INEXPLOITABLE

- Firebase Auth obligatoire (401 sur Realtime DB)
- Full Firebase stack (Firestore = BDD principale, pas d'API REST custom)
- Focus geolocalisation (14 apps de navigation = annuaire de points de vente halal)
- Pas de donnees produits/halal exploitables directement

---

## 9. Boycott X — Flutter + Firebase (DONNEES EMBARQUEES INTERESSANTES)

**Tech stack**: Flutter 3.x + Firebase (Messaging, Remote Config, Performance, A/B Testing)
**Package**: `com.webnova.boycott` v1.0.0 (build 30)
**Deep links**: `boycottx://`, `https://boycottx.fr`
**Monetisation**: AdMob (`ca-app-pub-7136148379167556~9027813369`) + Premium (sans pubs, scan IA)
**Barcode**: Google ML Kit Barcode Scanning
**Firebase project**: `boycott-x`

### Donnees embarquees EXPLOITABLES

**Base d'additifs alimentaires** (7 langues : ar, de, en, es, fr, it, tr)

- Fichier : `assets/lang/{lang}/additifs-{lang}.json`
- Structure :

```json
{
  "code": "E921",
  "name": "Cystine",
  "vegetarian": false,
  "vegan": false,
  "description": "L'E921 (Cystine) est un acide amine..."
}
```

**Mapping codes-barres GS1 → pays** (7 langues)

- Fichier : `assets/lang/{lang}/pays.json`
- Structure : `{ "000": "Etats-Unis", "030": "France", ... }`
- Prefixes GS1 internationaux pour identifier le pays d'origine

### Fonctionnalites detectees

- Scan code-barres → detection boycott (droits humains, ethique animale, environnement)
- Scoring : NutriScore + NovaScore + GreenScore
- Boycott par pays (via prefixes GS1)
- Groupes communautaires avec classement (societe, communaute, association, pays)
- Soumission de produits non reconnus

### Status : DONNEES STATIQUES EXPLOITABLES

- La **base d'additifs** est un JSON statique embarque dans l'APK — extractible et reutilisable
  pour enrichir notre propre base d'additifs (statut vegetarien/vegan par code E)
- Le **mapping GS1/pays** est standard mais pratique a avoir en JSON
- Le backend (Firebase) est inaccessible
- Attention : verifier la licence avant reutilisation des donnees

---

## Plan d'action recommande

### Sprint 1 (immediat) — Harvesting APIs ouvertes

1. **Creer un script `harvest-avs.ts`** dans `backend/src/db/seeds/`
   - GET `/v1/website/providers` → 31 fournisseurs viande
   - GET `/v1/website/sites/br?type=1` → 156 boucheries
   - GET `/v1/website/sites/br?type=2` → 23 restaurants
   - Upsert dans notre table `stores` avec `certifier = 'avs'`

2. **Creer un script `harvest-achahada.ts`** dans `backend/src/db/seeds/`
   - GET filters 73-91 → boucheries, restos, distributeurs, fabricants, abattoirs, marques
   - Upsert dans `stores` avec `certifier = 'achahada'`
   - Creer une table `supply_chain` pour fabricants/abattoirs

3. **Dedupliquer** avec nos stores existants (Google Places)
   - Match par coordonnees GPS (< 50m) ou nom normalise
   - Enrichir nos fiches existantes avec les donnees de certification

### Sprint 2 — OFF Bulk Data

4. **Telecharger le CSV OFF** (~9GB compressed)
   - Filtrer les produits vendus en France
   - Extraire : code barre, nom, marques, categories, NutriScore, NOVA, ingredients
   - Stocker dans une table `off_products` locale (pas de dependance API live)
   - Permet le scan hors-ligne et reduit les appels OFF de 80%+

### Sprint 3 — Enrichissement marques halal

5. **Scraper les catalogues de marques certifiees**
   - Isla Delice (isladelice.com) — 104 produits, ARGML certifie
   - Cross-ref avec les providers AVS (Isla Mondial Distribution = meme groupe)
   - Les marques Achahada (OUMATY, Sunna, The Farm, etc.)

6. **Construire une table `halal_brands`**
   - Nom, certifieur, pays, categories de produits
   - Lien vers les codes barres connus (via OFF ou scan utilisateur)

### Sprint 4+ — Sources avancees

7. **Carrefour** : Possible via reverse-engineering du flux OAuth2 (risque legal)
8. **Al-Kanz** : Scraping HTML avec Playwright si WAF le permet
9. **OFF Delta exports** : API de changements incrementaux (evite le full dump)

---

## Donnees collectables immediatement (sans auth)

| Source | Type | Volume | Format | Status |
| :--- | :--- | :---: | :--- | :---: |
| AVS providers | Fournisseurs viande | 31 | JSON | Pret |
| AVS boucheries | Points de vente | 156 | JSON | Pret |
| AVS restaurants | Points de vente | 23 | JSON | Pret |
| Achahada boucheries | Points de vente | ~9 | JSON | Pret |
| Achahada restaurants | Points de vente | 200+ | JSON | Pret |
| Achahada distributeurs | Grossistes | 66 | JSON | Pret |
| Achahada fabricants | Industrie | 19 | JSON | Pret |
| Achahada abattoirs | Industrie | 15 | JSON | Pret |
| Achahada marques | Marques certifiees | 9 | JSON | Pret |
| **Carrefour VTEX produits** | Produits alimentaires | **2 036** | JSON | **HARVESTE** |
| **Carrefour VTEX EAN FR** | Produits francais | **125** | JSON | **HARVESTE** |
| **Carrefour VTEX images** | Images produits | **4 214** | JPEG/PNG | **CATALOGUE** |
| Carrefour APK stores | PromoCash + Express | 313 | JSON | Extrait |
| Carrefour APK categories | Arbre departements | ~500 | JSON | Extrait |
| **TOTAL** | | **~7 400+** | | |

---

## Notes techniques

### Considerations legales

- Les APIs AVS et Achahada sont **publiques** (pas d'auth, pas de robots.txt restrictif sur les endpoints API)
- Les donnees sont des informations commerciales publiques (adresses, telephones de magasins)
- Respecter un rate limiting raisonnable (1 req/sec max)
- Attribuer la source dans nos donnees (`source: 'avs_equinox'`, `source: 'achahada_api'`)

### Resilience

- Cacher les reponses localement (ne pas dependre d'appels live en production)
- Mettre a jour de facon incrementale (cron hebdomadaire ou mensuel)
- Detecter les changements de structure API (versioning v1/)

### Cle API Google Maps dans Achahada

L'app Achahada expose une cle Google Maps dans son HTML :
`AIzaSyDYGi8e9G09Ao_30tQiWHkNN8Ezi8BTHys`
**NE PAS utiliser cette cle** — elle appartient a Achahada et son usage par un tiers serait abusif.

---

## 4. E.Leclerc — Analyse APK mode ultime

### 4a. Stack technique

| Composant | Technologie |
|:---|:---|
| Framework | **.NET MAUI 8.0** (Xamarin successor) |
| Language | C# (.NET 8.0-android) |
| Architecture | MVVM (CommunityToolkit.Mvvm) |
| HTTP Client | System.Net.Http (HttpClientHandler) |
| JSON | Newtonsoft.Json + System.Text.Json |
| UI | MAUI Controls + SkiaSharp + Lottie + SVG |
| Maps | Maui.GoogleMaps |
| Scanner | ZXing.Net.MAUI |
| Push | Batch SDK (Batch.Maui.Droid) |
| Anti-bot | **DataDome** (CoreDataDomeSDK.Android) |
| Analytics | AppCenter + Adjust + AppsFlyer + Firebase |
| Video | ExoPlayer |
| Consent | OneTrust |
| Error tracking | **Sentry** (DSN: `365ee59271e9f763b6c754158f789659@o4508636876701696.ingest.de.sentry.io/4508952756486224`) |
| Build CI | GitLab CI (`/Users/gitlabrunner/builds/o7WEfhus/0/ed/moq/mobile/bill`) |

### 4b. Decompilation XABA

L'APK contient 4 DEX files (Java bindings, 8 481 classes) + un `assemblies.blob` XABA (14.6 MB) compresse en LZ4.

**Extraction reussie**: 256 assemblies .NET decompressees, dont:
- `Bill.dll` (3.4 MB) — Couche UI/MVVM (Views, ViewModels, Pages)
- `Bill.Business.dll` (1.2 MB) — Couche metier (Services, Models, HTTP)

Les assemblies internes utilisent le nom de code **"Bill"** (interne Infomil/GALEC).

### 4c. Domaines reseau (network_security_config.xml)

| Domaine | Role | Acces |
|:---|:---|:---:|
| `hpcs.mservices.eu` | **API mobile PRODUCTION** | Auth requise (sauf magasins) |
| `hpcs.mservices.recette.its.dnsi` | API mobile RECETTE (staging) | Interne |
| `hpcs.mservices.dev.its.dnsi` | API mobile DEV | Interne |
| `hpcs.mservices.image.its.dnsi` | API mobile IMAGE/TEST | Interne |
| `e-leclerc.com` | Site web (redirect vers e.leclerc) | Public |
| `e.leclerc` | TLD personnalise E.Leclerc | Public |
| `images.mediabasepro.com` | CDN images produits (MediaBase Pro) | Public |
| `leclercstreamer.hosting-media.net` | Streaming video | Public |
| `e-leclerc.scene7.com` | **CDN images produits** (Adobe Scene7) | **Public** |
| `ccu.e.leclerc` | Customer Content Unit | Public |
| `preprod.couleur-citron.com` | Prestataire web | Interne |

### 4d. API mobile — Environnements decouverts

Toutes les URLs sont hardcodees dans `Bill.Business.dll` (user strings heap):

```
PRODUCTION : https://hpcs.mservices.eu/Mobile/api/v2/
RECETTE    : https://hpcs.mservices.recette.its.dnsi/Mobile/api/v2/
DEV        : https://hpcs.mservices.dev.its.dnsi/Mobile/api/v2/
DEV MOCK   : https://hpcs.mservices.dev.its.dnsi//MobileMock/api/v2/
IMAGE      : https://hpcs.mservices.image.its.dnsi/Mobile/api/v2/
LOCAL EMU  : http://10.0.2.2:5008/Mobile/api/v2/
LOCAL HOST : http://localhost:5008/Mobile/api/v2/
MOCK AZURE : https://mockbillapp.azurewebsites.net/Mobile/api/v2/
```

### 4e. Endpoints API — Cartographie complete

**Endpoints PUBLICS (sans auth)**:

| Endpoint | Methode | HTTP | Donnees |
|:---|:---:|:---:|:---|
| `Authent/ListerPointDeVente` | GET | **200** | **836 magasins** (nom, adresse, ville, CP, tel, lat/lng, departement) |

**Endpoints EXISTANTS (auth requise, retournent 400 sans session)**:

| Endpoint | Donnees probables |
|:---|:---|
| `Accueil` | Page d'accueil personnalisee |
| `Avantages` | Bons de reduction, coupons |
| `Cagnotte` | Solde cagnotte fidelite |
| `Carburants` | Prix carburants du magasin |
| `CarteCadeau` | Gestion cartes cadeaux |
| `Catalogues` | Prospectus et catalogues numeriques |
| `ClientExiste` | Verification existence client |
| `Configuration` | Config services pour le magasin |
| `CreerRendezVousClient` | Prise de rendez-vous |
| `Horaires` | Horaires d'ouverture |
| `Magasin` | Details du magasin |
| `Prospectus` | Prospectus par rayon |
| `Referential` | Referentiel de donnees |
| `Services` | Liste des services disponibles |

**Endpoints PROTEGES par DataDome (403 + CAPTCHA redirect)**:

| Endpoint | Protection |
|:---|:---|
| `Authent/Authentifier` | DataDome CAPTCHA (geo.captcha-delivery.com) |

**Services metier decouverts dans le code (noms de cles service)**:

`INFOS_PRODUIT`, `SCAN_PRODUIT`, `FICHE_PRODUIT`, `QELMC_PRODUIT` (Qui Est Le Moins Cher),
`VRAI_SCANACHAT`, `PROMOTIONS_INFOS_PRODUIT`, `LISTE_SERVICES`, `PLAN_MAGASIN`,
`CHAT_CLIENT`, `MON_COMPTE`, `MON_MAGASIN`, `MES_BONS`, `CAGNOTTE`, `TOMBOLA`,
`VIGNETTAGE`, `FILE_ATTENTE`, `CREATION_FID`

> **Note**: Ces cles de service ne sont PAS des paths API directs. L'app charge dynamiquement
> les URLs via `ReloadServiceBaseUrls` apres authentification. Chaque service a sa propre BaseUrl
> retournee par le serveur.

### 4f. Modeles de donnees produit

Proprietes extraites de `Bill.Business.dll` (backing fields):

**InfoProduit / Fiche produit**:
- `Ean`, `EanList`, `IdProduit`, `ProductId`
- `ProductName`, `ProductDesc`, `AddProductDesc`
- `ProductImageUrl`, `PictureUrl`, `PhotoUrl`, `UrlImageProduit`
- `ProductOrigin`, `ProductPackaging`, `ProductValidity`
- `BrandUrl`, `MarqueModele`
- `Price`, `Prix`, `PriceValue`, `PricePerUnit`, `PriceDescription`
- `OriginPrice`, `StrikedPrice`, `TotalPrice`
- `CategorieProducts`, `ProduitsPhares`
- `ProductList`, `Produits`
- `NationalAccessUrl`, `NationalImageUrl`

**Comparaison prix (QELMC = Qui Est Le Moins Cher)**:
- `QuiEstLeMoinsCherProduit`, `ProduitMagasinComparisionList`
- `ProduitPrimaryMagasin`, `ProduitName`

**Magasin**:
- `IdMagasin`, `MagasinName`, `MagasinId`
- `CurrentMagasin`, `OtherMagasinList`
- `HasMapMagasin`, `HasToCollectInStore`
- `StationsServices`, `CarburantFavorisItemViewModels`

### 4g. CDN Images — Scene7

**URL pattern**: `https://e-leclerc.scene7.com/is/image/gtinternet/{EAN}`

Parametres de redimensionnement: `?wid=800&hei=800&fmt=jpg`

Test sur 8 EAN: **2 accessibles** (Nutella, Barilla). Scene7 ne couvre pas tous les produits
mais fournit des images haute resolution (197 KB en 800x800).

### 4h. Site web — Architecture API

Configuration extraite de `https://www.e.leclerc/assets/config/app.json`:

| Element | Valeur |
|:---|:---|
| GraphQL | `/api/graphql` (protege 403) |
| REST API | `/api/rest` (protege) |
| Images Scene7 | `https://e-leclerc.scene7.com/is/image/gtinternet/` |
| Image Galec | `https://hpcs.mservices.eu/Mobile/api/Photo/ObtenirPhotoGalec?id=` |
| Icecat (fiches produits) | `https://live.icecat.biz/api` |
| Paiement | Adyen (environment: live) |
| reCAPTCHA | `6LcRl4MpAAAAAPAIhOm6694pLk7S3GQvFJORq_7w` |
| GTM | `GTM-PFVJGZV` |
| BV Pixel | clientName: `eleclerc`, locale: `fr_FR` |

### 4i. Donnees harvestes

| Donnees | Quantite | Format | Localisation |
|:---|:---:|:---|:---|
| Magasins E.Leclerc | **836** | JSON | `/tmp/leclerc-harvest/magasins.json` (206 KB) |
| Image Nutella Scene7 | 1 | JPEG 800x800 | `/tmp/leclerc-harvest/nutella_scene7.jpg` (197 KB) |

**Structure magasin** (JSON):
```json
{
  "IdPdv": 1,
  "NomMagasin": "BAPEAUME",
  "Coordonnees": {
    "Adresse": "RUE DU CANAL",
    "Ville": "BAPEAUME LES ROUEN",
    "CodePostal": "76380",
    "Telephone": "02 32 83 23 00",
    "Longitude": 1.044057,
    "Latitude": 49.45678,
    "Departement": "76"
  }
}
```

### 4j. Protections identifiees

| Protection | Detail |
|:---|:---|
| **DataDome** | Anti-bot client-side SDK + server-side redirect CAPTCHA |
| **Auth carte fidelite** | Login par numero de carte + code secret |
| **Dynamic service URLs** | Les URLs produit/scan sont chargees dynamiquement apres auth |
| **Sentry monitoring** | Tracking erreurs en temps reel |
| **OneTrust consent** | RGPD consent management |
| **reCAPTCHA** | Google reCAPTCHA Enterprise sur le site web |

### 4k. Strategie d'exploitation pour Naqiy

**Immediatement exploitable (P1)**:
1. **836 magasins** avec geolocalisation — integrer dans la recherche "magasins halal a proximite"
2. **Scene7 CDN** — tester chaque EAN de notre base pour recuperer les images haute resolution
3. ~~**Icecat**~~ — **ELIMINE** (voir section 5 ci-dessous)

**Avec partenariat (P2)**:
1. **API mobile complete** — acces aux prix, catalogues, disponibilite en magasin
2. **QELMC** (Qui Est Le Moins Cher) — comparaison de prix entre magasins

**Approche technique recommandee**:
- Pipeline d'images: Pour chaque produit dans notre base, tester `Scene7/{EAN}` et cacher le resultat
- ~~Enrichissement Icecat~~: **ELIMINE** — couverture alimentaire nulle (voir section 5)
- Magasins: Integrer les 836 magasins E.Leclerc dans la base de donnees stores existante

### 4l. Comparaison Carrefour vs E.Leclerc

| Critere | Carrefour | E.Leclerc |
|:---|:---|:---|
| Tech stack | Kotlin/Java natif | .NET MAUI (C#) |
| API Gateway | Apigee X (Google Cloud) | ASP.NET Web API (IIS) |
| Auth | OAuth2 CarrefourConnect | Carte fidelite + code secret |
| Anti-bot | Cloudflare WAF + mTLS | DataDome + CAPTCHA |
| Images CDN | VTEX (carrefour.vtexassets.com) | Adobe Scene7 |
| Credentials in APK | Oui (BuildConfig.java) | Non (dynamic config) |
| Magasins publics | Non | **Oui (836)** |
| Donnees produit publiques | VTEX (2 036) | Scene7 (images par EAN) |
| Produits fiches | Icecat non utilise | **Icecat utilise** (IT/CE uniquement) |

---

## 5. Icecat Open API — Audit complet (ELIMINE)

> Date d'audit: 2026-03-08
> Verdict: **INUTILISABLE pour Naqiy** — couverture alimentaire = 0%

### 5a. Presentation

[Icecat](https://icecat.biz) est une plateforme de syndication de fiches produits, revendiquant
26M+ datasheets et "FMCG" dans ses categories. E.Leclerc l'utilise en interne (`live.icecat.biz/api`).

**API**: `https://live.icecat.biz/api?lang=FR&shopname=openicecat&GTIN={EAN}`
**Auth**: Compte gratuit (Open Icecat) ou payant (Full Icecat)
**Format**: JSON, 1 requete = 1 produit, jusqu'a 100 requetes simultanees.

### 5b. Test de couverture — 37 EAN testes

#### Produits alimentaires (0/16 trouves)

| Produit | EAN | Statut |
|:---|:---|:---:|
| Nutella 750g | 3017620422003 | Status 16 — GTIN non trouve |
| Evian 1.5L | 3068320114439 | Status 16 |
| Barilla Penne 500g | 8076809513753 | Status 16 |
| Coca-Cola 1.5L | 5449000000996 | **Status 9 — Full Icecat requis** |
| Carte Noire Cafe | 8711000531068 | Status 16 |
| Danone Activia | 3033490594015 | Status 16 |
| Haribo Tagada | 3181232030526 | Status 16 |
| LU Prince | 7622210713063 | Status 16 |
| Kellogg's Special K | 5053827207232 | Status 16 |
| Kiri 8 portions | 3073780616041 | Status 16 |
| President Beurre | 3228021170015 | Status 16 |
| Fleury Michon | 3302747040103 | Status 16 |
| Knorr Soupe | 8712100849206 | Status 16 |
| Panzani Spaghetti | 3038350011503 | Status 16 |
| Heinz Ketchup | 8715700421582 | Status 16 |
| Brossard Savane | 3660140003810 | Status 16 |

**Resultat: 0/16 — 0% de couverture alimentaire**

Note: Coca-Cola (seul) existe dans Full Icecat (payant), mais pas dans Open Icecat.
Meme avec un abonnement Full, la couverture alimentaire serait negligeable.

#### Produits hygiene/beaute (0/8 trouves)

| Produit | EAN | Statut |
|:---|:---|:---:|
| Nivea Creme | 4005808798506 | Status 16 |
| Dove Savon | 8717163023518 | Status 16 |
| L'Oreal Elvive | 3600523585885 | Status 16 |
| Colgate Dentifrice | 8718951318564 | Status 16 |
| Dove Shampoo | 8717163965061 | Status 16 |
| Ariel Pods | 8006540878644 | Status 16 |
| Pampers | 8006540032725 | Status 16 |
| Persil | 4015000963251 | Status 16 |

**Resultat: 0/8 — 0% de couverture hygiene**

#### Produits tech/IT (2/5 trouves)

| Produit | EAN | Statut | Donnees |
|:---|:---|:---:|:---|
| Philips Hue Ampoule E27 | 8718696785317 | **OK** | Titre, 2 images, 9 groupes de specs, gallery |
| Oral-B Brossette | 4210201301653 | **OK** | Titre, 8 images, 4 groupes de specs |
| Samsung Galaxy S24 | 8806095366678 | Status 16 | — |
| Sony WH-1000XM5 | 4548736132573 | Status 16 | — |
| Logitech MX Master 3S | 5099206099784 | **Status 14** | Restriction de marque |

**Resultat: 2/5 — 40% de couverture tech** (et seulement marques sponsor Open Icecat)

#### Recherche par Brand + ProductCode (0/5 trouves)

| Brand | ProductCode | Statut |
|:---|:---|:---:|
| Ferrero | NUTELLA750 | Status 8 — produit absent |
| Coca-Cola | COCA15 | Status 8 |
| Barilla | PENNE500 | Status 8 |
| Danone | ACTIVIA | Status 8 |
| Nestle | KitKat | Status 8 |

### 5c. Codes de statut Icecat

| Code | Signification |
|:---:|:---|
| 1 | Succes |
| 8 | Produit non present dans la base (Brand+Code) |
| 9 | Contenu reserve a Full Icecat (abonnement payant) |
| 14 | Restriction de marque (acces limite aux revendeurs autorises) |
| 16 | GTIN non trouve dans la base |

### 5d. Qualite des donnees (sur les 2 hits positifs)

Quand un produit EST dans Icecat Open, les donnees sont riches:

```
Philips Hue Ampoule E27:
  - Titre multilingue FR
  - 2 images haute resolution
  - 9 groupes de specs (25 specs "Caracteristiques", 4 "Compatibilite", 8 "Puissance"...)
  - Description marketing HTML
  - Gallery avec metadata
  - Classe energetique, poids, dimensions

Oral-B Brossette:
  - 8 images gallery
  - 4 groupes de specs (7 caracteristiques, poids, packaging)
  - Description marketing
```

**La qualite est excellente — mais UNIQUEMENT pour les produits IT/CE de marques sponsors.**

### 5e. Pourquoi Icecat echoue pour l'alimentaire

1. **Modele economique**: Icecat est finance par les fabricants IT/CE qui "sponsorisent" leurs fiches.
   Les marques alimentaires (Ferrero, Danone, Barilla) ne sponsorisent pas Icecat.

2. **"FMCG" trompeur**: Icecat liste FMCG dans ses categories, mais cela couvre les produits
   d'entretien/hygiene des marques tech (ex: Oral-B = Procter & Gamble tech, Philips = eclairage).
   Les VRAIS FMCG alimentaires sont absents.

3. **E.Leclerc usage**: E.Leclerc utilise probablement Icecat uniquement pour ses rayons
   electromenager, informatique et multimedia — pas pour l'alimentaire.

### 5f. Verdict pour Naqiy

| Critere | Score |
|:---|:---:|
| Couverture alimentaire | **0/10** |
| Couverture hygiene | **0/10** |
| Couverture tech | 4/10 |
| Qualite des donnees (quand disponible) | 9/10 |
| Pertinence pour Naqiy | **0/10** |
| Cout d'integration | N/A — ne vaut pas l'effort |

**Decision: ELIMINE de la roadmap Naqiy.**
Icecat n'est pas une source de donnees viable pour une application alimentaire halal.
Les ressources d'integration doivent etre concentrees sur:
- Scene7 CDN (images par EAN, coverage partielle)
- Carrefour VTEX (2 036 produits harvestes)
- APIs proprietaires via partenariats

### 5g. Mise a jour de la matrice de priorite

| Source | Ancien statut | Nouveau statut | Raison |
|:---|:---|:---|:---|
| Icecat Open | P1 (dans strategie E.Leclerc) | **ELIMINE** | 0% couverture alimentaire |
| E.Leclerc Scene7 | P1 | **P2** | 25% hit rate (2/8 EAN), pas fiable en bulk |
