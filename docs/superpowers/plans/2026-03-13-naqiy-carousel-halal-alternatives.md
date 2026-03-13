# Carousel Halal/Santé + Avis des Écoles + Alternatives — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace linear scroll with 2-tab swipeable carousel (Halal/Santé), redesign "Avis des 4 écoles" with rich scholarly data, and add Hero+Grid alternatives section with reusable CertifierBadge.

**Architecture:** Hybrid scroll+swipe — `Animated.ScrollView` wraps VerdictHero → AlertPillStrip → sticky TabBar → `PagerView` (Halal ↔ Santé) → AlternativesSection → FeedbackCard. TabBar becomes sticky under CompactStickyHeader via scroll position tracking. Each PagerView page is non-scrollable; all content participates in the main vertical scroll.

**Tech Stack:** React Native 0.81, Expo SDK 54, Reanimated 4.1, react-native-pager-view (new), @gorhom/bottom-sheet 5.2, Phosphor Icons, Zustand + MMKV persistence.

**Spec:** `docs/superpowers/specs/2026-03-13-naqiy-carousel-halal-alternatives-design.md`

---

## File Structure

### New Files (in `optimus-halal/src/components/scan/`)

| File | Responsibility |
|------|---------------|
| `ScanResultTabBar.tsx` | 2-tab bar (Halal/Santé) with gold animated indicator, peek hint |
| `ScanResultPager.tsx` | PagerView wrapper synced with TabBar, dynamic height measurement |
| `HalalSchoolsCard.tsx` | Full Halal tab: hero card + segmented bar + 3 accordions + scholarly ribbon |
| `ScholarlySourceSheet.tsx` | BottomSheet for scholarly source detail (title, author, passage ar+fr) |
| `AlternativesSection.tsx` | Replaces existing: header + HeroCard + Grid + CTA + empty state |
| `AlternativeHeroCard.tsx` | Best-match hero card with comparison bar, certifier badge, match pills |
| `AlternativeGridCard.tsx` | Compact 2-column grid card |
| `CertifierBadge.tsx` | Reusable certifier component (compact/extended variants) |
| `FeedbackCard.tsx` | "Votre avis compte" section with local-only feedback |

### Modified Files

| File | Changes |
|------|---------|
| `app/scan-result.tsx` | Replace inline sections with Pager+TabBar architecture, add sticky logic, add adapter layer |
| `src/components/scan/CompactStickyHeader.tsx` | Export HEADER_HEIGHT constant, accept optional tabBar height prop |
| `src/components/scan/scan-types.ts` | Add `MadhabId`, `AlternativeProductUI`, `CertifierInfo` types |
| `src/store/index.ts` | Add `selectedMadhab` to `usePreferencesStore` |
| `src/i18n/translations/fr.ts` | ~30 new keys in `scanResult` section |
| `src/i18n/translations/en.ts` | ~30 new keys |
| `src/i18n/translations/ar.ts` | ~30 new keys |

### New Dependency

| Package | Purpose |
|---------|---------|
| `react-native-pager-view` | Native swipe between tabs (iOS ViewPager / Android ViewPager2) |

---

## Chunk 1: Foundation (Types, Store, Dependencies, TabBar)

### Task 1: Install react-native-pager-view and add types

**Files:**
- Modify: `optimus-halal/package.json`
- Modify: `optimus-halal/src/components/scan/scan-types.ts`

- [ ] **Step 1: Install dependency**

```bash
cd optimus-halal && pnpm add react-native-pager-view
```

- [ ] **Step 2: Add new types to scan-types.ts**

Add after existing type exports:

```typescript
// ─── Madhab ────────────────────────────────
export type MadhabId = "hanafi" | "maliki" | "shafii" | "hanbali";

// ─── Certifier Badge ───────────────────────
export interface CertifierInfo {
  name: string;
  shortName: string;
  logoUrl: string | null;
  trustScore: number;
}

// ─── Alternatives UI ───────────────────────
export interface AlternativeProductUI {
  barcode: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  quantity?: string;
  healthScore: number | null;
  halalStatus: HalalStatusKey;
  certifier: CertifierInfo | null;
  matchReason: string;
  matchType: "exact" | "category" | "similar";
  price?: number;
  availableAt?: string[];
}
```

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/package.json optimus-halal/pnpm-lock.yaml optimus-halal/src/components/scan/scan-types.ts
git commit -m "feat(scan): add pager-view dependency and new types (MadhabId, AlternativeProductUI, CertifierInfo)"
```

---

### Task 2: Add selectedMadhab to Zustand store

**Files:**
- Modify: `optimus-halal/src/store/index.ts`

- [ ] **Step 1: Add selectedMadhab to UserPreferencesState interface**

In `store/index.ts`, add to the `UserPreferencesState` interface:

```typescript
selectedMadhab: "hanafi" | "maliki" | "shafii" | "hanbali";
setMadhab: (madhab: "hanafi" | "maliki" | "shafii" | "hanbali") => void;
```

- [ ] **Step 2: Add implementation in create()**

In the `usePreferencesStore` create function, add:

```typescript
selectedMadhab: "hanafi",
setMadhab: (madhab) => set({ selectedMadhab: madhab }),
```

Default is `"hanafi"` (most followed school in France). The field persists via existing MMKV `persist()` wrapper.

- [ ] **Step 3: Verify build compiles**

```bash
cd optimus-halal && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add optimus-halal/src/store/index.ts
git commit -m "feat(store): add selectedMadhab preference with hanafi default"
```

---

### Task 3: Add i18n keys (fr, en, ar)

**Files:**
- Modify: `optimus-halal/src/i18n/translations/fr.ts`
- Modify: `optimus-halal/src/i18n/translations/en.ts`
- Modify: `optimus-halal/src/i18n/translations/ar.ts`

- [ ] **Step 1: Add keys to fr.ts**

Inside the `scanResult` object, add after existing keys:

```typescript
// ─── Tab Bar ───────────────────────────────
tabHalal: "Halal",
tabHealth: "Santé",

// ─── Onglet Halal — Avis des écoles ───────
schoolHeroTitle: "{{status}} selon l'école {{school}}",
schoolConflicts: "{{count}} conflit(s)",
schoolDoubts: "{{count}} doute(s)",
schoolSources: "{{count}} source(s)",
schoolNoConflicts: "Aucun conflit détecté",
accordionIngredients: "Ingrédients",
accordionAdditives: "Additifs",
accordionCertification: "Certification",
scholarlySourceTitle: "Source savante",

// ─── Section Alternatives ──────────────────
alternativesTitle: "Alternatives halal",
alternativesCount: "{{count}} trouvée(s)",
alternativesBestMatch: "Meilleure correspondance",
alternativesMatchExact: "Même type",
alternativesMatchCategory: "Même catégorie",
alternativesMatchSimilar: "Produit similaire",
alternativesNoneFound: "Aucune alternative trouvée",
alternativesNoneDesc: "Nous n'avons pas encore d'alternative halal pour ce type de produit.",
alternativesSeeAll: "Voir toutes les alternatives",
alternativesScanned: "Scanné",
alternativesAlternative: "Alternative",

// ─── Section Feedback ──────────────────────
feedbackTitle: "Votre avis compte",
feedbackDesc: "Ce produit vous semble mal classé ? Signalez une erreur ou suggérez une correction.",
feedbackCorrect: "Correct",
feedbackReport: "Signaler",
feedbackThanks: "Merci pour votre retour !",
feedbackReportVerdict: "Verdict halal incorrect",
feedbackReportScore: "Score santé incorrect",
feedbackReportMissing: "Informations manquantes",
feedbackReportOther: "Autre",

// ─── Certifieur ────────────────────────────
certifierTrustScore: "Score de confiance",
```

- [ ] **Step 2: Add keys to en.ts**

Same structure with English translations:

```typescript
tabHalal: "Halal",
tabHealth: "Health",
schoolHeroTitle: "{{status}} according to {{school}} school",
schoolConflicts: "{{count}} conflict(s)",
schoolDoubts: "{{count}} doubt(s)",
schoolSources: "{{count}} source(s)",
schoolNoConflicts: "No conflicts detected",
accordionIngredients: "Ingredients",
accordionAdditives: "Additives",
accordionCertification: "Certification",
scholarlySourceTitle: "Scholarly source",
alternativesTitle: "Halal alternatives",
alternativesCount: "{{count}} found",
alternativesBestMatch: "Best match",
alternativesMatchExact: "Same type",
alternativesMatchCategory: "Same category",
alternativesMatchSimilar: "Similar product",
alternativesNoneFound: "No alternatives found",
alternativesNoneDesc: "We don't have halal alternatives for this product type yet.",
alternativesSeeAll: "See all alternatives",
alternativesScanned: "Scanned",
alternativesAlternative: "Alternative",
feedbackTitle: "Your feedback matters",
feedbackDesc: "Does this product seem incorrectly classified? Report an error or suggest a correction.",
feedbackCorrect: "Correct",
feedbackReport: "Report",
feedbackThanks: "Thanks for your feedback!",
feedbackReportVerdict: "Incorrect halal verdict",
feedbackReportScore: "Incorrect health score",
feedbackReportMissing: "Missing information",
feedbackReportOther: "Other",
certifierTrustScore: "Trust score",
```

- [ ] **Step 3: Add keys to ar.ts**

Same structure with Arabic translations:

```typescript
tabHalal: "حلال",
tabHealth: "الصحة",
schoolHeroTitle: "{{status}} حسب المذهب {{school}}",
schoolConflicts: "{{count}} خلاف(ات)",
schoolDoubts: "{{count}} شك(وك)",
schoolSources: "{{count}} مصدر(مصادر)",
schoolNoConflicts: "لم يتم اكتشاف أي خلاف",
accordionIngredients: "المكونات",
accordionAdditives: "المضافات",
accordionCertification: "الشهادة",
scholarlySourceTitle: "المصدر العلمي",
alternativesTitle: "بدائل حلال",
alternativesCount: "{{count}} وُجدت",
alternativesBestMatch: "أفضل تطابق",
alternativesMatchExact: "نفس النوع",
alternativesMatchCategory: "نفس الفئة",
alternativesMatchSimilar: "منتج مشابه",
alternativesNoneFound: "لم يتم العثور على بدائل",
alternativesNoneDesc: "لا تتوفر لدينا بدائل حلال لهذا النوع من المنتجات بعد.",
alternativesSeeAll: "عرض جميع البدائل",
alternativesScanned: "الممسوح",
alternativesAlternative: "البديل",
feedbackTitle: "رأيك مهم",
feedbackDesc: "هل يبدو لك أن هذا المنتج مصنف بشكل خاطئ؟ أبلغ عن خطأ أو اقترح تصحيحًا.",
feedbackCorrect: "صحيح",
feedbackReport: "إبلاغ",
feedbackThanks: "شكرًا لملاحظاتك!",
feedbackReportVerdict: "حكم حلال غير صحيح",
feedbackReportScore: "نتيجة صحية غير صحيحة",
feedbackReportMissing: "معلومات ناقصة",
feedbackReportOther: "أخرى",
certifierTrustScore: "درجة الثقة",
```

- [ ] **Step 4: Verify TypeScript** (i18n keys are typed)

```bash
cd optimus-halal && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add optimus-halal/src/i18n/translations/fr.ts optimus-halal/src/i18n/translations/en.ts optimus-halal/src/i18n/translations/ar.ts
git commit -m "feat(i18n): add ~30 keys for carousel tabs, halal schools, alternatives, feedback (fr/en/ar)"
```

---

### Task 4: Create ScanResultTabBar

**Files:**
- Create: `optimus-halal/src/components/scan/ScanResultTabBar.tsx`

- [ ] **Step 1: Implement ScanResultTabBar**

```typescript
/**
 * ScanResultTabBar — 2-tab bar with gold animated indicator.
 *
 * Props:
 *   activeTab: 0 | 1
 *   onTabPress: (index: number) => void
 *   scrollProgress: SharedValue<number> (0..1 from PagerView)
 *
 * Features:
 *   - Gold underline indicator animated via Reanimated interpolation on scrollProgress
 *   - Tabs: "Halal" | "Santé" (i18n keys: tabHalal, tabHealth)
 *   - Peek hint: slight opacity reduction on inactive tab text
 *
 * Layout reference:
 *   - Height: 44px
 *   - Background: transparent (inherits from parent)
 *   - Indicator: 2px gold bar, width = tab width, translateX interpolated
 *
 * Key implementation details:
 *   - Use useAnimatedStyle for indicator translateX:
 *     interpolate(scrollProgress.value, [0, 1], [0, tabWidth])
 *   - Tab text opacity: active = 1.0, inactive = 0.5
 *   - Tab text color: active = gold[400] dark / gold[700] light, inactive = textMuted
 *   - Indicator color: gold[400] (dark) / gold[600] (light)
 *   - Use useTranslation() for tab labels
 *   - accessibilityRole="tab" on each tab, accessibilityState={{ selected }}
 *   - Export TAB_BAR_HEIGHT = 44
 */
```

Tabs use `Pressable` with `onPress={() => onTabPress(index)}`. The indicator is an `Animated.View` with `position: absolute, bottom: 0, height: 2`.

- [ ] **Step 2: Verify build**

```bash
cd optimus-halal && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/ScanResultTabBar.tsx
git commit -m "feat(scan): create ScanResultTabBar with gold animated indicator"
```

---

### Task 5: Create ScanResultPager

**Files:**
- Create: `optimus-halal/src/components/scan/ScanResultPager.tsx`

- [ ] **Step 1: Implement ScanResultPager**

```typescript
/**
 * ScanResultPager — Wrapper around react-native-pager-view synced with ScanResultTabBar.
 *
 * Props:
 *   activeTab: number
 *   onPageChange: (index: number) => void
 *   onScrollProgress: (position: number, offset: number) => void
 *   halalContent: ReactNode
 *   healthContent: ReactNode
 *
 * Features:
 *   - PagerView with 2 pages
 *   - Dynamic height: measures each page via onLayout, container height = active page height
 *   - Syncs with TabBar via onPageScroll (position + offset → scrollProgress 0..1)
 *   - programmatic page change via ref.setPage(activeTab) when tab pressed
 *
 * Key implementation details:
 *   - PagerView ref for programmatic navigation
 *   - onPageScroll callback: sends (position + offset) as progress to parent
 *   - onPageSelected callback: sends final page index to parent
 *   - Each page wrapped in View with onLayout measuring height
 *   - Container uses useAnimatedStyle with height = interpolated between page heights
 *   - Height transition: withSpring(targetHeight, { damping: 20, stiffness: 150 })
 *   - overdrag={false} to prevent bouncing past last page
 *   - orientation="horizontal"
 */
```

Height measurement: Store `page0Height` and `page1Height` in `useSharedValue`. On `onLayout` for each page's wrapper, update the shared value. Container animated height interpolates between the two based on `activeTab`.

- [ ] **Step 2: Verify build**

```bash
cd optimus-halal && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/ScanResultPager.tsx
git commit -m "feat(scan): create ScanResultPager with dynamic height and tab sync"
```

---

## Chunk 2: CertifierBadge + Alternatives Section

### Task 6: Create CertifierBadge

**Files:**
- Create: `optimus-halal/src/components/scan/CertifierBadge.tsx`

- [ ] **Step 1: Implement CertifierBadge**

```typescript
/**
 * CertifierBadge — Reusable certifier display (compact/extended).
 *
 * Props:
 *   certifier: CertifierInfo (from scan-types.ts)
 *   size: "compact" | "extended"
 *
 * Extended variant (hero card):
 *   - Micro-logo: 28px rounded square, first letter of shortName on colored bg
 *     OR actual logo from logoUrl (Image with contentFit="contain")
 *   - Name: shortName in bold (13px)
 *   - Subtitle: full name in muted (10px) — only in extended
 *   - Score badge: colored dot (6px) + score number + "/100" in muted
 *   - Background: rgba(255,255,255,0.04) + border rgba(255,255,255,0.08), borderRadius 12
 *   - Padding: 8px 10px, gap 8px, flexDirection row, alignItems center
 *
 * Compact variant (grid card):
 *   - Micro-logo: 14px rounded square, same logic
 *   - Name: shortName in bold (9px)
 *   - Score: colored dot (5px) + score number (9px), marginLeft auto
 *   - No subtitle, no "/100"
 *   - No background/border, just inline flex row
 *
 * Color logic (uses getTrustScoreColor from @/theme/colors):
 *   - score >= 70 → halalStatus.halal.base (green)
 *   - score >= 40 → halalStatus.doubtful.base (orange)
 *   - score < 40  → halalStatus.haram.base (red)
 *   Note: getTrustScoreColor uses these exact thresholds.
 *
 * Micro-logo bg: same color at 20% opacity
 *
 * accessibilityLabel: "{shortName}, score de confiance {score} sur 100"
 */
```

- [ ] **Step 2: Verify build**

```bash
cd optimus-halal && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/CertifierBadge.tsx
git commit -m "feat(scan): create reusable CertifierBadge component (compact/extended)"
```

---

### Task 7: Create AlternativeHeroCard

**Files:**
- Create: `optimus-halal/src/components/scan/AlternativeHeroCard.tsx`

- [ ] **Step 1: Implement AlternativeHeroCard**

```typescript
/**
 * AlternativeHeroCard — Best-match alternative with full comparison.
 *
 * Props:
 *   alternative: AlternativeProductUI
 *   scannedProduct: { name: string; halalStatus: HalalStatusKey; healthScore: number | null }
 *   onPress: (barcode: string) => void
 *
 * Layout (top to bottom):
 *   1. Image banner (100px, bg linear-gradient fallback if no imageUrl)
 *      - Top-left: gold badge "✦ MEILLEURE CORRESPONDANCE" (StarIcon from phosphor)
 *        Use t.scanResult.alternativesBestMatch
 *      - Top-right: ScoreRing 36px (healthScore, or "—" if null)
 *
 *   2. Info section (padding 12px 14px):
 *      a. Row: [name + brand + quantity] left, [price gold] right
 *         - Name: 14px semibold white
 *         - Brand + quantity: 12px muted (e.g. "Isla Délice · 200g")
 *         - Price: 16px bold gold[400] (hidden if undefined)
 *
 *      b. CertifierBadge size="extended" (or hidden if certifier is null)
 *
 *      c. Match reason pills (horizontal row, gap 6):
 *         - CrosshairIcon + matchReason (e.g. "Lardons fumés")
 *         - StorefrontIcon + availableAt.join(", ") (if availableAt exists)
 *         - Pill style: bg rgba(255,255,255,0.06), padding 3px 10px, borderRadius 12, text 10px muted
 *
 *      d. Comparison bar:
 *         - Row with divider: "Scanné" | "Alternative"
 *         - Scanné side: halalStatus icon + label (colored), "Score {score}"
 *         - Alternative side: same
 *         - bg rgba(255,255,255,0.04), borderRadius 12, padding 8px 10px
 *
 * Card wrapper:
 *   - PressableScale onPress → onPress(alternative.barcode)
 *   - bg: linear-gradient gold at 12% → 4% (use LinearGradient from expo-linear-gradient)
 *   - border: gold[400] at 25% opacity
 *   - borderRadius: 20
 *   - overflow: hidden
 *
 * Import ScoreRing from ./ScoreRing (existing component)
 * Import CertifierBadge from ./CertifierBadge
 */
```

- [ ] **Step 2: Verify build**

```bash
cd optimus-halal && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/AlternativeHeroCard.tsx
git commit -m "feat(scan): create AlternativeHeroCard with comparison bar and certifier badge"
```

---

### Task 8: Create AlternativeGridCard

**Files:**
- Create: `optimus-halal/src/components/scan/AlternativeGridCard.tsx`

- [ ] **Step 1: Implement AlternativeGridCard**

```typescript
/**
 * AlternativeGridCard — Compact card for 2-column grid.
 *
 * Props:
 *   alternative: AlternativeProductUI
 *   onPress: (barcode: string) => void
 *
 * Layout:
 *   1. Image (width: 100%, height: 56px, borderRadius 10, bg fallback)
 *   2. Name (11px semibold, 2 lines max)
 *   3. Brand (10px muted, 1 line)
 *   4. CertifierBadge size="compact" (hidden if null)
 *   5. Row: ScoreRing 20px (left) — Price gold 11px (right)
 *
 * Card style:
 *   - bg: rgba(255,255,255,0.04)
 *   - border: rgba(255,255,255,0.06)
 *   - borderRadius: 16
 *   - padding: 10
 *
 * Wrap in PressableScale
 */
```

- [ ] **Step 2: Verify build**

```bash
cd optimus-halal && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/AlternativeGridCard.tsx
git commit -m "feat(scan): create AlternativeGridCard for 2-column alternatives grid"
```

---

### Task 9: Create AlternativesSection (replaces existing)

**Files:**
- Create: `optimus-halal/src/components/scan/AlternativesSection.tsx` (overwrites existing)

- [ ] **Step 1: Implement AlternativesSection**

The existing `AlternativesSection.tsx` is deleted in git status. Create the new version:

```typescript
/**
 * AlternativesSection — Header + HeroCard + 2-column Grid + CTA + Empty state.
 *
 * Props:
 *   alternatives: AlternativeProductUI[]
 *   scannedProduct: { name: string; halalStatus: HalalStatusKey; healthScore: number | null }
 *   isLoading: boolean
 *   onAlternativePress: (barcode: string) => void
 *   staggerIndex?: number
 *
 * Layout:
 *   Wrapped in SectionCard (icon: ArrowsClockwiseIcon from phosphor, title: t.scanResult.alternativesTitle)
 *   Right element in header: "{count} trouvée(s)" muted text
 *
 *   A. Loading state: ActivityIndicator + text
 *
 *   B. Empty state (alternatives.length === 0 && !isLoading):
 *      - MagnifyingGlassIcon (48px, muted)
 *      - t.scanResult.alternativesNoneFound (bold)
 *      - t.scanResult.alternativesNoneDesc (muted)
 *      - Centered, padding vertical 24px
 *
 *   C. Results:
 *      1. AlternativeHeroCard (alternatives[0], scannedProduct, onPress)
 *      2. Grid (View with flexDirection row, flexWrap wrap, gap 8):
 *         - alternatives.slice(1).map → AlternativeGridCard
 *         - Each card: width = (containerWidth - gap) / 2
 *         - Use onLayout to measure containerWidth
 *      3. CTA: "Voir toutes les alternatives →" (gold text, centered, margin top 12)
 *         - Only shown if alternatives.length > 3
 *         - onPress → TODO: opens full list BottomSheet (future)
 *
 * Adapter function (exported for use in scan-result.tsx):
 *
 * export function adaptLegacyAlternative(raw: {
 *   id: string; barcode: string | null; name: string | null; brand: string | null;
 *   imageUrl: string | null; halalStatus: string | null; confidenceScore: number | null;
 *   nutriscoreGrade: string | null; novaGroup: number | null;
 * }): AlternativeProductUI {
 *   return {
 *     barcode: raw.barcode ?? raw.id,
 *     name: raw.name ?? "Produit inconnu",
 *     brand: raw.brand ?? "",
 *     imageUrl: raw.imageUrl,
 *     quantity: undefined,
 *     healthScore: null,
 *     halalStatus: (raw.halalStatus as HalalStatusKey) ?? "unknown",
 *     certifier: null,
 *     matchReason: "",
 *     matchType: "category",
 *     price: undefined,
 *     availableAt: undefined,
 *   };
 * }
 */
```

- [ ] **Step 2: Verify build**

```bash
cd optimus-halal && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/AlternativesSection.tsx
git commit -m "feat(scan): create new AlternativesSection with Hero+Grid layout and adapter"
```

---

## Chunk 3: Halal Tab (HalalSchoolsCard + ScholarlySourceSheet)

### Task 10: Create HalalSchoolsCard

**Files:**
- Create: `optimus-halal/src/components/scan/HalalSchoolsCard.tsx`

- [ ] **Step 1: Implement HalalSchoolsCard**

This is the largest component. It contains 4 subcomponents:

```typescript
/**
 * HalalSchoolsCard — Complete Halal tab content.
 *
 * Props:
 *   madhabVerdicts: MadhabVerdict[] (from scan-types.ts, 4 items)
 *   userMadhab: MadhabId
 *   certifierData: { name: string; trustScore: number; logoUrl?: string | null } | null
 *   ingredientRulings: Array<{ pattern: string; ruling: string; explanation: string; scholarlyReference: string | null }>
 *   onMadhabChange: (madhab: MadhabId) => void
 *   onScholarlySourcePress: (sourceRef: string) => void
 *
 * Subcomponents (all internal, not exported):
 *
 * ──────────────────────────────────────────────
 * A. HeroCard (top section)
 * ──────────────────────────────────────────────
 *   - Shows the ACTIVE madhab's verdict (starts with userMadhab)
 *   - State: activeMadhab (local useState, initialized from userMadhab)
 *   - Verdict status → color from STATUS_CONFIG (scan-constants.ts)
 *   - Title: t.scanResult.schoolHeroTitle with interpolation { status: verdictLabel, school: madhabLabel }
 *   - Explanation: find verdict.conflictingAdditives + conflictingIngredients explanations
 *     Concatenate first 2-3 explanation texts for the active madhab
 *   - 3 counters row:
 *     - Conflicts: count of items with ruling !== "halal" in conflictingAdditives + conflictingIngredients
 *     - Doubts: count of items with ruling === "doubtful"
 *     - Sources: count of unique scholarlyReference (non-null) across both arrays
 *   - If conflicts > 0: list inline with:
 *     - Each: name/code + ruling one-liner + scholarlyReference (pressable → onScholarlySourcePress)
 *     - FadeInDown animation on expand
 *
 * ──────────────────────────────────────────────
 * B. SegmentedBar (3 other schools)
 * ──────────────────────────────────────────────
 *   - Horizontal row of 3 pills (the 3 madhabs != activeMadhab)
 *   - Each pill: madhab label + colored dot + status label
 *   - Pressable: onPress → setActiveMadhab(madhab) + animate hero card
 *   - Animation: hero card uses Reanimated layout animation (Layout.springify())
 *   - Also calls onMadhabChange(madhab) to persist to store
 *
 * ──────────────────────────────────────────────
 * C. Accordions (3 expandable sections)
 * ──────────────────────────────────────────────
 *   Each accordion:
 *   - Header: icon + title + caret (rotates on expand)
 *   - Content: animated height (useAnimatedStyle, interpolate 0 → measuredHeight)
 *   - State: expandedSection (null | "ingredients" | "additives" | "certification")
 *     Only one open at a time.
 *
 *   C1. Ingredients accordion:
 *     - Source: ingredientRulings prop (already matched by backend)
 *     - Each item: pattern name + status icon (Check/Warning/X) + ruling text
 *     - Filter by activeMadhab: use ingredient_rulings ruling_[madhab] field
 *       Note: ingredientRulings from scan response already include per-item rulings
 *     - Icon: LeafIcon (Phosphor)
 *
 *   C2. Additives accordion:
 *     - Source: active verdict's conflictingAdditives
 *     - Each item: E-code + name + colored ruling badge per school (4 dots)
 *       For the 4 dots, iterate all 4 verdicts and find the same additive code
 *     - Icon: FlaskIcon (Phosphor)
 *
 *   C3. Certification accordion:
 *     - Source: certifierData prop
 *     - CertifierBadge size="extended"
 *     - Trust score explanation text
 *     - If certifierData is null: "Pas de certification" muted text
 *     - Icon: SealCheckIcon (Phosphor)
 *
 * ──────────────────────────────────────────────
 * D. Scholarly Sources Ribbon
 * ──────────────────────────────────────────────
 *   - Horizontal ScrollView at bottom
 *   - Collect all unique scholarlyReference strings from active verdict
 *   - Each pill: BookOpenIcon + source text (truncated 30 chars)
 *   - Pressable → onScholarlySourcePress(ref)
 *   - Hidden if no sources (array empty)
 *   - Style: bg rgba(255,255,255,0.04), borderRadius 12, padding 6px 12px
 */
```

- [ ] **Step 2: Verify build**

```bash
cd optimus-halal && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/HalalSchoolsCard.tsx
git commit -m "feat(scan): create HalalSchoolsCard with hero, segmented bar, accordions, and scholarly ribbon"
```

---

### Task 11: Create ScholarlySourceSheet

**Files:**
- Create: `optimus-halal/src/components/scan/ScholarlySourceSheet.tsx`

- [ ] **Step 1: Implement ScholarlySourceSheet**

```typescript
/**
 * ScholarlySourceSheet — BottomSheet for scholarly source detail.
 *
 * Props:
 *   visible: boolean
 *   sourceRef: string | null  (the scholarly_reference text from ingredient_rulings)
 *   onClose: () => void
 *
 * Note: In V1, we only have the scholarly_reference TEXT string from ingredient_rulings.
 * We don't yet have a frontend query to scholarly_sources / scholarly_citations tables.
 * This sheet displays the reference text in a formatted way.
 *
 * Future: When backend exposes a scholarly source lookup endpoint,
 * this sheet will show full title, author, passage in Arabic + translation.
 *
 * Layout:
 *   - @gorhom/bottom-sheet with snapPoints ["50%"]
 *   - Header: BookOpenIcon + t.scanResult.scholarlySourceTitle
 *   - Body:
 *     - Source reference text (16px, styled as blockquote with left gold border)
 *     - Muted footer: "Source issue des rulings d'ingrédients"
 *   - Close button (X, top-right)
 *
 * Animation: same pattern as existing MadhabBottomSheet (spring entry, timing exit)
 * Use existing BottomSheet pattern from @gorhom/bottom-sheet (already in project)
 */
```

- [ ] **Step 2: Verify build**

```bash
cd optimus-halal && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/ScholarlySourceSheet.tsx
git commit -m "feat(scan): create ScholarlySourceSheet for scholarly reference display"
```

---

### Task 12: Create FeedbackCard

**Files:**
- Create: `optimus-halal/src/components/scan/FeedbackCard.tsx`

- [ ] **Step 1: Implement FeedbackCard**

```typescript
/**
 * FeedbackCard — "Votre avis compte" section.
 *
 * Props:
 *   staggerIndex?: number
 *
 * State:
 *   - feedbackGiven: null | "correct" | "reported"
 *   - showReportSheet: boolean
 *
 * Layout (when feedbackGiven is null):
 *   Wrapped in SectionCard (icon: StarIcon, title: t.scanResult.feedbackTitle)
 *   - Description text (t.scanResult.feedbackDesc)
 *   - Two buttons row:
 *     a. "Correct" (ThumbsUpIcon) — outline style, flex: 1
 *        onPress: set feedbackGiven="correct", show toast t.scanResult.feedbackThanks
 *     b. "Signaler" (FlagIcon) — outline style, flex: 1
 *        onPress: set showReportSheet=true
 *
 * Layout (when feedbackGiven is "correct"):
 *   - CheckCircleIcon + t.scanResult.feedbackThanks (green, centered)
 *   - FadeIn animation
 *
 * Report BottomSheet (showReportSheet):
 *   - 4 options as pressable rows:
 *     1. t.scanResult.feedbackReportVerdict
 *     2. t.scanResult.feedbackReportScore
 *     3. t.scanResult.feedbackReportMissing
 *     4. t.scanResult.feedbackReportOther
 *   - onPress: store choice in MMKV (noop backend), close sheet, set feedbackGiven="reported"
 *   - Toast: t.scanResult.feedbackThanks
 *
 * Toast: use react-native built-in Alert or a simple Animated toast overlay
 *   (follow existing toast pattern if one exists, otherwise simple Reanimated FadeInUp toast)
 *
 * All feedback is LOCAL ONLY (no backend endpoint). Stored in MMKV for future sync.
 */
```

- [ ] **Step 2: Verify build**

```bash
cd optimus-halal && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/components/scan/FeedbackCard.tsx
git commit -m "feat(scan): create FeedbackCard with local-only feedback and report sheet"
```

---

## Chunk 4: Integration (scan-result.tsx rewrite)

### Task 13: Refactor scan-result.tsx — Pager + TabBar + Sticky integration

**Files:**
- Modify: `optimus-halal/app/scan-result.tsx`
- Modify: `optimus-halal/src/components/scan/CompactStickyHeader.tsx`

This is the critical integration task. It restructures the entire scan-result layout.

- [ ] **Step 1: Export HEADER_HEIGHT from CompactStickyHeader**

In `CompactStickyHeader.tsx`, find the header height constant (currently 52 + insets.top). Export it:

```typescript
export const COMPACT_HEADER_HEIGHT = 52; // without insets — insets added in component
```

- [ ] **Step 2: Add new imports to scan-result.tsx**

```typescript
import { ScanResultTabBar, TAB_BAR_HEIGHT } from "@/components/scan/ScanResultTabBar";
import { ScanResultPager } from "@/components/scan/ScanResultPager";
import { HalalSchoolsCard } from "@/components/scan/HalalSchoolsCard";
import { AlternativesSection, adaptLegacyAlternative } from "@/components/scan/AlternativesSection";
import { FeedbackCard } from "@/components/scan/FeedbackCard";
import { ScholarlySourceSheet } from "@/components/scan/ScholarlySourceSheet";
import { COMPACT_HEADER_HEIGHT } from "@/components/scan/CompactStickyHeader";
import { usePreferencesStore } from "@/store";
import type { MadhabId, AlternativeProductUI } from "@/components/scan/scan-types";
```

- [ ] **Step 3: Add new state variables**

```typescript
// Tab state
const [activeTab, setActiveTab] = useState(0);
const scrollProgress = useSharedValue(0);

// Tab bar sticky
const tabBarY = useSharedValue(0);
const tabBarRef = useRef<View>(null);

// Scholarly source sheet
const [selectedScholarlyRef, setSelectedScholarlyRef] = useState<string | null>(null);

// Madhab from store
const selectedMadhab = usePreferencesStore((s) => s.selectedMadhab);
const setMadhab = usePreferencesStore((s) => s.setMadhab);
```

- [ ] **Step 4: Add tab bar onLayout handler**

```typescript
const handleTabBarLayout = useCallback((event: LayoutChangeEvent) => {
  tabBarY.value = event.nativeEvent.layout.y;
}, []);
```

- [ ] **Step 5: Add sticky tab bar animated style**

```typescript
const insets = useSafeAreaInsets();
const stickyHeaderTotalHeight = COMPACT_HEADER_HEIGHT + insets.top;

const stickyTabBarStyle = useAnimatedStyle(() => {
  const shouldStick = scrollY.value >= tabBarY.value - stickyHeaderTotalHeight;
  const opacity = interpolate(
    scrollY.value,
    [tabBarY.value - stickyHeaderTotalHeight - 20, tabBarY.value - stickyHeaderTotalHeight],
    [0, 1],
    Extrapolation.CLAMP,
  );
  return {
    opacity: shouldStick ? opacity : 0,
    pointerEvents: shouldStick ? "auto" : "none",
  };
});
```

- [ ] **Step 6: Adapt alternatives data**

```typescript
const adaptedAlternatives: AlternativeProductUI[] = useMemo(() => {
  if (!alternativesQuery.data) return [];
  return alternativesQuery.data.map(adaptLegacyAlternative);
}, [alternativesQuery.data]);
```

- [ ] **Step 7: Restructure the scroll content**

Replace the current linear section layout. The new order is:

```
<Animated.ScrollView onScroll={scrollHandler}>
  {/* 1. Hero */}
  <VerdictHero ... />

  {/* 2. Alert strip */}
  <AlertPillStrip ... />

  {/* 3. Inline tab bar (measured for sticky) */}
  <View onLayout={handleTabBarLayout}>
    <ScanResultTabBar
      activeTab={activeTab}
      onTabPress={(i) => setActiveTab(i)}
      scrollProgress={scrollProgress}
    />
  </View>

  {/* 4. Pager (swipeable Halal ↔ Santé) */}
  <ScanResultPager
    activeTab={activeTab}
    onPageChange={setActiveTab}
    onScrollProgress={(pos, offset) => { scrollProgress.value = pos + offset; }}
    halalContent={
      <HalalSchoolsCard
        madhabVerdicts={madhabVerdicts}
        userMadhab={selectedMadhab as MadhabId}
        certifierData={certifierData}
        ingredientRulings={ingredientRulings}
        onMadhabChange={(m) => { setMadhab(m); }}
        onScholarlySourcePress={setSelectedScholarlyRef}
      />
    }
    healthContent={
      <HealthNutritionCard ... /> /* existing props unchanged */
    }
  />

  {/* 5. Alternatives (always visible, below pager) */}
  <AlternativesSection
    alternatives={adaptedAlternatives}
    scannedProduct={{
      name: product?.name ?? "",
      halalStatus: effectiveHeroStatus,
      healthScore: healthScore?.score ?? null,
    }}
    isLoading={alternativesQuery.isLoading}
    onAlternativePress={(barcode) => router.push({ pathname: "/scan-result", params: { barcode } })}
    staggerIndex={3}
  />

  {/* 6. Feedback */}
  <FeedbackCard staggerIndex={4} />

  {/* 7. Disclaimer */}
  <DisclaimerText />
</Animated.ScrollView>

{/* Sticky tab bar clone (absolute positioned) */}
<Animated.View style={[
  { position: "absolute", top: stickyHeaderTotalHeight, left: 0, right: 0, zIndex: 90 },
  stickyTabBarStyle,
]}>
  <ScanResultTabBar
    activeTab={activeTab}
    onTabPress={(i) => setActiveTab(i)}
    scrollProgress={scrollProgress}
  />
</Animated.View>

{/* Existing CompactStickyHeader (zIndex 100, above tab bar) */}
<CompactStickyHeader ... />

{/* Bottom sheets */}
<ScholarlySourceSheet
  visible={selectedScholarlyRef !== null}
  sourceRef={selectedScholarlyRef}
  onClose={() => setSelectedScholarlyRef(null)}
/>
{/* ... existing bottom sheets ... */}
```

Key changes:
- Remove direct HalalVerdictCard render (replaced by HalalSchoolsCard inside pager)
- Remove old AlternativesSection import/render (both priority and discover variants)
- Remove CommunityVoteCard (replaced by FeedbackCard)
- Keep AdditivesCard and HalalDetailCard as-is (they can move inside pager halal content or stay below — implementer should check which makes more sense for content flow)
- Keep all existing bottom sheets

- [ ] **Step 8: Verify build**

```bash
cd optimus-halal && npx tsc --noEmit
```

- [ ] **Step 9: Test on device/simulator**

```bash
cd optimus-halal && npx expo start
```

Manual verification:
- Scroll down: VerdictHero → AlertPillStrip → TabBar appears
- Tab bar becomes sticky when scrolling past it
- Swipe left/right switches between Halal and Santé tabs
- Gold indicator follows the swipe
- Tab press switches page
- Continue scrolling: Alternatives section appears below
- FeedbackCard at the bottom
- Correct button shows toast
- Signaler opens report sheet

- [ ] **Step 10: Commit**

```bash
git add optimus-halal/app/scan-result.tsx optimus-halal/src/components/scan/CompactStickyHeader.tsx
git commit -m "feat(scan): integrate Pager+TabBar architecture with sticky behavior and adapted alternatives"
```

---

### Task 14: Final cleanup and unused file removal

**Files:**
- Delete or verify deletion of files marked as deleted in git status

- [ ] **Step 1: Verify no broken imports**

```bash
cd optimus-halal && npx tsc --noEmit
```

If any imports reference deleted files (BentoGrid, ScanResultTabBar old, etc.), update them.

- [ ] **Step 2: Clean up unused imports in scan-result.tsx**

Remove any imports for components no longer used:
- Old `AlternativesSection` (if different path)
- `CommunityVoteCard` from `InlineScanSections` (replaced by FeedbackCard)
- Any other stale imports

- [ ] **Step 3: Final build verification**

```bash
cd optimus-halal && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(scan): clean up unused imports and verify build"
```

---

## Summary

| Chunk | Tasks | Components Created |
|-------|-------|--------------------|
| 1. Foundation | 1-5 | Types, store, i18n, ScanResultTabBar, ScanResultPager |
| 2. Alternatives | 6-9 | CertifierBadge, AlternativeHeroCard, AlternativeGridCard, AlternativesSection |
| 3. Halal Tab | 10-12 | HalalSchoolsCard, ScholarlySourceSheet, FeedbackCard |
| 4. Integration | 13-14 | scan-result.tsx rewrite, cleanup |

**Total: 14 tasks, ~14 commits**

**Dependency order:** Tasks 1-3 are independent (can parallelize). Tasks 4-5 depend on Task 1 (types). Tasks 6-9 depend on Task 1 (types). Task 10 depends on Task 6 (CertifierBadge). Task 13 depends on ALL previous tasks. Task 14 depends on Task 13.

```
[1] ─┬─ [4] ─── [5]
     ├─ [2]
     ├─ [3]
     ├─ [6] ─── [7] ─── [8] ─── [9]
     └─ [6] ─── [10] ── [11] ── [12]
                                    └─── [13] ── [14]
```
