# Migration Expo SDK 54 → 55

> **Date** : 2026-03-31
> **Statut** : En attente
> **Difficulte globale** : MOYENNE (3/5)
> **Temps estime** : 2-4 heures (hors migrations optionnelles)

---

## Versions cibles

| Composant | Actuel (SDK 54) | Cible (SDK 55) |
|-----------|----------------|----------------|
| `expo` | 54.0.33 | 55.0.9 |
| `react-native` | 0.81.5 | 0.83.4 |
| `react` | 19.1.0 | 19.2.0 |
| `expo-router` | 6.0.23 | 55.0.8 |
| `react-native-reanimated` | 4.1.6 | 4.2.1 |
| `react-native-worklets` | 0.5.1 | 0.7.2 |
| `react-native-screens` | 4.16.0 | ~4.23.0 |
| `react-native-gesture-handler` | 2.28.0 | ~2.30.0 |

---

## 1. Changements obligatoires

### 1.1 New Architecture permanente

SDK 55 supprime le bridge legacy. Plus de flag `newArchEnabled` — la New Architecture est activee de force. Tous les modules natifs doivent supporter Fabric/TurboModules.

### 1.2 Compatibilite des dependances natives

| Dependance | New Arch | RN 0.83 | Verdict |
|-----------|:---:|:---:|---------|
| `react-native-mmkv` v4 (Nitro) | OK | OK | Deja sur Nitro Modules |
| `react-native-purchases` v9 | OK | OK | peerDep `>= 0.73.0` |
| `@sentry/react-native` v7 | OK | OK | peerDep `expo >= 49` |
| `@rnmapbox/maps` v10 | OK | OK | peerDep `>= 0.79` |
| `@gorhom/bottom-sheet` v5 | OK | OK | peerDep `react-native: *` |
| `react-native-reanimated` v4 | OK | OK | Bump mineur 4.1.6 → 4.2.1 |
| `react-native-gesture-handler` | OK | OK | Bump 2.28 → ~2.30 |
| `react-native-screens` | OK | OK | Bump 4.16 → ~4.23 |
| `posthog-react-native` | OK | OK | JS principalement |
| `@shopify/flash-list` v2 | OK | OK | New Arch natif |
| `nativewind` v4 | OK | OK | Pas de peerDep sur RN |
| **`react-native-shadow-2`** | **?** | **?** | **Peu maintenu — a tester. Fallback : `boxShadow` natif RN 0.83** |

> **Point d'attention** : `react-native-shadow-2` est le seul module a risque.
> RN 0.83 supporte `boxShadow` nativement, ce qui permettrait de supprimer cette dependance.

---

## 2. Packages deprecies a migrer

### 2.1 `expo-linear-gradient` (51 usages, 15+ fichiers)

- **Effort** : MOYEN
- **Urgence** : Non bloquant (fonctionne encore en SDK 55, mais marque deprecated)
- **Remplacement** : `experimental_backgroundImage` + CSS gradients dans les Views
- **Fichiers concernes** :
  - `src/components/ui/PremiumBackground.tsx`
  - `src/components/ui/Avatar.tsx`
  - `src/components/ui/Button.tsx`
  - `src/components/ui/EmptyState.tsx`
  - `src/components/navigation/PremiumTabBar.tsx`
  - `src/components/scan/AlternativeHeroCard.tsx`
  - `src/components/scan/ScanLoadingSkeleton.tsx`
  - `src/components/scan/HalalSchoolsCard.tsx`
  - `src/components/scan/ScanBottomBar.tsx`
  - `src/components/scan/BottomBarV2.tsx`
  - + ~5 autres fichiers

### 2.2 `@expo/vector-icons` (1 usage)

- **Effort** : TRIVIAL
- **Remplacement** : `expo-symbols` (SF Symbols) ou garder `phosphor-react-native` (deja principal)

### 2.3 `AsyncStorage` (1 fichier, 5 appels)

- **Effort** : FAIBLE
- **Fichier** : `src/services/auth/magicLink.service.ts`
- **Remplacement** : Migrer vers MMKV (deja dans le projet)

### 2.4 `expo-constants` (implicite)

- **Effort** : TRIVIAL
- SDK 55 le bundle dans `expo` directement — retirer du `package.json`

---

## 3. Nettoyage de config

### 3.1 `babel.config.js`

- Le plugin `module-resolver` est redondant avec les `paths` de `tsconfig.json` (Metro les resout nativement depuis SDK 53)
- Garder : `babel-preset-expo`, `nativewind/babel`, `react-native-reanimated/plugin`
- A retirer : bloc `module-resolver` entier

### 3.2 `metro.config.js`

- Config minimale avec NativeWind — rien a changer

### 3.3 `app.config.ts`

- `react-native-purchases` deja retire des plugins (fait le 2026-03-31)
- Pas de `newArchEnabled` a supprimer (deja absent)
- Pas de champ `notification` dans app.json (on utilise le config plugin)

### 3.4 `tsconfig.json`

- Verifier si `ignoreDeprecations: "5.0"` est encore necessaire avec TS 5.9

### 3.5 `package.json`

- Retirer l'override `lightningcss` si plus necessaire apres upgrade

---

## 4. Opportunites SDK 55 pour Naqiy

### 4.1 `NativeTabs` — Navigation native iOS/Android

- Remplace les tabs custom par des tabs natifs (UITabBarController iOS, BottomNavigationView Android)
- Includes `NativeTabs.Trigger.Icon`, `.Label`, `.Badge`
- **Opportunite** : simplifier le `PremiumTabBar` custom
- **Consideration** : custom branding vs. native feel — a evaluer

### 4.2 `expo-blur` ameliore (Android 12+)

- Utilise `RenderNode` API — performance ~10x sur Android
- `PremiumBackground.tsx` en profiterait directement
- Nouveau pattern `BlurTargetView`

### 4.3 `expo-video` ameliore

- `seekTolerance` + `scrubbingModeOptions`
- Meilleur PiP Android (multiple VideoViews)
- `surfaceType: "textureView"` pour Samsung toujours supporte

### 4.4 `boxShadow` natif RN 0.83

- Plus besoin de `react-native-shadow-2`
- Syntaxe CSS standard : `boxShadow: '0px 4px 12px rgba(0,0,0,0.15)'`
- Suppression d'une dependance entiere

### 4.5 React 19.2

- Meilleur support `useActionState`, `useOptimistic`
- Messages d'erreur hydration plus clairs en dev

---

## 5. Plan d'execution

### Phase 1 — Upgrade core (30 min)

- [ ] `npx expo install expo@latest`
- [ ] `npx expo install --fix`
- [ ] `npx expo-doctor` — diagnostic automatique
- [ ] Resoudre les warnings du doctor

### Phase 2 — Nettoyage (20 min)

- [ ] Retirer `expo-constants` du `package.json`
- [ ] Retirer `@expo/vector-icons` du `package.json` (1 seul usage)
- [ ] Retirer le bloc `module-resolver` de `babel.config.js`
- [ ] Migrer `AsyncStorage` → MMKV dans `magicLink.service.ts`
- [ ] Verifier/retirer override `lightningcss`
- [ ] Verifier `ignoreDeprecations` dans `tsconfig.json`

### Phase 3 — Rebuild et tests (1-2h)

- [ ] `npx expo prebuild --clean`
- [ ] Tester sur simulateur iOS
- [ ] Tester sur emulateur Android
- [ ] **Tests critiques** :
  - [ ] Scan camera (barcode)
  - [ ] Carte Mapbox (nearby stores)
  - [ ] Video splash (AnimatedSplash.tsx)
  - [ ] Bottom sheets (produit detail, etc.)
  - [ ] Auth flow complet (login/register/logout)
  - [ ] MMKV storage
  - [ ] RevenueCat paywall
  - [ ] Sentry error reporting
  - [ ] PostHog analytics
  - [ ] Notifications push
  - [ ] Biometrie (expo-local-authentication)

### Phase 4 — Gerer `react-native-shadow-2` (30 min - 1h)

- [ ] Tester si `react-native-shadow-2` compile avec RN 0.83
- [ ] Si echec : migrer vers `boxShadow` natif (RN 0.83)
- [ ] Lister tous les fichiers utilisant `shadow-2` et remplacer

### Phase 5 — Optionnel (futur)

- [ ] Migrer `expo-linear-gradient` → CSS gradients (51 usages)
- [ ] Explorer `NativeTabs` pour le tab bar
- [ ] Explorer `expo-glass-effect` pour effets premium

---

## 6. Risques et mitigations

| Risque | Probabilite | Impact | Mitigation |
|--------|:-----------:|:------:|-----------|
| `react-native-shadow-2` incompatible | Moyenne | Faible | `boxShadow` natif RN 0.83 est un meilleur remplacement |
| NativeWind v4 + RN 0.83 edge cases | Faible | Moyen | NativeWind v4.2.3 n'a pas de peerDep RN, tests visuels |
| Regression animations Reanimated | Faible | Moyen | Bump mineur 4.1→4.2, API stable |
| Mapbox rendering issues | Faible | Eleve | peerDep `>= 0.79` OK, tester carte + markers |
| EAS Build config changes | Faible | Faible | `eas.json` inchange, Xcode 26 requis (EAS gere) |

---

## 7. Commande de rollback

En cas de probleme critique, revenir a SDK 54 :

```bash
git stash  # ou git checkout .
pnpm install
npx expo prebuild --clean
```

---

## References

- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55)
- [Guide de migration SDK 55](https://expo.dev/blog/upgrading-to-sdk-55)
- [Expo Router v55](https://expo.dev/blog/expo-router-v55-more-native-navigation-more-powerful-web)
- [New Architecture Guide](https://docs.expo.dev/guides/new-architecture/)
- [RN 0.83 Release Notes](https://reactnative.dev/blog)
