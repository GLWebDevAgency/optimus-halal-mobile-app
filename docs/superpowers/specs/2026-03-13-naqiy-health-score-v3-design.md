# Naqiy Health Score V3 + Alert Pill Strip + Health Card Redesign

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Three interconnected changes to the scan-result screen:
1. **Health Score V3** — Fix the scoring formula (Coca-Cola 72→~15), remove transparency axis, add category-specific weighting, Yuka-level additive penalties
2. **Alert Pill Strip** — Replace massive BoycottCard + separate AlertStripCard with a single compact horizontal pill strip
3. **Health & Nutrition Card** — Redesign from basic card to premium gradient-bar + grid-tile dashboard with Phosphor icons and NutriScore/NOVA badge strips

**Architecture:** Backend formula rewrite (4 axes, category-aware interpolation, beverage sugar bonus axis), mobile alert unification (one component, profile-driven visibility), mobile health card redesign (ScoreRing + gradient bar + axis tiles + badge strips + nutrient grid).

---

## Table of Contents

1. [Section 1: Health Score V3 Formula](#1-health-score-v3-formula)
2. [Section 2: Alert Pill Strip](#2-alert-pill-strip)
3. [Section 3: Health & Nutrition Card UI](#3-health--nutrition-card-ui)
4. [Component Architecture](#4-component-architecture)
5. [Data Flow & Props](#5-data-flow--props)
6. [i18n Keys](#6-i18n-keys)
7. [Edge Cases](#7-edge-cases)
8. [Files to Create/Modify/Delete](#8-files-to-createmodifydelete)

---

## 1. Health Score V3 Formula

### 1.1 Diagnosis — Why V2 Fails

Three root causes make Coca-Cola score 72/100 instead of ~15:

| Bug | Impact | Example |
|-----|--------|---------|
| `interpolateNutritionPoints` uses general food grade boundaries for ALL products | Beverage with raw=13 (grade E at ≥10) gets ~10pts instead of ~0pts | Coca-Cola nutrition axis: ~10/40 instead of ~2/40 |
| Transparency axis adds 10 "free" points for well-documented products | Unhealthy but well-documented products get inflated | Coca-Cola gets +8/10 transparency for having ingredients, nutrition, allergens |
| No category-specific weighting | Beverages, oils, chocolate all scored identically | Sugar impact identical for water vs soda |

### 1.2 V3 Formula — 4 Axes

**Remove transparency axis entirely.** Data completeness is a metadata quality signal, not a health indicator. It should influence `dataConfidence` only.

#### Category Mapping

The existing `NutriScoreCategory` type in `nutriscore.service.ts` has 5 values: `"general" | "beverages" | "fats_oils_nuts" | "cheese" | "red_meat"`. V3 uses these as-is (no renaming) and adds a mapping function:

```typescript
import { type NutriScoreCategory } from "./nutriscore.service.js";

// V3 uses NutriScoreCategory directly — no separate ProductCategory type
type HealthScoreCategory = NutriScoreCategory; // "general" | "beverages" | "fats_oils_nuts" | "cheese" | "red_meat"
```

#### Axis 1: Profil Nutritionnel (50-60 pts, category-dependent) — Category-Aware

The core fix: `interpolateNutritionPoints` must use category-specific grade boundaries. The nutrition axis max varies by category (see weight table below): 60 for general/red_meat, 50 for beverages (which have the separate sugar axis), 55 for fats_oils_nuts/cheese.

**Grade boundaries by category** (from `nutriscore.service.ts`):

| Category | A | B | C | D | E |
|----------|---|---|---|---|---|
| general | ≤0 | 1-2 | 3-10 | 11-18 | ≥19 |
| beverages | water (special-cased) | ≤2 | 3-6 | 7-9 | ≥10 |
| fats_oils_nuts | ≤-6 | -5 to 2 | 3-10 | 11-18 | ≥19 |
| cheese | same as general | same | same | same | same |
| red_meat | same as general | same | same | same | same |

**Water handling:** Water is special-cased in `nutriscore.service.ts` (always grade A, before grade lookup). In V3, water remains excluded from health scoring by `checkScoreExclusion` — no change needed.

**New interpolation** — each category maps raw NutriScore to 0-nutritionMax Naqiy points using its own grade boundaries:

```typescript
const CATEGORY_NUTRITION_MAX: Record<HealthScoreCategory, number> = {
  general: 60, beverages: 50, fats_oils_nuts: 55, cheese: 55, red_meat: 60,
};

const GRADE_BOUNDARIES: Record<HealthScoreCategory, Record<NutriScoreGrade, [number, number]>> = {
  general:       { a: [-Infinity, 0], b: [1, 2], c: [3, 10], d: [11, 18], e: [19, Infinity] },
  beverages:     { a: [-Infinity, -Infinity], b: [-Infinity, 2], c: [3, 6], d: [7, 9], e: [10, Infinity] },
  fats_oils_nuts:{ a: [-Infinity, -6], b: [-5, 2], c: [3, 10], d: [11, 18], e: [19, Infinity] },
  cheese:        { a: [-Infinity, 0], b: [1, 2], c: [3, 10], d: [11, 18], e: [19, Infinity] },
  red_meat:      { a: [-Infinity, 0], b: [1, 2], c: [3, 10], d: [11, 18], e: [19, Infinity] },
};

/** Returns point ranges scaled to the category's nutrition max */
function getGradePointRanges(nutritionMax: number): Record<NutriScoreGrade, [number, number]> {
  const m = nutritionMax;
  return {
    a: [m, m],                                          // Always max
    b: [Math.round(m * 0.78), Math.round(m * 0.98)],   // ~78-98%
    c: [Math.round(m * 0.42), Math.round(m * 0.77)],   // ~42-77%
    d: [Math.round(m * 0.17), Math.round(m * 0.41)],   // ~17-41%
    e: [0, Math.round(m * 0.16)],                       // ~0-16%
  };
}

function interpolateNutritionPointsV3(
  raw: number,
  grade: NutriScoreGrade,
  category: HealthScoreCategory,
): number {
  const nutritionMax = CATEGORY_NUTRITION_MAX[category];
  const [lo, hi] = GRADE_BOUNDARIES[category][grade];
  const [ptsLo, ptsHi] = getGradePointRanges(nutritionMax)[grade];
  if (lo === hi || lo === -Infinity) return ptsHi; // A or single-point grade
  if (hi === Infinity) {
    // Grade E: decay from ptsHi toward 0 as raw increases beyond lo
    const overshoot = raw - lo;
    return Math.max(0, ptsHi - Math.round(overshoot * 0.5));
  }
  const t = 1 - Math.min(1, Math.max(0, (raw - lo) / (hi - lo)));
  return Math.round(ptsLo + t * (ptsHi - ptsLo));
}
```

**Coca-Cola example:** raw=13, grade=E (beverages, nutritionMax=50), boundaries [10, ∞)

- `ptsHi = round(50 * 0.16) = 8`
- Grade E with Infinity: `overshoot = 13 - 10 = 3`, `pts = max(0, 8 - round(3*0.5)) = max(0, 8-2) = 6`
- Final: **6/50** (vs V2: ~10/40 with wrong boundaries)

vs V2: raw=13, grade=E, general boundaries [19, ∞) → pts ≈ **10/40** (way too generous)

#### Axis 2: Risque Additifs (20 pts) — Yuka-Inspired 4-Tier

Keep current logic but adjust weights and add Yuka patterns:

| Toxicity | V2 penalty | V3 penalty | Source |
|----------|-----------|-----------|--------|
| safe | 0 | 0 | — |
| low_concern | 2 | 1.5 | EFSA "no concern at current levels" |
| moderate_concern | 5 | 4 | EFSA "some concern" / IARC group 2B |
| high_concern | 10 | 8 | EFSA "concern" / IARC group 2A/1 |
| banned | instant 0 | instant 0 (early return preserved) | EFSA withdrawn / EU banned |

**Yuka patterns to adopt:**

- **Score cap at 49** if any `high_concern` additive present (already in V2, keep)
- **Score cap at 25** if any `banned` additive present (new, stricter — in addition to axis early-return to 0/20)
- `efsaStatus === "restricted"` → penalty × 1.3 (was 1.5, slightly softer)

**Banned behavior detail:** When a banned additive is found, `computeAdditivesAxis` returns immediately with `{ score: 0, max: 20 }` (early return, same pattern as V2). Additionally, the final score is capped at 25 (stricter than the high_concern cap of 49).

Max penalty capped at 20 (axis max).

#### Axis 3: Transformation NOVA (10 pts)

| NOVA | Points | Rationale |
|------|--------|-----------|
| 1 (unprocessed) | 10 | Ideal |
| 2 (processed ingredients) | 7 | Cooking oils, butter |
| 3 (processed foods) | 4 | Canned vegetables, cheese |
| 4 (ultra-processed) | 0 | Coca-Cola, chips |

Reduced from 15 to 10 pts — NOVA is a useful signal but shouldn't dominate.

#### Axis 4: Sucres Boisson (20 pts) — NEW, Beverages Only

Beverages deserve extra sugar penalty beyond what NutriScore captures. Inspired by Yuka's category-specific handling.

**For beverages only**, score based on sugars per 100ml:

| Sugars/100ml | Points | Examples |
|-------------|--------|---------|
| 0 | 20 | Sparkling water |
| ≤1 | 17 | Sparkling water with hint |
| ≤2.5 | 14 | Light iced tea |
| ≤5 | 10 | Kombucha |
| ≤7.5 | 5 | Orange juice |
| ≤10 | 2 | Regular iced tea |
| >10 | 0 | Coca-Cola (10.6g), energy drinks |

**For non-beverages**, this axis doesn't apply. Its 20 pts are redistributed to Axis 1 (Nutrition gets 60 pts for general foods; beverages split as 50 nutrition + 20 beverage sugar + 20 additifs + 10 NOVA).

#### Category-Specific Weight Redistribution

| Axis | general | beverages | fats_oils_nuts | cheese | red_meat |
|------|---------|-----------|----------------|--------|----------|
| Nutrition | 60 pts | 50 pts | 55 pts | 55 pts | 60 pts |
| Additifs | 20 pts | 20 pts | 15 pts | 15 pts | 20 pts |
| NOVA | 10 pts | 10 pts | 10 pts | 10 pts | 10 pts |
| Sucres boisson | — | 20 pts | — | — | — |
| **Total base** | **90** | **100** | **80** | **80** | **90** |

#### Normalization & Bonus Application

The formula is applied in this exact order:

```
1. Sum axis scores → totalScore / totalMax
2. Normalize: baseScore = round((totalScore / totalMax) × 90)
3. Add bonuses: baseScore += bio bonus (+7) + aop bonus (+3)  ← AFTER normalization
4. Add profile: baseScore += profileDelta ([-10, +10])
5. Apply caps: if high_concern → min(score, 49); if banned → min(score, 25)
6. Final clamp: max(0, min(100, score))
```

**Bio/AOP bonuses are added AFTER normalization**, not before. They don't increase totalMax. This means a perfect non-organic general food = `(90/90)×90 = 90`, and with bio = `90 + 7 = 97`. A perfect organic general food with athlete profile = `90 + 7 + 5 = 100` (clamped).

#### Bonus/Malus System

| Modifier | Points | Condition |
|----------|--------|-----------|
| Bio/Organic | +7 | `labels` contains organic/bio certification |
| AOP/AOC/IGP | +3 | Protected designation labels |
| High concern additive | cap 49 | Any high_concern additive present |
| Banned additive | cap 25 | Any banned additive present |
| Anomaly detected | -5 to -15 | Nutrient anomalies (suspicious/impossible) |

#### Profile Adjustment ([-10, +10]) — Keep from V2

Same as V2 — profiles: `"standard" | "pregnant" | "child" | "athlete" | "elderly"` (same `UserNutritionProfile` type, no changes). Profile-specific adjustments based on pregnancy risk additives, children risk, etc.

#### Confidence Levels — Transparency Becomes Confidence

The removed transparency axis data feeds into confidence instead:

| Confidence | Criteria |
|-----------|---------|
| high | NutriScore computed + NOVA available + ingredients list |
| medium | NutriScore computed OR NOVA available |
| low | Only OFF grade fallback |
| very_low | No nutrition data at all |

Anomalies degrade confidence (same as V2).

#### HealthScoreInput Changes

The existing `HealthScoreInput` interface needs these additions:

```typescript
interface HealthScoreInput {
  // ... existing fields unchanged ...
  labels?: string[];              // NEW — product labels for bio/aop detection
  sugars100g?: number | null;     // Already available from nutriments, but explicit for beverage sugar axis
}
```

The `categories` field (already `string | null | undefined`) is used to detect the `HealthScoreCategory` via the existing `detectCategory()` from `nutriscore.service.ts` (must be exported).

### 1.3 Expected Scores After V3

**Note:** Water, alcohol, baby food, and non-food products remain excluded by `checkScoreExclusion` — they don't receive a health score.

| Product | V2 Score | V3 Score | Breakdown |
|---------|----------|----------|-----------|
| Coca-Cola | 72 | ~15 | Nutrition 6/50 + Additifs 17/20 (E150D+E338 low_concern) + NOVA 0/10 + Sucres 0/20 (10.6g>10) = 23/100 → (23/100)×90 = **21**, no bonuses, no profile = **~21** |
| Yaourt nature bio | 78 | ~76 | Nutrition ~42/60 + Additifs 20/20 + NOVA 7/10 = 69/90 → (69/90)×90 = 69 + bio +7 = **76** |
| Nutella | 55 | ~21 | Nutrition ~5/60 (grade E general) + Additifs 16/20 + NOVA 0/10 = 21/90 → (21/90)×90 = **21** |
| Huile d'olive bio | 70 | ~80 | Fats: Nutrition ~40/55 + Additifs 15/15 + NOVA 10/10 = 65/80 → (65/80)×90 = 73 + bio +7 = **80** |
| Chips industrielles | 45 | ~19 | Nutrition ~5/60 + Additifs 14/20 + NOVA 0/10 = 19/90 → (19/90)×90 = **19** |

---

## 2. Alert Pill Strip

### 2.1 Design

Replace `BoycottCard` (massive red GlowCard ~200px) + `AlertStripCard` (separate component) with a single `AlertPillStrip` component — a horizontal scrollable row of compact pills (~56px height).

### 2.2 Pill Types

| Type | Color | Icon | Example Label |
|------|-------|------|--------------|
| `boycott` | `#ef4444` (red) | `HandHeartIcon` (Phosphor) | "Boycott · Coca-Cola" |
| `allergen` | `#f97316` (orange) | `WarningCircleIcon` (Phosphor) | "Gluten détecté" |
| `health` | `#3b82f6` (blue) | `PillIcon` (Phosphor) | "E150d · Grossesse" |

### 2.3 Pill Anatomy

```
┌─────────────────────────────────────┐
│ [icon ○] Label text            ›    │  ← 36px height, border-radius: 20
└─────────────────────────────────────┘
```

- **Container**: `background: rgba(color, 0.08)`, `border: 1px solid rgba(color, 0.2)`, `borderRadius: 20`, `paddingHorizontal: 12`, `paddingVertical: 6`
- **Icon circle**: 20×20, `background: rgba(color, 0.15)`, centered icon 11px
- **Label**: `fontSize: 12`, `fontWeight: 600`, color matching type
- **Chevron**: `fontSize: 10`, faded color, indicates tappable → opens detail bottom sheet

### 2.4 Behavior

- **Always visible** if data exists — boycott visibility controlled by user profile settings, not UI logic
- **Horizontal scroll** — `ScrollView horizontal` with `showsHorizontalScrollIndicator={false}`
- **Order**: boycott first (if present), then allergens, then health alerts
- **Tap**: Opens relevant bottom sheet (BoycottDetailSheet / AllergenDetailSheet / HealthAlertSheet)
- **Entry animation**: `FadeInRight` staggered by index × 80ms

### 2.5 Integration Point

In `scan-result.tsx`, replace:

```tsx
{boycott?.isBoycotted && <BoycottCard boycott={boycott} staggerIndex={1} />}
{alertItems.length > 0 && <AlertStripCard alerts={alertItems} staggerIndex={2} />}
```

With:

```tsx
{allAlerts.length > 0 && <AlertPillStrip alerts={allAlerts} staggerIndex={1} />}
```

Where `allAlerts` merges boycott alert (if active) + profile allergen alerts + health alerts into a single `PersonalAlert[]` array.

---

## 3. Health & Nutrition Card UI

### 3.1 Design — Option B: Gradient Bar + Grid Tiles

Complete redesign of `HealthNutritionCard.tsx` into a premium dashboard card.

### 3.2 Layout (top to bottom)

```
┌────────────────────────────────────────┐
│  SANTÉ & NUTRITION              V3     │  ← Section header
├────────────────────────────────────────┤
│                                        │
│  ┌─ ScoreRing ──┐  Score: 21/100       │
│  │    ◯ 21      │  Label: "Médiocre"   │  ← Score hero area
│  └──────────────┘  Confiance: Medium   │
│                                        │
│  ┌─ Gradient Bar ─────────────────┐    │
│  │ ██████░░░░░░░░░░░░░░░░░░░░░░░ │    │  ← Red→Yellow→Green, indicator dot
│  │   ▲                            │    │
│  └────────────────────────────────┘    │
│                                        │
│  ┌─ Axis Tiles (2×2 grid) ───────┐    │
│  │ 🍎 Nutrition   │ 🧪 Additifs  │    │
│  │    6/50        │    17/20     │    │  ← Phosphor icons, mini progress bar
│  ├────────────────┼──────────────┤    │
│  │ 🏭 Transfo     │ 💧 Sucres    │    │
│  │    0/10        │    0/20     │    │  ← Beverage-only 4th tile
│  └────────────────┴──────────────┘    │
│                                        │
│  ┌─ Bio Bonus (conditional) ─────┐    │
│  │  🌿 Bonus Bio           +7    │    │  ← Only if organic certified
│  └────────────────────────────────┘    │
│                                        │
│  ┌─ Badge Strip ─────────────────┐    │
│  │ [A][B][C][D][E]  NutriScore   │    │  ← Active grade highlighted
│  │ [1][2][3][4]     NOVA         │    │  ← Active group highlighted
│  │ [A][B][C][D][E]  Eco-Score    │    │  ← If available
│  └────────────────────────────────┘    │
│                                        │
│  ┌─ Dietary Chips ───────────────┐    │
│  │ Végétarien  Sans gluten  Bio  │    │  ← Horizontal chip row
│  └────────────────────────────────┘    │
│                                        │
│  ┌─ Nutrient Grid (2×2) ─────────┐    │
│  │ Sucres 10.6g   │ Graisses 0g  │    │
│  │ ████████░░     │ ░░░░░░░░░░  │    │  ← Color-coded by level
│  ├────────────────┼──────────────┤    │
│  │ Sel 0.02g      │ Fibres 0g    │    │
│  │ ░░░░░░░░░░     │ ░░░░░░░░░░  │    │
│  └────────────────┴──────────────┘    │
│                                        │
│  ┌─ "Voir le détail" CTA ────────┐    │
│  │      Voir le détail  ›        │    │  ← Opens NutrientDetailSheet
│  └────────────────────────────────┘    │
└────────────────────────────────────────┘
```

### 3.3 Sub-Components

#### ScoreRing (existing, enhanced)

- Reuse existing `ScoreRing.tsx` with V3 score
- Color follows score: 0-25 red, 26-50 orange, 51-75 yellow-green, 76-100 green

#### Gradient Bar

- `LinearGradient` from `#ef4444` → `#f97316` → `#eab308` → `#22c55e`
- White circle indicator positioned at `score%` along the bar
- `height: 8`, `borderRadius: 4`

#### Axis Tiles (2×2 Grid)

Each tile:

- Phosphor icon (Apple for Nutrition, Flask for Additifs, Factory for Transformation, Drop for Sucres boisson)
- Label + score (e.g., "Nutrition 6/50")
- Mini progress bar colored by percentage
- Background: `rgba(color, 0.04)` with `borderRadius: 12`
- The 4th tile (Sucres boisson) only appears for beverages; for non-beverages the grid is 2×1 + 1 full-width

#### Badge Strips (NutriScore / NOVA / Eco-Score)

Yuka-inspired compact strip:

```
[A][B][C][D][E]   ← 5 small rects, active one full color + larger
```

- Each grade: `width: 28, height: 24, borderRadius: 4`
- Active grade: full background color, white bold letter, `scale: 1.15`
- Inactive: `rgba(gray, 0.1)`, gray letter, `opacity: 0.5`
- NutriScore colors: A=#038141, B=#85BB2F, C=#FECB02, D=#EE8100, E=#E63E11
- NOVA: 1=#038141, 2=#85BB2F, 3=#EE8100, 4=#E63E11
- Eco-Score is purely display (not part of V3 formula), shown if data available

#### Nutrient Grid

- 2×2 grid: Sucres, Graisses sat., Sel, Fibres
- Each cell: value + unit, colored mini bar
- Bar color: green (low) / orange (moderate) / red (high) based on NutriScore thresholds
- Tap any cell → opens `NutrientDetailSheet`

### 3.4 Dark Mode

- Card background: `surface.secondary` (dark gray)
- Gradient bar: same colors, slightly more saturated
- Axis tiles: `rgba(color, 0.08)` background
- Badge strips: darker inactive backgrounds
- Gold accent on section header (existing pattern from `2026-03-12-naqiy-signature-scan-result-design.md`)

---

## 4. Component Architecture

```
scan-result.tsx (orchestrator)
├── VerdictHero
├── AlertPillStrip              ← NEW (replaces BoycottCard + AlertStripCard)
│   ├── AlertPill (boycott)
│   ├── AlertPill (allergen)
│   └── AlertPill (health)
├── HalalVerdictCard
├── AlternativesSection
├── HealthNutritionCard         ← REWRITE
│   ├── ScoreRing (existing)
│   ├── GradientBar             ← NEW sub-component
│   ├── AxisTile × 3-4          ← NEW sub-component
│   ├── BonusBadge              ← NEW sub-component (conditional)
│   ├── BadgeStrip              ← NEW sub-component (NutriScore/NOVA/Eco)
│   ├── DietaryChips            ← NEW sub-component
│   └── NutrientGrid            ← NEW sub-component
├── AdditivesCard
├── HalalDetailCard
└── CommunityVoteCard
```

### Key Decisions

- `AlertPillStrip` is a flat component, not a card — it sits between VerdictHero and HalalVerdictCard
- `HealthNutritionCard` remains a single file but composed of inline sub-components (no separate files unless >100 lines)
- `GradientBar` and `BadgeStrip` are reusable enough to be extracted to `src/components/scan/` if needed elsewhere

---

## 5. Data Flow & Props

### AlertPillStrip

```typescript
interface AlertPillStripProps {
  alerts: PersonalAlert[];  // merged boycott + allergen + health
  staggerIndex?: number;
}

// PersonalAlert type (update scan-types.ts) — data only, no callbacks:
interface PersonalAlert {
  type: "allergen" | "health" | "boycott";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  icon?: string;        // Phosphor icon name override (optional)
}
// Note: onPress handlers live in AlertPillStrip component, not on the data type.
// The component maps alert.type → appropriate bottom sheet opener.
```

### HealthNutritionCard V3

```typescript
interface HealthNutritionCardProps {
  healthScore: {
    score: number;          // 0-100
    label: string;
    axes: {
      nutrition: { score: number; max: number; grade?: string } | null;
      additives: { score: number; max: number; hasHighConcern: boolean };
      processing: { score: number; max: number } | null;
      beverageSugar?: { score: number; max: number }; // beverages only
    };
    bonuses: { bio: number; aop: number };
    dataConfidence: "high" | "medium" | "low" | "very_low";
    cappedByAdditive: boolean;
    category: HealthScoreCategory;
  };
  nutriScoreGrade?: string;
  novaGroup?: number;
  ecoScoreGrade?: string;
  nutriments?: Record<string, number | string>;
  labels?: string[];       // dietary labels (vegan, gluten-free, etc.)
  staggerIndex?: number;
}
```

### Backend V3 Output Changes

The `computeHealthScore` function return type changes:

```typescript
// REMOVED: transparency axis
// ADDED: beverageSugar axis (conditional)
// ADDED: bonuses object
// ADDED: category field
// CHANGED: nutrition max 40 → category-dependent (50-60)
interface HealthScoreResult {
  score: number;
  label: string;
  axes: {
    nutrition: { score: number; max: number; grade?: NutriScoreGrade; source: string } | null;
    additives: { score: number; max: number; penalties: string[]; hasHighConcern: boolean };
    processing: { score: number; max: number; source: string } | null;
    beverageSugar?: { score: number; max: number };
    profile: ProfileAdjustment;
    // REMOVED: transparency
  };
  bonuses: { bio: number; aop: number };
  dataConfidence: "high" | "medium" | "low" | "very_low";
  cappedByAdditive: boolean;
  nutriScoreDetail?: NutriScoreResult;
  category: HealthScoreCategory;
}
```

**Breaking change:** The `transparency` axis is removed from the response. Frontend consumers that read `axes.transparency` will get `undefined`. The `ScoreDetailBottomSheet` (opened by health card's "Voir le détail" CTA — note: currently a no-op `onPress={() => {}}` in scan-result.tsx) must be updated to show V3 axes instead.

---

## 6. i18n Keys

### New keys (add to fr.ts, en.ts, ar.ts)

```typescript
// Alert Pill Strip
"scan.alerts.boycott": "Boycott · {brand}",
"scan.alerts.allergenDetected": "{allergen} détecté",
"scan.alerts.healthWarning": "{additive} · {condition}",

// Health Card V3
"scan.health.title": "Santé & Nutrition",
"scan.health.axisNutrition": "Nutrition",
"scan.health.axisAdditives": "Additifs",
"scan.health.axisProcessing": "Transformation",
"scan.health.axisBeverageSugar": "Sucres boisson",
"scan.health.bonusBio": "Bonus Bio",
"scan.health.bonusAop": "Label qualité",
"scan.health.seeDetail": "Voir le détail",
"scan.health.confidence.high": "Données fiables",
"scan.health.confidence.medium": "Données partielles",
"scan.health.confidence.low": "Données limitées",
"scan.health.confidence.very_low": "Données insuffisantes",
"scan.health.cappedWarning": "Score plafonné (additif à risque)",

// Badge strips
"scan.badges.nutriScore": "NutriScore",
"scan.badges.nova": "NOVA",
"scan.badges.ecoScore": "Eco-Score",

// Nutrient grid
"scan.nutrients.sugars": "Sucres",
"scan.nutrients.saturatedFat": "Graisses sat.",
"scan.nutrients.salt": "Sel",
"scan.nutrients.fiber": "Fibres",
```

### Existing keys to deprecate

The following keys from the current `HealthNutritionCard` will be replaced by the new ones above:

- `scanResult.santeNutrition` → `scan.health.title`
- `scanResult.scoreSante` → removed (score shown directly)
- `scanResult.voirDetail` → `scan.health.seeDetail`

---

## 7. Edge Cases

| Scenario | Behavior |
|---------|----------|
| No nutrition data at all | Show "Données insuffisantes" badge, hide gradient bar and axis tiles, show only available info |
| Beverage without sugar data | Omit beverageSugar axis, adjust totalMax accordingly |
| No NutriScore grade | Hide NutriScore badge strip entirely |
| No NOVA group | Hide NOVA badge strip |
| No alerts at all | Don't render AlertPillStrip |
| Only boycott alert, no allergens | Show single boycott pill |
| 5+ alerts | Horizontal scroll, pills don't wrap |
| Bio product | Show BonusBadge with "+7" and leaf icon |
| Capped by additive | Show warning indicator on score ("plafonné") |
| Banned additive | Cap at 25, show critical warning |
| Fats/oils category | Use fats_oils_nuts-specific interpolation and grade boundaries |
| red_meat category | Use general-like boundaries with 60pt nutrition max |
| Dark mode | All components respect theme colors, gold accents on headers |
| Water / alcohol / baby food | Excluded by `checkScoreExclusion`, no health score shown |

---

## 8. Files to Create/Modify/Delete

### Backend

| Action | File | Description |
|--------|------|-------------|
| **MODIFY** | `backend/src/services/health-score.service.ts` | V3 formula: remove transparency, add category-aware interpolation, beverage sugar axis, bio bonus, weight redistribution |
| **MODIFY** | `backend/src/services/nutriscore.service.ts` | Export `detectCategory` and grade thresholds for V3 consumption |

### Mobile — New Files

| Action | File | Description |
|--------|------|-------------|
| **CREATE** | `optimus-halal/src/components/scan/AlertPillStrip.tsx` | Horizontal scrollable pill strip replacing BoycottCard + AlertStripCard |

### Mobile — Modified Files

| Action | File | Description |
|--------|------|-------------|
| **MODIFY** | `optimus-halal/app/scan-result.tsx` | Replace BoycottCard + AlertStripCard with AlertPillStrip, update health score props for V3, wire "Voir le détail" CTA |
| **MODIFY** | `optimus-halal/src/components/scan/HealthNutritionCard.tsx` | Full rewrite: gradient bar, axis tiles, badge strips, nutrient grid |
| **MODIFY** | `optimus-halal/src/components/scan/scan-types.ts` | Update PersonalAlert interface (remove onPress), add V3 health score types |
| **MODIFY** | `optimus-halal/src/components/scan/ScoreDetailBottomSheet.tsx` | Update for V3 axes (remove transparency, add beverage sugar, show bonuses) |
| **MODIFY** | `optimus-halal/src/components/scan/NutrientDetailSheet.tsx` | Ensure compatible with V3 axis data |
| **MODIFY** | `optimus-halal/src/i18n/translations/fr.ts` | New i18n keys + deprecate old health keys |
| **MODIFY** | `optimus-halal/src/i18n/translations/en.ts` | New i18n keys + deprecate old health keys |
| **MODIFY** | `optimus-halal/src/i18n/translations/ar.ts` | New i18n keys + deprecate old health keys |

### Mobile — Deleted Files

| Action | File | Reason |
|--------|------|--------|
| **DELETE** | `optimus-halal/src/components/scan/AlertStripCard.tsx` | Replaced by AlertPillStrip |
| **DELETE** | `optimus-halal/src/components/scan/PersonalAlerts.tsx` | Merged into AlertPillStrip |
| **DELETE** | `optimus-halal/src/components/scan/BoycottCard` in InlineScanSections.tsx | Remove BoycottCard component + its render in scan-result.tsx. Only consumer is scan-result.tsx. |

### Not Touched

- `ScoreRing.tsx` — reused as-is
- `VerdictHero.tsx` — unchanged
- `HalalVerdictCard.tsx` — unchanged
