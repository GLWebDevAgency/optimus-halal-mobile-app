# Optimus Halal — Produit et Technologie

---

## Le Produit Aujourd'hui

### Application Mobile (iOS + Android)

Optimus Halal est une application mobile native construite avec Expo (React Native), deployee sur iOS et Android a partir d'une base de code unique.

**44 ecrans** couvrant :
- Authentification (email/password + magic link)
- Scanner de produits par code-barres
- Resultats detailles avec verdicts personnalises
- Carte interactive des commerces halal
- Alertes sanitaires et communautaires
- Gamification (niveaux, XP, achievements, streaks)
- Profil personnalise (madhab, sante, exclusions, langue)
- Articles educatifs et contenu
- Marketplace (prepare, en mode "Coming Soon")

### Backend Robuste

Un serveur Node.js/TypeScript avec :
- **17 routers API** couvrant 86 procedures (queries + mutations)
- **34 tables** PostgreSQL avec PostGIS pour la geolocalisation
- **154 additifs** analyses avec 22 avis specifiques par ecole juridique
- **212+ commerces** geolocates et certifies
- Cache Redis intelligent, rate limiting, monitoring Sentry

---

## Architecture Technique

```
┌─────────────────────────────┐
│     Application Mobile      │
│  Expo SDK 54 / React Native │
│  Expo Router / TypeScript   │
└──────────┬──────────────────┘
           │ tRPC v11 (typage de bout en bout)
           │
┌──────────▼──────────────────┐
│     Backend API             │
│  Hono + tRPC + Drizzle ORM │
│  Node.js 22                 │
├─────────────────────────────┤
│  PostgreSQL     Redis       │
│  + PostGIS      (cache)     │
└──────────┬──────────────────┘
           │
┌──────────▼──────────────────┐
│     Railway (Cloud)         │
│  Deploiement automatique    │
│  HTTPS, healthcheck, logs   │
└─────────────────────────────┘
```

### Choix Techniques Cles

| Choix | Justification |
|-------|---------------|
| **Expo (React Native)** | Une base de code pour iOS + Android, ecosysteme mature, mises a jour OTA |
| **tRPC** | Type-safety de bout en bout : le mobile et le backend partagent les memes types TypeScript |
| **PostgreSQL + PostGIS** | Base relationnelle solide + requetes geospatiales natives pour la carte |
| **Railway** | Deploiement simple, cout maitrise, scaling automatique |
| **Drizzle ORM** | ORM TypeScript leger avec migrations versionees |

### Securite

- Mots de passe hashes avec Argon2 (standard cryptographique le plus resistant)
- JWT avec rotation automatique (access token 15min, refresh token 30 jours)
- Rate limiting sur les endpoints sensibles
- HTTPS partout, donnees sensibles chiffrees
- Monitoring des erreurs et crashes via Sentry

---

## Donnees et Intelligence

### Sources de Donnees

| Source | Contenu | Utilisation |
|--------|---------|-------------|
| **OpenFoodFacts** | 3M+ produits, ingredients, labels | Source primaire pour le scan |
| **Base proprietaire** | 154 additifs, 22 avis par ecole | Verdicts personnalises |
| **Certifications** | 18 organismes references | Scoring de fiabilite |
| **Communaute** | Signalements, avis, corrections | Enrichissement continu |
| **Commerces** | 212+ points de vente geolocates | Carte interactive |

### Le Pipeline de Scan

```
Produit scanne → Code-barres lu
    → Recherche OpenFoodFacts (ingredients, labels)
    → Analyse des additifs (154 E-numbers mappes)
    → Application du madhab de l'utilisateur
    → Score de confiance calcule
    → Verdict affiche avec sources
    → Alternatives proposees si douteux/non conforme
```

**Temps moyen : 350ms** du scan au verdict.

### Personalisation par Ecole Juridique

Les 4 ecoles de jurisprudence islamique (Hanafi, Maliki, Shafi'i, Hanbali) ont des avis differents sur certains ingredients. Exemple concret :

**E471 (mono- et diglycerides d'acides gras)** — Present dans 70% des produits industriels :
- Ecole Hanafite : autorise si transformation chimique complete (istihalah)
- Ecole Malikite : douteux si l'origine animale n'est pas confirmee
- Ecole Shafi'ite : interdit si origine porcine, autorise si vegetal
- Ecole Hanbalite : interdit si origine animale non verifiee

L'utilisateur choisit son ecole, et les verdicts s'adaptent automatiquement.

---

## Design et Experience Utilisateur

### Design System Complet

- **5 modules de theme** : couleurs, typographie, espacement, ombres, animations
- **Dark mode signature** : accents dores pour une identite premium nocturne
- **Glass-morphism** optimise pour mobile (pas de blur couteux)
- **Animations spring** fluides a 60 FPS (react-native-reanimated)
- **Feedback haptique** adapte au contexte (succes, attention, alerte)

### 32 composants reexploitables

Un design system complet avec : Avatar, Badge, Button, Card, Chip, GlowCard, IconButton, Input, StatusPill, TrustRing, IslamicPattern, et plus encore.

### Accessibilite

- Roles d'accessibilite sur tous les elements interactifs
- Labels descriptifs pour VoiceOver/TalkBack
- Support RTL natif pour l'arabe
- 3 langues : francais, anglais, arabe

---

## Infrastructure et Couts

### Couts d'Infrastructure Mensuels

| Service | Cout mensuel |
|---------|-------------|
| Railway (serveur + DB + Redis) | ~50 EUR |
| Apple Developer Account | ~8 EUR |
| Mapbox (tier gratuit) | 0 EUR |
| Sentry (tier gratuit) | 0 EUR |
| PostHog (tier gratuit) | 0 EUR |
| **Total** | **~60 EUR/mois** |

L'architecture est concue pour etre **rentable a micro-echelle** : 20 abonnes premium suffisent a couvrir l'infrastructure.

### Scalabilite

- PostgreSQL + PostGIS supporte des millions de lignes
- Redis cache les requetes frequentes (stores nearby, scans recents)
- Railway scale horizontalement a la demande
- Le code est structure en modules independants (17 routers)

---

## Feuille de Route Technique

| Horizon | Fonctionnalite | Stack |
|---------|---------------|-------|
| **V1 (actuel)** | Scanner + Carte + Gamification | Expo 54 + tRPC + PostgreSQL |
| **V1.5** | Trust Score Commerces | Algorithme de scoring + migration DB |
| **V2** | Scan Cosmetique + Marketplace catalogue | Open Beauty Facts + nouveaux routers |
| **V2.5** | Marketplace transactionnelle | RevenueCat + Stripe |
| **V3** | Module Social + Expansion multi-pays | Feed engine + i18n etendu |

---

*L'ensemble du code est TypeScript de bout en bout, teste avec Vitest (22 tests d'integration), et deploye en continu via Railway.*
