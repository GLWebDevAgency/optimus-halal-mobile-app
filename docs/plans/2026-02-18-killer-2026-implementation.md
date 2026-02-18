# Killer 2026 Visual Refonte — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Optimus Halal into the world's most beautiful halal app — Fintech Premium Ethical aesthetic with authentic Islamic geometric patterns and Arabic calligraphy.

**Architecture:** 8 sequential sprints, each independently shippable. Foundation cleanup first (theme migration, i18n), then Islamic design system components (SVG patterns, calligraphy, GlowCard), then screen refontes (Scan Result flagship, Home, Profile, Auth), then polish. Every sprint ends with `tsc --noEmit` pass + visual verification.

**Tech Stack:** Expo SDK 54, React 19.1, RN 0.81.5, NativeWind/Tailwind, react-native-reanimated v4, react-native-svg, expo-google-fonts (Amiri), tRPC React Query, MMKV v4 Nitro

**Design Spec:** `docs/plans/2026-02-18-killer-2026-visual-refonte.md`

---

## Sprint 1: Foundation Cleanup (Theme Migration + i18n + Critical Bugs)

> **Purpose:** Eliminate all technical debt that blocks the refonte. After this sprint, every file uses `@/theme` and every visible string uses i18n.

---

### Task 1.1: Migrate 6 files from `@/constants/theme` to `@/theme`

**Files:**
- Modify: `optimus-halal/src/components/navigation/PremiumTabBar.tsx:39`
- Modify: `optimus-halal/app/(auth)/set-new-password.tsx:38`
- Modify: `optimus-halal/app/(auth)/forgot-password.tsx:37`
- Modify: `optimus-halal/app/(auth)/reset-confirmation.tsx:39`
- Modify: `optimus-halal/app/(marketplace)/_layout.tsx:10`
- Modify: `optimus-halal/app/(tabs)/marketplace.tsx:30`

**Step 1: Replace imports in all 6 files**

In each file, replace:
```typescript
import { colors } from "@/constants/theme";
```
With:
```typescript
import { brand, lightTheme, darkTheme } from "@/theme/colors";
```

Then update usages:
- `colors.light.primary` → `brand.primary`
- `colors.primary.DEFAULT` → `brand.primary`
- `colors.gold.DEFAULT` → `brand.gold`
- `colors.light.background` → `lightTheme.background` (or use `useTheme().colors.background`)
- `colors.dark.background` → `darkTheme.background`

For files using `useTheme()`, prefer `const { colors } = useTheme()` and access via `colors.primary`, `colors.background`, etc.

**Step 2: Typecheck**

Run: `cd optimus-halal && pnpm typecheck`
Expected: 0 errors

**Step 3: Commit**

```bash
git add -A && git commit -m "refactor: migrate 6 files from @/constants/theme to @/theme"
```

---

### Task 1.2: Replace ~40 hardcoded color hex values

**Files (14 app files with `#1de560` or `#2bee6c`):**
- Modify: `optimus-halal/app/(tabs)/alerts.tsx`
- Modify: `optimus-halal/app/(tabs)/profile.tsx`
- Modify: `optimus-halal/app/(marketplace)/catalog.tsx`
- Modify: `optimus-halal/app/(marketplace)/checkout.tsx`
- Modify: `optimus-halal/app/(marketplace)/product/[id].tsx`
- Modify: `optimus-halal/app/(marketplace)/coming-soon.tsx`
- Modify: `optimus-halal/app/(marketplace)/cart.tsx`
- Modify: `optimus-halal/app/(marketplace)/order-tracking.tsx`
- Modify: `optimus-halal/src/components/ui/EmptyState.tsx`
- Modify: `optimus-halal/app/(onboarding)/index.tsx`
- Modify: `optimus-halal/app/(auth)/login.tsx`
- Modify: `optimus-halal/src/components/ui/Button.tsx`
- Modify: `optimus-halal/src/components/ui/Avatar.tsx`
- Modify: `optimus-halal/src/components/ui/PageIndicator.tsx`

**Step 1: In each file, search and replace**

- `#1de560` → import `brand` from `@/theme/colors` and use `brand.primary`
- `#2bee6c` → use `brand.primary` (same unified color `#13ec6a`)
- For Tailwind classes like `bg-[#1de560]` → `bg-primary-500`
- For inline styles like `color: "#1de560"` → `color: brand.primary`

If the file already has `const { colors } = useTheme()`, use `colors.primary` instead.

**Step 2: Typecheck**

Run: `cd optimus-halal && pnpm typecheck`
Expected: 0 errors

**Step 3: Commit**

```bash
git add -A && git commit -m "refactor: replace 40+ hardcoded hex colors with theme tokens"
```

---

### Task 1.3: Fix 28 hardcoded French strings → i18n keys

**Files (see full list in design spec section 6, table row #1):**
- Modify: `optimus-halal/src/i18n/translations/fr.ts` — add missing keys
- Modify: `optimus-halal/src/i18n/translations/en.ts` — add missing keys
- Modify: `optimus-halal/src/i18n/translations/ar.ts` — add missing keys
- Modify: 15+ app/component files with hardcoded strings

**Step 1: Add missing i18n keys to all 3 translation files**

Add to `common` section:
```typescript
common: {
  // ... existing keys
  back: "Retour",              // already exists, reuse
  error: "Erreur",             // already exists, reuse
  loading: "Chargement...",    // already exists, reuse
  viewCollection: "Voir la Collection",
  viewAll: "Voir tout",
  geolocationError: "Erreur de géolocalisation",
  loadingFavorites: "Chargement des favoris...",
  backToLogin: "Retour à la connexion",
  backToHome: "Retour à l'accueil",
  returns: "Retours",
  confirmPassword: "Confirmer le mot de passe",
  addToPreferences: "Ajouter aux préférences",
  removeFromPreferences: "Retirer des préférences",
}
```

**Step 2: Replace hardcoded strings in each file**

For each file with hardcoded "Retour", "Erreur", etc., import `useTranslation` and replace:
```typescript
// Before
accessibilityLabel="Retour"
// After
const { t } = useTranslation();
accessibilityLabel={t.common.back}
```

Priority files (highest impact):
- `QueryErrorBoundary.tsx:42` — "Erreur de chargement" → `t.common.loading`
- `_layout.tsx:148` — "Chargement..." → `t.common.loading`
- `catalog.tsx:424` — "Voir la Collection" → `t.common.viewCollection`
- `LocationPicker.tsx:112` — "Erreur de géolocalisation" → `t.common.geolocationError`
- All `accessibilityLabel="Retour"` instances → `t.common.back`

**Step 3: Typecheck**

Run: `cd optimus-halal && pnpm typecheck`
Expected: 0 errors (TypeScript will catch any missing keys via `TranslationKeys` type)

**Step 4: Commit**

```bash
git add -A && git commit -m "fix(i18n): migrate 28 hardcoded French strings to i18n keys"
```

---

### Task 1.4: Fix critical bugs (setTimeout leak, setInterval, cancelAnimation)

**Files:**
- Modify: `optimus-halal/app/scan-result.tsx` — setTimeout x30 leak
- Modify: `optimus-halal/src/components/navigation/PremiumTabBar.tsx` — setInterval x5
- Modify: `optimus-halal/app/(tabs)/scanner.tsx` — cancelAnimation missing

**Step 1: Fix TrustScoreRing setTimeout leak in scan-result.tsx**

Find the animated counter code (around lines 171-176) that creates 30 setTimeout calls. Replace with Reanimated `useSharedValue` + `withTiming`:

```typescript
// Before: 30x setTimeout without cleanup
// After:
const animatedScore = useSharedValue(0);

useEffect(() => {
  animatedScore.value = withTiming(targetScore, {
    duration: 800,
    easing: Easing.out(Easing.cubic),
  });
}, [targetScore]);

// In render: use useAnimatedProps or useDerivedValue
const displayScore = useDerivedValue(() => Math.round(animatedScore.value));
```

**Step 2: Fix PremiumTabBar setInterval cleanup**

Replace 5x `setInterval` with Reanimated `useAnimatedReaction` or `withRepeat`:

```typescript
// Before: setInterval(() => { ... }, 1000)
// After: Use useAnimatedStyle with withRepeat + withTiming
const pulseAnim = useSharedValue(1);

useEffect(() => {
  pulseAnim.value = withRepeat(
    withTiming(1.15, { duration: 1200 }),
    -1, // infinite
    true // reverse
  );
  return () => cancelAnimation(pulseAnim);
}, []);
```

**Step 3: Fix Scanner cancelAnimation**

In `scanner.tsx`, add cleanup to the 3 animation useEffects:

```typescript
useEffect(() => {
  scanLineY.value = withRepeat(
    withTiming(1, { duration: 2000 }),
    -1,
    true
  );
  return () => cancelAnimation(scanLineY);
}, []);
```

**Step 4: Typecheck**

Run: `cd optimus-halal && pnpm typecheck`
Expected: 0 errors

**Step 5: Commit**

```bash
git add -A && git commit -m "fix: resolve setTimeout leak, setInterval cleanup, cancelAnimation missing"
```

---

## Sprint 2: Islamic Design System Components

> **Purpose:** Build the 10 new reusable components that define the "Emerald Sanctuary" visual identity. These are used by every screen refonte.

---

### Task 2.1: IslamicPattern component (SVG tessellation)

**Files:**
- Create: `optimus-halal/src/components/ui/IslamicPattern.tsx`

**Step 1: Create the component**

```typescript
/**
 * IslamicPattern — SVG geometric patterns for backgrounds/decorations.
 * Uses tessellation, arabesque, or khatam (8-pointed star) motifs.
 * Renders at very low opacity (0.02-0.06) as ambient texture.
 */
import React from "react";
import { View, type ViewStyle } from "react-native";
import Svg, { Path, Defs, Pattern, Rect } from "react-native-svg";
import { brand } from "@/theme/colors";

type PatternVariant = "tessellation" | "arabesque" | "khatam";

interface IslamicPatternProps {
  variant?: PatternVariant;
  color?: string;
  opacity?: number;
  style?: ViewStyle;
}

// SVG path data for each pattern variant
const PATTERN_PATHS: Record<PatternVariant, { d: string; viewBox: string; size: number }> = {
  tessellation: {
    // Hexagonal tessellation inspired by Islamic geometry
    d: "M25,0 L50,14.4 L50,43.3 L25,57.7 L0,43.3 L0,14.4 Z",
    viewBox: "0 0 50 57.7",
    size: 50,
  },
  arabesque: {
    // Simplified arabesque linear motif
    d: "M0,20 Q10,0 20,20 Q30,40 40,20 Q50,0 60,20",
    viewBox: "0 0 60 40",
    size: 60,
  },
  khatam: {
    // 8-pointed star (Khatam)
    d: "M25,0 L31.9,18.1 L50,25 L31.9,31.9 L25,50 L18.1,31.9 L0,25 L18.1,18.1 Z",
    viewBox: "0 0 50 50",
    size: 50,
  },
};

export const IslamicPattern: React.FC<IslamicPatternProps> = ({
  variant = "tessellation",
  color = brand.primary,
  opacity = 0.03,
  style,
}) => {
  const pattern = PATTERN_PATHS[variant];

  return (
    <View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, style]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={`islamic-${variant}`} x="0" y="0" width={pattern.size} height={pattern.size} patternUnits="userSpaceOnUse">
            <Path d={pattern.d} fill={color} fillOpacity={opacity} stroke={color} strokeOpacity={opacity * 0.5} strokeWidth={0.5} />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#islamic-${variant})`} />
      </Svg>
    </View>
  );
};

export default IslamicPattern;
```

**Step 2: Typecheck**

Run: `cd optimus-halal && pnpm typecheck`
Expected: 0 errors

**Step 3: Commit**

```bash
git add optimus-halal/src/components/ui/IslamicPattern.tsx && git commit -m "feat: add IslamicPattern SVG component (tessellation, arabesque, khatam)"
```

---

### Task 2.2: ArabicCalligraphy component

**Files:**
- Create: `optimus-halal/src/components/ui/ArabicCalligraphy.tsx`

**Step 1: Create the component**

A decorative text component using the Amiri font for Arabic calligraphy. Supports different calligraphic texts (Bismillah, Halal Tayyib, Salam) with FadeIn animation.

```typescript
import React from "react";
import { Text, type TextStyle } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { brand } from "@/theme/colors";
import { durations, easings } from "@/theme/animations";

type CalligraphyText = "bismillah" | "halalTayyib" | "salam" | "ramadan";

const CALLIGRAPHY_MAP: Record<CalligraphyText, string> = {
  bismillah: "بِسْمِ ٱللَّٰهِ",
  halalTayyib: "حَلَالٌ طَيِّبٌ",
  salam: "ٱلسَّلَامُ عَلَيْكُمْ",
  ramadan: "رَمَضَانَ كَرِيمٌ",
};

interface ArabicCalligraphyProps {
  text: CalligraphyText;
  color?: string;
  size?: number;
  opacity?: number;
  animated?: boolean;
  style?: TextStyle;
}

export const ArabicCalligraphy: React.FC<ArabicCalligraphyProps> = ({
  text,
  color = brand.primary,
  size = 28,
  opacity = 1,
  animated = true,
  style,
}) => {
  const content = (
    <Text
      style={[
        {
          fontFamily: "Amiri-Bold",
          fontSize: size,
          color,
          opacity,
          textAlign: "center",
          writingDirection: "rtl",
        },
        style,
      ]}
      accessible={false} // Decorative element
    >
      {CALLIGRAPHY_MAP[text]}
    </Text>
  );

  if (!animated) return content;

  return (
    <Animated.View entering={FadeIn.duration(durations.slow).delay(400).easing(easings.easeOut)}>
      {content}
    </Animated.View>
  );
};

export default ArabicCalligraphy;
```

**Step 2: Install Amiri font**

Run: `cd optimus-halal && npx expo install @expo-google-fonts/amiri`

Then add to `app/_layout.tsx`:
```typescript
import { useFonts, Amiri_700Bold } from "@expo-google-fonts/amiri";
```

**Step 3: Typecheck + Commit**

```bash
cd optimus-halal && pnpm typecheck
git add -A && git commit -m "feat: add ArabicCalligraphy decorative component with Amiri font"
```

---

### Task 2.3: GlowCard component

**Files:**
- Create: `optimus-halal/src/components/ui/GlowCard.tsx`

**Step 1: Create the component**

Card with configurable primary-color glow shadow. Extends the base Card pattern.

```typescript
import React from "react";
import { View, type ViewStyle, type ViewProps } from "react-native";
import { brand } from "@/theme/colors";
import { radius } from "@/theme/spacing";
import { useTheme } from "@/hooks/useTheme";

type GlowIntensity = "subtle" | "medium" | "strong";

interface GlowCardProps extends ViewProps {
  glowColor?: string;
  glowIntensity?: GlowIntensity;
  children: React.ReactNode;
  style?: ViewStyle;
}

const GLOW_CONFIG: Record<GlowIntensity, { opacity: number; radius: number; elevation: number }> = {
  subtle: { opacity: 0.08, radius: 12, elevation: 3 },
  medium: { opacity: 0.15, radius: 20, elevation: 6 },
  strong: { opacity: 0.25, radius: 28, elevation: 10 },
};

export const GlowCard: React.FC<GlowCardProps> = ({
  glowColor = brand.primary,
  glowIntensity = "subtle",
  children,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const glow = GLOW_CONFIG[glowIntensity];

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: glow.opacity,
          shadowRadius: glow.radius,
          elevation: glow.elevation,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export default GlowCard;
```

**Step 2: Typecheck + Commit**

```bash
cd optimus-halal && pnpm typecheck
git add optimus-halal/src/components/ui/GlowCard.tsx && git commit -m "feat: add GlowCard component with configurable glow shadow"
```

---

### Task 2.4: SectionSeparator component

**Files:**
- Create: `optimus-halal/src/components/ui/SectionSeparator.tsx`

**Step 1: Create the component**

Decorative separator with optional arabesque SVG motif between sections.

```typescript
import React from "react";
import { View, Text, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";
import { brand } from "@/theme/colors";

type SeparatorVariant = "line" | "arabesque" | "dots";

interface SectionSeparatorProps {
  label?: string;
  variant?: SeparatorVariant;
  style?: ViewStyle;
}

export const SectionSeparator: React.FC<SectionSeparatorProps> = ({
  label,
  variant = "line",
  style,
}) => {
  const { colors } = useTheme();

  if (variant === "arabesque") {
    return (
      <View style={[{ flexDirection: "row", alignItems: "center", marginVertical: 16, gap: 12 }, style]}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Svg width={24} height={12} viewBox="0 0 24 12">
          <Path
            d="M0,6 Q6,0 12,6 Q18,12 24,6"
            stroke={brand.primary}
            strokeWidth={1.5}
            fill="none"
            opacity={0.4}
          />
        </Svg>
        {label && (
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
            {label}
          </Text>
        )}
        <Svg width={24} height={12} viewBox="0 0 24 12">
          <Path
            d="M0,6 Q6,0 12,6 Q18,12 24,6"
            stroke={brand.primary}
            strokeWidth={1.5}
            fill="none"
            opacity={0.4}
          />
        </Svg>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>
    );
  }

  if (variant === "dots") {
    return (
      <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 16, gap: 6 }, style]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
        ))}
      </View>
    );
  }

  // Default: line with optional label
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", marginVertical: 16, gap: 12 }, style]}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      {label && (
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
          {label}
        </Text>
      )}
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  );
};

export default SectionSeparator;
```

**Step 2: Typecheck + Commit**

```bash
cd optimus-halal && pnpm typecheck
git add optimus-halal/src/components/ui/SectionSeparator.tsx && git commit -m "feat: add SectionSeparator with arabesque variant"
```

---

### Task 2.5: StatusPill component

**Files:**
- Create: `optimus-halal/src/components/ui/StatusPill.tsx`

**Step 1: Create the component**

Animated pill showing halal/haram/doubtful/unknown status with icon + label.

```typescript
import React from "react";
import { View, Text } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import { halalStatus as statusColors } from "@/theme/colors";
import { durations, easings } from "@/theme/animations";

type HalalStatus = "halal" | "haram" | "doubtful" | "unknown";
type PillSize = "sm" | "md" | "lg";

interface StatusPillProps {
  status: HalalStatus;
  size?: PillSize;
  animated?: boolean;
}

const STATUS_CONFIG: Record<HalalStatus, { icon: keyof typeof MaterialIcons.glyphMap; label: string; bg: string; color: string }> = {
  halal: { icon: "verified", label: "Halal", bg: statusColors.halal.bg, color: statusColors.halal.base },
  haram: { icon: "dangerous", label: "Haram", bg: statusColors.haram.bg, color: statusColors.haram.base },
  doubtful: { icon: "help-outline", label: "Douteux", bg: statusColors.doubtful.bg, color: statusColors.doubtful.base },
  unknown: { icon: "help", label: "Inconnu", bg: statusColors.unknown.bg, color: statusColors.unknown.base },
};

const SIZE_CONFIG: Record<PillSize, { h: number; iconSize: number; fontSize: number; px: number }> = {
  sm: { h: 24, iconSize: 14, fontSize: 11, px: 8 },
  md: { h: 32, iconSize: 18, fontSize: 13, px: 12 },
  lg: { h: 40, iconSize: 22, fontSize: 15, px: 16 },
};

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  size = "md",
  animated = true,
}) => {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];

  const pill = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: config.bg,
        borderRadius: sizeConfig.h / 2,
        height: sizeConfig.h,
        paddingHorizontal: sizeConfig.px,
        gap: 4,
      }}
      accessibilityRole="text"
      accessibilityLabel={`Statut: ${config.label}`}
    >
      <MaterialIcons name={config.icon} size={sizeConfig.iconSize} color={config.color} />
      <Text style={{ color: config.color, fontSize: sizeConfig.fontSize, fontWeight: "700" }}>
        {config.label}
      </Text>
    </View>
  );

  if (!animated) return pill;

  return (
    <Animated.View entering={ZoomIn.duration(durations.normal).easing(easings.overshoot)}>
      {pill}
    </Animated.View>
  );
};

export default StatusPill;
```

**Step 2: Typecheck + Commit**

```bash
cd optimus-halal && pnpm typecheck
git add optimus-halal/src/components/ui/StatusPill.tsx && git commit -m "feat: add StatusPill animated component for halal status"
```

---

### Task 2.6: TrustRing component (octagonal)

**Files:**
- Create: `optimus-halal/src/components/ui/TrustRing.tsx`

**Step 1: Create the component**

Animated octagonal (Khatam-inspired) SVG ring showing confidence score 0-100. Uses Reanimated `useSharedValue` + `withTiming` for smooth counter animation.

```typescript
import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useDerivedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { brand } from "@/theme/colors";
import { useTheme } from "@/hooks/useTheme";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface TrustRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
}

/**
 * Generate an octagonal (8-sided) SVG path centered at (cx, cy) with radius r.
 */
function octagonPath(cx: number, cy: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(" ") + " Z";
}

export const TrustRing: React.FC<TrustRingProps> = ({
  score,
  size = 140,
  strokeWidth = 6,
  color = brand.primary,
}) => {
  const { colors } = useTheme();
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;

  // Calculate octagon perimeter
  const sideLength = 2 * r * Math.sin(Math.PI / 8);
  const perimeter = 8 * sideLength;

  const progress = useSharedValue(0);
  const displayScore = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
    displayScore.value = withTiming(score, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: perimeter * (1 - progress.value),
  }));

  const roundedScore = useDerivedValue(() => Math.round(displayScore.value));

  const pathD = octagonPath(cx, cy, r);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        {/* Background ring */}
        <Path
          d={pathD}
          fill="none"
          stroke={colors.border}
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        {/* Animated progress ring */}
        <AnimatedPath
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={perimeter}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      {/* Center score text */}
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Animated.Text
          style={{
            fontSize: size * 0.22,
            fontWeight: "800",
            color: colors.textPrimary,
          }}
        >
          {/* Note: For display, we use a derived JS value via runOnJS callback or
              a simple Text component that re-renders. The animated counter
              is handled by the withTiming on displayScore. */}
        </Animated.Text>
        <Text style={{ fontSize: size * 0.22, fontWeight: "800", color: colors.textPrimary }}>
          {score}%
        </Text>
        <Text style={{ fontSize: size * 0.09, color: colors.textSecondary, marginTop: 2 }}>
          confiance
        </Text>
      </View>
    </View>
  );
};

export default TrustRing;
```

**Step 2: Typecheck + Commit**

```bash
cd optimus-halal && pnpm typecheck
git add optimus-halal/src/components/ui/TrustRing.tsx && git commit -m "feat: add TrustRing octagonal animated SVG component"
```

---

### Task 2.7: ShimmerSkeleton, BadgeCollection, Button glow variant

**Files:**
- Modify: `optimus-halal/src/components/ui/Skeleton.tsx` — add shimmer gradient
- Create: `optimus-halal/src/components/ui/BadgeCollection.tsx`
- Modify: `optimus-halal/src/components/ui/Button.tsx` — add `glow` variant

**Step 1: Enhance Skeleton with shimmer gradient**

Read current Skeleton.tsx, then add a `shimmer?: boolean` prop. When true, overlay a moving gradient using Reanimated `withRepeat` + `withTiming` translating a LinearGradient from left to right.

```typescript
// Add to existing Skeleton component:
// shimmer prop: adds branded gradient animation
// Uses expo-linear-gradient + Animated translateX
```

**Step 2: Create BadgeCollection**

Horizontal FlatList of earned/locked badge items with scale animation on earned badges:

```typescript
import React from "react";
import { View, Text, FlatList, type ViewStyle } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { brand, gold } from "@/theme/colors";

interface Badge {
  id: string;
  name: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  unlocked: boolean;
}

interface BadgeCollectionProps {
  badges: Badge[];
  onBadgePress?: (badge: Badge) => void;
  style?: ViewStyle;
}

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({ badges, onBadgePress, style }) => {
  const { colors } = useTheme();

  return (
    <FlatList
      horizontal
      data={badges}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
      style={style}
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeIn.delay(index * 60)}>
          <View
            style={{
              alignItems: "center",
              opacity: item.unlocked ? 1 : 0.4,
              width: 64,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: item.unlocked ? `${brand.primary}15` : `${colors.border}40`,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: item.unlocked ? 2 : 1,
                borderColor: item.unlocked ? gold[500] : colors.border,
              }}
            >
              <MaterialIcons
                name={item.unlocked ? item.icon : "lock"}
                size={22}
                color={item.unlocked ? gold[500] : colors.textMuted}
              />
            </View>
            <Text
              style={{
                fontSize: 10,
                color: colors.textSecondary,
                marginTop: 4,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>
        </Animated.View>
      )}
    />
  );
};

export default BadgeCollection;
```

**Step 3: Add glow variant to Button.tsx**

Read current Button.tsx, add a `glow` variant that applies primary-color shadow:

```typescript
// In the variant styles:
glow: {
  backgroundColor: brand.primary,
  shadowColor: brand.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.35,
  shadowRadius: 16,
  elevation: 8,
}
```

**Step 4: Typecheck + Commit**

```bash
cd optimus-halal && pnpm typecheck
git add -A && git commit -m "feat: add ShimmerSkeleton, BadgeCollection, Button glow variant"
```

---

### Task 2.8: Barrel export all new components

**Files:**
- Create or modify: `optimus-halal/src/components/ui/index.ts`

**Step 1: Create barrel export**

```typescript
export { IslamicPattern } from "./IslamicPattern";
export { ArabicCalligraphy } from "./ArabicCalligraphy";
export { GlowCard } from "./GlowCard";
export { SectionSeparator } from "./SectionSeparator";
export { StatusPill } from "./StatusPill";
export { TrustRing } from "./TrustRing";
export { BadgeCollection } from "./BadgeCollection";
// ... existing components
```

**Step 2: Typecheck + Commit**

```bash
cd optimus-halal && pnpm typecheck
git add -A && git commit -m "feat: barrel export all new design system components"
```

---

## Sprint 3: Scan Result Refonte (FLAGSHIP)

> **Purpose:** Redesign the most important screen — "Le Verdict Sacre". Octagonal hero, Arabic calligraphy, alternatives section, review vote.

---

### Task 3.1: Refonte Scan Result hero section

**Files:**
- Modify: `optimus-halal/app/scan-result.tsx`

**Step 1: Replace the top 50% hero section**

Replace the existing hero with:
1. Dynamic gradient background per halal status
2. `TrustRing` component (octagonal) instead of circular SVG
3. `ArabicCalligraphy` component ("حَلَالٌ طَيِّبٌ" for halal verdict)
4. `StatusPill` component for compact verdict
5. `IslamicPattern` overlay (khatam variant, very subtle)

Key changes:
- Import new components: `TrustRing`, `ArabicCalligraphy`, `IslamicPattern`, `StatusPill`
- Replace the 30x setTimeout counter with `TrustRing` (handles animation internally)
- Add calligraphy under the verdict (only for `halal` status)
- Add Islamic pattern background layer

**Step 2: Add Alternatives Halal section**

After existing collapsible sections, add a new "Alternatives Halal" section:
- Uses `trpc.product.getAlternatives.useQuery({ productId, limit: 3 })`
- Horizontal scroll of alternative product cards
- Each card shows: image, name, halal status pill, certifier badge

**Step 3: Add User Review vote section**

After alternatives, add "Votre Avis Compte":
- Three buttons: thumbs up, thumbs down, report flag
- Uses `trpc.review.submitReview.useMutation()`
- Animated feedback on vote (scale bounce + haptic)

**Step 4: Typecheck + visual test**

Run: `cd optimus-halal && pnpm typecheck`
Visual: Open scan result in Expo Go, scan a product, verify:
- Hero = 50% viewport with octagonal trust ring
- Arabic calligraphy appears below verdict for halal products
- Islamic pattern barely visible in background
- Alternatives section shows if API returns data
- Vote buttons work with haptic feedback

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: refonte scan result — octagonal hero, calligraphy, alternatives, review vote"
```

---

### Task 3.2: Fix scan result action bar + collapsible sections

**Files:**
- Modify: `optimus-halal/app/scan-result.tsx`

**Step 1: Enhance floating action bar**

- Ensure BlurView glassmorphism renders correctly in both light/dark
- Add haptic feedback (`expo-haptics`) on each button tap
- "Ou Acheter" CTA with glow effect (use `brand.primary` shadow)
- Boycott source URL: make it tappable with `Linking.openURL(sourceUrl)`

**Step 2: Fix ingredient matching**

- Support multi-word ingredient names: normalize both scan data and known ingredient lists to lowercase + trim before matching
- Handle "MSG" ↔ "monosodium glutamate" mapping (add a simple alias map)

**Step 3: Add arabesque section separators**

Between each collapsible section, insert `<SectionSeparator variant="arabesque" />`

**Step 4: Typecheck + Commit**

```bash
cd optimus-halal && pnpm typecheck
git add -A && git commit -m "feat: polish scan result — action bar, ingredient matching, arabesque separators"
```

---

## Sprint 4: Home Screen Refonte

> **Purpose:** Redesign the dashboard. Add Islamic patterns, nearby stores section, arabesque separators, loyalty integration.

---

### Task 4.1: Home hero + Islamic pattern background

**Files:**
- Modify: `optimus-halal/app/(tabs)/index.tsx`

**Step 1: Add Islamic pattern background**

At the very top of the ScrollView, add:
```tsx
<IslamicPattern variant="tessellation" opacity={0.03} />
```

**Step 2: Integrate loyalty stats**

Use `trpc.loyalty.getBalance.useQuery()` to show points/tier in the stats pill alongside existing `userDashboard` data.

**Step 3: Add arabesque separators between sections**

Replace plain section headers with:
```tsx
<SectionSeparator variant="arabesque" label={t.home.quickActions.title} />
```

**Step 4: Typecheck + Commit**

```bash
cd optimus-halal && pnpm typecheck
git add -A && git commit -m "feat: home refonte — Islamic pattern bg, loyalty stats, arabesque separators"
```

---

### Task 4.2: Home "Pres de Moi" section (new)

**Files:**
- Modify: `optimus-halal/app/(tabs)/index.tsx`

**Step 1: Add "Pres de Moi" section**

After favorites section, add a new section:
- Uses `trpc.store.nearby.useQuery({ latitude, longitude, limit: 3 })`
- Requires `expo-location` permission (already in deps)
- Shows 3 closest halal stores as horizontal cards
- Each card: store name, distance (km), rating stars, category icon
- Tap → navigate to map with store selected

**Step 2: Add i18n keys**

Add to translations:
```typescript
home: {
  // ... existing
  nearYou: "Près de Vous",
  nearYouSeeAll: "Voir la carte",
}
```

**Step 3: Typecheck + Commit**

```bash
cd optimus-halal && pnpm typecheck
git add -A && git commit -m "feat: home — add 'Près de Moi' section with store.nearby API"
```

---

## Sprint 5: Profile + Auth Refonte

> **Purpose:** Modernize profile with badge collection, Islamic motifs. Polish auth screens with geometric backgrounds.

---

### Task 5.1: Profile badge collection + gamification card

**Files:**
- Modify: `optimus-halal/app/(tabs)/profile.tsx`

**Step 1: Add badge collection**

After stats trio, add:
```tsx
<SectionSeparator variant="arabesque" label={t.profile.badges} />
<BadgeCollection badges={achievements} />
```

Uses `trpc.loyalty.getAchievements.useQuery()` — map achievements to `Badge[]` format.

**Step 2: Enhance gamification card**

Add Islamic pattern inside the XP card:
```tsx
<GlowCard glowIntensity="medium">
  <IslamicPattern variant="khatam" opacity={0.04} />
  {/* Level, XP bar, next level hint */}
</GlowCard>
```

**Step 3: Dynamic version**

Replace hardcoded version with:
```tsx
import Constants from "expo-constants";
const version = Constants.expoConfig?.version ?? "1.0.0";
```

**Step 4: Typecheck + Commit**

```bash
cd optimus-halal && pnpm typecheck
git add -A && git commit -m "feat: profile refonte — badge collection, gamification card, dynamic version"
```

---

### Task 5.2: Auth screens Islamic background

**Files:**
- Modify: `optimus-halal/app/(auth)/welcome.tsx`
- Modify: `optimus-halal/app/(auth)/login.tsx`
- Modify: `optimus-halal/app/(auth)/signup.tsx`

**Step 1: Add geometric background to all auth screens**

Wrap each screen's content in a container with:
```tsx
<View style={{ flex: 1 }}>
  <IslamicPattern variant="tessellation" color={brand.primary} opacity={0.04} />
  {/* existing content */}
</View>
```

**Step 2: Welcome screen — add benefits with icons**

Update benefits list with proper icons and i18n.

**Step 3: Login/Signup — inline errors**

Replace `Alert.alert()` calls with inline error display under form fields:
```tsx
{error && (
  <Text style={{ color: semantic.danger.base, fontSize: 12, marginTop: 4 }}>
    {error}
  </Text>
)}
```

**Step 4: Typecheck + Commit**

```bash
cd optimus-halal && pnpm typecheck
git add -A && git commit -m "feat: auth refonte — Islamic pattern backgrounds, inline errors"
```

---

## Sprint 6: Alerts + PremiumTabBar + Map Polish

> **Purpose:** Add pagination to alerts, fix PremiumTabBar labels, enhance map with bottom sheet.

---

### Task 6.1: Alerts cursor pagination + temporal grouping

**Files:**
- Modify: `optimus-halal/app/(tabs)/alerts.tsx`

**Step 1: Implement infinite scroll with cursor**

Replace `limit: 20` with cursor-based pagination using `useInfiniteQuery`:
```typescript
const { data, fetchNextPage, hasNextPage } = trpc.alert.list.useInfiniteQuery(
  { limit: 20, severity: filter },
  { getNextPageParam: (lastPage) => lastPage.nextCursor }
);
```

FlashList `onEndReached={() => hasNextPage && fetchNextPage()}`.

**Step 2: Group alerts by day**

Add SectionList-style grouping: "Aujourd'hui", "Hier", "Cette semaine", "Plus ancien".

**Step 3: Make source URL clickable**

```tsx
<TouchableOpacity onPress={() => Linking.openURL(alert.sourceUrl)}>
  <Text style={{ color: colors.primary }}>{alert.sourceName}</Text>
</TouchableOpacity>
```

**Step 4: Typecheck + Commit**

```bash
cd optimus-halal && pnpm typecheck
git add -A && git commit -m "feat: alerts — cursor pagination, temporal grouping, clickable sources"
```

---

### Task 6.2: PremiumTabBar i18n + Reanimated refactor

**Files:**
- Modify: `optimus-halal/src/components/navigation/PremiumTabBar.tsx`

**Step 1: Replace hardcoded labels with i18n**

```typescript
const { t } = useTranslation();
// "Accueil" → t.nav.home
// "Carte" → t.nav.map
// etc.
```

**Step 2: Replace setInterval with Reanimated**

Remove all 5 `setInterval` calls. Replace with `withRepeat` + `withTiming` on shared values. Add proper cleanup via `cancelAnimation()` in useEffect return.

**Step 3: Center button glow pulse**

Add pulsing glow animation to center scanner button:
```typescript
const glowOpacity = useSharedValue(0.2);
useEffect(() => {
  glowOpacity.value = withRepeat(
    withTiming(0.5, { duration: 1500 }),
    -1,
    true
  );
  return () => cancelAnimation(glowOpacity);
}, []);
```

**Step 4: Typecheck + Commit**

```bash
cd optimus-halal && pnpm typecheck
git add -A && git commit -m "feat: PremiumTabBar — i18n labels, Reanimated animations, center glow"
```

---

### Task 6.3: Marketplace premium Coming Soon

**Files:**
- Modify: `optimus-halal/app/(tabs)/marketplace.tsx`

**Step 1: Redesign Coming Soon card**

Replace current basic card with:
- `GlowCard` with gold accent
- `IslamicPattern` background (khatam variant)
- Social proof counter ("1,247 inscrits")
- Nearby stores horizontal scroll (from `store.nearby`)
- Top scanned products list

**Step 2: Typecheck + Commit**

```bash
cd optimus-halal && pnpm typecheck
git add -A && git commit -m "feat: marketplace — premium Coming Soon with Islamic pattern + nearby stores"
```

---

## Sprint 7: Onboarding + Report BottomSheet

> **Purpose:** Create immersive onboarding with Islamic visuals. Convert Report to BottomSheet.

---

### Task 7.1: Onboarding 4-slide redesign

**Files:**
- Modify: `optimus-halal/app/(onboarding)/index.tsx`
- Modify: `optimus-halal/src/components/onboarding/OnboardingSlide.tsx`

**Step 1: Redesign 4 slides**

Each slide gets:
- Islamic pattern background (different pattern per slide)
- Slide 1: Large scan illustration + "Scannez en Confiance"
- Slide 2: Madhab mini-selector (4 choices) + "Selon Votre Ecole"
- Slide 3: Allergen toggles + "Votre Profil Sante"
- Slide 4: Community counter + calligraphie + "Rejoignez la Communaute"

**Step 2: Typecheck + Commit**

```bash
cd optimus-halal && pnpm typecheck
git add -A && git commit -m "feat: onboarding — 4 slides with Islamic patterns and mini-wizards"
```

---

### Task 7.2: Report → BottomSheet conversion

**Files:**
- Create: `optimus-halal/src/components/ui/BottomSheet.tsx`
- Modify: `optimus-halal/app/report.tsx`

**Step 1: Create BottomSheet component**

Uses `react-native-gesture-handler` PanGestureHandler + Reanimated for swipe-to-dismiss. Snap points at [300, 500, screenHeight * 0.9].

**Step 2: Convert Report screen to use BottomSheet**

Keep all existing form logic but wrap in BottomSheet instead of full-page modal.

**Step 3: Typecheck + Commit**

```bash
cd optimus-halal && pnpm typecheck
git add -A && git commit -m "feat: add BottomSheet component, convert Report to bottom sheet UX"
```

---

## Sprint 8: Final Polish + Typecheck + Visual QA

> **Purpose:** Final pass — ensure zero hardcoded colors, all animations smooth, typecheck clean.

---

### Task 8.1: Full codebase sweep

**Step 1: Verify zero hardcoded colors**

Run: `cd optimus-halal && grep -rn "#1de560\|#2bee6c" --include="*.tsx" --include="*.ts" src/ app/`
Expected: 0 results

**Step 2: Verify zero old theme imports**

Run: `cd optimus-halal && grep -rn "@/constants/theme" --include="*.tsx" --include="*.ts" src/ app/`
Expected: 0 results

**Step 3: Verify zero hardcoded French strings (outside i18n files)**

Run: `cd optimus-halal && grep -rn '"Retour"\|"Erreur"\|"Chargement"' --include="*.tsx" src/ app/ | grep -v i18n | grep -v node_modules`
Expected: 0 results (all migrated to `t.common.*`)

**Step 4: Full typecheck**

Run: `cd optimus-halal && pnpm typecheck`
Expected: 0 errors

**Step 5: Commit**

```bash
git add -A && git commit -m "chore: final cleanup — zero hardcoded colors, zero old imports, zero FR strings"
```

---

### Task 8.2: Create sprint summary commit

**Step 1: Tag the release**

```bash
git tag -a v2.0.0-emerald-sanctuary -m "Killer 2026 Visual Refonte: Islamic patterns, calligraphy, octagonal verdict, 10 new components"
```

---

## Dependency Graph

```
Sprint 1 (Foundation) ──→ Sprint 2 (Components) ──→ Sprint 3 (Scan Result)
                                                  ──→ Sprint 4 (Home)
                                                  ──→ Sprint 5 (Profile + Auth)
                                                  ──→ Sprint 6 (Alerts + TabBar + Map)
                                                  ──→ Sprint 7 (Onboarding + Report)
                         All sprints ──────────────→ Sprint 8 (Polish)
```

Sprint 1 must be first. Sprint 2 must come before 3-7 (components are used by screens). Sprints 3-7 can be parallelized across agents. Sprint 8 is always last.

---

## Estimated Scope

| Sprint | Tasks | New Files | Modified Files | Est. Lines |
|--------|-------|-----------|----------------|------------|
| 1 — Foundation | 4 | 0 | ~25 | ~300 |
| 2 — Components | 8 | 7 | 2 | ~800 |
| 3 — Scan Result | 2 | 0 | 1 | ~400 |
| 4 — Home | 2 | 0 | 1 | ~200 |
| 5 — Profile + Auth | 2 | 0 | 4 | ~300 |
| 6 — Alerts + TabBar | 3 | 0 | 3 | ~350 |
| 7 — Onboarding + Report | 2 | 1 | 2 | ~400 |
| 8 — Polish | 2 | 0 | 0 | ~50 |
| **TOTAL** | **25** | **8** | **~38** | **~2,800** |

---

*Plan generated 18 Feb 2026 — Claude Opus 4.6 + writing-plans skill*
