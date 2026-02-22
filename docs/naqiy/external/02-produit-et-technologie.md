# Naqiy -- Produit et Technologie

*Vue d'ensemble technique pour investisseurs et partenaires.*

---

## Le produit aujourd'hui

Naqiy est une application mobile native (iOS + Android) construite a partir d'une base de code unique. Le produit est fonctionnel, deploye en production, et couvre l'integralite du parcours utilisateur : de l'inscription au scan, de la carte interactive a la gamification.

### Chiffres cles du produit livre

| Composant | Quantite | Statut |
|-----------|----------|--------|
| Ecrans / Routes | 40 | Implementes et navigables |
| Routers API (tRPC) | 14 | Deployes en production |
| Procedures (queries + mutations) | 91+ | Operationnelles |
| Composants UI reutilisables | 19+ | Design system complet |
| Hooks custom | 8+ | Operationnels |
| Tests d'integration | 22 | Vitest, tous passants |
| Workflows CI/CD | 2 | GitHub Actions, actifs |
| Langues supportees | 3 | Francais, anglais, arabe |
| Feature flags | 14 | Configurables a distance |

---

## Les 5 piliers fonctionnels

### 1. Scanner de produits

Le coeur de Naqiy. L'utilisateur scanne un code-barres et recoit en moins de 400ms un verdict complet.

**Pipeline de scan :**

```
Code-barres lu
  -> Recherche dans la base locale (cache)
  -> Si absent : requete OpenFoodFacts (3M+ produits)
  -> Extraction des ingredients et additifs
  -> Analyse des 140+ additifs mappes
  -> Application du madhab de l'utilisateur
  -> Calcul du score de confiance
  -> Verdict affiche avec sources et justification
  -> Alternatives proposees si douteux ou non conforme
```

**Ce qui rend le scanner unique :**

| Dimension | Apps existantes | Naqiy |
|-----------|----------------|------|
| Verdict | Binaire (halal/haram) | Nuance (score de confiance + 4 ecoles + sources) |
| Additifs | Liste partielle, pas de nuance | 140+ additifs, 4 avis par ecole juridique |
| Sources | Absentes ou opaques | Affichees systematiquement |
| Alternatives | Aucune | Proposees automatiquement |
| Temps de reponse | 1-3 secondes | < 400ms |

### 2. Carte interactive des commerces halal

Carte Mapbox avec couche PostGIS. 212+ commerces verifies, avec un algorithme de pertinence qui classe les resultats selon :

- Distance geographique (rayon dynamique)
- Score communautaire (avis et notes)
- Fiabilite de la certification
- Recence des avis

**Fonctionnalites carte :**
- Geolocalisation en temps reel
- Filtres par type (boucherie, restaurant, epicerie, boulangerie)
- Fiche commerce detaillee (horaires, certifications, photos, avis)
- Navigation integree (ouverture dans Maps / Google Maps / Waze)
- Bottom sheet interactif avec chargement progressif des details

### 3. Systeme de gamification

Un systeme complet de fidelisation ethique :

| Mecanisme | Description |
|-----------|-------------|
| XP et niveaux | Progression a travers des actions utiles (scans, signalements, avis) |
| Streaks | Jours consecutifs d'utilisation, avec bonus progressifs |
| Streak freeze | Protection contre la perte de streak (max 3, cout : 50 points) |
| Milestones | Bonus XP a 3, 7, 14, 30, 60, 100 et 365 jours |
| Achievements | Badges deblocables (premier scan, 100 scans, contributeur, etc.) |
| Partage visuel | ShareCard pour partager un resultat de scan sur les reseaux sociaux |

**Principe ethique** : la gamification recompense les contributions positives (signalements, avis, partages) sans jamais punir l'inaction. Pas de notifications culpabilisantes, pas de perte de progression.

### 4. Alertes et signalements communautaires

- Alertes sanitaires en temps reel (rappels produits, changements de formulation)
- Signalements utilisateurs sur les produits et commerces
- Systeme de moderation avec queue de traitement
- Notifications push personnalisees (premium)

### 5. Profil personnalise

- Choix de l'ecole juridique (madhab)
- Profil sante (allergenes, exclusions alimentaires)
- Preferences de langue (FR/EN/AR avec support RTL natif)
- Historique de scans et favoris
- Tableau de bord gamification

---

## Architecture technique

### Vue d'ensemble

```
+-------------------------------+
|       Application Mobile      |
|    Expo SDK 54 / React 19.1   |
|    React Native 0.81.5        |
|    Expo Router (navigation)   |
|    NativeWind (styling)       |
+---------------+---------------+
                |
                | tRPC v11.10 (typage bout en bout)
                | HTTPS + JWT (access + refresh tokens)
                |
+---------------v---------------+
|         Backend API            |
|    Hono (serveur HTTP)         |
|    tRPC (procedures typees)    |
|    Drizzle ORM (requetes DB)   |
|    Node.js 22                  |
+------+----------------+-------+
       |                |
+------v------+  +------v------+
| PostgreSQL  |  |    Redis    |
| + PostGIS   |  |   (cache)   |
| (donnees +  |  |  (sessions, |
|  geo)       |  |  rate limit)|
+------+------+  +-------------+
       |
+------v---------------------------+
|         Railway (Cloud)           |
|  Deploy auto (GitHub push)        |
|  HTTPS, healthcheck, logs, scale  |
+-----------------------------------+
```

### Stack technique detaille

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Mobile** | Expo SDK 54 + React Native 0.81.5 | Base de code unique iOS/Android, ecosysteme mature, mises a jour OTA |
| **Navigation** | Expo Router | Routing file-based, deep linking natif, transitions animees |
| **Styling** | NativeWind (Tailwind) | Styling utilitaire performant, coherent avec le web |
| **Animations** | React Native Reanimated | Animations sur le thread UI, 60 FPS garanti |
| **State** | TanStack Query (via tRPC) + MMKV | Cache serveur automatique + stockage local ultra-rapide |
| **API** | tRPC v11.10 | Type-safety de bout en bout : une modification de l'API backend genere une erreur TypeScript cote mobile en temps reel |
| **Serveur** | Hono | Framework HTTP ultra-leger, <1ms d'overhead |
| **ORM** | Drizzle | ORM TypeScript avec migrations versionnees, zero runtime overhead |
| **Base de donnees** | PostgreSQL + PostGIS | Base relationnelle solide + requetes geospatiales natives |
| **Cache** | Redis | Cache intelligent (stores nearby, scans recents), rate limiting |
| **Monitoring** | Sentry (backend + mobile) | Crash reporting, traces de performance |
| **Analytics** | PostHog | Analyse comportementale, funnels, retention |
| **CI/CD** | GitHub Actions | 2 workflows, tests automatises, audit de securite |
| **Deploy** | Railway | Deploiement sur push, preview branches, scaling automatique |
| **Carte** | Mapbox GL | Rendu vectoriel performant, clustering, style personnalise |
| **Scan** | expo-barcode-scanner | Lecture code-barres natif, <100ms de detection |
| **Partage** | react-native-view-shot + expo-sharing | Capture visuelle de la ShareCard pour partage social |

### Securite

| Mesure | Implementation |
|--------|---------------|
| Hash des mots de passe | Argon2id (standard cryptographique le plus resistant) |
| Authentification | JWT avec rotation automatique (access: 15min, refresh: 30 jours) |
| Token refresh | Mutex pour eviter les conditions de course lors du refresh concurrent |
| Rate limiting | Endpoints sensibles proteges (login, register, scan) |
| Transport | HTTPS exclusif, headers de securite |
| Donnees sensibles | Tokens dans SecureStore (Keychain iOS / Keystore Android) |
| Index securise | `refresh_tokens.token_hash` indexe pour revocation rapide |
| Monitoring | Sentry pour detection d'anomalies en temps reel |
| CI/CD | `pnpm audit` integre au pipeline, audit de dependances automatise |

### Performance

| Metrique | Valeur | Comment |
|----------|--------|---------|
| Temps de scan (bout en bout) | < 400ms | Cache Redis + index PostgreSQL |
| Animations | 60 FPS | Reanimated sur le thread UI natif |
| Taille du bundle | Optimisee | Tree-shaking, code splitting par route |
| Demarrage a froid | < 2s | Chargement progressif, squelettes |
| Requetes carte | < 200ms | PostGIS avec index spatiaux GIST |

---

## Design system : identite premium

### Le "Gold Dark Mode"

Naqiy se distingue visuellement par un dark mode signature avec des accents dores. Ce choix n'est pas esthetique par hasard :

- **L'or** evoque la confiance, la purete, la valeur -- des associations culturellement fortes dans le monde islamique
- **Le dark mode** reduit la fatigue visuelle (l'app est utilisee dans les rayons de supermarche, souvent eclaires au neon)
- **Le glass-morphism** (surfaces translucides) donne une sensation de profondeur et de modernite sans compromettre la lisibilite

### Composants du design system

| Categorie | Composants |
|-----------|-----------|
| Layout | Card, GlowCard, PremiumBackground, IslamicPattern |
| Interaction | Button, IconButton, Input, Chip, StatusPill |
| Feedback | Badge, TrustRing, Avatar, LevelUpCelebration |
| Theme | 5 modules (couleurs, typographie, espacement, ombres, animations) |

### Accessibilite

| Feature | Implementation |
|---------|---------------|
| Roles ARIA | Tous les elements interactifs sont annotes |
| VoiceOver / TalkBack | Labels descriptifs sur chaque bouton et action |
| Support RTL | Natif pour l'arabe (I18nManager) |
| Langues | 3 locales avec typage TypeScript des cles de traduction |
| Contrastes | Conformes WCAG AA sur le dark mode |

---

## Le moteur madhab-aware : avantage technique unique

### Le probleme que nous resolvons

La reponse a "ce produit est-il halal ?" n'est pas universelle. Elle depend de l'ecole juridique islamique que l'utilisateur suit. Exemple concret :

**E471 (mono- et diglycerides d'acides gras)** -- present dans 70% des produits industriels :

| Ecole | Avis | Raisonnement |
|-------|------|-------------|
| Hanafi | Autorise | Transformation chimique complete (istihalah) rend la substance licite |
| Maliki | Douteux | L'origine animale non confirmee cree un doute |
| Shafi'i | Conditionnel | Interdit si origine porcine, autorise si vegetal |
| Hanbali | Interdit | Toute origine animale non verifiee est exclue |

### Notre base de donnees proprietaire

| Metrique | Valeur |
|----------|--------|
| Additifs analyses | 140+ |
| Avis par ecole juridique | 4 par additif (Hanafi, Maliki, Shafi'i, Hanbali) |
| Organismes de certification references | 18 |
| Sources de recherche fiqh | Documentees et tracables |

Cette base de donnees n'existe nulle part ailleurs sous cette forme. Elle constitue un avantage competitif durable : chaque nouvel additif analyse, chaque avis jurisprudentiel ajoute renforce la barriere a l'entree pour un concurrent potentiel.

---

## Donnees et sources

| Source | Contenu | Utilisation |
|--------|---------|-------------|
| OpenFoodFacts | 3M+ produits, ingredients, labels, photos | Source primaire pour le scan |
| Base proprietaire Naqiy | 140+ additifs, avis par ecole juridique | Verdicts personnalises |
| Certifications | 18 organismes references en France | Scoring de fiabilite |
| Commerces | 212+ points de vente geolocates (AVS, Achahada) | Carte interactive |
| Communaute | Signalements, avis, corrections | Enrichissement continu |

---

## Infrastructure et couts

### Cout mensuel total : 60 EUR

| Service | Cout mensuel | Tier |
|---------|-------------|------|
| Railway (serveur + PostgreSQL + Redis) | ~50 EUR | Payant |
| Apple Developer Account | ~8 EUR (amorti) | Payant |
| Google Play Console | ~2 EUR (unique, amorti) | Payant |
| Mapbox | 0 EUR | Gratuit (50K requetes/mois) |
| Sentry | 0 EUR | Gratuit (5K events/mois) |
| PostHog | 0 EUR | Gratuit (1M events/mois) |
| **Total** | **~60 EUR/mois** | |

### Seuil de rentabilite infrastructure : 20 abonnes premium

A 2,99 EUR/mois par abonne, 20 abonnes couvrent l'integralite des couts d'infrastructure. L'application est concue pour etre economiquement viable des les premiers utilisateurs payants.

### Scalabilite technique

| Palier MAU | Cout infra estime | Capacite |
|-----------|-------------------|----------|
| 10 000 | ~80 EUR/mois | PostgreSQL standard + Redis 256MB |
| 50 000 | ~200 EUR/mois | PostgreSQL scale + Redis 1GB |
| 200 000 | ~500 EUR/mois | PostgreSQL cluster + Redis 4GB |
| 1 000 000 | ~2 000 EUR/mois | Multi-instance + CDN |

Les couts d'infrastructure croissent de maniere sub-lineaire grace au cache Redis, a la compression, et a l'utilisation des tiers gratuits des services. Les marges augmentent avec l'echelle.

---

## Feuille de route technique

| Version | Horizon | Ajouts techniques |
|---------|---------|-------------------|
| V1.0 (actuel) | Pret | Scanner + Carte + Gamification + Auth |
| V1.5 | S2 2026 | Trust Score commerces, moderation communautaire, filtres avances |
| V2.0 | S1 2027 | Scan cosmetique (INCI), marketplace catalogue, API publique beta |
| V2.5 | S2 2027 | Marketplace transactionnelle, RevenueCat + Stripe |
| V3.0+ | 2028 | Scanner IA (OCR etiquettes), module social, expansion multi-pays |

---

## En resume

Naqiy est un produit techniquement mature, construit sur un stack moderne et economique, avec un avantage technique unique (le moteur madhab-aware) qu'aucun concurrent ne possede. L'infrastructure coute 60 EUR/mois, le code est type de bout en bout, teste, et deploye en continu. Le risque technique est minimal -- le produit est deja construit.

---

*Contact : contact@naqiy.app*
