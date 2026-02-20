# Gold Dark Theme — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the green-tinted "deep forest" dark mode with a luxury gold/anthracite dark mode matching the approved screenshot.

**Architecture:** Modify dark-mode tokens at the source (colors.ts, shadows.ts, useTheme.ts) so all components using `useTheme()` auto-update. Then fix the ~8 components with hardcoded `brand.primary` or `#13ec6a` references. Finally sweep ~15 screen files that use raw hex green values.

**Tech Stack:** React Native, Expo, TypeScript, expo-linear-gradient, react-native-reanimated, react-native-svg

---

### Task 1: Update darkTheme tokens in colors.ts

**Files:**
- Modify: `optimus-halal/src/theme/colors.ts:184-225` (darkTheme object)

**Step 1: Update darkTheme backgrounds and text**

Replace the darkTheme object (lines 184-225):

```typescript
export const darkTheme = {
  /** Page-level backgrounds */
  background: "#121212",
  backgroundSecondary: "#1A1A1A",

  /** Cards and elevated surfaces */
  card: "#1E1E1E",
  cardBorder: "rgba(207, 165, 51, 0.15)",

  /** Typography hierarchy */
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A0A0",
  textMuted: "#6b7280",
  textInverse: "#1A1A1A",

  /** Borders */
  border: "rgba(255, 255, 255, 0.10)",
  borderLight: "rgba(255, 255, 255, 0.05)",
  borderStrong: "rgba(255, 255, 255, 0.18)",

  /** Overlay */
  overlay: "rgba(0, 0, 0, 0.60)",
  overlayHeavy: "rgba(0, 0, 0, 0.80)",

  /** Buttons */
  buttonSecondary: "rgba(255, 255, 255, 0.04)",
  buttonSecondaryHover: "rgba(255, 255, 255, 0.08)",

  /** Icons */
  iconPrimary: "#FFFFFF",
  iconSecondary: "#A0A0A0",

  /** Status scores (unchanged — halal verdicts stay consistent) */
  statusExcellent: "#22c55e",
  statusExcellentBg: "rgba(34, 197, 94, 0.20)",
  statusBon: "#13ec6a",
  statusBonBg: "rgba(19, 236, 106, 0.20)",
  statusMoyen: "#f97316",
  statusMoyenBg: "rgba(249, 115, 22, 0.20)",
  statusMauvais: "#ef4444",
  statusMauvaisBg: "rgba(239, 68, 68, 0.20)",
} as const;
```

**Step 2: Update glass.dark tokens**

Replace glass.dark (lines 258-264):

```typescript
dark: {
  bg: "rgba(255, 255, 255, 0.04)",
  bgSubtle: "rgba(255, 255, 255, 0.02)",
  border: "rgba(207, 165, 51, 0.20)",
  borderStrong: "rgba(207, 165, 51, 0.30)",
  highlight: "rgba(207, 165, 51, 0.08)",
},
```

**Step 3: Update gradients**

Replace heroDark gradient (line 313):

```typescript
heroDark: ["#121212", "#1A1A1A"] as const,
```

**Step 4: Update file header comment**

Replace lines 8-10:

```typescript
 *  - Primary green (#13ec6a) for light mode — ELECTRIC and ALIVE
 *  - Dark mode = luxury gold (#D4AF37) on anthracite (#121212)
 *  - Light mode = "clean and warm" (not sterile white)
```

**Step 5: Commit**

```bash
git add optimus-halal/src/theme/colors.ts
git commit -m "feat(theme): replace dark mode green tokens with gold/anthracite palette"
```

---

### Task 2: Update darkShadows in shadows.ts

**Files:**
- Modify: `optimus-halal/src/theme/shadows.ts:89-134` (darkShadows object)

**Step 1: Update shadow imports**

Add gold import at line 15:

```typescript
import { primary, gold } from "./colors";
```

**Step 2: Update darkShadows to use gold palette**

Replace darkShadows (lines 89-134):

```typescript
export const darkShadows = {
  subtle: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 4,
    elevation: 1,
  } satisfies ShadowPreset,

  card: {
    shadowColor: gold[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 3,
  } satisfies ShadowPreset,

  float: {
    shadowColor: gold[800],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  } satisfies ShadowPreset,

  hero: {
    shadowColor: gold[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  } satisfies ShadowPreset,

  glow: {
    shadowColor: gold[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.40,
    shadowRadius: 20,
    elevation: 4,
  } satisfies ShadowPreset,
} as const;
```

**Step 3: Update file header comment (line 8)**

```typescript
 * Dark-mode shadows use a subtle gold glow from the gold accent color
 * to reinforce the luxury aesthetic.
```

**Step 4: Commit**

```bash
git add optimus-halal/src/theme/shadows.ts
git commit -m "feat(theme): dark shadows use gold glow instead of green"
```

---

### Task 3: Make useTheme primary & gradients theme-aware

**Files:**
- Modify: `optimus-halal/src/hooks/useTheme.ts`

**Step 1: Add gold import**

Update imports (line 16-21):

```typescript
import {
  brand,
  gold,
  lightTheme,
  darkTheme,
  ramadan as ramadanColors,
  gradients,
} from "@/theme/colors";
```

**Step 2: Update primary color resolution in useMemo**

Replace lines 56-63 (primary section in the colors useMemo):

```typescript
    // Primary — gold in dark mode, green in light, gold during Ramadan
    primary: isRamadan ? ramadanColors.gold : isDark ? gold[500] : brand.primary,
    primaryDark: isRamadan ? ramadanColors.indigo : isDark ? "#CFA533" : brand.primaryDark,
    primaryLight: isRamadan
      ? ramadanColors.crescentGlow
      : isDark
        ? "rgba(207, 165, 51, 0.15)"
        : "rgba(19, 236, 106, 0.10)",
```

**Step 3: Update buttonPrimary (line 81)**

```typescript
    buttonPrimary: isRamadan ? ramadanColors.gold : isDark ? gold[500] : brand.primary,
```

**Step 4: Add primaryGradient and premiumGradient to return value**

After the heroGradient useMemo (after line 96), add:

```typescript
  // Primary gradient — gold in dark mode
  const primaryGradient = useMemo(() =>
    isRamadan
      ? (gradients.ramadanPrimary)
      : isDark
        ? (["#FDE08B", "#CFA533"] as const)
        : (gradients.primary),
    [isDark, isRamadan],
  );
```

**Step 5: Add primaryGradient to return object (line 112-123)**

Add `primaryGradient,` to the return object alongside `heroGradient`.

**Step 6: Commit**

```bash
git add optimus-halal/src/hooks/useTheme.ts
git commit -m "feat(theme): useTheme resolves gold primary and gradients in dark mode"
```

---

### Task 4: Update PremiumTabBar for gold dark mode

**Files:**
- Modify: `optimus-halal/src/components/navigation/PremiumTabBar.tsx`

**Step 1: Update imports (line 42)**

Replace:
```typescript
import { brand, gradients, darkTheme } from "@/theme/colors";
```
With:
```typescript
import { brand, gold, gradients, darkTheme } from "@/theme/colors";
```

**Step 2: Make TabItem activeColor theme-aware (line 174)**

Replace:
```typescript
  const activeColor = brand.primary;
```
With:
```typescript
  const activeColor = isDark ? gold[500] : brand.primary;
```

**Step 3: Update CenterScannerButton glow colors (lines 321-324)**

Replace the outerGlow LinearGradient colors:
```typescript
colors={isDark
  ? ["rgba(207, 165, 51, 0.25)", "rgba(207, 165, 51, 0)"]
  : ["rgba(19, 236, 106, 0.25)", "rgba(19, 236, 106, 0)"]}
```

**Step 4: Update scanning ring color (line 330)**

Replace:
```typescript
colors={["transparent", brand.primary, "transparent"]}
```
With:
```typescript
colors={["transparent", isDark ? gold[500] : brand.primary, "transparent"]}
```

**Step 5: Update button ring border color (line 342)**

Replace:
```typescript
borderColor: isDark ? "rgba(16,34,23,0.8)" : "rgba(255,255,255,0.9)",
```
With:
```typescript
borderColor: isDark ? "rgba(207,165,51,0.4)" : "rgba(255,255,255,0.9)",
```

**Step 6: Update center button gradient (lines 360-363)**

Replace:
```typescript
colors={isDark
  ? ["rgba(255,255,255,0.95)", "rgba(240,255,245,0.9)"]
  : [...gradients.heroDark]
}
```
With:
```typescript
colors={isDark
  ? ["#FDE08B", "#CFA533"]
  : [...gradients.heroDark]
}
```

**Step 7: Update center button icon color (line 374)**

Replace:
```typescript
color={isDark ? darkTheme.textInverse : brand.primary}
```
With:
```typescript
color={isDark ? "#1A1A1A" : brand.primary}
```

**Step 8: Update center button shadow (line 694 in styles)**

The `centerButton` style uses `brand.primary` for shadowColor. Make it dynamic — move shadowColor to inline style in CenterScannerButton. Add to the `AnimatedTouchable` style at line 355:

```typescript
style={[
  styles.centerButton,
  animatedButtonStyle,
  {
    zIndex: 10,
    ...Platform.select({
      ios: { shadowColor: isDark ? "#CFA533" : brand.primary },
    }),
  },
]}
```

And remove the `shadowColor` from the static `centerButton` style (line 694).

**Step 9: Update Android tab bar fallback bg (line 459)**

Replace:
```typescript
backgroundColor: isDark
  ? "rgba(10, 20, 14, 0.97)"
  : "rgba(255, 255, 255, 0.97)",
```
With:
```typescript
backgroundColor: isDark
  ? "rgba(18, 18, 18, 0.97)"
  : "rgba(255, 255, 255, 0.97)",
```

**Step 10: Update background overlay (line 471)**

Replace:
```typescript
backgroundColor: isDark
  ? "rgba(10, 20, 14, 0.85)"
  : "rgba(255, 255, 255, 0.85)",
```
With:
```typescript
backgroundColor: isDark
  ? "rgba(18, 18, 18, 0.85)"
  : "rgba(255, 255, 255, 0.85)",
```

**Step 11: Update top border glow gradient (lines 478-484)**

Replace:
```typescript
colors={[
  "transparent",
  brand.primary + "40",
  brand.primary + "80",
  brand.primary + "40",
  "transparent",
]}
```
With:
```typescript
colors={[
  "transparent",
  (isDark ? gold[500] : brand.primary) + "40",
  (isDark ? gold[500] : brand.primary) + "80",
  (isDark ? gold[500] : brand.primary) + "40",
  "transparent",
]}
```

Note: This requires passing `isDark` into the parent component's render. The `PremiumTabBar` function already has `isDark` from `useTheme()` at line 396.

**Step 12: Commit**

```bash
git add optimus-halal/src/components/navigation/PremiumTabBar.tsx
git commit -m "feat(theme): gold scanner FAB, tab active color, and glow in dark mode"
```

---

### Task 5: Update IslamicPattern default color

**Files:**
- Modify: `optimus-halal/src/components/ui/IslamicPattern.tsx:33-37`

**Step 1: Make default color and opacity theme-aware**

The component currently takes `color = brand.primary` and `opacity = 0.03` as defaults. Since this is a pure component without hooks, we need to add `useTheme` support. Update the component:

```typescript
import { useTheme } from "@/hooks/useTheme";

export const IslamicPattern: React.FC<IslamicPatternProps> = ({
  variant = "tessellation",
  color,
  opacity,
  style,
}) => {
  const { isDark } = useTheme();
  const resolvedColor = color ?? (isDark ? "#808080" : brand.primary);
  const resolvedOpacity = opacity ?? (isDark ? 0.06 : 0.03);
  const pattern = PATTERN_PATHS[variant];
  return (
    <View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, style]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={`islamic-${variant}`} x="0" y="0" width={pattern.size} height={pattern.size} patternUnits="userSpaceOnUse">
            <Path d={pattern.d} fill={resolvedColor} fillOpacity={resolvedOpacity} stroke={resolvedColor} strokeOpacity={resolvedOpacity * 0.5} strokeWidth={0.5} />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#islamic-${variant})`} />
      </Svg>
    </View>
  );
};
```

**Step 2: Commit**

```bash
git add optimus-halal/src/components/ui/IslamicPattern.tsx
git commit -m "feat(theme): islamic pattern uses greyscale in dark mode, green in light"
```

---

### Task 6: Update GlowCard default glowColor

**Files:**
- Modify: `optimus-halal/src/components/ui/GlowCard.tsx:22-28`

**Step 1: Make glowColor theme-aware**

Replace lines 22-28:

```typescript
export const GlowCard: React.FC<GlowCardProps> = ({
  glowColor,
  glowIntensity = "subtle",
  children,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const resolvedGlowColor = glowColor ?? colors.primary;
```

And update the `shadowColor` reference at line 41 from `glowColor` to `resolvedGlowColor`.

**Step 2: Commit**

```bash
git add optimus-halal/src/components/ui/GlowCard.tsx
git commit -m "feat(theme): GlowCard uses theme-aware primary for glow"
```

---

### Task 7: Update Button primary gradient

**Files:**
- Modify: `optimus-halal/src/components/ui/Button.tsx`

**Step 1: Make primary gradient theme-aware**

The Button component uses static `variantStyles` at module scope. Since we need theme context, we must make the gradient dynamic. Add `useTheme` to the component and override the gradient in the render.

Update the component (around line 74):

```typescript
export const Button: React.FC<ButtonProps> = ({ variant = "primary", ...rest }) => {
  const { impact } = useHaptics();
  const { isDark } = useTheme();
  // ... existing logic ...
```

Add `useTheme` import:
```typescript
import { useHaptics, useTheme } from "@/hooks";
```

Remove the static `useHaptics` import and update the gradient colors computation inside the render (around line 138-139):

```typescript
const resolvedGradient = variant === "primary" && isDark
  ? ["#FDE08B", "#CFA533"] as const
  : variantStyle.gradient;
```

Then use `resolvedGradient` in the LinearGradient `colors` prop and in the conditional check.

**Step 2: Commit**

```bash
git add optimus-halal/src/components/ui/Button.tsx
git commit -m "feat(theme): Button primary gradient uses gold in dark mode"
```

---

### Task 8: Update home screen hardcoded colors

**Files:**
- Modify: `optimus-halal/app/(tabs)/index.tsx`

**Step 1: Update scanner card shadow (line 143)**

Replace:
```typescript
<Shadow distance={12} startColor={isDark ? "#13ec6a40" : "#13ec6a25"} ...>
```
With:
```typescript
<Shadow distance={12} startColor={isDark ? "#CFA53340" : "#13ec6a25"} ...>
```

**Step 2: Update scanner card gradient (line 153)**

Replace:
```typescript
colors={["#13ec6a", "#0ea64b"]}
```
With:
```typescript
colors={isDark ? ["#FDE08B", "#CFA533"] : ["#13ec6a", "#0ea64b"]}
```

Note: The home screen should already have `isDark` from `useTheme()`. Verify it's destructured at the top of the component.

**Step 3: Update favorites gradient ring (line 457)**

Replace:
```typescript
colors={["#13ec6a", "#0ea64b", "#D4AF37"]}
```
With:
```typescript
colors={isDark ? ["#D4AF37", "#CFA533", "#FDE08B"] : ["#13ec6a", "#0ea64b", "#D4AF37"]}
```

**Step 4: Commit**

```bash
git add optimus-halal/app/(tabs)/index.tsx
git commit -m "feat(theme): home screen scanner card and favorites ring use gold in dark mode"
```

---

### Task 9: Hardcoded green cleanup — LocationPicker

**Files:**
- Modify: `optimus-halal/src/components/ui/LocationPicker.tsx` (7 occurrences at lines 167, 201, 203, 278, 280, 293, 351)

**Step 1: Add useTheme import and resolve primary**

The component should import `useTheme` and use `colors.primary` instead of `"#13ec6a"`.

Replace all 7 instances of `"#13ec6a"` with `colors.primary` (from `useTheme()`). If the component doesn't already call `useTheme()`, add it.

**Step 2: Commit**

```bash
git add optimus-halal/src/components/ui/LocationPicker.tsx
git commit -m "fix(theme): LocationPicker uses theme token instead of hardcoded green"
```

---

### Task 10: Hardcoded green cleanup — scan-result.tsx

**Files:**
- Modify: `optimus-halal/app/scan-result.tsx` (9 occurrences at lines 647, 790, 841, 1666, 2045, 2047, 2052, 2930, 2936)

**Step 1: Replace all `"#13ec6a"` with `colors.primary`**

The scan-result screen likely already has `useTheme()`. Replace all 9 hardcoded instances with `colors.primary` or the relevant theme token. For the `"#13ec6a20"` alpha variant (line 2045), use `colors.primaryLight`.

**Step 2: Commit**

```bash
git add optimus-halal/app/scan-result.tsx
git commit -m "fix(theme): scan-result uses theme tokens instead of hardcoded green"
```

---

### Task 11: Hardcoded green cleanup — auth screens

**Files:**
- Modify: `optimus-halal/app/(auth)/welcome.tsx` (lines 115, 213, 220, 227)
- Modify: `optimus-halal/app/(auth)/set-new-password.tsx` (lines 82, 657)
- Modify: `optimus-halal/app/(auth)/magic-link.tsx` (lines 310, 409, 422)
- Modify: `optimus-halal/app/(auth)/forgot-password.tsx` (lines 482, 537)
- Modify: `optimus-halal/app/(auth)/reset-confirmation.tsx` (lines 428, 456, 499)
- Modify: `optimus-halal/app/auth/verify.tsx` (line 30)

**Step 1: For each file, replace `"#13ec6a"` with `colors.primary`**

Each auth screen should use `useTheme()` to get `colors.primary`. Add the import/hook if not present.

**Step 2: Commit**

```bash
git add optimus-halal/app/(auth)/ optimus-halal/app/auth/
git commit -m "fix(theme): auth screens use theme tokens instead of hardcoded green"
```

---

### Task 12: Hardcoded green cleanup — settings screens

**Files:**
- Modify: `optimus-halal/app/settings/notifications.tsx` (lines 47, 48, 140)
- Modify: `optimus-halal/app/settings/certifications.tsx` (lines 67, 68)
- Modify: `optimus-halal/app/settings/premium.tsx` (lines 104, 131, 172, 195, 200, 224, 236, 251, 265)
- Modify: `optimus-halal/app/settings/favorites.tsx` (lines 58, 184)
- Modify: `optimus-halal/app/settings/exclusions.tsx` (line 202)

**Step 1: For each file, replace `"#13ec6a"` with `colors.primary`**

Same pattern — use `useTheme()` for dynamic primary. For the settings/premium.tsx file which has 9 occurrences, be thorough.

**Step 2: Commit**

```bash
git add optimus-halal/app/settings/
git commit -m "fix(theme): settings screens use theme tokens instead of hardcoded green"
```

---

### Task 13: Hardcoded green cleanup — profile.tsx

**Files:**
- Modify: `optimus-halal/app/(tabs)/profile.tsx` (line 478)

**Step 1: Replace `"#13ec6a"` with `colors.primary`**

**Step 2: Commit**

```bash
git add optimus-halal/app/(tabs)/profile.tsx
git commit -m "fix(theme): profile uses theme token instead of hardcoded green"
```

---

### Task 14: Visual smoke test

**Step 1: Start the Expo dev server**

```bash
cd optimus-halal && pnpm start
```

**Step 2: Verify on device/simulator**

- Toggle to dark mode in settings
- Check home screen: gold scanner card, gold accent on quick actions, gold favorites ring
- Check tab bar: gold active icon, gold scanner FAB with gold glow
- Check Islamic pattern is subtle grey, not green
- Check scan-result, auth, and settings screens for gold accents
- Toggle to light mode: verify everything still uses green

**Step 3: Final commit if any visual tweaks needed**

```bash
git add -A
git commit -m "fix(theme): visual polish for gold dark theme"
```
