# Optimus Halal — World-Class App Killer 2026

> **Date** : 2026-02-16
> **Lead CTO** : Claude (Opus 4.6)
> **Round Table** : Claude + Gemini (consensus pending post-implementation review)
> **Approach** : 4 sprints (11-14) — deep data + personalization + UI
> **Target** : Surpass TagHalal (1.3M DL) + HalalOuPas on every axis

---

## Context

After 10 sprints building foundations (type safety, UI, a11y, i18n, UX polish, testing, wiring), Optimus Halal has a solid architecture. Competitor analysis reveals critical gaps that prevent us from being world-class:

- **TagHalal** (1.3M downloads): OCR ingredient scanning, E-numbers database, toxicity levels, health tracking
- **HalalOuPas**: Madhab personalization, certifier reliability evaluation, Nutri-Score integration

### Our Current Advantages (keep and amplify)
- Certifier trust score algorithm (7 indicators, 0-100) — neither competitor has this depth
- BDS boycott tracking with barcode-prefix matching — unique
- 186+ halal stores with hours (AVS + Achahada data)
- Gamification system (levels, streaks, achievements, rewards)
- Full i18n (FR/EN/AR) with RTL support

### Critical Gaps to Fill
1. **No madhab personalization** — biggest miss for a halal app
2. **Additives database is hardcoded** (50 entries in barcode.service.ts) — needs 300+
3. **No toxicity data** — no health warnings for pregnant women, children, allergics
4. **No allergen cross-matching** — user allergens exist in DB but never used
5. **halalStrictness has no UI** — exists in users table but inaccessible

---

## Pillar 1: Additives Intelligence Engine

### Current State
50 E-numbers in a `Record<string, AdditiveInfo>` inside `barcode.service.ts`:
```typescript
interface AdditiveInfo {
  name: string;
  status: "halal" | "haram" | "doubtful";
  explanation: string;
}
```

### Target State
PostgreSQL `additives` table with 300+ E-numbers, multilingual, with toxicity + origin + EFSA data.

### New Schema: `additives`

```sql
CREATE TABLE additives (
  code VARCHAR(10) PRIMARY KEY,          -- "E471"
  name_fr VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  name_ar VARCHAR(255),
  category additive_category NOT NULL,   -- colorant, preservative, sweetener, emulsifier, etc.
  halal_status_default halal_status NOT NULL, -- halal, haram, doubtful, unknown
  halal_explanation_fr TEXT,
  halal_explanation_en TEXT,
  origin additive_origin NOT NULL,       -- plant, animal, synthetic, mineral, insect, mixed
  origin_details TEXT,                   -- "Extrait d'algues marines"
  toxicity_level toxicity_level NOT NULL DEFAULT 'safe', -- safe, low_concern, moderate_concern, high_concern
  adi_mg_per_kg DOUBLE PRECISION,       -- EFSA Acceptable Daily Intake
  risk_pregnant BOOLEAN DEFAULT FALSE,
  risk_children BOOLEAN DEFAULT FALSE,
  risk_allergic BOOLEAN DEFAULT FALSE,
  health_effects_fr TEXT,               -- "Peut provoquer hyperactivité chez l'enfant"
  health_effects_en TEXT,
  efsa_status efsa_status DEFAULT 'approved', -- approved, under_review, restricted, banned
  banned_countries TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### New Enums
```sql
CREATE TYPE additive_category AS ENUM (
  'colorant', 'preservative', 'antioxidant', 'emulsifier',
  'stabilizer', 'thickener', 'flavor_enhancer', 'sweetener',
  'acid', 'anti_caking', 'glazing_agent', 'humectant',
  'raising_agent', 'sequestrant', 'other'
);

CREATE TYPE additive_origin AS ENUM (
  'plant', 'animal', 'synthetic', 'mineral', 'insect', 'mixed'
);

CREATE TYPE toxicity_level AS ENUM (
  'safe', 'low_concern', 'moderate_concern', 'high_concern'
);

CREATE TYPE efsa_status AS ENUM (
  'approved', 'under_review', 'restricted', 'banned'
);
```

### Key Additives to Seed (samples from 300+)

**Colorants (E100-E199):**
| Code | Name | Halal | Origin | Toxicity | Risk |
|---|---|---|---|---|---|
| E100 | Curcumine | halal | plant | safe | — |
| E102 | Tartrazine | halal | synthetic | moderate_concern | children (ADHD) |
| E104 | Jaune de quinoléine | halal | synthetic | moderate_concern | children |
| E110 | Jaune orangé S | halal | synthetic | moderate_concern | children |
| E120 | Carmine/Cochenille | haram | insect | low_concern | allergic |
| E122 | Azorubine | halal | synthetic | moderate_concern | children |
| E124 | Ponceau 4R | halal | synthetic | moderate_concern | children |
| E129 | Rouge allura AC | halal | synthetic | moderate_concern | children |
| E150d | Caramel sulphite | halal | plant | low_concern | — |
| E171 | Dioxyde de titane | halal | mineral | high_concern | pregnant, children |

**Preservatives (E200-E299):**
| Code | Name | Halal | Origin | Toxicity | Risk |
|---|---|---|---|---|---|
| E200 | Acide sorbique | halal | synthetic | safe | — |
| E210 | Acide benzoïque | halal | synthetic | low_concern | allergic |
| E220 | Dioxyde de soufre | halal | synthetic | moderate_concern | allergic (sulfites) |
| E249 | Nitrite de potassium | halal | synthetic | moderate_concern | pregnant |
| E250 | Nitrite de sodium | halal | synthetic | moderate_concern | pregnant |
| E270 | Acide lactique | halal | plant | safe | — |

**Emulsifiers (E400-E499) — most contested for halal:**
| Code | Name | Halal | Origin | Toxicity | Risk |
|---|---|---|---|---|---|
| E322 | Lécithine | halal | plant | safe | — |
| E407 | Carraghénane | halal | plant | low_concern | — |
| E441 | Gélatine | haram | animal | safe | — |
| E471 | Mono/diglycérides | doubtful | mixed | safe | — |
| E472a-e | Esters glycérol | doubtful | mixed | safe | — |
| E476 | Polyricinoléate | halal | plant | safe | — |

**Flavor Enhancers:**
| Code | Name | Halal | Origin | Toxicity | Risk |
|---|---|---|---|---|---|
| E621 | Glutamate de sodium | halal | synthetic | moderate_concern | children |
| E631 | Inosinate disodique | doubtful | mixed | low_concern | — |
| E635 | Ribonucléotides | doubtful | mixed | low_concern | — |
| E951 | Aspartame | halal | synthetic | moderate_concern | pregnant |
| E955 | Sucralose | halal | synthetic | low_concern | — |

**"Southampton Six"** — mandatory EU warning for ADHD risk:
E102, E104, E110, E122, E124, E129 → all `risk_children: true`, `toxicity: moderate_concern`

---

## Pillar 2: Madhab Personalization

### Schema Change: `users` table

```sql
CREATE TYPE madhab AS ENUM ('hanafi', 'shafii', 'maliki', 'hanbali', 'general');

ALTER TABLE users ADD COLUMN madhab madhab DEFAULT 'general' NOT NULL;
```

**"general"** = most conservative — follows majority scholarly opinion, treats contested items as doubtful.

### New Schema: `additive_madhab_rulings`

```sql
CREATE TABLE additive_madhab_rulings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  additive_code VARCHAR(10) REFERENCES additives(code) ON DELETE CASCADE,
  madhab madhab NOT NULL,
  ruling halal_status NOT NULL,           -- halal, haram, doubtful
  explanation_fr TEXT NOT NULL,
  explanation_en TEXT,
  scholarly_reference TEXT,               -- "SeekersGuidance, IslamQA, IIFA Resolution 225"
  UNIQUE(additive_code, madhab)
);
```

### Key Madhab Differences to Encode

**E441 (Gelatin from non-zabiha animal):**
| Madhab | Ruling | Scholarly Basis |
|---|---|---|
| Hanafi | doubtful | Debate on istihalah (chemical transformation). Some senior scholars accept, most modern Hanafi fuqaha reject. Conservative: doubtful. |
| Shafi'i | haram | Najis substance does not become pure by transformation. No istihalah exception. |
| Maliki | doubtful | Some allow via istihalah, not consensus. Modern Maliki scholars cautious. |
| Hanbali | haram | Follow Shafi'i position. Classical Hanbali fiqh: products of unslaughtered animals are impure. |

**Rennet/Présure (from non-zabiha animal, non-pig):**
| Madhab | Ruling | Scholarly Basis |
|---|---|---|
| Hanafi | halal | Imam Abu Hanifa: rennet from any lawful animal is halal regardless of slaughter method. Fatwa well-established. |
| Shafi'i | haram | Rennet from non-zabiha animal is najis. |
| Maliki | halal | Many Maliki scholars allow (similar to Hanafi position). |
| Hanbali | haram | Classical position follows Shafi'i reasoning. |

**Alcohol in food flavoring (< 0.5%, no intoxication):**
| Madhab | Ruling | Scholarly Basis |
|---|---|---|
| Hanafi | doubtful | Minute amounts that don't intoxicate — debated. Conservative Hanafi: avoid. |
| Shafi'i | haram | Any alcohol derived from grapes/dates is khamr, regardless of amount. |
| Maliki | doubtful | Some allow if amount is negligible and doesn't intoxicate. |
| Hanbali | haram | Strictest position: "What intoxicates in large quantities is haram in small quantities." |

**E120 (Carmine/Cochineal — from insects):**
All madhabs: **haram** (consensus — insects not considered halal food)

**E471 (Mono/diglycerides — when origin unknown):**
All madhabs: **doubtful** — unless product is labeled vegan (→ plant origin → halal)

### How Analysis Changes

```typescript
// Current (simplified)
analyzeHalalStatus(ingredientsText, additivesTags, labelsTags, analysisTagss)

// New signature
analyzeHalalStatus(
  ingredientsText, additivesTags, labelsTags, analysisTags,
  userMadhab: Madhab,     // NEW
  userStrictness: Strictness  // USED (was ignored before)
)
```

**Strictness overlay:**
- `relaxed`: doubtful → shown as "Probablement halal ✅" (green-yellow)
- `moderate`: doubtful → shown as "Douteux 🟡" (default)
- `strict`: doubtful → shown as "À éviter ⚠️" (orange)
- `very_strict`: only Tier 1 (certified) = "Halal ✅", everything else = "Non vérifié ⚠️"

### UI: Settings → "Mon école juridique"

```
┌──────────────────────────────────────┐
│ 🕌 École juridique (Madhab)          │
│                                      │
│ ○ Hanafi                             │
│ ○ Shafi'i                           │
│ ○ Maliki                            │
│ ○ Hanbali                           │
│ ● Général (le plus prudent)         │
│                                      │
│ ℹ️ Votre école influence l'analyse   │
│ de certains additifs comme la        │
│ gélatine (E441) et la présure.      │
│ "Général" suit l'avis majoritaire.   │
└──────────────────────────────────────┘
```

---

## Pillar 3: Toxicity & Health Alert System

### User Schema Changes

```sql
ALTER TABLE users ADD COLUMN is_pregnant BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN has_children BOOLEAN DEFAULT FALSE NOT NULL;
```

### Three-Layer Alert Architecture

**Layer 1: Per-additive toxicity badge** (always visible)
- In scan result, each additive shows a colored dot:
  - 🟢 Safe | 🟡 Low concern | 🟠 Moderate concern | 🔴 High concern

**Layer 2: Population-specific warnings** (personalized)
Cross-match user flags × additive risk flags:
```
if (additive.risk_pregnant && user.is_pregnant)
  → "⚠️ E951 (Aspartame) est déconseillé aux femmes enceintes"

if (additive.risk_children && user.has_children)
  → "⚠️ E129 (Rouge allura) peut provoquer hyperactivité chez l'enfant"

if (additive.risk_allergic && userHasAllergen("sulfites"))
  → "🚨 E220 (Sulfites) — vous êtes sensible à cet additif"
```

**Layer 3: Allergen smart-matching**
```
Product allergens (from OFF): ["en:milk", "en:nuts", "en:soybeans"]
Product traces (from OFF):    ["en:gluten", "en:eggs"]
User allergens (from profile): ["lactose", "arachides", "gluten"]

Mapping engine: normalize user terms → OFF tag format
"lactose"   → "en:milk"     ← MATCH → 🚨 Alerte
"arachides" → "en:peanuts"  ← no match
"gluten"    → "en:gluten"   ← MATCH (traces) → ⚠️ Traces possibles
```

### Allergen Normalization Map

```typescript
const ALLERGEN_NORMALIZATION: Record<string, string> = {
  // French → OFF tag
  "lactose": "en:milk",
  "lait": "en:milk",
  "arachides": "en:peanuts",
  "cacahuètes": "en:peanuts",
  "gluten": "en:gluten",
  "blé": "en:gluten",
  "oeufs": "en:eggs",
  "œufs": "en:eggs",
  "soja": "en:soybeans",
  "fruits à coque": "en:nuts",
  "noix": "en:nuts",
  "noisettes": "en:nuts",
  "amandes": "en:nuts",
  "poisson": "en:fish",
  "crustacés": "en:crustaceans",
  "mollusques": "en:molluscs",
  "céleri": "en:celery",
  "moutarde": "en:mustard",
  "sésame": "en:sesame-seeds",
  "lupin": "en:lupin",
  "sulfites": "en:sulphur-dioxide-and-sulphites",
};
```

### UI: Settings → "Profil santé"

```
┌──────────────────────────────────────┐
│ 🏥 Profil santé                      │
│                                      │
│ Situation personnelle                │
│ [toggle] Je suis enceinte            │
│ [toggle] J'ai des enfants < 6 ans    │
│                                      │
│ Mes allergènes (déjà dans settings)  │
│ → Lien vers /settings/exclusions     │
│                                      │
│ ℹ️ Ces infos personnalisent les      │
│ alertes santé lors du scan.          │
│ Aucune donnée n'est partagée.        │
└──────────────────────────────────────┘
```

---

## Pillar 4: OpenFoodFacts Deep Integration

### Additional Fields to Extract

Add to `OpenFoodFactsProduct` interface and `lookupBarcode()`:

```typescript
interface OpenFoodFactsProduct {
  // ... existing fields ...

  // NEW
  ingredients?: StructuredIngredient[];   // Structured with vegan/vegetarian
  ingredients_text_fr?: string;           // French ingredient text
  categories_tags?: string[];             // For alternatives engine
  stores?: string;                        // Where to buy
  countries_tags?: string[];              // Market availability
}

interface StructuredIngredient {
  id: string;             // "en:sugar"
  text: string;           // "sucre"
  percent_estimate?: number; // 38.35
  vegan?: string;         // "yes", "no", "maybe"
  vegetarian?: string;    // "yes", "no", "maybe"
}
```

### Smart Vegan Resolution for Doubtful Additives

When product has `ingredients_analysis_tags: ["en:vegan"]` or individual ingredient has `vegan: "yes"`:
- E471 (mono/diglycerides) → resolved as **plant origin → halal** (all madhabs)
- E472a-e (esters) → resolved as **plant origin → halal**
- E481, E570 → resolved as **plant origin → halal**

This is already partially implemented (line 298-305 of barcode.service.ts) but only for text keywords, not for the structured `additives` table.

### Nutri-Score / NOVA / Eco-Score Display

| Score | Visual | Description |
|---|---|---|
| Nutri-Score A-E | Official colored letter badge | Nutritional quality (OFF computed) |
| NOVA 1-4 | Numbered badge with description | Ultra-processing level |
| Eco-Score A-E | Leaf-colored badge | Environmental impact |

Already in `offData` — just need proper UI components.

---

## Pillar 5: Enhanced Scan Result UI

### Information Architecture (top to bottom)

```
1. HERO: Halal verdict + confidence + madhab note
   "Halal selon votre école (Hanafi) — Confiance: 95%"

2. PERSONAL ALERTS (if any)
   Red/orange cards for allergen matches + health warnings

3. SCORE BADGES (horizontal row)
   [Nutri-Score B] [NOVA 3] [Eco-Score C]

4. ADDITIVES DETAIL (expandable list)
   Per additive: code + name + halal badge + toxicity dot
   Tap → bottom sheet with full details + madhab ruling

5. BOYCOTT ALERT (if applicable)
   Red banner with company, level, reason

6. INGREDIENTS (expandable)
   Full text with highlighted haram/doubtful keywords

7. NUTRITION TABLE (expandable)
   Standard nutrition facts from OFF data

8. HALAL ALTERNATIVES (FlashList)
   Similar products in same category with better halal status

9. ACTIONS
   [❤️ Favori] [📍 Où acheter] [🚨 Signaler]
```

### Additive Detail Bottom Sheet (on tap)

```
┌──────────────────────────────────────┐
│ E471 — Mono et diglycérides         │
│ d'acides gras                        │
│                                      │
│ Catégorie: Émulsifiant               │
│ Origine: Variable (animale/végétale) │
│                                      │
│ ── Statut Halal ──────────────────── │
│ 🟡 Douteux (par défaut)             │
│ ✅ Halal pour ce produit (vegan)     │
│                                      │
│ ── Votre école (Hanafi) ──────────── │
│ "Halal si d'origine végétale.       │
│ Douteux si origine animale           │
│ non-zabiha."                         │
│ Source: SeekersGuidance              │
│                                      │
│ ── Santé ──────────────────────────── │
│ 🟢 Safe — Aucun risque connu        │
│ DJA: Non spécifiée                   │
│                                      │
│ ── Produits courants ────────────── │
│ Pain de mie, margarine, glaces      │
└──────────────────────────────────────┘
```

---

## Implementation Sprints

### Sprint 11: Additives Intelligence Engine + Madhab

**Backend:**
1. Create `additives` table + enums (Drizzle schema + migration)
2. Create `additive_madhab_rulings` table
3. Add `madhab` enum + column to `users` table
4. Add `is_pregnant`, `has_children` to `users` table
5. Seed 300+ additives with full data
6. Seed ~30 madhab-specific rulings
7. Create `additives` tRPC router: `list`, `getByCode`, `search`, `getForProduct`
8. Enhance `analyzeHalalStatus()`: query DB instead of hardcoded, accept madhab + strictness params
9. Update `scan.scanBarcode` to pass user preferences to analysis
10. Update `profile.updateProfile` to handle `madhab`, `is_pregnant`, `has_children`

**Mobile:**
11. Madhab selector screen (`/settings/madhab`)
12. Health profile screen (`/settings/health-profile`)
13. Update edit-profile to show madhab + health fields
14. Update scan result to show madhab-aware verdict

### Sprint 12: Allergen System + Enhanced Scan

**Backend:**
1. Allergen normalization service (FR/EN → OFF tags)
2. Personalized warning engine: cross-match user profile × product data
3. Scan response enriched with `personalAlerts[]`
4. Extract structured `ingredients` from OFF (vegan/vegetarian per ingredient)

**Mobile:**
5. Personalized alerts section in scan result
6. Per-additive toxicity badges in scan result
7. Additive detail bottom sheet
8. Nutri-Score / NOVA / Eco-Score badge components
9. Allergen warning chips with user-match highlighting

### Sprint 13: Product Detail + Alternatives

**Mobile:**
1. Full scan result UI redesign (new information architecture)
2. "Alternatives halal" carousel with category-based suggestions
3. "Où acheter" section with store data
4. Ingredients text with highlighted keywords
5. Expandable nutrition table

### Sprint 14: OCR + Community (future)

1. Camera-based ingredient label reading (ML Kit / expo-camera)
2. Parse ingredient text → extract E-numbers → cross-reference DB
3. Community photo contributions for products
4. Advanced product Q&A

---

## Competitive Advantage Summary

| Feature | TagHalal | HalalOuPas | **Optimus Halal** |
|---|---|---|---|
| E-numbers database | ~100 basic | ~80 basic | **300+ with toxicity + ADI + EFSA** |
| Madhab personalization | ❌ | ✅ Basic | **Per-additive scholarly rulings, 4 madhabs** |
| Toxicity levels | ❌ | ❌ | **4-tier + EFSA ADI + population warnings** |
| Pregnant/children alerts | ❌ | ❌ | **Personalized from health profile** |
| Allergen smart-matching | ❌ | ❌ | **User profile × OFF allergens cross-match** |
| Certifier trust score | ❌ | ✅ Basic | **7-indicator algorithm (0-100)** |
| Boycott tracking | ❌ | ❌ | **BDS + grassroots + barcode-prefix matching** |
| Nutri-Score / NOVA | ✅ | ✅ | **✅ Full OFF integration** |
| Store locator | ❌ | ❌ | **186+ stores with hours (AVS + Achahada)** |
| Gamification | ❌ | ❌ | **Levels, streaks, achievements, rewards** |
| i18n / RTL | ✅ FR | ✅ FR | **FR + EN + AR with full RTL** |
| OCR scanning | ✅ | ❌ | 🔜 Sprint 14 |
| Dark mode | ❌ | ❌ | **✅ Full dark mode with polish** |
| Accessibility | ❌ | ❌ | **✅ WCAG 2.2 AA** |

---

## Data Sources

- [OpenFoodFacts API v2](https://openfoodfacts.github.io/openfoodfacts-server/api/) — product data, additives, allergens, Nutri-Score
- [EFSA Food Additives](https://www.efsa.europa.eu/en/topics/topic/food-additives) — re-evaluation, ADI, safety status
- [SeekersGuidance](https://seekersguidance.org/answers/hanafi-fiqh/a-guide-for-consuming-various-meats-foods-alcohol-animal-by-product-ingredients-and-cosmetics/) — Hanafi fiqh on food additives
- [IslamQA](https://islamqa.org/) — Cross-madhab rulings
- [IIFA Resolution 225](https://iifa-aifi.org/en/6233.html) — International Islamic Fiqh Academy rulings on halal standards
- [Wikipedia: E numbers](https://en.wikipedia.org/wiki/E_number) — Reference classification
- [EFSA: Southampton Six & ADHD](https://www.efsa.europa.eu/en/topics/topic/food-additives) — Children's food coloring warnings
- [PMC: Toxicological and Teratogenic Effect of Food Additives](https://pmc.ncbi.nlm.nih.gov/articles/PMC9249520/) — Pregnancy/children risks

## Success Criteria

- [ ] 300+ additives in database with toxicity data
- [ ] 4 madhabs with per-additive scholarly rulings
- [ ] Personalized scan result (madhab + strictness overlay)
- [ ] Health alerts for pregnant women + children
- [ ] Allergen cross-matching (user profile × product)
- [ ] Nutri-Score / NOVA / Eco-Score badges
- [ ] Additive detail bottom sheet with full info
- [ ] Halal alternatives carousel
- [ ] All new features with FR + EN + AR translations
- [ ] TypeScript strict — zero `any`
- [ ] Gemini review score ≥ 8/10

## Target Score: 9.5/10+ (World-Class Killer)
