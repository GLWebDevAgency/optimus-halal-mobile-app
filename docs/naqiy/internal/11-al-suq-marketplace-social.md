# 11 — Al-Suq (السوق) — Marketplace, Social & B2B

> "Wa ahalla Allahu al-bay'a wa harrama al-riba"
> — Allah a rendu licite le commerce et interdit l'usure. (Coran 2:275)

---

## Sommaire

1. [Vision : Le Flywheel Naqiy](#1-vision--le-flywheel-naqiy)
2. [Enrichissement Google Places](#2-enrichissement-google-places)
3. [Plans B2B — Pricing & Gating](#3-plans-b2b--pricing--gating)
4. [Phase 1 — Posts (MVP Social)](#4-phase-1--posts-mvp-social)
5. [Phase 2 — Reels (Engagement ×10)](#5-phase-2--reels-engagement-10)
6. [Phase 3 — Marketplace (Revenue ×10)](#6-phase-3--marketplace-revenue-10)
7. [Phase 4 — Live Commerce](#7-phase-4--live-commerce)
8. [Schema DB complet](#8-schema-db-complet)
9. [Intégration carte & navigation](#9-intégration-carte--navigation)
10. [Monétisation détaillée](#10-monétisation-détaillée)
11. [Roadmap & milestones](#11-roadmap--milestones)
12. [Éthique islamique du modèle](#12-éthique-islamique-du-modèle)

---

## 1. Vision : Le Flywheel Naqiy

Naqiy passe d'un **outil** (scanner + carte) à une **plateforme** (communauté + commerce). La transformation se fait en 4 phases, chacune alimentant la suivante.

### Le Flywheel

```
CONTENU (commerçant poste)
    ↓
ENGAGEMENT (utilisateurs likent, commentent)
    ↓
CONVERSION (itinéraire, appel, commande)
    ↓
REVENU (commission, abonnement, boost)
    ↓
ROI VISIBLE (commerçant voit les stats)
    ↓
→ PLUS DE CONTENU (le commerçant poste plus)
→ PLUS D'UTILISATEURS (bouche-à-oreille)
→ PLUS DE COMMERÇANTS (FOMO compétitif)
```

### Pourquoi ça marche pour le halal

La communauté musulmane a un problème de **confiance** permanent avec la nourriture. Le contenu vidéo des commerçants répond directement à cette anxiété : tu VOIS le boucher trancher la viande, tu VOIS le certificat sur le mur, tu VOIS la cuisine du restaurant. C'est la *bayyina* (preuve claire) en action.

Aucune autre plateforme ne combine **certification vérifiée + contenu authentique + commerce**. Instagram a le contenu mais pas la certification. Google Maps a la carte mais pas le contenu. Naqiy fait le pont.

---

## 2. Enrichissement Google Places

### Contexte

~450 stores en DB (AVS + Achahada), mais :
- 0% ont une photo
- 0% ont un rating
- 0% ont des avis
- 0% ont des horaires complets

### Source : Google Places API (New)

Test réalisé sur 8 stores diversifiés le 04/03/2026 :

| Champ | Couverture | Qualité |
|-------|-----------|---------|
| Rating | 100% (8/8) | 3.5 à 4.6 |
| Reviews | 100% (8/8) | 5 avis détaillés, auteur + date |
| Photos | 100% (8/8) | Avg 8.9/store, jusqu'à 4800px |
| Horaires | 100% (8/8) | Structurés `periods[]` |
| Téléphone | 100% (8/8) | National + international |
| Website | 63% (5/8) | Petits commerces sans site |
| Description | 0% (0/8) | Google ne génère pas pour petits commerces FR |
| Price Level | 13% (1/8) | Seulement les chaînes |

**Coût** : ~$14 pour 450 stores (Text Search API). One-shot.

### Colonnes ajoutées à `stores`

```sql
ALTER TABLE stores ADD COLUMN google_place_id VARCHAR(255) UNIQUE;
ALTER TABLE stores ADD COLUMN google_maps_url TEXT;
ALTER TABLE stores ADD COLUMN google_rating REAL;
ALTER TABLE stores ADD COLUMN google_review_count INTEGER;
ALTER TABLE stores ADD COLUMN google_enriched_at TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN google_photos JSONB DEFAULT '[]';
```

### Table `google_reviews`

```sql
CREATE TABLE google_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  google_review_id VARCHAR(500) UNIQUE NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_photo_uri TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  publish_time TIMESTAMPTZ,
  relative_time VARCHAR(100),
  language_code VARCHAR(10) DEFAULT 'fr',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX google_reviews_store_idx ON google_reviews(store_id);
```

### Pipeline d'enrichissement

1. Fetch 450 stores de la DB
2. Pour chaque store : Text Search → match par nom+adresse+locationBias(500m)
3. Stocker googlePlaceId, rating, reviewCount, photos, hours, phone, website
4. Upload top 3 photos sur R2 → stocker URLs publiques
5. Insérer reviews dans `google_reviews`
6. Insérer hours dans `store_hours`
7. Mettre à jour `imageUrl` (hero photo), `averageRating`, `reviewCount`

---

## 3. Plans B2B — Pricing & Gating

### Philosophie

Les utilisateurs (B2C) sont le "produit" qui attire les commerçants. Plus on a d'utilisateurs qui cherchent des boucheries halal, plus les boucheries veulent être bien positionnées sur Naqiy.

**Différenciateur islamique** : Contrairement à Yelp où tout commerce peut payer pour de la visibilité, sur Naqiy la certification halal est le prérequis. Un commerce non certifié ne peut PAS payer pour apparaître "certifié". La confiance utilisateur est protégée par design.

### Les 3 plans

#### Gratuit — "Vitrine" (0€/mois)

Objectif : 100% des 450 stores présents et visibles. C'est le catalogue.

| Inclus | Exclu |
|--------|-------|
| Nom, adresse, position carte | Photos du commerce |
| Type (boucherie, restaurant...) | Avis détaillés (juste le score) |
| Badge certifieur (AVS, Achahada...) | Lien site web |
| Horaires d'ouverture | Description personnalisée |
| Téléphone | Posts / contenu social |
| Note Google (chiffre) | Statistiques |
| Boutons Itinéraire + Appeler | Boutique / marketplace |

**Ce qui est gratuit = ce qui sert L'UTILISATEUR** (trouver, vérifier, y aller).
**Ce qui est payant = ce qui sert LE COMMERÇANT** (convertir, promouvoir, vendre).

#### Essentiel — "Croissance" (29€/mois)

Le plan que 80% des commerçants payants choisissent.

| Fonctionnalité | Détail |
|----------------|--------|
| Photos du commerce | Google + custom, galerie |
| Top 5 avis Google visibles | Texte complet + auteur |
| Lien site web / réseaux | Affiché dans le profil |
| Description personnalisée | Texte libre |
| Badge "Essentiel" | Subtil, crédibilité |
| Bouton Commander / lien delivery | Conversion directe |
| Statistiques basiques | Vues, clics itinéraire, clics appeler |
| Posts photo | 4 par mois |
| Boutique produits | 20 produits max |
| Tags produits sur posts | Lien vers boutique |

**Argument de vente** : "Vos clients cherchent une boucherie halal. Sans photos ni avis, ils passent au suivant. 29€/mois = moins qu'un client perdu par jour."

#### Premium — "Domination" (79€/mois)

Ancrage prix + revenue maximale sur les 5-10% ambitieux.

| Fonctionnalité | Détail |
|----------------|--------|
| Tout Essentiel | — |
| Badge "Recommandé Naqiy" | Confiance premium |
| Boost dans la recherche | Priorité dans les résultats |
| Marker prioritaire sur carte | Plus gros, doré, z-index élevé |
| Push notification promo | 1× par semaine aux abonnés |
| Réponse aux avis | Via dashboard |
| Stats détaillées | Vs concurrents, conversion, heures de pointe |
| Photo de couverture custom | Upload direct, pas Google |
| Vidéo de présentation | 30s |
| Reels illimités | Vidéos courtes |
| Menu digital intégré | Carte du restaurant |
| QR code personnalisé | Pour le magasin physique |
| Produits illimités | Marketplace sans plafond |
| Support WhatsApp prioritaire | — |

**Argument de vente** : "Vous êtes dans un quartier avec 5 boucheries. Le badge Recommandé + le boost vous placent EN PREMIER."

### Colonne `planLevel`

```sql
ALTER TABLE stores ADD COLUMN plan_level VARCHAR(20) DEFAULT 'free' NOT NULL;
-- Valeurs : 'free', 'essential', 'premium'
ALTER TABLE stores ADD COLUMN plan_expires_at TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN plan_claimed_by UUID REFERENCES users(id);
```

### Gating côté API

Toutes les données Google sont stockées pour tous les stores. Le gating se fait dans `store.ts` `getById` :

```typescript
return {
  ...store,
  hours,
  // Gated behind plan
  photos: store.planLevel !== 'free' ? googlePhotos : [],
  topReviews: store.planLevel !== 'free' ? googleReviews : [],
  website: store.planLevel !== 'free' ? store.website : null,
  googleMapsUrl: store.planLevel !== 'free' ? store.googleMapsUrl : null,
  // Description only for essential+
  description: store.planLevel !== 'free' ? store.description : null,
};
```

---

## 4. Phase 1 — Posts (MVP Social)

**Timeline** : 3-4 semaines
**Prérequis** : Google Places enrichissement terminé

### Concept

Le commerçant poste depuis son dashboard :
- 1 photo + légende + hashtags
- Lié automatiquement à son store
- Visible dans 3 endroits :
  1. Le profil store (section "Actualités")
  2. Le carrousel "Autour de vous" dans Home
  3. Le marketplace (si produit taggé)

### Tables DB

```sql
CREATE TABLE store_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL DEFAULT 'photo', -- 'photo' | 'video' | 'text'
  media_url TEXT, -- R2 URL
  thumbnail_url TEXT, -- R2 URL (for video)
  caption TEXT, -- max 500 chars
  tags TEXT[] DEFAULT '{}',
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_sponsored BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX store_posts_store_idx ON store_posts(store_id);
CREATE INDEX store_posts_published_idx ON store_posts(published_at DESC);
CREATE INDEX store_posts_tags_idx ON store_posts USING GIN(tags);

CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES store_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES store_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL, -- max 300 chars
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX post_comments_post_idx ON post_comments(post_id);

CREATE TABLE store_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, user_id)
);
```

### UI : Post dans Store Detail (section "Actualités")

```
┌──────────────────────────────────────────┐
│ ACTUALITÉS                               │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ [logo] Boucherie Boudalia            │ │
│ │        il y a 2h · AVS ✓            │ │
│ │                                      │ │
│ │ ┌──────────────────────────────────┐ │ │
│ │ │                                  │ │ │
│ │ │      PHOTO (4:5 ratio)           │ │ │
│ │ │                                  │ │ │
│ │ └──────────────────────────────────┘ │ │
│ │                                      │ │
│ │ ❤️ 47    💬 12    ↗ Partager         │ │
│ │                                      │ │
│ │ Poulet rôti du jour ! Mariné aux     │ │
│ │ épices maison, cuit au feu de bois.  │ │
│ │ #poulet #grillades #halal            │ │
│ │                                      │ │
│ │ [🧭 Y aller (450m)]  [📞 Appeler]   │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### UI : Carrousel "Autour de vous" dans Home

```
┌──────────────────────────────────────────┐
│ 📸 AUTOUR DE VOUS                        │
│                                          │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ >>> │
│ │█████████│ │█████████│ │█████████│     │
│ │█ PHOTO █│ │█ PHOTO █│ │█ PHOTO █│     │
│ │█████████│ │█████████│ │█████████│     │
│ │Boudalia │ │Pepper G.│ │Azul     │     │
│ │❤️47 💬12│ │❤️203 💬34│ │❤️89 💬23│     │
│ └─────────┘ └─────────┘ └─────────┘     │
│                                          │
└──────────────────────────────────────────┘
```

---

## 5. Phase 2 — Reels (Engagement ×10)

**Timeline** : 6-8 semaines après Phase 1
**Prérequis** : Phase 1 validée, engagement mesuré

### Concept

Le commerçant filme 15-60 secondes :
- Préparation d'un plat
- Arrivage de viande fraîche
- Ambiance du restaurant
- Tuto recette avec ses produits
- Visite de la cuisine (transparence halal)

L'utilisateur scroll verticalement (TikTok-style) en fullscreen.

### Ajouts à `store_posts`

```sql
ALTER TABLE store_posts ADD COLUMN duration INTEGER; -- secondes
ALTER TABLE store_posts ADD COLUMN music_id UUID; -- FK musics, nullable
```

### Video Pipeline

```
📱 Capture (expo-camera ou galerie)
    ↓
☁️ Upload chunk (tus protocol, resumable)
    ↓
🎬 Cloudflare Stream (transcode HLS adaptatif)
    ↓
📱 Lecture (expo-video, HLS 240p/480p/720p)
```

Coût Cloudflare Stream : $1/1000 min stockées + $1/1000 min regardées.
Budget estimé : $5-20/mois au lancement.

### Feed dédié (5ème onglet)

Migrer vers un onglet dédié quand >50 posts/semaine :
```
[🏠 Home]  [🔍 Scan]  [📸 Feed]  [🗺️ Map]  [👤 Profil]
```

Algorithme feed : **local (distance) × engagement (likes) × récence (decay)**.

---

## 6. Phase 3 — Marketplace (Revenue ×10)

**Timeline** : 8-12 semaines après Phase 2
**Prérequis** : Stripe Connect, Phase 2 fonctionnelle

### Concept

Le commerçant a une boutique digitale :
- Liste de produits avec prix
- Commandable depuis un post/reel (tag produit)
- Retrait en magasin OU livraison

### Tables DB

```sql
CREATE TABLE store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category VARCHAR(100),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  preparation_time INTEGER, -- minutes
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE post_product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES store_posts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES store_products(id) ON DELETE CASCADE,
  position_x REAL, -- 0-1, position tag sur l'image
  position_y REAL, -- 0-1
  UNIQUE(post_id, product_id)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- 'pending','confirmed','preparing','ready','completed','cancelled'
  total_amount DECIMAL(10,2) NOT NULL,
  naqiy_fee DECIMAL(10,2) NOT NULL, -- commission 10%
  fulfillment VARCHAR(20) NOT NULL DEFAULT 'pickup', -- 'pickup' | 'delivery'
  pickup_time TIMESTAMPTZ,
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES store_products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);
```

### Commission

Naqiy prend **10%** sur chaque commande (vs UberEats 30%, Deliveroo 25-35%).
Argument : "3× moins que UberEats, ET vos clients sont qualifiés halal."

---

## 7. Phase 4 — Live Commerce

**Timeline** : Q4 2026+
**Prérequis** : Phase 3 fonctionnelle, base utilisateurs significative

Le commerçant fait un live :
- "Vente flash : 50 poulets rôtis à 6€ au lieu de 9€"
- Les viewers voient le compteur baisser en temps réel
- Tap "Réserver" → retrait en 1h
- Notifications push aux abonnés du store

Modèle inspiré de Douyin (TikTok Chine) qui génère 60% de son revenu via le live commerce.

---

## 8. Schema DB complet

### Enrichissement Google (immédiat)

```
stores (EXISTANT — colonnes ajoutées)
├── google_place_id     VARCHAR(255) UNIQUE
├── google_maps_url     TEXT
├── google_rating       REAL
├── google_review_count INTEGER
├── google_enriched_at  TIMESTAMPTZ
├── google_photos       JSONB DEFAULT '[]'
├── plan_level          VARCHAR(20) DEFAULT 'free' NOT NULL
├── plan_expires_at     TIMESTAMPTZ
└── plan_claimed_by     UUID FK → users

google_reviews (NOUVELLE TABLE)
├── id                  UUID PK
├── store_id            FK → stores CASCADE
├── google_review_id    VARCHAR(500) UNIQUE
├── author_name         VARCHAR(255)
├── author_photo_uri    TEXT
├── rating              INTEGER (1-5)
├── text                TEXT
├── publish_time        TIMESTAMPTZ
├── relative_time       VARCHAR(100)
├── language_code       VARCHAR(10)
├── created_at          TIMESTAMPTZ
└── updated_at          TIMESTAMPTZ
```

### Social (Phase 1-2)

```
store_posts
├── id, store_id, author_id, type
├── media_url, thumbnail_url, caption, tags
├── like_count, comment_count, share_count, view_count
├── is_active, is_sponsored
├── duration (Phase 2), music_id (Phase 2)
├── published_at, created_at, updated_at

post_likes (post_id, user_id, created_at)
post_comments (post_id, user_id, text, like_count)
store_follows (store_id, user_id, created_at)
```

### Marketplace (Phase 3)

```
store_products (store_id, name, price, image_url, category, is_available)
post_product_tags (post_id, product_id, position_x, position_y)
orders (user_id, store_id, status, total_amount, naqiy_fee, fulfillment)
order_items (order_id, product_id, quantity, unit_price, subtotal)
```

---

## 9. Intégration carte & navigation

### Marker avec contenu récent

Les stores ayant des posts récents (<48h) affichent un anneau doré pulsant sur le marker de la carte, indiquant du contenu frais à découvrir.

### StoreCard enrichie (peek)

Le dernier post du commerçant est affiché en miniature dans la StoreCard, sous les infos de base (nom, distance, rating), créant un aperçu du contenu sans quitter la carte.

### Store Detail enrichi (expanded)

Le bottom sheet en mode expanded affiche 3 tabs :
- **Infos** : Description, horaires, avis, liens (actuel enrichi)
- **Posts** : Feed du commerçant (Phase 1+)
- **Boutique** : Catalogue produits (Phase 3+)

### Discovery via la carte

La carte devient un "For You Page" géographique : tu ouvres la carte, tu vois les commerces autour de toi, ceux qui ont un anneau doré ont du contenu frais. C'est le feed TikTok ancré dans le réel — dans TON quartier, avec des commerces où tu peux aller physiquement.

---

## 10. Monétisation détaillée

### Revenue streams par plan

| Fonctionnalité | Gratuit | Essentiel 29€ | Premium 79€ |
|---|:---:|:---:|:---:|
| Listing carte | ✅ | ✅ | ✅ |
| Badge certifieur | ✅ | ✅ | ✅ |
| Horaires + téléphone | ✅ | ✅ | ✅ |
| Note Google (chiffre) | ✅ | ✅ | ✅ |
| Boutons itinéraire/appel | ✅ | ✅ | ✅ |
| Photos commerce | ❌ | ✅ | ✅ |
| Avis détaillés | ❌ | ✅ | ✅ |
| Site web / réseaux | ❌ | ✅ | ✅ |
| Description custom | ❌ | ✅ | ✅ |
| Posts photo | ❌ | ✅ 4/mois | ✅ illimité |
| Reels vidéo | ❌ | ❌ | ✅ illimité |
| Boutique produits | ❌ | ✅ 20 max | ✅ illimité |
| Tags produits | ❌ | ✅ | ✅ |
| Ventes marketplace | ❌ | ✅ | ✅ |
| Stats basiques | ❌ | ✅ | ✅ |
| Stats détaillées | ❌ | ❌ | ✅ |
| Badge Recommandé | ❌ | ❌ | ✅ |
| Boost recherche | ❌ | ❌ | ✅ |
| Marker doré carte | ❌ | ❌ | ✅ |
| Push promo (1/sem) | ❌ | ❌ | ✅ |
| Menu digital | ❌ | ❌ | ✅ |
| QR code | ❌ | ❌ | ✅ |
| Support WhatsApp | ❌ | ❌ | ✅ |

### Commission marketplace

- **10%** sur chaque commande (vs UberEats 30%, Deliveroo 25-35%)
- Boost produit sponsorisé : **0.10-0.30€/clic**, budget min 5€/jour

### Projection revenus (12 mois après lancement social)

```
450 stores × 30% claim = 135 claimed
135 × 60% payants = 81 payants

Abonnements :
  65 × Essentiel × 29€      =  1 885€/mois
  16 × Premium × 79€        =  1 264€/mois
Marketplace :
  30 stores × 50 cmd × 18€ × 10% = 2 700€/mois
Boost sponsorisé :
  10 campagnes × 150€       =  1 500€/mois
B2C (Naqiy+ scans) :        =  3 000€/mois
────────────────────────────────────────
TOTAL MRR                   = 10 349€/mois
ARR                         = 124 188€/an
```

---

## 11. Roadmap & milestones

### Mars 2026 — Fondations (ACTUEL)

- [x] Brand-to-certifier fallback system
- [ ] Google Places enrichissement 450 stores
- [ ] planLevel + gating backend
- [ ] Schema push + enrichissement batch

### Avril 2026 — Phase 1 MVP Social

- [ ] store_posts table + CRUD tRPC
- [ ] Section "Actualités" dans Store Detail
- [ ] Carrousel "Autour de vous" dans Home
- [ ] Dashboard commerçant (web simple)
- [ ] Like + Comment basique
- [ ] store_follows + notifications
- [ ] Claim store flow

### Mai-Juin 2026 — Phase 1.5 + 2

- [ ] Feed dédié (5ème onglet si engagement OK)
- [ ] Upload vidéo (Cloudflare Stream)
- [ ] Reel player fullscreen (swipe vertical)
- [ ] Algo feed : local × engagement × récence
- [ ] store_products + boutique basique
- [ ] Stripe Connect pour commerçants

### Juillet-Septembre 2026 — Phase 3

- [ ] Panier + checkout Stripe
- [ ] Tags produits sur posts/reels
- [ ] Système de commande + notifications
- [ ] Retrait en magasin (MVP)
- [ ] Commission tracking

### Q4 2026+ — Phase 4

- [ ] Live streaming
- [ ] Vente flash en direct
- [ ] Livraison (partenaire logistique)
- [ ] Expansion hors France

---

## 12. Éthique islamique du modèle

### La ligne rouge : katm al-ilm

Le verdict halal/douteux/haram d'un produit est TOUJOURS gratuit (cf. chapitre 06). Cette règle s'étend à la carte : la certification d'un magasin est TOUJOURS visible gratuitement. Un utilisateur doit pouvoir savoir si une boucherie est certifiée AVS sans payer.

### Ce qu'on gate vs ce qu'on ne gate jamais

| JAMAIS gaté (droit de l'utilisateur) | Gaté derrière un plan (promotion du commerçant) |
|---|---|
| Le nom du commerce | Les photos du commerce |
| La certification halal | Les avis détaillés |
| L'adresse et la position carte | La description personnalisée |
| Les horaires d'ouverture | Le lien site web |
| Le téléphone | Les posts / reels |
| La note globale (chiffre) | Le boost dans la recherche |
| Le bouton Itinéraire | Le badge Recommandé |

### Transparence du pricing

Pas de "features fantômes" ni de limitations cachées. Le prophète ﷺ a dit : *"Celui qui nous trompe n'est pas des nôtres"* (Muslim). Chaque fonctionnalité promise est réellement délivrée. Le pricing est public et identique pour tous les commerçants.

### Commission juste

La commission marketplace de 10% est volontairement basse comparée au marché (UberEats 30%, Deliveroo 25-35%). L'objectif n'est pas de maximiser la marge mais de créer un écosystème durable où commerçants et consommateurs musulmans prospèrent ensemble. Le rizq est dans la baraka, pas dans l'extraction.
