# Profile Screen — Apple World-Class Redesign

**Date** : 2026-03-31
**Statut** : Draft
**Scope** : Mobile app (`optimus-halal/`)

---

## 1. Contexte & Objectif

Le profile screen actuel est fonctionnel (1207 lignes, 2 branches) mais manque de rigueur Apple-level. Le redesign vise :

- **2 etats uniquement** : Free (guest) et Naqiy+ (connecte). Pas de 3eme etat.
- **Zero gamification** : suppression XP, streak, level, points, leaderboard, achievements, rewards.
- **Padlock UX** : menus visibles mais verrouilles pour les free users post-trial.
- **Trial data isolation** : donnees premium en MMKV local pendant le trial, merge en base a l'achat.
- **Madhab locking** : free = "General" uniquement, 4 ecoles = Naqiy+/trial.
- **Certifications preferees** : derriere feature flag `certificationsPreferencesEnabled` (OFF par defaut), full-stack.
- **Garde-fou expiration** : un ex-premium dont l'abo a expire ne peut pas se reconnecter sans reabonnement.

**Invariant architectural** : Connecte = toujours Naqiy+. Pas de "free connecte".

---

## 2. Etats du Profile

### 2.1 Free (Guest) — Mode Decouverte

```
+------------------------------------+
|            [Gear]  Profil          |
+------------------------------------+
|                                    |
|       (o) Logo Naqiy (gold)        |
|       Mode Decouverte              |
|   ou "Essai gratuit - Xj restants" |
|                                    |
|       ████░░░░░ 3/5 scans         |  <- masque si trial actif
|                                    |
|    [ Decouvrir Naqiy+  > ]         |  <- bouton gold -> paywall
|                                    |
|    Deja un compte ? Se connecter   |  <- lien texte discret
+------------------------------------+
| S Preferences                      |
|   Ecole juridique (madhab)         |  <- "General" seul, cadenas sur 4 ecoles
|   Exclusions alimentaires          |  <- cadenas sur elements premium
|   Profil sante                     |  <- cadenas sur elements premium
|   Boycott & ethique                |  <- cadenas sur elements premium
|   Classement certifieurs           |  <- libre
+------------------------------------+
| S General                          |
|   Apparence                        |
|   Langue                           |
|   Centre d'aide                    |
|   Signaler un probleme             |
|   Revoir l'introduction            |
|   CGU                              |
|   Politique de confidentialite     |
+------------------------------------+
|            v2.1.0                  |
+------------------------------------+
```

**Comportement trial vs post-trial :**

| Element | Trial actif (7j) | Post-trial (free) |
|---------|-------------------|-------------------|
| Hero | "Essai gratuit - Xj restants" (badge vert) | "Mode Decouverte" (globe gold) |
| Quota | Masque (illimite) | Visible (3/5 scans) |
| CTA | "Decouvrir Naqiy+" (gold) | "Decouvrir Naqiy+" (gold) |
| Madhab | 4 ecoles deverrouillees, data MMKV | "General" seul, cadenas sur 4 ecoles |
| Exclusions | Deverrouille, data MMKV | Cadenas |
| Profil sante | Deverrouille, data MMKV | Cadenas |
| Boycott | Deverrouille, data MMKV | Cadenas |
| "Se connecter" | Visible | Visible |

### 2.2 Naqiy+ (Connecte Premium)

```
+------------------------------------+
|  [Bell]       Profil       [Gear]  |
+------------------------------------+
|                                    |
|     (o) Avatar (gold ring)         |
|      [pencil]                      |  <- overlay -> edit profile
|       Mehdi Lam.                   |
|                                    |
+------------------------------------+
| S Preferences                      |
|   * Naqiy+ - Actif                 |  <- MenuItem dore, 1er item -> gestion abo
|   Historique de scans              |  <- X scans
|   Favoris                          |  <- X produits
|   Ecole juridique (madhab)         |  <- 4 ecoles + General
|   Exclusions alimentaires          |  <- full access
|   Profil sante                     |  <- full access
|   Boycott & ethique                |  <- full access
|   Notifications                    |
|   Classement certifieurs           |
+------------------------------------+
| S General                          |
|   Apparence                        |
|   Langue                           |
|   Centre d'aide                    |
|   Signaler un probleme             |
|   Revoir l'introduction            |
|   CGU                              |
|   Politique de confidentialite     |
|   Supprimer mon compte             |  <- rouge
|   Se deconnecter                   |  <- rouge, dernier item
+------------------------------------+
|            v2.1.0                  |
+------------------------------------+
```

**Note** : "Certifications preferees" est masque (feature flag `certificationsPreferencesEnabled = false`). Quand active, il apparait entre "Boycott" et "Notifications" dans Preferences.

---

## 3. Padlock UX — Menus verrouilles

### 3.1 Principe

Les free users post-trial voient les menus mais les elements premium a l'interieur sont verrouilles.

**Menus concernes :**
- Ecole juridique (madhab) : les 4 ecoles verrouillees, "General" seul accessible
- Exclusions alimentaires : tous les elements verrouilles
- Profil sante : tous les elements verrouilles
- Boycott & ethique : tous les elements verrouilles

**Menus libres :**
- Classement certifieurs : libre (vitrine, pas de data user)
- Apparence, Langue, Aide, etc. : libre

### 3.2 UX du cadenas dans les sous-ecrans

Quand un free user entre dans un sous-ecran (ex: Profil sante) :

1. **Elements visibles mais grises** avec icone cadenas (LockSimple de Phosphor, 16px, `colors.textMuted`)
2. **Tap sur element verrouille** -> Bottom sheet contextuel :
   - Titre : "Fonctionnalite Naqiy+"
   - Description : specifique a la feature (ex: "Configurez vos allergenes et votre profil de sante pour des analyses personnalisees")
   - Bouton gold "Decouvrir Naqiy+" -> paywall
   - Lien "Fermer" discret
3. **Pas de redirect brutal** : le user reste dans le sous-ecran apres fermeture du bottom sheet

### 3.3 Ecran Madhab specifique

L'ecran madhab affiche les 5 options :

| Option | Free post-trial | Trial | Naqiy+ |
|--------|----------------|-------|--------|
| General | Selectionnable (radio actif) | Selectionnable | Selectionnable |
| Hanafi | Grises + cadenas | Selectionnable (MMKV) | Selectionnable (DB) |
| Shafii | Grises + cadenas | Selectionnable (MMKV) | Selectionnable (DB) |
| Maliki | Grises + cadenas | Selectionnable (MMKV) | Selectionnable (DB) |
| Hanbali | Grises + cadenas | Selectionnable (MMKV) | Selectionnable (DB) |

Quand un free user a "General" actif, les verdicts scan utilisent la logique generale (pas de differentiation par ecole).

---

## 4. Trial Data Isolation

### 4.1 Probleme

Pendant le trial, le user configure des preferences premium (madhab specifique, allergenes, grossesse...). A l'expiration, ces donnees ne doivent PAS etre utilisees par l'app (sinon c'est equivalent a un achat gratuit).

### 4.2 Solution : Namespace MMKV + guard

**Stockage trial** : Toutes les donnees premium du trial utilisent le prefixe `naqiy.trial.*` :
- `naqiy.trial.madhab` (MadhabId)
- `naqiy.trial.dietary-preferences` (exclusions, allergenes, etc.)
- `naqiy.trial.health-profile` (grossesse, enfants, etc.)
- `naqiy.trial.boycott-preferences` (liste boycott)

**Store existants concernes** :
- `useLocalDietaryPreferencesStore` (cle `"naqiy.dietary-preferences"`) — deja namespace
- `useLocalNutritionProfileStore` (cle `"nutrition-profile-storage"`) — a renommer en `"naqiy.trial.nutrition-profile"`

**Guard global** :

```typescript
// Dans chaque hook qui lit des donnees premium locales
function useTrialGuardedData<T>(key: string, fallback: T): T {
  const { isTrialActive } = usePremium();
  const { isPremium } = usePremium();

  // Donnees accessibles uniquement si trial actif OU premium
  if (!isTrialActive && !isPremium) return fallback;
  return mmkv.getString(key) ? JSON.parse(mmkv.getString(key)!) : fallback;
}
```

### 4.3 Merge trial -> DB a l'achat

Au moment de l'achat Naqiy+ (dans `handlePurchase` de `premium.tsx`) :

1. Lire toutes les donnees `naqiy.trial.*` du MMKV
2. Apres creation du compte (register), envoyer via `profile.updateProfile` :
   - `madhab`, `dietaryRestrictions`, `allergens`, `isPregnant`, `hasChildren`
3. Nettoyer les cles `naqiy.trial.*` du MMKV apres merge reussi
4. Les donnees sont maintenant en DB (source of truth pour les premium)

### 4.4 Expiration trial

A l'expiration du trial :
- Les donnees MMKV **restent** (pas de suppression)
- Le guard retourne le fallback -> l'app se comporte comme si aucune preference n'etait configuree
- Le madhab revient a "General" dans l'UI (le store MMKV conserve "hanafi" mais le guard retourne "general")
- Les sous-ecrans (sante, exclusions, boycott) affichent les cadenas
- Si le user s'abonne plus tard, les donnees trial sont encore la pour le merge

**Important** : `usePreferencesStore.selectedMadhab` peut contenir "hanafi" meme apres expiration. Tous les consumers (scan verdicts, UI) doivent lire via le guard, jamais directement depuis le store.

---

## 5. Garde-fou Expiration Abonnement

### 5.1 Scenario

User achete Naqiy+ -> cree un compte -> utilise l'app -> annule l'abo App Store/Google Play -> revient.

### 5.2 Implementation

**Backend — Login (`auth.ts`)** :
- Apres verification du mot de passe, check `user.subscriptionTier`
- Si `subscriptionTier === "free"` ET `subscriptionExpiresAt < now()` :
  - Retourner erreur `SUBSCRIPTION_EXPIRED`
  - Message : "Votre abonnement Naqiy+ a expire. Reabonnez-vous pour acceder a votre compte."

**Backend — Token refresh (`auth.ts`)** :
- Meme check lors du refresh de JWT
- Si expire -> refuser le refresh -> force logout cote client

**Frontend — Login screen** :
- Sur erreur `SUBSCRIPTION_EXPIRED` :
  - Afficher le message + bouton "Renouveler Naqiy+" -> paywall
  - Apres achat reussi -> retry login automatique

**Frontend — App launch** :
- Attendre l'initialisation de RevenueCat (`Purchases.isConfigured`)
- PUIS si tokens stockes mais `usePremium().isPremium === false` :
  - Clear tokens (`clearTokens()`)
  - Reset stores (`useLocalAuthStore.getState().logout()`)
  - Retour en Mode Decouverte
- **Important** : ne PAS executer ce check avant l'init RC (sinon faux positif au demarrage a froid)

**Donnees preservees** : Le compte et toutes ses donnees restent en base. Au reabonnement + reconnexion, le user retrouve tout.

### 5.3 RevenueCat webhook

Le webhook RevenueCat existant met deja a jour `subscriptionTier` en base. Pas de changement necessaire.

---

## 6. Madhab Locking

### 6.1 Changement

Actuellement : tous les madhabs accessibles a tous.
Nouveau : free = "General" uniquement, 4 ecoles = Naqiy+/trial.

### 6.2 Fichiers impactes

**`app/settings/madhab.tsx`** :
- Ajouter props `isPremium` et `isTrialActive` depuis `usePremium()`
- Les 4 ecoles affichent un cadenas si `!isPremium && !isTrialActive`
- Tap sur ecole verrouille -> bottom sheet upsell

**`src/store/index.ts` (usePreferencesStore)** :
- `setMadhab()` : verifier `isTrialActive || isPremium` avant d'accepter un madhab != "general"
- Si trial : stocker dans `naqiy.trial.madhab`
- Si premium : stocker dans le store standard (synce en DB)

**`src/components/scan/` (verdicts)** :
- Le calcul des verdicts madhab-specifiques doit respecter le guard
- Si le madhab stocke est verrouille (free post-trial) -> utiliser "general"

**Backend** :
- Le champ `users.madhab` reste tel quel (default: "general")
- Pas de changement backend — le locking est purement frontend

### 6.3 Impact scan results

Quand le madhab est "general" :
- Les MadhabRings affichent tous les madhabs a titre informatif
- Le verdict hero utilise la logique consensuelle (pas de differentiation)

Quand le madhab est specifique (Hanafi, etc.) :
- Le verdict hero utilise le verdict du madhab selectionne
- Les MadhabRings mettent en surbrillance le madhab de l'utilisateur

---

## 7. Certifications Preferees — Feature Flag Full-Stack

### 7.1 Objectif

Permettre aux utilisateurs Naqiy+ de selectionner leurs certifieurs de confiance. Les produits certifies par ces certifieurs seront mis en avant dans les resultats de scan.

**Feature flag** : `certificationsPreferencesEnabled` (default: `false`, invisible pour l'instant).

### 7.2 DB — Migration `0032_user_certification_preferences.sql`

```sql
-- User certification preferences (many-to-many)
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "certification_preferences" text[] DEFAULT '{}';

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS "users_cert_prefs_idx"
  ON "users" USING GIN ("certification_preferences");
```

Choix d'une colonne `text[]` sur `users` (meme pattern que `dietary_restrictions` et `allergens`) plutot qu'une table de jointure — simple, coherent avec l'existant.

### 7.3 Backend — Schema Drizzle

**`backend/src/db/schema/users.ts`** :

```typescript
certificationPreferences: text("certification_preferences")
  .array()
  .default(sql`'{}'::text[]`),
```

### 7.4 Backend — Router

**`backend/src/trpc/routers/auth.ts`** :
- Ajouter `certificationPreferences` a `safeUserColumns`

**`backend/src/trpc/routers/profile.ts`** (ou equivalent) :
- Mutation `updateProfile` : accepter `certificationPreferences: z.array(z.string()).optional()`
- Valider que les IDs correspondent a des certifieurs existants en base

### 7.5 Backend — Feature Flag Seed

**`backend/src/db/seeds/seed-feature-flags.ts`** :

```typescript
{
  key: "certificationsPreferencesEnabled",
  label: "Certifications preferees",
  description: "Permet aux utilisateurs de selectionner leurs certifieurs de confiance",
  flagType: "boolean",
  enabled: false,
  defaultValue: false,
}
```

### 7.6 Frontend — Feature Flag

**`optimus-halal/src/constants/config.ts`** :

```typescript
interface FeatureFlags {
  // ... existants ...
  certificationsPreferencesEnabled: boolean;
}

const defaultFeatureFlags: FeatureFlags = {
  // ... existants ...
  certificationsPreferencesEnabled: false,
};
```

### 7.7 Frontend — Profile Screen

Le MenuItem "Certifications preferees" est gate :

```typescript
{flags.certificationsPreferencesEnabled && (
  <MenuItem
    icon="shield-moon"
    title={t.profile.preferredCertifications}
    // ...
  />
)}
```

### 7.8 Frontend — Certifications Screen

L'ecran `app/settings/certifications.tsx` existe deja. Ajouts :
- Padlock UX pour les free users (meme pattern que les autres sous-ecrans)
- Trial : data en MMKV `naqiy.trial.certifications`
- Premium : data en DB via `profile.updateProfile`

### 7.9 Admin

Le feature flag est deja gerable via la table `feature_flags` et l'admin existant. Activation = `UPDATE feature_flags SET enabled = true WHERE key = 'certificationsPreferencesEnabled'`.

---

## 8. Elements supprimes

### 8.1 Gamification (supprime du profil)

Elements retires du profile screen :
- Gamification card (XP progress, streak, scans, points)
- Level badge sous le nom
- MenuItem "Classement" (leaderboard)
- MenuItem "Succes" (achievements)
- MenuItem "Recompenses" (rewards)

**Note** : Les tables/routes backend gamification restent en place (pas de suppression). Seul l'affichage dans le profil est retire.

### 8.2 Referral Program (supprime du profil)

La card referral est retiree du profile screen. La fonctionnalite reste en backend pour activation future.

### 8.3 Naqiy+ card encombrante

La grosse card "Naqiy+" avec logo est remplacee par un simple MenuItem dore en 1ere position de la section Preferences.

---

## 9. Animations

Toutes les animations conservent le pattern existant :
- `FadeIn.duration(400)` pour le header
- `FadeInDown.delay(50).duration(500)` pour le hero
- `FadeInUp.delay(N).duration(500)` pour les sections (N incremente de 50ms)
- Spring `springNaqiy` pour les interactions (cadenas, toggle)

---

## 10. Accessibilite

- Tous les MenuItems gardent `accessibilityRole="button"` + `accessibilityLabel`
- Elements verrouilles : `accessibilityState={{ disabled: true }}` + `accessibilityHint="Fonctionnalite Naqiy+"`
- Le bottom sheet upsell est focusable au lecteur d'ecran
- Le badge trial ("Xj restants") utilise `accessibilityRole="text"`
- L'avatar Naqiy+ a `accessibilityLabel={t.common.profilePhoto}` + `accessibilityHint={t.profile.editProfile}`

---

## 11. Traductions requises

Nouvelles cles i18n (fr/en/ar) :

| Cle | FR | EN | AR |
|-----|----|----|-----|
| `padlock.featureTitle` | Fonctionnalite Naqiy+ | Naqiy+ Feature | ميزة نقيّ+ |
| `padlock.madhabDescription` | Choisissez votre ecole juridique pour des verdicts personnalises | Choose your school of jurisprudence for personalized verdicts | اختر مذهبك الفقهي للحصول على أحكام مخصصة |
| `padlock.healthDescription` | Configurez vos allergenes et votre profil de sante | Configure your allergens and health profile | قم بتكوين مسببات الحساسية وملفك الصحي |
| `padlock.exclusionsDescription` | Definissez vos exclusions alimentaires personnalisees | Define your custom dietary exclusions | حدد استثناءاتك الغذائية المخصصة |
| `padlock.boycottDescription` | Gerez votre liste de boycott ethique | Manage your ethical boycott list | إدارة قائمة المقاطعة الأخلاقية |
| `padlock.unlock` | Decouvrir Naqiy+ | Discover Naqiy+ | اكتشف نقيّ+ |
| `premium.expired` | Votre abonnement Naqiy+ a expire | Your Naqiy+ subscription has expired | انتهى اشتراكك في نقيّ+ |
| `premium.renewToAccess` | Reabonnez-vous pour acceder a votre compte | Resubscribe to access your account | أعد الاشتراك للوصول إلى حسابك |
| `premium.renew` | Renouveler Naqiy+ | Renew Naqiy+ | تجديد نقيّ+ |

---

## 12. Fichiers impactes

| Fichier | Action |
|---------|--------|
| `app/(tabs)/profile.tsx` | Refonte complete (2 etats, suppression gamification/referral) |
| `app/settings/madhab.tsx` | Padlock sur 4 ecoles, guard trial |
| `app/settings/certifications.tsx` | Feature flag gate + padlock UX |
| `app/settings/premium.tsx` | Merge trial data au moment de l'achat |
| `app/settings/health-profile.tsx` | Padlock UX pour free |
| `app/settings/exclusions.tsx` | Padlock UX pour free |
| `app/settings/boycott-list.tsx` | Padlock UX pour free |
| `src/store/index.ts` | Guard trial sur setMadhab, ajuster stores |
| `src/constants/config.ts` | Ajouter `certificationsPreferencesEnabled` flag |
| `src/hooks/usePremium.ts` | Eventuellement exposer `isExpired` helper |
| `src/i18n/translations/fr.ts` | Nouvelles cles padlock/premium |
| `src/i18n/translations/en.ts` | Nouvelles cles padlock/premium |
| `src/i18n/translations/ar.ts` | Nouvelles cles padlock/premium |
| `src/components/ui/PadlockBottomSheet.tsx` | **Nouveau** — composant reutilisable |
| `backend/src/db/schema/users.ts` | Ajouter `certificationPreferences` colonne |
| `backend/drizzle/0032_user_certification_preferences.sql` | **Nouvelle** migration |
| `backend/src/db/seeds/seed-feature-flags.ts` | Ajouter `certificationsPreferencesEnabled` |
| `backend/src/trpc/routers/auth.ts` | Guard login/refresh sur subscriptionTier + safeUserColumns |
| `backend/src/trpc/routers/profile.ts` | Accepter certificationPreferences dans updateProfile |

---

## 13. Hors scope

- Gamification reste en backend (pas de suppression tables/routes)
- Referral reste en backend (pas de suppression)
- Redesign des sous-ecrans (madhab, sante, etc.) — seul le padlock UX est ajoute
- Web app / landing page
- Notifications push implementation
- Offline cache implementation
