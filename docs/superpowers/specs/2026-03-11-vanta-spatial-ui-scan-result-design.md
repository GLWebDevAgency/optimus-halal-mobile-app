# Vanta Spatial UI — Scan Result Redesign

**Date**: 2026-03-11
**Status**: Approved
**Scope**: `optimus-halal/app/scan-result.tsx` + 8 new components

---

## 1. Problem Statement

The current scan-result screen is a vertical scroll with sections stacked linearly. Critical information (health, alternatives, ingredients) requires scrolling past the hero (50% viewport). Madhab verdicts use small rings that are hard to read. The floating action bar overlaps content.

**Goal**: Transform into a "Vanta Spatial UI" — a dashboard with a compact hero (35%), a 4-tile Bento Grid (~75% remaining), and adaptive BottomSheets for detail. All existing data points remain accessible; nothing is removed.

---

## 2. Design Principles (Naqiy Pillars)

- **Al-Niyyah**: Verdict is never behind a paywall. 4 schools displayed equally. Informative language ("Composition Conforme"), not authoritative.
- **Al-Taqwa**: Color before text. No dark patterns. Haram = informative, not scary. Alternatives shown before health for haram products (action-positive).
- **Al-Ilm**: Data confidence visible. Analysis source/tier shown. Scholarly references accessible in sheets.
- **Al-Ihsan**: `springNaqiy` (damping:14, stiffness:170, mass:0.9) on all animations. Glass surfaces. Gold accents in dark mode.
- **Al-Amanah**: tRPC type-safe props. Modular components. No new backend changes.

---

## 3. Architecture

### 3.1 Screen Layout (top to bottom)

```
┌─────────────────────────────────────┐
│ FloatingNavButtons                  │  Existing, unchanged
├─────────────────────────────────────┤
│ VerdictHero (35% viewport)          │  Existing, resized
├─────────────────────────────────────┤
│ BentoGrid                          │  NEW — 4 tiles
│  ┌──────────────┬────────┐         │
│  │ HalalMadhab  │ Health │  Row 1  │  2/3 + 1/3
│  │ Tile         │ Tile   │         │
│  ├────────┬─────┴────────┤         │
│  │ Alerts │ Alternatives │  Row 2  │  1/3 + 2/3
│  │ Tile   │ Tile         │         │
│  └────────┴──────────────┘         │
├─────────────────────────────────────┤
│ Community vote (inline JSX)          │  Inline in orchestrator
│ Legal disclaimer (inline JSX)        │  Inline in orchestrator
├─────────────────────────────────────┤
│ ScanBottomBar (fixed)               │  NEW — replaces floating bar
└─────────────────────────────────────┘

Overlay:
│ CompactStickyHeader (on scroll)     │  NEW — appears when hero exits
│ BottomSheets (on tile tap)          │  Existing sheets reused
```

### 3.2 New Components (8)

| # | Component | File | Lines (est.) | Responsibility |
|---|-----------|------|-------------|----------------|
| 1 | `BentoGrid` | `src/components/scan/BentoGrid.tsx` | ~80 | 2-row asymmetric grid layout container |
| 2 | `BentoTile` | `src/components/scan/BentoTile.tsx` | ~120 | Shared glass tile wrapper (bg, border, glow, press) |
| 3 | `HalalMadhabTile` | `src/components/scan/HalalMadhabTile.tsx` | ~150 | Verdict + mini madhab dots + ingredient count summary |
| 4 | `HealthScoreTile` | `src/components/scan/HealthScoreTile.tsx` | ~120 | Score arc + NutriScore/NOVA/EcoScore badges |
| 5 | `AlertsTile` | `src/components/scan/AlertsTile.tsx` | ~100 | Alert count + top 2 preview, or clean state |
| 6 | `AlternativesTile` | `src/components/scan/AlternativesTile.tsx` | ~130 | Image deck + first alternative preview |
| 7 | `CompactStickyHeader` | `src/components/scan/CompactStickyHeader.tsx` | ~100 | 52pt glass header (image + name + verdict pill + certifier logo) |
| 8 | `ScanBottomBar` | `src/components/scan/ScanBottomBar.tsx` | ~120 | Fixed bottom bar: Favori, Partager, contextual CTA, Signaler |

### 3.3 Modified Components

| Component | Change |
|-----------|--------|
| `VerdictHero.tsx` | `HERO_HEIGHT` from `0.50` to `0.35`. Community line font micro. |
| `scan-result.tsx` | Remove scroll sections, add BentoGrid + ScanBottomBar + CompactStickyHeader. Wire tile taps to sheet opens. |

### 3.4 Removed Components

| Component | Reason |
|-----------|--------|
| `ScanActionBar.tsx` | Replaced by `ScanBottomBar` |
| `StickyVerdictHeader.tsx` | Replaced by `CompactStickyHeader` (scroll-interpolation instead of boolean toggle) |

### 3.5 Reused As Sheet Content (unchanged)

`HalalAnalysisSection`, `HealthNutritionSection`, `AlternativesSection`, `AlertStrip`, `MadhabVerdictCard`, `MadhabBottomSheet`, `TrustScoreBottomSheet`, `ScoreDetailBottomSheet`, `NutrientDetailSheet`

---

## 4. Visual Design

### 4.1 Glass Foundation (all 4 tiles)

```
Background:
  Dark:  rgba(255, 255, 255, 0.04)
  Light: #FFFFFF

Border:
  Dark:  glass.dark.border
  Light: glass.light.borderStrong
  Width: 1px

Radius: radius.xl (20)

Shadow:
  iOS:     color=#000, opacity=0.06, offset={0,2}, radius=8
  Android: elevation 2

Inner glow:
  LinearGradient diagonal 45deg
  [statusColor + "08", "transparent"]
```

### 4.2 Tile 1 — HalalMadhabTile (2/3 width, Row 1)

- **Verdict icon**: 32px AppIcon with radial glow behind
- **Verdict text**: fontSize.body (16), fontWeight.bold, status color
- **Trust bar**: 4px height, radius.full, animated fill (springNaqiy)
- **Trust %**: fontSize.caption (12), fontWeight.semiBold
- **Mini madhab row**: 4 colored dots (8px), school labels fontSize.micro (10)
  - User school: gold dot + `★` prefix
  - No SVG rings (too small at this scale)
- **Ingredient summary**: "X ingredients . Y additifs", fontSize.micro (10), textMuted
- **Consensus chip**: "Unanime ✓" if all schools agree, status-colored
- **CTA**: "Voir detail ->", fontSize.caption (12), gold[500]/gold[700]

**Tap action**: Opens a BottomSheet containing `MadhabVerdictCard` + `HalalAnalysisSection` at snap points [70%, 95%].

### 4.3 Tile 2 — HealthScoreTile (1/3 width, Row 1)

- **Score number**: fontSize.h2 (24), fontWeight.black, centered
- **"/100"**: fontSize.micro (10), textMuted
- **Arc SVG**: 180deg half-circle, radius 30px, stroke 4px (uses `react-native-svg`, already a project dependency — used by `MadhabScoreRing`)
  - >= 70: halalStatus.halal.base (green)
  - >= 40: halalStatus.doubtful.base (orange)
  - < 40: halalStatus.haram.base (red)
- **Score label**: fontSize.caption (12), fontWeight.semiBold (e.g., "Bon")
- **Badge row**: NutriScore + NOVA + EcoScore, 20x20 each, colored bg + white letter
- **CTA**: "Voir ->", fontSize.micro (10), gold

**Tap action**: Opens a BottomSheet containing `HealthNutritionSection` at snap points [60%, 90%].

### 4.4 Tile 3 — AlertsTile (1/3 width, Row 2)

**With alerts:**
- **Icon**: WarningCircleIcon 20px, orange
- **Count**: fontSize.h3 (20), fontWeight.bold
- **"alertes"**: fontSize.caption (12), textMuted
- **Preview**: Top 2 alerts, fontSize.micro (10), numberOfLines=1 each
- **Background tint**: orange "0A"

**Zero alerts:**
- **Icon**: CheckCircleIcon 20px, green
- **"Aucune alerte"**: fontSize.caption (12), fontWeight.semiBold
- **"Tout est bon"**: fontSize.micro (10), textMuted
- **Background tint**: green "0A"

**Tap action**: Opens a BottomSheet containing `AlertStrip` at snap point [45%].

### 4.5 Tile 4 — AlternativesTile (2/3 width, Row 2)

- **Header**: "Decouvrir aussi" (halal) / "Des alternatives existent" (haram/doubtful)
  - fontSize.caption (12), fontWeight.bold, uppercase
- **Count**: "X produits", fontSize.micro (10), textMuted
- **Image deck**: 3 images 48x48, radius.md, overlap -8px translateX (card deck effect)
- **First alternative**: product name, fontSize.bodySmall (14), fontWeight.semiBold, numberOfLines=1
- **Halal badge**: small pill next to product name
- **CTA**: "Voir tout ->", fontSize.caption (12), gold

**Haram/doubtful accent**: border uses halalStatus.halal.base + "30" (encouraging — alternatives exist).

**Zero alternatives**: "Aucune alternative trouvee", no CTA.

**Tap action**: Opens a BottomSheet containing `AlternativesSection` at snap points [55%, 85%].

### 4.6 Dark Mode Accents

| Element | Dark | Light |
|---------|------|-------|
| Tile bg | rgba(255,255,255, 0.04) | #FFFFFF |
| Tile border | glass.dark.border | glass.light.borderStrong |
| Status glow | statusColor + "12" | statusColor + "08" |
| CTA text | gold[400] | gold[700] |
| Trust bar | gold gradient | gold gradient |
| Section titles | gold[400] uppercase | gold[700] uppercase |

---

## 5. Hero Compact (35% viewport)

### 5.1 Layout

`HERO_HEIGHT = SCREEN_HEIGHT * 0.35` (~295pt on iPhone 15)

**Sizing strategy**: The hero switches from fixed-height container to `minHeight: HERO_HEIGHT` with intrinsic content sizing. If content is shorter (e.g., no certifier), it shrinks. If taller on small screens, it grows. The BentoGrid below uses `flex: 1` to fill remaining space.

**Compression vs current 50% hero**: Image shrinks 80x80 -> 72x72 (-8pt). Community line font micro (-4pt). Verdict + trust bar spacing tightened (marginBottom md -> sm on each, saves ~16pt). Certifier bar unchanged (non-condensed). Total saved: ~130pt, fits in 295pt.

Content (top to bottom):

1. Product image 72x72 (glass card) + verdict text + trust bar + confidence dots
2. Product name + brand + barcode
3. Certifier bar (full, non-condensed — same as current)
4. Community verification count (fontSize.micro)

### 5.2 Compact Sticky Header

Appears when hero scrolls out of viewport. 52pt height, glassmorphic.

```
[<-] [IMG 28x28] Product . Brand  [● Conforme] [CertLogo 16]
```

- **Background**: Dark rgba(12,12,12, 0.85) / Light rgba(255,255,255, 0.90)
- **Border bottom**: glass border token
- **Transition**: opacity + translateY interpolation over last 60pt of hero scroll
  - scrollY in [HERO_HEIGHT - 60, HERO_HEIGHT] maps to [hidden, visible]

---

## 6. Bottom Bar

Fixed at bottom, replacing the floating action bar. Styled like `PremiumTabBar`.

**Height**: 56pt + safeAreaBottom

**Background**: Dark rgba(12,12,12, 0.92) / Light rgba(255,255,255, 0.95) + border-top glass token

**4 actions** (slot 3 is contextual, same as existing `ScanActionBar`):

| Slot | Icon | Label | Action | Condition |
|------|------|-------|--------|-----------|
| 1 | HeartIcon | Favori | Toggle favorite | Always |
| 2 | ShareNetworkIcon | Partager | Native share sheet | Always |
| 3 | StorefrontIcon | Ou acheter ? | Navigate to marketplace | halal/doubtful products |
| 3 | BarcodeIcon | Re-scanner | Navigate back to scanner | haram/unknown products |
| 4 | FlagIcon | Signaler | Navigate to report | Always |

Slot 3 switches icon + label based on `effectiveHeroStatus`. This preserves the existing contextual CTA behavior from `ScanActionBar`.

**Typography**: Icons 22px, labels fontSize.micro (10), textMuted.

---

## 7. Animation Choreography

### 7.1 Entry Timeline

```
T+0ms     Hero gradient            dramaticFadeIn (800ms)
T+50ms    Product image            ZoomIn.springify(springNaqiy)
T+100ms   Verdict text             FadeIn (300ms)
T+150ms   Trust bar fill           withTiming(1000ms, easeOut)
T+200ms   Confidence dots          FadeIn (200ms)
T+250ms   Product name + brand     FadeIn (300ms)
T+350ms   Certifier chip           FadeInUp.springify(springNaqiy)
T+450ms   Community line           FadeIn (200ms)
T+500ms   BentoGrid container      FadeInUp.springify(springNaqiy)
T+560ms   Tile 1 (Halal)           FadeInUp stagger(0)
T+620ms   Tile 2 (Health)          FadeInUp stagger(1)
T+680ms   Tile 3 (Alerts)          FadeInUp stagger(2)
T+740ms   Tile 4 (Alternatives)    FadeInUp stagger(3)
T+850ms   Bottom Bar               SlideInUp (durations.slow)
```

All spring animations use `springNaqiy` (damping:14, stiffness:170, mass:0.9).
Stagger base delay: 60ms (from theme `staggerDelay`).

### 7.2 Scroll Transitions

- **Hero to sticky header**: Linear interpolation over scrollY [HERO_HEIGHT - 60, HERO_HEIGHT]
  - Header opacity: 0 -> 1
  - Header translateY: -52 -> 0
- **No parallax on hero** (simplicity)

### 7.3 Tile Interactions

- **Press in**: PressableScale 0.97 (springNaqiy)
- **Press out**: PressableScale 1.0 (springNaqiy)
- **Sheet open**: @gorhom/bottom-sheet with springNaqiy config, backdrop opacity 0 -> 0.5 (300ms)

### 7.4 Reduced Motion

When `useReducedMotion()` returns true:
- All `entering=` props removed (instant final state)
- Trust bar: no animation, direct value
- PressableScale: fixed scale 1.0
- Sheet: no spring, direct snap
- Sticky header: opacity toggle, no interpolation

### 7.5 Haptics

| Action | Type |
|--------|------|
| Tap tile | impact() light |
| Open sheet | impact() medium |
| Toggle favorite | impact() light |
| Share | impact() light |
| Report | notification() warning |

---

## 8. BottomSheet Configuration

| Trigger Tile | Sheet Content | Snap Points | Index |
|-------------|---------------|-------------|-------|
| HalalMadhabTile | MadhabVerdictCard + HalalAnalysisSection | [70%, 95%] | 0 |
| HealthScoreTile | HealthNutritionSection | [60%, 90%] | 0 |
| AlertsTile | AlertStrip (expanded) | [45%] | 0 |
| AlternativesTile | AlternativesSection | [55%, 85%] | 0 |

**Sheet implementation**: The existing bottom sheets (`MadhabBottomSheet`, `TrustScoreBottomSheet`, `ScoreDetailBottomSheet`, `NutrientDetailSheet`) use custom Reanimated-based sliding modals with a `visible: boolean` prop pattern. The **4 new tile-triggered sheets** use `@gorhom/bottom-sheet` v5.2.8 (already a project dependency, used in `StoreDetailCard`). These are NEW sheet wrappers that embed the existing section components as content children:

```tsx
// Example: Halal detail sheet (new wrapper)
<BottomSheet ref={halalSheetRef} snapPoints={['70%', '95%']} index={-1} ...>
  <MadhabVerdictCard {...madhabProps} />
  <HalalAnalysisSection {...analysisProps} />
</BottomSheet>
```

The existing modal-based sheets (`MadhabBottomSheet`, etc.) remain for their current trigger paths (e.g., tapping a specific madhab ring inside the sheet content). They are NOT replaced.

Sheet config:
- `enableDynamicSizing={false}`
- `backgroundStyle` matching glass tokens
- `handleIndicatorStyle` with gold accent in dark mode
- `backdropComponent` with animated opacity

---

## 9. Contextual Reordering (Haram/Doubtful)

When `effectiveHeroStatus` is "haram" or "doubtful":
- **Row 2 tiles swap**: AlternativesTile (2/3) moves to left, AlertsTile (1/3) moves to right
- AlternativesTile header changes to "Des alternatives existent" (encouraging)
- AlternativesTile border gets halal green accent (action-positive, per Al-Taqwa)

This is a prop-level change on BentoGrid (`prioritizeAlternatives={true}`), not a layout restructure.

---

## 10. Preserved Features (not in Bento Grid)

The following existing features remain in `scan-result.tsx` as inline JSX, unchanged:

| Feature | Current location | New location |
|---------|-----------------|--------------|
| Boycott info | Passed to `HalalAnalysisSection` | Same — inside Halal detail sheet |
| User vote (thumbs up/down) | Inline JSX in orchestrator | Inline JSX below BentoGrid (before disclaimer) |
| Quota banner (anonymous scan limit) | Inline JSX, conditional | Inline JSX, same position (below BentoGrid) |
| Level-up celebration overlay | Modal overlay in orchestrator | Unchanged — stays as overlay |
| Product image preview modal | Modal triggered by image tap | Unchanged — triggered from VerdictHero image |
| Share card (off-screen capture) | Off-screen `ViewShot` | Unchanged — ref-based, invisible |

None of these features are removed or relocated to tiles/sheets. They stay in the orchestrator.

---

## 11. BentoGrid Props Interface

```tsx
interface BentoGridProps {
  /** Swap Row 2 tiles (alternatives left) for haram/doubtful products */
  prioritizeAlternatives: boolean;
  children?: never; // tiles are internal, not passed as children
  // Tile data props:
  halalAnalysis: HalalAnalysis;
  madhabVerdicts: MadhabVerdict[];
  certifierData: CertifierData | null;
  product: Product;
  healthScore: HealthScore | null;
  offExtras: OffExtras | null;
  personalAlerts: PersonalAlert[];
  alternativesData: AlternativeProduct[];
  alternativesLoading: boolean;
  // Sheet open callbacks (state managed in scan-result.tsx):
  onOpenHalalSheet: () => void;
  onOpenHealthSheet: () => void;
  onOpenAlertsSheet: () => void;
  onOpenAlternativesSheet: () => void;
}
```

Sheet refs (`BottomSheetRef`) live in `scan-result.tsx`. Each `onOpen*` callback calls `sheetRef.current?.snapToIndex(0)`. BentoGrid passes them down to individual tiles.

---

## 12. Data Flow

No backend changes. All data comes from the existing `useScanBarcode()` tRPC mutation.

```
scan-result.tsx (orchestrator)
  |-- VerdictHero        <- product, halalAnalysis, certifierData
  |-- BentoGrid
  |   |-- HalalMadhabTile   <- halalAnalysis, madhabVerdicts, certifierData, product.ingredients
  |   |-- HealthScoreTile   <- healthScore, offExtras
  |   |-- AlertsTile        <- personalAlerts (from useScanBarcode mutation data)
  |   |-- AlternativesTile  <- alternativesQuery (from tRPC)
  |-- CompactStickyHeader   <- product, halalAnalysis, certifierData (condensed)
  |-- ScanBottomBar          <- callbacks (favorite, share, navigate, report)
  |-- BottomSheets           <- same props as current section components
```

---

## 13. Files Impact Summary

### New files (8)
- `src/components/scan/BentoGrid.tsx`
- `src/components/scan/BentoTile.tsx`
- `src/components/scan/HalalMadhabTile.tsx`
- `src/components/scan/HealthScoreTile.tsx`
- `src/components/scan/AlertsTile.tsx`
- `src/components/scan/AlternativesTile.tsx`
- `src/components/scan/CompactStickyHeader.tsx`
- `src/components/scan/ScanBottomBar.tsx`

### Modified files (2)
- `app/scan-result.tsx` — Replace scroll sections with BentoGrid, add sticky header + bottom bar, wire sheet opens
- `src/components/scan/VerdictHero.tsx` — HERO_HEIGHT 0.50 -> 0.35, community line font micro

### Removed files (2)

- `src/components/scan/ScanActionBar.tsx` — Replaced by ScanBottomBar
- `src/components/scan/StickyVerdictHeader.tsx` — Replaced by CompactStickyHeader

### Unchanged (reused as sheet content)
- `HalalAnalysisSection.tsx`, `HealthNutritionSection.tsx`, `AlternativesSection.tsx`, `AlertStrip.tsx`
- `MadhabVerdictCard.tsx`, `MadhabBottomSheet.tsx`, `TrustScoreBottomSheet.tsx`
- `ScoreDetailBottomSheet.tsx`, `NutrientDetailSheet.tsx`

---

## 14. Verification Checklist

1. **Typecheck**: `cd optimus-halal && pnpm tsc --noEmit` — 0 errors
2. **All data accessible**: Every field from useScanBarcode reachable via tiles + sheets
3. **Tile tap -> correct sheet**: Each tile opens the right BottomSheet with right content
4. **Sticky header**: Appears/disappears smoothly on scroll
5. **Bottom bar**: Fixed, does not overlap content (paddingBottom accounts for bar height)
6. **Dark/Light mode**: Glass surfaces, gold accents, status glow correct
7. **Reduced motion**: All animations disabled, instant states
8. **RTL (Arabic)**: Layout mirrors, font scale 1.12x
9. **Performance**: 60fps scroll (Reanimated UI thread only)
10. **Al-Niyyah**: 4 schools equal, informative verdicts
11. **Al-Taqwa**: No dark patterns, alternatives prioritized for haram
12. **Contextual reorder**: Haram/doubtful swaps Row 2 tiles
