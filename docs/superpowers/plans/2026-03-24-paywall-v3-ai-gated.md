# ~~Paywall V3 — Scan-Free, AI-Gated Model~~ (SUPERSEDED)

> **SUPERSEDED on 2026-03-25:** AI extraction is infrastructure (Gemini cleans OFF data for every new product), not a premium feature. The AI-gated model was abandoned in favor of a feature-gated model. See actual implementation below.

## Actual Model (2026-03-25)

**Free tier:** Scans always free (DB + AI extraction if needed), full scan results, 20/day anti-abuse cap (invisible), 7-day history.

**Naqiy+ (after 7-day trial):** Profile creation & sync, unlimited favorites & history, offline mode, health profile, allergen profile, 4 madhab selection, store favorites, search.

**Trial:** 7 days full Naqiy+ on first install → loss aversion → conversion.

**Removed:** `AiAnalysisGate`, `useAiQuotaStore`, `DAILY_AI_ANALYSIS_LIMIT`, `ai_analysis_quota` trigger. Added: `profile_creation` trigger.

---

## Original Plan (archived)

> ~~**For agentic workers:** ...~~

~~**Goal:** Switch from scan-limited (5/day) to AI-analysis-limited (3/day) paywall model, with a 20/day anti-abuse scan cap.~~

~~**Architecture:** The scan itself (DB lookup → verdict) stays always-free. A new `useAiQuotaStore` tracks daily AI analysis views. The detailed AI sections in scan-result are gated behind an `AiAnalysisGate` component after 3 free views/day. The existing scan quota store changes from 5→20 as an invisible anti-abuse cap.~~

**Tech Stack:** React Native, Expo Router, Zustand (persist/MMKV), tRPC, TypeScript

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| **Modify** | `optimus-halal/src/store/index.ts` | Change `DAILY_SCAN_LIMIT` 5→20, add `useAiQuotaStore` |
| **Modify** | `optimus-halal/src/types/paywall.ts` | Add `"ai_analysis_quota"` trigger |
| **Create** | `optimus-halal/src/components/ui/AiAnalysisGate.tsx` | Gate component for AI detail sections |
| **Modify** | `optimus-halal/app/scan-result.tsx` | Wrap AI sections with `AiAnalysisGate`, update hardcoded `5` refs |
| **Modify** | `optimus-halal/app/paywall.tsx` | Update copy, features list, add AI quota context |
| **Modify** | `optimus-halal/app/(tabs)/scanner.tsx` | Update quota gate message for 20 limit |
| **Modify** | `optimus-halal/src/hooks/usePremium.ts` | No structural changes needed (already flexible) |
| **Modify** | `optimus-halal/src/i18n/translations/fr.ts` | Update all paywall/quota copy |
| **Modify** | `optimus-halal/src/i18n/translations/en.ts` | Mirror FR changes |
| **Modify** | `optimus-halal/src/i18n/translations/ar.ts` | Mirror FR changes |

---

## Task 1: Update PaywallTrigger Type

**Files:**
- Modify: `optimus-halal/src/types/paywall.ts`

- [ ] **Step 1: Add `ai_analysis_quota` trigger**

Open `optimus-halal/src/types/paywall.ts` and add the new trigger type. The full file should become:

```typescript
/**
 * PaywallTrigger — identifies what action triggered the paywall.
 * Used for contextual feature reordering (Yuka-inspired pattern).
 */
export type PaywallTrigger =
  | "scan_quota"        // 20 scans/day anti-abuse limit reached (rare)
  | "ai_analysis_quota" // 3 AI analyses/day reached (primary conversion trigger)
  | "favorites"         // Tried to add > 3 favorites
  | "history"           // Tried to access full scan history
  | "offline"           // Tried to use offline mode
  | "health_profile"    // Tried to access health/nutrition profile
  | "store_favorites"   // Tried to add > 3 store favorites
  | "search"            // Tried to search products by name
  | "generic";          // Default (no specific trigger)
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to PaywallTrigger (existing usages are all string literals that still exist)

- [ ] **Step 3: Commit**

```bash
git add optimus-halal/src/types/paywall.ts
git commit -m "feat(paywall): add ai_analysis_quota trigger type"
```

---

## Task 2: Update Scan Quota Store (5→20) + Add AI Quota Store

**Files:**
- Modify: `optimus-halal/src/store/index.ts:370-429`

- [ ] **Step 1: Change DAILY_SCAN_LIMIT from 5 to 20**

In `optimus-halal/src/store/index.ts`, find line ~376:

```typescript
const DAILY_SCAN_LIMIT = 5;
```

Replace with:

```typescript
export const DAILY_SCAN_LIMIT = 20;
```

- [ ] **Step 2: Add DAILY_AI_ANALYSIS_LIMIT constant and useAiQuotaStore**

Immediately after the `useQuotaStore` closing (after line ~429, after the `);` that closes `useQuotaStore`), add the new store:

```typescript
/**
 * AI Analysis Quota State (All users — free tier gate)
 *
 * Tracks daily AI detailed analysis views.
 * Free tier: 3 detailed analyses per day.
 * Naqiy+: unlimited.
 *
 * "AI analysis" = viewing the detailed ingredient/health breakdown
 * powered by Gemini. The basic verdict (halal/haram/douteux) is always free.
 */
export const DAILY_AI_ANALYSIS_LIMIT = 3;

interface AiQuotaState {
  dailyAiUsed: number;
  lastAiDate: string;
  incrementAiAnalysis: () => void;
  getRemainingAiAnalyses: () => number;
  resetIfNewDay: () => void;
}

export const useAiQuotaStore = create<AiQuotaState>()(
  persist(
    (set, get) => ({
      dailyAiUsed: 0,
      lastAiDate: getToday(),

      incrementAiAnalysis: () => {
        const state = get();
        const today = getToday();
        if (state.lastAiDate !== today) {
          set({ dailyAiUsed: 1, lastAiDate: today });
        } else {
          set({ dailyAiUsed: state.dailyAiUsed + 1 });
        }
      },

      getRemainingAiAnalyses: () => {
        const state = get();
        if (state.lastAiDate !== getToday()) return DAILY_AI_ANALYSIS_LIMIT;
        return Math.max(0, DAILY_AI_ANALYSIS_LIMIT - state.dailyAiUsed);
      },

      resetIfNewDay: () => {
        const state = get();
        if (state.lastAiDate !== getToday()) {
          set({ dailyAiUsed: 0, lastAiDate: getToday() });
        }
      },
    }),
    {
      name: "ai-quota-storage",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
```

- [ ] **Step 3: Verify TypeScript compiles**

(Both constants are now declared with `export const` directly — no separate export needed.)

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: Clean compile

- [ ] **Step 5: Commit**

```bash
git add optimus-halal/src/store/index.ts
git commit -m "feat(paywall): change scan limit 5→20, add AI analysis quota store (3/day)"
```

---

## Task 3: Create AiAnalysisGate Component

**Files:**
- Create: `optimus-halal/src/components/ui/AiAnalysisGate.tsx`
- Modify: `optimus-halal/src/components/ui/index.ts` (add export)

- [ ] **Step 1: Create the AiAnalysisGate component**

Create `optimus-halal/src/components/ui/AiAnalysisGate.tsx`:

```tsx
import React, { useRef, useEffect } from "react";
import { View, Text } from "react-native";
import { SparkleIcon, LockIcon } from "phosphor-react-native";
import { useAiQuotaStore, useFeatureFlagsStore } from "@/store";
import { usePremium } from "@/hooks/usePremium";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks";
import { PressableScale } from "./PressableScale";
import type { PaywallTrigger } from "@/types/paywall";

interface AiAnalysisGateProps {
  children: React.ReactNode;
}

/**
 * Gates AI-powered detailed analysis sections.
 *
 * - Payments disabled: always renders children (dev mode)
 * - Premium/Trial users: always renders children
 * - Free users with remaining quota: renders children + auto-decrements
 * - Free users with exhausted quota: renders upgrade prompt
 *
 * The basic scan verdict (halal/haram/douteux + NaqiyScore) is NEVER gated.
 * Only the detailed AI analysis (ingredient breakdown, health impact, scholarly refs) is gated.
 */
export function AiAnalysisGate({ children }: AiAnalysisGateProps) {
  const { flags } = useFeatureFlagsStore();
  const { isPremium, showPaywall, isTrialActive } = usePremium();
  const remaining = useAiQuotaStore((s) => s.getRemainingAiAnalyses());
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { impact } = useHaptics();
  const consumed = useRef(false);

  // Gates inactive when payments disabled (mirrors PremiumGate pattern)
  if (!flags.paymentsEnabled) {
    return <>{children}</>;
  }

  // Premium or trial — always show
  if (isPremium || isTrialActive) {
    return <>{children}</>;
  }

  // Snapshot quota BEFORE render — consume once per mount
  const shouldShow = remaining > 0 || consumed.current;

  // Auto-consume on first render when quota available
  useEffect(() => {
    if (!consumed.current && remaining > 0) {
      consumed.current = true;
      useAiQuotaStore.getState().incrementAiAnalysis();
    }
  }, [remaining]);

  if (shouldShow) {
    return <>{children}</>;
  }

  // Free user, quota exhausted — show gate
  return (
    <View
      style={{
        padding: 24,
        alignItems: "center",
        backgroundColor: isDark ? "rgba(212, 175, 55, 0.06)" : "rgba(212, 175, 55, 0.04)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark ? "rgba(212, 175, 55, 0.15)" : "rgba(212, 175, 55, 0.1)",
        margin: 16,
        marginTop: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <SparkleIcon size={20} color={colors.primary} weight="fill" />
        <LockIcon size={16} color={colors.textSecondary} />
      </View>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 15,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {t.aiQuota.gateTitle}
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 13,
          textAlign: "center",
          marginTop: 6,
          lineHeight: 18,
        }}
      >
        {t.aiQuota.gateSubtitle}
      </Text>
      <PressableScale
        onPress={() => {
          impact();
          showPaywall("ai_analysis_quota" as PaywallTrigger);
        }}
        style={{
          marginTop: 16,
          backgroundColor: colors.primary,
          paddingHorizontal: 24,
          paddingVertical: 10,
          borderRadius: 12,
        }}
        accessibilityRole="button"
        accessibilityLabel={t.aiQuota.upgradeCta}
      >
        <Text style={{ color: isDark ? "#0f172a" : "#fff", fontWeight: "700", fontSize: 14 }}>
          {t.aiQuota.upgradeCta}
        </Text>
      </PressableScale>
      <Text
        style={{
          color: colors.textMuted,
          fontSize: 11,
          textAlign: "center",
          marginTop: 10,
        }}
      >
        {t.aiQuota.resetInfo}
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Add export to ui/index.ts**

In `optimus-halal/src/components/ui/index.ts`, add after the PremiumGate export:

```typescript
export { AiAnalysisGate } from "./AiAnalysisGate";
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: Will fail on missing `t.aiQuota.*` keys — that's expected, we add them in Task 6.

- [ ] **Step 4: Commit**

```bash
git add optimus-halal/src/components/ui/AiAnalysisGate.tsx optimus-halal/src/components/ui/index.ts
git commit -m "feat(paywall): add AiAnalysisGate component for AI detail sections"
```

---

## Task 4: Wire AiAnalysisGate into Scan Result

**Files:**
- Modify: `optimus-halal/app/scan-result.tsx`

**Context:** The scan-result screen has a `ScanResultPager` with two tabs:
- Tab 0 (Halal): `HalalSchoolsCard` — ingredient rulings, madhab verdicts, additives, scholarly refs
- Tab 1 (Health): `HealthNutritionCard` — healthScore axes, NutriScore, NOVA, nutrient breakdown

Both tabs contain AI-enriched data. We wrap the entire pager content with `AiAnalysisGate`.

- [ ] **Step 1: Add imports**

At the top of `optimus-halal/app/scan-result.tsx`, add these imports (near the other component imports):

```typescript
import { AiAnalysisGate } from "@/components/ui/AiAnalysisGate";
import { useAiQuotaStore } from "@/store";
```

- [ ] **Step 2: Add import for `usePremium`**

`usePremium` is NOT currently used in scan-result.tsx. You MUST add the import. At the top of the file, add:

```typescript
import { usePremium } from "@/hooks/usePremium";
```

- [ ] **Step 3: Wrap the ScanResultPager with AiAnalysisGate**

Find the `<ScanResultPager` JSX block (~line 778). Wrap it:

**Before:**
```tsx
          {/* PAGER: Halal (page 0) + Health (page 1) */}
          <ScanResultPager
            activeTab={activeTab}
            ...
          />
```

**After:**
```tsx
          {/* PAGER: Halal (page 0) + Health (page 1) — AI-gated after 3/day */}
          <AiAnalysisGate>
            <ScanResultPager
              activeTab={activeTab}
              ...
            />
          </AiAnalysisGate>
```

**IMPORTANT:** The `<VerdictHero>` above the pager is NOT gated — the verdict (halal/haram/douteux), NaqiyScore, certifier badge, and product info remain always-free. Only the detailed tabs below are gated.

**Note:** `AiAnalysisGate` now handles its own quota tracking internally (via `useRef` + `useEffect`). No `consumed` prop or external state management needed. The gate auto-decrements the quota on first render.

- [ ] **Step 5: Update hardcoded `5` references**

In scan-result.tsx, find the hardcoded references to `5` scans. There are two on lines ~186-187:

```typescript
  const localRemaining = useQuotaStore((s) => {
    if (s.lastScanDate !== new Date().toISOString().slice(0, 10)) return 5;
    return Math.max(0, 5 - s.dailyScansUsed);
  });
```

Replace with:

```typescript
  const localRemaining = useQuotaStore((s) => s.getRemainingScans());
```

This uses the store method which already reads `DAILY_SCAN_LIMIT` (now 20).

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 7: Commit**

```bash
git add optimus-halal/app/scan-result.tsx
git commit -m "feat(paywall): gate AI analysis sections behind 3/day quota"
```

---

## Task 5: Update Paywall Screen

**Files:**
- Modify: `optimus-halal/app/paywall.tsx`

- [ ] **Step 1: Update DAILY_SCAN_LIMIT and add AI quota imports**

At the top of `optimus-halal/app/paywall.tsx`:

Replace:
```typescript
const DAILY_SCAN_LIMIT = 5;
```

With:
```typescript
import { DAILY_SCAN_LIMIT, DAILY_AI_ANALYSIS_LIMIT, useAiQuotaStore } from "@/store";
```

(Remove the local constant, use the exported one from the store.)

- [ ] **Step 2: Add AI quota state**

Inside `PaywallScreen`, after `const remaining = useQuotaStore(...)`:

```typescript
const aiRemaining = useAiQuotaStore((s) => s.getRemainingAiAnalyses());
const aiQuotaExhausted = aiRemaining <= 0;
```

- [ ] **Step 3: Update features list to include AI analysis**

Replace the `allFeatures` array:

```typescript
  const allFeatures = [
    { icon: "auto-awesome" as const, text: t.paywall.featureUnlimitedAi, trigger: "ai_analysis_quota" },
    { icon: "all-inclusive" as const, text: t.paywall.featureUnlimitedScans, trigger: "scan_quota" },
    { icon: "favorite" as const, text: t.paywall.featureFavorites, trigger: "favorites" },
    { icon: "history" as const, text: t.paywall.featureHistory, trigger: "history" },
    { icon: "cloud-download" as const, text: t.paywall.featureOffline, trigger: "offline" },
  ];
```

**Note:** `"auto-awesome"` is a Material Icons name. Verify it exists in `optimus-halal/src/lib/icons.ts`. If not, use `"stars"` as fallback.

- [ ] **Step 4: Update title logic for AI quota context**

Replace the title section logic. The title `<Text>` should be:

```tsx
<Text className="text-2xl font-bold text-center" style={{ color: colors.textPrimary }}>
  {trialExpired
    ? t.paywall.trialExpired
    : trigger === "ai_analysis_quota"
      ? t.paywall.titleAiQuota
      : quotaExhausted
        ? t.paywall.title
        : t.paywall.titleRemaining.replace("{n}", String(remaining))}
</Text>
```

And the subtitle:

```tsx
<Text className="text-sm text-center leading-5" style={{ color: colors.textSecondary }}>
  {trialExpired
    ? t.paywall.trialExpiredSubtitle
    : trigger === "ai_analysis_quota"
      ? t.paywall.subtitleAiQuota
      : quotaExhausted
        ? t.paywall.subtitle
        : t.paywall.subtitleRemaining}
</Text>
```

- [ ] **Step 5: Update reset info text**

Replace the scansResetInfo line with context-aware text:

```tsx
<Text className="text-xs text-center" style={{ color: colors.textMuted }}>
  {trigger === "ai_analysis_quota"
    ? t.paywall.aiResetInfo
    : t.paywall.scansResetInfo}
</Text>
```

- [ ] **Step 6: Update analytics to track AI quota**

In the `useEffect` for tracking:

```typescript
React.useEffect(() => {
  trackEvent("paywall_viewed", {
    remaining_scans: remaining,
    remaining_ai: aiRemaining,
    quota_exhausted: quotaExhausted,
    ai_quota_exhausted: aiQuotaExhausted,
    trigger,
  });
}, []);
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 8: Commit**

```bash
git add optimus-halal/app/paywall.tsx
git commit -m "feat(paywall): update paywall screen for AI quota model"
```

---

## Task 6: Update i18n Translations (FR, EN, AR)

**Files:**
- Modify: `optimus-halal/src/i18n/translations/fr.ts`
- Modify: `optimus-halal/src/i18n/translations/en.ts`
- Modify: `optimus-halal/src/i18n/translations/ar.ts`

- [ ] **Step 1: Update French translations**

In `optimus-halal/src/i18n/translations/fr.ts`, update the `paywall` section:

**IMPORTANT:** The existing app uses "vous" (formal). Keep "vous" — do NOT switch to "tu". The landing page uses "tu" but the mobile app is "vous" throughout.

```typescript
paywall: {
  title: "Vous avez beaucoup scanné aujourd'hui !",
  titleAiQuota: "Vous avez utilisé vos 3 analyses IA du jour",
  titleRemaining: "Il vous reste {n} scans gratuits",
  subtitle: "Revenez demain ou passez à Naqiy+ pour continuer sans limite.",
  subtitleAiQuota: "Le verdict halal reste toujours gratuit. Passez à Naqiy+ pour des analyses détaillées illimitées.",
  subtitleRemaining: "Allez plus loin : analyses IA illimitées, historique complet, favoris synchronisés.",
  featureUnlimitedAi: "Analyses IA détaillées illimitées",
  featureUnlimitedScans: "Scans illimités, chaque jour",
  featureFavorites: "Favoris et listes synchronisées",
  featureHistory: "Historique complet de vos scans",
  featureOffline: "Mode hors ligne (100 produits)",
  monthly: "Mensuel",
  annual: "Annuel",
  perMonth: "€/mois",
  perYear: "€/an",
  cancelAnytime: "SANS ENGAGEMENT",
  cancelAnytimeDetail: "Résiliable à tout moment, en un clic",
  freeTrialDays: "7 jours d'essai gratuit",
  subscribe: "Soutenir Naqiy",
  later: "Plus tard",
  scansResetInfo: "Vos scans se rechargent demain à 00h00",
  aiResetInfo: "Vos 3 analyses IA gratuites se rechargent demain à 00h00",
  missionFooter: "Votre participation contribue à faire grandir le projet",
  existingAccount: "J'ai déjà un compte Naqiy+",
  restorePurchases: "Restaurer mes achats",
  restoring: "Restauration en cours…",
  noSubscriptionFound: "Aucun abonnement actif trouvé",
  restoreFailed: "Échec de la restauration. Réessayez plus tard.",
  trialBanner: "Essai gratuit — {n} jours restants",
  trialExpired: "Votre essai de 7 jours est terminé",
  trialExpiredSubtitle: "Soutenez le projet pour continuer à profiter de toutes les fonctionnalités.",
},
```

Also add a new `aiQuota` section (for the AiAnalysisGate component):

```typescript
aiQuota: {
  gateTitle: "Analyse détaillée réservée à Naqiy+",
  gateSubtitle: "Vous avez utilisé vos 3 analyses IA gratuites du jour. Le verdict halal reste toujours accessible.",
  upgradeCta: "Débloquer les analyses illimitées",
  resetInfo: "Vos analyses se rechargent demain à 00h00",
},
```

- [ ] **Step 2: Update English translations**

Mirror the same structure in `en.ts`:

```typescript
paywall: {
  title: "You've scanned a lot today!",
  titleAiQuota: "You've used your 3 AI analyses for today",
  titleRemaining: "You have {n} free scans left",
  subtitle: "Come back tomorrow or upgrade to Naqiy+ to continue without limits.",
  subtitleAiQuota: "The halal verdict is always free. Upgrade to Naqiy+ for unlimited detailed analyses.",
  subtitleRemaining: "Go further: unlimited AI analyses, full history, synced favorites.",
  featureUnlimitedAi: "Unlimited detailed AI analyses",
  featureUnlimitedScans: "Unlimited scans, every day",
  featureFavorites: "Synced favorites and lists",
  featureHistory: "Complete scan history",
  featureOffline: "Offline mode (100 products)",
  monthly: "Monthly",
  annual: "Annual",
  perMonth: "€/month",
  perYear: "€/year",
  cancelAnytime: "CANCEL ANYTIME",
  cancelAnytimeDetail: "Cancel anytime, in one tap",
  freeTrialDays: "7-day free trial",
  subscribe: "Support Naqiy",
  later: "Later",
  scansResetInfo: "Your scans reset tomorrow at midnight",
  aiResetInfo: "Your 3 free AI analyses reset tomorrow at midnight",
  missionFooter: "Your support helps grow the project",
  existingAccount: "I already have a Naqiy+ account",
  restorePurchases: "Restore purchases",
  restoring: "Restoring…",
  noSubscriptionFound: "No active subscription found",
  restoreFailed: "Restore failed. Try again later.",
  trialBanner: "Free trial — {n} days left",
  trialExpired: "Your 7-day trial has ended",
  trialExpiredSubtitle: "Support the project to keep enjoying all features.",
},
aiQuota: {
  gateTitle: "Detailed analysis reserved for Naqiy+",
  gateSubtitle: "You've used your 3 free AI analyses today. The halal verdict is always accessible.",
  upgradeCta: "Unlock unlimited analyses",
  resetInfo: "Your analyses reset tomorrow at midnight",
},
```

- [ ] **Step 3: Update Arabic translations**

Mirror in `ar.ts`:

```typescript
paywall: {
  title: "لقد قمت بمسح الكثير اليوم!",
  titleAiQuota: "لقد استخدمت تحليلاتك الثلاثة بالذكاء الاصطناعي لهذا اليوم",
  titleRemaining: "لديك {n} عمليات مسح مجانية متبقية",
  subtitle: "عد غداً أو انتقل إلى Naqiy+ للمتابعة بدون حدود.",
  subtitleAiQuota: "حكم الحلال مجاني دائماً. انتقل إلى Naqiy+ للتحليلات المفصّلة غير المحدودة.",
  subtitleRemaining: "اذهب أبعد: تحليلات ذكاء اصطناعي غير محدودة، سجل كامل، مفضلات متزامنة.",
  featureUnlimitedAi: "تحليلات ذكاء اصطناعي مفصّلة غير محدودة",
  featureUnlimitedScans: "مسح غير محدود، كل يوم",
  featureFavorites: "مفضلات وقوائم متزامنة",
  featureHistory: "سجل المسح الكامل",
  featureOffline: "وضع بدون إنترنت (100 منتج)",
  monthly: "شهري",
  annual: "سنوي",
  perMonth: "€/شهر",
  perYear: "€/سنة",
  cancelAnytime: "بدون التزام",
  cancelAnytimeDetail: "يمكن الإلغاء في أي وقت بنقرة واحدة",
  freeTrialDays: "7 أيام تجربة مجانية",
  subscribe: "دعم Naqiy",
  later: "لاحقاً",
  scansResetInfo: "تتجدد عمليات المسح غداً عند منتصف الليل",
  aiResetInfo: "تتجدد تحليلاتك الثلاثة المجانية غداً عند منتصف الليل",
  missionFooter: "دعمك يساهم في تطوير المشروع",
  existingAccount: "لديّ حساب Naqiy+ بالفعل",
  restorePurchases: "استعادة المشتريات",
  restoring: "جارٍ الاستعادة…",
  noSubscriptionFound: "لم يتم العثور على اشتراك نشط",
  restoreFailed: "فشلت الاستعادة. حاول مرة أخرى لاحقاً.",
  trialBanner: "تجربة مجانية — {n} أيام متبقية",
  trialExpired: "انتهت فترة التجربة لمدة 7 أيام",
  trialExpiredSubtitle: "ادعم المشروع للاستمتاع بجميع الميزات.",
},
aiQuota: {
  gateTitle: "التحليل المفصّل حصري لـ Naqiy+",
  gateSubtitle: "لقد استخدمت تحليلاتك الثلاثة المجانية بالذكاء الاصطناعي اليوم. حكم الحلال متاح دائماً.",
  upgradeCta: "فتح التحليلات غير المحدودة",
  resetInfo: "تتجدد تحليلاتك غداً عند منتصف الليل",
},
```

- [ ] **Step 4: Add `aiQuota` to the TranslationKeys type**

The `TranslationKeys` type is derived from `typeof fr` at the bottom of `fr.ts` — since we're adding `aiQuota` as a top-level key to the `fr` object, it will automatically be included. Verify that `en.ts` and `ar.ts` also have the same structure (TypeScript will error if they're missing keys).

- [ ] **Step 5: Verify TypeScript compiles with all translations**

Run: `cd optimus-halal && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: Clean compile — all translation keys now match

- [ ] **Step 6: Commit**

```bash
git add optimus-halal/src/i18n/translations/fr.ts optimus-halal/src/i18n/translations/en.ts optimus-halal/src/i18n/translations/ar.ts
git commit -m "feat(i18n): update paywall translations for AI quota model (FR/EN/AR)"
```

---

## Task 7: Update Scanner Quota Gate

**Files:**
- Modify: `optimus-halal/app/(tabs)/scanner.tsx:192-204`

- [ ] **Step 1: Verify scanner still works correctly with 20 limit**

The scanner quota gate code at line ~192 already uses `useQuotaStore.getState().getRemainingScans()` which reads `DAILY_SCAN_LIMIT`. Since we changed that to 20, this will automatically work. **No code change needed** — just verify.

However, check if there are any hardcoded `5` references in the scanner file:

Run: `grep -n "5\|five\|cinq" optimus-halal/app/\(tabs\)/scanner.tsx | grep -i "scan\|quota\|limit"`

If any are found, update them.

- [ ] **Step 2: Commit (only if changes were made)**

```bash
# Only if scanner.tsx was modified
git add "optimus-halal/app/(tabs)/scanner.tsx"
git commit -m "fix(scanner): update hardcoded quota references for 20-scan limit"
```

---

## Task 8: Verify Full Integration

- [ ] **Step 1: Full TypeScript check**

Run: `cd optimus-halal && npx tsc --noEmit --pretty`
Expected: Clean compile

- [ ] **Step 2: Verify feature flag interplay**

Check that `paymentsEnabled: false` in config.ts still disables ALL gates (both scan quota and AI quota). The `AiAnalysisGate` checks `isPremium` via `usePremium()`, which returns `isPremium: false` when payments disabled — meaning the gate renders children. ✅

Check that `paywallEnabled: false` prevents navigation to `/paywall`. The `showPaywall` function in `usePremium` checks `flags.paywallEnabled`. ✅

- [ ] **Step 3: Manual smoke test checklist**

Verify in Expo Go or dev build:

1. ✅ Scan a product → verdict + NaqiyScore always visible (never gated)
2. ✅ First 3 scans → detailed analysis visible (tabs content shows)
3. ✅ 4th scan → AiAnalysisGate shows upgrade prompt below verdict
4. ✅ Tapping upgrade → navigates to `/paywall` with `trigger=ai_analysis_quota`
5. ✅ Paywall shows "Tu as utilisé tes 3 analyses IA du jour" title
6. ✅ Paywall "Analyses IA détaillées illimitées" is first feature
7. ✅ Dismissing paywall → returns to scan result (verdict still visible)
8. ✅ 20th scan → scan quota paywall (extremely rare, soft anti-abuse)
9. ✅ Trial active → all content visible (no gates)
10. ✅ Premium user → all content visible (no gates)

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(paywall-v3): integration fixes after smoke test"
```

---

## Summary of Changes

| What | Before (V2) | After (V3) |
|------|-------------|------------|
| Scan limit | 5/day → paywall | 20/day → paywall (invisible anti-abuse) |
| AI analysis limit | None | 3/day → gate in scan-result |
| Paywall primary trigger | `scan_quota` | `ai_analysis_quota` |
| Verdict (halal/haram) | Always free | Always free (unchanged) |
| NaqiyScore | Always free | Always free (unchanged) |
| Detailed tabs (halal + health) | Always free | Gated after 3/day |
| Communication | "5 scans/jour" | Never mention limits in marketing |
