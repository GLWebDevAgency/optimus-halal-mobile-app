# Scan Result — Full Interactivity Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every element on the scan-result screen clickable with a detail bottom sheet, matching the mockup (`docs/mockups/scan-result-horizon.html`) pixel-for-pixel with real data.

**Architecture:** Create a reusable `InfoSheet` wrapper component (DRY — replaces 200+ lines of boilerplate per sheet). Each detail sheet is a small content component (~50-100 lines) rendered inside `InfoSheet`. Existing components (`HalalSchoolsCard`, `HealthNutritionCard`, `VerdictHero`, etc.) gain `onPress` callback props. The orchestrator (`scan-result.tsx`) manages all sheet visibility state and wires data → sheets.

**Tech Stack:** React Native, Reanimated 3, expo-haptics, existing Modal pattern, existing theme tokens.

---

## Architecture Overview

```
scan-result.tsx (orchestrator — manages 19 sheet states)
├── VerdictHero (onImagePress, onVerdictPress, onCertifierPress, onCommunityPress)
├── AlertPillStrip (onAlertPress)
├── ScanResultTabBar + ScanResultPager
│   ├── Page 0 (Halal):
│   │   ├── HalalSchoolsCard (onMadhabPress, onIngredientPress, onAdditivePress, onScholarlyPress)
│   │   ├── Trust Score Row (onPress → TrustScoreSheet)
│   │   ├── AlternativesSection (onAlternativePress)
│   │   └── FeedbackCard (onFeedbackPress)
│   └── Page 1 (Santé):
│       └── HealthNutritionCard (onScorePress, onNutriScorePress, onAxisPress, onNutrientPress, onNovaPress, onAllergenPress, onLabelPress)
├── InfoSheet (reusable wrapper — handle bar, backdrop, swipe-dismiss)
│   ├── IngredientDetailContent
│   ├── AdditiveDetailContent
│   ├── AlternativePreviewContent
│   ├── HealthScoreDetailContent
│   ├── NutriScoreDetailContent
│   ├── AxisDetailContent
│   ├── NovaDetailContent
│   ├── AllergenDetailContent
│   ├── LabelDetailContent
│   ├── CommunityDetailContent
│   ├── AlertDetailContent
│   ├── FeedbackDetailContent
│   └── BoycottDetailContent
└── Existing sheets (TrustScoreBottomSheet, MadhabBottomSheet, etc.)
```

## File Structure

### New Files
| File | Responsibility | ~Lines |
|------|---------------|--------|
| `src/components/scan/InfoSheet.tsx` | Reusable bottom sheet wrapper (Modal + Animated.View + handle + backdrop + swipe) | 120 |
| `src/components/scan/sheets/IngredientDetailContent.tsx` | Ingredient status, halal ruling, explanation | 70 |
| `src/components/scan/sheets/AdditiveDetailContent.tsx` | Additive code, origin, health effects, madhab rulings | 80 |
| `src/components/scan/sheets/AlternativePreviewContent.tsx` | Alternative product preview (image, score, why suggested) | 70 |
| `src/components/scan/sheets/HealthScoreDetailContent.tsx` | Score V3 breakdown (4 axes, confidence, category) | 90 |
| `src/components/scan/sheets/NutriScoreDetailContent.tsx` | NutriScore A-E explanation | 60 |
| `src/components/scan/sheets/AxisDetailContent.tsx` | Single axis deep-dive (score/max, explanation) | 60 |
| `src/components/scan/sheets/NovaDetailContent.tsx` | NOVA 1-4 classification explanation | 70 |
| `src/components/scan/sheets/AllergenDetailContent.tsx` | Allergen detail + EU regulation info | 60 |
| `src/components/scan/sheets/LabelDetailContent.tsx` | Label/certification explanation | 50 |
| `src/components/scan/sheets/CommunityDetailContent.tsx` | Community verification explanation | 50 |
| `src/components/scan/sheets/AlertDetailContent.tsx` | Personal alert detail + management link | 60 |
| `src/components/scan/sheets/BoycottDetailContent.tsx` | Boycott detail (company, reason, source) | 60 |
| `src/components/scan/sheets/FeedbackDetailContent.tsx` | Feedback confirmation or report options | 60 |

### Modified Files
| File | Changes |
|------|---------|
| `src/components/scan/HalalSchoolsCard.tsx` | Add `onIngredientPress`, `onAdditivePress` callback props; wrap chips/items with Pressable |
| `src/components/scan/HealthNutritionCard.tsx` | Add `onScorePress`, `onNutriScorePress`, `onAxisPress`, `onNovaPress`, `onAllergenPress`, `onLabelPress` props; wrap elements; nutrients → 2-col grid |
| `src/components/scan/VerdictHero.tsx` | Add `onVerdictPress`, `onCommunityPress` callback props |
| `src/components/scan/AlertPillStrip.tsx` | Add `onAlertPress` callback prop |
| `src/components/scan/AlternativesSection.tsx` | Add `onAlternativeLongPress` for preview sheet (keep navigate on tap) |
| `src/components/scan/FeedbackCard.tsx` | Add `onFeedbackPress` callback prop for detailed sheet |
| `app/scan-result.tsx` | Add 13 new sheet states; import InfoSheet + all content components; wire all callbacks |

---

## Chunk 1: InfoSheet Reusable Wrapper

### Task 1: Create InfoSheet Component

**Files:**
- Create: `optimus-halal/src/components/scan/InfoSheet.tsx`

- [ ] **Step 1: Create InfoSheet with Modal + Animated.View + swipe-dismiss**

```typescript
// InfoSheet.tsx — Reusable bottom sheet wrapper
// Props: visible, onClose, title?, children
// Features: handle bar, backdrop tap dismiss, FadeIn/SlideInUp animation
// Follows existing pattern from TrustScoreBottomSheet/NutrientDetailSheet
```

Key behaviors:
- `visible` boolean controls Modal visibility
- Backdrop press → `onClose()`
- Handle bar at top (36×4px, theme-aware)
- Optional `title` prop (17px/800 weight)
- `children` slot for content
- `maxHeight: 75%` with scroll
- `accessibilityViewIsModal={true}` (Tier 0 a11y fix)
- Haptic `impact(Light)` on open

- [ ] **Step 2: Verify InfoSheet renders correctly in isolation**

---

## Chunk 2: Detail Sheet Content Components

### Task 2: Create All 13 Detail Content Components

**Files:**
- Create: `optimus-halal/src/components/scan/sheets/` directory (13 files)

Each component is a pure presentational component that receives typed props and renders themed content. No state management — just display.

- [ ] **Step 3: Create IngredientDetailContent**

Props: `{ name: string; status: "halal"|"haram"|"doubtful"|"safe"; ruling?: { explanation: string; scholarlyReference: string | null; rulingBySchool?: Record<string, string> } }`

Content: status dot + label, explanation text, per-school rulings if available.

- [ ] **Step 4: Create AdditiveDetailContent**

Props: `{ code: string; name: string; dangerLevel: number; healthEffects?: HealthEffect[]; madhabRulings?: Record<string, string>; origin?: string }`

Content: code badge, danger level, health effects list, madhab-specific rulings, origin info.

- [ ] **Step 5: Create AlternativePreviewContent**

Props: `{ name: string; brand?: string; imageUrl?: string; healthScore?: number; halalStatus: string; matchReason?: string }`

Content: product image, name, scores, why suggested, "Scanner ce produit" CTA.

- [ ] **Step 6: Create HealthScoreDetailContent**

Props: `{ score: number; label: string; grade: string; axes: AxisData[]; confidence: string; category: string }`

Content: big score display, 4 axes with progress bars, confidence badge, methodology note.

- [ ] **Step 7: Create NutriScoreDetailContent**

Props: `{ grade: string }`

Content: big grade letter, A-E scale visualization, calculation explanation.

- [ ] **Step 8: Create AxisDetailContent**

Props: `{ name: string; score: number; max: number; color: string }`

Content: score display, progress bar, axis-specific explanation (keyed by name).

- [ ] **Step 9: Create NovaDetailContent**

Props: `{ group: number; label: string }`

Content: big group number, 4-level classification with highlight on current.

- [ ] **Step 10: Create AllergenDetailContent**

Props: `{ name: string; isTrace: boolean }`

Content: allergen name, severity, EU regulation reference.

- [ ] **Step 11: Create LabelDetailContent**

Props: `{ name: string }`

Content: label name, generic explanation.

- [ ] **Step 12: Create CommunityDetailContent**

Props: `{ count: number }`

Content: verification count, how it works explanation, contribution CTA.

- [ ] **Step 13: Create AlertDetailContent**

Props: `{ alert: PersonalAlert }`

Content: alert type/severity, description, "Gérer mes alertes" link.

- [ ] **Step 14: Create BoycottDetailContent**

Props: `{ companyName: string; reason: string; sourceUrl?: string; sourceName?: string }`

Content: boycott banner, company info, reason, source link.

- [ ] **Step 15: Create FeedbackDetailContent**

Props: `{ type: "correct" | "report" }`

Content: confirmation message or report option list.

---

## Chunk 3: Wire Click Handlers — Halal Tab Components

### Task 3: Add onPress to HalalSchoolsCard

**Files:**
- Modify: `optimus-halal/src/components/scan/HalalSchoolsCard.tsx`

- [ ] **Step 16: Add `onIngredientPress` and `onAdditivePress` to props interface**

```typescript
// Add to HalalSchoolsCardProps:
onIngredientPress?: (ingredient: { name: string; status: string; ruling?: any }) => void;
onAdditivePress?: (additive: { code: string; name: string; dangerLevel: number; healthEffects?: any[]; madhabRulings?: any }) => void;
```

- [ ] **Step 17: Wrap ingredient chips with PressableScale + onPress callback**

Find the ingredient chip rendering section. Wrap each chip with:
```tsx
<PressableScale onPress={() => onIngredientPress?.({ name, status, ruling })}>
  {/* existing chip content */}
</PressableScale>
```

- [ ] **Step 18: Wrap additive items with onPress callback**

Find the additive item rendering. Add onPress to each item:
```tsx
<PressableScale onPress={() => onAdditivePress?.({ code, name, dangerLevel, healthEffects, madhabRulings })}>
  {/* existing additive content */}
</PressableScale>
```

### Task 4: Add onPress to HealthNutritionCard

**Files:**
- Modify: `optimus-halal/src/components/scan/HealthNutritionCard.tsx`

- [ ] **Step 19: Add callback props to HealthNutritionCardProps**

```typescript
// Add to HealthNutritionCardProps:
onScorePress?: () => void;
onNutriScorePress?: () => void;
onAxisPress?: (axis: { name: string; score: number; max: number; color: string }) => void;
onNovaPress?: () => void;
onAllergenPress?: (allergen: string, isTrace: boolean) => void;
onLabelPress?: (label: string) => void;
```

- [ ] **Step 20: Wrap health score ring with PressableScale + onScorePress**
- [ ] **Step 21: Wrap NutriScore bar with PressableScale + onNutriScorePress**
- [ ] **Step 22: Wrap each axis row with PressableScale + onAxisPress**
- [ ] **Step 23: Wrap NOVA card with PressableScale + onNovaPress**
- [ ] **Step 24: Wrap allergen tags with PressableScale + onAllergenPress**
- [ ] **Step 25: Add labels section + wrap pills with PressableScale + onLabelPress**
- [ ] **Step 26: Convert nutrients from list rows to 2-column grid layout**

Change from `gap: 8` vertical list to:
```tsx
<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
  {nutrients.map(n => (
    <PressableScale key={n.key} style={{ width: "48%" }} onPress={() => onNutrientPress(n)}>
      {/* card: label + value + unit + mini bar */}
    </PressableScale>
  ))}
</View>
```

---

## Chunk 4: Wire Click Handlers — Other Components

### Task 5: Add onPress to VerdictHero

**Files:**
- Modify: `optimus-halal/src/components/scan/VerdictHero.tsx`

- [ ] **Step 27: Add `onVerdictPress` and `onCommunityPress` to VerdictHeroProps**
- [ ] **Step 28: Wrap verdict row with PressableScale + onVerdictPress**
- [ ] **Step 29: Wrap community badge with PressableScale + onCommunityPress**

### Task 6: Add onPress to AlertPillStrip

**Files:**
- Modify: `optimus-halal/src/components/scan/AlertPillStrip.tsx`

- [ ] **Step 30: Add `onAlertPress` callback to AlertPillStripProps**
- [ ] **Step 31: Wrap each alert pill with PressableScale + onAlertPress(alert)**

### Task 7: Add preview sheet to AlternativesSection

**Files:**
- Modify: `optimus-halal/src/components/scan/AlternativesSection.tsx`

- [ ] **Step 32: Add `onAlternativePreview` callback prop**
- [ ] **Step 33: Wire each alternative card to call onAlternativePreview on press (keep navigation as secondary action)**

### Task 8: Add sheet trigger to FeedbackCard

**Files:**
- Modify: `optimus-halal/src/components/scan/FeedbackCard.tsx`

- [ ] **Step 34: Add `onFeedbackPress` callback prop**
- [ ] **Step 35: Wire "Correct" → onFeedbackPress("correct"), "Signaler" → onFeedbackPress("report")**

---

## Chunk 5: Orchestrator Wiring + Visual Tweaks

### Task 9: Wire Everything in scan-result.tsx

**Files:**
- Modify: `optimus-halal/app/scan-result.tsx`

- [ ] **Step 36: Import InfoSheet + all 13 detail content components**
- [ ] **Step 37: Add 13 state variables for new sheets**

```typescript
const [ingredientSheet, setIngredientSheet] = useState<{name:string;status:string;ruling?:any}|null>(null);
const [additiveSheet, setAdditiveSheet] = useState<{code:string;name:string;dangerLevel:number;healthEffects?:any[];madhabRulings?:any}|null>(null);
const [alternativeSheet, setAlternativeSheet] = useState<AlternativeProductUI|null>(null);
const [showHealthSheet, setShowHealthSheet] = useState(false);
const [showNutriScoreSheet, setShowNutriScoreSheet] = useState(false);
const [axisSheet, setAxisSheet] = useState<{name:string;score:number;max:number;color:string}|null>(null);
const [showNovaSheet, setShowNovaSheet] = useState(false);
const [allergenSheet, setAllergenSheet] = useState<{name:string;isTrace:boolean}|null>(null);
const [labelSheet, setLabelSheet] = useState<string|null>(null);
const [showCommunitySheet, setShowCommunitySheet] = useState(false);
const [alertSheet, setAlertSheet] = useState<PersonalAlert|null>(null);
const [boycottSheet, setBoycottSheet] = useState<any|null>(null);
const [feedbackSheet, setFeedbackSheet] = useState<"correct"|"report"|null>(null);
```

- [ ] **Step 38: Pass all new callbacks to child components**

Wire VerdictHero:
```tsx
onVerdictPress={() => setShowHalalAnalysisSheet(true)}
onCommunityPress={() => setShowCommunitySheet(true)}
```

Wire AlertPillStrip:
```tsx
onAlertPress={(alert) => {
  if (alert.type === "boycott") setBoycottSheet(boycott?.targets?.[0] ?? null);
  else setAlertSheet(alert);
}}
```

Wire HalalSchoolsCard:
```tsx
onIngredientPress={(ing) => setIngredientSheet(ing)}
onAdditivePress={(add) => setAdditiveSheet(add)}
```

Wire HealthNutritionCard:
```tsx
onScorePress={() => setShowHealthSheet(true)}
onNutriScorePress={() => setShowNutriScoreSheet(true)}
onAxisPress={(axis) => setAxisSheet(axis)}
onNovaPress={() => setShowNovaSheet(true)}
onAllergenPress={(name, isTrace) => setAllergenSheet({ name, isTrace })}
onLabelPress={(name) => setLabelSheet(name)}
```

Wire AlternativesSection:
```tsx
onAlternativePreview={(alt) => setAlternativeSheet(alt)}
```

Wire FeedbackCard:
```tsx
onFeedbackPress={(type) => setFeedbackSheet(type)}
```

- [ ] **Step 39: Render all 13 InfoSheet instances at bottom of component tree**

```tsx
<InfoSheet visible={!!ingredientSheet} onClose={() => setIngredientSheet(null)} title={ingredientSheet?.name}>
  {ingredientSheet && <IngredientDetailContent {...ingredientSheet} />}
</InfoSheet>
{/* ... repeat for all 13 sheets */}
```

### Task 10: Visual — Trust Score Row in Halal Tab

- [ ] **Step 40: Add trust score row inside HalalSchoolsCard (below madhab rings)**

A simple tappable row: shield icon + "Score de confiance" + score% + chevron. Uses existing `onPress → TrustScoreBottomSheet` wiring.

### Task 11: Visual — Move alternatives + feedback inside pager

- [ ] **Step 41: Move AlternativesSection and FeedbackCard from outside pager to inside halalContent**

Currently they render after the pager. In the mockup they're inside the Halal tab. Move them into the `halalContent` prop of `ScanResultPager`.

---

## Verification

- [ ] **Step 42: Test all 19+ clickable elements open their respective bottom sheet**
- [ ] **Step 43: Verify data flows correctly from tRPC → component → sheet content**
- [ ] **Step 44: Test dark mode + light mode on all sheets**
- [ ] **Step 45: Test with all 3 product types (halal certified, doubtful, haram)**
- [ ] **Step 46: Verify haptic feedback on all interactions**

---

## Summary

| Metric | Count |
|--------|-------|
| New files | 15 (InfoSheet + 13 content + 1 sheets/ barrel) |
| Modified files | 7 |
| New bottom sheets | 13 |
| Existing sheets reused | 6 |
| Total clickable elements | 19+ |
| Estimated effort | 4-6h |
