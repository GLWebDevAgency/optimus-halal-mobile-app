# Naqiy Signature — Scan Result Redesign

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Redesign the scan-result screen from blur/parallax tiles to a Yuka-inspired clean card architecture with Naqiy's premium identity (gold accents, animated score rings, 4 madhab rows, scholarly references) — ultra premium, ultra interactive, pixel perfect.

**Architecture:** Scroll continu (pas de tabs), 7 sections en cards propres sur fond neutre, Score Ring SVG animé comme ancrage visuel, barres nutriments colorées par niveau (pattern Yuka), additifs avec danger badges 4-niveaux + rulings madhab inline.

**Design Philosophy:** Yuka's clarity × Naqiy's data richness × Al-Ihsan's motion excellence.

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Surface System](#2-surface-system)
3. [Section 1: Score Hero](#3-section-1-score-hero)
4. [Section 2: Alert Strip](#4-section-2-alert-strip)
5. [Section 3: Halal Verdict Card](#5-section-3-halal-verdict-card)
6. [Section 4: Health & Nutrition Dashboard](#6-section-4-health--nutrition-dashboard)
7. [Section 5: Additives Analysis](#7-section-5-additives-analysis)
8. [Section 6: Alternatives Section](#8-section-6-alternatives-section)
9. [Section 7: Sticky Header + Action Bar](#9-section-7-sticky-header--action-bar)
10. [Animation Choreography](#10-animation-choreography)
11. [Component Architecture](#11-component-architecture)
12. [Data Flow & Props](#12-data-flow--props)
13. [i18n Keys](#13-i18n-keys)
14. [Accessibility](#14-accessibility)
15. [Edge Cases](#15-edge-cases)
16. [Files to Create/Modify/Delete](#16-files-to-createmodifydelete)

---

## 1. Design Principles

### From Yuka (adopted)
- **Score circle as visual anchor** — the first thing the eye lands on
- **Color-coded nutrient bars** — each nutrient (fat, sugar, salt, fiber) has its own colored progress bar
- **4-level additive danger badges** — HIGH(red)/MEDIUM(orange)/LIMITED(yellow)/NONE(green)
- **Clean card surfaces** — white cards on light bg, clear section separation
- **Progressive disclosure** — score → details → alternatives
- **CoordinatorLayout-style collapsing header** — product info shrinks into sticky header on scroll

### From Naqiy (original)
- **Score Ring (not solid circle)** — animated SVG semi-arc, more elegant than Yuka's filled circle
- **4 madhab verdict rows** — our killer differentiator, no competitor has this
- **Gold accents in dark mode** — `gold[400]` section titles, `gold[800]` card borders, `darkShadows.card` gold tint
- **springNaqiy motion signature** — damping:14, stiffness:170, mass:0.9 on ALL entry animations
- **Certifier trust bar** — logo + animated fill bar + tier label
- **Scholarly references inline** — not hidden in bottom sheets
- **Al-Taqwa emotional design** — "Composition Conforme" not "Certifié Halal", informational not authoritative

### Anti-Patterns (forbidden)
- NO BlurView on section cards (performance Android, lisibility)
- NO parallax on content cards (complexity without clarity benefit)
- NO left accent bars (too subtle, doesn't guide the eye)
- NO tabs — everything is scroll continu
- NO confetti/celebration for halal (halal is the norm, not a victory)
- NO double error haptic for haram (informational, not alarming)
- NO scan counter visible (anxiety — Al-Taqwa dark pattern #1)
- NO upsell after haram verdict (Al-Taqwa dark pattern #2)

---

## 2. Surface System

### Page Background

| Mode | Color | Token |
|------|-------|-------|
| Light | `#f3f1ed` | `lightTheme.background` |
| Dark | `#0C0C0C` | `darkTheme.background` |

### Card Surface

| Property | Light | Dark |
|----------|-------|------|
| Background | `#FFFFFF` (`lightTheme.card`) | `rgba(255,255,255,0.04)` (NOTE: overrides `darkTheme.card` (#1A1A1A) for this screen — translucent cards create depth on the anthracite background. Use raw value, not token.) |
| Border | none | `gold[800]` + `StyleSheet.hairlineWidth` |
| Shadow | `lightShadows.card` (offset 0,2 opacity 0.06 radius 8) | `darkShadows.card` (gold[900] offset 0,2 opacity 0.30 radius 10) |
| Border Radius | `radius.lg` (16px) | `radius.lg` (16px) |
| Padding | `spacing["3xl"]` (24px) | `spacing["3xl"]` (24px) |

### Section Header Pattern

All section cards share this header pattern:

```
[icon 16px] SECTION TITLE                    [count or chip]
```

| Property | Value |
|----------|-------|
| Font | `fontSize.micro` (10px), `fontFamily.bold`, `fontWeight.bold` — NOTE: do NOT spread `textStyles.micro` (uses medium weight). Use individual tokens. |
| Text transform | `uppercase` |
| Letter spacing | `letterSpacing.wider` (1.0) |
| Color | `gold[400]` (dark) / `gold[700]` (light) |
| Icon | 16px, same color, `weight: "bold"` |
| Gap icon↔text | `spacing.sm` (6px) |
| Margin bottom | `spacing.lg` (12px) |
| Right element | Count badge or status chip, same gold color |

### Card Spacing

| Property | Value |
|----------|-------|
| Gap between cards | `spacing.xl` (16px) |
| Page horizontal padding | `spacing.xl` (16px) |
| Card internal padding | `spacing["3xl"]` (24px) |

### Divider (within cards)

| Property | Value |
|----------|-------|
| Height | `StyleSheet.hairlineWidth` |
| Color | `isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"` |
| Margin vertical | `spacing.lg` (12px) |

---

## 3. Section 1: Score Hero

The Score Hero is NOT a card — it's a full-width tinted section that extends behind the status bar, similar to the current VerdictHero but with an added **Score Ring**.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [status bar area — same bg color]                          │
│                                                             │
│  ┌──────────┐                                               │
│  │ ╭──────╮ │    NAQIY SCORE · MALIKI                       │
│  │ │      │ │                                               │
│  │ │ IMG  │ │    ╭───────────────────╮                      │
│  │ │ 116  │ │    │    ╱‾‾‾‾‾‾‾╲     │                      │
│  │ │  ×   │ │    │   /    85   \    │  ← Score Ring SVG    │
│  │ │ 116  │ │    │   ╲_______╱     │                       │
│  │ │      │ │    ╰───────────────────╯                      │
│  │ ╰──────╯ │    Composition Conforme                       │
│  │   [🔍]   │                                               │
│  └──────────┘    ┌──────────────────────────┐               │
│                  │ [AVS] AVS · 85/100       │    [📊]       │
│                  │ ━━━━━━━━━━━━━━━━░░       │               │
│                  │ Tier 1 · Certification    │               │
│                  └──────────────────────────┘               │
│                                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  Muesli Raisin, Figue, Abricot                             │
│  Bjorg · 3229820129488                      [QR]           │
│                                                             │
│  [👥 Vérifié par 42 membres]                                │
└─────────────────────────────────────────────────────────────┘
```

### Score Ring — SVG Spec

| Property | Value |
|----------|-------|
| Type | Semi-arc (180°, top half) via `react-native-svg` |
| Container | 80×44 (width × half-height + stroke) |
| Radius | 36px |
| Stroke width | 5px |
| Track color | `isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"` |
| Fill color | `score >= 70 ? halal.base : score >= 40 ? doubtful.base : haram.base` |
| Fill animation | `useAnimatedProps` + `withTiming(score/100, { duration: 1200, easing: Easing.out(Easing.cubic) })` |
| Score number | `fontSize.h2` (24px), `fontWeight.black`, centered below arc |
| Score label | `fontSize.caption` (12px), `fontWeight.semiBold`, color = fill color |
| Labels | "Excellent" (≥80) / "Bon" (≥60) / "Médiocre" (≥40) / "Insuffisant" (≥20) / "Très insuffisant" (<20) |
| No score | "—" gray, label "Données insuffisantes" |

### Hero Layout Specs

| Property | Value |
|----------|-------|
| Background | Solid `(isDark ? statusConfig.gradientDark : statusConfig.gradientLight)[0]` where `statusConfig = STATUS_CONFIG[effectiveHeroStatus]` |
| Top inset | `paddingTop: insets.top + 64` (status bar + nav height) |
| Horizontal padding | `spacing["3xl"]` (24px) |
| Bottom padding | `spacing["2xl"]` (20px) |
| Layout Row 1 | `flexDirection: "row"`, image left (fixed 116px), info right (flex:1) |
| Gap | `spacing.xl` (16px) |
| Image wrapper | 116×116, `borderRadius: 22`, border 3px `statusConfig.color`, shadow `hero` |
| Image | `contentFit: "cover"`, `transition: 200` |
| Zoom badge | 26×26 circle, bottom-right of image, magnifying glass 14px |
| Score label row | Logo Naqiy 18px + "NAQIY SCORE · MALIKI" micro uppercase |
| Score Ring | Below label row, left-aligned |
| Verdict text | Below ring, `fontSize.bodySmall` (14px), `fontWeight.semiBold`, `statusConfig.color` |
| Certifier row | Below verdict: logo 20px + name + score colored + trust bar 4px animated |
| Tier label | `fontSize.micro` (10px), `fontWeight.medium`, `textMuted` |
| Help button | 38×38, `radius.md`, chart bar icon 20px, opens ScoreDetailBottomSheet |
| Divider | Full width, `hairlineWidth`, opacity 0.2 |
| Product name | `fontSize.h4` (18px), `fontWeight.bold`, max 2 lines |
| Barcode | `fontSize.micro` (10px), monospace, QR icon 16px |
| Community badge | Pill, UsersThree icon 13px + count text |

### Interactions

| Target | Action | Haptic |
|--------|--------|--------|
| Product image | `onImagePress()` → ImagePreviewModal | `impact()` |
| Score Ring area | `onScoreDetailPress()` → ScoreDetailBottomSheet | `impact()` |
| Help [📊] button | `onScoreDetailPress()` → ScoreDetailBottomSheet | `impact()` |
| Certifier bar | `onTrustScorePress()` → TrustScoreBottomSheet | `impact()` |

---

## 4. Section 2: Alert Strip

**Conditional** — only renders if `personalAlerts.length > 0`. Zero alerts = section hidden entirely (not a "no alerts" empty state).

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠  ALERTES PERSONNELLES                                2  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ⚠ Traces possibles : lait                          │    │
│  │   Ce produit peut contenir des traces de lait.      │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ℹ Ingrédient boycotté détecté                       │    │
│  │   Huile de palme (Sime Darby)                       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Specs

| Property | Value |
|----------|-------|
| Container | Card surface (standard card system) |
| Header | "ALERTES PERSONNELLES" — section header pattern + WarningCircle icon 16px |
| Count | Right-aligned, same gold color |
| Alert items | Inset sub-cards: `backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"` |
| Alert sub-card radius | `radius.md` (12px) |
| Alert sub-card padding | `spacing.lg` (12px) |
| Gap between alerts | `spacing.md` (8px) |
| Severity icon | 18px, `danger: haram.base` / `warning: doubtful.base` / `info: semantic.info.base` |
| Alert title | `fontSize.bodySmall` (14px), `fontWeight.semiBold`, `textPrimary` |
| Alert message | `fontSize.caption` (12px), `fontWeight.regular`, `textSecondary` |
| Max visible | 3 alerts, then "Voir toutes (N)" CTA in gold |
| Sort order | danger → warning → info (severity descending) |
| Entry | Card FadeInUp springNaqiy, alerts stagger 60ms |
| Press | Entire card → `onOpenAlertsSheet()` |

---

## 5. Section 3: Halal Verdict Card

Our **killer differentiator** — 4 madhab verdict rows displayed with equal visual weight (Al-Niyyah: neutralité confessionnelle). The user's madhab gets a subtle gold highlight but is NOT visually elevated above others.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🕌  AVIS DES 4 ÉCOLES                      [Unanime ✓]   │
│                                                             │
│  ★ Maliki     ● Halal     ━━━━━━━━━━━━━━━━░░  85/100      │
│    Hanafi     ● Halal     ━━━━━━━━━━━━━━░░░░  82/100      │
│    Shafi'i    ● Halal     ━━━━━━━━━━━━░░░░░░  80/100      │
│    Hanbali    ● Halal     ━━━━━━━━━━░░░░░░░░  78/100      │
│                                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  12 ingr. · 2 add. · La décision vous appartient.          │
│                                         Voir le détail →   │
└─────────────────────────────────────────────────────────────┘
```

### Madhab Row Spec

Each madhab row is a pressable 44px-height row:

| Element | Spec |
|---------|------|
| Star icon (user madhab only) | 14px, `gold[500]`, `weight: "fill"` |
| Madhab name | `fontSize.bodySmall` (14px), width 72px fixed |
| | User: `fontWeight.bold`, `gold[400]`(dark)/`gold[700]`(light) |
| | Others: `fontWeight.regular`, `textPrimary` |
| Status dot | 10px circle, color = status (`halal.base`/`haram.base`/`doubtful.base`/`unknown.base`) |
| Status label | `fontSize.caption` (12px), color = status |
| Trust bar | Flex:1, height 3px, `radius.full`, animated fill springNaqiy |
| Trust bar track | `isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"` |
| Trust bar fill | Color = status |
| Score value | `fontSize.caption` (12px), `fontWeight.bold`, color = status, min-width 40px, right-aligned |
| Row gap | `spacing.md` (8px) |
| Row vertical gap | `spacing.sm` (6px) |

### Consensus Badge

| Property | Value |
|----------|-------|
| Visible | Only when ALL 4 madhab have same status |
| Shape | Pill (`radius.full`) |
| Background | `rgba(statusColorRGB, isDark ? 0.20 : 0.12)` — use `Color(statusColor).alpha()` or pre-computed `halalStatus[status].bg`/`.bgDark` tokens |
| Text | "Unanime" — `fontSize.micro`, `fontWeight.bold`, color = status |
| Icon | CheckCircle 12px before text |

### Footer

| Property | Value |
|----------|-------|
| Left text | "{N} ingr. · {N} add." — `fontSize.caption`, `textMuted` |
| | If both 0: `t.scanResult.unverified` |
| Right CTA | "Voir le détail →" — `fontSize.caption`, `fontWeight.semiBold`, gold |
| Philosophical note | "La décision vous appartient." — `fontSize.micro`, `textMuted`, italic |

### Interactions

| Target | Action | Haptic |
|--------|--------|--------|
| Individual madhab row | `onOpenMadhabSheet(madhab)` → MadhabBottomSheet for that school | `impact()` |
| Entire card | `onOpenHalalSheet()` → Full halal analysis sheet | `impact()` |

### Conflict Animation

When product is doubtful and madhab verdicts differ:
- The conflicting madhab row has a subtle breathing animation: `withRepeat(withSequence(withTiming(0.6, 1500), withTiming(1, 1500)), -1)` on opacity
- Only on the row(s) that differ from majority
- Respects `useReducedMotion()` — disabled if reduced motion

---

## 6. Section 4: Health & Nutrition Dashboard

Yuka's strongest pattern adopted: **per-nutrient color bars** + **NutriScore/NOVA/Eco badges**.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ❤  SANTÉ & NUTRITION                                       │
│                                                             │
│  ┌──────────┐   Score Santé                                 │
│  │   ╱‾‾╲   │   ━━━━━━━━━━━━━━━━━━━━━━━━░░░  80/100  Bon  │
│  │  │ 80 │  │                                               │
│  │   ╲__╱   │   ┌──────┐  ┌──────┐  ┌──────┐              │
│  └──────────┘   │Nutri │  │NOVA  │  │ Eco  │              │
│                 │  A   │  │  1   │  │  B   │              │
│                 └──────┘  └──────┘  └──────┘              │
│                                                             │
│  [Vegan] [Sans gluten] [Bio] [Sans huile palme]            │
│                                                             │
│  ─ Détail nutritionnel ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                             │
│  Lipides        12.4g  ████████░░░░  Modéré    22%  ⓘ     │
│  dont saturés    3.2g  ████░░░░░░░░  Bas        8%  ⓘ     │
│  Sucres          8.2g  ██████░░░░░░  Modéré    11%  ⓘ     │
│  Sel             0.8g  ██░░░░░░░░░░  Bas        5%  ⓘ     │
│  Protéines       6.1g  ██████████░░  Élevé    18%  ⓘ     │
│  Fibres          4.2g  ████████░░░░  Bon      14%  ⓘ     │
│                                                             │
│  ─ Allergènes ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  [🔴 Lait] [🟡 Noisettes] [🔵 Soja]                        │
│  Traces: [Lait]                                             │
│                                                             │
│                                         Voir le détail →   │
└─────────────────────────────────────────────────────────────┘
```

### Score Sub-Section (top of card)

| Property | Value |
|----------|-------|
| Layout | Row: ScoreRing left (80×44) + info right (flex:1) |
| "Score Santé" label | `fontSize.micro`, uppercase, `textMuted` |
| Score bar | Full width, height 4px, animated fill, color = score tier |
| Score value | `fontSize.bodySmall`, `fontWeight.bold`, color = score tier, right of bar |
| Score label | "Bon" / "Médiocre" etc — `fontSize.caption`, `fontWeight.semiBold`, color = score tier |

### NutriScore / NOVA / Eco Badges

| Property | Value |
|----------|-------|
| Layout | Row, `gap: spacing.md` (8px) |
| Badge shape | Pill, `radius.sm` (8px), min-width 52px, height 28px |
| Badge bg | `rgba(badgeColorRGB, isDark ? 0.20 : 0.12)` |
| Badge border | `rgba(badgeColorRGB, isDark ? 0.40 : 0.25)`, `StyleSheet.hairlineWidth` |
| Badge text | "{Label} {Grade}" e.g. "Nutri A" — `fontSize.micro` (10px), `fontWeight.bold` |
| NutriScore colors | A: `#038141`, B: `#85BB2F`, C: `#FECB02`, D: `#EE8100`, E: `#E63E11` |
| NOVA colors | 1: `#038141`, 2: `#85BB2F`, 3: `#FECB02`, 4: `#E63E11` |
| EcoScore colors | Same as NutriScore |
| Missing badge | Not rendered (no empty state) |

### Dietary Chips

| Property | Value |
|----------|-------|
| Component | Existing `DietaryChip` |
| Layout | Horizontal ScrollView, `gap: spacing.sm` (6px) |
| Conditional | Only if `dietaryAnalysis` has entries |

### Nutrient Bars (Yuka pattern)

Each nutrient is a pressable row:

| Property | Value |
|----------|-------|
| Row height | 36px |
| Row layout | `[Name 80px] [Value 48px] [Bar flex:1] [Level 56px] [% 32px] [ⓘ 24px]` |
| Name | `fontSize.bodySmall` (14px), `fontWeight.regular`, `textPrimary` |
| | Indented names ("dont saturés") get `paddingLeft: spacing.lg` |
| Value | `fontSize.bodySmall`, `fontWeight.medium`, `textSecondary` |
| Bar | Height 6px, `radius.full` |
| Bar track | `isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"` |
| Bar fill | Animated with `withTiming(percentage, { duration: 800 })`, stagger 60ms |
| Bar fill color (negative nutrients: fat, saturated, sugar, salt) | low: `halal.base`, moderate: `doubtful.base`, high: `haram.base` |
| Bar fill color (positive nutrients: fiber, protein) | high: `halal.base`, moderate: `doubtful.base`, low: `haram.base` |
| Level text | "Bas"/"Modéré"/"Élevé" — `fontSize.caption`, color = bar fill |
| % text | `fontSize.caption`, `textMuted` |
| Info icon | 16px, `textMuted`, pressable → `onNutrientPress(nutrient)` → NutrientDetailSheet |

**Nutrient thresholds (per 100g, adapted from Yuka):**

| Nutrient | Low | Moderate | High |
|----------|-----|----------|------|
| Fat | <3g | 3-20g | >20g |
| Saturated fat | <1.5g | 1.5-5g | >5g |
| Sugar | <5g | 5-12.5g | >12.5g |
| Salt | <0.3g | 0.3-1.5g | >1.5g |
| Fiber | <1.5g (bad) | 1.5-3g (ok) | >3g (good) |
| Protein | <4g (bad) | 4-8g (ok) | >8g (good) |

### Allergen Section

| Property | Value |
|----------|-------|
| Sub-header | "Allergènes" — section header pattern at smaller scale |
| Allergen chip | Pill, colored left dot (8px), name text |
| Dot colors | Known allergen: `haram.base`, potential: `doubtful.base`, info: `semantic.info.base` |
| "Traces" label | `fontSize.caption`, `textMuted`, separate line below |
| Trace chips | Same as allergen but with dashed border |

### Interactions

| Target | Action |
|--------|--------|
| Individual nutrient row ⓘ | `onNutrientPress(nutrient)` → NutrientDetailSheet |
| NutriScore badge | `onScoreDetailPress()` → ScoreDetailBottomSheet |
| Allergen chip | `onAllergenPress(allergen)` — future: allergen detail |
| "Voir le détail →" | `onOpenHealthSheet()` |

---

## 7. Section 5: Additives Analysis

Yuka's 4-level danger system enriched with our madhab rulings and scholarly references.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🧪  ADDITIFS DÉTECTÉS                                  3  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🔴  E471 · Mono et diglycérides d'acides gras      │    │
│  │     Émulsifiant · Risque élevé                      │    │
│  │     Hanafi: douteux │ Shafi'i: halal │ Maliki: ...  │    │
│  │     ⚠ Perturbateur endocrinien possible             │    │
│  │     📖 Dar al-Ifta al-Misriyyah                     │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🟢  E322 · Lécithine de soja                       │    │
│  │     Émulsifiant · Sans risque                       │    │
│  │     Unanime halal                                    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Additive Card Spec

Each additive is an inset sub-card:

| Property | Value |
|----------|-------|
| Sub-card bg | `isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"` |
| Sub-card radius | `radius.md` (12px) |
| Sub-card padding | `spacing.lg` (12px) |
| Gap between cards | `spacing.md` (8px) |

### Additive Row Elements

| Element | Spec |
|---------|------|
| Danger dot | 12px circle, positioned left |
| Danger dot colors | HIGH(1): `haram.base` / MEDIUM(2): `doubtful.base` / LIMITED(3): `#FECB02` / NONE(4): `halal.base` |
| Code + Name | `fontSize.bodySmall` (14px), `fontWeight.semiBold` — "E471 · Mono et diglycérides..." |
| Category + Risk | `fontSize.caption` (12px), `textSecondary` — "Émulsifiant · Risque élevé" |
| Risk label color | Same as danger dot |
| Madhab rulings | `fontSize.micro` (10px), `textMuted` — "Hanafi: douteux │ Shafi'i: halal │ ..." |
| | Each madhab status word colored by its status |
| | Only shown if rulings differ between madhab |
| Health effects | `HealthEffectBadge` component (existing), inline below rulings |
| | Types: EndocrineDisruptor, Allergen, Irritant, Carcinogenic |
| | "possible" suffix if `potential: true` |
| Scholarly ref | `fontSize.micro`, `gold[300]` (dark) / `gold[700]` (light), italic |
| | 📖 prefix + source name |
| | Only shown if ref exists for this additive |

### Interactions

| Target | Action |
|--------|--------|
| Additive sub-card | Expand/collapse detail (madhab rulings + health effects + refs) |
| Initially | HIGH/MEDIUM danger additives expanded, LIMITED/NONE collapsed |
| CTA "Voir le détail →" | `onOpenHalalSheet()` with scroll to additives section |

---

## 8. Section 6: Alternatives Section

Position depends on product status:
- **Haram/Doubtful** → positioned AFTER section 3 (Halal Verdict), BEFORE section 4 (Health)
- **Halal/Unknown** → positioned as section 6 (after Additives)

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ✨  DÉCOUVRIR AUSSI                                        │
│      (haram: "DES ALTERNATIVES EXISTENT")                   │
│                                                             │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐           │
│  │  IMG   │  │  IMG   │  │  IMG   │  │  IMG   │  ← horiz  │
│  │ 140×100│  │ 140×100│  │ 140×100│  │ 140×100│    scroll  │
│  │        │  │        │  │        │  │        │           │
│  │Muesli  │  │Granola │  │Céréal  │  │Flocons │           │
│  │Bio     │  │Nature  │  │Complet │  │Avoine  │           │
│  │[Halal] │  │[Halal] │  │[Halal] │  │[●●]   │           │
│  │ A · 1  │  │ B · 2  │  │ A · 1  │  │ C · 3  │           │
│  └────────┘  └────────┘  └────────┘  └────────┘           │
│                                                             │
│                     Voir tout (6) →                         │
└─────────────────────────────────────────────────────────────┘
```

### Alternative Card Spec

| Property | Value |
|----------|-------|
| FlatList | `horizontal`, `showsHorizontalScrollIndicator: false` |
| Card width | 140px fixed |
| Card gap | `spacing.lg` (12px) |
| List padding | `spacing["3xl"]` (24px) horizontal |
| Image | 140×100, `radius.md` (12px), `contentFit: "cover"` |
| Image placeholder | Gradient shimmer while loading |
| Product name | `fontSize.bodySmall` (14px), `fontWeight.semiBold`, max 2 lines, `textPrimary` |
| Brand | `fontSize.caption` (12px), `textMuted`, 1 line |
| Halal chip | Mini pill, `halal.bg`/`doubtful.bg`/`haram.bg`, text colored |
| NutriScore + NOVA | Inline mini text: "A · 1" — `fontSize.micro`, colored |
| Press → | Navigate to `scan-result?barcode={alt.barcode}` |

### Header Variants

| Product Status | Header Text | i18n Key | Tone |
|----------------|-------------|----------|------|
| Haram/Doubtful | "DES ALTERNATIVES EXISTENT" | `alternativesPriority` | Encouraging |
| Halal/Unknown | "DÉCOUVRIR AUSSI" | `alternativesDiscover` | Neutral |

### Empty/Loading States

| State | Display |
|-------|---------|
| Loading | 3 shimmer placeholder cards (140×180) |
| No alternatives | "Aucune alternative trouvée" — `fontSize.caption`, `textMuted`, centered |
| | Section still visible but minimal |

---

## 9. Section 7: Sticky Header + Action Bar

### Compact Sticky Header

Appears when user scrolls past the Score Hero section.

```
┌──────────────────────────────────────────────────────┐
│ [←] Muesli Raisin · Bjorg   [● Conforme]      [♡]  │
└──────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Height | 44px + safe area top |
| Trigger | `scrollY > heroMeasuredHeight` |
| Entry | `SlideInUp.duration(300).springify().damping(14).stiffness(170).mass(0.9)` |
| Exit | `FadeOutUp.duration(200)` |
| Background iOS | `BlurView intensity: 40, tint: isDark ? "dark" : "light"` |
| Background Android | `isDark ? "rgba(12,12,12,0.95)" : "rgba(243,241,237,0.95)"` |
| Back button | 44×44 hit target, CaretLeft 24px |
| Product name | `fontSize.bodySmall`, `fontWeight.semiBold`, flex:1, 1 line truncated |
| Brand | After " · ", `textMuted` |
| Verdict chip | Mini pill, bg = status, text = short label ("Conforme"/"Non Conforme"/"Douteux") |
| Favorite button | Heart icon 22px, filled if favorited, `haram.base` fill |

### Action Bar (Sticky Bottom)

```
┌──────────────────────────────────────────────────────┐
│  [♡]    [↗]    [══ Où acheter ? ══]    [⚑]         │
└──────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Height | 56px + safe area bottom |
| Background iOS | `BlurView intensity: 50, tint: isDark ? "dark" : "light"` |
| Background Android | Same semi-opaque fallback as sticky header |
| Border top | `StyleSheet.hairlineWidth`, `isDark ? glass.dark.border : glass.light.border` |
| Layout | Row, `justifyContent: "space-around"`, `alignItems: "center"` |
| Buttons | 44×44 hit target each (WCAG AA) |
| Favorite | HeartIcon, toggle filled/outline, `haram.base` when filled |
| Share | ShareIcon → native share sheet |
| CTA | Gold gradient pill: "Où acheter ?" (halal) / "Alternatives halal" (haram) |
| | `fontSize.bodySmall`, `fontWeight.bold`, white text |
| | Background: `LinearGradient` `gold[400]` → `gold[600]` |
| | Min width 160px, height 40px, `radius.full` |
| Report | FlagIcon → report flow |
| Entry | `SlideInUp.delay(1000).springify()` with `springNaqiy` |

---

## 10. Animation Choreography

All animations use `springNaqiy` (damping:14, stiffness:170, mass:0.9) unless noted.

```
T+0ms      Hero background color (instant — color BEFORE text, Al-Taqwa)
T+50ms     Product image ZoomIn.springify(springNaqiy)
T+100ms    Score Ring arc fill (withTiming 1200ms easeOutCubic)
T+150ms    Score number counter (useAnimatedReaction, rounds to int)
T+200ms    Verdict text FadeInRight.duration(450)
T+250ms    Certifier bar fill (withTiming 1400ms easeOutCubic)
T+350ms    Community badge FadeIn.duration(500)

T+500ms    Alert Strip card FadeInUp.springify (if present)
T+560ms    Alert items stagger (60ms each)

T+600ms    Halal Verdict Card FadeInUp.springify
T+680ms    Madhab rows stagger (80ms each, bars animate fill)

T+800ms    Health Dashboard Card FadeInUp.springify
T+860ms    NutriScore/NOVA/Eco badges FadeIn stagger 60ms
T+920ms    Nutrient bars fill stagger (60ms each, withTiming 800ms)

T+1000ms   Additives Card FadeInUp.springify
T+1060ms   Additive sub-cards stagger 80ms

T+1100ms   Alternatives Card FadeInUp.springify

T+1200ms   Action Bar SlideInUp.springify(springNaqiy)
```

### Reduced Motion

When `useReducedMotion()` returns true:
- ALL entering/exiting animations = `undefined` (instant render)
- ALL withTiming = instant (duration: 0)
- ALL withRepeat (breathing) = disabled
- Score Ring/bars = final state immediately
- Haptics still fire

---

## 11. Component Architecture

### New Components (7)

| # | Component | File | Lines est. | Responsibility |
|---|-----------|------|-----------|----------------|
| 1 | `scan-types` | `src/components/scan/scan-types.ts` | ~60 | Shared TypeScript types (MadhabVerdict, NutrientItem, AdditiveItem, etc.) |
| 2 | `ScoreRing` | `src/components/scan/ScoreRing.tsx` | ~90 | Animated SVG semi-arc with score number |
| 3 | `SectionCard` | `src/components/scan/SectionCard.tsx` | ~70 | Standard card wrapper: applies card surface (bg, shadow, border, radius, padding) + section header pattern (icon + uppercase title + right element). Children are rendered inside the card body. Usage: `<SectionCard icon={...} title="SANTÉ">{content}</SectionCard>` |
| 4 | `AlertStripCard` | `src/components/scan/AlertStripCard.tsx` | ~120 | Personal alerts section |
| 5 | `HalalVerdictCard` | `src/components/scan/HalalVerdictCard.tsx` | ~220 | 4 madhab rows + consensus + footer (replaces old MadhabVerdictCard) |
| 6 | `HealthNutritionCard` | `src/components/scan/HealthNutritionCard.tsx` | ~350 | Score + badges + nutrient bars + allergens |
| 7 | `AdditivesCard` | `src/components/scan/AdditivesCard.tsx` | ~200 | Additive sub-cards with danger badges |

### Modified Components (7)

| Component | Changes |
|-----------|---------|
| `VerdictHero.tsx` | Add ScoreRing, adjust layout to accommodate ring |
| `CompactStickyHeader.tsx` | Add verdict chip, favorite button |
| `ScanBottomBar.tsx` | Add gold gradient CTA, context-aware label (file already exists with correct name) |
| `NutrientBar.tsx` | Rewrite to match Yuka-style per-nutrient colored bar with level thresholds (file already exists) |
| `AlternativesSection.tsx` | Add header variants (priority/discover), position logic based on halal status |
| `scan-constants.ts` | Add nutrient thresholds, additive risk level mappings, additive category keys |
| `app/scan-result.tsx` | Replace BentoGrid with direct section cards, new scroll architecture (~400 lines orchestrator) |

### Deleted Components (16 — Bento system + superseded Sprint 1 components)

| Component | Reason |
|-----------|--------|
| `AlertStrip.tsx` | Replaced by AlertStripCard |
| `AlertsTile.tsx` | Replaced by AlertStripCard |
| `AlternativesTile.tsx` | Replaced by AlternativesSection (modified) |
| `BentoGrid.tsx` | Replaced by direct section cards in scan-result |
| `BentoTile.tsx` | Replaced by SectionCard |
| `HalalActionCard.tsx` | Replaced by HalalVerdictCard footer CTA |
| `HalalAnalysisSection.tsx` | Replaced by AdditivesCard + HalalVerdictCard |
| `HalalMadhabTile.tsx` | Replaced by HalalVerdictCard |
| `HealthNutritionSection.tsx` | Replaced by HealthNutritionCard |
| `HealthScoreTile.tsx` | Replaced by HealthNutritionCard |
| `KeyCharacteristicsGrid.tsx` | Dietary chips inline in HealthNutritionCard |
| `MadhabScoreRing.tsx` | Replaced by score rows in HalalVerdictCard |
| `MadhabVerdictCard.tsx` | Replaced by HalalVerdictCard (complete rewrite, new file) |
| `PersonalAlerts.tsx` | Replaced by AlertStripCard |
| `ScanResultTabBar.tsx` | No more tabs — scroll continu |
| `ScoreDashboardCard.tsx` | Replaced by HealthNutritionCard |

### Reused Components (unchanged)

`AlternativeProductCard`, `CertifierLogo`, `CriteriaCard`, `DietaryChip`, `HealthEffectBadge`, `ShareCard`, `MadhabBottomSheet`, `TrustScoreBottomSheet`, `ScoreDetailBottomSheet`, `NutrientDetailSheet`, `ScanLoadingSkeleton`, `ScanStates`, `PressableScale`, `PremiumBackground`

---

## 12. Data Flow & Props

### scan-result.tsx Orchestrator (~400 lines)

```tsx
export default function ScanResultScreen() {
  // ~50 lines: hooks (tRPC, theme, translation, haptics, safe area)
  // ~30 lines: derived state (effectiveStatus, heroLabel, isNonHalal, etc.)
  // ~30 lines: scrollHandler + heroHeight measurement
  // ~50 lines: callbacks (goBack, share, favorite, report, sheet opens)
  // ~20 lines: guards (loading skeleton, error, not found)

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <Animated.ScrollView onScroll={scrollHandler}>
        {/* 1. SCORE HERO */}
        <VerdictHero ... onLayout={measureHero} />

        {/* Spacer */}
        <View style={{ height: spacing.xl, backgroundColor: colors.background }} />

        {/* Content cards — padded container */}
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.xl, paddingBottom: spacing["6xl"] }}>

          {/* 2. ALERT STRIP (conditional) */}
          {personalAlerts.length > 0 && <AlertStripCard ... />}

          {/* 3. HALAL VERDICT CARD */}
          <HalalVerdictCard ... />

          {/* Haram: alternatives before health (Al-Taqwa) */}
          {isNonHalal && <AlternativesSection variant="priority" ... />}

          {/* 4. HEALTH & NUTRITION */}
          <HealthNutritionCard ... />

          {/* 5. ADDITIVES */}
          {hasAdditives && <AdditivesCard ... />}

          {/* Halal: alternatives after additives */}
          {!isNonHalal && <AlternativesSection variant="discover" ... />}

          {/* DISCLAIMER — inline, not a separate component */}
          {/* Text: t.scanResult.disclaimer — fontSize.caption, textMuted, centered, italic */}
          {/* "Les informations fournies le sont à titre informatif..." */}
          <Text style={[textStyles.caption, { color: textMuted, textAlign: "center", fontStyle: "italic" }]}>
            {t.scanResult.disclaimer}
          </Text>
        </View>
      </Animated.ScrollView>

      {/* STICKY HEADER */}
      <CompactStickyHeader visible={scrolledPastHero} ... />

      {/* ACTION BAR */}
      <ScanBottomBar ... />

      {/* BOTTOM SHEETS */}
      <MadhabBottomSheet ... />
      <TrustScoreBottomSheet ... />
      <ScoreDetailBottomSheet ... />
      <NutrientDetailSheet ... />
    </View>
  );
}
```

### Shared Type Definitions

These types are used across multiple components. Define in `src/components/scan/scan-types.ts`:

```typescript
import type { HalalStatusKey } from "./scan-constants";

/** A single madhab's verdict on the product */
export interface MadhabVerdict {
  madhab: "hanafi" | "shafii" | "maliki" | "hanbali";
  status: HalalStatusKey;
  score: number | null;       // 0-100 trust score
  reasoning?: string;         // brief explanation
}

/** A single nutrient's data for the nutrient bar */
export interface NutrientItem {
  key: string;                // "fat", "saturated_fat", "sugar", "salt", "fiber", "protein"
  name: string;               // Localized display name
  value: number;              // grams per 100g
  unit: "g" | "mg";
  percentage: number;         // 0-100 of daily reference value
  level: "low" | "moderate" | "high";
  isPositive: boolean;        // true for fiber/protein (high = good)
  indented?: boolean;         // true for sub-nutrients like "dont saturés"
}

/** Dietary label from product analysis */
export interface DietaryItem {
  key: string;                // "vegan", "gluten_free", "bio", "palm_oil_free"
  label: string;              // Localized label
  icon?: string;              // Optional icon name
}

/** Additive with Yuka-style danger level */
export interface AdditiveItem {
  code: string;               // "E471"
  name: string;               // "Mono et diglycérides d'acides gras"
  category: string;           // "Émulsifiant"
  dangerLevel: 1 | 2 | 3 | 4; // HIGH=1, MEDIUM=2, LIMITED=3, NONE=4
  madhabRulings?: Record<string, HalalStatusKey>; // madhab → status (only if differs)
  healthEffects?: HealthEffect[];
  scholarlyRefs?: ScholarlyRef[];
}

/** Health effect on an additive */
export interface HealthEffect {
  type: "endocrine_disruptor" | "allergen" | "irritant" | "carcinogenic";
  label: string;              // Localized label
  potential: boolean;         // true = "possible", false = confirmed
}

/** Scholarly reference for halal ruling */
export interface ScholarlyRef {
  source: string;             // "Dar al-Ifta al-Misriyyah"
  detail?: string;            // "Fatwa #1234"
}
```

### Key Props Interfaces

```typescript
// ScoreRing
interface ScoreRingProps {
  score: number | null;        // 0-100 or null
  size?: number;               // default 80
  strokeWidth?: number;        // default 5
  animated?: boolean;          // default true
}

// SectionCard
interface SectionCardProps {
  icon?: React.ReactNode;
  title: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  staggerIndex?: number;
  children: React.ReactNode;
}

// HalalVerdictCard
interface HalalVerdictCardProps {
  halalStatus: HalalStatusKey;
  effectiveHeroStatus: HalalStatusKey;
  trustScore: number | null;
  madhabVerdicts: MadhabVerdict[];
  userMadhab: string;
  ingredientCount: number;
  additiveCount: number;
  onPressMadhab: (madhab: string) => void;
  onPressCard: () => void;
}

// HealthNutritionCard
interface HealthNutritionCardProps {
  healthScore: { score: number; label: string } | null;
  nutriScore: string | null;
  novaGroup: number | null;
  ecoScore: string | null;
  nutrientBreakdown: NutrientItem[];
  dietaryAnalysis: DietaryItem[];
  allergens: string[];
  traces: string[];
  onNutrientPress: (nutrient: string) => void;
  onPress: () => void;
}

// AdditivesCard
interface AdditivesCardProps {
  additives: AdditiveItem[];
  madhabRulings: Record<string, Record<string, string>>; // additive code → madhab → status
  healthEffects: Record<string, HealthEffect[]>;
  scholarlyRefs: Record<string, ScholarlyRef[]>;
  onPress: () => void;
}

// NutrientBar
interface NutrientBarProps {
  name: string;
  value: number;           // grams
  unit: string;            // "g" or "mg"
  percentage: number;      // 0-100 of daily value
  level: "low" | "moderate" | "high";
  isPositive: boolean;     // fiber/protein = positive (high is good)
  indented?: boolean;      // "dont saturés" style
  staggerIndex: number;
  onInfoPress: () => void;
}
```

---

## 13. i18n Keys

New keys to add to all 3 locale files. Keys are listed per locale:

### French (fr.ts)

```typescript
scanResult: {
  // Section headers
  alertsPersonnelles: "ALERTES PERSONNELLES",
  avisEcoles: "AVIS DES 4 ÉCOLES",
  santeNutrition: "SANTÉ & NUTRITION",
  additifsDetectes: "ADDITIFS DÉTECTÉS",
  detailNutritionnel: "Détail nutritionnel",
  allergenesTitle: "Allergènes",
  tracesLabel: "Traces",
  decouvrirAussi: "DÉCOUVRIR AUSSI",
  alternativesPriority: "DES ALTERNATIVES EXISTENT",
  alternativesDiscover: "DÉCOUVRIR AUSSI",

  // Score labels
  scoreSante: "Score Santé",
  scoreExcellent: "Excellent",
  scoreBon: "Bon",
  scoreMediocre: "Médiocre",
  scoreInsuffisant: "Insuffisant",
  scoreTresInsuffisant: "Très insuffisant",
  donneesInsuffisantes: "Données insuffisantes",

  // Nutrient levels
  levelLow: "Bas",
  levelModerate: "Modéré",
  levelHigh: "Élevé",

  // Additive risk levels
  riskHigh: "Risque élevé",
  riskMedium: "Risque modéré",
  riskLimited: "Risque limité",
  riskNone: "Sans risque",

  // Additive categories (from Yuka model)
  additiveCategoryPreservative: "Conservateur",
  additiveCategoryColour: "Colorant",
  additiveCategoryEmulsifier: "Émulsifiant",
  additiveCategoryStabiliser: "Stabilisant",
  additiveCategoryThickener: "Épaississant",
  additiveCategoryAntioxidant: "Antioxydant",
  additiveCategoryAcidityRegulator: "Régulateur d'acidité",
  additiveCategoryFlavourEnhancer: "Exhausteur de goût",
  additiveCategorySweetener: "Édulcorant",
  additiveCategoryRaisingAgent: "Agent levant",
  additiveCategoryAntiCaking: "Anti-agglomérant",
  additiveCategoryGlazingAgent: "Agent d'enrobage",
  additiveCategoryHumectant: "Humectant",
  additiveCategorySequestrant: "Séquestrant",
  additiveCategoryFoamingAgent: "Agent moussant",
  additiveCategoryOther: "Autre",

  // Madhab
  unanime: "Unanime",
  decisionNote: "La décision vous appartient.",
  analyseAlgorithmique: "Analyse algorithmique",

  // Alternatives
  voirTout: "Voir tout ({{count}})",
  aucuneAlternative: "Aucune alternative trouvée",

  // Action bar
  ouAcheter: "Où acheter ?",
  alternativesHalal: "Alternatives halal",

  // Sticky header
  conforme: "Conforme",
  nonConforme: "Non Conforme",
  douteux: "Douteux",

  // Misc
  voirDetail: "Voir le détail",
  donneesAnciennes: "Données anciennes",
  communityVerified: "Vérifié par {{count}} membres",
  disclaimer: "Les informations fournies le sont à titre informatif. Naqiy ne se substitue pas à un avis religieux qualifié. La décision vous appartient.",
}
```

### English (en.ts)

```typescript
scanResult: {
  alertsPersonnelles: "PERSONAL ALERTS",
  avisEcoles: "VERDICT BY 4 SCHOOLS",
  santeNutrition: "HEALTH & NUTRITION",
  additifsDetectes: "ADDITIVES DETECTED",
  detailNutritionnel: "Nutritional detail",
  allergenesTitle: "Allergens",
  tracesLabel: "Traces",
  decouvrirAussi: "DISCOVER MORE",
  alternativesPriority: "ALTERNATIVES AVAILABLE",
  alternativesDiscover: "DISCOVER MORE",
  scoreSante: "Health Score",
  scoreExcellent: "Excellent",
  scoreBon: "Good",
  scoreMediocre: "Poor",
  scoreInsuffisant: "Bad",
  scoreTresInsuffisant: "Very bad",
  donneesInsuffisantes: "Insufficient data",
  levelLow: "Low",
  levelModerate: "Moderate",
  levelHigh: "High",
  riskHigh: "High risk",
  riskMedium: "Moderate risk",
  riskLimited: "Limited risk",
  riskNone: "No risk",
  additiveCategoryPreservative: "Preservative",
  additiveCategoryColour: "Colour",
  additiveCategoryEmulsifier: "Emulsifier",
  additiveCategoryStabiliser: "Stabiliser",
  additiveCategoryThickener: "Thickener",
  additiveCategoryAntioxidant: "Antioxidant",
  additiveCategoryAcidityRegulator: "Acidity regulator",
  additiveCategoryFlavourEnhancer: "Flavour enhancer",
  additiveCategorySweetener: "Sweetener",
  additiveCategoryRaisingAgent: "Raising agent",
  additiveCategoryAntiCaking: "Anti-caking agent",
  additiveCategoryGlazingAgent: "Glazing agent",
  additiveCategoryHumectant: "Humectant",
  additiveCategorySequestrant: "Sequestrant",
  additiveCategoryFoamingAgent: "Foaming agent",
  additiveCategoryOther: "Other",
  unanime: "Unanimous",
  decisionNote: "The decision is yours.",
  analyseAlgorithmique: "Algorithmic analysis",
  voirTout: "See all ({{count}})",
  aucuneAlternative: "No alternatives found",
  ouAcheter: "Where to buy?",
  alternativesHalal: "Halal alternatives",
  conforme: "Compliant",
  nonConforme: "Non-Compliant",
  douteux: "Doubtful",
  voirDetail: "See details",
  donneesAnciennes: "Stale data",
  communityVerified: "Verified by {{count}} members",
  disclaimer: "The information provided is for informational purposes only. Naqiy does not substitute for qualified religious advice. The decision is yours.",
}
```

### Arabic (ar.ts)

```typescript
scanResult: {
  alertsPersonnelles: "تنبيهات شخصية",
  avisEcoles: "رأي المذاهب الأربعة",
  santeNutrition: "الصحة والتغذية",
  additifsDetectes: "المضافات المكتشفة",
  detailNutritionnel: "التفاصيل الغذائية",
  allergenesTitle: "مسببات الحساسية",
  tracesLabel: "آثار",
  decouvrirAussi: "اكتشف أيضاً",
  alternativesPriority: "بدائل متوفرة",
  alternativesDiscover: "اكتشف أيضاً",
  scoreSante: "درجة الصحة",
  scoreExcellent: "ممتاز",
  scoreBon: "جيد",
  scoreMediocre: "متوسط",
  scoreInsuffisant: "ضعيف",
  scoreTresInsuffisant: "ضعيف جداً",
  donneesInsuffisantes: "بيانات غير كافية",
  levelLow: "منخفض",
  levelModerate: "معتدل",
  levelHigh: "مرتفع",
  riskHigh: "خطر مرتفع",
  riskMedium: "خطر معتدل",
  riskLimited: "خطر محدود",
  riskNone: "بدون خطر",
  additiveCategoryPreservative: "مادة حافظة",
  additiveCategoryColour: "ملوّن",
  additiveCategoryEmulsifier: "مستحلب",
  additiveCategoryStabiliser: "مثبّت",
  additiveCategoryThickener: "مكثّف",
  additiveCategoryAntioxidant: "مضاد أكسدة",
  additiveCategoryAcidityRegulator: "منظم حموضة",
  additiveCategoryFlavourEnhancer: "محسّن نكهة",
  additiveCategorySweetener: "مُحلّي",
  additiveCategoryRaisingAgent: "عامل رفع",
  additiveCategoryAntiCaking: "مضاد تكتل",
  additiveCategoryGlazingAgent: "عامل تلميع",
  additiveCategoryHumectant: "مرطّب",
  additiveCategorySequestrant: "عامل حبس",
  additiveCategoryFoamingAgent: "عامل رغوة",
  additiveCategoryOther: "أخرى",
  unanime: "إجماع",
  decisionNote: "القرار يعود لك.",
  analyseAlgorithmique: "تحليل خوارزمي",
  voirTout: "عرض الكل ({{count}})",
  aucuneAlternative: "لم يتم العثور على بدائل",
  ouAcheter: "أين تشتري؟",
  alternativesHalal: "بدائل حلال",
  conforme: "مطابق",
  nonConforme: "غير مطابق",
  douteux: "مشكوك",
  voirDetail: "عرض التفاصيل",
  donneesAnciennes: "بيانات قديمة",
  communityVerified: "تم التحقق بواسطة {{count}} أعضاء",
  disclaimer: "المعلومات المقدمة هي لأغراض إعلامية فقط. نقيّ لا يغني عن استشارة دينية مؤهلة. القرار يعود لك.",
}
```

---

## 14. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Touch targets | ALL pressable elements ≥ 44×44 (WCAG 2.2 AA) |
| Screen reader | `accessibilityRole` on all interactive elements |
| Score Ring | `accessibilityLabel: "Score santé: 80 sur 100, Bon"` |
| Madhab row | `accessibilityLabel: "Maliki: Halal, confiance 85 sur 100"` |
| Nutrient bar | `accessibilityLabel: "Lipides: 12.4 grammes, niveau modéré, 22% valeur quotidienne"` |
| Additive card | `accessibilityLabel: "E471 Mono-glycérides, risque élevé, douteux selon école Hanafi"` |
| Reduced motion | `useReducedMotion()` gates ALL animations |
| RTL Arabic | `rtlFontMultiplier: 1.12` on body/caption sizes, layout mirrors |
| Color contrast | All text meets 4.5:1 contrast ratio on card surfaces |

---

## 15. Edge Cases

| Case | Behavior |
|------|----------|
| No health score | ScoreRing shows "—", label "Données insuffisantes", gray |
| No NutriScore/NOVA/Eco | Badge not rendered |
| No nutrient data | "Détail nutritionnel" sub-section hidden |
| No allergens | "Allergènes" sub-section hidden |
| No additives | Additives card hidden entirely |
| No certifier | Certifier bar hidden, verdict text shown instead |
| No madhab verdicts | HalalVerdictCard shows single status with "Analyse algorithmique" |
| 0 alternatives | "Aucune alternative trouvée" centered text |
| Loading alternatives | 3 shimmer cards horizontal |
| Unknown product | All sections show "Données insuffisantes" states |
| Special product (honey, chocolate) | Extra sub-section in Health card with product-specific info |
| Boycotted product | Alert in AlertStripCard with `severity: "info"`, type "boycott" |
| Stale data | Small "Données anciennes" badge next to tier label |
| 0 ingredients + 0 additives | Footer shows `t.scanResult.unverified` |

---

## 16. Files to Create/Modify/Delete

### Create (7 new files)

| File | Purpose |
|------|---------|
| `src/components/scan/scan-types.ts` | Shared TypeScript types: MadhabVerdict, NutrientItem, DietaryItem, AdditiveItem, HealthEffect, ScholarlyRef |
| `src/components/scan/ScoreRing.tsx` | Animated SVG semi-arc score display |
| `src/components/scan/SectionCard.tsx` | Standard card wrapper (surface, shadow, header pattern) |
| `src/components/scan/AlertStripCard.tsx` | Personal alerts section card |
| `src/components/scan/HalalVerdictCard.tsx` | 4 madhab rows + consensus + footer |
| `src/components/scan/HealthNutritionCard.tsx` | Health dashboard with nutrient bars |
| `src/components/scan/AdditivesCard.tsx` | Additive analysis with danger badges |

### Modify (7 files)

| File | Changes |
|------|---------|
| `src/components/scan/VerdictHero.tsx` | Add ScoreRing component, adjust layout |
| `src/components/scan/CompactStickyHeader.tsx` | Add verdict chip, favorite button |
| `src/components/scan/ScanBottomBar.tsx` | Add gold gradient CTA, context-aware label |
| `src/components/scan/NutrientBar.tsx` | Rewrite to Yuka-style per-nutrient colored bar with level thresholds |
| `src/components/scan/AlternativesSection.tsx` | Add header variants (priority/discover), position logic |
| `src/components/scan/scan-constants.ts` | Add nutrient thresholds, additive risk level mappings |
| `app/scan-result.tsx` | Replace BentoGrid with direct section cards, new scroll architecture |

### Delete (16 files)

| File | Reason |
|------|--------|
| `src/components/scan/AlertStrip.tsx` | Replaced by AlertStripCard |
| `src/components/scan/AlertsTile.tsx` | Replaced by AlertStripCard |
| `src/components/scan/AlternativesTile.tsx` | Replaced by AlternativesSection (modified) |
| `src/components/scan/BentoGrid.tsx` | Replaced by direct cards in scan-result |
| `src/components/scan/BentoTile.tsx` | Replaced by SectionCard |
| `src/components/scan/HalalActionCard.tsx` | Replaced by HalalVerdictCard footer CTA |
| `src/components/scan/HalalAnalysisSection.tsx` | Replaced by AdditivesCard + HalalVerdictCard |
| `src/components/scan/HalalMadhabTile.tsx` | Replaced by HalalVerdictCard |
| `src/components/scan/HealthNutritionSection.tsx` | Replaced by HealthNutritionCard |
| `src/components/scan/HealthScoreTile.tsx` | Replaced by HealthNutritionCard |
| `src/components/scan/KeyCharacteristicsGrid.tsx` | Dietary chips inline in HealthNutritionCard |
| `src/components/scan/MadhabScoreRing.tsx` | Replaced by score rows in HalalVerdictCard |
| `src/components/scan/MadhabVerdictCard.tsx` | Replaced by HalalVerdictCard (complete rewrite) |
| `src/components/scan/PersonalAlerts.tsx` | Replaced by AlertStripCard |
| `src/components/scan/ScanResultTabBar.tsx` | No more tabs — scroll continu |
| `src/components/scan/ScoreDashboardCard.tsx` | Replaced by HealthNutritionCard |

### Keep (12 files — unchanged)

| File | Role |
|------|------|
| `src/components/scan/AlternativeProductCard.tsx` | Card for individual alternative product |
| `src/components/scan/CertifierLogo.tsx` | Certifier logo display |
| `src/components/scan/CriteriaCard.tsx` | Criteria detail cards in bottom sheets |
| `src/components/scan/DietaryChip.tsx` | Dietary label chips (Vegan, Bio, etc.) |
| `src/components/scan/HealthEffectBadge.tsx` | Health effect badges on additives |
| `src/components/scan/MadhabBottomSheet.tsx` | Madhab detail bottom sheet |
| `src/components/scan/NutrientDetailSheet.tsx` | Nutrient detail bottom sheet |
| `src/components/scan/ScanLoadingSkeleton.tsx` | Loading skeleton during scan |
| `src/components/scan/ScanStates.tsx` | Error/not-found/loading states |
| `src/components/scan/ScoreDetailBottomSheet.tsx` | Score detail bottom sheet |
| `src/components/scan/ShareCard.tsx` | Share card capture for social sharing |
| `src/components/scan/TrustScoreBottomSheet.tsx` | Trust score detail bottom sheet |

### i18n (3 files to update)

| File | Changes |
|------|---------|
| `src/i18n/translations/fr.ts` | Add ~30 new keys (section headers, nutrient levels, risk labels) |
| `src/i18n/translations/en.ts` | Same keys, English values |
| `src/i18n/translations/ar.ts` | Same keys, Arabic values |

---

## Verification Checklist

1. **Typecheck**: `cd optimus-halal && pnpm tsc --noEmit` — 0 errors
2. **Lint**: `pnpm lint` — 0 errors
3. **Visual iOS**: Simulateur iPhone 15 — produit certifié (Bjorg) + haram (Haribo) + unknown
4. **Visual Android**: Émulateur — mêmes produits
5. **Dark mode**: Gold accents, card borders, shadows gold tint
6. **RTL Arabic**: Layout miroir, fonts ×1.12
7. **Reduced motion**: Toutes animations skip, états finaux instantanés
8. **Neutralité madhab**: 4 écoles visuellement égales
9. **Zero dark pattern**: Aucun compteur, aucun upsell, aucune fausse urgence
10. **Performance**: 60fps scroll, no jank on nutrient bar animations
11. **Edge cases**: Sans OFF data, produit spécial (miel), boycotté, unknown
12. **Accessibility**: 44×44 targets, screen reader labels, 4.5:1 contrast
