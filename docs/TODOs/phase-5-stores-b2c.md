# Phase 5 — Stores Partenaires B2C

> **Prérequis** : Phase 3 (feed polymorphe pour les spotlights)
> **Branch** : `feat/phase-5-stores-b2c`
> **Migrations** : `0039_store_applications.sql`, `0040_store_spotlights.sql`

---

## Objectif

Permettre aux boucheries, restaurants, fermes et épiceries halal de **s'inscrire sur Naqiy** pour gagner en visibilité — et préparer le terrain de la future marketplace.

---

## 1. Backend

### 1.1 Schema `store_applications` (migration 0039)

```
Table: store_applications
─────────────────────────────────────
id              uuid PK default random
store_name      varchar(255) NOT NULL
store_type      store_type enum (réutiliser l'existant)
description     text
address         text NOT NULL
city            varchar(100) NOT NULL
postal_code     varchar(10)
latitude        double precision        -- géocodé via Google Geocoding ou Mapbox
longitude       double precision
phone           varchar(100) NOT NULL
email           varchar(255) NOT NULL
website         text
certifier       certifier enum (réutiliser l'existant)
certifier_name  varchar(255)            -- si "other"
photos          text[] DEFAULT '{}'     -- URLs R2 (max 5)
contact_name    varchar(100) NOT NULL   -- nom du gérant
siret           varchar(20)             -- numéro SIRET (France)
status          application_status enum ('pending', 'reviewing', 'approved', 'rejected', 'info_requested')
admin_notes     text                    -- notes internes
reviewed_by     uuid REFERENCES admins(id)
reviewed_at     timestamptz
rejection_reason text
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()

Indexes:
- idx_store_apps_status ON (status)
- idx_store_apps_city ON (city)
- idx_store_apps_created ON (created_at DESC)
```

### 1.2 Schema `store_spotlights` (migration 0040)

```
Table: store_spotlights
─────────────────────────────────────
id              uuid PK default random
store_id        uuid NOT NULL REFERENCES stores(id)
title           varchar(255)            -- "Nouvelle boucherie certifiée AVS !"
description     text
cover_image     text                    -- photo premium (R2)
special_offer   text                    -- "10% pour les nouveaux clients"
starts_at       timestamptz NOT NULL
ends_at         timestamptz NOT NULL
position        integer DEFAULT 0       -- ordre dans le feed
is_active       boolean DEFAULT true
engagement      jsonb DEFAULT '{}'      -- { views: 0, clicks: 0 }
created_at      timestamptz DEFAULT now()

Indexes:
- idx_spotlights_store ON (store_id)
- idx_spotlights_dates ON (starts_at, ends_at) WHERE is_active = true
- idx_spotlights_position ON (position) WHERE is_active = true
```

### 1.3 Workflow d'inscription

```
1. Commerçant remplit le formulaire (app mobile ou web)
   → POST store_application (status: 'pending')

2. Admin reçoit notification (admin dashboard)
   → Review : vérifier infos, photos, certification
   → 3 actions possibles :
     a) Approve → crée/met à jour un store dans la table stores
                 → envoie email confirmation
                 → store visible sur la carte
     b) Reject  → envoie email avec raison
     c) Request info → envoie email demande de complément
                     → status = 'info_requested'

3. Si approved :
   → Store ajouté/enrichi dans la table stores existante
   → Option : créer un store_spotlight automatique (1 semaine gratuite)
   → Feed item type 'store_spotlight' si spotlight actif
```

### 1.4 tRPC router `storePartner`

Fichier : `backend/src/trpc/routers/store-partner.ts`

```
storePartner.apply             — publicProcedure (formulaire, rate limit 3/jour)
storePartner.myApplication     — protectedProcedure (statut de ma candidature)
storePartner.updateApplication — protectedProcedure (compléter infos si 'info_requested')

storePartner.adminList         — adminProcedure, filtres status, city, type
storePartner.adminGetById      — adminProcedure
storePartner.approve           — adminProcedure → crée store + optional spotlight
storePartner.reject            — adminProcedure → avec raison
storePartner.requestInfo       — adminProcedure → email au commerçant

storePartner.createSpotlight   — adminProcedure (store_id, dates, offer, position)
storePartner.updateSpotlight   — adminProcedure
storePartner.deleteSpotlight   — adminProcedure
storePartner.listSpotlights    — adminProcedure (actifs + programmés)
```

### 1.5 Intégration feed

- Quand un `store_spotlight` est créé et que `starts_at <= now()`, auto-créer un `feed_item` type `store_spotlight`
- Cron quotidien pour activer les spotlights programmés et désactiver les expirés
- Endpoint : `POST /internal/refresh-spotlights`

### 1.6 Emails transactionnels

Via Resend (ou SMTP existant) :
- `store-application-received.tsx` — confirmation réception
- `store-application-approved.tsx` — félicitations + lien vers la fiche
- `store-application-rejected.tsx` — explication + possibilité de re-candidater
- `store-application-info-request.tsx` — demande de compléments

### 1.7 Upload photos

- Réutiliser le système d'upload R2 existant (`upload` tRPC router)
- Max 5 photos par candidature
- Compression côté client avant upload (expo-image-manipulator)
- Validation serveur : max 5MB/photo, formats jpg/png/webp

---

## 2. Mobile App

### 2.1 Fiche store enrichie

Fichier : `optimus-halal/app/stores/[id].tsx` (nouveau ou enrichir l'existant)

Design :
- Header : carousel photos (swipe horizontal, dots indicator)
- Section info : nom, type (badge), certifieur (logo), rating Google, review count
- Section offre spéciale (si spotlight actif) : banner gold avec texte offre
- Section horaires : liste jours, open/closed indicator live
- Section contact : téléphone (Linking.tel), email, site web, Google Maps (Linking.openURL)
- Section description : texte libre du commerçant
- Bouton "Itinéraire" → ouvre Google Maps/Apple Maps
- Bouton "Partager" → share natif

### 2.2 Store spotlight card dans le feed

Fichier : `optimus-halal/src/components/feed/FeedStoreCard.tsx` (déjà prévu Phase 3)

Design spécifique spotlight :
- Photo premium plein cadre
- Badge "Nouveau" ou "Coup de cœur" en haut à gauche (pill gold)
- Offre spéciale en bas (banner semi-transparent, texte offre)
- Certifieur badge en haut à droite
- Distance "À X km" si géolocalisation

### 2.3 Formulaire "Suggérer un commerce"

Fichier : `optimus-halal/app/stores/suggest.tsx`

- Accessible depuis le map screen (bouton flottant "+" ou dans le header)
- Formulaire multi-step (3 étapes) :
  1. **Infos générales** : nom, type (picker), adresse (autocomplete), ville
  2. **Certification** : certifieur (picker), photos (camera/galerie, max 5)
  3. **Contact** : nom gérant, téléphone, email, site web, SIRET (optionnel)
- Validation en temps réel
- Preview récapitulatif avant envoi
- Écran confirmation avec numéro de suivi

### 2.4 Section "Près de chez vous" enrichie (home)

Dans [index.tsx](optimus-halal/app/(tabs)/index.tsx), section existante "Discover stores" :
- Prioriser les stores avec spotlight actif (étoile gold)
- Ajouter badge offre spéciale si disponible
- "Voir tout" → map screen avec filtre spotlight

### 2.5 i18n

```
store.suggest.title: "Suggérer un commerce"
store.suggest.step1: "Informations"
store.suggest.step2: "Certification & Photos"
store.suggest.step3: "Contact"
store.suggest.submit: "Envoyer la demande"
store.suggest.success: "Demande envoyée ! Nous la traiterons sous 48h."
store.suggest.tracking: "Numéro de suivi : {id}"
store.spotlight.badge: "Coup de cœur"
store.spotlight.new: "Nouveau"
store.spotlight.offer: "Offre spéciale"
store.detail.hours: "Horaires"
store.detail.directions: "Itinéraire"
store.detail.share: "Partager"
store.detail.contact: "Contact"
store.detail.website: "Site web"
store.detail.closed: "Fermé"
store.detail.openNow: "Ouvert maintenant"
store.application.status.pending: "En attente de validation"
store.application.status.approved: "Approuvé"
store.application.status.rejected: "Refusé"
store.application.status.info_requested: "Complément demandé"
```

### 2.6 Tiering

| Tier | Stores nearby (home) | Fiche store | Formulaire suggestion |
|------|---------------------|-------------|----------------------|
| Free | 2 stores | Basique (pas de photos carousel) | Accessible |
| Trial | 5 stores | Complète | Accessible |
| Naqiy+ | Illimité + filtres | Complète + contact direct | Accessible |

- Free : fiche store limitée (1 photo, pas d'offre spéciale visible)
- `PaywallTrigger: "store_detail_full"` pour débloquer

---

## 3. Admin Dashboard

### 3.1 Page `/admin/store-applications`

- Vue liste avec colonnes : Statut (badge coloré), Nom commerce, Type, Ville, Certifieur, Date, Actions
- Filtres : status, city, store_type, certifier
- Stats en haut : X en attente, X approuvées ce mois, X refusées
- Clic sur une ligne → Sheet de review

### 3.2 Sheet de review

- Infos complètes du commerçant
- Carousel photos
- Map mini avec pin
- 3 boutons actions : Approuver | Refuser | Demander infos
- Champ notes admin (interne)
- Si "Approuver" : option checkbox "Créer spotlight 1 semaine gratuite"

### 3.3 Page `/admin/store-spotlights`

- Vue calendrier ou liste chronologique
- Créer un spotlight : sélectionner un store → dates → offre → position → preview
- Modifier / supprimer
- Analytics par spotlight : vues, clics, conversions (visites fiche)

### 3.4 Modération photos

- Vignettes avec zoom on click
- Bouton "Rejeter photo" (supprime de R2 + array)
- Flag NSFW basique (manual pour V1, AI futur)

---

## 4. Landing Web (futur, pas critique V1)

- Page `/partenaires` sur naqiy.app
- Formulaire web d'inscription (même champs que mobile)
- SEO : "Référencez votre commerce halal sur Naqiy"
- Témoignages de commerçants partenaires
- Tarifs : inscription gratuite, spotlight payant (futur)

---

## 5. Business Model

| Offre | Prix | Inclus |
|-------|------|--------|
| Inscription de base | Gratuit | Visible sur la carte, fiche basique |
| Spotlight 1 semaine | 29€ | Mise en avant dans le feed, badge "Coup de cœur" |
| Spotlight 1 mois | 89€ | Idem + position prioritaire + offre spéciale visible |
| Analytics store | 19€/mois | Statistiques : vues, clics, itinéraires depuis Naqiy |
| Pack lancement | 149€ | Spotlight 1 mois + analytics 3 mois + mise en avant newsletter |

> V1 : tout gratuit pour bootstrapper le réseau. Monétisation Phase ultérieure.

---

## 6. Tests

- [ ] Unit tests validation formulaire candidature
- [ ] Integration test workflow complet : apply → approve → store créé → spotlight → feed_item
- [ ] Integration test `storePartner.apply` (rate limit 3/jour)
- [ ] Integration test approve → vérifier store dans table stores
- [ ] Test emails transactionnels (templates rendus correctement)
- [ ] Test upload photos (max 5, formats, taille)

---

## 7. Fichiers à créer / modifier

### Nouveaux fichiers
```
backend/drizzle/0039_store_applications.sql
backend/drizzle/0040_store_spotlights.sql
backend/src/db/schema/store-applications.ts
backend/src/db/schema/store-spotlights.ts
backend/src/trpc/routers/store-partner.ts
backend/src/services/store-approval.service.ts
backend/src/emails/store-application-received.tsx  (si Resend/React Email)
backend/src/emails/store-application-approved.tsx
backend/src/emails/store-application-rejected.tsx

optimus-halal/app/stores/[id].tsx
optimus-halal/app/stores/suggest.tsx
optimus-halal/src/components/stores/StorePhotoCarousel.tsx
optimus-halal/src/components/stores/StoreApplicationForm.tsx
optimus-halal/src/components/stores/SpotlightBanner.tsx

web/src/app/admin/store-applications/page.tsx
web/src/app/admin/store-spotlights/page.tsx
```

### Fichiers à modifier
```
backend/src/db/schema/index.ts              — export nouveaux schemas
backend/src/trpc/router.ts                  — ajouter storePartnerRouter
backend/src/routes/internal.ts              — endpoint refresh-spotlights
backend/src/services/feed-populate.service.ts — auto-create feed_item pour spotlights
backend/src/db/entrypoint.ts                — verify nouvelles tables

optimus-halal/app/(tabs)/index.tsx          — section "Près de chez vous" enrichie
optimus-halal/app/(tabs)/map.tsx            — bouton "Suggérer un commerce"
optimus-halal/src/components/feed/FeedStoreCard.tsx — spotlight design
optimus-halal/src/i18n/translations/fr.ts
optimus-halal/src/i18n/translations/en.ts
optimus-halal/src/i18n/translations/ar.ts

web/src/components/admin/sidebar.tsx        — liens Candidatures + Spotlights
```

---

## 8. Ordre d'implémentation

```
1. Schemas + migrations 0039-0040 + Drizzle schemas
2. tRPC router storePartner (CRUD candidatures + spotlights)
3. Service approbation (approve → create store + optional spotlight)
4. Mobile : formulaire suggestion (multi-step)
5. Mobile : fiche store enrichie ([id].tsx)
6. Admin : page candidatures + review flow
7. Admin : page spotlights
8. Intégration feed (auto-create feed_item spotlight)
9. Section "Près de chez vous" enrichie (home)
10. Tiering + PaywallTrigger
11. Emails transactionnels
12. Tests
```
