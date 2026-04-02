# Phase 4 — Vidéos / Reels Embed

> **Prérequis** : Phase 3 (feed polymorphe opérationnel)
> **Branch** : `feat/phase-4-videos`
> **Migration** : `0038_video_embeds.sql`

---

## Objectif

Intégrer du contenu vidéo (food tours halal, reviews boucheries, recettes) dans le feed via oEmbed — sans scraper, sans player custom, dans le respect total des ToS des plateformes.

---

## 1. Backend

### 1.1 Schema `video_embeds` (migration 0038)

```
Table: video_embeds
─────────────────────────────────────
id              uuid PK default random
platform        video_platform enum ('instagram', 'tiktok', 'youtube')
original_url    text NOT NULL UNIQUE     -- URL originale de la vidéo
embed_html      text                     -- HTML oEmbed (pas utilisé mobile, utile web)
thumbnail_url   text                     -- URL thumbnail (cache R2 optionnel)
title           varchar(255)
author_name     varchar(100)
author_url      text
duration_secs   integer                  -- durée en secondes (si dispo)
video_type      varchar(20)              -- 'reel', 'video', 'short', 'post'
tags            text[] DEFAULT '{}'
is_active       boolean DEFAULT true
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()

Indexes:
- idx_video_embeds_platform ON (platform)
- idx_video_embeds_active ON (is_active, created_at DESC)
- unique_video_embeds_url ON (original_url)
```

### 1.2 Service oEmbed

Fichier : `backend/src/services/oembed.service.ts`

```
Endpoints oEmbed :
- Instagram : https://api.instagram.com/oembed?url={url}&omitscript=true
- TikTok    : https://www.tiktok.com/oembed?url={url}
- YouTube   : https://www.youtube.com/oembed?url={url}&format=json

Logique :
1. Admin colle un lien → validation regex par plateforme
2. Fetch oEmbed JSON → extraire title, author_name, author_url, thumbnail_url
3. (Optionnel) Upload thumbnail sur R2 pour cache local
4. Insert video_embed + auto-create feed_item type 'video'

Gestion erreurs :
- 401/404 → vidéo privée ou supprimée → rejeter avec message clair
- Rate limit → retry avec backoff
- Timeout 10s
```

### 1.3 tRPC router `video`

Fichier : `backend/src/trpc/routers/video.ts`

```
video.adminList     — adminProcedure, liste paginée avec filtres platform
video.create        — adminProcedure, input: { url: string, tags?: string[] }
                      → auto-fetch oEmbed → insert video_embed + feed_item
video.update        — adminProcedure (tags, is_active)
video.delete        — adminProcedure (soft delete + désactiver feed_item)
video.refreshEmbed  — adminProcedure (re-fetch oEmbed, utile si thumbnail expirée)
```

### 1.4 Intégration feed

- À la création d'un `video_embed`, auto-créer un `feed_item` type `video` via le feed-populate service
- `badge_label` = nom de la plateforme ("Instagram", "TikTok", "YouTube")
- `badge_color` = couleur plateforme (Instagram gradient, TikTok noir, YouTube rouge)
- `cover_image` = `thumbnail_url`

---

## 2. Mobile App

### 2.1 FeedVideoCard

Fichier : `optimus-halal/src/components/feed/FeedVideoCard.tsx`

Design :
- Thumbnail plein cadre avec overlay play button (triangle blanc semi-transparent, 48px)
- Badge plateforme en haut à droite (logo Instagram/TikTok/YouTube, 20px)
- Durée en bas à droite ("1:30", fond noir semi-transparent, pill shape)
- Titre en bas (2 lignes max), auteur en dessous
- Même dimension que les autres feed cards (carousel: 70% width × 3:4, feed page: full width × 16:9)

Comportement `onPress` :
```ts
import * as WebBrowser from 'expo-web-browser';

const handlePress = async () => {
  await WebBrowser.openBrowserAsync(item.originalUrl, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    toolbarColor: isDark ? '#1A1A1A' : '#FFFFFF',
  });
};
```

**Pas de player custom** — on ouvre le lien dans l'in-app browser. Respecte les ToS, pas de complexité WebView.

### 2.2 i18n

```
feed.video.watch: "Regarder"
feed.video.duration: "{min}:{sec}"
feed.video.platform.instagram: "Instagram"
feed.video.platform.tiktok: "TikTok"
feed.video.platform.youtube: "YouTube"
```

### 2.3 Tiering

| Tier | Thumbnails | Lecture |
|------|------------|--------|
| Free | Visibles dans le feed | Bloqué → paywall "Débloquez les vidéos" |
| Trial | Visibles | 3 lectures/jour |
| Naqiy+ | Visibles | Illimité |

- `PaywallTrigger: "video_play"`
- Compteur quotidien dans MMKV (reset à minuit)

---

## 3. Admin Dashboard

### 3.1 Page `/admin/videos` (ou section dans `/admin/feed`)

- Input "Coller un lien vidéo" → bouton "Récupérer"
- Preview : thumbnail + titre + auteur + durée + plateforme
- Bouton "Publier dans le feed" → crée video_embed + feed_item
- Liste des vidéos avec toggle actif/inactif, tags, stats engagement
- Bouton "Rafraîchir" pour re-fetch oEmbed (thumbnail expirée)

### 3.2 Validation URL

Regex par plateforme :
```
Instagram: ^https?://(www\.)?instagram\.com/(p|reel|tv)/[\w-]+
TikTok:    ^https?://(www\.)?tiktok\.com/@[\w.]+/video/\d+
           ^https?://vm\.tiktok\.com/[\w]+
YouTube:   ^https?://(www\.)?(youtube\.com/watch\?v=|youtu\.be/)[\w-]+
           ^https?://(www\.)?youtube\.com/shorts/[\w-]+
```

---

## 4. Veille Cowork (optionnel, futur)

- Ajouter des comptes dans `content_sources` avec `type: "instagram"` ou `"tiktok"`
- Claude Cowork détecte les nouveaux posts via RSS (si dispo) ou manuellement
- Propose des embeds à valider → admin approve → auto-publish

---

## 5. Tests

- [ ] Unit tests oEmbed service (mock responses des 3 plateformes)
- [ ] Unit tests validation URL regex
- [ ] Integration test `video.create` → vérifie feed_item auto-créé
- [ ] Test tiering : free bloqué, trial limité, premium OK

---

## 6. Fichiers à créer / modifier

### Nouveaux fichiers
```
backend/drizzle/0038_video_embeds.sql
backend/src/db/schema/video-embeds.ts
backend/src/services/oembed.service.ts
backend/src/trpc/routers/video.ts

optimus-halal/src/components/feed/FeedVideoCard.tsx

web/src/app/admin/videos/page.tsx
```

### Fichiers à modifier
```
backend/src/db/schema/index.ts          — export video-embeds
backend/src/trpc/router.ts              — ajouter videoRouter
backend/src/services/feed-populate.service.ts — auto-create feed_item pour vidéos
backend/src/db/entrypoint.ts            — verify video_embeds table

optimus-halal/src/components/feed/FeedCard.tsx — case 'video' → FeedVideoCard
optimus-halal/src/i18n/translations/fr.ts
optimus-halal/src/i18n/translations/en.ts
optimus-halal/src/i18n/translations/ar.ts

web/src/components/admin/sidebar.tsx    — lien Vidéos
```

---

## 7. Ordre d'implémentation

```
1. Schema + migration 0038 + Drizzle schema
2. Service oEmbed (fetch + parse + validation)
3. tRPC router video (CRUD + auto feed_item)
4. Admin : page vidéos (coller lien → preview → publish)
5. Mobile : FeedVideoCard + intégration dans FeedCard dispatcher
6. Tiering + PaywallTrigger
7. Tests
```
