# Audit Architecture Frontend -- Optimus Halal

**Par Claude Opus 4.6 -- Lead Mobile Architect**
**Date: 2026-02-19**

---

## Verdict Global

**Score: 7.8 / 10 -- Architecture solide avec une dette technique maitrisee**

L'application Optimus Halal presente une architecture frontend mature et bien pensee pour une V1 en Expo SDK 54 / React Native 0.81.5. La separation des responsabilites est claire, le systeme de types est coherent de bout en bout grace a tRPC + `@backend/*` path alias, et le design system emergent couvre les besoins actuels. Les points forts sont le state management Zustand/MMKV bien structure, l'integration tRPC React Query avec optimistic updates, et le systeme de navigation Expo Router correctement segmente. Les axes d'amelioration principaux concernent la coexistence de deux couches API concurrentes (service layer + hooks tRPC), l'absence de React.memo sur les composants listes, et le manque de tests frontend.

---

## 1. Structure du Projet & Organisation

### Arborescence

```
optimus-halal/
  app/                      # Expo Router file-based routing (40 ecrans)
    _layout.tsx             # Root: providers, ErrorBoundary, Stack
    index.tsx               # Redirect guard (onboarding > auth > tabs)
    (auth)/                 # 7 ecrans auth (welcome, login, signup, magic-link, etc.)
    (onboarding)/           # 1 ecran
    (tabs)/                 # 6 ecrans (home, map, scanner, marketplace, profile, alerts)
    (marketplace)/          # 7 ecrans (catalog, product/[id], cart, checkout, etc.)
    settings/               # 13 ecrans (edit-profile, appearance, favorites, etc.)
    articles/               # 2 ecrans (index, [id])
    scan-result.tsx         # Modal
    report.tsx              # Modal
  src/
    components/             # 24 composants (ui/19, scan/3, navigation/1, skeletons/3)
    hooks/                  # 16 hooks custom
    store/                  # 2 fichiers (index.ts local, apiStores.ts API)
    services/api/           # 14 fichiers (client, config, 12 services)
    lib/                    # 5 fichiers (trpc, storage, sentry, analytics, logger)
    i18n/                   # 4 fichiers (index + 3 locales)
    theme/                  # 5 fichiers (colors, typography, animations, shadows, spacing)
    constants/              # 4 fichiers (config, index, locations, onboarding)
    types/                  # 1 fichier (index.ts)
```

**Points positifs:**
- La separation `app/` (routes) vs `src/` (logique) est canonique pour Expo Router
- Le groupement par feature dans `app/` ((auth), (tabs), (marketplace), settings) est clair
- Le barrel export pattern (`index.ts`) est present partout: hooks, components/ui, services

**Points negatifs:**
- `src/services/api/` contient 12 fichiers de services qui dupliquent les hooks tRPC -- dette technique identifiee (voir section 11)
- `src/types/index.ts` definit des types locaux (`Product`, `Store`, `User`) qui divergent des types `src/services/api/types.ts` -- source de confusion
- Pas de dossier `src/utils/` alors que le path alias `@utils/*` est declare dans `tsconfig.json`

### Conventions de Nommage

| Pattern | Convention | Respect |
|---------|-----------|---------|
| Hooks | `use<Feature>.ts` | Oui |
| Stores locaux | `useLocal<Feature>Store` | Oui |
| Stores API | `use<Feature>Store` | Oui |
| Components | `PascalCase.tsx` | Oui |
| Services | `<feature>.service.ts` | Oui |
| Constantes | `camelCase` exports, fichier `kebab-case` | Oui |

**Observation:** Les noms sont coherents. Un ecart: `PremiumTabBar.tsx` est dans `navigation/` mais pourrait etre dans `ui/` vu sa reutilisabilite.

### Separation des Responsabilites

La separation est globalement propre:
- **Ecrans** (`app/`): presentation + orchestration de hooks
- **Composants** (`src/components/`): UI pure, reutilisable
- **Hooks** (`src/hooks/`): logique metier + acces donnees via tRPC
- **Stores** (`src/store/`): etat local persistant (MMKV) vs etat API

**Probleme architectural majeur:** La couche `src/services/api/` (12 fichiers) et `src/store/apiStores.ts` forment une **couche intermediaire qui n'a plus lieu d'etre** depuis l'introduction des hooks tRPC (`useAuth.ts`, `useScan.ts`, `useFavorites.ts`, etc.). Les ecrans importent tantot des hooks tRPC, tantot des apiStores Zustand, creant une **dualite confuse** dans le data flow.

**Fichier:** `src/store/apiStores.ts` (1069 lignes) -- 9 stores Zustand qui wrappent `safeApiCall()` manuellement au lieu d'utiliser React Query.
**Fichier:** `src/services/api/client.ts` (354 lignes) -- tRPC client + service layer manuelle.

---

## 2. Navigation (Expo Router)

### Architecture des Routes

```
Root Stack (_layout.tsx)
  |-- index.tsx (Redirect guard)
  |-- (onboarding) [Stack, fade]
  |-- (auth) [Stack, fade_from_bottom]
  |     |-- welcome, login, signup, magic-link, forgot-password
  |     |-- reset-confirmation, set-new-password
  |-- (tabs) [Tabs, fade]
  |     |-- index (Home), map, scanner, marketplace, profile
  |     |-- alerts (href: null -- hidden tab)
  |-- (marketplace) [Stack, fade_from_bottom]
  |     |-- index, coming-soon, catalog, product/[id], cart, checkout, order-tracking
  |-- settings [Stack, slide_from_right]
  |     |-- 13 ecrans drill-down
  |-- scan-result [slide_from_bottom, modal-like]
  |-- report [presentation: modal]
  |-- articles [Stack, fade_from_bottom]
```

**Points positifs:**
- **Transitions bien differenciees**: `fade` pour les switch de groupe, `slide_from_right` pour le drill-down settings, `slide_from_bottom` pour les modals -- conforme aux best practices
- **QueryErrorBoundary** enveloppe chaque layout sauf le root (qui a ErrorBoundary globale) -- 5/6 layouts proteges
- **Guards correctement places**: `app/index.tsx` (L:16-30) gere onboarding > auth > tabs via `<Redirect>`
- **Deep linking** configure via `scheme: "optimushalal"` dans `app.config.ts` (L:12)
- **Typed routes** actives: `experiments.typedRoutes: true` (L:88)

**Points negatifs:**
- **`alerts` est un tab cache** (`href: null` dans `(tabs)/_layout.tsx:74`) mais accessible uniquement via `router.navigate("/(tabs)/alerts")`. Ce n'est ni un tab ni une page settings -- position architecturale ambigue
- **57 occurrences de `as any`** sur les routes, dont 18 dans `profile.tsx` -- les typed routes sont activees mais pas pleinement exploitees
- `router.push("/settings/premium" as any)` dans `usePremium.ts:28` -- un hook qui fait de la navigation directe est un anti-pattern. La navigation devrait etre dans la couche ecran.

### Transitions & Animations

| Zone | Animation | Duree | Evaluation |
|------|-----------|-------|------------|
| Root > Groups | fade | 200-400ms | Correct |
| Auth flow | fade_from_bottom | 300ms | Correct |
| Settings drill | slide_from_right | 250ms | Correct |
| Modals (scan-result, report) | slide_from_bottom | 350ms | Correct |
| Marketplace | fade_from_bottom | 300-350ms | Correct |
| Tab switch | fade (android: 200ms) | OK | Correct |

Les durees sont dans la plage 200-400ms recommandee. Le platform-specific Android `animationDuration: 200` dans `(tabs)/_layout.tsx:37` est un bon ajustement.

### Deep Linking

- Schema `optimushalal://` declare dans `app.config.ts:12`
- `expo-linking` est dans les dependances
- `auth/verify.tsx` existe pour la verification magic link
- **Manque:** Pas de configuration `expo-router` linking pour les routes profondes (product/[id], articles/[id])

### Guards & Redirects

- `app/index.tsx` (L:16-30): Guard triple onboarding > auth > tabs -- **correct et minimal**
- L'init auth se fait dans `AppInitializer` (`_layout.tsx:107-208`) avec timeout de 8s et fallback debug overlay -- **robuste pour la production**
- Pas de middleware Expo Router pour les guards proteges (les settings necessitant auth ne sont pas gardes explicitement)

---

## 3. State Management

### Zustand Stores (Architecture)

**Stores locaux** (`src/store/index.ts` -- 387 lignes):

| Store | Persiste (MMKV) | Responsabilite |
|-------|----------------|----------------|
| `useLocalAuthStore` | Oui | Cache auth local (user, isAuthenticated) |
| `useOnboardingStore` | Oui | Flag onboarding complete |
| `useThemeStore` | Oui | Theme preference (light/dark/system) |
| `useFeatureFlagsStore` | Non | Feature flags runtime |
| `useScanHistoryStore` | Oui | Historique local (max 100, deduplique) |
| `useLocalAlertsStore` | Non | Alertes en memoire |
| `useLocationStore` | Non | Geolocation + stores proches |
| `useLocalCartStore` | Oui | Panier offline |
| `useLanguageStore` | Oui | Langue selectionnee |
| `usePreferencesStore` | Oui | Certifications, exclusions, haptics, notifications |
| `useRamadanStore` | Oui | Override mode Ramadan |

**Stores API** (`src/store/apiStores.ts` -- 1069 lignes):

| Store | Responsabilite |
|-------|----------------|
| `useAuthStore` | Auth API (login, register, profile fetch) |
| `useScanStore` | Scan barcode API |
| `useFavoritesStore` | Favoris API |
| `useCartStore` | Panier API |
| `useOrdersStore` | Commandes API |
| `useNotificationsStore` | Notifications API |
| `useLoyaltyStore` | Fidelite API |
| `useAlertsStore` | Alertes API |
| `useStoresStore` | Points de vente API |
| `useGlobalStatsStore` | Stats globales API |

**Analyse:**
- **Pattern de selection** avec `useAuthStore((state) => state.isAuthenticated)` -- correct, evite les re-renders inutiles
- **`useLocalAuthStore` vs `useAuthStore`**: L'app a deux stores auth. `useLocalAuthStore` est persiste MMKV mais n'est PAS utilise dans les guards (correctement, car `useAuthStore` est la source de verite API). Cependant `useLocalAuthStore` existe sans consommateurs clairs -- **potentiel dead code**
- **Cart duplique**: `useLocalCartStore` (local/offline) et `useCartStore` (API) coexistent sans synchronisation bidirectionnelle. C'est intentionnel (feature flag `marketplaceEnabled: false`) mais un piege futur

### tRPC React Query (Integration)

**Fichier:** `src/lib/trpc.ts` (36 lignes)

```typescript
export const trpc = createTRPCReact<AppRouter>();
```

- Type `AppRouter` importe de `@backend/trpc/router` -- **type-safe end-to-end, zero duplication**
- `httpBatchLink` avec `superjson` transformer -- correct pour les dates/BigInt
- Headers: `Authorization`, `X-Device-Id`, `X-App-Version`, `X-Platform` -- couverture complete

**Hooks tRPC** (6 fichiers, 25 hooks):

| Fichier | Hooks | Patterns |
|---------|-------|----------|
| `useAuth.ts` | 6 | `useMutation` + `invalidateQueries` |
| `useScan.ts` | 4 | `useMutation` + analytics tracking |
| `useFavorites.ts` | 6 | **Optimistic updates** (add/remove) avec rollback |
| `useLoyalty.ts` | 7 | `useQuery` + `invalidate` sur mutation |
| `useReviews.ts` | 3 | `useMutation` + `invalidate` |
| `usePremium.ts` | 1 | Conditional query (`enabled: flags.paymentsEnabled`) |

**Point fort:** `useFavorites.ts` (L:18-101) implemente un pattern optimistic update exemplaire:
1. `onMutate`: Cancel queries > Snapshot > Update cache optimistiquement
2. `onError`: Rollback depuis le snapshot
3. `onSettled`: `invalidateQueries` pour la verite serveur

### MMKV Persistence

**Fichier:** `src/lib/storage.ts` (52 lignes)

- Utilise `createMMKV()` (Nitro JSI) -- correct pour MMKV v4
- **Fallback in-memory** si MMKV echoue (Expo Go, JSI manquant) -- resilient
- Adaptateur `StateStorage` pour Zustand `persist` middleware -- integration propre
- `mmkvInstance.getString()` / `set()` / `remove()` -- API correcte pour MMKV Nitro

### Cache Strategy

**QueryClient** (`_layout.tsx:56-70`):

```typescript
staleTime: 5 minutes
gcTime: 30 minutes
retry: 3 (exponential backoff max 30s)
refetchOnWindowFocus: true
refetchOnReconnect: true
mutations: retry: 1
```

- **Stale time 5min** est un bon compromis pour une app de scan (les donnees produit changent rarement)
- **gcTime 30min** conserve le cache en background -- correct pour les onglets tab switch
- Chaque hook tRPC override le `staleTime` par route (2min pour l'historique, 10min pour les achievements) -- **granularite correcte**

---

## 4. Type Safety

### tRPC End-to-End Types

- `@backend/*` path alias dans `tsconfig.json:18` mappe vers `../backend/src/*`
- `import type { AppRouter } from "@backend/trpc/router"` -- utilise dans `src/lib/trpc.ts:4` et `src/services/api/client.ts:16`
- Les hooks tRPC (`useScanBarcode`, `useFavoritesList`, etc.) heritent des types serveur sans declaration locale
- **Zero duplication de schema** pour les procedures tRPC -- c'est le gold standard

### Path Aliases (@backend/*)

```json
"@/*": ["./src/*"],
"@components/*": ["./src/components/*"],
"@hooks/*": ["./src/hooks/*"],
"@services/*": ["./src/services/*"],
"@store/*": ["./src/store/*"],
"@constants/*": ["./src/constants/*"],
"@backend/*": ["../backend/src/*"]
```

**Probleme:** Les alias `@screens/*`, `@types/*`, `@utils/*` sont declares mais `src/screens/`, `src/utils/` n'existent pas -- **aliases fantomes** a nettoyer.

### i18n Typed Keys

- `TranslationKeys` type exporte depuis `src/i18n/translations/fr.ts` -- type derive de l'objet FR
- `getTranslation(lang)` retourne `TranslationKeys` -- type-safe
- Usage: `t.common.loadingError` au lieu de `t("common.loadingError")` -- acces par path avec autocompletion TS
- Les fichiers EN et AR implementent le meme type -- **toute cle manquante produit une erreur de compilation**

### Component Props

- `IconButtonProps.accessibilityLabel: string` est **required** -- enforcement compile-time de l'a11y
- `ButtonProps` etend `TouchableOpacityProps` -- bonne composition
- `CardProps` etend `Omit<ViewProps, 'onBlur' | 'onFocus'>` -- evite les conflits natifs
- **57 occurrences de `as any`** dans les fichiers TS/TSX, principalement sur les routes Expo Router -- acceptable car le typed routes d'Expo ne couvre pas tous les patterns de navigation dynamique

### TypeScript Config

- `strict: true` -- bon
- `expo/tsconfig.base` comme base -- correct
- Un seul `@ts-expect-error` dans tout le codebase (`useTranslation.ts:37`) pour `expo-updates` optionnel -- **discipline exemplaire**

---

## 5. Composants & Reutilisabilite

### Design System Components

**19 composants UI** dans `src/components/ui/`:

| Composant | Variants | Props API | Evaluation |
|-----------|----------|-----------|------------|
| `Button` | primary/secondary/outline/ghost/danger, sm/md/lg | loading, disabled, icon, haptic | Complet |
| `Card` | elevated/outlined/filled | pressable, onPress | Complet |
| `IconButton` | default/filled/outline, sm/md/lg | badge, accessibilityLabel (required) | Complet |
| `Input` | -- | -- | Standard |
| `Badge` + `CertificationBadge` | -- | -- | Domaine-specifique |
| `Avatar` + `AvatarGroup` | -- | -- | Complet |
| `Chip` + `ChipGroup` | -- | -- | Standard |
| `Skeleton` + variants | Text/Card/List | -- | Pattern loading |
| `EmptyState` | -- | -- | Pattern vide |
| `OfflineBanner` | -- | -- | Connectivity |
| `StatusPill` | -- | -- | Domaine halal |
| `TrustRing` | -- | -- | Domaine halal |
| `GlowCard` | -- | -- | Premium visual |

### Composition Patterns

- **Button** (`src/components/ui/Button.tsx`): Utilise `LinearGradient` conditionnel, haptics integre, a11y state -- bonne composition
- **PremiumTabBar** (400+ lignes): Composant monolithique avec `TabItem`, `CenterScannerButton`, `GlowEffect` inline -- candidat au refactoring en sous-composants separes
- **Skeletons**: 3 specifiques (`AlertsSkeleton`, `HomeSkeleton`, `ProfileSkeleton`) + 1 generique (`Skeleton`) -- bon pattern mais les specifiques sont dans `src/components/skeletons/` separe de `ui/`

### Props API Consistency

- Pattern `variant` + `size` coherent entre `Button`, `Card`, `IconButton`
- `className` string concatenation pour NativeWind -- coherent dans tous les composants
- `haptic` prop avec default `true` sur `Button` et `IconButton` -- UX premium par defaut
- **Manque:** Pas de composant `Text` custom qui encapsulerait la typographie du design system (`src/theme/typography.ts` existe mais les ecrans utilisent des styles ad-hoc)

---

## 6. Performance

### Rendering (FlashList, memo, useMemo)

**FlashList** utilise dans 6 ecrans:
- `settings/scan-history.tsx`
- `settings/favorites.tsx`
- `(tabs)/alerts.tsx`
- `settings/certifier-ranking.tsx`
- `settings/boycott-list.tsx`
- `(marketplace)/catalog.tsx`

**FlatList** encore utilise dans 7 ecrans -- **migration incomplete**

**React.memo**: Seulement **2 composants** sont memo-ises (`MadhabBottomSheet.tsx`, `LevelUpCelebration.tsx`). Les items de liste (ProductCard, AlertCard, FavoriteItem) ne sont **pas memo-ises** -- cause potentielle de re-renders sur les longues listes.

**useMemo/useCallback**: 228 occurrences sur 42 fichiers -- usage correct mais les callbacks des items de FlashList (renderItem) ne sont pas systematiquement stabilises.

**useReducedMotion**: 7 fichiers -- bonne adoption pour l'a11y animations, surtout dans `PremiumTabBar.tsx` et `scanner.tsx`

**React Compiler** active (`experiments.reactCompiler: true` dans `app.config.ts:89`) -- ceci est une feature **experimentale** d'Expo SDK 54. Le compilateur React devrait automatiser certaines memoizations, ce qui explique le faible usage de React.memo. **A surveiller** pour la stabilite en production.

### Images (expo-image, caching)

- `expo-image` importe dans **22 fichiers** -- adoption complete, pas d'usage de `<Image>` RN natif
- **`contentFit`** utilise (pas `resizeMode`) -- correct pour expo-image
- `transition={200}` -- fade-in present dans les composants
- `useImageUpload` hook (L:52-100): Resize client-side (512x512 avatar, 1200px report) + WEBP compression -- **optimisation correcte**

### Bundle Size

**Dependances critiques par taille:**
- `@rnmapbox/maps` -- composant natif lourd (~15MB natif) mais necessaire pour la feature map
- `react-native-reanimated` + `react-native-gesture-handler` -- standard pour RN
- `@sentry/react-native` -- ~2MB mais essentiel
- `posthog-react-native` -- ~500KB

**Points d'attention:**
- 4 fichiers APK de ~212MB dans le repertoire de travail (`build-*.apk`) -- taille normale pour un dev build non strip
- `tailwindcss: 3.3.2` est utilise via NativeWind, pas directement shippe au runtime
- **expo-font** declare dans les plugins mais le font Inter n'est **jamais charge explicitement** via `useFonts()` -- la police risque de fallback sur le system font

### Startup Time

- `SplashScreen.preventAutoHideAsync()` appele synchroniquement -- correct
- RTL sync se fait **avant** le render React (L:48-53 de `_layout.tsx`) -- pas de flash
- `initSentry()` et `initAnalytics()` appeles au top-level module -- execution synchrone au require time
- `AppInitializer` avec timeout 8s et escape hatch -- production-ready
- **Potentiel probleme:** `queryClient` cree au module scope (`_layout.tsx:56`) -- OK pour un singleton mais empeche le SSR (non pertinent ici car mobile-only)

---

## 7. Gestion d'Erreurs & Resilience

### ErrorBoundary Strategy

**Double couche:**

1. **`ErrorBoundary`** (`src/components/ErrorBoundary.tsx`) -- Niveau root, capture Sentry, UI de fallback simple
   - `componentDidCatch` envoie a Sentry avec `componentStack`
   - Fallback: bouton "Reessayer" qui reset l'etat
   - **Defaut:** Le background est hardcode `#f8faf9` -- pas de dark mode support

2. **`QueryErrorBoundary`** (`src/components/QueryErrorBoundary.tsx`) -- Niveau layout, integre `QueryErrorResetBoundary` de React Query
   - Reset React Query cache on retry
   - Support dark mode via `useTheme()`
   - Enveloppe: (tabs), (auth), (onboarding), (marketplace), settings -- **5 sur 6 layouts**

### API Error Handling

**`safeApiCall`** (`src/services/api/client.ts:305-336`):
```typescript
async function safeApiCall<T>(apiCall: () => Promise<T>): Promise<{ data: T | null; error: OptimusApiError | null }>
```

- Pattern Go-style `{ data, error }` -- elimine les try/catch dans les stores
- `OptimusApiError.fromTRPCError()` parse les shapes tRPC (shape.code, shape.message, top-level code) -- robuste
- Erreurs reseau et timeout detectees et typees distinctement

**Token refresh** (`client.ts:263-293`):
- Flag `isRefreshing` + `refreshPromise` pour la serialisation -- evite les refreshes concurrents
- Si le refresh echoue, `clearTokens()` est appele -- evite les boucles infinies
- **Defaut:** Le refresh est dans le `fetch` interceptor du tRPC client imperatif, mais le tRPC React Query client (`src/lib/trpc.ts`) n'a **pas** de refresh interceptor -- les queries React Query qui expirent ne rafraichissent pas le token automatiquement

### Offline Behavior

- **`OfflineBanner`** (`src/components/ui/OfflineBanner.tsx`): Poll `clients3.google.com/generate_204` toutes les 30s, affiche un banner rouge anime -- correct
- **`refetchOnReconnect: true`** dans le QueryClient -- React Query refetch apres reconnexion
- **Pas d'offline-first**: Les donnees ne sont pas stockees localement pour usage hors ligne (sauf le scan history et le panier via MMKV). Feature flag `offlineCacheEnabled: false`
- **Pas de queue de mutations**: Les mutations echouees offline ne sont pas rejouees. React Query Offline Mutations n'est pas configure

---

## 8. Securite Mobile

### Token Storage

- **`expo-secure-store`** pour `ACCESS_TOKEN` et `REFRESH_TOKEN` (`src/services/api/client.ts:109-146`) -- **correct: stockage chiffre par le keychain/keystore natif**
- **`AsyncStorage`** pour `DEVICE_ID` (`client.ts:160-171`) -- OK car le device ID n'est pas sensible
- **`MMKV`** pour les preferences utilisateur et le cache -- **OK car pas de donnees sensibles** (pas de tokens, pas de mots de passe)
- Le token est stocke en memoire JS (`let accessToken`) ET dans SecureStore -- le memoire est volatile (redemarrage = relecture SecureStore), c'est correct

### API Communication

- HTTPS force en production via les URLs Railway (`https://mobile-bff-production-*.up.railway.app`)
- `X-App-Version` et `X-Platform` headers envoyes -- utile pour le rate limiting server-side
- `Accept-Language` header synchronise avec la langue choisie
- **Pas de certificate pinning** -- acceptable pour une V1 mais a considerer pour les releases financieres (marketplace)
- **Pas de request signing** (HMAC) -- acceptable si le backend valide les JWTs

### Input Validation

- `zod` est dans les dependances (`^3.25.76`) mais **aucune validation cote client** n'est visible dans les ecrans d'auth ou de formulaire
- Les formulaires auth (login, signup) n'ont pas de validation Zod cote mobile -- la validation est entierement server-side via les schemas tRPC
- **Recommandation:** Ajouter une validation client-side avec les memes schemas Zod pour un feedback instantane

---

## 9. Testing & CI/CD

### Test Coverage

- **Zero tests frontend** -- pas de fichiers `*.test.tsx`, pas de Jest/Vitest/Testing Library dans les devDependencies
- Les 22 tests mentionnes dans le README sont **exclusivement cote backend** (`backend/src/__tests__/`)
- **Risque critique** pour une app en production avec 40 ecrans et 16 hooks

### Build Pipeline (EAS)

**`eas.json`** (53 lignes):

| Profil | Distribution | Env | Notes |
|--------|-------------|-----|-------|
| development | internal (iOS sim) | APP_VARIANT=development | Dev client |
| preview | internal | APP_VARIANT=preview, Railway preview URL | Test |
| production | auto | APP_VARIANT=production, Railway prod URL | Release |

- `autoIncrement: true` pour la production -- correct
- `appVersionSource: "remote"` -- versions gerees par EAS, pas localement
- Submit config iOS (Apple ID) et Android (Google service key) -- pret pour les stores

### OTA Updates

- `runtimeVersion.policy: "appVersion"` (`app.config.ts:76-78`) -- le runtime version suit la version app
- `updates.url` pointe vers Expo Updates (`u.expo.dev/74c0f55e-...`) -- configure
- **Pas de `expo-updates`** dans les dependances explicites du package.json -- il est bundled par Expo SDK mais le import dynamique dans `useTranslation.ts:39` confirme qu'il est disponible uniquement en production build
- **Pas de channel EAS Updates** configure dans `eas.json` -- les updates OTA ne sont pas segmentees par profil

---

## 10. Croisement avec Gemini

### Zustand + MMKV = "pattern ideal"

**Confirme.** L'implementation est correcte:
- `createJSONStorage(() => mmkvStorage)` pour le persist middleware Zustand -- API conforme
- Fallback in-memory si JSI echoue -- resilience
- Stores atomiques (11 locaux + 10 API) plutot qu'un mega-store -- bonne granularite

**Nuance:** La coexistence de `useLocalAuthStore` et `useAuthStore` est une source de confusion. L'un persiste via MMKV, l'autre non. Le commentaire `apiStores.ts:6` dit "These are the CANONICAL stores -- prefer these over store/index.ts" mais les deux sont importes dans differents ecrans.

### Separation index.ts vs apiStores.ts = "maitrise parfaite"

**Partiellement conteste.** La separation est intentionnelle mais la frontiere est floue:
- `useLocalCartStore` (local, MMKV) et `useCartStore` (API) gèrent le meme domaine sans sync
- `useLocalAlertsStore` (local) et `useAlertsStore` (API) coexistent
- Les ecrans doivent choisir lequel importer -- charge cognitive pour les developpeurs

### safeApiCall wrapper = "Enterprise-Grade"

**Confirme avec nuance.** Le pattern `{ data, error }` est propre et elimine les try/catch redondants. Cependant:
- Il est utilise uniquement dans `apiStores.ts` (stores imperatifs), pas dans les hooks tRPC
- Les hooks tRPC utilisent le error handling natif de React Query (isError, error) -- qui est **superieur** car il gere les etats de chargement, le retry, et le cache automatiquement
- `safeApiCall` est donc un pattern transitoire qui devrait disparaitre avec la migration complete vers les hooks tRPC

### Mapbox + PostGIS optimise

**Partiellement confirme.**
- `@rnmapbox/maps` (v10.2.10) est bien installe et le plugin est declare
- `useMapStores` hook (`src/hooks/useMapStores.ts`) debounce les requetes map (300ms) et utilise `placeholderData: (prev) => prev` pour eviter les flickers -- **pattern optimal pour les cartes**
- Le backend utilise probablement PostGIS (via les parametres `latitude/longitude/radiusKm`) mais cela n'est pas verifiable cote frontend
- **Pas de clustering cote client** visible -- les 50 markers max (`limit: 50`) sont envoyes bruts

### Manque d'Offline First (WatermelonDB recommande)

**Conteste.** WatermelonDB serait un over-engineering pour cette app:
- Le use case principal (scan barcode > resultat) necessite une reponse serveur en temps reel
- Le cache React Query (5min stale, 30min gc) couvre les re-accces recents
- L'historique de scan est deja persiste localement via MMKV (`useScanHistoryStore`, max 100)
- Le panier est persiste localement (`useLocalCartStore`)
- **Recommandation:** Implementer `@tanstack/react-query-persist-client` avec MMKV pour persister le cache React Query -- plus leger que WatermelonDB et suffisant pour le use case

### Web Workers pour traitement lourd

**Conteste.** React Native n'a pas de Web Workers natifs. L'equivalent serait:
- `react-native-worklets` (deja installe dans les deps) -- pour les calculs lourds sur le thread UI
- L'image processing est deja fait via `expo-image-manipulator` qui utilise le thread natif
- Il n'y a pas de traitement CPU-intensif visible cote JS qui necessiterait un worker

### Bundle Size & OTA Updates

**Partiellement confirme.** La configuration OTA existe mais est incomplete:
- Pas de EAS Update channels
- Pas de `expo-updates` explicite dans package.json
- Les APKs de dev font ~212MB (normal avec debug symbols)
- La taille production n'est pas verifiable sans un build release

---

## 11. Dette Technique Identifiee

### DT-01: Double couche API (Critique)

**Impact:** Confusion architecturale, code mort potentiel, maintenance doublee.

- `src/services/api/*.service.ts` (12 fichiers, ~800 lignes) wrappent `apiClient` (tRPC imperatif)
- `src/store/apiStores.ts` (1069 lignes) wrappent ces services avec Zustand
- `src/hooks/use*.ts` (6 fichiers) utilisent `trpc.*` (tRPC React Query) directement

**Resolution:** Migrer tous les ecrans vers les hooks tRPC, supprimer les apiStores progressivement, puis les services.

### DT-02: `useLocalAuthStore` probablement dead code

**Fichier:** `src/store/index.ts:26-56`

Ce store persiste l'auth via MMKV mais n'est pas utilise dans les guards (`app/index.tsx` utilise `useAuthStore`). A verifier si des ecrans l'importent encore.

### DT-03: Types dupliques

**Fichiers:**
- `src/types/index.ts` -- types locaux (`Product`, `Store`, `User`)
- `src/services/api/types.ts` -- types API (`Product`, `Store`, `AuthUser`)
- tRPC AppRouter infere les types serveur

Trois sources de verite pour les memes entites. Les types locaux (`src/types/index.ts`) ne sont probablement plus necessaires.

### DT-04: `AppRouter = any` dans types.ts

**Fichier:** `src/services/api/types.ts:813`
```typescript
export type AppRouter = any;
```
Ce placeholder n'est plus necessaire car le vrai `AppRouter` est importe depuis `@backend/trpc/router`. Mais il pourrait etre importe accidentellement par des fichiers qui importent depuis `@/services/api/types`.

### DT-05: Font Inter jamais chargee

**Fichier:** `tailwind.config.js:83-85` et `src/theme/typography.ts:24-29` declarent "Inter" mais aucun `useFonts()` ou `Font.loadAsync()` n'est appele nulle part. Le plugin `expo-font` est declare dans `app.config.ts:66` mais sans chargement explicite, la police fallback system est utilisee.

### DT-06: Path aliases fantomes

**Fichier:** `tsconfig.json:10-11`
```json
"@screens/*": ["./src/screens/*"],
"@utils/*": ["./src/utils/*"]
```
Les dossiers `src/screens/` et `src/utils/` n'existent pas.

### DT-07: Pas de refresh token dans tRPC React Query

**Fichier:** `src/lib/trpc.ts`
Le tRPC client React Query n'a pas d'interceptor pour le token refresh. Seul le client imperatif (`src/services/api/client.ts:194-221`) gere le refresh sur 401. Les queries React Query qui expirent vont echouer silencieusement.

### DT-08: FlatList residuels

7 ecrans utilisent encore `FlatList` au lieu de `FlashList`. A migrer pour les listes de plus de 20 items.

### DT-09: `setNotificationPref` avec cle string non typee

**Fichier:** `src/store/index.ts:351`
```typescript
setNotificationPref: (key: string, value: boolean)
```
Le `key` devrait etre `keyof typeof notifications` pour la type-safety.

### DT-10: Navigation directe dans un hook

**Fichier:** `src/hooks/usePremium.ts:28`
```typescript
router.push("/settings/premium" as any);
```
Un hook ne devrait pas faire de navigation directe. Le `showPaywall` devrait etre une callback, pas un navigateur.

---

## 12. Roadmap Architecture

### Refactoring Critique (P0)

1. **Migrer la couche API vers tRPC React Query uniquement**
   - Creer les hooks manquants: `useCart`, `useOrders`, `useNotifications`, `useAlerts`, `useStores`, `useGlobalStats`
   - Migrer les ecrans de `useCartStore` (apiStores) vers `useCart` (hook tRPC)
   - Supprimer `apiStores.ts` quand tous les ecrans sont migres
   - Supprimer les `*.service.ts` quand `apiStores.ts` est supprime

2. **Ajouter le token refresh au client tRPC React Query**
   - Creer un `httpLink` custom dans `src/lib/trpc.ts` avec le meme interceptor 401 que `client.ts`
   - Ou utiliser un `onError` global dans le QueryClient pour declencher le refresh

3. **Charger la police Inter**
   - Ajouter `expo-font` + `@expo-google-fonts/inter` dans les deps
   - Charger les weights necessaires dans `_layout.tsx` avant de cacher le splash screen

### Optimisations (P1)

4. **Migrer les 7 FlatList restants vers FlashList**
   - Prioriser les ecrans avec beaucoup d'items: home, marketplace, map

5. **Ajouter React.memo sur les items de liste**
   - ProductCard, AlertCard, FavoriteItem, ScanHistoryItem
   - Note: Le React Compiler experimental pourrait rendre cela inutile -- a mesurer d'abord

6. **Persister le cache React Query**
   - `@tanstack/react-query-persist-client` + adapteur MMKV
   - Permet un demarrage offline avec des donnees stale

7. **Ajouter la validation client-side avec Zod**
   - Reutiliser les schemas du backend pour les formulaires (login, signup, report)
   - Feedback instantane sans round-trip serveur

8. **Nettoyer les types dupliques**
   - Supprimer `src/types/index.ts` apres verification des imports
   - Supprimer `AppRouter = any` dans `src/services/api/types.ts`
   - Supprimer les path aliases fantomes

### Evolution (P2)

9. **Extraire un composant `Text` typographique**
   - Encapsule `textStyles` de `src/theme/typography.ts`
   - API: `<Text variant="h1" color="primary">` avec support RTL auto

10. **Extraire `ScreenHeader` partage**
    - Les headers varient de 15-20px entre ecrans (observation du visual audit)
    - Centraliser hauteur + safe area + back button

11. **Ajouter des tests frontend**
    - Setup: `@testing-library/react-native` + `jest`
    - Priorite: hooks critiques (`useAuth`, `useScan`, `useFavorites`), puis composants UI

12. **Implementer le clustering Mapbox**
    - Pour les zones denses (Paris, Lyon), 50 markers non clusteres vont se chevaucher
    - `@rnmapbox/maps` supporte le clustering natif via SymbolLayer + ClusterLayer

---

## 13. Score Final Detaille

| Categorie | Score | Commentaire |
|-----------|-------|-------------|
| Structure & Organisation | 8/10 | Claire et bien segmentee. Perte de points pour la double couche API et les types dupliques |
| Navigation | 8.5/10 | Expo Router bien utilise, transitions coherentes, guards corrects. Alerts mal positionne |
| State Management | 7.5/10 | Zustand + MMKV excellent, mais coexistence stores locaux/API confuse. Hooks tRPC bien faits |
| Type Safety | 8.5/10 | tRPC end-to-end exemplaire, strict: true, 1 seul ts-expect-error. 57 `as any` sur les routes |
| Composants | 7/10 | Design system emergent correct. Manque Text typographique, PremiumTabBar monolithique |
| Performance | 7/10 | FlashList adopte partiellement, expo-image partout, React Compiler active. Peu de memo, FlatList residuels |
| Erreurs & Resilience | 8/10 | Double ErrorBoundary, safeApiCall, timeout init. Pas de refresh token pour React Query |
| Securite | 8/10 | SecureStore pour tokens, HTTPS, MMKV pour prefs. Pas de pinning ni de validation client |
| Testing & CI/CD | 4/10 | EAS bien configure, OTA partiel. Zero tests frontend -- risque critique |
| i18n & Accessibilite | 8/10 | 3 locales typees, RTL support avec restart dialog, scaleFont, useReducedMotion, a11y labels |

**Score Global: 7.8/10**

**Resume:** Architecture V1 solide avec les bons choix technologiques (tRPC, Zustand, MMKV, Expo Router). La dette principale est la double couche API (services imperatifs vs hooks declaratifs) qui devrait etre resolue en P0. L'absence de tests frontend est le risque le plus critique pour la maintenabilite. Le design system est fonctionnel mais pas encore mature. Les patterns de performance sont corrects grace au React Compiler experimental mais necessitent une validation empirique.
