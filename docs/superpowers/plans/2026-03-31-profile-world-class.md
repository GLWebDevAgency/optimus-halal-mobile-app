# Profile Screen — Apple World-Class Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refondre le profile screen en 2 etats (Free/Naqiy+), ajouter le padlock UX sur les sous-ecrans, le garde-fou expiration abonnement, le locking madhab, et le feature flag certifications preferees full-stack.

**Architecture:** 2 etats stricts (Free guest / Naqiy+ connecte). Les menus premium sont visibles mais verrouilles pour les free users via un composant PadlockBottomSheet reutilisable. Les donnees trial sont isolees en MMKV avec un guard qui les masque post-expiration. Le backend bloque le login/refresh pour les abonnes expires.

**Tech Stack:** React Native (Expo SDK 54), tRPC v11, Drizzle ORM, PostgreSQL, MMKV (Zustand persist), RevenueCat, Phosphor icons.

**Spec:** `docs/superpowers/specs/2026-03-31-profile-world-class-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `backend/drizzle/0032_user_certification_preferences.sql` | Migration: add certificationPreferences column |
| Modify | `backend/src/db/schema/users.ts:43` | Drizzle schema: add column |
| Modify | `backend/src/db/seeds/seed-feature-flags.ts:165` | Seed: add certificationsPreferencesEnabled flag |
| Modify | `backend/src/trpc/routers/auth.ts:146,288` | Login + refresh subscription guard |
| Modify | `backend/src/trpc/routers/profile.ts:50` | Accept certificationPreferences in updateProfile |
| Modify | `optimus-halal/src/constants/config.ts:84,107` | Add certificationsPreferencesEnabled to FeatureFlags |
| Create | `optimus-halal/src/components/ui/PadlockBottomSheet.tsx` | Reusable padlock upsell bottom sheet |
| Create | `optimus-halal/src/hooks/useTrialGuard.ts` | Hook: guard trial data access |
| Modify | `optimus-halal/app/(tabs)/profile.tsx` | Complete rewrite: 2 states |
| Modify | `optimus-halal/app/settings/madhab.tsx` | Padlock on 4 schools, General free |
| Modify | `optimus-halal/app/settings/health-profile.tsx` | Padlock UX for free users |
| Modify | `optimus-halal/app/settings/exclusions.tsx` | Padlock UX for free users |
| Modify | `optimus-halal/app/settings/boycott-list.tsx` | Padlock UX for free users |
| Modify | `optimus-halal/app/settings/premium.tsx` | Trial data merge on purchase |
| Modify | `optimus-halal/app/_layout.tsx:266` | Force-logout on expired subscription |
| Modify | `optimus-halal/src/store/index.ts:319` | Guard setMadhab for free users |
| Modify | `optimus-halal/src/i18n/translations/fr.ts` | Padlock + premium expired keys |
| Modify | `optimus-halal/src/i18n/translations/en.ts` | Padlock + premium expired keys |
| Modify | `optimus-halal/src/i18n/translations/ar.ts` | Padlock + premium expired keys |

---

## Task 1: Backend — Migration certificationPreferences

**Files:**
- Create: `backend/drizzle/0032_user_certification_preferences.sql`

- [ ] **Step 1: Create migration file**

```sql
-- 0032: Add certification_preferences to users table
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "certification_preferences" text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS "users_cert_prefs_idx"
  ON "users" USING GIN ("certification_preferences");
```

- [ ] **Step 2: Verify migration applies**

Run: `cd backend && pnpm drizzle-kit push --dry-run 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add backend/drizzle/0032_user_certification_preferences.sql
git commit -m "feat(db): add certification_preferences column to users"
```

---

## Task 2: Backend — Drizzle schema + safeUserColumns

**Files:**
- Modify: `backend/src/db/schema/users.ts:43-44` (add column after madhab)
- Modify: `backend/src/db/schema/users.ts` (safeUserColumns — add certificationPreferences)

- [ ] **Step 1: Add column to Drizzle schema**

In `backend/src/db/schema/users.ts`, after line 43 (`madhab: madhabEnum()...`), add:

```typescript
    certificationPreferences: t.text("certification_preferences").array().default(sql`'{}'::text[]`),
```

- [ ] **Step 2: Add to safeUserColumns**

In the same file, find `safeUserColumns` object and add `certificationPreferences: true` alongside the other preference fields (near `allergens: true`, `madhab: true`).

- [ ] **Step 3: Typecheck**

Run: `cd backend && pnpm tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add backend/src/db/schema/users.ts
git commit -m "feat(schema): add certificationPreferences column to users"
```

---

## Task 3: Backend — Seed feature flag

**Files:**
- Modify: `backend/src/db/seeds/seed-feature-flags.ts:165` (after healthProfileEnabled)

- [ ] **Step 1: Add flag to FLAGS array**

After the `healthProfileEnabled` object (line 165), add:

```typescript
  {
    key: "certificationsPreferencesEnabled",
    label: "Certifications preferees",
    description: "Permet aux utilisateurs de selectionner leurs certifieurs de confiance pour personnaliser les resultats de scan",
    flagType: "boolean",
    enabled: false,
    defaultValue: false,
    rolloutPercentage: 100,
    variants: null,
  },
```

- [ ] **Step 2: Typecheck**

Run: `cd backend && pnpm tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add backend/src/db/seeds/seed-feature-flags.ts
git commit -m "feat(seed): add certificationsPreferencesEnabled feature flag"
```

---

## Task 4: Backend — Auth subscription guard (login + refresh)

**Files:**
- Modify: `backend/src/trpc/routers/auth.ts:146-155` (login — add subscriptionTier to select)
- Modify: `backend/src/trpc/routers/auth.ts:164` (login — add check after password verify)
- Modify: `backend/src/trpc/routers/auth.ts:287-291` (refresh — add subscriptionTier to select)
- Modify: `backend/src/trpc/routers/auth.ts:296` (refresh — add check after isActive)

- [ ] **Step 1: Login — add subscriptionTier to user fetch columns**

In the login procedure's user fetch (line 146–154), add `subscriptionTier: true` to the columns object:

```typescript
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email.toLowerCase().trim()),
        columns: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          level: true,
          passwordHash: true,
          isActive: true,
          subscriptionTier: true,
        },
      });
```

- [ ] **Step 2: Login — add subscription check after password verification**

After the password verification block (after the existing `if (!isValid)` check around line 164), add:

```typescript
      // Block login for expired subscribers — connected = always premium
      if (user.subscriptionTier === "free") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "SUBSCRIPTION_EXPIRED",
        });
      }
```

**Important:** This check runs AFTER password verification to avoid leaking subscription status to brute-force attackers. The error code `FORBIDDEN` (not `UNAUTHORIZED`) distinguishes from invalid credentials.

- [ ] **Step 3: Refresh — add subscriptionTier to user check**

In the refresh procedure's user check (line 287–291), modify the select to include subscriptionTier:

```typescript
      const [user] = await ctx.db
        .select({
          isActive: users.isActive,
          subscriptionTier: users.subscriptionTier,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
```

- [ ] **Step 4: Refresh — add subscription check after isActive check**

After the existing `if (!user?.isActive)` block (around line 296), add:

```typescript
      // Block token refresh for expired subscribers
      if (user.subscriptionTier === "free") {
        // Revoke all refresh tokens — force re-login after re-subscription
        await ctx.db
          .delete(refreshTokens)
          .where(eq(refreshTokens.userId, userId));
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "SUBSCRIPTION_EXPIRED",
        });
      }
```

- [ ] **Step 5: Typecheck**

Run: `cd backend && pnpm tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add backend/src/trpc/routers/auth.ts
git commit -m "feat(auth): block login/refresh for expired subscribers"
```

---

## Task 5: Backend — Profile router (certificationPreferences)

**Files:**
- Modify: `backend/src/trpc/routers/profile.ts:50-51` (add certificationPreferences to input)

- [ ] **Step 1: Add certificationPreferences to updateProfile input schema**

After the `madhab` field (line 50), add:

```typescript
        certificationPreferences: z.array(z.string()).max(20).optional(),
```

- [ ] **Step 2: Typecheck**

Run: `cd backend && pnpm tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add backend/src/trpc/routers/profile.ts
git commit -m "feat(profile): accept certificationPreferences in updateProfile"
```

---

## Task 6: Frontend — Feature flag config

**Files:**
- Modify: `optimus-halal/src/constants/config.ts:84,107` (add to interface + defaults)

- [ ] **Step 1: Add to FeatureFlags interface**

After `healthProfileEnabled: boolean;` (line 84), add:

```typescript
  certificationsPreferencesEnabled: boolean;
```

- [ ] **Step 2: Add to defaultFeatureFlags object**

After `healthProfileEnabled: true,` (line 107), add:

```typescript
  certificationsPreferencesEnabled: false,
```

- [ ] **Step 3: Typecheck**

Run: `cd optimus-halal && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add optimus-halal/src/constants/config.ts
git commit -m "feat(flags): add certificationsPreferencesEnabled flag"
```

---

## Task 7: Translations (fr/en/ar)

**Files:**
- Modify: `optimus-halal/src/i18n/translations/fr.ts`
- Modify: `optimus-halal/src/i18n/translations/en.ts`
- Modify: `optimus-halal/src/i18n/translations/ar.ts`

- [ ] **Step 1: Add padlock keys to fr.ts**

Find the `paywall` section and add a new `padlock` section nearby:

```typescript
  padlock: {
    featureTitle: "Fonctionnalite Naqiy+",
    madhabDescription: "Choisissez votre ecole juridique pour des verdicts halal personnalises selon votre madhab.",
    healthDescription: "Configurez vos allergenes et votre profil de sante pour des analyses personnalisees.",
    exclusionsDescription: "Definissez vos exclusions alimentaires personnalisees pour des alertes sur mesure.",
    boycottDescription: "Gerez votre liste de boycott ethique pour filtrer les produits concernes.",
    certificationsDescription: "Selectionnez vos certifieurs de confiance pour mettre en avant les produits certifies.",
    unlock: "Decouvrir Naqiy+",
    close: "Fermer",
  },
```

And add premium expired keys to the `premium` section:

```typescript
    expired: "Votre abonnement Naqiy+ a expire",
    renewToAccess: "Reabonnez-vous pour acceder a votre compte et retrouver vos donnees.",
    renew: "Renouveler Naqiy+",
```

- [ ] **Step 2: Add padlock keys to en.ts**

```typescript
  padlock: {
    featureTitle: "Naqiy+ Feature",
    madhabDescription: "Choose your school of jurisprudence for personalized halal verdicts based on your madhab.",
    healthDescription: "Configure your allergens and health profile for personalized analysis.",
    exclusionsDescription: "Define your custom dietary exclusions for tailored alerts.",
    boycottDescription: "Manage your ethical boycott list to filter related products.",
    certificationsDescription: "Select your trusted certifiers to highlight certified products.",
    unlock: "Discover Naqiy+",
    close: "Close",
  },
```

```typescript
    expired: "Your Naqiy+ subscription has expired",
    renewToAccess: "Resubscribe to access your account and recover your data.",
    renew: "Renew Naqiy+",
```

- [ ] **Step 3: Add padlock keys to ar.ts**

```typescript
  padlock: {
    featureTitle: "ميزة نقيّ+",
    madhabDescription: "اختر مذهبك الفقهي للحصول على أحكام حلال مخصصة وفقًا لمذهبك.",
    healthDescription: "قم بتكوين مسببات الحساسية وملفك الصحي للحصول على تحليلات مخصصة.",
    exclusionsDescription: "حدد استثناءاتك الغذائية المخصصة للحصول على تنبيهات مخصصة.",
    boycottDescription: "إدارة قائمة المقاطعة الأخلاقية لتصفية المنتجات المعنية.",
    certificationsDescription: "اختر جهات التصديق الموثوقة لتسليط الضوء على المنتجات المعتمدة.",
    unlock: "اكتشف نقيّ+",
    close: "إغلاق",
  },
```

```typescript
    expired: "انتهى اشتراكك في نقيّ+",
    renewToAccess: "أعد الاشتراك للوصول إلى حسابك واستعادة بياناتك.",
    renew: "تجديد نقيّ+",
```

- [ ] **Step 4: Typecheck**

Run: `cd optimus-halal && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add optimus-halal/src/i18n/translations/fr.ts optimus-halal/src/i18n/translations/en.ts optimus-halal/src/i18n/translations/ar.ts
git commit -m "feat(i18n): add padlock + premium expired translations (fr/en/ar)"
```

---

## Task 8: PadlockBottomSheet component

**Files:**
- Create: `optimus-halal/src/components/ui/PadlockBottomSheet.tsx`
- Modify: `optimus-halal/src/components/ui/index.ts` (export)

- [ ] **Step 1: Create PadlockBottomSheet**

```typescript
/**
 * PadlockBottomSheet — Contextual upsell when a free user taps a locked premium feature.
 *
 * Shows feature-specific description + "Decouvrir Naqiy+" CTA.
 * Uses Modal to render above tab bar.
 */

import React, { useCallback } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { Image } from "expo-image";
import { LockSimple as LockSimpleIcon } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "./PressableScale";
import { useTheme, useTranslation, useHaptics } from "@/hooks";
import { usePremium } from "@/hooks/usePremium";
import { gold } from "@/theme/colors";
import { fontSize, fontWeight, headingFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface PadlockBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  description: string;
}

export const PadlockBottomSheet = React.memo(function PadlockBottomSheet({
  visible,
  onClose,
  description,
}: PadlockBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { impact } = useHaptics();
  const { showPaywall } = usePremium();

  const handleUnlock = useCallback(() => {
    impact();
    onClose();
    showPaywall("feature_locked");
  }, [impact, onClose, showPaywall]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.backdropFill}
          />
        </Pressable>

        {/* Sheet */}
        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(170)}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              paddingBottom: insets.bottom + spacing.xl,
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleRow}>
            <View
              style={[
                styles.handle,
                { backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)" },
              ]}
            />
          </View>

          {/* Icon */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark
                  ? "rgba(212,175,55,0.1)"
                  : "rgba(212,175,55,0.06)",
              },
            ]}
          >
            <LockSimpleIcon size={28} color={isDark ? gold[400] : gold[600]} weight="fill" />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t.padlock.featureTitle}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>

          {/* CTA */}
          <PressableScale
            onPress={handleUnlock}
            style={[
              styles.cta,
              { backgroundColor: isDark ? gold[500] : "#0f172a" },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.padlock.unlock}
          >
            <Image
              source={require("@assets/images/logo_naqiy.webp")}
              style={styles.ctaLogo}
              contentFit="contain"
            />
            <Text
              style={[
                styles.ctaText,
                { color: isDark ? "#0f172a" : "#ffffff" },
              ]}
            >
              {t.padlock.unlock}
            </Text>
          </PressableScale>

          {/* Close link */}
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeLink}>
            <Text style={[styles.closeLinkText, { color: colors.textMuted }]}>
              {t.padlock.close}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropFill: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  handleRow: {
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.h4,
    fontFamily: headingFontFamily.extraBold,
    fontWeight: fontWeight.extraBold,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.body,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing["2xl"],
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    paddingHorizontal: spacing["4xl"],
    borderRadius: radius.full,
    gap: spacing.sm,
    width: "100%",
    maxWidth: 300,
  },
  ctaLogo: {
    width: 20,
    height: 20,
  },
  ctaText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  closeLink: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  closeLinkText: {
    fontSize: fontSize.bodySmall,
  },
});
```

- [ ] **Step 2: Export from ui/index.ts**

Add to `optimus-halal/src/components/ui/index.ts`:

```typescript
export { PadlockBottomSheet } from "./PadlockBottomSheet";
export type { PadlockBottomSheetProps } from "./PadlockBottomSheet";
```

- [ ] **Step 3: Typecheck**

Run: `cd optimus-halal && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add optimus-halal/src/components/ui/PadlockBottomSheet.tsx optimus-halal/src/components/ui/index.ts
git commit -m "feat(ui): add PadlockBottomSheet component for premium feature upsell"
```

---

## Task 9: Trial guard hook

**Files:**
- Create: `optimus-halal/src/hooks/useTrialGuard.ts`
- Modify: `optimus-halal/src/hooks/index.ts` (export)

- [ ] **Step 1: Create useTrialGuard hook**

```typescript
/**
 * useTrialGuard — Guards premium data stored in MMKV during trial.
 *
 * Trial data is accessible only when:
 * - Trial is active (< 7 days)
 * - User is Naqiy+ premium
 *
 * Post-trial free users get the fallback value — data stays in MMKV
 * for future merge if they subscribe.
 */

import { useMemo } from "react";
import { usePremium } from "./usePremium";

/**
 * Returns true if premium/trial data should be accessible.
 * Use this to guard any consumer of premium-only local data.
 */
export function useCanAccessPremiumData(): boolean {
  const { isPremium, isTrialActive } = usePremium();
  return isPremium || isTrialActive;
}

/**
 * Returns the effective madhab — "general" for free post-trial users,
 * the actual value for trial/premium users.
 */
export function useEffectiveMadhab(storedMadhab: string): string {
  const canAccess = useCanAccessPremiumData();
  return useMemo(() => {
    if (!canAccess && storedMadhab !== "general") return "general";
    return storedMadhab;
  }, [canAccess, storedMadhab]);
}
```

- [ ] **Step 2: Export from hooks/index.ts**

Add to `optimus-halal/src/hooks/index.ts`:

```typescript
export { useCanAccessPremiumData, useEffectiveMadhab } from "./useTrialGuard";
```

- [ ] **Step 3: Typecheck**

Run: `cd optimus-halal && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add optimus-halal/src/hooks/useTrialGuard.ts optimus-halal/src/hooks/index.ts
git commit -m "feat(hooks): add useTrialGuard for premium data access control"
```

---

## Task 10: Store — guard setMadhab

**Files:**
- Modify: `optimus-halal/src/store/index.ts:318-319`

- [ ] **Step 1: Update setMadhab to only accept non-general if premium/trial**

The store itself cannot call hooks. Instead, the guard is applied at the **consumer level** (madhab screen, scan components). The store remains a simple setter. The `useEffectiveMadhab` hook from Task 9 handles the guard.

**No change needed in the store.** The guard is in the hook + UI layer. Mark this as done.

- [ ] **Step 2: Commit** (skip — no changes)

---

## Task 11: Profile screen rewrite — Free state

**Files:**
- Modify: `optimus-halal/app/(tabs)/profile.tsx:280-651` (replace Free/Guest branch)

- [ ] **Step 1: Rewrite the Free/Guest branch**

Replace lines 280-651 (the `if (isGuest || !isPremium)` block) with the new design:

- Hero: Logo Naqiy in gold circle + "Mode Decouverte" or "Essai gratuit - Xj restants"
- Quota card inline (free post-trial only, hidden during trial)
- CTA gold "Decouvrir Naqiy+" -> paywall
- Link "Deja un compte ? Se connecter" (guests only)
- Section Preferences: madhab, exclusions, sante, boycott, classement certifieurs (certifications pref behind flag)
- Section General: apparence, langue, aide, signaler, replay onboarding, CGU, confidentialite
- Version text
- **No gamification, no referral, no big Naqiy+ card, no stats cards**
- **No notifications menu item** (free users have no push — no account)

Key changes vs current:
- Remove StatsCards (scan history / favorites) from Free view
- Remove Naqiy+ CTA card (move CTA into hero)
- Remove login/logout buttons as separate elements (login is text link in hero)
- Merge Account + Legal into a single "General" section
- Add MenuItem for madhab, exclusions, sante, boycott to Preferences section (these exist in Naqiy+ view already)

The exact JSX is large — the implementing engineer should follow the wireframe from the spec (Section 2.1) and reuse the existing `MenuItem` component. The structure:

```
<View flex-1>
  <PremiumBackground />
  <Animated.View header (FadeIn)>
    <View spacer />
    <Text "Profil" />
    <Pressable gear -> handleSettings />
  </Animated.View>

  <ScrollView>
    {/* Hero */}
    <Animated.View (FadeInDown) items-center>
      {isTrialActive ? (
        <> trial hero: star icon green + "Essai gratuit" + badge "Xj restants" </>
      ) : (
        <> discovery hero: logo naqiy gold circle + "Mode Decouverte" </>
      )}

      {/* Quota inline — free post-trial only */}
      {!isTrialActive && (
        <quota bar: dailyScansUsed / DAILY_SCAN_LIMIT />
      )}

      {/* CTA */}
      <PressableScale gold button -> paywall />

      {/* Login link */}
      <Pressable text "Deja un compte ? Se connecter" -> /(auth)/login />
    </Animated.View>

    {/* Preferences */}
    <section header "Preferences">
      <Card>
        {flags.certificationsPreferencesEnabled && <MenuItem certifications />}
        <MenuItem madhab />
        <MenuItem exclusions />
        <MenuItem sante />
        <MenuItem boycott />
        <MenuItem classement certifieurs isLast />
      </Card>
    </section>

    {/* General */}
    <section header "General">
      <Card>
        <MenuItem apparence />
        <MenuItem langue />
        <MenuItem aide />
        <MenuItem signaler />
        <MenuItem replay onboarding />
        <MenuItem CGU />
        <MenuItem confidentialite isLast />
      </Card>
    </section>

    <Text version />
  </ScrollView>
</View>
```

- [ ] **Step 2: Typecheck**

Run: `cd optimus-halal && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/app/\(tabs\)/profile.tsx
git commit -m "feat(profile): rewrite Free/Guest state — hero + padlock menus"
```

---

## Task 12: Profile screen rewrite — Naqiy+ state

**Files:**
- Modify: `optimus-halal/app/(tabs)/profile.tsx:682-1206` (replace Naqiy+ branch)

- [ ] **Step 1: Rewrite the authenticated branch**

Replace the Naqiy+ section (after the loading/error guards) with:

- Hero: Avatar gold ring + name + pencil edit overlay
- Section Preferences: Naqiy+ Actif (MenuItem dore, 1er), historique scans, favoris, madhab, exclusions, sante, boycott, notifications, classement certifieurs (certifications pref behind flag)
- Section General: apparence, langue, aide, signaler, replay onboarding, CGU, confidentialite, supprimer compte (rouge), se deconnecter (rouge, isLast)
- Version text
- **Remove**: gamification card, stats cards, Naqiy+ big card, referral card
- **Logout and delete account become MenuItems** (not separate buttons)

Key MenuItem for Naqiy+:

```typescript
{/* Naqiy+ — gold MenuItem, first in Preferences */}
<MenuItem
  icon="workspace-premium"
  iconBgColor={isDark ? "rgba(212,175,55,0.12)" : "rgba(212,175,55,0.06)"}
  iconColor="#D4AF37"
  title="Naqiy+"
  subtitle={t.premium.active ?? "ACTIF"}
  onPress={() => router.push("/settings/premium" as any)}
/>
```

Logout as MenuItem:

```typescript
<MenuItem
  icon="logout"
  iconBgColor={isDark ? "rgba(239,68,68,0.1)" : "#fee2e2"}
  iconColor={isDark ? "#f87171" : "#ef4444"}
  title={t.profile.logout}
  isLast
  onPress={handleLogout}
/>
```

Delete account as MenuItem:

```typescript
<MenuItem
  icon="delete"
  iconBgColor={isDark ? "rgba(239,68,68,0.1)" : "#fee2e2"}
  iconColor={isDark ? "#f87171" : "#ef4444"}
  title={t.editProfile.deleteAccount}
  onPress={handleDeleteAccount}
/>
```

- [ ] **Step 2: Remove unused imports**

Remove imports no longer used: `StarFourIcon`, `FireIcon`, `ScanIcon`, `GiftIcon`, `GlobeHemisphereWestIcon`, `SignInIcon`, `SignOutIcon`. Remove `StatsCard` component if no longer referenced. Remove gamification-related `useMemo` blocks (`gamification`, `progress`, `xpForLevel`, `xpProgress`).

- [ ] **Step 3: Typecheck**

Run: `cd optimus-halal && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add optimus-halal/app/\(tabs\)/profile.tsx
git commit -m "feat(profile): rewrite Naqiy+ state — clean Apple-level design"
```

---

## Task 13: Madhab screen — padlock on 4 schools

**Files:**
- Modify: `optimus-halal/app/settings/madhab.tsx`

- [ ] **Step 1: Replace PremiumGate with inline padlock UX**

The current screen wraps everything in `<PremiumGate feature="madhabSelection">`. Replace this with:

1. Remove the `PremiumGate` wrapper entirely
2. Import `usePremium` and `PadlockBottomSheet` + `LockSimple` from phosphor
3. Add state: `const [showPadlock, setShowPadlock] = useState(false)`
4. Get premium status: `const { isPremium, isTrialActive } = usePremium()`
5. Compute: `const canSelectSchools = isPremium || isTrialActive`

For each of the 4 schools (not General), modify the option rendering:

```typescript
const isLocked = !canSelectSchools && option.value !== "general";

<PressableScale
  onPress={() => {
    if (isLocked) {
      setShowPadlock(true);
      return;
    }
    // existing selection logic
  }}
  disabled={false} // always tappable
>
  <View style={[styles.optionCard, isLocked && { opacity: 0.5 }]}>
    {/* existing content */}
    {isLocked && (
      <LockSimpleIcon size={16} color={colors.textMuted} weight="fill" />
    )}
    {!isLocked && isSelected && (
      <CheckIcon ... /> // existing check icon
    )}
  </View>
</PressableScale>
```

At the bottom of the return, add:

```typescript
<PadlockBottomSheet
  visible={showPadlock}
  onClose={() => setShowPadlock(false)}
  description={t.padlock.madhabDescription}
/>
```

- [ ] **Step 2: Keep General always selectable**

The "General" option must always be tappable and saveable regardless of premium status. The existing save mutation (`updateProfile.mutateAsync({ madhab: value })`) should work as-is since "general" is a valid value.

For trial users selecting a non-general school: save locally in `usePreferencesStore.setMadhab()` AND via tRPC if authenticated. The current screen already uses tRPC — trial users aren't authenticated, so the tRPC call would fail. **Add a guard**: only call `updateProfile` if `hasStoredTokens()`.

- [ ] **Step 3: Typecheck**

Run: `cd optimus-halal && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add optimus-halal/app/settings/madhab.tsx
git commit -m "feat(madhab): padlock 4 schools for free users, General always accessible"
```

---

## Task 14: Health profile screen — padlock UX

**Files:**
- Modify: `optimus-halal/app/settings/health-profile.tsx`

- [ ] **Step 1: Replace PremiumGate with padlock UX**

Current: entire content wrapped in `<PremiumGate feature="healthProfile">`.

New behavior:
- Free post-trial: all interactive elements (switches, buttons) show padlock
- Trial: fully functional, data saved locally
- Naqiy+: fully functional, data saved to DB

1. Remove `PremiumGate` wrapper
2. Import `useCanAccessPremiumData` from `@/hooks`
3. Import `PadlockBottomSheet` from `@/components/ui`
4. Add state: `const [showPadlock, setShowPadlock] = useState(false)`
5. Get: `const canAccess = useCanAccessPremiumData()`

For switches (isPregnant, hasChildren):

```typescript
<Switch
  value={canAccess ? profile?.isPregnant : false}
  onValueChange={(val) => {
    if (!canAccess) {
      setShowPadlock(true);
      return;
    }
    // existing toggle logic
  }}
  disabled={!canAccess}
  style={!canAccess ? { opacity: 0.5 } : undefined}
/>
```

For the allergens navigation link, wrap onPress:

```typescript
onPress={() => {
  if (!canAccess) {
    setShowPadlock(true);
    return;
  }
  router.push("/settings/exclusions" as any);
}}
```

Add at bottom:

```typescript
<PadlockBottomSheet
  visible={showPadlock}
  onClose={() => setShowPadlock(false)}
  description={t.padlock.healthDescription}
/>
```

- [ ] **Step 2: Typecheck**

Run: `cd optimus-halal && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/app/settings/health-profile.tsx
git commit -m "feat(health-profile): padlock UX for free users"
```

---

## Task 15: Exclusions screen — padlock UX

**Files:**
- Modify: `optimus-halal/app/settings/exclusions.tsx`

- [ ] **Step 1: Replace PremiumGate with padlock UX**

Same pattern as Task 14. The exclusions screen (882 lines) has a PremiumGate at line 502.

1. Remove `PremiumGate` wrapper
2. Import `useCanAccessPremiumData` and `PadlockBottomSheet`
3. Add padlock state
4. Guard all interactive elements:
   - Search input: `editable={canAccess}`, tap on input when locked -> show padlock
   - Allergen grid items: if `!canAccess`, show padlock on tap instead of toggle
   - Exclusion items: if `!canAccess`, show lock icon + padlock on tap
   - Save button: if `!canAccess`, show padlock instead of save
   - "Add another" button: padlock on tap

Add at bottom of component:

```typescript
<PadlockBottomSheet
  visible={showPadlock}
  onClose={() => setShowPadlock(false)}
  description={t.padlock.exclusionsDescription}
/>
```

- [ ] **Step 2: Typecheck**

Run: `cd optimus-halal && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/app/settings/exclusions.tsx
git commit -m "feat(exclusions): padlock UX for free users"
```

---

## Task 16: Boycott list screen — padlock UX

**Files:**
- Modify: `optimus-halal/app/settings/boycott-list.tsx`

- [ ] **Step 1: Add padlock UX**

The boycott screen currently has NO PremiumGate. Add padlock behavior:

1. Import `useCanAccessPremiumData` and `PadlockBottomSheet`
2. Add padlock state
3. Get: `const canAccess = useCanAccessPremiumData()`

The boycott list is **read-only** (no mutations). The padlock should:
- Show the list of companies/brands (visible) but grayed out if `!canAccess`
- Tap on any BoycottCard when locked -> show padlock
- Filter pills: disabled when locked (grayed, padlock on tap)

Wrap the FlashList `renderItem` callback:

```typescript
renderItem={({ item }) => (
  <Pressable
    onPress={!canAccess ? () => setShowPadlock(true) : undefined}
    style={!canAccess ? { opacity: 0.5 } : undefined}
  >
    <BoycottCard item={item} />
  </Pressable>
)}
```

Add at bottom:

```typescript
<PadlockBottomSheet
  visible={showPadlock}
  onClose={() => setShowPadlock(false)}
  description={t.padlock.boycottDescription}
/>
```

- [ ] **Step 2: Typecheck**

Run: `cd optimus-halal && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/app/settings/boycott-list.tsx
git commit -m "feat(boycott): padlock UX for free users"
```

---

## Task 17: Force-logout on expired subscription

**Files:**
- Modify: `optimus-halal/app/_layout.tsx:260-274` (auth context)
- Modify: `optimus-halal/src/hooks/useAuth.ts` (add error handling for SUBSCRIPTION_EXPIRED)

- [ ] **Step 1: Add force-logout effect in AppInitializer**

In `_layout.tsx`, after the `authValue` memo (line 274), add a `useEffect` that checks for the expired subscription scenario:

```typescript
// Force-logout: if tokens exist but RevenueCat says not premium
// ONLY after RC is initialized (prevent false positive on cold boot)
const { isPremium, isLoading: premiumLoading } = usePremium();

useEffect(() => {
  if (premiumLoading) return; // Wait for RC init
  const hasTokens = tokensReady && hasStoredTokens();
  if (hasTokens && !isPremium && !meQuery.isLoading && meQuery.data) {
    // User has tokens + profile data but is no longer premium
    // This means their subscription expired since last session
    logger.warn("Auth", "Subscription expired — force logout");
    clearTokens();
    useLocalAuthStore.getState().logout();
    queryClient.clear();
    resetUser();
    clearSentryUser();
    logoutPurchases().catch(() => {});
  }
}, [tokensReady, isPremium, premiumLoading, meQuery.data, meQuery.isLoading]);
```

**Note:** This effect runs AFTER both RC init and meQuery resolve, preventing false positives during cold boot.

- [ ] **Step 2: Handle SUBSCRIPTION_EXPIRED in login flow**

In the login screen (or in `useLogin` hook), catch the `FORBIDDEN` / `SUBSCRIPTION_EXPIRED` error and show the paywall instead of a generic error:

In `optimus-halal/src/hooks/useAuth.ts`, in the `useLogin` mutation's `onError`:

The current `useLogin` doesn't have explicit error handling — it returns the mutation and the screen handles errors. The login screen should check:

```typescript
// In the login screen's error handling:
if (error.message === "SUBSCRIPTION_EXPIRED") {
  // Show specific UI: "Votre abonnement a expire" + paywall button
  Alert.alert(
    t.premium.expired,
    t.premium.renewToAccess,
    [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.premium.renew,
        onPress: () => router.push({ pathname: "/paywall" as any, params: { trigger: "expired" } }),
      },
    ]
  );
  return;
}
```

- [ ] **Step 3: Typecheck**

Run: `cd optimus-halal && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add optimus-halal/app/_layout.tsx optimus-halal/src/hooks/useAuth.ts
git commit -m "feat(auth): force-logout on expired subscription + SUBSCRIPTION_EXPIRED error handling"
```

---

## Task 18: Premium paywall — trial data merge

**Files:**
- Modify: `optimus-halal/app/settings/premium.tsx:184-210` (handlePurchase)

- [ ] **Step 1: Add trial data merge after successful purchase**

In `handlePurchase`, after `await purchasePackage(plan.rcPackage)` and before the navigation:

```typescript
// Merge trial data from MMKV to backend after account creation
// This happens after the user registers (post-purchase redirect to signup)
// The actual merge is done in useRegister's onSuccess callback
// Here we just ensure the trial data is preserved for the merge
```

Actually, the merge must happen **after account creation** (register), not during purchase. The flow is:
1. Guest buys Naqiy+ -> `handlePurchase`
2. Redirect to signup (`/(auth)/signup`)
3. User creates account -> `useRegister`
4. In `useRegister.onSuccess`: read trial MMKV data -> `profile.updateProfile` with merged data

In `optimus-halal/src/hooks/useAuth.ts`, modify `useRegister`'s `onSuccess` to merge trial data:

```typescript
// In useRegister's onSuccess, after identifyUser and syncLocalDataToCloud:
// Merge trial preferences to backend
const trialMadhab = usePreferencesStore.getState().selectedMadhab;
const trialDietary = useLocalDietaryPreferencesStore.getState();
const trialNutrition = useLocalNutritionProfileStore.getState();

const mergeData: Record<string, unknown> = {};
if (trialMadhab !== "general") mergeData.madhab = trialMadhab;
if (trialDietary.allergens.length > 0) mergeData.allergens = trialDietary.allergens;
if (trialDietary.preferences) {
  const restrictions = Object.entries(trialDietary.preferences)
    .filter(([_, v]) => v)
    .map(([k]) => k);
  if (restrictions.length > 0) mergeData.dietaryRestrictions = restrictions;
}

if (Object.keys(mergeData).length > 0) {
  try {
    // Fire-and-forget merge — non-blocking
    trpcClient.profile.updateProfile.mutate(mergeData);
  } catch (e) {
    logger.warn("Auth", "Trial data merge failed", String(e));
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `cd optimus-halal && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/hooks/useAuth.ts optimus-halal/app/settings/premium.tsx
git commit -m "feat(auth): merge trial MMKV data to backend on registration"
```

---

## Task 19: Verification

**Files:** All modified files

- [ ] **Step 1: Full typecheck backend**

Run: `cd backend && pnpm tsc --noEmit`

Expected: 0 errors

- [ ] **Step 2: Full typecheck mobile**

Run: `cd optimus-halal && npx tsc --noEmit`

Expected: 0 errors

- [ ] **Step 3: Lint backend**

Run: `cd backend && pnpm lint`

Expected: 0 errors (warnings OK)

- [ ] **Step 4: Lint mobile**

Run: `cd optimus-halal && npx expo lint`

Expected: 0 errors (warnings OK)

- [ ] **Step 5: Backend tests**

Run: `cd backend && pnpm test`

Expected: All existing tests pass (new code doesn't break anything)

- [ ] **Step 6: Manual verification checklist**

- [ ] Profile Free (no trial): hero shows "Mode Decouverte" + quota + CTA gold
- [ ] Profile Free (trial): hero shows "Essai gratuit" + no quota + CTA gold
- [ ] Profile Naqiy+: avatar gold ring + name + Preferences with Naqiy+ Actif first
- [ ] Madhab screen: General selectable, 4 schools locked with padlock icon
- [ ] Tap locked school -> PadlockBottomSheet appears
- [ ] Health profile: switches disabled + padlock for free users
- [ ] Exclusions: all elements locked for free users
- [ ] Boycott: list grayed + padlock for free users
- [ ] Certifications preferees: hidden (flag OFF)
- [ ] Login with expired subscription: Alert "Votre abonnement a expire" + renew button
- [ ] App launch with expired tokens: force-logout to discovery mode

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup after profile world-class redesign"
```

---

## Dependency Graph

```
Tasks 1-5 (backend) → can run in parallel, no interdependencies
Task 6 (frontend flag) → no dependency
Task 7 (translations) → no dependency
Task 8 (PadlockBottomSheet) → no dependency
Task 9 (trial guard hook) → no dependency

Task 10 (store guard) → depends on Task 9
Tasks 11-12 (profile rewrite) → depends on Tasks 6, 7, 8
Tasks 13-16 (sub-screen padlocks) → depends on Tasks 8, 9
Task 17 (force-logout) → depends on Tasks 4 (backend guard)
Task 18 (trial merge) → depends on Task 9
Task 19 (verification) → depends on ALL
```

**Parallelizable:** Tasks 1-9 can all be done in parallel. Tasks 11-18 depend on earlier tasks.
