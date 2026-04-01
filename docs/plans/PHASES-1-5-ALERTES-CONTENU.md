# Naqiy — Phases 1 a 5 : Alertes & Contenu Editorial

## Vue d'ensemble

| Phase | Nom | Status | Description |
|-------|-----|--------|-------------|
| 1 | RappelConso Pipeline | FAIT | Sync auto rappels gouv, scan-time matching, admin moderation |
| 2 | Alertes Mobile + Home | FAIT | Refonte alerts screen, dual badges home, tiering free/premium |
| 3 | Feed "A la Une" enrichi | A FAIRE | Feed unifie articles + store spotlights + tendances |
| 4 | Videos / Reels embed | A FAIRE | oEmbed Instagram/TikTok, cards video dans le feed |
| 5 | Stores partenaires B2C | A FAIRE | Inscriptions stores, spotlight, fiches detaillees |

---

## PHASE 1 — RappelConso Pipeline (FAIT)

### Backend
- [x] Schema `product_recalls` + migrations 0033, 0036 (lot, dates, contact, compensation)
- [x] `recall-sync.service.ts` — connecteur API RappelConso V2 (data.economie.gouv.fr)
  - Filtre `categorie_produit='alimentation'` (minuscule)
  - Champs corrects : `numero_fiche`, `modeles_ou_references`
  - Smart delta sync (Redis `recall-sync:last-since`)
  - Stocke TOUS les champs : lot, dates vente, temperature, compensation, nature juridique, contact
- [x] Filtrage intelligent alertes : seuls les rappels recents (< 7j) + high-risk (Listeria, Salmonelle, E.coli, allergenes) creent une alerte visible
- [x] Auto-creation alertes `severity: "critical"`, `categoryId: "recall"` avec `productRecallId` FK
- [x] `/internal/sync-recalls` — cron endpoint fire-and-forget avec lock Redis
- [x] `/internal/sync-recalls/status` — dernier resultat
- [x] `/internal/cleanup-recalls` — nettoyage complet (recalls + alerts + Redis)
- [x] `recall` tRPC router : `checkRecall` (scan-time), `list`, `adminList`, `approve`, `reject`, `bulkApprove`, `triggerSync` (avec `fullSync`), `syncStatus`
- [x] `alert.getById` enrichi avec `recallData` (toutes les donnees rappel jointes)
- [x] `alert.getUnreadCount` retourne `{ count, urgent, info }` par severity
- [x] Rate limiting `recall.checkRecall` : 30/min
- [x] Entrypoint verify : `product_recalls` + `content_sources`
- [x] GitHub Actions `sync-recalls.yml` — cron quotidien 6h CET

### Admin Dashboard (web)
- [x] `/admin/recalls` — moderation avec stats, filtres status, approve/reject/bulk
- [x] Bouton "Sync RappelConso" (delta) + "Full Sync" (30j reset)
- [x] Toggle auto-approve ON/OFF
- [x] Derniere sync info bar + toast resultat
- [x] Sidebar nav "Rappels Produit" avec ShieldWarning icon

### Tests
- [x] 15 unit tests (extractFirstUrl, normalizeGtin, transformRecord)

---

## PHASE 2 — Alertes Mobile + Home (FAIT)

### Mobile App
- [x] `RecallAlertSheet` — modal scan-time Apple-style (motif, risques, actions, precautions, distributeurs, geo, PDF, source)
- [x] `RecallInfoSection` — cartes structurees avec icones pour le detail screen (motif, risques, actions, lot, dates, temperature, compensation, nature juridique, contact, PDF)
- [x] `NaqiyMarkdown` — renderer Markdown premium (Nunito headings, Nunito Sans body, blockquotes Medium-style, liens cliquables)
- [x] `AlertQuickActionCard` — dual badges home (WarningIcon urgent + BellSimpleRingingIcon info) avec pastilles compteur
- [x] Alerts screen refonte Apple Notifications : cartes compactes 72px, groupement temporel (Aujourd'hui/Cette semaine/Plus ancien), single severity dot, monochrome glass
- [x] Tiering : free = 3 alertes, rest blurred + lock badge + upsell footer paywall
- [x] Long-press share : message brande "— via Naqiy"
- [x] `scan-result.tsx` : auto-query `recall.checkRecall`, auto-open RecallAlertSheet
- [x] `alerts/[id].tsx` : dual-mode render (RecallInfoSection pour recalls, NaqiyMarkdown pour editorial)
- [x] `articles/[id].tsx` : NaqiyMarkdown au lieu de Text brut
- [x] i18n : 20+ cles fr/en/ar (recalls, alerts upsell, temporal groups)
- [x] `PaywallTrigger: "alert_history"` pour conversion

### Admin Dashboard (web)
- [x] `/admin/alerts` — CRUD complet (create/edit/delete via Sheet, toggle active, severity/category pickers)
- [x] `/admin/articles` — CRUD complet avec stats, filtres type+status, cover image preview
- [x] `/admin/articles/new` + `/admin/articles/[id]/edit` — editeur article (titre, slug auto-gen, excerpt, markdown content, cover image, type, tags, read time auto-calc, external link, draft/publish)
- [x] Sidebar nav mise a jour (Rappels Produit, Sources Veille)

### Veille Automatique (Claude Cowork)
- [x] Schema `content_sources` + migration 0034 (5 sources initiales)
- [x] `veille-content.ts` — script fetch RSS avec og:image fallback + browser UA
- [x] `/internal/create-draft` — endpoint securise CRON_SECRET (insert-only, jamais publish/delete)
- [x] `/internal/content-sources` — liste sources actives
- [x] `/internal/update-source-fetch` — persiste last_fetched_at
- [x] `contentSource` tRPC router : CRUD admin (list, create, update, delete, toggleActive, resetFetch)
- [x] `/admin/veille-sources` — page admin gestion des sources
- [x] `COWORK-VEILLE-PROMPT.md` — prompt complet (heredoc JSON pour apostrophes, og:image, R2 upload, fallback images)
- [x] `DAILY-OPS.md` — guide operations quotidiennes
- [x] Variables env : CRON_SECRET + PRODUCTION_API_URL dans backend/.env

### Nettoyage
- [x] Seed alerts : ne seed plus les alertes (categories uniquement), contenu gere par CMS + Cowork
- [x] Categorie "recall" reajoutee apres suppression initiale
- [x] CSP PostHog fix (us → eu)
- [x] Drizzle journal a jour (entries 33-36)

---

## PHASE 3 — Feed "A la Une" enrichi (A FAIRE)

### Objectif
Transformer le carousel horizontal "A la une" de la home en un feed immersif et vivant qui donne envie de revenir chaque jour.

### Backend
- [ ] Schema `feed_items` (table polymorphe) — type, reference_id, title, subtitle, cover_image, accent_color, priority, tags, geo_scope, published_at, expires_at, engagement_score
- [ ] Algorithme de tri : pinned → alertes critiques → score (engagement * recency * geo_relevance * profile_affinity)
- [ ] `feed` tRPC router : `list` (pagine, filtre par type), `getById`
- [ ] Auto-populate depuis articles + alertes + store spotlights (triggers ou cron)
- [ ] Endpoint admin : `feed.pin`, `feed.unpin`, `feed.reorder`

### Mobile App
- [ ] Refonte section "A la une" sur la home :
  - Cards ratio 3:4 (comme Instagram) au lieu de 16:9
  - Types visuels differents : article (magazine), alerte (urgent), store (photo + badge certif), tendance (produit + verdict mini)
  - Infinite scroll vertical (plus de carousel) ou carousel + "Voir tout" → ecran feed pleine page
- [ ] Ecran feed pleine page (`/feed`) si carousel trop limite
- [ ] Section "Tendances cette semaine" — top produits scannes (stories-style circles)
- [ ] Section "Pres de chez vous" enrichie — stores spotlight avec photo Google, rating, certif badge, heures

### Admin Dashboard
- [ ] `/admin/feed` — gestion du feed (reorder, pin, unpin, preview)
- [ ] Drag & drop pour reordonner les items pinnes
- [ ] Preview mobile du feed

### Tiering
- [ ] Free : 5 items feed, 2 stores nearby
- [ ] Trial : feed complet, 5 stores nearby
- [ ] Naqiy+ : feed complet, stores illimite, filtres avances (par certifieur/madhab)

---

## PHASE 4 — Videos / Reels embed (A FAIRE)

### Objectif
Integrer du contenu video (food tours halal, reviews boucheries, recettes) dans le feed sans scraper ni violer les ToS des plateformes.

### Backend
- [ ] `video_embeds` schema — platform (instagram/tiktok/youtube), embed_url, thumbnail_url, title, author, duration, type (reel/video/short)
- [ ] oEmbed fetcher service :
  - Instagram : `https://api.instagram.com/oembed?url=...`
  - TikTok : `https://www.tiktok.com/oembed?url=...`
  - YouTube : `https://www.youtube.com/oembed?url=...`
- [ ] Auto-fetch thumbnail + titre quand admin colle un lien
- [ ] Integration dans le feed (feed_items type "video")

### Mobile App
- [ ] `VideoCard` component — thumbnail avec bouton play overlay, duree, plateforme badge
- [ ] Tap → ouvre le lien dans in-app browser (WebBrowser.openBrowserAsync)
- [ ] Pas de player custom (respecte les plateformes, evite les problemes de droits)
- [ ] Card specifique dans le feed "A la une"

### Admin Dashboard
- [ ] Section video dans `/admin/feed` ou page dediee `/admin/videos`
- [ ] Coller un lien → auto-fetch oEmbed → preview → publier
- [ ] Tags + categorie pour le tri dans le feed

### Veille Cowork
- [ ] Ajouter des comptes Instagram/TikTok dans content_sources (type: "instagram", "tiktok")
- [ ] Claude Cowork detecte les nouveaux posts et propose des embeds a valider

### Tiering
- [ ] Free : thumbnails visibles, lecture bloquee (upsell)
- [ ] Trial/Naqiy+ : lecture complete dans in-app browser

---

## PHASE 5 — Stores partenaires B2C (A FAIRE)

### Objectif
Permettre aux boucheries, restaurants, fermes halal de s'inscrire sur Naqiy pour gagner en visibilite (preparer le terrain marketplace).

### Backend
- [ ] Schema `store_applications` — demande d'inscription avec infos commerce (nom, adresse, type, certifieur, photos, description, contact, site web)
- [ ] Schema `store_spotlights` — mise en avant programmee (date debut/fin, position dans le feed, offre speciale)
- [ ] Workflow d'inscription : apply → review (admin) → approve → visible dans l'app
- [ ] `storePartner` tRPC router : `apply` (public), `adminList`, `approve`, `reject`, `createSpotlight`
- [ ] Integration dans le feed (feed_items type "store_spotlight")
- [ ] Push notification geo-ciblee quand un nouveau store est spotlight pres de l'utilisateur

### Mobile App
- [ ] Fiche store enrichie — photos carousel, description, offres, avis Google, heures, certifieur, contact
- [ ] Store spotlight card dans le feed "A la une" (photo premium, badge "Nouveau", offre speciale)
- [ ] Bouton "Suggerer un commerce" dans le map screen (formulaire simplifie)
- [ ] Section "Pres de chez vous" sur la home avec stores spotlight prioritaires

### Admin Dashboard
- [ ] `/admin/store-applications` — liste des demandes avec review flow (approve/reject/demander plus d'infos)
- [ ] `/admin/store-spotlights` — programmer des mises en avant (date, duree, position)
- [ ] Moderation photos (upload R2)
- [ ] Analytics : vues, clics, conversions par spotlight

### Landing / Web
- [ ] Page `/partenaires` sur naqiy.app — formulaire d'inscription pour les commerces
- [ ] SEO : "Referencez votre commerce halal sur Naqiy"

### Tiering / Business Model
- [ ] Inscription gratuite (visibilite de base dans la map)
- [ ] Spotlight payant (mise en avant dans le feed, position premium)
- [ ] Analytics store payant (combien de vues, clics depuis Naqiy)
- [ ] Commission future sur les commandes (marketplace phase ulterieure)

---

## Priorite d'implementation recommandee

```
Phase 3 (Feed) ←── prerequis pour phases 4 et 5
  ↓
Phase 4 (Videos) ←── s'integre dans le feed de phase 3
  ↓
Phase 5 (Stores B2C) ←── utilise le feed + le systeme de spotlight
```

Phase 3 est le socle — le feed unifie est necessaire avant d'y ajouter des videos (4) ou des store spotlights (5). Les phases 4 et 5 peuvent etre developpees en parallele une fois le feed en place.

---

## Fichiers cles modifies/crees (Phases 1-2)

### Backend (20+ fichiers)
- `backend/drizzle/0033-0036` — 4 migrations
- `backend/src/db/schema/product-recalls.ts` + `content-sources.ts` + `alerts.ts`
- `backend/src/services/recall-sync.service.ts`
- `backend/src/routes/internal.ts` (6 nouveaux endpoints)
- `backend/src/trpc/routers/recall.ts` + `content-source.ts` + `alert.ts` + `article.ts`
- `backend/scripts/veille-content.ts`
- `.github/workflows/sync-recalls.yml`

### Mobile (10+ fichiers)
- `optimus-halal/src/components/scan/RecallAlertSheet.tsx`
- `optimus-halal/src/components/content/RecallInfoSection.tsx`
- `optimus-halal/src/components/ui/NaqiyMarkdown.tsx`
- `optimus-halal/app/(tabs)/alerts.tsx` (refonte complete)
- `optimus-halal/app/(tabs)/index.tsx` (AlertQuickActionCard)
- `optimus-halal/app/scan-result.tsx` (RecallAlertSheet wiring)
- `optimus-halal/app/alerts/[id].tsx` (dual-mode render)
- `optimus-halal/app/articles/[id].tsx` (NaqiyMarkdown)

### Admin Web (8+ fichiers)
- `web/src/app/admin/recalls/page.tsx`
- `web/src/app/admin/alerts/page.tsx` (CRUD refonte)
- `web/src/app/admin/articles/page.tsx` + `new/` + `[id]/edit/`
- `web/src/app/admin/veille-sources/page.tsx`
- `web/src/components/admin/article-form.tsx`

### Documentation
- `docs/operations/DAILY-OPS.md`
- `docs/operations/COWORK-VEILLE-PROMPT.md`
- `docs/plans/PHASES-1-5-ALERTES-CONTENU.md` (ce fichier)
