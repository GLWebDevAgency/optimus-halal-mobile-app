# Cosmetic Scanning — Feature Design & Business Case

**Date**: 2026-02-19
**Status**: Approved for future implementation
**Priority**: High — strategic feature for v2
**Estimated effort**: 2 sprints (~2-3 weeks)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Case & Market Analysis](#2-business-case--market-analysis)
3. [Competitive Landscape](#3-competitive-landscape)
4. [Revenue Projections](#4-revenue-projections)
5. [Development Perspectives](#5-development-perspectives)
6. [Technical Design](#6-technical-design)
7. [Haram Cosmetic Ingredients Database](#7-haram-cosmetic-ingredients-database)
8. [Backend Architecture](#8-backend-architecture)
9. [Mobile UI Changes](#9-mobile-ui-changes)
10. [Premium Gate Strategy](#10-premium-gate-strategy)
11. [Implementation Plan](#11-implementation-plan)
12. [Risks & Mitigations](#12-risks--mitigations)

---

## 1. Executive Summary

Extend Optimus Halal's barcode scanning from food-only to **food + cosmetics**, leveraging the Open Beauty Facts API and a new halal cosmetic ingredients database. The feature reuses 80% of the existing scan pipeline (Approach A: pipeline extension), adds a `cosmetic_ingredients` table with INCI-based halal analysis, and gates advanced cosmetic features behind Premium.

**Why now**: The halal cosmetics market is $53B (2025) growing at 11.7% CAGR. No competitor offers halal-specific cosmetic scanning. This positions Optimus Halal as the only app covering the full halal lifestyle — food + beauty.

---

## 2. Business Case & Market Analysis

### 2.1 Market Size

| Metric | Value | Source |
|---|---|---|
| Global halal cosmetics market (2025) | **$53.12 billion** | Precedence Research |
| Projected market (2034) | **$143 billion** | EIN Presswire |
| Projected market (2035) | **$163.91 billion** | Precedence Research |
| CAGR (2026-2035) | **11.67-11.89%** | Multiple sources |
| Asia-Pacific market share | **64.32%** | Precedence Research |
| Key regions | Indonesia, Malaysia, Turkey, Middle East, France, UK | Fortune Business Insights |

### 2.2 Growth Drivers

1. **Expanding Muslim middle class** — 2 billion Muslims globally, growing purchasing power
2. **Natural/organic trend** — Halal cosmetics align with clean beauty movement
3. **Awareness gap** — Most consumers don't know their cosmetics contain haram ingredients
4. **Regulatory push** — Malaysia, Indonesia, UAE mandating halal certification for cosmetics
5. **Gender opportunity** — Women represent **64% of halal cosmetic consumers**, an audience currently underserved by halal food scanning apps

### 2.3 Strategic Value for Optimus Halal

| Dimension | Impact |
|---|---|
| **Usage frequency** | From 1 scan/week (food shopping) to **3-5 scans/week** (+ daily beauty products) |
| **User retention** | Daily touchpoint = higher D7/D30 retention |
| **Premium conversion** | Cosmetic analysis = natural premium upsell gate |
| **Audience expansion** | Attracts women (64% of market) — currently underrepresented |
| **Competitive moat** | First-mover in "halal cosmetic scanning" — no direct competitor |
| **Network effects** | More scans = more products in DB = better coverage = more users |
| **Brand positioning** | From "halal food scanner" to **"halal lifestyle companion"** |

---

## 3. Competitive Landscape

### 3.1 Direct Competitors

| App | Food | Cosmetic | Halal | Revenue Model |
|---|---|---|---|---|
| **Yuka** | Yes | Yes | No | Premium ($10-50/yr), 73M users, $20M CA |
| **INCI Beauty** | No | Yes | No | Freemium, ingredient analysis |
| **Think Dirty** | No | Yes | No | Freemium + brand partnerships |
| **HalalCheck** | Yes | No | Yes | Free (limited) |
| **Scan Halal** | Yes | No | Yes | Free (limited) |
| **Optimus Halal** | Yes | **Planned** | **Yes** | Premium subscription |

### 3.2 Competitive Advantage

- **Yuka** scans cosmetics but has ZERO halal intelligence
- **HalalCheck/Scan Halal** do halal food but ZERO cosmetics
- **INCI Beauty/Think Dirty** analyze cosmetic safety but ZERO halal consideration
- **Optimus Halal** = only app combining **cosmetic scanning + halal analysis + madhab opinions**

### 3.3 Yuka Benchmark

| Metric | Yuka | Optimus Halal (target) |
|---|---|---|
| Users | 73M | 500K (Year 2) |
| Revenue | $20M/year | $200K/year (Year 2) |
| Marketing spend | $0 | $0 (organic + community) |
| Cosmetic scans/month | ~30M estimated | 500K (Year 2) |
| Differentiation | Health score | **Halal + health + madhab + boycott** |

Yuka proves that scanning apps can reach massive scale with zero marketing. The halal niche is smaller but more loyal (identity-driven usage).

---

## 4. Revenue Projections

### 4.1 Conservative Estimates (Cosmetic Feature Only)

| Metric | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| New users (cosmetic-driven) | 15,000 | 80,000 | 300,000 |
| Premium conversion (5%) | 750 | 4,000 | 15,000 |
| ARPU (monthly) | €3.99 | €3.99 | €4.99 |
| **Annual revenue** | **€36K** | **€192K** | **€898K** |
| **MRR** | **€3K** | **€16K** | **€75K** |

### 4.2 Revenue Streams Unlocked

| Stream | Timeline | Potential |
|---|---|---|
| Premium subscriptions (cosmetic tier) | Launch | €36K-898K/year |
| Brand partnerships (halal-certified brands) | Year 1+ | €10K-50K/year |
| Affiliate marketplace (halal alternatives) | Year 1+ | €5K-30K/year |
| B2B API (halal cosmetic analysis) | Year 2+ | €20K-100K/year |
| Certification-as-a-Service | Year 2+ | €50K-200K/year |

---

## 5. Development Perspectives

### 5.1 Short-term (v2.0 — 2 sprints)

- Basic cosmetic scanning with halal verdict
- INCI ingredient analysis (origin detection)
- Open Beauty Facts integration
- Premium gate on advanced features

### 5.2 Medium-term (v2.1-v2.3 — 3-6 months)

- **Halal alternatives engine** — "This lipstick is haram (carmine) → here are 3 halal alternatives"
- **Brand directory** — Searchable halal-certified cosmetic brands database
- **Skin type profiling** — Personalized alerts (sensitive skin, pregnancy-safe)
- **Photo ingredient scan** — OCR on ingredient lists when barcode not found
- **Community reviews** — Users rate and verify cosmetic halal status

### 5.3 Long-term (v3.0+ — 6-12 months)

- **Marketplace integration** — In-app purchase of halal cosmetics (affiliate model)
- **B2B API** — License the halal cosmetic analysis engine to other apps
- **Certification dashboard** — Small brands apply for Optimus Halal verification badge
- **AI ingredient analysis** — LLM-powered analysis for complex ingredient lists
- **Regional expansion** — Localized for Indonesia (BPOM), Malaysia (JAKIM), Turkey (GIMDES)
- **Halal household products** — Cleaning products, baby care, pet food (logical next categories)
- **Halal pharma** — Medication ingredient checking (huge demand, complex regulations)

### 5.4 Category Expansion Roadmap

```
v1.x  Food scanning (current)
  │
v2.0  + Cosmetics & personal care ← THIS FEATURE
  │
v2.x  + Household cleaning products
  │
v3.0  + Pharmaceuticals / supplements
  │
v3.x  + Baby & child care products
  │
v4.0  = Complete halal lifestyle platform
```

Each category reuses the same scan pipeline (Approach A) with category-specific ingredient databases and analysis rules.

---

## 6. Technical Design

### 6.1 Architecture Decision: Approach A — Pipeline Extension

Three approaches were evaluated:

| Approach | Effort | Risk | Maintenance |
|---|---|---|---|
| **A: Extend existing pipeline** | 2 sprints | Low | Single pipeline |
| B: Separate pipeline | 4 sprints | Medium | 2 pipelines |
| C: Microservice | 6 sprints | High | Distributed system |

**Decision: Approach A** — The current scan pipeline shares 80% of logic with cosmetics. Only the data source (Open Beauty Facts vs Open Food Facts) and ingredient analysis rules differ.

### 6.2 Data Model Changes

#### products table — Add product_type column

```sql
ALTER TABLE products ADD COLUMN product_type VARCHAR(20) DEFAULT 'food'
  CHECK (product_type IN ('food', 'cosmetic', 'unknown'));

CREATE INDEX idx_products_product_type ON products(product_type);
```

#### New table: cosmetic_ingredients

```sql
CREATE TABLE cosmetic_ingredients (
  inci_name    VARCHAR(200) PRIMARY KEY,   -- INCI international standard
  name_fr      TEXT,
  name_en      TEXT,
  name_ar      TEXT,
  halal_status halal_status_enum DEFAULT 'unknown',
  halal_explanation_fr TEXT,
  halal_explanation_en TEXT,
  origin       origin_enum,                -- animal, plant, synthetic, mineral, insect
  origin_details TEXT,
  category     VARCHAR(50),                -- surfactant, emollient, colorant, fragrance, preservative
  is_alcohol   BOOLEAN DEFAULT false,
  alcohol_type VARCHAR(50),                -- ethanol (haram), cetyl_alcohol (halal), etc.
  risk_pregnant  BOOLEAN DEFAULT false,
  risk_allergic  BOOLEAN DEFAULT false,
  common_products TEXT[],                  -- ['lipstick', 'shampoo', 'cream']
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);
```

#### New table: cosmetic_ingredient_madhab_rulings

```sql
CREATE TABLE cosmetic_ingredient_madhab_rulings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inci_name      VARCHAR(200) REFERENCES cosmetic_ingredients(inci_name),
  madhab         madhab_enum NOT NULL,
  ruling         halal_status_enum NOT NULL,
  explanation_fr TEXT,
  explanation_en TEXT,
  scholarly_reference TEXT,
  created_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(inci_name, madhab)
);
```

### 6.3 Open Beauty Facts Integration

**API endpoint**: `https://world.openbeautyfacts.org/api/v2/product/{barcode}.json`

**Response fields used**:
- `product_name`, `brands`, `categories`
- `ingredients_text` — raw ingredient list
- `ingredients_tags` — parsed INCI names
- `labels_tags` — may contain halal certification
- `image_url`, `image_front_url`
- `allergens_tags`, `traces_tags` — cosmetic allergens

**Lookup strategy**:
```
1. Try Open Food Facts (existing) → if found, productType = 'food'
2. If not found → Try Open Beauty Facts → if found, productType = 'cosmetic'
3. If not found → productType = 'unknown', prompt user to submit
```

---

## 7. Haram Cosmetic Ingredients Database

### 7.1 Definitive Haram (animal-derived, no halal alternative)

| INCI Name | French Name | Status | Reason | Common Products |
|---|---|---|---|---|
| Carmine / CI 75470 | Carmin | **Haram** | Insecte (cochenille écrasée) | Rouge à lèvres, blush, fard |
| Gelatin | Gélatine | **Haram** | Porcin (majorité industrielle) | Masques, capsules, gélules |
| Keratin | Kératine | **Haram** | Souvent porcin/non-halal | Shampoings, soins capillaires |
| Collagen | Collagène | **Haram** | Bovin/porcin non-certifié | Anti-âge, sérums, crèmes |
| Castoreum | Castoréum | **Haram** | Sécrétion de castor | Parfums haut de gamme |
| Musk (natural) | Musc naturel | **Haram** | Glande animale (chevrotain) | Parfums, huiles |
| Sodium Tallowate | Tallowate de sodium | **Haram** | Graisse animale (suif) | Savons |
| Tallow | Suif | **Haram** | Graisse animale | Savons, crèmes |
| Civet | Civette | **Haram** | Sécrétion animale | Parfums |
| Ambergris | Ambre gris | **Haram** | Origine baleine | Parfums |

### 7.2 Doubtful (origin matters)

| INCI Name | French Name | Status | Reason | Resolution |
|---|---|---|---|---|
| Glycerin | Glycérine | **Doubtful** | Animal ou végétal ? | Halal si "vegetable glycerin" |
| Stearic Acid | Acide stéarique | **Doubtful** | Peut être animal | Halal si source végétale confirmée |
| Squalene | Squalène | **Doubtful** | Requin vs olive | Haram si shark, halal si olive |
| Lanolin | Lanoline | **Doubtful** | Mouton (abattage halal ?) | Dépend de la source |
| Allantoin | Allantoïne | **Doubtful** | Animal ou synthétique | Halal si synthétique |
| Lecithin | Lécithine | **Doubtful** | Oeuf/soja ? | Halal si soja |
| Oleic Acid | Acide oléique | **Doubtful** | Animal ou végétal | Halal si végétal |
| Caprylic Acid | Acide caprylique | **Doubtful** | Lait de chèvre ou coco | Halal si coco |
| Palmitic Acid | Acide palmitique | **Doubtful** | Animal ou palme | Halal si palme |

### 7.3 Alcohol Rules (nuanced)

| INCI Name | Type | Status | Explanation |
|---|---|---|---|
| Alcohol / Ethanol | Enivrant | **Haram** | Alcool de fermentation |
| Alcohol Denat | Enivrant dénaturé | **Haram*** | Consensus majoritaire haram |
| Cetyl Alcohol | Alcool gras | **Halal** | Non enivrant, émollient |
| Cetearyl Alcohol | Alcool gras | **Halal** | Non enivrant, épaississant |
| Stearyl Alcohol | Alcool gras | **Halal** | Non enivrant |
| Benzyl Alcohol | Conservateur | **Doubtful** | Synthétique, débat savants |
| Phenoxyethanol | Conservateur | **Halal** | Synthétique, non enivrant |

*Note: La distinction alcool enivrant vs alcool gras est critique. Les alcools gras (cetyl, cetearyl, stearyl) sont des émollients solides — ils n'ont RIEN à voir avec l'alcool de boisson. L'app doit éduquer l'utilisateur sur cette nuance.*

### 7.4 Halal-Friendly Common Ingredients

| INCI Name | Status | Note |
|---|---|---|
| Hyaluronic Acid | Halal | Généralement biotechnologique |
| Niacinamide (Vitamin B3) | Halal | Synthétique |
| Ascorbic Acid (Vitamin C) | Halal | Synthétique/végétal |
| Retinol (Vitamin A) | Halal | Synthétique |
| Tocopherol (Vitamin E) | Halal | Végétal |
| Aloe Barbadensis | Halal | Végétal |
| Shea Butter | Halal | Végétal |
| Argan Oil | Halal | Végétal |
| Jojoba Oil | Halal | Végétal |
| Zinc Oxide | Halal | Minéral |
| Titanium Dioxide | Halal | Minéral |

---

## 8. Backend Architecture

### 8.1 Modified Files

```
backend/src/
├── services/
│   ├── barcode.service.ts           ← MODIFY: add lookupBeautyFacts() + detectProductType()
│   ├── cosmetic-analysis.service.ts ← NEW: analyzeHalalCosmeticStatus()
│   └── allergen.service.ts          ← MODIFY: add cosmetic allergen patterns
├── trpc/routers/
│   └── scan.ts                      ← MODIFY: branch on productType in scanBarcode
├── db/schema/
│   └── cosmetic-ingredients.ts      ← NEW: Drizzle schema
└── db/migrations/
    └── 0005_cosmetic_scanning.sql   ← NEW: migration
```

### 8.2 Modified Scan Pipeline

```
scanBarcode(barcode)
  │
  ├─ fetchUserProfile()                    [unchanged]
  │
  ├─ lookupProduct(barcode)
  │   ├─ Check DB (products table)
  │   ├─ If not found → lookupBarcode()    [Open Food Facts — existing]
  │   ├─ If not found → lookupBeautyFacts() [Open Beauty Facts — NEW]
  │   └─ Set productType from source
  │
  ├─ if productType === 'cosmetic':
  │   └─ analyzeHalalCosmeticStatus()      [NEW service]
  │       ├─ Tier 1: Check halal certification labels (same as food)
  │       ├─ Tier 2: INCI ingredient lookup (cosmetic_ingredients table)
  │       ├─ Tier 3: Alcohol detection + classification
  │       ├─ Tier 4: Keyword matching (haram cosmetic terms)
  │       └─ Apply strictness overlay (same as food)
  │
  ├─ if productType === 'food':
  │   └─ analyzeHalalStatus()              [unchanged]
  │
  ├─ checkBoycott()                        [unchanged]
  ├─ matchAllergens()                      [extended for cosmetic allergens]
  ├─ computeHealthAlerts()                 [extended for pregnancy/skin risks]
  ├─ updateStats() + gamification          [unchanged]
  ├─ computeMadhabVerdicts()               [extended with cosmetic rulings]
  │
  └─ return {
       ...existingPayload,
       productType: 'food' | 'cosmetic',
       cosmeticExtras?: {                  [NEW — only for cosmetics]
         inciIngredients: InciAnalysis[],
         alcoholBreakdown: AlcoholInfo[],
         originSummary: { animal: N, plant: N, synthetic: N }
       }
     }
```

### 8.3 analyzeHalalCosmeticStatus() — New Service

```typescript
// backend/src/services/cosmetic-analysis.service.ts

interface CosmeticAnalysisResult {
  status: 'halal' | 'haram' | 'doubtful' | 'unknown';
  confidence: number;
  tier: 'certified' | 'analyzed_clean' | 'doubtful' | 'haram';
  reasons: CosmeticReason[];
  certifierName: string | null;
  analysisSource: string;
  inciBreakdown: InciAnalysis[];
  alcoholBreakdown: AlcoholInfo[];
  originSummary: { animal: number; plant: number; synthetic: number; unknown: number };
}

interface InciAnalysis {
  inciName: string;
  nameFr: string;
  status: 'halal' | 'haram' | 'doubtful' | 'unknown';
  origin: 'animal' | 'plant' | 'synthetic' | 'mineral' | 'insect' | 'mixed';
  explanation: string;
  isAlcohol: boolean;
  alcoholType?: string;
}

// Analysis tiers (same pattern as food):
// Tier 1: Halal certification label check (labels_tags)
// Tier 2: INCI batch lookup from cosmetic_ingredients table
// Tier 3: Alcohol classification (enivrant vs gras)
// Tier 4: Keyword fallback for unknown ingredients
// Aggregation: worst-status-wins (haram > doubtful > halal)
```

### 8.4 Open Beauty Facts Service

```typescript
// Added to barcode.service.ts

const OPEN_BEAUTY_FACTS_API = 'https://world.openbeautyfacts.org/api/v2';

async function lookupBeautyFacts(barcode: string): Promise<BeautyFactsProduct | null> {
  // Same pattern as lookupBarcode() but different API
  // Redis cache: `obf:${barcode}` with 24h TTL
  // Returns: product_name, brands, ingredients_text, ingredients_tags,
  //          labels_tags, image_url, allergens_tags, categories
}

function detectProductType(offData: any, obfData: any): 'food' | 'cosmetic' | 'unknown' {
  if (offData) return 'food';
  if (obfData) return 'cosmetic';
  return 'unknown';
}
```

---

## 9. Mobile UI Changes

### 9.1 Scanner Screen

**No changes required.** EAN13/UPC-A barcodes are the same for food and cosmetics. The scanner is product-type agnostic.

### 9.2 Scan Result Screen — Conditional Rendering

| Section | Food | Cosmetic |
|---|---|---|
| Hero (verdict badge) | Identical | Identical |
| Product image + name | Identical | Identical |
| Certifier card | Identical | Identical |
| **Ingredients** | E-code additives | **INCI names + origin badges** |
| **Nutrition** | Nutri-Score, NOVA, Eco-Score | **Hidden** |
| **Cosmetic Info** | Hidden | **Origin summary (pie chart), alcohol breakdown** |
| Madhab opinions | Identical | Identical (cosmetic rulings) |
| Personal alerts | Allergens + health | **Skin sensitivities + pregnancy** |
| Boycott | Identical | Identical |
| Actions (favorite, share) | Identical | Identical |
| **Alternatives** | "Ou acheter?" | **"Alternatives halal" suggestions** |

### 9.3 New Components

```
optimus-halal/src/components/
├── scan/
│   ├── CosmeticIngredientCard.tsx    ← INCI name, origin badge, halal status
│   ├── OriginSummary.tsx             ← Pie/bar chart: % animal vs plant vs synthetic
│   ├── AlcoholBreakdown.tsx          ← List of alcohols with type classification
│   └── HalalAlternatives.tsx         ← Suggested halal alternatives (premium)
```

### 9.4 Conditional Logic in scan-result.tsx

```typescript
// In scan-result.tsx, add productType branching:
const isCosmetic = data?.productType === 'cosmetic';

// Nutrition section: only for food
{!isCosmetic && <NutritionSection ... />}

// Cosmetic section: only for cosmetics
{isCosmetic && (
  <>
    <OriginSummary data={data.cosmeticExtras.originSummary} />
    <AlcoholBreakdown alcohols={data.cosmeticExtras.alcoholBreakdown} />
  </>
)}

// Ingredients: different card component
{isCosmetic
  ? <CosmeticIngredientList ingredients={data.cosmeticExtras.inciBreakdown} />
  : <FoodIngredientList ingredients={data.halalAnalysis.reasons} />
}
```

---

## 10. Premium Gate Strategy

### 10.1 Feature Gating

| Feature | Free | Premium |
|---|---|---|
| Scan cosmetic (basic verdict: halal/haram/doubtful) | Yes | Yes |
| Product image + name + brand | Yes | Yes |
| Top 3 problematic ingredients | Yes | Yes |
| **Full INCI ingredient breakdown** | No (gated) | **Yes** |
| **Origin summary chart** | No | **Yes** |
| **Alcohol classification details** | No | **Yes** |
| **Madhab opinions (cosmetic)** | No | **Yes** |
| **Halal alternatives suggestions** | No | **Yes** |
| **Cosmetic scan history (>5)** | No (5 max) | **Yes (unlimited)** |
| **Favorites (cosmetic)** | No (3 max) | **Yes (unlimited)** |

### 10.2 Implementation

Uses existing `PremiumGate.tsx` component and `premiumProcedure` middleware:

```typescript
// Backend: gate detailed cosmetic data behind premium
cosmeticDetails: premiumProcedure
  .input(z.object({ productId: z.string().uuid() }))
  .query(async ({ ctx, input }) => {
    // Returns full INCI breakdown, origin chart, alternatives
    // Only accessible to premium users
  })
```

---

## 11. Implementation Plan

### Sprint C1 — Backend Foundation (1 week)

| # | Task | Files |
|---|---|---|
| 1 | Create Drizzle schema for cosmetic_ingredients + madhab_rulings | `db/schema/cosmetic-ingredients.ts` |
| 2 | Write migration 0005 | `db/migrations/0005_cosmetic_scanning.sql` |
| 3 | Seed cosmetic ingredients DB (40+ INCI entries from Section 7) | `db/seeds/cosmetic-ingredients.ts` |
| 4 | Add lookupBeautyFacts() to barcode.service.ts | `services/barcode.service.ts` |
| 5 | Create analyzeHalalCosmeticStatus() | `services/cosmetic-analysis.service.ts` |
| 6 | Modify scanBarcode to branch on productType | `trpc/routers/scan.ts` |
| 7 | Extend allergen matching for cosmetic allergens | `services/allergen.service.ts` |
| 8 | Write integration tests | `__tests__/cosmetic-scan.test.ts` |

### Sprint C2 — Mobile UI (1 week)

| # | Task | Files |
|---|---|---|
| 1 | Create CosmeticIngredientCard component | `components/scan/CosmeticIngredientCard.tsx` |
| 2 | Create OriginSummary component | `components/scan/OriginSummary.tsx` |
| 3 | Create AlcoholBreakdown component | `components/scan/AlcoholBreakdown.tsx` |
| 4 | Modify scan-result.tsx for conditional rendering | `app/scan-result.tsx` |
| 5 | Add cosmetic-specific premium gates | `components/ui/PremiumGate.tsx` |
| 6 | Update i18n translations (fr/en/ar) | `i18n/translations/*.ts` |
| 7 | Add cosmetic product type to scan history UI | `app/(tabs)/history.tsx` |
| 8 | Test on physical device with cosmetic barcodes | Manual QA |

### Testing Barcodes (Cosmetics)

| Product | Barcode | Expected Result |
|---|---|---|
| Garnier Micellar Water | 3600542399791 | Doubtful (glycerin origin unclear) |
| L'Oreal True Match Foundation | 3600523497881 | Haram (may contain carmine) |
| Nivea Cream | 4005808178223 | Doubtful (lanolin, glycerin) |
| The Ordinary Niacinamide | 769915190318 | Halal (all synthetic/plant) |
| MAC Ruby Woo Lipstick | 773602048724 | Haram (carmine CI 75470) |

---

## 12. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| Open Beauty Facts has limited product coverage | Some scans return "not found" | Medium | Fallback to user submission + community enrichment |
| INCI parsing complexity (synonyms, concentrations) | Inaccurate analysis | Medium | Start with 40+ known haram/doubtful ingredients, expand iteratively |
| Ingredient origin ambiguity (glycerin: animal or plant?) | False positives/negatives | High | Default to "doubtful" when origin unclear, let user report |
| User confusion (alcohol types) | Bad reviews | Medium | In-app education: "alcool gras ≠ alcool enivrant" tooltip |
| Halal scholars disagree on cosmetics | Trust issues | Low | Show madhab breakdown, cite scholarly references |
| Performance regression (2x API calls) | Slower scans | Low | Parallel OFF/OBF lookups, Redis caching |

---

## References

- [Precedence Research — Halal Cosmetics Market $163B by 2035](https://www.precedenceresearch.com/halal-cosmetics-market)
- [Fortune Business Insights — Halal Cosmetics Market Trends](https://www.fortunebusinessinsights.com/halal-cosmetics-market-106602)
- [EIN Presswire — $143B by 2034, 11.67% CAGR](https://www.einpresswire.com/article/888914247/halal-cosmetics-market-size-to-reach-usd-143-02-billion-by-2034-expanding-at-11-67-cagr-2026-2034)
- [Halal Guidelines — 10 Haram Ingredients in Cosmetics](https://halalguidelines.com/haram-ingredients-in-cosmetics/)
- [Open Beauty Facts — API & Database](https://world.openbeautyfacts.org/data)
- [Yuka — Independence & Revenue Model](https://yuka.io/en/independence/)
- [Yuka Press Kit 2025](https://yuka.io/wp-content/uploads/presskit/us/yuka-presskit.pdf)
- [American Halal Foundation — Cosmetics Certification](https://halalfoundation.org/insights/halal-cosmetics-makeup-certification/)
- [Sophim — Halal Cosmetics Labels & Issues](https://www.sophim.com/en/halal-cosmetics/)
