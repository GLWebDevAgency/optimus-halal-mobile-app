# Optimus Halal — Mapping des Données Scan & Stratégie Halal/Éthique

> Document de référence pour l'équipe : quelles données on récupère, comment on évalue le halal, et comment on affiche les infos.

---

## 1. Pipeline de Scan : D'où viennent les données ?

```
[Utilisateur scanne un code-barres]
        │
        ▼
[Mobile: useScanBarcode() mutation]
        │
        ▼
[Backend: scan.scanBarcode]
        │
        ├──► [1] Vérifie si le produit existe en DB (table `products`)
        │         └─► Si OUI → retourne directement
        │
        ├──► [2] Sinon → appel OpenFoodFacts API v2
        │         └─► GET /api/v2/product/{barcode}.json
        │
        ├──► [3] Analyse halal heuristique (analyzeHalalStatus)
        │
        ├──► [4] Sauvegarde produit en DB
        │
        └──► [5] Enregistre le scan + met à jour stats utilisateur
                  └─► Retourne { scan, product, isNewProduct }
```

---

## 2. Données OpenFoodFacts — Ce qu'on récupère

### 2.1 Champs actuellement extraits (`barcode.service.ts`)

| Champ OFF | Description | Utilisé dans l'app |
|-----------|-------------|-------------------|
| `product_name` | Nom du produit | Titre principal |
| `brands` | Marque(s) | Sous-titre |
| `categories` | Catégories (CSV) | Tag catégorie |
| `ingredients_text` | Liste d'ingrédients brute | **ANALYSE HALAL** + affichage |
| `image_url` | Image produit | Image de fond |
| `image_front_url` | Image face avant | Image principale (prioritaire) |
| `nutriments` | Données nutritionnelles (JSON) | Tableau nutrition |
| `nutriscore_grade` | Nutri-Score (a→e) | Badge santé |
| `nova_group` | Niveau de transformation (1→4) | Badge NOVA |
| `ecoscore_grade` | Score environnemental | Badge éco |
| `labels` | Labels (bio, halal, vegan...) | **LABELS HALAL** |
| `countries` | Pays de vente | Info provenance |
| `allergens` | Allergènes déclarés | Alerte allergène |
| `traces` | Traces possibles | Alerte traces |

### 2.2 Champs OFF disponibles mais NON encore exploités

| Champ OFF | Description | Intérêt pour Optimus |
|-----------|-------------|---------------------|
| `ingredients_analysis_tags` | Analyse auto OFF (vegan, végétarien, palm-oil) | Badges additionnels |
| `additives_tags` | Liste des additifs (E120, E471...) | **CRITIQUE pour halal** |
| `manufacturing_places` | Lieu de fabrication | Traçabilité |
| `origins` | Origine des ingrédients | Traçabilité |
| `packaging` | Type d'emballage | Éco-score |
| `stores` | Magasins où vendu | Cross-référence carte |
| `ingredients_text_fr` | Ingrédients en français | Affichage localisé |

### 2.3 Exemple concret : Nutella (3017620422003)

```json
{
  "product_name": "Nutella",
  "brands": "Ferrero, Nutella",
  "ingredients_text": "Sucre, huile de palme, NOISETTES 13%, cacao maigre 7,4%, LAIT écrémé en poudre 6,6%, LACTOSERUM en poudre, émulsifiants: lécithines [SOJA], vanilline.",
  "ingredients_analysis_tags": ["en:palm-oil", "en:non-vegan", "en:vegetarian"],
  "additives_tags": ["en:e322", "en:e322i"],
  "allergens_tags": ["en:milk", "en:nuts", "en:soybeans"],
  "labels_tags": ["en:vegetarian", "en:gluten-free", "en:no-preservatives"],
  "nutriscore_grade": "e",
  "nova_group": 4,
  "nutriments": {
    "energy-kcal_100g": 539,
    "sugars_100g": 56.3,
    "fat_100g": 30.9,
    "saturated-fat_100g": 10.6,
    "proteins_100g": 6.3,
    "salt_100g": 0.107,
    "fiber_100g": 0
  }
}
```

**Analyse halal actuelle pour Nutella :**
- `LACTOSERUM` → match "lactosérum" dans `DOUBTFUL_INGREDIENTS` → **Statut: DOUTEUX (60%)**
- Pas de gélatine, pas de porc, pas d'alcool → pas haram
- Mais le lactosérum (whey) peut être d'origine animale non-halal

---

## 3. Stratégie d'Évaluation Halal — État Actuel & Améliorations

### 3.1 Système actuel (`analyzeHalalStatus()`)

```
ingredients_text → lowercase → cherche des mots-clés
```

**Ingrédients HARAM (confiance 85%)** :
| Mot-clé | Substance | Pourquoi c'est haram |
|---------|-----------|---------------------|
| porc / pork | Viande de porc | Interdit par le Coran (Sourate 2:173) |
| gelatin / gélatine | Gélatine animale | Souvent d'origine porcine |
| lard / saindoux | Graisse de porc | Dérivé du porc |
| alcool / alcohol / ethanol | Éthanol | Substance enivrante interdite |
| wine / vin / bière / beer | Boissons alcoolisées | Khamr (intoxicant) |
| carmine / cochineal / E120 | Colorant rouge | Insecte (non halal) |
| E441 | Gélatine | Additif gélatine |
| E542 | Phosphate d'os | D'origine animale |

**Ingrédients DOUTEUX (confiance 60%)** :
| Mot-clé | Substance | Pourquoi c'est douteux |
|---------|-----------|----------------------|
| E471-E475 | Mono/diglycérides | Peuvent être d'origine animale ou végétale |
| whey / lactosérum | Petit-lait | Source animale, procédé peut impliquer présure |
| rennet / présure | Enzyme coagulante | Souvent d'origine animale |

**Si rien trouvé → HALAL (confiance 70%)**

### 3.2 Faiblesses du système actuel

| Problème | Impact | Solution proposée |
|----------|--------|-------------------|
| Analyse par mots-clés uniquement | Faux positifs/négatifs | Utiliser aussi `additives_tags` d'OFF |
| Pas de vérification des labels halal | Rate les produits certifiés | Parser `labels_tags` pour `en:halal` |
| Confiance max 85% | Jamais "certifié" | Ajouter tier certifié (100%) |
| Pas de distinction gélatine bovine/porcine | Gélatine bovine halal = marquée haram | Base de données additifs avec source |
| Aucune source d'autorité | L'utilisateur ne sait pas "par qui" | Lier aux organismes certificateurs |

### 3.3 Système amélioré proposé — 4 Tiers de confiance

```
┌─────────────────────────────────────────────────────────────┐
│                    ÉVALUATION HALAL v2                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TIER 1 — CERTIFIÉ (confiance 95-100%)                     │
│  ► Produit porte un label halal reconnu                     │
│  ► Source: labels_tags contient "en:halal"                  │
│  ► Affichage: badge vert + nom du certificateur             │
│                                                             │
│  TIER 2 — ANALYSE CLAIRE (confiance 80-90%)                │
│  ► Aucun ingrédient haram/douteux détecté                  │
│  ► Tous les additifs identifiés comme safe                  │
│  ► Source: ingredients_text + additives_tags                 │
│  ► Affichage: badge vert clair + "Analyse IA"              │
│                                                             │
│  TIER 3 — DOUTEUX (confiance 40-70%)                       │
│  ► Ingrédients à double origine (E471, whey...)            │
│  ► Additifs non vérifiables                                │
│  ► Source: match dans DOUBTFUL_INGREDIENTS                  │
│  ► Affichage: badge orange + liste des ingrédients suspects│
│                                                             │
│  TIER 4 — HARAM (confiance 85-95%)                         │
│  ► Ingrédient explicitement haram détecté                  │
│  ► Source: match dans HARAM_INGREDIENTS                     │
│  ► Affichage: badge rouge + ingrédient(s) identifié(s)     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Données additionnelles à exploiter

**`additives_tags` (d'OpenFoodFacts)** — Base d'additifs avec classification halal :

| Additif | Nom | Statut halal | Source |
|---------|-----|-------------|--------|
| E100 | Curcumine | Halal | Végétal |
| E120 | Carmine | Haram | Insecte (cochenille) |
| E160a | Bêta-carotène | Halal | Végétal |
| E322 | Lécithine (soja) | Halal | Végétal |
| E322 | Lécithine (oeuf) | Douteux | Animal |
| E441 | Gélatine | Haram* | Souvent porcin |
| E471 | Mono/diglycérides | Douteux | Origine variable |
| E472-475 | Esters | Douteux | Origine variable |
| E542 | Phosphate d'os | Haram | Animal |
| E631 | Inosinate de sodium | Douteux | Peut être animal |
| E904 | Shellac | Douteux | Insecte |

*\* sauf si certifié gélatine bovine halal*

**`labels_tags` — Labels halal reconnus à parser :**
- `en:halal` — Certification halal générique
- `en:halal-certified` — Explicitement certifié
- `fr:certifie-halal` — Version française
- `en:halal-food-authority` — HFA (UK)
- `en:muis-halal` — MUIS (Singapour)

---

## 4. Écran de Résultat Scan — Informations à Afficher

### 4.1 Structure proposée de l'écran

```
┌──────────────────────────────────────┐
│ [Image produit]                      │
│                                      │
│ 🏷️ Nutella                          │
│ Ferrero                              │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ⚠️ STATUT DOUTEUX               │ │
│ │ Confiance: 60%                   │ │
│ │                                  │ │
│ │ POURQUOI ?                       │ │
│ │ • Lactosérum (whey) détecté      │ │
│ │   → Peut être d'origine animale  │ │
│ │   → Source non vérifiable        │ │
│ │                                  │ │
│ │ PAR QUI ?                        │ │
│ │ • Analyse automatique Optimus    │ │
│ │ • Basée sur: ingredients_text    │ │
│ │   d'OpenFoodFacts                │ │
│ │                                  │ │
│ │ 🔄 Demander une vérification     │ │
│ │    par un expert                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ INGRÉDIENTS                          │
│ Sucre, huile de palme, noisettes..   │
│ [Ingrédient suspect surligné orange] │
│                                      │
│ ADDITIFS                             │
│ E322 (Lécithine) ✅ Halal - Végétal  │
│                                      │
│ NUTRITION                            │
│ Nutri-Score: E  |  NOVA: 4           │
│ [Tableau nutritionnel]               │
│                                      │
│ LABELS                               │
│ 🌿 Végétarien | 🚫 Sans gluten      │
│ [Pas de label halal]                 │
│                                      │
│ ALLERGÈNES                           │
│ ⚠️ Lait, Fruits à coque, Soja      │
│                                      │
│ ALTERNATIVES HALAL                   │
│ [Produits similaires certifiés]      │
│                                      │
│ 🚨 ÉTHIQUE                          │
│ ► Ferrero: Pas de boycott BDS actif  │
│ ► Huile de palme détectée            │
└──────────────────────────────────────┘
```

### 4.2 Sections détaillées

| Section | Source des données | Priorité |
|---------|-------------------|----------|
| **Image + Nom + Marque** | OFF: `image_front_url`, `product_name`, `brands` | P0 |
| **Statut Halal** | Backend: `halalStatus`, `confidenceScore` | P0 |
| **Pourquoi ce statut** | Backend: ingrédients suspects identifiés | P0 |
| **Par qui** | Backend: `certifierName` ou "Analyse Optimus" | P0 |
| **Ingrédients** | OFF: `ingredients_text` + surlignage | P0 |
| **Additifs** | OFF: `additives_tags` + base halal interne | P1 |
| **Nutrition** | OFF: `nutriments`, `nutriscore_grade`, `nova_group` | P1 |
| **Labels** | OFF: `labels_tags` | P1 |
| **Allergènes** | OFF: `allergens_tags`, `traces_tags` | P1 |
| **Alternatives halal** | Backend: produits similaires avec `halalStatus = halal` | P2 |
| **Info éthique / boycott** | Backend: cross-référence BDS/BoycottX | P2 |
| **Demander vérification** | Backend: `scan.requestAnalysis` | P1 |

---

## 5. Alertes Éthiques — Intégration BDS & BoycottX

### 5.1 Modèle BoycottX — Fonctionnalités à reproduire

| Feature BoycottX | Notre implémentation | Priorité |
|-----------------|---------------------|----------|
| Scanner barcode → check boycott | Cross-référencer `brands` avec base boycott | P0 |
| Liste des marques boycottées | Table `boycott_targets` dans notre DB | P0 |
| Raison du boycott | Champ `reason` + `source_url` | P0 |
| Niveau de boycott (officiel/grassroots) | Enum: `official_bds`, `grassroots`, `community` | P0 |
| Stats perso (scans, impact) | Déjà en place (gamification) | P0 |
| Suggérer une marque | `analysisRequests` existant, à étendre | P1 |
| Classement communautaire | `loyalty.leaderboard` existant | P1 |
| Historique des scans | `scan.getHistory` existant | P0 |

### 5.2 Sources de données BDS

**Source officielle : [bdsmovement.net](https://bdsmovement.net/Guide-to-BDS-Boycott)**

#### Niveau 1 — Cibles Prioritaires BDS (boycott officiel)

| Entreprise | Secteur | Raison | Marques associées |
|-----------|---------|--------|-------------------|
| **Chevron** | Pétrole | Extraction gaz en Méditerranée Est | Caltex, Texaco |
| **Intel** | Tech/Semi-conducteurs | Plus gros investisseur étranger en Israël | Intel |
| **Dell** | Tech/Matériel | Fournit l'armée israélienne ($150M 2023) | Dell, Alienware |
| **Siemens** | Industrie | Interconnecteur Euro-Asia via colonies | Siemens |
| **HP** | Tech/Impression | Supports armée, prisons, police | HP, HPE |
| **Microsoft** | Tech/Cloud | Azure + IA pour l'armée israélienne | Microsoft, Xbox, LinkedIn, GitHub |
| **Carrefour** | Distribution | Partenariat avec colonies, soutien soldats | Carrefour |
| **AXA** | Assurance | $150M+ dans Boeing, General Dynamics | AXA |
| **Disney+** | Streaming | Ambassadeurs culturels israéliens | Disney, Marvel, Star Wars, Hulu |
| **SodaStream** | Boissons | Déplacement Bédouins-Palestiniens | SodaStream |
| **RE/MAX** | Immobilier | Vente immobilier dans colonies | RE/MAX |

#### Niveau 2 — Boycott Populaire (grassroots, soutenu par BDS)

| Entreprise | Marques associées |
|-----------|-------------------|
| **McDonald's** | McDonald's |
| **Coca-Cola** | Coca-Cola, Fanta, Sprite, Minute Maid |
| **Burger King** | Burger King |
| **Papa John's** | Papa John's |
| **Pizza Hut** | Pizza Hut |
| **Domino's** | Domino's |
| **WIX** | WIX |

#### Niveau 3 — Cibles Pression (campagnes en cours)

| Entreprise | Raison |
|-----------|--------|
| **Google** | Projet Nimbus — IA pour armée |
| **Amazon** | Projet Nimbus — cloud pour armée |
| **Booking.com** | Locations dans colonies |
| **Airbnb** | Locations dans colonies |
| **Teva Pharma** | Soutien génocide + marché captif palestinien |

### 5.3 Schéma DB proposé — `boycott_targets`

```sql
CREATE TABLE boycott_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identité
  company_name VARCHAR(255) NOT NULL,
  brands TEXT[] NOT NULL,               -- ["Coca-Cola", "Fanta", "Sprite"]
  parent_company VARCHAR(255),          -- "The Coca-Cola Company"
  sector VARCHAR(100),                  -- "Boissons"
  logo_url TEXT,

  -- Classification boycott
  boycott_level VARCHAR(20) NOT NULL,   -- 'official_bds' | 'grassroots' | 'pressure' | 'community'
  severity VARCHAR(20) DEFAULT 'warning', -- 'critical' | 'warning' | 'info'

  -- Contexte
  reason TEXT NOT NULL,                 -- Explication complète
  reason_summary VARCHAR(500),          -- Version courte pour l'app
  source_url TEXT,                      -- Lien source (bdsmovement.net, etc.)
  source_name VARCHAR(100),             -- "BDS Movement", "Ethical Consumer", etc.

  -- Matching
  barcode_prefixes TEXT[],              -- Préfixes EAN pour matching rapide
  off_brand_tags TEXT[],                -- Tags OpenFoodFacts pour cross-ref

  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by VARCHAR(100)              -- "BDS Official", "Community", etc.
);

CREATE INDEX boycott_targets_brands_idx ON boycott_targets USING GIN (brands);
CREATE INDEX boycott_targets_level_idx ON boycott_targets (boycott_level);
```

### 5.4 Intégration dans le flux de scan

```
[Scan barcode]
      │
      ▼
[Lookup produit → obtient `brands`]
      │
      ▼
[Cross-ref brands avec boycott_targets.brands]
      │
      ├── Match trouvé → Afficher alerte éthique
      │   • Niveau de boycott (officiel/grassroots/pression)
      │   • Raison détaillée
      │   • Source (lien vers BDS, etc.)
      │   • Alternatives suggérées
      │
      └── Pas de match → Pas d'alerte éthique
```

### 5.5 Sources de données externes à intégrer

| Source | URL | Type de données | Fréquence MAJ |
|--------|-----|----------------|---------------|
| **BDS Movement** | [bdsmovement.net](https://bdsmovement.net/Guide-to-BDS-Boycott) | Liste officielle boycott | Mensuelle |
| **Boycat App** | [boycat.io](https://boycat.io/) | Barcode → boycott matching | Temps réel (scraping/API) |
| **Ethical Consumer** | [ethicalconsumer.org](https://www.ethicalconsumer.org/ethical-campaigns-boycotts/palestine-boycott-list) | Liste éthique élargie | Mensuelle |
| **Who Profits** | [whoprofits.org](https://www.whoprofits.org) | Recherche entreprises en colonies | Trimestrielle |
| **USCPR** | [uscpr.org](https://uscpr.org/activist-resource/boycott-divestment-and-sanctions/) | Ressources boycott USA | Mensuelle |

---

## 6. Résumé des Actions Prioritaires

### Backend

| Action | Fichier | Priorité |
|--------|---------|----------|
| Exploiter `additives_tags` d'OFF | `barcode.service.ts` | P0 |
| Parser `labels_tags` pour halal | `barcode.service.ts` | P0 |
| Créer base additifs halal/haram | `db/schema/additives.ts` (nouveau) | P0 |
| Créer table `boycott_targets` | `db/schema/boycott.ts` (nouveau) | P0 |
| Router `boycott.check` | `trpc/routers/boycott.ts` (nouveau) | P0 |
| Enrichir `analyzeHalalStatus` v2 | `barcode.service.ts` | P1 |
| Intégrer `certifierName` si label halal | `scan.scanBarcode` | P1 |
| Ajouter score confiance tiers | `products` schema | P1 |

### Mobile

| Action | Fichier | Priorité |
|--------|---------|----------|
| Afficher "Pourquoi" ce statut | `scan-result.tsx` | P0 |
| Afficher "Par qui" (certificateur/IA) | `scan-result.tsx` | P0 |
| Section additifs avec statut halal | `scan-result.tsx` | P1 |
| Section boycott/éthique dans résultat scan | `scan-result.tsx` | P0 |
| Section allergènes | `scan-result.tsx` | P1 |
| Nutrition (Nutri-Score, NOVA) | `scan-result.tsx` | P2 |
| Alternatives halal | `scan-result.tsx` | P2 |

---

## 7. Questions ouvertes

1. **Gélatine bovine halal** — Comment distinguer gélatine porcine vs bovine halal ? OFF ne précise pas l'origine. → Solution: base de données produits avec override communautaire
2. **E471 végétal vs animal** — Même problème. → Solution: si le produit est labellisé "vegan" dans OFF, E471 = végétal
3. **Fréquence MAJ boycott** — Scraping BDS/Boycat ou saisie manuelle ? → Recommandation: saisie manuelle validée + webhook Boycat si API dispo
4. **Statut halal des marques de distributeur** — Carrefour est boycotté BDS, mais un produit Carrefour Bio peut être halal. Séparer produit vs enseigne.
5. **Multi-certification** — Certains produits ont plusieurs labels (AVS, SFCVH, MUI). Afficher lequel en priorité ?
