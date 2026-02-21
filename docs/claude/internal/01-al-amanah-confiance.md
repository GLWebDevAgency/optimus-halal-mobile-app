# 01 — Al-Amanah : Architecture de la Confiance

> "Inna Allaha ya'murukum an tu'addu al-amanati ila ahliha"
> — Allah vous ordonne de restituer les depots a leurs ayants droit. (Sourate An-Nisa, 4:58)

---

## Le Code comme Amanah

Chaque endpoint tRPC, chaque table PostgreSQL, chaque store Zustand est un depot de confiance.
Quand un utilisateur scanne un produit, il nous confie une question sacree : "Puis-je manger ceci en paix ?"
Quand il ouvre la carte, il nous confie une autre : "Ou puis-je faire confiance ?"

Cette section est un audit brutal et honnete de l'etat reel du code — pas pour impressionner, mais pour savoir exactement ou nous en sommes dans notre responsabilite.

---

## 1. Architecture Globale — Etat des Lieux

### Stack Technique

```
Mobile                          Backend                        Infra
─────────────────────          ──────────────────────         ──────────────
Expo SDK 54                    Hono (HTTP framework)          Railway
React Native 0.81.5           tRPC v11.10 (API typee)        PostgreSQL + PostGIS
Expo Router (navigation)       Drizzle ORM (queries)          Redis (cache)
TanStack Query v5 (cache)     Zod (validation)               R2/S3 (images)
Zustand + MMKV (local)        Argon2 (passwords)             Sentry (errors)
Mapbox GL Native (carte)      JWT (auth)                     PostHog (analytics)
React Native Reanimated       PostGIS (geospatial)
NativeWind (styling)          ngeohash (cache spatial)
```

### Pourquoi ces choix sont des choix d'amanah

| Choix | Alternative rejetee | Raison |
|-------|-------------------|--------|
| **tRPC** (types partages) | REST + OpenAPI | Un type errone = un verdict errone. Le type-safety end-to-end est une obligation morale quand on repond "halal" ou "haram". |
| **PostgreSQL + PostGIS** | MongoDB | Les donnees relationnelles (produit → additifs → rulings → madhabs) necessitent l'integrite referentielle. Un additif orphelin = un verdict corrompu. |
| **Argon2** (hash passwords) | bcrypt | Resistance superieure aux attaques par GPU. Les comptes utilisateurs contiennent des donnees de conscience religieuse — protection maximale. |
| **Drizzle** (ORM type) | Prisma | Queries SQL visibles et auditables. On peut lire exactement ce qu'on demande a la DB. Pas de magie noire sur des donnees de confiance. |
| **MMKV** (storage local) | AsyncStorage | Performance 10x pour les preferences utilisateur. Le madhab, le niveau de rigueur — ces donnees sont lues a chaque scan. La latence = de l'anxiete. |

---

## 2. Backend — Les 14 Routers tRPC

Le backend est structure en 14 domaines metier. Chaque router est un domaine de responsabilite :

| Router | Procedures | Role | Etat |
|--------|-----------|------|------|
| `auth` | login, register, me, logout, refreshToken, requestPasswordReset, resetPassword | Identite et acces | Solide. Mutex sur token refresh. |
| `scan` | scanBarcode, history, stats | Coeur du produit — verdicts halal | Solide. Pipeline OFF → analyse → DB → stats. |
| `product` | getById, search, getByBarcode | Catalogue produits | Fonctionnel. |
| `additive` | search, getById, getForProduct | Intelligence additifs + madhab | Fonctionnel. escapeLike + N+1 corrige. |
| `store` | nearby, search, getById, subscribe, unsubscribe, getSubscriptions | Carte et commerces | Optimise (geohash, speculative prefetch, quantization). |
| `favorites` | list, add, remove, folders, createFolder, deleteFolder | Favoris produits | Fonctionnel. |
| `alert` | list, getById, markRead | Alertes et rappels | Fonctionnel. |
| `article` | list, getById | Contenu editorial | Fonctionnel. |
| `notification` | list, getUnreadCount, markRead, settings | Notifications push | Fonctionnel. |
| `stats` | userDashboard | Tableau de bord utilisateur | Fonctionnel. |
| `review` | create, list, helpful, report | Avis sur les commerces | Fonctionnel. |
| `boycott` | list, search | Donnees BDS / ethique | Fonctionnel. |
| `loyalty` | getBalance, getTransactions, freezeStreak | Gamification et points | Nouveau (mega audit). |
| `premium` | verifyPurchase, getStatus | Abonnement premium | Securise (401 sans receipt valide). |

### Les 35 Tables PostgreSQL

```
Core:           users, products, categories, scans, refresh_tokens
Knowledge:      additives, additive_madhab_rulings, certifiers
Commerce:       stores, store_hours, store_subscriptions, reviews, review_helpful_votes
Social:         favorites, favorite_folders, alerts, alert_categories, alert_read_status
Content:        articles, notifications, notification_settings, push_tokens
Gamification:   achievements, user_achievements, rewards, user_rewards, point_transactions
Business:       subscription_events, boycott_targets
Reports:        reports, analysis_requests
Geo:            addresses (PostGIS: geography_columns, geometry_columns, spatial_ref_sys)
```

---

## 3. Mobile — Les 40+ Ecrans

### Navigation (Expo Router)

```
/(auth)/
  ├── login.tsx          — Connexion email/password
  ├── signup.tsx         — Inscription (TODO: migrer vers useRegister hook)
  ├── forgot-password.tsx
  └── reset-password.tsx

/(tabs)/
  ├── index.tsx          — Home (hero, stats, alertes, articles)
  ├── scanner.tsx        — Camera scan barcode
  ├── map.tsx            — Carte Mapbox des commerces halal
  ├── favorites.tsx      — Favoris par dossiers
  └── profile.tsx        — Profil utilisateur

/(tabs)/scan-result/
  └── [id].tsx           — Resultat de scan detaille

/(tabs)/settings/
  ├── index.tsx          — Liste des parametres
  ├── account.tsx        — Gestion du compte
  ├── notifications.tsx  — Preferences notifications
  ├── language.tsx       — FR/EN/AR
  ├── appearance.tsx     — Theme clair/sombre
  ├── privacy.tsx        — Confidentialite
  ├── about.tsx          — A propos
  └── halal-preferences.tsx — Madhab, rigueur, sante
```

### Hooks Critiques — Le Systeme Nerveux

| Hook | Fichier | Role | Fiabilite |
|------|---------|------|-----------|
| `useAuth` (useMe, useLogin, useRegister, useLogout) | `src/hooks/useAuth.ts` | Authentification via tRPC React Query | Solide |
| `useScan` | `src/hooks/useScan.ts` | Pipeline de scan barcode | Solide |
| `useFavorites` | `src/hooks/useFavorites.ts` | CRUD favoris | Fonctionnel |
| `useMapStores` | `src/hooks/useMapStores.ts` | Stores geolocalises (zero debounce) | Optimise |
| `useHaptics` | `src/hooks/useHaptics.ts` | Retour haptique differencie par verdict | Fonctionnel |
| `useTheme` | `src/hooks/useTheme.ts` | Theme clair/sombre/gold | Fonctionnel |
| `useTranslation` | `src/hooks/useTranslation.ts` | i18n type (FR/EN/AR) | Fonctionnel |

---

## 4. Dette Technique — L'Honnetete de l'Amanah

Etre fidele a l'amanah, c'est aussi dire ce qui ne va pas. Voici la dette technique reelle :

### Resolue (dans les 10 derniers sprints)

| Probleme | Impact | Resolution |
|----------|--------|------------|
| `apiStores.ts` (1069 lignes, 10 stores Zustand) | Double couche API, race conditions | Supprime. Migre vers tRPC React Query. |
| GeoJSON Feature ID = UUID string | Mapbox clustering silencieusement casse | Remplace par index numerique. |
| Double debounce map (400ms + 150ms = 550ms) | Delai perceptible entre pan et markers | Elimine. Debounce-on-idle + speculative prefetch. |
| Cache poisoning (arrays vides caches 5min) | Zones sans commerce = 5min de silence | `skipEmpty: true` dans withCache. |
| Token refresh race condition | Requetes paralleles = deconnexion | Mutex pattern avec lock. |
| 429 retry storm sans backoff | Rate limit → boucle infinie | Abort controller + skip sur auth procedures. |
| `verifyPurchase` non securise | Premium gratuit sans receipt | 401 sans receipt valide. |
| Police Inter jamais chargee | Typographie systeme par defaut | expo-font + useFonts dans _layout.tsx. |
| Couleurs hardcodees (#13ec6a x49) | Theme ignore, dark mode casse | 49 occurrences migrees vers theme tokens. |

### Non resolue (dette active)

| Probleme | Impact | Effort estime | Priorite |
|----------|--------|--------------|----------|
| 292 `fontSize` inline dans 25 ecrans | Echelle typographique ignoree | 6h (incremental) | Medium |
| `signup.tsx` utilise ancien `authService.register()` | Inconsistance avec le reste | 30min | High |
| Mixed `StatusBar` (RN vs expo-status-bar) dans scanner | Warning console | 15min | Low |
| `NotificationBell` duplique 3x | Code duplique | 1h | Medium |
| Header heights varient de 15-20px entre ecrans | Inconsistance visuelle | 2h | Medium |
| `shadowColor` colore ignore sur Android | Cosmetic (elevation only) | Non fixable (limitation Android) | Won't fix |
| Map.tsx fait 1133 lignes | Fichier trop gros | 3h (extract MapMarkerLayer + MapControls) | Medium |
| `StoreCard` React.memo battu par inline arrow fn | Re-renders inutiles | 1h | Medium |
| Filtres "Ouvert maintenant" / "Note 4.0+" non implementes | UI montre les filtres mais non fonctionnels | 3h | High |
| Production Railway = 0 stores (deploy stale) | Utilisateurs prod ne voient rien | Redeploy depuis dashboard | CRITICAL |

---

## 5. Securite — La Protection des Depots

### Ce qui est en place

- **Argon2** pour le hash des mots de passe (resistance GPU)
- **JWT** acces (15min) + refresh (7j) avec rotation
- **Mutex** sur le token refresh (pas de race condition)
- **Rate limiting** : 100 req/min general, 5 req/min auth, 10 req/min scan (10x en dev)
- **Header `Retry-After`** sur les 429
- **CORS** restreint aux domaines autorises
- **User PII** non expose dans les reponses publiques
- **Index sur `refresh_tokens.token_hash`** pour les revocations rapides
- **`escapeLike`** sur toutes les recherches textuelles (injection SQL via LIKE)

### Ce qui manque

| Manque | Risque | Priorite |
|--------|--------|----------|
| Pas de CSP headers | XSS si jamais un client web | Low (mobile only) |
| Pas de `pnpm audit` en CI automatique | Vulnerabilites npm non detectees | Medium (ajoute au CI workflow) |
| Pas de chiffrement at-rest sur les donnees sensibles | Compliance RGPD partielle | Medium |
| Pas de 2FA | Comptes admin non proteges | High (pour le dashboard B2B) |
| Pas d'audit log | Pas de tracabilite des actions | Medium (pour la conformite) |

---

## 6. L'Amanah envers les Donnees

### Donnees de reference seedees (via `entrypoint.js` a chaque deploy)

| Donnee | Quantite | Source | Fiabilite |
|--------|----------|--------|-----------|
| Certifiers | 18 | Recherche manuelle (AVS, Achahada, ARGML, etc.) | Haute |
| Stores | 186 | Scraping AVS + Achahada (donnees reelles) | Haute |
| Additives | 140+ | Base de donnees E-numbers + recherche islamique | Moyenne (a enrichir) |
| Madhab rulings | ~400 | Croisement additifs × 4 ecoles | Moyenne (a verifier par des savants) |
| Boycott targets | 19 | Donnees BDS publiques | Haute |
| Alerts | 11+ | Veille Al-Kanz + RappelConso | Haute |
| Articles | 8+ | Redaction interne | Haute |

### L'avertissement crucial sur les rulings

Les rulings par madhab (`additive_madhab_rulings`) sont le point le plus sensible de toute la plateforme. Chaque ruling associe un additif a un statut (halal/doubtful/haram) selon une ecole. **Une erreur ici a des consequences religieuses directes.**

Garde-fous en place :
1. Le `confidenceScore` est affiche a l'utilisateur — il sait quand on n'est pas surs
2. Les sources sont citees quand elles existent
3. L'UI montre toujours les 4 avis quand ils divergent (pas juste celui du madhab de l'utilisateur)
4. Un systeme de signalement permet aux utilisateurs de contester un ruling

Garde-fous manquants :
1. **Pas de validation par des savants reconnus** — les rulings sont issus de recherche, pas d'ijaza
2. **Pas de versioning des rulings** — quand un statut change, l'historique n'est pas trace
3. **Pas de conseil consultatif religieux** — il faudrait un comite de 3-5 savants qui valident les rulings initiaux et les mises a jour

> C'est ici que l'amanah est la plus lourde. Nous disons aux gens quoi manger. Si nous nous trompons, nous portons une part de responsabilite. L'humilite face a cette charge doit guider chaque decision sur le moteur de scan.
