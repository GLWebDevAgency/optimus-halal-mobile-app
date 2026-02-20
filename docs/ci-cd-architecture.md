# Optimus Halal — CI/CD Architecture

> Documentation technique complète des pipelines d'intégration continue et de déploiement continu.
> Dernière mise à jour : 2026-02-19

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture du monorepo](#2-architecture-du-monorepo)
3. [Pipeline Backend (`backend-ci.yml`)](#3-pipeline-backend)
   - 3.1 [Déclencheurs](#31-déclencheurs)
   - 3.2 [Contrôle de concurrence](#32-contrôle-de-concurrence)
   - 3.3 [Job `check` — Lint & Typecheck](#33-job-check--lint--typecheck)
   - 3.4 [Job `test` — Tests d'intégration](#34-job-test--tests-dintégration)
   - 3.5 [Job `build` — Validation du build](#35-job-build--validation-du-build)
   - 3.6 [Job `deploy-preview` — Déploiement Preview](#36-job-deploy-preview--déploiement-preview)
   - 3.7 [Job `deploy-production` — Déploiement Production](#37-job-deploy-production--déploiement-production)
4. [Pipeline Mobile (`mobile-ci.yml`)](#4-pipeline-mobile)
   - 4.1 [Déclencheurs](#41-déclencheurs)
   - 4.2 [Job `check` — Typecheck & Lint](#42-job-check--typecheck--lint)
   - 4.3 [Job `detect-changes` — Détection native](#43-job-detect-changes--détection-native)
   - 4.4 [Job `eas-build-preview` — Build APK Recette](#44-job-eas-build-preview--build-apk-recette)
   - 4.5 [Job `eas-update` — OTA Update](#45-job-eas-update--ota-update)
   - 4.6 [Job `eas-build-production` — Build Production](#46-job-eas-build-production--build-production)
5. [Infrastructure Docker](#5-infrastructure-docker)
   - 5.1 [Backend — Multi-stage build](#51-backend--multi-stage-build)
   - 5.2 [PostGIS — Base de données](#52-postgis--base-de-données)
   - 5.3 [PgBouncer — Connection pooler](#53-pgbouncer--connection-pooler)
6. [EAS Build Profiles (`eas.json`)](#6-eas-build-profiles)
7. [Health Check — Vérification post-déploiement](#7-health-check--vérification-post-déploiement)
8. [Secrets et variables d'environnement](#8-secrets-et-variables-denvironnement)
9. [Diagramme de flux complet](#9-diagramme-de-flux-complet)
10. [Runbook opérationnel](#10-runbook-opérationnel)

---

## 1. Vue d'ensemble

Optimus Halal utilise **2 pipelines GitHub Actions indépendants** dans un monorepo, chacun isolé par filtrage `paths:` pour ne se déclencher que sur les fichiers pertinents.

| Pipeline | Workflow | Cible | Plateforme de déploiement |
|----------|----------|-------|---------------------------|
| Backend CI/CD | `.github/workflows/backend-ci.yml` | Hono + tRPC API | Railway (Docker) |
| Mobile CI/CD | `.github/workflows/mobile-ci.yml` | Expo React Native | EAS Build / EAS Update |

**Philosophie** : *Preview automatique, Production manuelle.*

- Chaque merge dans `main` déploie automatiquement en **preview**
- La **production** ne se déclenche que par action manuelle (`workflow_dispatch`)
- Les builds natifs (APK) ne se lancent que quand les dépendances natives changent

**Stack CI** :
- Runtime : `ubuntu-latest` (toutes les VMs)
- Node.js : `22.14` (LTS)
- Package manager : `pnpm 9` avec `--frozen-lockfile`
- Cache : pnpm store natif via `actions/setup-node` cache

---

## 2. Architecture du monorepo

```
optimus-halal-mobile-app/
├── .github/workflows/
│   ├── backend-ci.yml          ← Pipeline backend
│   └── mobile-ci.yml           ← Pipeline mobile
├── backend/                    ← Hono + tRPC + Drizzle
│   ├── src/
│   ├── drizzle/                ← Migrations SQL
│   ├── asset/                  ← Assets statiques (emails, images)
│   ├── infra/
│   │   ├── postgis/Dockerfile  ← PostGIS 17 pour Railway
│   │   └── pgbouncer/Dockerfile← Connection pooler
│   ├── Dockerfile              ← Image de production
│   └── pnpm-lock.yaml
└── optimus-halal/              ← Expo React Native
    ├── src/
    ├── eas.json                ← Profils EAS Build
    ├── app.config.ts           ← Config Expo
    └── pnpm-lock.yaml
```

Le filtrage `paths:` garantit que :
- Un commit dans `optimus-halal/` ne déclenche **jamais** le pipeline backend
- Un commit dans `backend/` ne déclenche **jamais** le pipeline mobile
- Un commit dans `docs/` ou à la racine ne déclenche **aucun** pipeline

---

## 3. Pipeline Backend

**Fichier** : `.github/workflows/backend-ci.yml`

### 3.1 Déclencheurs

| Événement | Condition | Comportement |
|-----------|-----------|-------------|
| `push` | Branche `main` + fichiers `backend/**` modifiés | Exécute check → test → build → deploy preview |
| `pull_request` | Vers `main` + fichiers `backend/**` modifiés | Exécute check → test → build (pas de deploy) |
| `workflow_dispatch` | Manuel depuis GitHub UI | Exécute check → test → build → deploy (preview ou production au choix) |

Le workflow se déclenche aussi si `.github/workflows/backend-ci.yml` lui-même est modifié, ce qui permet de tester les changements de pipeline via PR.

### 3.2 Contrôle de concurrence

```yaml
concurrency:
  group: backend-${{ github.ref }}
  cancel-in-progress: true
```

**Effet** : Si 3 commits sont pushés rapidement sur la même branche, seul le **dernier** run survit. Les 2 précédents sont annulés immédiatement. Cela économise des minutes CI et évite les déploiements intermédiaires inutiles.

Le groupe est scoped par branche (`github.ref`) : un run sur `feature/x` n'annule pas un run sur `main`.

### 3.3 Job `check` — Lint & Typecheck

**Durée typique** : ~23s
**S'exécute** : Sur chaque push, PR et dispatch

```
actions/checkout@v4
    → pnpm/action-setup@v4 (version 9)
    → actions/setup-node@v4 (node 22.14, cache pnpm)
    → pnpm install --frozen-lockfile
    → pnpm run typecheck          # tsc --noEmit
```

| Étape | Détail |
|-------|--------|
| `--frozen-lockfile` | Refuse l'installation si `pnpm-lock.yaml` diverge de `package.json`. Garantit la reproductibilité exacte de l'environnement local. |
| `typecheck` | Vérifie la compilation TypeScript sans émettre de fichiers. Attrape les erreurs de types avant tout test. |

**Pourquoi pas de lint backend ?** Le typecheck est le seul garde-fou côté backend. Le lint est appliqué uniquement côté mobile (ESLint v9 flat config).

### 3.4 Job `test` — Tests d'intégration

**Durée typique** : ~1m 21s
**S'exécute** : En parallèle avec `check` (pas de `needs:`)

#### Services Docker sidecars

Le job lance **2 conteneurs Docker** comme services adjacents au runner :

| Service | Image | Port | Health check |
|---------|-------|------|-------------|
| PostgreSQL + PostGIS | `postgis/postgis:17-3.5` | `5433:5432` | `pg_isready` toutes les 10s, 5 retries |
| Redis | `redis:7-alpine` | `6379:6379` | `redis-cli ping` toutes les 10s, 5 retries |

L'image PostGIS est **identique** à celle de production (`postgis/postgis:17-3.5`), assurant la parité des tests.

Le port PostgreSQL est mappé sur **5433** (pas 5432) pour éviter tout conflit avec une instance locale.

#### Séquence d'exécution

```
1. pnpm install --frozen-lockfile
2. pnpm run build                    ← Compile TS → JS (dist/)
3. node dist/db/migrate.js           ← Exécute les migrations Drizzle
4. pnpm test                         ← Lance Vitest (22 tests d'intégration)
```

| Étape | Pourquoi |
|-------|----------|
| Build avant test | Les tests tournent sur le JS compilé, comme en production |
| `node dist/db/migrate.js` | Utilise le même chemin de migration qu'en production (pas `drizzle-kit push`). Décision Sprint 9 CRIT-4. |
| `DATABASE_URL` pointé sur `localhost:5433` | Utilise le service sidecar PostgreSQL |

**Choix architectural** : Les migrations passent par `migrate()` (code Drizzle) et non par `drizzle-kit push` (outil CLI). En production, c'est `migrate.js` qui tourne dans le `preDeployCommand` Railway. Le CI teste donc le **même chemin** pour détecter les bugs de migration avant déploiement.

### 3.5 Job `build` — Validation du build

**Durée typique** : ~26s
**Dépendances** : `needs: [check, test]` — bloqué tant que lint et tests ne passent pas.

```
pnpm install --frozen-lockfile
pnpm run build
```

Ce job confirme que le TypeScript compile proprement en production. Il sert de **gate** qualité avant les jobs de déploiement.

### 3.6 Job `deploy-preview` — Déploiement Preview

**Dépendances** : `needs: build`
**Condition** :
```yaml
if: |
  (github.ref == 'refs/heads/main' && github.event_name == 'push') ||
  (github.event_name == 'workflow_dispatch' && github.event.inputs.deploy_target == 'preview')
```

**S'exécute automatiquement** quand du code backend est mergé dans `main`, **ou** manuellement via dispatch.

**Ne s'exécute PAS** sur les pull requests (pas de push sur main).

#### Environment GitHub

```yaml
environment:
  name: preview
```

Cela active les protection rules GitHub et les variables/secrets scopés à l'environnement `preview`.

#### Séquence

```
1. npm install -g @railway/cli         ← Installe le CLI Railway
2. railway up                          ← Push le code vers Railway
     --service $RAILWAY_SERVICE_ID
     --environment preview
     --detach                          ← Ne bloque pas, Railway build en background
3. Health check (5 tentatives)         ← Vérifie que le déploiement est sain
```

#### Health check post-déploiement

```bash
sleep 30                              # Attend la stabilisation Railway
for i in 1 2 3 4 5; do
  curl $PREVIEW_URL/health            # Vérifie HTTP 200
  sleep 15                            # 15s entre les tentatives
done
```

- Timeout total max : 30s + (5 x 15s) = **~2 minutes**
- Si `RAILWAY_PREVIEW_URL` n'est pas configurée, le health check est **skippé** (graceful degradation)
- Utilise `vars.RAILWAY_PREVIEW_URL` (variable, pas secret) pour l'URL

### 3.7 Job `deploy-production` — Déploiement Production

**Dépendances** : `needs: build`
**Condition** :
```yaml
if: github.event_name == 'workflow_dispatch' && github.event.inputs.deploy_target == 'production'
```

**JAMAIS automatique.** Uniquement déclenché par action manuelle depuis GitHub Actions UI.

#### Environment GitHub

```yaml
environment:
  name: production
  url: https://mobile-bff-production-aefc.up.railway.app
```

L'URL est affichée dans l'interface GitHub pour un accès rapide au service déployé.

#### Séquence

Identique à preview, mais avec :
- `RAILWAY_TOKEN` (secret de prod, différent de preview)
- `--environment production`
- Health check sur l'URL prod hardcodée : `https://mobile-bff-production-aefc.up.railway.app/health`

#### Graphe de dépendances complet

```
         ┌── check (Lint & Typecheck, ~23s) ──┐
         │                                      ├── build (~26s) ──┬── deploy-preview (auto)
         └── test (PG + Redis, ~1m21s) ────────┘                   └── deploy-production (manuel)
```

---

## 4. Pipeline Mobile

**Fichier** : `.github/workflows/mobile-ci.yml`

### 4.1 Déclencheurs

| Événement | Condition | Comportement |
|-----------|-----------|-------------|
| `push` | Branche `main` + fichiers `optimus-halal/**` modifiés | check → OTA update + build preview (si natif) |
| `pull_request` | Vers `main` + fichiers `optimus-halal/**` modifiés | check uniquement |
| `workflow_dispatch` | Manuel | check → build preview ou production au choix |

### 4.2 Job `check` — Typecheck & Lint

**S'exécute** : Sur chaque push, PR et dispatch

```
1. pnpm install --frozen-lockfile                    ← Deps mobile
2. pnpm install --frozen-lockfile (working-directory: backend) ← Deps backend
3. pnpm exec tsc --noEmit                           ← Typecheck
4. pnpm exec eslint .                               ← Lint ESLint v9
```

**Pourquoi installer les deps backend ?**

Le mobile utilise un path alias TypeScript `@backend/*` → `../backend/src/*` pour partager les types (ex: `import type { AppRouter } from '@backend/trpc/router'`). Sans les deps backend installées (`drizzle-orm`, `hono`, etc.), `tsc` ne peut pas résoudre les types et échoue.

### 4.3 Job `detect-changes` — Détection native

```yaml
- uses: dorny/paths-filter@v3
  filters:
    native:
      - 'optimus-halal/package.json'
      - 'optimus-halal/app.config.ts'
      - 'optimus-halal/eas.json'
```

Ce job produit un output booléen `native: true/false` qui indique si des fichiers affectant le **binaire natif** ont été modifiés.

| Fichier | Impact sur le binaire |
|---------|----------------------|
| `package.json` | Ajout/suppression de librairie native (ex: `react-native-maps`) |
| `app.config.ts` | Permissions, plugins Expo, version native |
| `eas.json` | Profils de build, variables d'environnement |

**Logique** : Si seul un écran React ou un style CSS change → pas besoin de recompiler l'APK (coûteux en temps et crédits EAS). Un OTA Update suffit.

### 4.4 Job `eas-build-preview` — Build APK Recette

**Dépendances** : `needs: [check, detect-changes]`
**Condition** :
```yaml
if: |
  (workflow_dispatch && build_type == 'preview') ||
  (push to main && native changes detected)
```

```
expo/expo-github-action@v8        ← Configure EAS CLI v16 + auth token
eas build
  --platform android
  --profile preview
  --non-interactive                ← Pas de prompts
  --no-wait                        ← Ne bloque pas le CI (build sur les serveurs Expo)
```

Le build est dispatché vers **EAS Build Cloud** (serveurs Expo). Le CI ne attend pas la fin du build (qui peut prendre 10-20 minutes). Le résultat est consultable dans le dashboard Expo.

### 4.5 Job `eas-update` — OTA Update

**Dépendances** : `needs: check`
**Condition** : push sur main uniquement (automatique)

```
eas update --auto --non-interactive --channel preview
```

| Paramètre | Effet |
|-----------|-------|
| `--auto` | Génère automatiquement le message de mise à jour depuis le commit |
| `--channel preview` | Pousse l'update vers le channel preview (reçu par les APK preview) |

**Fonctionnement OTA** : EAS Update envoie uniquement le **bundle JavaScript** aux appareils ayant déjà l'APK installé. Pas de re-téléchargement de l'app. Les utilisateurs reçoivent la mise à jour au prochain lancement. Seuls les changements natifs nécessitent un nouvel APK.

### 4.6 Job `eas-build-production` — Build Production

**Dépendances** : `needs: check`
**Condition** : `workflow_dispatch` avec `build_type == 'production'` uniquement

```
eas build --platform android --profile production --non-interactive --no-wait
```

- **Android uniquement** pour l'instant (iOS nécessite les certificats Apple configurés via `eas credentials --platform ios`)
- `--profile production` active `autoIncrement: true` (version auto-incrémentée)

#### Graphe de dépendances complet

```
         ┌── check (Typecheck & Lint) ──┬── eas-update (OTA, auto sur push main)
         │                               ├── eas-build-preview (si natif changé OU manuel)
  detect-changes ────────────────────────┘── eas-build-production (manuel uniquement)
```

---

## 5. Infrastructure Docker

### 5.1 Backend — Multi-stage build

**Fichier** : `backend/Dockerfile`

Le Dockerfile utilise un **multi-stage build** pour minimiser la taille de l'image de production.

#### Stage 1 — Builder

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app

# Layer 1 : Dépendances (changent rarement → cache Docker efficace)
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate \
  && pnpm install --frozen-lockfile

# Layer 2 : Code source + assets
COPY tsconfig.json ./
COPY src/ ./src/
COPY asset/ ./asset/
RUN pnpm run build

# Layer 3 : Migrations
COPY drizzle/ ./drizzle/

# Layer 4 : Suppression des devDependencies
RUN pnpm prune --prod
```

**Optimisation layer cache** : Les dépendances (`package.json` + lockfile) sont copiées **avant** le code source. Si seul le code change, Docker réutilise le layer des deps en cache, économisant ~30s d'installation.

#### Stage 2 — Runner

```dockerfile
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Utilisateur non-root (sécurité)
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 appuser

# Copie minimale depuis le builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/asset ./asset
COPY --from=builder /app/package.json ./

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "--max-old-space-size=512", "--optimize-for-size", "dist/index.js"]
```

| Mesure de sécurité | Détail |
|-------------------|--------|
| `appuser` (UID 1001) | Utilisateur non-root — une éventuelle RCE n'a pas les droits root |
| `NODE_ENV=production` | Désactive le mode debug, optimise les performances |
| `--max-old-space-size=512` | Limite la RAM du heap V8 à 512 MB (adapté aux plans Railway starter) |
| `--optimize-for-size` | V8 privilégie l'empreinte mémoire à la vitesse d'exécution brute |

| Taille estimée | Stage |
|----------------|-------|
| ~800 MB | Builder (TS compiler, devDeps, source code) |
| ~150 MB | Runner (JS compilé + deps de prod uniquement) |

#### HEALTHCHECK Docker

```dockerfile
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
```

Railway utilise ce healthcheck pour déterminer quand le conteneur est prêt à recevoir du trafic. Le `start-period=5s` donne au serveur Node.js le temps de démarrer avant de commencer les vérifications.

### 5.2 PostGIS — Base de données

**Fichier** : `backend/infra/postgis/Dockerfile`

```dockerfile
FROM postgis/postgis:17-3.5       # PostgreSQL 17 + PostGIS 3.5

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD pg_isready -U ${POSTGRES_USER:-postgres} || exit 1

EXPOSE 5432
```

- Image officielle maintenue par l'équipe PostGIS
- Configuration **zero-code** : Railway injecte `PGDATA`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` via variables d'environnement
- PostGIS est nécessaire pour les fonctionnalités géographiques (recherche de magasins halal par proximité)

### 5.3 PgBouncer — Connection pooler

**Fichier** : `backend/infra/pgbouncer/Dockerfile`

```dockerfile
FROM edoburu/pgbouncer:v1.24.1-p1  # PgBouncer avec auto-config via env vars

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD pg_isready -h 127.0.0.1 -p 5432 || exit 1

EXPOSE 5432
```

| Paramètre | Valeur par défaut | Rôle |
|-----------|-------------------|------|
| `POOL_MODE` | `transaction` | Chaque transaction emprunte une connexion, puis la rend |
| `DEFAULT_POOL_SIZE` | 25 | Connexions réelles vers PostgreSQL |
| `MAX_CLIENT_CONN` | 1000 | Connexions client simultanées acceptées |

**Pourquoi PgBouncer ?** PostgreSQL a une limite de connexions simultanées (~100 par défaut). Avec un serveur Node.js + des serverless functions potentielles, chaque requête ouvre une connexion. PgBouncer mutualise 1000+ connexions client vers seulement 25 connexions DB réelles en mode `transaction`.

---

## 6. EAS Build Profiles

**Fichier** : `optimus-halal/eas.json`

### Profils de build

| Profil | Distribution | API URL | Auto-increment | Cas d'usage |
|--------|-------------|---------|----------------|-------------|
| `development` | Internal (simulateur) | — | Non | Développement local avec dev client |
| `preview` | Internal (APK réel) | `mobile-bff-preview.up.railway.app` | Non | Recette interne, QA |
| `production` | Play Store | `mobile-bff-production-aefc.up.railway.app` | Oui | Release utilisateurs finaux |

### Variables d'environnement par profil

| Variable | Preview | Production |
|----------|---------|-----------|
| `APP_VARIANT` | `preview` | `production` |
| `EXPO_PUBLIC_API_URL` | URL Railway Preview | URL Railway Prod |
| `EXPO_PUBLIC_SENTRY_DSN` | `$SENTRY_DSN` | `$SENTRY_DSN` |
| `EXPO_PUBLIC_POSTHOG_KEY` | `$POSTHOG_API_KEY` | `$POSTHOG_API_KEY` |

### Configuration de soumission (stores)

| Store | Configuration | Track |
|-------|--------------|-------|
| Android (Play Store) | Service account JSON (`google-services-key.json`) | `internal` (test interne) |
| iOS (App Store) | Apple ID + Team ID (pas encore actif) | — |

### Gestion de version

```json
"cli": {
  "appVersionSource": "remote"
}
```

Les numéros de version sont gérés **côté serveur EAS**, pas dans le code local. `autoIncrement: true` sur le profil production incrémente automatiquement le `buildNumber` / `versionCode` à chaque build.

---

## 7. Health Check — Vérification post-déploiement

### Endpoint `/health` (backend)

L'endpoint vérifie **3 composants** et retourne un status agrégé :

```json
{
  "status": "ok",                    // ou "degraded"
  "service": "optimus-halal-bff",
  "version": "1.0.0",
  "timestamp": "2026-02-19T...",
  "database": "ok",                  // Vérifie 3 tables: users, products, refresh_tokens
  "redis": "ok",                     // Vérifie la connexion Redis via PING
  "uptime": "3600s"
}
```

| Status | Code HTTP | Signification |
|--------|-----------|---------------|
| `ok` | 200 | Tous les composants opérationnels |
| `degraded` | 503 | DB ou Redis inaccessible, mais le serveur répond |

Le health check est utilisé à **3 niveaux** :
1. **Docker HEALTHCHECK** : Railway vérifie toutes les 15s que le conteneur est sain
2. **CI health check** : Le pipeline vérifie après déploiement (5 tentatives, 15s entre chaque)
3. **Monitoring** : Accessible manuellement pour diagnostic

### Graceful Shutdown

Le serveur gère proprement les signaux d'arrêt Railway :

```
SIGTERM reçu → Arrêt HTTP server → Fermeture Redis → Timeout 10s → exit 1
```

Cela évite les erreurs 502 pendant un redéploiement : les requêtes en cours ont 10s pour se terminer avant la fermeture forcée.

---

## 8. Secrets et variables d'environnement

### Secrets GitHub (configurés dans Settings > Secrets)

| Secret | Pipeline | Usage |
|--------|----------|-------|
| `RAILWAY_TOKEN_PREVIEW` | Backend | Authentification Railway CLI (env preview) |
| `RAILWAY_TOKEN` | Backend | Authentification Railway CLI (env production) |
| `RAILWAY_SERVICE_ID` | Backend | Identifiant du service Railway |
| `EXPO_TOKEN` | Mobile | Authentification EAS CLI |

### Variables GitHub (configurés dans Settings > Variables)

| Variable | Pipeline | Usage |
|----------|----------|-------|
| `RAILWAY_PREVIEW_URL` | Backend | URL pour health check preview (optionnel) |

### Variables EAS (configurées dans expo.dev)

| Variable | Profils | Usage |
|----------|---------|-------|
| `SENTRY_DSN` | preview, production | DSN Sentry pour crash reporting |
| `POSTHOG_API_KEY` | preview, production | Clé PostHog pour analytics |

---

## 9. Diagramme de flux complet

```
                          ┌─────────────────────────────────────────────────────────┐
                          │              Développeur push / merge PR                 │
                          └──────────────────────┬──────────────────────────────────┘
                                                 │
                          ┌──────────────────────┴──────────────────────┐
                          ▼                                             ▼
                  backend/** modifié ?                          optimus-halal/** modifié ?
                          │                                             │
               ┌──────────┴──────────┐                    ┌────────────┴────────────┐
               ▼                     ▼                    ▼                         ▼
        ┌────────────┐      ┌─────────────┐       ┌────────────┐          ┌──────────────┐
        │   check    │      │    test     │       │   check    │          │detect-changes│
        │ Typecheck  │      │ PG + Redis  │       │ TS + ESLint│          │  dorny/paths │
        │   ~23s     │      │ 22 tests    │       │  + Backend │          │   filter     │
        │            │      │   ~1m21s    │       │    types   │          │              │
        └─────┬──────┘      └──────┬──────┘       └──────┬─────┘          └──────┬───────┘
              │                    │                      │                       │
              └────────┬───────────┘                      ├──── OTA Update ◄─────┘
                       ▼                                  │    (auto, JS only)
                 ┌──────────┐                             │
                 │  build   │                             ├──── Preview APK
                 │  ~26s    │                             │    (si natif changé OU manuel)
                 └────┬─────┘                             │
                      │                                   └──── Production APK
               ┌──────┴──────┐                                 (manuel uniquement)
               ▼             ▼
        ┌────────────┐ ┌────────────┐
        │  Preview   │ │ Production │
        │  Railway   │ │  Railway   │
        │   (auto)   │ │  (manuel)  │
        └─────┬──────┘ └─────┬──────┘
              ▼              ▼
        Health check   Health check
        (5 retries)    (5 retries)
              ▼              ▼
           ✅/❌          ✅/❌
```

### Matrice des déclenchements

| Événement | Backend check | Backend test | Backend build | Deploy preview | Deploy prod | Mobile check | Detect changes | OTA | Preview APK | Prod APK |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| PR (backend files) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| PR (mobile files) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Push main (backend) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Push main (mobile, JS only) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Push main (mobile, native) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Dispatch backend preview | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Dispatch backend prod | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Dispatch mobile preview | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Dispatch mobile prod | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |

---

## 10. Runbook opérationnel

### Déployer le backend en preview (automatique)

```bash
git checkout main
git merge feature/my-feature
git push origin main
# → Le pipeline se déclenche automatiquement
# → Vérifier dans GitHub Actions > Backend CI/CD
```

### Déployer le backend en production (manuel)

1. Aller sur GitHub → Actions → **Backend CI/CD**
2. Cliquer **Run workflow**
3. Sélectionner `deploy_target: production`
4. Cliquer **Run workflow**
5. Vérifier le health check dans les logs du job

### Envoyer un OTA Update mobile (automatique)

```bash
git checkout main
# Modifier un écran React, un style, etc. (pas de dep native)
git push origin main
# → OTA Update publié automatiquement sur le channel preview
# → Les utilisateurs reçoivent la MAJ au prochain lancement
```

### Builder un nouvel APK preview

```bash
# Option 1 : Automatique (modifier package.json, app.config.ts ou eas.json)
git push origin main

# Option 2 : Manuel
# GitHub → Actions → Mobile App CI/CD → Run workflow → preview
```

### Builder un APK production

1. Aller sur GitHub → Actions → **Mobile App CI/CD**
2. Cliquer **Run workflow**
3. Sélectionner `build_type: production`
4. Cliquer **Run workflow**
5. Suivre le build sur [expo.dev](https://expo.dev)

### Diagnostiquer un déploiement échoué

```bash
# 1. Vérifier le health check manuellement
curl https://mobile-bff-production-aefc.up.railway.app/health | jq

# 2. Vérifier les logs Railway
railway logs --service $SERVICE_ID --environment production

# 3. Si la DB est inaccessible (status: "degraded")
#    → Vérifier PgBouncer et PostGIS dans Railway dashboard

# 4. Si le build Docker échoue
#    → Vérifier que asset/ et drizzle/ existent dans le backend
```

---

## Annexe — Fichiers de référence

| Fichier | Rôle |
|---------|------|
| `.github/workflows/backend-ci.yml` | Pipeline CI/CD backend |
| `.github/workflows/mobile-ci.yml` | Pipeline CI/CD mobile |
| `backend/Dockerfile` | Image Docker de production (multi-stage) |
| `backend/infra/postgis/Dockerfile` | Image PostGIS pour Railway |
| `backend/infra/pgbouncer/Dockerfile` | Image PgBouncer pour Railway |
| `optimus-halal/eas.json` | Profils EAS Build (dev/preview/prod) |
| `backend/src/index.ts` | Endpoint `/health`, graceful shutdown |
| `backend/src/db/migrate.ts` | Script de migration Drizzle |
