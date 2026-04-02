# Naqiy (نقيّ) — Projet Personnel | Fev 2025 → Mars 2026

> **Application mobile de scan alimentaire halal** — conception, architecture et développement fullstack d'un produit complet, de l'idée au déploiement en production.

---

## Pitch

Naqiy est une application mobile qui permet aux consommateurs musulmans de **scanner le code-barres d'un produit alimentaire** et d'obtenir instantanément un **verdict halal/haram** basé sur l'analyse IA des ingrédients, les certifications officielles et les sources jurisprudentielles islamiques. L'app intègre également une carte interactive des commerces halal, un système d'alertes sanitaires, et un programme de fidélité.

**Positionnement** : Yuka, mais pour le halal — avec un niveau d'exigence technique comparable aux apps fintech (Revolut, N26).

---

## Stack Technique

| Couche | Technologies |
|--------|-------------|
| **Mobile** | React Native 0.81 · Expo SDK 54 · Expo Router (file-based routing) · TypeScript |
| **UI/UX** | NativeWind (Tailwind CSS) · Reanimated 4 · Gesture Handler · Bottom Sheet · FlashList v2 |
| **State** | Zustand (18 stores) · React Query v5 · MMKV (storage local ultra-rapide) |
| **Backend** | Hono (runtime Edge-compatible) · tRPC v11 (type-safety end-to-end) · Drizzle ORM |
| **Base de données** | PostgreSQL 17 + PostGIS (requêtes géospatiales) · Redis (cache + rate limiting) |
| **IA** | Google Gemini Vision (analyse d'images d'ingrédients) |
| **Infra** | Railway (preview + production) · Cloudflare (DNS + R2 Storage) · GitHub Actions CI/CD |
| **Monitoring** | Sentry (crash reporting) · PostHog (analytics produit) |
| **Paiement** | RevenueCat (abonnements iOS/Android) |
| **Cartographie** | Mapbox GL (carte interactive + géolocalisation) |

---

## Chiffres Clés

| Métrique | Valeur |
|----------|--------|
| Lignes de code backend | **38 500+** |
| Lignes de code mobile | **48 500+** |
| Écrans (pages) | **56** |
| Composants React Native | **106** |
| Hooks custom | **22** |
| Stores Zustand | **18** |
| Routers tRPC (API) | **23** |
| Procédures API (queries + mutations) | **130+** |
| Tables PostgreSQL | **48** |
| Migrations DB | **33** |
| Modules de seed | **15** |
| Tests d'intégration | **31** |
| Workflows GitHub Actions | **6** |
| Traductions (FR/EN/AR) | **~2 000 clés** par langue |
| Services backend | **25** |
| Produits en base | **817 038** (import OpenFoodFacts) |
| Commits | **378** |

---

## Périmètre Fonctionnel

### 1. Scan & Analyse IA

- **Scanner code-barres** temps réel via caméra (expo-camera)
- **Lookup produit** : recherche dans une base de 817K produits (importés depuis OpenFoodFacts)
- **Analyse IA Gemini Vision** : extraction et classification des ingrédients depuis photo
- **Verdict halal multicritère** : croisement ingrédients × additifs × certifications × école juridique (madhab)
- **Score de confiance** composite pondéré avec sources jurisprudentielles islamiques
- **Détection automatique** d'allergènes, régimes (végan, sans gluten, etc.) et additifs controversés
- **Calcul Nutri-Score** indépendant côté serveur
- **Système de recommandation** d'alternatives halal basé sur la catégorie produit

### 2. Carte Interactive des Commerces

- **Carte Mapbox** avec recherche géospatiale PostGIS (`ST_DWithin`)
- **383 commerces** enrichis avec données Google Places (photos, avis, horaires)
- **Filtres** : distance, type de commerce, certifications
- **Favori magasin** avec synchronisation cloud
- **Rafraîchissement automatique** hebdomadaire via GitHub Actions cron

### 3. Authentification & Sécurité

- **Auth complète** : inscription, connexion, mot de passe oublié (code 6 chiffres), magic link
- **JWT double token** : access token (15min) + refresh token (rotation automatique)
- **Biométrie** (Face ID / Touch ID) via expo-local-authentication
- **Rate limiting granulaire** par endpoint (scan 20/min, auth 100/min, etc.)
- **Sanitisation des inputs** (null bytes, BOM, caractères de contrôle)
- **Pre-commit hook** bloquant les patterns de secrets

### 4. Système d'Abonnement (Naqiy+)

- **Intégration RevenueCat** : gestion des abonnements iOS App Store & Google Play
- **Modèle freemium** : scans illimités gratuits, analyses IA réservées aux abonnés
- **Période d'essai** avec timer et garde d'accès
- **Paywall** avec UX premium (animations, comparatif de plans)
- **Vérification serveur** des receipts (pas de validation côté client)

### 5. Engagement & Rétention

- **Programme de fidélité** : points, achievements, leaderboard, récompenses
- **Système de parrainage** avec tracking et attribution
- **Notifications push** (Expo Notifications) — différenciées guest vs. authentifié
- **Alertes sanitaires** temps réel avec catégorisation et statut de lecture
- **Articles éditoriaux** sur la nutrition halal
- **Mode Ramadan** contextuel

### 6. Internationalisation

- **3 langues** : Français, English, العربية
- **Support RTL complet** (arabe) avec redémarrage automatique pour basculer la direction
- **~2 000 clés typées** par langue (TypeScript-safe, autocomplétion)
- **Mise à l'échelle typographique** automatique pour l'arabe (+12%)

### 7. Marketplace (en développement)

- **Architecture posée** : catalogue, panier, checkout, suivi de commande
- **6 écrans** déjà structurés avec navigation dédiée

---

## Architecture Backend

```
Hono HTTP Server
├── tRPC v11 (23 routers, 130+ procedures)
│   ├── Auth middleware (JWT verification + rate limiting)
│   ├── Subscription guard (Naqiy+ features)
│   └── Type-safety end-to-end (mobile ↔ backend)
│
├── Drizzle ORM → PostgreSQL 17 + PostGIS
│   ├── 48 tables, 33 migrations
│   └── Requêtes géospatiales (ST_DWithin pour nearby stores)
│
├── Services métier (25 services)
│   ├── Gemini Vision (analyse IA des ingrédients)
│   ├── OpenFoodFacts (import bulk 817K produits)
│   ├── Google Places (enrichissement commerces)
│   ├── Cloudflare R2 (stockage images)
│   ├── Nutri-Score calculator
│   ├── Recommendation engine
│   ├── Feature flags engine (pourcentage, override, audit)
│   └── Push notifications (Expo)
│
├── Pipeline de seed (15 modules)
│   └── Entrypoint déploiement : migrate → seed → verify
│
└── Routes internes (CRON_SECRET)
    ├── POST /internal/refresh-stores (hebdomadaire)
    └── POST /internal/cleanup-tokens (quotidien)
```

---

## CI/CD & Infrastructure

- **6 workflows GitHub Actions** :
  - `backend-ci` : lint → typecheck → test → deploy (preview auto, production manuelle)
  - `mobile-ci` : typecheck → lint → OTA update (auto) + EAS build
  - `refresh-stores` : cron hebdomadaire → rafraîchissement des données commerces
  - `daily-cleanup` : cron quotidien → nettoyage des tokens expirés
  - `push-nudges` : notifications push automatisées
  - `web-ci` : pipeline de la vitrine web

- **Railway** : 2 environnements (preview + production), custom domains (`api.naqiy.app`)
- **Cloudflare** : DNS, email routing (SPF + DKIM), R2 storage
- **EAS Build** : builds iOS/Android natifs, OTA updates

---

## Qualités Techniques Mises en Oeuvre

| Domaine | Détail |
|---------|--------|
| **Type-safety** | tRPC end-to-end — le mobile consomme les types du backend sans génération de code |
| **Performance** | FlashList v2, MMKV Nitro, lazy loading, React Query cache 5min/30min |
| **Accessibilité** | `accessibilityLabel` systématique, support RTL natif, police adaptative |
| **Offline-first** | Stores locaux Zustand + MMKV, synchronisation différée, banner offline |
| **Observabilité** | Sentry (errors + user context), PostHog (funnels + feature flags), logger interne |
| **Sécurité** | JWT rotation, rate limiting, input sanitization, pre-commit hooks, CORS strict |
| **DX** | Monorepo structuré, path aliases, ESLint, Prettier, TypeScript strict |
| **Architecture** | Clean separation services/routers, hooks composables, context providers, error boundaries |

---

## Compétences Mobilisées

- **React Native / Expo** — Architecture mobile production-grade (56 écrans, animations Reanimated, navigation complexe)
- **TypeScript** — Typage strict end-to-end, generics avancés, type inference tRPC
- **Node.js / Hono** — API backend haute performance, middleware chain, streaming
- **PostgreSQL / PostGIS** — Modélisation relationnelle (48 tables), requêtes géospatiales, migrations
- **Drizzle ORM** — Query builder type-safe, migrations déclaratives
- **IA / LLM** — Intégration Google Gemini Vision pour analyse d'images
- **CI/CD** — GitHub Actions, Railway, EAS Build, déploiement automatisé
- **Product Design** — Conception UX complète, internationalisation 3 langues, accessibilité

---

*Projet personnel — conception, architecture et développement réalisés en autonomie complète.*
*Code source disponible sur demande.*
