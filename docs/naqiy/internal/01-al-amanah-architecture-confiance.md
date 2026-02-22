# Al-Amanah (الامانة) -- Architecture de la Confiance

> *"Inna Allaha ya'murukum an tu'addul amanat ila ahliha."*
> *"Allah vous ordonne de restituer les depots a leurs ayants droit."*
> -- Sourate An-Nisa (4:58)

---

## Philosophie architecturale

L'Amanah -- le depot sacre, la confiance confiee -- est le concept
islamique qui guide notre architecture technique. Chaque donnee que
l'utilisateur nous confie (ses scans, son madhab, ses allergenes, sa
localisation) est un depot. Notre architecture doit garantir que ce
depot est protege, traite avec integrite, et restitue fidlement.

Une architecture n'est pas neutre. Elle encode des valeurs. Quand nous
choisissons tRPC plutot que REST, ce n'est pas seulement pour le
typage de bout en bout -- c'est pour eliminer la classe entiere de bugs
ou le frontend et le backend se desynchronisent sur la forme d'un
verdict halal. La confiance commence dans les types.

---

## Vue d'ensemble de la stack

```
+------------------------------------------------------------------+
|                    COUCHE MOBILE (Client)                         |
|  Expo SDK 54 | React Native 0.81.5 | Expo Router v4              |
|  React 19.1 | TypeScript strict | NativeWind v4                  |
+------------------------------------------------------------------+
        |  tRPC v11 (HTTP batch link)  |  Token JWT + Refresh
        v
+------------------------------------------------------------------+
|                    COUCHE API (Serveur)                           |
|  Hono v4 | tRPC v11.10 | Drizzle ORM | Zod validation           |
|  Node.js | TypeScript strict                                     |
+------------------------------------------------------------------+
        |                |                |
        v                v                v
+----------------+  +----------+  +------------------+
|  PostgreSQL    |  |  Redis   |  |  Services Ext.   |
|  + PostGIS     |  |  Cache   |  |  OpenFoodFacts   |
|  35+ tables    |  |  Sessions|  |  Mapbox           |
|  Drizzle ORM   |  |  Rate    |  |  Sentry           |
+----------------+  +----------+  |  PostHog          |
                                   |  R2 (images)     |
                                   +------------------+
```

### Pourquoi cette stack

| Choix            | Justification                                          |
|------------------|-------------------------------------------------------|
| **Expo SDK 54**  | Deploiement cross-platform avec un seul codebase.     |
|                  | EAS Build pour Android/iOS. OTA updates.              |
| **React Native** | Performance native, communaute massive, talent dispo. |
| **Expo Router**  | Navigation file-based, deep linking gratuit,          |
|                  | 44 routes structurees en groupes (tabs/auth/settings).|
| **Hono**         | Serveur HTTP ultra-leger (< 14 KB). Compatible edge.  |
|                  | Middleware compose. Adapte a Railway (HTTP only).      |
| **tRPC v11**     | Typage end-to-end sans generation de code. Le type    |
|                  | `AppRouter` exporte depuis le backend est consomme    |
|                  | directement par le client mobile via `@backend/*`.    |
| **Drizzle ORM**  | SQL typesafe sans abstraction. Migrations declaratives.|
|                  | Performance proche du SQL brut. Schema-as-code.       |
| **PostgreSQL**   | PostGIS pour la geolocalisation. JSONB pour les       |
|                  | donnees OFF brutes. Transactions ACID pour la         |
|                  | coherence des scans + XP + streaks.                   |
| **Redis**        | Cache OFF (TTL 24h). Rate limiting. Session store.    |
|                  | Cache boycott (TTL 1h). < 2ms latence.                |
| **Railway**      | PaaS avec PostgreSQL + Redis inclus. 60$/mois total.  |
|                  | Zero DevOps. Auto-deploy depuis GitHub main.          |

---

## Les 17 routers tRPC

L'`AppRouter` est compose dans `backend/src/trpc/router.ts`. Chaque
router encapsule un domaine metier avec ses procedures (queries et
mutations). Voici l'inventaire complet :

### 1. `auth` -- Authentification

- `register` : Inscription avec email/mot de passe. Hash bcrypt.
- `login` : Connexion avec rotation du refresh token.
- `refreshToken` : Renouvellement JWT. Mutex cote client pour eviter
  les race conditions sur token expire.
- `logout` : Revocation du refresh token (suppression en base).
- `requestPasswordReset` : Envoi d'email avec code OTP.
- `resetPassword` : Validation OTP + nouveau mot de passe.
- `me` : Retourne le profil utilisateur (colonnes `safeUserColumns`).

**Securite :** Les refresh tokens sont stockes comme hash SHA-256 dans
la table `refresh_tokens` avec un index unique sur `token_hash`. Le
token brut n'est jamais persiste. Expiration configurable.

### 2. `profile` -- Gestion du profil

- `update` : Modification partielle du profil (displayName, city,
  madhab, halalStrictness, allergens, isPregnant, hasChildren...).
- `updateAvatar` : Mise a jour de l'URL d'avatar (R2 storage).
- `deleteAccount` : Suppression GDPR complete (cascade sur toutes les
  tables liees via `onDelete: "cascade"`).

### 3. `scan` -- Pipeline de scan

Le coeur de Naqiy. 4 procedures :
- `scanBarcode` : Pipeline complet (voir Chapitre 02 -- Al-Ilm).
- `getHistory` : Historique pagine par cursor (cursor-based pagination).
- `getStats` : Statistiques utilisateur (totalScans, streak, level, XP).
- `requestAnalysis` : Demande d'analyse manuelle pour produits inconnus.

### 4. `product` -- Catalogue produits

- `getById` : Detail produit avec OFF extras (nutriscore, nova, eco).
- `search` : Recherche textuelle sur nom/marque avec pagination.

### 5. `favorites` -- Produits favoris

- `toggle` : Ajout/suppression atomique (upsert + conflict handling).
- `list` : Liste paginee avec JOIN sur products.
- `check` : Verification rapide (le produit X est-il favori ?).

### 6. `alert` -- Alertes et rappels produits

- `list` : Alertes actives pour l'utilisateur avec filtres par type.
- `markRead` : Marquage de lecture individuel ou batch.
- `getUnreadCount` : Compteur pour le badge de notification.

### 7. `store` -- Localisateur de commerces

- `search` : Recherche geospatiale avec PostGIS. Rayon en km,
  filtres par type (butcher, restaurant, supermarket, bakery, etc.),
  certificateur, et note minimale. Score de pertinence composite.
- `getById` : Detail d'un commerce avec horaires (`store_hours`).
- `getReviews` : Avis sur le commerce (delegue au report router).

### 8. `notification` -- Notifications push

- `list` : Notifications de l'utilisateur avec pagination.
- `markRead` : Lecture individuelle.
- `registerDevice` : Enregistrement du token Expo push.

### 9. `loyalty` -- Points et recompenses

- `getBalance` : Solde de points + niveau + XP.
- `getHistory` : Historique des transactions de points.
- `getRewards` : Catalogue de recompenses disponibles.
- `claimReward` : Echange de points (transaction atomique avec
  decrementation de stock et verification de solde).
- `getMyRewards` : Recompenses reclamees par l'utilisateur.
- `getAchievements` : Badges avec statut de deblocage.
- `getLeaderboard` : Classement anonymise (hash SHA-256 sur les IDs).
- `getStreakInfo` : Info streak + gels + milestones.
- `buyStreakFreeze` : Achat d'un gel de serie (50 points, max 3).

### 10. `report` -- Signalements et avis

- `createReport` : Signalement (incorrect_halal_status, wrong_ingredients,
  missing_product, store_issue, other).
- `getMyReports` : Historique des signalements.
- `createReview` : Avis avec note (1-5) + commentaire + photos.
  Mise a jour atomique de la moyenne du commerce.
- `getProductReviews` / `getStoreReviews` : Avis publics.
- `markHelpful` : Vote "utile" sur un avis (deduplique).

### 11. `stats` -- Statistiques globales

- `getGlobal` : Metriques publiques (total scans, utilisateurs actifs,
  commerces references, produits analyses).

### 12. `boycott` -- Systeme de boycott

- `checkBrand` : Verification d'une marque contre les cibles actives.
  Recherche fuzzy via `unnest` + `LIKE` bidirectionnel.
- `list` : Liste paginee par cursor, filtrable par niveau
  (official_bds, grassroots, pressure, community). Cache Redis 1h.
- `getById` : Detail d'une cible.

### 13. `certifier` -- Organismes de certification

- `list` : Catalogue des certificateurs halal (AVS, Achahada, ARGML,
  Mosquee de Paris, Mosquee de Lyon) avec metadata.
- `getById` : Detail d'un certificateur.
- `rank` : Classement communautaire des certificateurs.

### 14. `article` -- Articles et contenu editorial

- `list` : Articles avec filtres par categorie et pagination.
- `getById` : Detail article avec contenu HTML.

### 15. `additive` -- Base de donnees des additifs

- `list` : Catalogue des 140+ additifs avec filtres par categorie
  (colorant, preservative, emulsifier...) et statut halal.
- `getByCode` : Detail d'un additif (E120, E441, E471...) avec
  rulings par madhab.
- `search` : Recherche textuelle avec `escapeLike` pour prevenir
  l'injection SQL.
- `getForProduct` : Additifs d'un produit avec fix N+1.

### 16. `upload` -- Gestion des fichiers

- `getPresignedUrl` : URL pre-signee pour upload direct vers R2.

### 17. `subscription` -- Abonnement Naqiy+

- `getStatus` : Statut d'abonnement actuel.
- `verifyPurchase` : Verification du recu d'achat (securise : 401
  sans receipt valide depuis le Mega Audit).
- `cancel` : Annulation d'abonnement.

---

## Schema de base de donnees : 35+ tables

Le schema est defini dans `backend/src/db/schema/` via Drizzle ORM.
Chaque fichier exporte les tables, les types inferes, et les enums
PostgreSQL.

### Tables principales

| Fichier            | Tables                                          |
|--------------------|-------------------------------------------------|
| `users.ts`         | `users`, `refresh_tokens`, `addresses`          |
| `products.ts`      | `products`, `analysis_requests`                 |
| `scans.ts`         | `scans`                                         |
| `favorites.ts`     | `favorites`                                     |
| `stores.ts`        | `stores`, `store_hours`, `store_subscriptions`  |
| `alerts.ts`        | `alerts`                                        |
| `notifications.ts` | `notifications`, `user_devices`                 |
| `loyalty.ts`       | `point_transactions`, `rewards`, `user_rewards`,|
|                    | `achievements`, `user_achievements`             |
| `orders.ts`        | `orders`, `order_items`                         |
| `boycott.ts`       | `boycott_targets`                               |
| `certifiers.ts`    | `certifiers`                                    |
| `articles.ts`      | `articles`                                      |
| `additives.ts`     | `additives`, `additive_madhab_rulings`          |
| `subscriptions.ts` | `subscriptions`                                 |

### Enums PostgreSQL

Les enums sont des citoyens de premiere classe dans notre schema :

- `halal_status` : halal, haram, doubtful, unknown
- `madhab` : hanafi, shafii, maliki, hanbali, general
- `halal_strictness` : relaxed, moderate, strict, very_strict
- `language` : fr, en, ar
- `subscription_tier` : free, premium
- `store_type` : supermarket, butcher, restaurant, bakery, abattoir,
  wholesaler, online, other
- `certifier` : avs, achahada, argml, mosquee_de_paris, mosquee_de_lyon,
  other, none
- `additive_category` : colorant, preservative, antioxidant, emulsifier,
  stabilizer, thickener, flavor_enhancer, sweetener, acid, anti_caking,
  glazing_agent, humectant, raising_agent, sequestrant, other
- `additive_origin` : plant, animal, synthetic, mineral, insect, mixed
- `toxicity_level` : safe, low_concern, moderate_concern, high_concern
- `efsa_status` : approved, under_review, restricted, banned
- `boycott_level` : official_bds, grassroots, pressure, community
- `point_action` : scan, review, report, referral, streak_bonus,
  daily_login, achievement, redemption
- `reward_status` : available, claimed, expired, used

### Indexation

Chaque table sensible au temps de reponse est indexee :

- `users` : unique sur `email`, index sur `city`
- `refresh_tokens` : unique sur `token_hash`, index sur `user_id`
- `stores` : index composite sur `(latitude, longitude)`, index sur
  `city`, `store_type`, `certifier`, unique sur `source_id`
- `point_transactions` : index sur `user_id`, `action`, `created_at`
- `boycott_targets` : index sur `boycott_level`, `is_active`
- `additive_madhab_rulings` : unique composite `(additive_code, madhab)`

---

## Architecture mobile : 40 ecrans, 44 routes

### Structure des routes (Expo Router file-based)

```
app/
  index.tsx                  -- Splash/redirect
  _layout.tsx                -- Root layout (AppInitializer, tRPC Provider)
  scan-result.tsx            -- Resultat de scan (modal)
  report.tsx                 -- Formulaire de signalement
  (auth)/
    _layout.tsx              -- Layout groupe authentification
    index.tsx                -- Redirect auth
    welcome.tsx              -- Ecran bienvenue
    login.tsx                -- Connexion
    signup.tsx               -- Inscription
    forgot-password.tsx      -- Mot de passe oublie
    magic-link.tsx           -- Connexion magic link
    reset-confirmation.tsx   -- Confirmation reset
    set-new-password.tsx     -- Nouveau mot de passe
  auth/
    verify.tsx               -- Verification email
  (onboarding)/
    _layout.tsx              -- Layout onboarding
    index.tsx                -- Slides onboarding
  (tabs)/
    _layout.tsx              -- Layout tabs (PremiumTabBar)
    index.tsx                -- Home/Dashboard
    map.tsx                  -- Carte Mapbox + commerces
    scanner.tsx              -- Camera barcode scanner
    marketplace.tsx          -- Marketplace halal
    profile.tsx              -- Profil utilisateur
    alerts.tsx               -- Alertes (hidden tab)
  (marketplace)/
    _layout.tsx              -- Layout marketplace
    index.tsx                -- Catalogue marketplace
    catalog.tsx              -- Listing produits
    product/[id].tsx         -- Detail produit marketplace
    cart.tsx                 -- Panier
    checkout.tsx             -- Tunnel de paiement
    order-tracking.tsx       -- Suivi de commande
    coming-soon.tsx          -- Coming soon placeholder
  settings/
    _layout.tsx              -- Layout settings
    language.tsx             -- Choix de langue (fr/en/ar)
    appearance.tsx           -- Theme (light/dark)
    health-profile.tsx       -- Profil sante (allergenes, grossesse)
    madhab.tsx               -- Selection madhab
    boycott-list.tsx         -- Liste de boycott
    certifier-ranking.tsx    -- Classement certificateurs
    rewards.tsx              -- Recompenses disponibles
    achievements.tsx         -- Badges et trophees
    leaderboard.tsx          -- Classement communautaire
    scan-history.tsx         -- Historique de scans
    edit-profile.tsx         -- Edition du profil
    certifications.tsx       -- Certifications
    exclusions.tsx           -- Exclusions alimentaires
    favorites.tsx            -- Produits favoris
    notifications.tsx        -- Preferences notifications
    premium.tsx              -- Abonnement Naqiy+
  articles/
    _layout.tsx              -- Layout articles
    index.tsx                -- Liste articles
    [id].tsx                 -- Detail article
```

### Hooks applicatifs

| Hook                | Responsabilite                                    |
|---------------------|--------------------------------------------------|
| `useAuth.ts`        | useMe, useLogin, useRegister, useLogout,         |
|                     | useRequestPasswordReset, useResetPassword        |
| `useScan.ts`        | Logique de scan barcode + navigation resultat    |
| `useFavorites.ts`   | Toggle + liste + check favori                   |
| `useHaptics.ts`     | Feedback haptique differencie par verdict         |
| `useTheme.ts`       | Detection dark mode + tokens contextuels         |
| `useTranslation.ts` | Langue active + objet `t` type-safe              |
| `useLoyalty.ts`     | Balance, streak, achievements                    |
| `useReviews.ts`     | CRUD avis produits/commerces                     |
| `useMapStores.ts`   | Recherche geospatiale + bottom sheet state       |
| `useMapSearch.ts`   | Geocoding + search overlay                       |
| `useUserLocation.ts`| Geolocalisation utilisateur + permissions         |
| `useGeocode.ts`     | Reverse geocoding                                |
| `useImageUpload.ts` | Camera/galerie + upload R2                       |
| `useRamadanMode.ts` | Detection de la periode de Ramadan               |
| `usePremium.ts`     | Verification abonnement Naqiy+                    |
| `useApi.ts`         | Hook legacy (en cours de depreciation)           |

### Stores locaux (Zustand + MMKV)

Apres le Mega Audit, seuls les stores strictement locaux subsistent :

- `useLocalAuthStore` : Token JWT en memoire (SecureStore pour persistance)
- `useLocalCartStore` : Panier marketplace (MMKV)

Tout le reste est gere par tRPC React Query (cache, invalidation,
optimistic updates).

---

## Securite

### Authentification

- JWT access tokens (courte duree) + refresh tokens (longue duree)
- Refresh token stocke comme hash SHA-256 en base
- Rotation de refresh token a chaque renouvellement
- Mutex cote client (`fetchWithTokenRefresh` dans `src/lib/trpc.ts`)
  pour eviter les race conditions quand plusieurs requetes simultanees
  detectent un token expire

### Validation des entrees

Toutes les entrees sont validees par Zod en amont du handler tRPC.
Exemples : barcode regexe `/^[0-9]{4,14}$/`, UUIDs valides, ratings
1-5, URLs conformes, longueurs de texte bornees.

### Rate limiting

Middleware Hono avec Redis backend. Limites par IP et par userId.
Endpoints sensibles (auth, scan) ont des limites specifiques.

### Protection des donnees sensibles

- `safeUserColumns` / `safeUserReturning` : projections qui excluent
  `passwordHash` et `subscriptionExternalId` de toutes les requetes
  publiques.
- Le leaderboard anonymise les IDs utilisateurs via hash SHA-256
  tronque a 16 caracteres.
- Les donnees de scan (pratique religieuse) ne sont jamais exposees
  a d'autres utilisateurs. Le `communityVerifiedCount` est un compteur
  agrege, pas une liste de qui a scanne.

### Observabilite

- **Sentry** : crash reporting backend + mobile. Source maps uploadees
  via EAS. Breadcrumbs sur les procedures tRPC.
- **PostHog** : analytics mobile avec evenements anonymises.
  Pas de tracking de contenus de scan.
- **Logger structure** : Pino en production, logs JSON avec correlation
  IDs.

---

## Dette technique

### Resolue (Mega Audit, fevrier 2026)

- `apiStores.ts` supprime (1069 lignes, 10 Zustand stores inutiles)
- 16 fichiers de couleurs hardcodees migres vers tokens du theme
- Token refresh avec mutex (race condition eliminee)
- `verifyPurchase` securise (401 sans receipt valide)
- `escapeLike` dans `additive.search` (injection SQL prevenye)
- N+1 corrige dans `additive.getForProduct`
- Index `refresh_tokens.token_hash` ajoute
- `pnpm audit` ajoute au CI

### Active (a traiter)

- `signup.tsx` utilise encore `authService.register()` au lieu du
  hook `useRegister()` -- migration pending
- `scanner.tsx` mixe `StatusBar` RN et `expo-status-bar` --
  standardiser sur expo
- `map.tsx` fait 1133 lignes -- extraire `MapMarkerLayer` +
  `MapControls` comme composants `React.memo`
- Division par zero possible dans `relevanceScore` si `radiusKm=0`
  -- utiliser `GREATEST(radiusMeters, 1)`
- Timezone naive dans la requete d'horaires (UTC vs Europe/Paris)
- 292 `fontSize` inline a migrer vers les tokens `textStyles`
- `StoreCard` React.memo defait par arrow function inline dans
  `onPress`

---

## Infrastructure et couts

| Service             | Role                    | Cout mensuel    |
|---------------------|-------------------------|-----------------|
| Railway PostgreSQL  | Base de donnees         | ~15 $/mois      |
| Railway Redis       | Cache + rate limiting   | ~5 $/mois       |
| Railway App Server  | Hono + tRPC             | ~15 $/mois      |
| Cloudflare R2       | Stockage images         | ~2 $/mois       |
| Sentry              | Crash reporting         | Gratuit (quota) |
| PostHog             | Analytics               | Gratuit (quota) |
| Mapbox              | Cartographie            | Gratuit (quota) |
| EAS                 | Build + OTA             | ~20 $/mois      |
| **Total**           |                         | **~60 $/mois**  |

Ce cout est deliberement bas. Il prouve qu'un produit technologique
serieux peut etre construit et opere pour le prix d'un diner pour
deux. C'est un argument d'investisseur : nos marges sont structurelles.

---

## Le contrat d'architecture

L'architecture de Naqiy n'est pas un choix technique neutre. Elle
encode nos valeurs :

- **tRPC = transparence** : le type du verdict halal est le meme
  du serveur au client. Pas de transformation, pas de perte.
- **PostgreSQL enums = rigueur** : `halal_status` ne peut contenir
  que 4 valeurs. Le schema impose la verite.
- **Transactions ACID = integrite** : un scan qui echoue a mi-chemin
  ne corrompra jamais les compteurs XP ou streak.
- **Cache Redis = performance** : la reponse doit arriver en < 3s.
  L'Amanah inclut le respect du temps de l'utilisateur.

L'architecture est notre Amanah technique : le depot que nous
confient les utilisateurs, protege par le code.

---

*Document interne Naqiy -- Version 1.0 -- Fevrier 2026*
*Classification : Strategique -- Diffusion restreinte*
