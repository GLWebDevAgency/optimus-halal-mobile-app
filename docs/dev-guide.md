# Optimus Halal — Guide Developpeur

## Architecture

```
optimus-halal-mobile-app/
├── backend/                  # Mobile BFF (Hono + tRPC + Drizzle + PostgreSQL + Redis)
├── optimus-halal/            # Mobile App (Expo SDK 54 + React Native 0.81 + Expo Router)
├── .github/workflows/        # CI/CD (GitHub Actions)
│   ├── mobile-ci.yml         # Mobile: typecheck, lint, preview build, OTA, production build
│   └── backend-ci.yml        # Backend: typecheck, build, deploy Railway
└── docs/                     # Documentation
```

**Type sharing**: Le mobile importe les types du backend via `@backend/*` (tsconfig path alias vers `../backend/src/*`). Cela garantit un typage end-to-end entre le client tRPC et le serveur.

---

## Prerequis

| Outil | Version | Installation |
|-------|---------|-------------|
| Node.js | >= 22 | `brew install node` |
| pnpm | >= 9 | `npm install -g pnpm` (backend) |
| npm | >= 10 | Inclus avec Node.js (mobile) |
| PostgreSQL | >= 16 | `brew install postgresql@16` |
| Redis | >= 7 | `brew install redis` |
| EAS CLI | latest | `npm install -g eas-cli` |
| Expo Go | latest | App Store / Play Store (dev only) |

---

## Setup Initial

### 1. Backend

```bash
cd backend
cp .env.example .env
# Editer .env avec vos credentials locaux (DB, Redis, JWT secrets)

# Creer la base de donnees
psql postgres -c "CREATE DATABASE optimus_halal;"

# Installer les dependances
pnpm install

# Pousser le schema Drizzle
npx drizzle-kit push

# Demarrer le serveur
pnpm dev
# → http://localhost:3000
# → Health check: http://localhost:3000/health
```

### 2. Mobile App

```bash
cd optimus-halal

# Installer les dependances
npm install

# Dev avec Expo (Metro)
npx expo start --dev-client

# Ou build de dev local (iOS Simulator)
eas build --platform ios --profile development --local
npx expo start --dev-client
```

---

## Commandes

### Backend (`backend/`)

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Demarre le serveur en mode dev (hot reload, charge `.env`) |
| `pnpm build` | Compile TypeScript vers `dist/` |
| `pnpm start` | Lance le serveur compile (production) |
| `pnpm typecheck` | Verification TypeScript sans compilation |
| `pnpm db:generate` | Genere les migrations Drizzle |
| `pnpm db:push` | Pousse le schema vers la DB (dev) |
| `pnpm db:studio` | Ouvre Drizzle Studio (GUI DB) |

### Mobile App (`optimus-halal/`)

| Commande | Description |
|----------|-------------|
| `npx expo start` | Demarre Metro bundler (Expo Go) |
| `npx expo start --dev-client` | Demarre avec dev client (MMKV, camera, etc.) |
| `npx tsc --noEmit` | Typecheck |
| `npx eslint . --ext .ts,.tsx` | Lint |
| `eas build --profile development` | Build dev client |
| `eas build --profile preview` | Build APK preview (recette) |
| `eas build --profile production` | Build production |
| `eas update --auto` | Push OTA update |

---

## Environnements

### Dev (local)

| Service | URL | Details |
|---------|-----|---------|
| Backend | `http://localhost:3000` | `pnpm dev` charge `.env` automatiquement |
| PostgreSQL | `localhost:5432` | Base `optimus_halal` |
| Redis | `localhost:6379` | Cache, rate limiting |
| Metro | `http://localhost:8081` | Expo dev server |

**Config mobile**: L'API URL est dans `optimus-halal/src/services/api/config.ts`.

### Preview (recette)

| Service | URL                                            | Details                                |
|---------|------------------------------------------------|----------------------------------------|
| Backend | `https://mobile-bff-preview.up.railway.app`    | Instance preview Railway (env séparée) |
| Mobile  | APK Android installable                        | Build EAS `preview` profile            |

L'APK preview se connecte au backend Railway. Installer via le lien EAS Build.

### Production

| Service | URL | Details |
|---------|-----|---------|
| Backend | `https://mobile-bff-production-aefc.up.railway.app` | Railway, auto-deploy sur push main |
| Mobile | Play Store / App Store | Build EAS `production` profile |

---

## CI/CD

### Flow de deploiement

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   PR → main     │     │   Push to main    │     │  Manual Trigger  │
│                 │     │                  │     │  (GitHub Actions) │
│  Typecheck      │     │  Typecheck       │     │                  │
│  Lint           │     │  Lint            │     │  Typecheck       │
│                 │     │  Preview APK ◄───┤─────│  Lint            │
│                 │     │  OTA Update      │     │  Production Build│
└─────────────────┘     └──────────────────┘     └──────────────────┘
                              │                         │
                              ▼                         ▼
                        Recette (test)          Ship to stores
```

### Mobile CI (`mobile-ci.yml`)

| Trigger | Jobs executes |
|---------|---------------|
| **PR vers main** | Typecheck + Lint |
| **Push sur main** | Typecheck + Lint → Preview APK → OTA Update |
| **Manual: preview** | Typecheck + Lint → Preview APK |
| **Manual: production** | Typecheck + Lint → Production Build |

**Lancer un build production** (apres recette) :
1. Aller sur GitHub → Actions → "Mobile App CI/CD"
2. Cliquer "Run workflow"
3. Selectionner `production`
4. Le build EAS demarre automatiquement

### Backend CI (`backend-ci.yml`)

| Trigger | Jobs executes |
|---------|---------------|
| **PR vers main** | Typecheck → Build |
| **Push sur main** | Typecheck → Build → Deploy Railway → Health check |

Le deploy backend est **automatique** sur push to main. Railway utilise le Dockerfile multi-stage.

### Secrets GitHub requis

| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | Token EAS pour builds et OTA updates |
| `RAILWAY_TOKEN` | Token API Railway pour deploy backend |
| `RAILWAY_SERVICE_ID` | ID du service Railway |

---

## Architecture Mobile

### Structure des fichiers

```
optimus-halal/src/
├── app/                    # Expo Router pages
│   ├── _layout.tsx         # Root layout (providers, ErrorBoundary, AppInitializer)
│   ├── index.tsx           # Entry point (redirect logic)
│   ├── (tabs)/             # Main tab navigator
│   ├── (auth)/             # Auth screens
│   ├── (onboarding)/       # Onboarding flow
│   ├── (marketplace)/      # Marketplace screens
│   ├── settings/           # Settings screens
│   └── scan-result.tsx     # Scan result modal
├── components/             # Composants reutilisables
│   ├── ui/                 # Design system (Button, Card, etc.)
│   └── ErrorBoundary.tsx   # Error boundary global
├── hooks/                  # Custom hooks (useAuth, useScan, useFavorites)
├── lib/
│   ├── trpc.ts             # tRPC React Query client
│   ├── storage.ts          # MMKV Zustand adapter (avec fallback in-memory)
│   └── logger.ts           # Logger in-memory pour debug overlay
├── services/
│   └── api/
│       ├── client.ts       # tRPC vanilla client + token management
│       ├── config.ts       # API configuration
│       └── types.ts        # Types API inferes
├── store/
│   ├── index.ts            # Stores locaux (useLocalAuthStore, useThemeStore, etc.)
│   └── apiStores.ts        # Stores API (useAuthStore, useScanStore, etc.)
├── i18n/                   # Internationalisation (fr, en, ar)
└── constants/              # Configuration, feature flags
```

### Stores

**2 types de stores Zustand** :

1. **Stores locaux** (`store/index.ts`) — persistes via MMKV
   - `useLocalAuthStore` — etat auth local (rehydrate depuis MMKV)
   - `useThemeStore` — theme (light/dark/system)
   - `useOnboardingStore` — onboarding complete?
   - `useLanguageStore` — langue selectionnee
   - `usePreferencesStore` — preferences utilisateur

2. **Stores API** (`store/apiStores.ts`) — connectes au backend tRPC
   - `useAuthStore` — auth canonique (login, register, profile)
   - `useScanStore` — scan barcode, historique
   - `useFavoritesStore` — favoris, dossiers
   - `useCartStore` — panier marketplace
   - `useOrdersStore` — commandes
   - `useNotificationsStore` — notifications push

**Convention** : Utiliser `useAuthStore` (API) comme source de verite pour l'auth, pas `useLocalAuthStore`.

### Boot sequence

```
1. _layout.tsx: RootLayout render
2. AppInitializer: useAuthStore.initialize()
   a. initializeTokens() — lire tokens depuis SecureStore
   b. Si token valide → fetch profile
   c. Sinon → isLoading: false
   d. Safety timeout 8s → force past loading
3. index.tsx: Redirect selon etat
   a. !hasCompletedOnboarding → (onboarding)
   b. !isAuthenticated → (auth)/welcome
   c. Sinon → (tabs)
```

---

## Architecture Backend

### Structure

```
backend/src/
├── index.ts                # Entry point Hono server
├── trpc/
│   ├── router.ts           # AppRouter (11 routers)
│   ├── context.ts          # Request context (auth, db, redis)
│   ├── trpc.ts             # tRPC instance + middleware
│   └── routers/            # Auth, profile, scan, product, favorites, etc.
├── db/
│   ├── index.ts            # Drizzle client
│   └── schema/             # Tables Drizzle (users, products, scans, etc.)
├── services/               # Business logic (auth, email, push, barcode)
├── middleware/              # Auth, rate limit, logger
└── lib/
    ├── redis.ts            # Redis client
    ├── env.ts              # Zod-validated env vars
    └── errors.ts           # Error codes
```

### Endpoints

| Route | Description |
|-------|-------------|
| `GET /health` | Health check (DB + Redis) |
| `POST /trpc/*` | tRPC batch endpoint (toutes les procedures) |

Le backend expose **uniquement** `/health` et `/trpc/*`. Toute la logique passe par tRPC.

---

## Debug

### App bloquee sur le loader

1. **Appui long 3s** sur l'ecran de chargement → ouvre le debug overlay
2. Les logs montrent exactement ou le boot s'est arrete
3. "Continuer quand meme" force le passage au-dela du loading

### Backend ne demarre pas

```bash
# Verifier les env vars
cd backend && npx tsx --env-file=.env -e "import './src/lib/env.js'"

# Verifier la DB
psql postgresql://localhost:5432/optimus_halal -c "SELECT 1"

# Verifier Redis
redis-cli ping
```

### CI echoue

- **Typecheck fails** : Verifier que le backend compile aussi (`cd backend && pnpm typecheck`)
- **EAS Build fails** : Verifier les credentials (`eas credentials`)
- **Cache errors** (GitHub Actions) : Probleme infra GitHub, pas nous — re-run le workflow

---

## Deploiement Manuel

### Backend vers Railway

```bash
cd backend
# Option 1: Via Railway CLI
railway up --detach

# Option 2: Push to main (auto-deploy via CI)
git push origin main
```

### Mobile Preview (recette)

```bash
cd optimus-halal
eas build --platform android --profile preview
# → Lien d'installation genere automatiquement
```

### Mobile Production

```bash
# Via GitHub Actions (recommande)
# → GitHub → Actions → Mobile App CI/CD → Run workflow → production

# Ou manuellement
cd optimus-halal
eas build --platform android --profile production
eas submit --platform android --profile production
```

---

## Variables d'environnement

### Backend (`.env`)

| Variable | Description | Requis |
|----------|-------------|--------|
| `DATABASE_URL` | URL PostgreSQL | Oui |
| `REDIS_URL` | URL Redis | Oui |
| `JWT_SECRET` | Secret JWT (min 32 chars) | Oui |
| `JWT_REFRESH_SECRET` | Secret refresh token | Oui |
| `JWT_ACCESS_EXPIRY` | Duree access token (ex: `15m`) | Oui |
| `JWT_REFRESH_EXPIRY` | Duree refresh token (ex: `7d`) | Oui |
| `PORT` | Port serveur (defaut: 3000) | Non |
| `NODE_ENV` | `development` / `production` | Non |
| `BREVO_API_KEY` | Cle API Brevo (emails) | Non |
| `EXPO_ACCESS_TOKEN` | Token Expo Push | Non |

### Mobile (EAS Build)

Les env vars du mobile sont dans `eas.json` → `build.{profile}.env`:
- `APP_VARIANT`: `development` / `preview` / `production`

---

## Conventions

- **Package managers**: `pnpm` (backend), `npm` (mobile)
- **Langue des messages d'erreur backend**: Francais
- **Stores**: `useLocal*` = local/MMKV, `useAuthStore` etc. = API
- **Types**: `import type { AppRouter } from "@backend/trpc/router"` — jamais de runtime import du backend
- **Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`, etc.)
