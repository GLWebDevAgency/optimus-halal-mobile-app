# Phase 3 — Feed "À la Une" enrichi

> **Prérequis** : Phases 1-2 (FAIT). Ce feed est le socle des phases 4 et 5.
> **Branch** : `feat/phase-3-feed`
> **Prochaine migration** : `0037_feed_items.sql`

---

## Objectif

Transformer le carousel horizontal "À la Une" en un **flux marketing vivant, style Instagram/TikTok**, qui sert de vitrine publicitaire pour les stores de notre liste et les futurs marketplacers, enrichi d'articles éditoriaux.

C'est un **outil de visibilité commerciale** — pas un agrégateur technique. Le feed doit donner envie d'explorer, découvrir des commerces halal, et préparer le terrain de la marketplace.

> **Les alertes restent dans leur écran dédié** (onglet "Veille éthique"). Le feed ne contient PAS d'alertes — c'est un espace contenu / promotion, pas urgence.

### Vision
- **Stores first** : les commerces halal (boucheries, restaurants, épiceries) sont le contenu principal du feed — photos, offres, mises en avant, "à X km de vous"
- **Articles en support** : contenu éditorial pour enrichir le feed (guides, actus, recettes)
- **Tendances produit** : top scans de la semaine, comme des "trending" Instagram
- **Futur** : vidéos embed (Phase 4), inscriptions commerces (Phase 5) alimentent ce même flux

---

## 1. Backend

### 1.1 Schema `feed_items` (migration 0037)

```
Table: feed_items
─────────────────────────────────────
id              uuid PK default random
type            feed_item_type enum ('article', 'store_spotlight', 'trend', 'video')
reference_id    uuid NOT NULL           -- FK polymorphe (article.id, alert.id, store.id, etc.)
title           varchar(255) NOT NULL
subtitle        text
cover_image     text                    -- URL image de couverture
accent_color    varchar(9)              -- hex (#RRGGBBAA)
badge_label     varchar(50)             -- "Alerte", "Nouveau", "Tendance", etc.
badge_color     varchar(9)
priority        integer DEFAULT 0       -- 0 = normal, >0 = elevated, -1 = deprioritized
is_pinned       boolean DEFAULT false
pin_position    integer                 -- ordre parmi les pinned (1, 2, 3...)
tags            text[] DEFAULT '{}'
geo_scope       varchar(50)             -- 'national', 'ile-de-france', 'lyon', null = all
published_at    timestamptz DEFAULT now()
expires_at      timestamptz             -- null = jamais
engagement      jsonb DEFAULT '{}'      -- { views: 0, clicks: 0, shares: 0 }
is_active       boolean DEFAULT true
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()

Indexes:
- idx_feed_items_type ON (type)
- idx_feed_items_published_at ON (published_at DESC)
- idx_feed_items_pinned ON (is_pinned, pin_position) WHERE is_pinned = true
- idx_feed_items_active ON (is_active, published_at DESC) WHERE is_active = true
- idx_feed_items_tags ON (tags) USING GIN
- idx_feed_items_geo ON (geo_scope)
```

**Note** : Pas de FK hard sur `reference_id` (polymorphe). La contrainte de type est assurée par l'enum `type` + validation applicative.

### 1.2 Drizzle schema

- Fichier : `backend/src/db/schema/feed-items.ts`
- Enum : `feedItemTypeEnum` avec les 5 types
- Export dans `backend/src/db/schema/index.ts`
- Types : `FeedItem`, `NewFeedItem`

### 1.3 Auto-populate service

Fichier : `backend/src/services/feed-populate.service.ts`

Logique de population automatique :
- **Stores existants (seed initial)** : Script one-shot qui crée un `feed_item` type `store_spotlight` pour chaque store actif avec `google_rating >= 4.0` et des photos Google — bootstrap le feed au lancement avec du contenu store immédiat
- **Stores ajoutés/enrichis** : Quand un store est enrichi Google Places (photos, rating) → auto-create feed_item si critères qualité OK (rating >= 4.0, au moins 1 photo)
- **Articles** : Quand un article passe `isPublished = true`, un `feed_item` type `article` est créé
- **Store spotlights admin** : Admin crée manuellement des mises en avant avec offres spéciales, positions pinnées — les futures pubs payantes
- **Tendances** : Cron hebdomadaire top 5 produits scannés → feed_items type `trend`

> **Pas d'alertes dans le feed** — les alertes restent exclusivement dans l'onglet Veille éthique.
> **Stores = contenu roi** — le feed doit toujours avoir du contenu store disponible, même sans intervention admin.

### 1.4 Algorithme de tri (stores-first)

```sql
ORDER BY:
  1. is_pinned DESC, pin_position ASC         -- Pinned (promos payantes) en premier
  2. type = 'store_spotlight' DESC            -- Stores toujours prioritaires
  3. score DESC                               -- Score composite

score = (priority * 10)
      + (engagement.clicks * 0.5)
      + (1 / (hours_since_published + 1)) * 100   -- Décroissance temporelle
      + (geo_match ? 30 : 0)                       -- GROS bonus géo (proximity = conversion)
      + (type = 'store_spotlight' ? 25 : 0)        -- Bonus store natif
```

> **Ratio cible** : ~60% stores, ~25% articles, ~15% tendances. L'algo doit naturellement favoriser les stores via le bonus type + géo. Admin peut forcer via pin.

### 1.5 tRPC router `feed`

Fichier : `backend/src/trpc/routers/feed.ts`

```
feed.list          — publicProcedure, cursor pagination (20/page), filtres: type?, tags?
feed.getById       — publicProcedure
feed.trackClick    — publicProcedure (incrémente engagement.clicks)
feed.adminList     — adminProcedure, tous les items (actifs + inactifs)
feed.create        — adminProcedure (store_spotlight, trend, manual)
feed.update        — adminProcedure
feed.delete        — adminProcedure
feed.pin           — adminProcedure (set is_pinned + pin_position)
feed.unpin         — adminProcedure
feed.reorder       — adminProcedure (bulk update pin_position)
```

### 1.6 Hooks auto-populate dans routers existants

- `article.ts` : après `create`/`update` avec `isPublished = true` → `upsert feed_item` type `article`
- `article.ts` : après `togglePublish(false)` → `soft-delete feed_item` (is_active = false)
- **Ne PAS toucher** au delete article → cascade via `reference_id` match dans feed service

### 1.7 Cron tendances

- Endpoint : `POST /internal/compute-trends`
- Fréquence : Dimanche 2h CET (hebdomadaire)
- Logique : top 5 produits par `scan_count` sur 7j glissants → crée/remplace feed_items type `trend`
- GitHub Actions : nouveau workflow `compute-trends.yml`

### 1.8 Entrypoint

- Ajouter `feed_items` à la vérification dans `backend/src/db/entrypoint.ts`

---

## 2. Mobile App

### 2.1 Hook `useFeed`

Fichier : `optimus-halal/src/hooks/useFeed.ts`

```ts
// Cursor-based infinite query
export function useFeed(options?: { type?: FeedItemType }) {
  return trpc.feed.list.useInfiniteQuery(
    { type: options?.type, limit: 20 },
    { getNextPageParam: (last) => last.nextCursor }
  );
}
```

### 2.2 Refonte section "À la Une" — Home

**État actuel** : `ScrollView` horizontal, `FeaturedCard` (articles only), snap 70% width

**Nouvel état** : Feed vertical scrollable style Instagram Explore — cards immersives, visuellement riches, orientées découverte et conversion.

Cards polymorphes, chacune avec un design distinct mais cohérent :

- **StoreSpotlightCard** (contenu principal, ~60%) : photo plein cadre style Insta, badge certifieur, nom commerce, type (pill), distance "À 1.2 km", offre spéciale si dispo, bouton CTA "Découvrir" — design premium, c'est la pub
- **ArticleCard** (contenu éditorial, ~25%) : cover magazine-style, badge type, titre, excerpt, read time — plus petit format que les stores
- **TrendCard** (engagement, ~15%) : image produit, verdict mini (halal/haram dot), "X scans cette semaine" — stories-style circles ou mini cards

**Layout home** : carousel horizontal (3-5 items, snap) avec les plus récents/promus + bouton "Voir tout" → `/feed`
**Layout /feed** : FlatList vertical infinite scroll, full-width cards, filtres en haut

> **L'expérience doit rappeler Instagram Explore** : scroll fluide, images plein cadre, badges overlay, pas de bordures lourdes. Les stores sont les "posts sponsorisés" natifs du feed.

### 2.3 Écran feed pleine page

Fichier : `optimus-halal/app/feed/index.tsx`

- FlatList vertical avec infinite scroll
- Filtre horizontal en haut : Tout | Articles | Stores | Tendances
- Cards plus grandes (full width, ratio 16:9)
- Pull-to-refresh
- Skeleton loading (3 cards placeholder)

### 2.4 Cards polymorphes

Fichier : `optimus-halal/src/components/feed/`

```
FeedCard.tsx           — dispatcher polymorphe (switch sur item.type)
FeedArticleCard.tsx    — magazine-style, cover + excerpt
FeedStoreCard.tsx      — photo, rating, certif badge, distance
FeedTrendCard.tsx      — produit, verdict, scan count
FeedCardSkeleton.tsx   — placeholder animé
```

### 2.5 Tracking engagement

- `onPress` → `feed.trackClick` mutation (fire-and-forget, pas de await)
- Pas de tracking pour les non-connectés (guest)

### 2.6 i18n

Nouvelles clés dans `fr.ts`, `en.ts`, `ar.ts` :
```
feed.title: "À la Une"
feed.seeAll: "Voir tout"
feed.filters.all: "Tout"
feed.filters.articles: "Articles"
feed.filters.stores: "Stores"
feed.filters.trends: "Tendances"
feed.empty: "Rien de nouveau pour le moment"
feed.trend.scans: "{count} scans cette semaine"
feed.store.distance: "À {distance} km"
feed.store.spotlight: "Coup de cœur"
```

### 2.7 Tiering

| Tier | Feed home | Feed page | Stores nearby |
|------|-----------|-----------|---------------|
| Free | 5 items | Bloqué (paywall) | 2 stores |
| Trial | Complet | Complet | 5 stores |
| Naqiy+ | Complet | Complet + filtres | Illimité |

- Bloquer l'accès `/feed` pour free → `PaywallTrigger: "feed_full"`
- Sur la home, les items au-delà de 5 sont floutés + lock badge

---

## 3. Admin Dashboard

### 3.1 Page `/admin/feed`

- Vue liste avec colonnes : Type (badge), Titre, Publié le, Pinned, Engagement (vues/clics), Actions
- Filtres : type, is_pinned, is_active
- Actions : Pin/Unpin, Edit, Delete, Preview

### 3.2 Section pinned

- Zone drag & drop (ou boutons up/down) pour réordonner les items pinnés
- Maximum 3 items pinnés simultanément
- Preview visuel de l'ordre (mini-cards)

### 3.3 Création manuelle

- Bouton "Nouveau feed item" → Sheet avec :
  - Type (dropdown)
  - Titre, subtitle, cover image (upload R2)
  - Tags, geo_scope
  - Accent color picker
  - Dates publication / expiration
  - Pin toggle + position

### 3.4 Preview mobile

- Panel latéral avec aperçu du feed tel qu'affiché sur mobile (mock device frame)
- Rafraîchit en live quand on réordonne

---

## 4. Tests

- [ ] Unit tests `feed-populate.service.ts` (auto-create from article publish)
- [ ] Unit tests algorithme de tri (score calculation)
- [ ] Integration test `feed.list` avec pagination cursor
- [ ] Integration test `feed.pin` / `feed.reorder`
- [ ] Test tiering : free voit max 5, premium voit tout

---

## 5. Fichiers à créer / modifier

### Nouveaux fichiers
```
backend/drizzle/0037_feed_items.sql
backend/src/db/schema/feed-items.ts
backend/src/services/feed-populate.service.ts
backend/src/trpc/routers/feed.ts
.github/workflows/compute-trends.yml

optimus-halal/src/hooks/useFeed.ts
optimus-halal/src/components/feed/FeedCard.tsx
optimus-halal/src/components/feed/FeedArticleCard.tsx
optimus-halal/src/components/feed/FeedStoreCard.tsx
optimus-halal/src/components/feed/FeedTrendCard.tsx
optimus-halal/src/components/feed/FeedCardSkeleton.tsx
optimus-halal/app/feed/index.tsx

web/src/app/admin/feed/page.tsx
```

### Fichiers à modifier
```
backend/src/db/schema/index.ts          — export feed-items
backend/src/trpc/router.ts              — ajouter feedRouter
backend/src/trpc/routers/article.ts     — hook auto-populate
backend/src/routes/internal.ts          — endpoint compute-trends
backend/src/db/entrypoint.ts            — verify feed_items table

optimus-halal/app/(tabs)/index.tsx      — section À la Une → useFeed
optimus-halal/src/i18n/translations/fr.ts
optimus-halal/src/i18n/translations/en.ts
optimus-halal/src/i18n/translations/ar.ts

web/src/components/admin/sidebar.tsx    — lien Feed
```

---

## 6. Ordre d'implémentation

```
1. Schema + migration 0037 + Drizzle schema
2. Feed tRPC router (CRUD + list paginé)
3. Auto-populate service + hooks dans article.ts / recall.ts
4. Mobile : useFeed hook + cards polymorphes
5. Mobile : refonte section home + écran /feed
6. Admin : page /admin/feed
7. Tiering + PaywallTrigger
8. Tests
9. Cron tendances (peut attendre)
```
