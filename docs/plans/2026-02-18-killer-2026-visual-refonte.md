# OPTIMUS HALAL — KILLER 2026 VISUAL REFONTE
## Design Complet | Fintech Ethique Premium + Heritage Islamique

> **Date**: 18 Fevrier 2026
> **Approche**: A — Fintech Premium Ethical avec motifs geometriques islamiques et calligraphie arabe
> **Objectif**: L'app halal la plus belle et la plus utile au monde
> **Sources**: 5 agents d'audit (91 procedures backend, 15 ecrans, 28 strings hardcodees, 320+ recommandations), 12 docs existants, recherche design 2026

---

## 1. PROFIL UTILISATEUR CIBLE

### Segments principaux

| Segment | Age | Profil | Besoin primaire | Frequence |
|---------|-----|--------|-----------------|-----------|
| **Zara** — La Consciente | 22-30 | Etudiante/jeune active, engagee ethique, hyper-connectee | Scanner rapidement, partager sur insta, boycott | Quotidien |
| **Youssef** — Le Pere de Famille | 30-42 | Cadre, 2-3 enfants, halal = obligation religieuse | Certitude halal pour sa famille, allergenes | 3-5x/semaine |
| **Khadija** — La Grand-Mere | 50+ | Traditionnelle, peu tech-savvy, madhab strict | Interface simple, gros texte, avis fiable | 1-2x/semaine |
| **Adam** — Le Converti | 25-35 | Nouveau musulman, apprend les regles, cherche communaute | Education halal, guide pas-a-pas, confiance | Quotidien |

### Insights psychologiques cles

1. **Anxiete du doute** — "Est-ce que c'est vraiment halal?" = emotion #1 a resoudre en <1 seconde
2. **Fierte communautaire** — "Je suis un consommateur conscient" = gamification et partage social
3. **Confiance par la transparence** — L'utilisateur veut voir POURQUOI, pas juste le verdict
4. **Habitude quotidienne** — Transformer le scan en rituel (streak, points, niveaux)
5. **Heritage culturel** — Les motifs islamiques ne sont pas decoratifs, ils sont identitaires

---

## 2. DIRECTION ARTISTIQUE: "EMERALD SANCTUARY"

### 2.1 Vision

> Une application qui fusionne la **precision chirurgicale des fintech** (Revolut, N26) avec la **sacralite et l'elegance de l'art islamique** — comme entrer dans une mosquee moderne ou la technologie sert la spiritualite.

### 2.2 Palette definitive

```
BRAND
  Primary:         #13ec6a  (Emerald Electric — le vert de la nature, du halal, de l'islam)
  Primary Dark:    #0ea64b  (Gradient pair)
  Primary Deep:    #099a44  (Accents sombres)
  Primary Light:   #55f9a4  (Glow, highlights)
  Primary Surface: rgba(19, 236, 106, 0.08)  (Fond subtil)

GOLD (Heritage & Gamification)
  Gold:            #D4AF37  (Or calligraphique — badges, recompenses, partenaires)
  Gold Light:      #f0cc47  (Highlights)
  Gold Dark:       #9a6518  (Accents profonds)

BACKGROUNDS
  Light:           #f8faf9  (Warm white avec micro-teinte verte)
  Dark:            #0a1a10  (Foret profonde — presque noir avec ame verte)

SURFACES
  Card Light:      #ffffff
  Card Dark:       #132a1a  (Vert sombre subtle — PAS gris)

STATUS
  Halal:           #22c55e  + gradient → #16a34a
  Haram:           #ef4444  + gradient → #dc2626
  Doubtful:        #f97316  + gradient → #ea580c
  Unknown:         #94a3b8  + gradient → #64748b

NUTRITION
  Nutri-A:         #22c55e
  Nutri-B:         #84cc16
  Nutri-C:         #eab308
  Nutri-D:         #f97316
  Nutri-E:         #ef4444
```

### 2.3 Motifs geometriques islamiques

**Principe**: Les motifs geometriques islamiques (arabesques, etoiles a 8 branches, tessellations) sont utilises comme **elements structurels subtils**, pas comme decoration superficielle.

**Applications concretes**:

| Contexte | Motif | Implementation |
|----------|-------|----------------|
| **Hero backgrounds** | Tessellation hexagonale subtile | SVG pattern en `opacity: 0.03` (light) / `0.06` (dark), couleur primary |
| **Scan verdict circle** | Etoile a 8 branches (Khatam) | Forme du cercle de confiance — octogonale au lieu de circulaire |
| **Section separators** | Arabesque lineaire | Trait fin avec motif geometrique entre les sections |
| **Loading shimmer** | Motif muqarnas simplifie | Direction du shimmer suit un pattern geometrique |
| **Onboarding** | Grande tessellation animee | Background anime avec motif islamique qui pulse |
| **Empty states** | Rosette geometrique | Illustration decorative avec motif central |
| **Tab bar** | Arche islamique | Forme du bouton central = arche subtile |

**Generation technique**: SVG statiques via `react-native-svg` + Reanimated pour animations. Pas de librairie lourde, patterns dessines a la main en SVG path.

### 2.4 Calligraphie arabe comme element visuel

**Principe**: La calligraphie arabe (Thuluth, Naskh) apparait comme **element d'identite visuelle**, pas comme texte fonctionnel. Elle transmet la beaute de la langue sacree.

| Contexte | Texte | Style | Usage |
|----------|-------|-------|-------|
| **Splash screen** | "بِسْمِ ٱللَّٰهِ" (Bismillah) | Thuluth | Fond avec opacity 0.08, grande taille |
| **Scan = Halal** | "حَلَالٌ طَيِّبٌ" (Halal Tayyib) | Naskh elegant | Sous le verdict, couleur primary, font arabe |
| **Home hero** | "ٱلسَّلَامُ عَلَيْكُمْ" (Assalamu Alaykum) | Calligraphie | Greeting anime avec fondu |
| **Onboarding S1** | Motif calligraphique | Decoratif | Background SVG path |
| **Profile badge** | Etoile avec calligraphie | Khatam + texte | Badge "Consommateur Conscient" |
| **Ramadan mode** | "رَمَضَانَ كَرِيمٌ" | Thuluth | Header special pendant Ramadan |

**Implementation**: Font arabe = `Amiri` (Google Fonts, gratuite, optimisee mobile). SVG pour les elements decoratifs. expo-google-fonts pour chargement.

### 2.5 Typography

```
TITRES       : Inter Black    | -0.5 letter-spacing | sizes: 30, 24, 20
SOUS-TITRES  : Inter Bold     | -0.3 letter-spacing | sizes: 18, 16
BODY         : Inter Medium   | 0 letter-spacing    | sizes: 16, 14
CAPTION      : Inter Regular  | 0.1 letter-spacing  | sizes: 12, 11
ARABE DECO   : Amiri Bold     | 0 letter-spacing    | sizes: 24-48
LINE-HEIGHT  : 1.5 (body) | 1.3 (titres) | 1.6 (dense text)
```

### 2.6 Shadows & Elevation

```
LIGHT MODE
  subtle:  elevation 1, blur 3, opacity 0.04, color #000
  card:    elevation 3, blur 8, opacity 0.06, color #000
  float:   elevation 6, blur 12, opacity 0.10, color #000
  hero:    elevation 10, blur 24, opacity 0.15, color #000
  glow:    elevation 4, blur 16, opacity 0.25, color #13ec6a

DARK MODE (green-tinted for "forest" aesthetic)
  subtle:  elevation 1, blur 4, opacity 0.20, color #000
  card:    elevation 3, blur 10, opacity 0.30, color primary-900
  float:   elevation 6, blur 16, opacity 0.35, color primary-800
  hero:    elevation 10, blur 24, opacity 0.25, color primary-500
  glow:    elevation 4, blur 20, opacity 0.40, color primary-500
```

### 2.7 Animations (Reanimated v4)

```
DURATIONS
  instant:   100ms  — toggles, micro-interactions
  fast:      200ms  — button presses, icon changes
  normal:    300ms  — standard transitions
  slow:      500ms  — modal reveals, important state changes
  dramatic:  800ms  — onboarding, scan verdict reveal

SPRINGS
  default:   damping 15, stiffness 150, mass 1
  bouncy:    damping 10, stiffness 180, mass 0.8
  stiff:     damping 20, stiffness 300, mass 1

STAGGER
  list items:  60ms entre elements
  grid items:  80ms (2D stagger)
  hero reveal: 120ms entre sections

EASINGS
  easeOut:     cubic bezier deceleration
  overshoot:   bezier(0.34, 1.56, 0.64, 1)

ENTRY PATTERNS
  ecran:       FadeInDown stagger 60ms
  modal:       SlideInUp + FadeIn 500ms
  verdict:     ZoomIn + pulsation halo 800ms
  card:        FadeInDown + scale(0.95→1) stagger
  tab switch:  fade 200ms crossfade
```

---

## 3. CARTOGRAPHIE ECRAN PAR ECRAN

### 3.1 HOME — "Le Dashboard Conscient"

**Score actuel**: 6.4/10 → **Cible**: 9.5/10

```
┌─────────────────────────────────────┐
│  ← Motif geometrique SVG subtil →   │  Background: tessellation opacity 0.03
│                                     │
│  ﷽                                  │  Calligraphie arabe decorative (bg)
│                                     │
│  Salam, {prénom} 👋                 │  Greeting i18n + emoji
│  ★ Niveau 7 · 2,450 XP             │  Gamification pill (gold accent)
│  [🔔 3]                    [⚙️]     │  Notification + Settings (top right)
│                                     │
│  ┌─────── IMPACT DU JOUR ─────────┐ │  Card glassmorphism
│  │  🏆 142 produits scannes       │ │  Stats from userDashboard
│  │  🛡️ 23 additifs evites         │ │  Stats from userDashboard
│  │  🔥 12 jours de suite          │ │  Streak counter
│  └─────────────────────────────────┘ │
│                                     │
│  ─── Actions Rapides ───────────── │  Arabesque separator
│  ┌──────┐ ┌──────┐                 │
│  │ 📷   │ │ 🗺️   │                 │  2x2 Grid with GlowCard
│  │Scan  │ │Carte │                 │  Each with glow + icon
│  ├──────┤ ├──────┤                 │
│  │ 🛒   │ │ 📊   │                 │
│  │Market│ │Histo │                 │  Marketplace + Historique
│  └──────┘ └──────┘                 │
│                                     │
│  ─── A la Une ──────────────────── │  Arabesque separator
│  ┌─────────┐ ┌─────────┐          │  Horizontal ScrollView
│  │ ALERTE  │ │ ARTICLE │          │  Alert cards + Article cards
│  │ 🚨 BDS  │ │ 📰 Blog │          │  Mixed content carousel
│  └─────────┘ └─────────┘          │  snap-to-interval
│                                     │
│  ─── Mes Favoris ───────────────── │  Arabesque separator
│  (●) (●) (●) (●) (●) →            │  Instagram-style circles
│  Riz  Yaourt Poulet Lait +         │  With gradient ring (primary→gold)
│                                     │
│  ─── Pres de Moi ───────────────── │  NEW: Nearby stores section
│  ┌────────────────┐                │  From store.findNearby API
│  │ 🏪 Boucherie    │                │  2-3 closest halal stores
│  │    Al-Baraka    │                │  Distance + rating
│  └────────────────┘                │
└─────────────────────────────────────┘
```

**Donnees API utilisees** (actuel + nouvelles):

| Section | Procedure tRPC | Champs affiches | NOUVEAU? |
|---------|---------------|-----------------|----------|
| Greeting | `auth.me` | firstName, level, xp | Non |
| Stats pill | `stats.userDashboard` | scansTotal, additivesAvoided, streak | Non |
| Notifications | `notification.getUnreadCount` | count | Non |
| Quick Actions | Navigation | Static icons + router.push | Non |
| A la Une | `alert.list` + `article.list` | title, severity, imageUrl, source | Non |
| Favoris | `favorites.list` | productName, imageUrl, halalStatus | Non |
| Pres de Moi | `store.findNearby` | name, distance, rating, category | **OUI** |

**Donnees backend non exploitees — a integrer**:

| Procedure | Donnees disponibles | Integration proposee |
|-----------|--------------------|-----------------------|
| `loyalty.getBalance` | points, tier, nextTierPoints | Afficher dans stats pill |
| `stats.leaderboard` | top users, user rank | Mini leaderboard widget |
| `article.list` | articles halal education | Carousel "A la Une" |
| `scan.recentScans` | 5 derniers scans | Section "Scans Recents" (optionnel) |

**Animations**:
- Hero gradient: parallax sur scroll (interpolation 0→150px)
- Stats cards: FadeInDown stagger 60ms
- Quick actions: scale(0.95→1) avec spring bouncy
- Favoris circles: FadeIn + rotation subtile du gradient ring
- Motif geometrique background: pulse tres lent (4s) opacity 0.02→0.04

---

### 3.2 SCANNER — "Le Rituel Sacre"

**Score actuel**: 8.4/10 → **Cible**: 9.8/10

```
┌─────────────────────────────────────┐
│                                     │  Full-screen camera
│         [🔦]              [🔄]     │  Flash + Switch camera
│                                     │
│    ┌─── ─── ─── ───┐               │  Scan frame = arche islamique
│    │                │               │  Corners with primary glow
│    │    ═══════     │               │  Animated scan line (gradient)
│    │    ║     ║     │               │  Pulse glow on corners
│    │    ═══════     │               │
│    └─── ─── ─── ───┘               │
│                                     │
│    "Placez le code-barres           │  Instruction text (i18n)
│     dans le cadre"                  │  FadeIn + pulse subtle
│                                     │
│  ┌─────┐  ┌─────────┐  ┌─────┐    │  Bottom dock
│  │ 📸  │  │  ● SCAN  │  │ 📋  │    │  Gallery | Capture | History
│  │Galerie│ │ (pulse) │  │Histo│    │  Center = oversized + halo
│  └─────┘  └─────────┘  └─────┘    │
│                                     │
│  Motif geometrique subtil (overlay) │  SVG pattern opacity 0.02
└─────────────────────────────────────┘
```

**Ameliorations Killer**:
1. **Cadre de scan** = forme inspiree d'une arche islamique (pas un simple rectangle)
2. **Scan line** = gradient primary avec particules lumineuses
3. **Son de scan** = micro-son satisfaisant (optionnel, toggle dans settings)
4. **Transition vers resultat** = Shared Element Transition du cadre → cercle verdict
5. **Corner glow** = pulsation synchronisee avec `hapticFeedback.light`
6. **Motif geometrique** = overlay tres subtil sur la zone hors cadre

**Corrections**:
- `brand.primary` deja utilise (theme migre)
- `cancelAnimation()` sur unmount pour les 3 Reanimated loops
- Gallery → implementer extraction barcode depuis image (expo-camera ML)

---

### 3.3 SCAN RESULT — "Le Verdict Sacre" (FLAGSHIP)

**Score actuel**: 6.9/10 → **Cible**: 10/10

```
┌─────────────────────────────────────┐
│                                     │
│  ← HERO SECTION (50% viewport) →   │  Dynamic gradient bg per status
│                                     │
│  [←]                        [⋯]    │  Back + More options
│                                     │
│         ╔═══════════╗               │  Octagonal frame (Khatam star)
│        ╱  ✅ HALAL   ╲              │  Status icon + verdict text
│       ╱   CERTIFIE    ╲             │  Animated entrance ZoomIn 800ms
│      ╱                  ╲            │
│     ╱   ┌──────────┐    ╲           │  Trust ring = octagonal
│    ╱    │ SCORE 87% │     ╲          │  Animated stroke-dashoffset
│     ╲   └──────────┘    ╱           │  Counter 0→87 animated
│      ╲                 ╱            │
│       ╲  حَلَالٌ طَيِّبٌ  ╱             │  Arabic calligraphy (halal only)
│        ╲═════════════╱              │  Amiri Bold, primary color
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 📦 Nom du Produit             │  │  Product info card
│  │ 🏢 Marque · 500g              │  │  Brand, weight
│  │ 🏅 Certifie par: AVS          │  │  Certifier name + logo
│  │ ★★★★☆ Confiance: Elevee       │  │  Trust level (new!)
│  └───────────────────────────────┘  │
│                                     │
│  ─── Arabesque separator ──────── │
│                                     │
│  🚨 ALERTE BOYCOTT                 │  Boycott banner (if active)
│  BDS - Produit de marque X         │  Red accent, source link
│                                     │
│  ▸ Pourquoi ce statut?         [v] │  Collapsible: analysis source
│    • Source: OpenFoodFacts          │
│    • Algorithme: score 87/100       │
│    • Certifieur: AVS (tier 1)       │
│    • Madhab: Shafi'i compatible     │  NEW: madhab-specific info
│                                     │
│  ▸ Ingredients (12)            [v] │  Collapsible: ingredient list
│    ● Eau                    ✅      │  Color-coded dots
│    ● Farine de ble          ✅      │
│    ● E621 (Glutamate)       ⚠️      │  Warning highlight
│    ● Gelatine               ❌      │  Red = haram ingredient
│                                     │
│  ▸ Additifs (3)               [v] │  Collapsible: additives
│    E621 — Glutamate monosodique    │  Name + risk level
│    Risque: Moyen · Madhab: Autorise │  NEW: madhab ruling
│                                     │
│  ▸ Nutrition                  [v] │  Collapsible
│    [A] [B] [C] [D] [E]             │  Nutri-Score badges
│    NOVA: 3 · Eco: B                │  NOVA + Eco scores
│                                     │
│  ▸ Allergenes                 [v] │  Collapsible
│    [Gluten] [Lait] [Oeufs]         │  Chip tags per allergen
│    ⚠️ Correspond a votre profil     │  NEW: personal alert
│                                     │
│  ▸ Alternatives Halal (3)     [v] │  NEW section
│    ┌────────┐ ┌────────┐           │  From product.getAlternatives
│    │ Prod A │ │ Prod B │           │  Halal-certified alternatives
│    │ ✅ Halal│ │ ✅ Halal│           │
│    └────────┘ └────────┘           │
│                                     │
│  ─── "Votre Avis Compte" ─────── │  NEW section
│    Cette analyse est-elle utile?    │
│    [👍 Oui]  [👎 Non]  [🚩 Signaler]│  review.submitReview API
│                                     │
│  ┌═══════════════════════════════┐  │  Fixed bottom bar
│  │  ❤️    📤    🗺️ OU ACHETER    🚩│  │  Glassmorphism BlurView
│  │  Fav  Share  PRIMARY CTA   Flag│  │  Primary CTA = green gradient
│  └═══════════════════════════════┘  │  Haptic on each tap
│                                     │
└─────────────────────────────────────┘
```

**Donnees API utilisees** (actuel + nouvelles):

| Section | Procedure tRPC | Donnees | NOUVEAU? |
|---------|---------------|---------|----------|
| Verdict | `scan.scanBarcode` | halalStatus, confidence, certifier | Non |
| Product | `scan.scanBarcode` | name, brand, weight, imageUrl | Non |
| Boycott | `scan.scanBarcode` | boycottTargets[] | Non |
| Ingredients | `scan.scanBarcode` | ingredients[], halalStatus per item | Non |
| Additives | `scan.scanBarcode` | additives[] | Non |
| Nutrition | `scan.scanBarcode` | nutriScore, novaGroup, ecoScore | Non |
| Allergens | `scan.scanBarcode` | allergens[] | Non |
| Certifier | `scan.scanBarcode` | certifier name, tier | Non |
| Madhab ruling | `additive.getRuling` | madhab-specific halal ruling | **OUI** |
| Alternatives | `product.getAlternatives` | alternative products halal | **OUI** |
| User review | `review.submitReview` | helpfulness vote | **OUI** |
| Personal alerts | `health.checkAllergens` | user-specific warnings | **OUI** |

**Animations**:
- Verdict hero: ZoomIn 800ms + halo glow pulsation
- Trust ring: SVG animated stroke-dashoffset (octagonal path)
- Counter: interpolated 0→score avec easing overshoot
- Calligraphie arabe: FadeIn 600ms delayed 400ms
- Sections collapsibles: spring stiff pour expand/collapse
- Bottom bar: SlideInUp 300ms avec blur transition

**Corrections critiques**:
- Trust score counter: remplacer 30x setTimeout par `useSharedValue` interpolation
- Boycott: ajouter navigation vers `sourceUrl`
- Ingredient matching: support multi-mots ("monosodium glutamate" = "MSG")

---

### 3.4 ALERTS/VIGILANCE — "Le Radar Ethique"

**Score actuel**: 7.3/10 → **Cible**: 9.0/10

```
┌─────────────────────────────────────┐
│  🔔 Veille Ethique            [⚙️]  │  Header with settings
│                                     │
│  [Tout] [🚨Boycott] [🏅Certif]     │  Severity filter chips
│  [🏥Sante] [📋Politique]           │  Horizontal scroll
│                                     │
│  ─── Aujourd'hui ───────────────── │  Timeline grouped by day
│                                     │
│  │ 🔴 CRITIQUE                      │  Timeline dot + vertical line
│  │ ┌──────────────────────────────┐ │
│  │ │ 🚨 Rappel produit XYZ       │ │  Alert card with image
│  │ │ Contamination detectee       │ │  Source + timestamp
│  │ │ Source: DGCCRF · 2h ago      │ │  NEW: source link clickable
│  │ │ [📎 Voir le rapport]          │ │
│  │ └──────────────────────────────┘ │
│  │                                  │
│  │ 🟡 IMPORTANT                     │
│  │ ┌──────────────────────────────┐ │
│  │ │ 📋 BDS: Nouvelle marque       │ │  Boycott alert
│  │ │ ajoutee a la liste           │ │
│  │ │ Source: BDS France · 5h ago  │ │
│  │ └──────────────────────────────┘ │
│  │                                  │
│  ─── Hier ──────────────────────── │
│  │ 🔵 INFO                         │
│  │ ┌──────────────────────────────┐ │
│  │ │ 🏅 Nouvelle certification     │ │  Certification alert
│  │ │ MCI obtient label europeen   │ │
│  │ │ Source: MCI.fr · 1 jour ago  │ │
│  │ └──────────────────────────────┘ │
│  │                                  │
│  [Charger plus...]                  │  NEW: Cursor pagination
└─────────────────────────────────────┘
```

**Ameliorations**:
1. **Pagination cursor** — Remplacer `limit: 20` par infinite scroll avec cursor
2. **Source URL clickable** — `onPress` handler sur le lien source
3. **Groupement temporel** — "Aujourd'hui", "Hier", "Cette semaine" au lieu de flat list
4. **Card images** — Critical alerts avec image hero + scrim overlay
5. **Quick actions** — Swipe-to-archive, tap-to-expand
6. **Personal relevance** — Badge "Concerne vos favoris" si un produit favori est impacte

---

### 3.5 MARKETPLACE — "Le Souk Premium"

**Score actuel**: 4.9/10 → **Cible**: 8.5/10

**Decision**: Le marketplace reste en "Coming Soon" MAIS avec une experience premium d'attente.

```
┌─────────────────────────────────────┐
│  🛒 Marketplace Halal         [🔔]  │
│                                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││  Hero card with gradient
│  │  ┌─── Motif geometrique ───┐   ││  Islamic pattern background
│  │  │                         │   ││
│  │  │  🛒 Le Souk Halal       │   ││  Gold accent title
│  │  │  Premium arrive bientot │   ││
│  │  │                         │   ││
│  │  │  Produits 100% certifies│   ││  Value proposition
│  │  │  livres chez vous       │   ││
│  │  │                         │   ││
│  │  │  ┌─────────────────┐    │   ││  Waitlist CTA
│  │  │  │ 🔔 Etre Prevenu  │    │   ││  Primary button + glow
│  │  │  └─────────────────┘    │   ││
│  │  │  1,247 inscrits         │   ││  NEW: Social proof counter
│  │  └─────────────────────────┘   ││
│  └─────────────────────────────────┘│
│                                     │
│  ─── En Attendant... ───────────── │
│                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ │  Partner stores nearby
│  │ 🏪     │ │ 🏪     │ │ 🏪     │ │  From store.findNearby
│  │Al-Bara │ │Boucherie│ │Epicerie│ │
│  │ 800m   │ │ 1.2km  │ │ 500m   │ │  Distance + CTA map
│  └────────┘ └────────┘ └────────┘ │
│                                     │
│  ─── Tendances ─────────────────── │
│  ┌─────────────────────────────────┐│  NEW: Top scanned products
│  │ 📊 Top produits scannes         ││  From stats leaderboard
│  │ 1. Yaourt X — ✅ Halal          ││  Community data
│  │ 2. Biscuits Y — ⚠️ Doubtful     ││
│  │ 3. Jus Z — ✅ Halal             ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

### 3.6 PROFILE — "Le Guerrier Conscient"

**Score actuel**: 7.9/10 → **Cible**: 9.5/10

```
┌─────────────────────────────────────┐
│  [⚙️]                         [🔔]  │  Settings + Notifications
│                                     │
│           ┌─────────┐              │
│           │  AVATAR  │              │  Avatar with primary glow ring
│           │  + edit  │              │  Gradient ring animation
│           └─────────┘              │
│      Youssef El-Mansouri           │  Name
│      Consommateur Conscient ⭐      │  Title badge (gold)
│                                     │
│  ┌─────────────────────────────────┐│  Gamification hero card
│  │  ★ Niveau 7                     ││  Level + XP bar
│  │  ████████████░░░ 2450/3000 XP   ││  Animated progress
│  │  🎯 550 XP pour Niveau 8        ││  Next level hint
│  │  ─── Motif geometrique ──────  ││  Decorative Islamic pattern
│  └─────────────────────────────────┘│
│                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ │  Stats trio
│  │ 🔥 12  │ │ 📷 142 │ │ 💰 2.4k│ │  Streak | Scans | Points
│  │ jours  │ │ scans  │ │ points │ │  Animated counters
│  └────────┘ └────────┘ └────────┘ │
│                                     │
│  ─── Badges Collection ─────────── │  NEW horizontal scroll
│  (🏅) (🥇) (🎖️) (🔒) (🔒) →       │  Earned + locked badges
│  First  100   Week  50    Rama     │  From loyalty system
│  Scan  Scans  Streak Fav  dan     │
│                                     │
│  ─── Preferences ───────────────── │  Arabesque separator
│  📋 Ecole juridique (Madhab)    → │  madhab.getUserPreference
│  🏅 Certifications preferees    → │  certifier.getRankings
│  🏥 Profil sante              → │  health.getUserProfile
│  🚫 Exclusions alimentaires    → │  exclusions list
│  🔔 Notifications             → │  notification settings
│  🌙 Apparence                 → │  Theme toggle
│  🌐 Langue                    → │  Language selector
│                                     │
│  ─── Compte ────────────────────── │
│  📊 Historique des scans       → │  scan.recentScans
│  ❤️ Mes favoris                → │  favorites.list
│  📝 Mes signalements           → │  report.getUserReports
│  📤 Exporter mes donnees       → │  RGPD export
│  🗑️ Supprimer mon compte       → │  account deletion
│                                     │
│  [🚪 Deconnexion]                  │  Red text, confirm dialog
│                                     │
│  v2.1.0 · Made with ❤️ & ☪️        │  Dynamic version
└─────────────────────────────────────┘
```

**Nouvelles donnees backend**:

| Section | Procedure | NOUVEAU? |
|---------|-----------|----------|
| Badge collection | `loyalty.getBadges` | **OUI** |
| Madhab | `madhab.getUserPreference` | Non |
| Certifier ranking | `certifier.getRankings` | Non |
| Health profile | `health.getUserProfile` | Non |
| Reports history | `report.getUserReports` | **OUI** |

---

### 3.7 AUTH SCREENS — "La Porte du Sanctuaire"

**Score actuel**: 8.0/10 → **Cible**: 9.0/10

**Welcome Screen**:
```
┌─────────────────────────────────────┐
│                                     │
│  ← Motif geometrique anime →       │  Full-screen tessellation bg
│  ← opacity 0.04, pulse lent →      │  Primary color, very subtle
│                                     │
│         ┌──────────┐               │
│         │   LOGO   │               │  App icon with glow
│         │  ☪️ + ✅  │               │  Animated entrance
│         └──────────┘               │
│                                     │
│      OPTIMUS HALAL                 │  Inter Black 30px
│   Consommez en toute confiance     │  Inter Medium 16px, secondary
│                                     │
│  ┌─────────────────────────────────┐│  Magic Link CTA
│  │  ✉️ Connexion par email magic   ││  Primary gradient + glow
│  └─────────────────────────────────┘│  Haptic medium
│                                     │
│  ─── ou ────────────────────────── │  Divider
│                                     │
│  ┌─────────────────────────────────┐│  Traditional login
│  │  📧 Se connecter avec email     ││  Secondary button
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│  NEW: Social auth
│  │  🍎 Apple   │  🔵 Google        ││  Side by side
│  └─────────────────────────────────┘│
│                                     │
│  ✅ Scanner 1M+ produits           │  Benefits list
│  🛡️ 50+ certifications verifiees  │
│  🗺️ Magasins halal pres de vous   │
│  🚫 Boycott BDS en temps reel     │
│                                     │
│  CGU · Politique de confidentialite│  Footer links
└─────────────────────────────────────┘
```

**Login/Signup**:
- Background: motif geometrique subtil (meme pattern que welcome mais plus discret)
- Form fields: rounded-xl, border subtle, focus = primary glow
- Errors: inline sous le champ (pas `Alert.alert`)
- Password: visibility toggle eye icon
- Biometric: Face ID / Touch ID button avec animation
- Social auth: Google + Apple buttons (implementer reellement)

---

### 3.8 ONBOARDING — "L'Initiation"

**Score actuel**: ~7/10 → **Cible**: 9.5/10

```
Slide 1: "Scannez en Confiance"
  - Animation: phone scanning a product → verdict appears
  - Background: motif geometrique large, primary color
  - Calligraphie: "بِسْمِ ٱللَّٰهِ" subtile

Slide 2: "Selon Votre Ecole"
  - Animation: 4 madhab icons → user selects one
  - Mini-wizard: selector madhab integre (pas juste info)
  - Background: gold accent

Slide 3: "Votre Profil Sante"
  - Animation: allergens/exclusions toggle
  - Mini-wizard: quick exclusion selector
  - Background: primary gradient

Slide 4: "Rejoignez la Communaute"
  - Animation: counter "1M+ produits scannes"
  - Social proof: "Rejoint par 50,000+ familles"
  - CTA: "Commencer" (primary glow button)
  - Background: motif geometrique + calligraphie
```

---

### 3.9 MAP — "La Boussole Halal"

**Score actuel**: 5.8/10 → **Cible**: 8.5/10

```
┌─────────────────────────────────────┐
│  🔍 Rechercher un lieu halal...     │  Search bar
│                                     │
│  [🥩Boucherie] [🍽️Resto] [🛒Epicerie]│  Category chips
│  [⭐4+] [🏅Certifie]               │  Filter chips
│                                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││  MapView (react-native-maps)
│  │    📍        📍                  ││  Custom markers per category
│  │         📍                      ││  Clustered markers
│  │    📍              📍            ││
│  │              [📍]               ││  User location (pulsing blue)
│  │                                 ││
│  │                        [🎯]     ││  Recenter button
│  └─────────────────────────────────┘│
│                                     │
│  ─── Pres de Vous (5) ─────────── │  Bottom sheet (draggable)
│  ┌─────────────────────────────────┐│
│  │ 🏪 Boucherie Al-Baraka         ││  Store card
│  │ ⭐ 4.8 · 800m · Ouvert         ││  Rating + Distance + Status
│  │ 🏅 AVS Certifie                ││  Certification badge
│  │ [📞 Appeler] [🗺️ Y Aller]       ││  Quick actions
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ 🍽️ Restaurant Le Jasmin         ││
│  │ ⭐ 4.5 · 1.2km · Ouvert        ││
│  │ 🏅 MCI Certifie                ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Backend deja disponible**: `store.findNearby`, `store.getById`, `store.search`

---

### 3.10 REPORT — "Le Signalement Citoyen"

**Score actuel**: 8.0/10 → **Cible**: 9.0/10

**Changement majeur**: Transformer en BottomSheet au lieu de pleine page.

```
┌─────────────────────────────────────┐
│  ─── Glisser pour fermer ───────── │  Drag handle
│                                     │
│  🚩 Signaler un Probleme           │  Title
│  ████░░░░░░░ 33%                   │  Progress bar
│                                     │
│  Type de violation:                 │
│  ┌──────┐ ┌──────┐                 │
│  │ ❌    │ │ 🏷️    │                 │  2x2 grid
│  │Faux  │ │Labels │                 │
│  │Halal │ │Tromp. │                 │
│  ├──────┤ ├──────┤                 │
│  │ ⚠️    │ │ 🏭    │                 │
│  │Sante │ │Ethique│                 │
│  └──────┘ └──────┘                 │
│                                     │
│  📝 Details:                        │
│  ┌─────────────────────────────────┐│
│  │ Decrivez le probleme...         ││  Textarea
│  └─────────────────────────────────┘│
│                                     │
│  📷 Photos (0/5):                   │
│  [+ Ajouter]                       │
│                                     │
│  ☐ Autoriser le suivi              │  Toggle
│                                     │
│  [🚩 Envoyer le Signalement]       │  Primary CTA
└─────────────────────────────────────┘
```

---

## 4. COMPOSANTS A CREER

### 4.1 Nouveaux Composants

| Composant | Description | Props cles |
|-----------|-------------|------------|
| **GlowCard** | Card avec shadow glow primary configurable | `glowColor`, `glowIntensity: subtle\|medium\|strong` |
| **HeroStatus** | Cercle verdict octagonal (Khatam) anime | `status`, `confidence`, `animated` |
| **ShimmerSkeleton** | Skeleton avec gradient shimmer brande | `shimmerColor`, gradient primary |
| **BottomSheet** | Modal bottom sheet avec gesture | `snapPoints`, `onClose`, swipe-to-dismiss |
| **StatusPill** | Pill animee halal/haram/doubtful | `status`, `size`, `animated` |
| **IslamicPattern** | SVG motif geometrique configurable | `pattern: tessellation\|arabesque\|khatam`, `opacity`, `color` |
| **ArabicCalligraphy** | Texte decoratif en calligraphie arabe | `text`, `style: thuluth\|naskh`, `color` |
| **TrustRing** | Ring de confiance octagonal anime | `score`, `color`, `size` |
| **SectionSeparator** | Separateur avec motif arabesque | `variant: line\|arabesque\|dots` |
| **BadgeCollection** | Horizontal scroll de badges earned/locked | `badges[]`, `onBadgePress` |

### 4.2 Composants Existants a Ameliorer

| Composant | Amelioration |
|-----------|-------------|
| **Button** | + variante `glow` avec shadow verte |
| **Card** | + variante `hero` avec gradient background |
| **Badge** | + animation entree scale + FadeIn |
| **Skeleton** | + shimmer gradient brande |
| **EmptyState** | + illustrations SVG avec motif islamique |
| **PremiumTabBar** | + labels i18n, + center glow pulse, + arche islamique shape |

---

## 5. DONNEES BACKEND NON EXPLOITEES

### Procedures disponibles mais non utilisees par le frontend

| Router | Procedure | Potentiel UX |
|--------|-----------|-------------|
| `product` | `getAlternatives` | Section "Alternatives Halal" dans scan result |
| `additive` | `getRuling` | Avis madhab-specifique par additif |
| `review` | `submitReview` | Vote "Cette analyse est-elle utile?" |
| `review` | `getHelpfulness` | Afficher % de votes positifs |
| `store` | `getHours` | Horaires d'ouverture dans la carte |
| `store` | `findNearby` | Section "Pres de Moi" sur Home |
| `certifier` | `getPractices` | Detail des pratiques du certifieur |
| `loyalty` | `getBadges` | Collection de badges dans le profil |
| `loyalty` | `getLeaderboard` | Classement communautaire |
| `stats` | `communityStats` | Stats communaute globales |
| `article` | `getByCategory` | Articles filtres par categorie |
| `health` | `checkAllergens` | Alertes allergenes personnalisees |

**Impact**: Integrer ces 12 procedures = +40% de contenu affiche sans aucun travail backend.

---

## 6. CORRECTIONS TECHNIQUES CRITIQUES

| # | Issue | Fichier | Fix |
|---|-------|---------|-----|
| 1 | 28 strings FR hardcodees | Multi-fichiers | Migrer vers i18n keys |
| 2 | 6 fichiers importent `@/constants/theme` | PremiumTabBar, etc. | Migrer vers `@/theme` |
| 3 | ~40 hex hardcodes `#1de560`/`#2bee6c` | Multi-fichiers | Remplacer par `brand.primary` |
| 4 | setTimeout x30 sans cleanup | scan-result.tsx:171-176 | `useSharedValue` interpolation |
| 5 | setInterval x5 sans cleanup | PremiumTabBar | Reanimated `useAnimatedReaction` |
| 6 | cancelAnimation manquant | scanner.tsx | Cleanup sur unmount |
| 7 | Pagination absente | alerts.tsx | Cursor-based infinite scroll |
| 8 | Source URL non cliquable | alerts.tsx | `Linking.openURL(sourceUrl)` |
| 9 | `getStatusConfig()` recree objet | scan-result.tsx | Memoiser en constante |
| 10 | Biometric = Alert("Coming Soon") | login.tsx | Implementer ou masquer |

---

## 7. METRIQUES DE SUCCES

| Metrique | Actuel | Cible 2026 |
|----------|--------|------------|
| Design score moyen | 6.5/10 | 9.0/10 |
| Temps verdict (scan→halal) | ~3s | <1s |
| Ecrans avec motifs islamiques | 0 | 8+ |
| Procedures backend utilisees | ~30/91 | 60+/91 |
| Strings hardcodees FR | 28 | 0 |
| Composants design system | 12 | 22 |
| Animation coverage | 40% | 90% |
| a11y WCAG AA compliance | 85% | 100% |

---

## 8. PHILOSOPHIE "KILLER 2026"

### Ce qui differencie Optimus Halal des concurrents

| Aspect | Yuka | Muslim Pro | Zabihah | **Optimus Halal** |
|--------|------|-----------|---------|-------------------|
| Design | Minimaliste | Fonctionnel | Basique | **Premium + Heritage** |
| Verdict halal | Non | Non | Manuel | **IA + Certifieurs + Madhab** |
| Motifs islamiques | Non | Generiques | Non | **Geometrie authentique** |
| Calligraphie | Non | Basique | Non | **Decorative sophistiquee** |
| Dark mode | Oui | Basique | Non | **Forest theme vert profond** |
| Gamification | Non | Basique | Non | **Full RPG (XP, badges, streak)** |
| Boycott | Non | Non | Non | **BDS temps reel** |
| Animations | Basiques | Non | Non | **Reanimated v4 full** |
| Communaute | Non | Oui | Avis | **Votes + leaderboard** |
| i18n | Oui | Oui | Oui | **3 langues + RTL natif** |

### Les 3 differenciateurs "world killer"

1. **Heritage visuel islamique** — Personne ne fait ca. Les motifs geometriques et la calligraphie ne sont pas "decoration", ils sont IDENTITE. Chaque musulman qui ouvre l'app ressent immediatement que c'est POUR LUI.

2. **Verdict en <1 seconde** — Le Hero 50% viewport avec le statut halal octagonal n'existe nulle part. L'utilisateur n'a meme pas besoin de LIRE — la couleur et la forme suffisent.

3. **Transparence radicale** — "Pourquoi ce statut?" collapsible avec source, algorithme, certifieur, ET avis madhab. Aucune autre app ne montre son travail a ce point.

---

*Design spec generee le 18 Fevrier 2026*
*Agent team: Claude Opus 4.6 Lead CTO + 5 agents specialises*
*Approche: A — Fintech Ethique Premium + Heritage Islamique*
