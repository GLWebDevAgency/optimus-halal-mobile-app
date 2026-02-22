# Naqiy -- Equipe et Roadmap

*Qui construit Naqiy, ce qui est deja livre, et ou nous allons.*

---

## L'equipe

### Fondateur & Lead Developer

Naqiy est porte par un fondateur-developpeur full-stack qui a concu, architecture, code et deploye l'integralite du produit -- du schema de base de donnees au pixel sur l'ecran mobile.

**Double competence :**

| Domaine | Expertise |
|---------|-----------|
| **Technique** | Architecture TypeScript bout en bout, React Native, PostgreSQL, PostGIS, infrastructure cloud, CI/CD |
| **Produit** | UX design, psychologie utilisateur, connaissance approfondie de l'ecosysteme halal en France, recherche jurisprudentielle islamique |

Le fondateur est a la fois l'architecte systeme, le designer produit, le data analyst, et le responsable de la strategie. Ce profil rare -- technique et culturellement ancre -- est la raison pour laquelle Naqiy existe la ou d'autres ont echoue.

### Le modele "Table Ronde" : innovation AI-augmented

Le developpement est accelere par un protocole de collaboration IA unique, baptise "Table Ronde". Trois agents IA specialises collaborent avec le fondateur selon des roles definis :

| Role | Agent | Responsabilite |
|------|-------|---------------|
| **Lead CTO** | Claude (Anthropic) | Architecture systeme, code principal, documentation strategique, decisions techniques |
| **Revue & Audit** | Gemini (Google) | Revue de code, audit de performance, validation de qualite, detection de bugs |
| **Implementation & Tests** | Codex (OpenAI) | Implementation parallele, ecriture de tests, automatisation, refactoring |

**Pourquoi ce modele est un avantage competitif :**

| Dimension | Equipe classique (3-5 devs) | Table Ronde (1 fondateur + 3 AI) |
|-----------|---------------------------|----------------------------------|
| Cout mensuel | 15 000 - 30 000 EUR | ~200 EUR (abonnements AI) |
| Cadence de livraison | Comparable | Comparable |
| Coherence architecturale | Variable (opinions multiples) | Elevee (vision unique du fondateur) |
| Disponibilite | 35h/semaine par dev | 24/7 |
| Montee en competence | Lente (onboarding) | Instantanee (contexte charge) |
| Risque de turnover | Eleve en startup | Zero |

**Resultat concret** : 14 routers API, 91+ procedures, 40 ecrans, 22 tests d'integration, design system complet, 3 langues -- livres en quelques semaines par un fondateur unique.

Ce modele n'est pas un pis-aller -- c'est un avantage strategique. Il permet de valider le product-market fit avec un burn rate quasi-nul, puis de recruter au bon moment avec les bonnes donnees.

### Plan de recrutement

| Phase | MAU | Recrutement | Role |
|-------|-----|-------------|------|
| Phase 1 (actuel) | 0-10K | Fondateur seul + 3 AI | Tout |
| Phase 2 | 10-50K | +1 community manager | Moderation, support, reseaux sociaux |
| Phase 3 | 50-200K | +1-2 developpeurs + 1 ops | Features, scaling, infra |
| Phase 4 | 200K+ | +2-3 (marketing, commercial, data) | Croissance, B2B, analytics |

Le recrutement est declenche par la traction, pas par l'ambition. Chaque embauche correspond a un besoin valide par les metriques.

---

## Ce qui est construit et deploye

### Backend (en production sur Railway)

| Composant | Quantite | Detail |
|-----------|----------|--------|
| Routers API (tRPC) | 14 | auth, user, scan, store, additive, favorite, alert, loyalty, article, marketplace, moderation, notification, search, product |
| Procedures (queries + mutations) | 91+ | Toutes typees, validees, documentees |
| Tables PostgreSQL | 30+ | Avec PostGIS pour les requetes geospatiales |
| Migrations versionnees | 6+ | Drizzle ORM, reproductibles |
| Tests d'integration | 22 | Vitest, couvrant les flux critiques |
| Workflows CI/CD | 2 | GitHub Actions (tests + deploy) |
| Rate limiting | Actif | Endpoints sensibles proteges |
| Monitoring | Actif | Sentry (crash reporting + performance) |
| Cache | Actif | Redis (stores nearby, scans recents, sessions) |

### Application mobile (production-ready)

| Composant | Quantite | Detail |
|-----------|----------|--------|
| Ecrans / Routes | 40 | Couvrant 100% du parcours utilisateur |
| Composants UI | 19+ | Design system complet et reutilisable |
| Hooks custom | 8+ | useAuth, useScan, useFavorites, useHaptics, useTheme, useTranslation, useUserLocation... |
| Langues | 3 | Francais, anglais, arabe (avec support RTL) |
| Feature flags | 14 | Configurables a distance |
| Animations | 60 FPS | React Native Reanimated, thread UI natif |
| Dark mode | Signature | Accents dores, glass-morphism |
| Gamification | Complete | XP, niveaux, streaks, freeze, milestones, achievements |
| ShareCard | Operationnelle | Capture visuelle + partage social |
| Analytics | Actif | PostHog (funnels, retention, comportements) |

### Base de donnees halal

| Donnee | Quantite | Source |
|--------|----------|--------|
| Additifs analyses | 140+ | Recherche proprietaire |
| Avis par ecole juridique | 4 par additif | Recherche fiqh documentee |
| Commerces geolocates | 212+ | AVS, Achahada, verification manuelle |
| Organismes de certification | 18 | Verification manuelle |
| Cibles de boycott | 19 | Sources communautaires |

### Infrastructure de production

| Service | Provider | Statut |
|---------|----------|--------|
| Backend + API | Railway | Deploye (preview + production) |
| Base de donnees | PostgreSQL + PostGIS | Operationnelle |
| Cache / Sessions | Redis | Operationnel |
| Monitoring erreurs | Sentry | Backend + Mobile |
| Analytics | PostHog | Mobile |
| Build mobile | EAS (Expo) | Android operationnel |
| CI/CD | GitHub Actions | 2 workflows actifs |

### Ce que cela represente

Pour mettre ces chiffres en perspective :

| Metrique | Naqiy | Startup typique pre-seed |
|----------|------|-------------------------|
| Lignes de code | ~25 000+ | ~5 000-10 000 |
| API endpoints | 91+ | 10-20 |
| Ecrans mobiles | 40 | 5-10 |
| Tests automatises | 22 | 0-5 |
| Langues | 3 | 1 |
| Cout de developpement | ~200 EUR/mois (AI) | 50 000-150 000 EUR |

Naqiy a le produit d'une startup post-Series A avec le budget d'un projet personnel.

---

## Roadmap detaillee

### V1.0 -- Lancement (T2 2026)

**Statut : 90% complete. Reste : soumission stores + landing page.**

| Tache | Statut |
|-------|--------|
| Backend complet (14 routers, 91+ procedures) | Fait |
| Application mobile (40 ecrans) | Fait |
| Design system (Gold Dark Mode) | Fait |
| Gamification (XP, streaks, achievements, freeze, milestones) | Fait |
| Scanner de produits avec verdicts madhab-aware | Fait |
| Carte interactive des commerces (Mapbox + PostGIS) | Fait |
| ShareCard (partage visuel de scan) | Fait |
| Tests + CI/CD | Fait |
| Build Android (APK/AAB) | Fait |
| 3 langues (FR, EN, AR) + RTL | Fait |
| Monitoring (Sentry + PostHog) | Fait |
| Build iOS (TestFlight) | A faire |
| Soumission App Store + Play Store | A faire |
| Onboarding premier scan (guide interactif) | A faire |
| Landing page / site web | A faire |

### V1.5 -- Communaute et Commerces (S2 2026)

**Objectif** : Activer la boucle communautaire et lancer la monetisation B2B.

| Fonctionnalite | Description | Impact |
|---------------|-------------|--------|
| Trust Score Commerces | Score de confiance visible et explique, base sur les avis, certifications, anciennete | Differenciation carte |
| Moderation communautaire | Queue de traitement des signalements avec workflow de validation | Qualite des donnees |
| Programme Commerce de Confiance | Tiers Bronze / Argent / Or avec benefices progressifs | Monetisation B2B |
| Avis structures | Criteres notes individuellement (qualite, service, prix, proprete) | Profondeur communautaire |
| Filtres carte avances | "Ouvert maintenant", "Note 4+", par type, par certification | UX carte |
| Naqiy+ (beta) | Premiers abonnes premium avec features exclusives | Revenu B2C |

### V2.0 -- Extension du Scan (S1 2027)

**Objectif** : Doubler la proposition de valeur avec le cosmetique et ouvrir la plateforme.

| Fonctionnalite | Description | Impact |
|---------------|-------------|--------|
| Scan cosmetique | Analyse des ingredients INCI, verdicts halal personnalises | Nouveau marche (50 Mds USD mondial) |
| Marketplace catalogue | Produits halal verifies, browsable, avec liens d'achat | Decouverte produit |
| Naqiy+ (lancement officiel) | Abonnement premium complet avec toutes les features | Revenu recurrent |
| API publique (beta) | Endpoints pour apps tierces souhaitant integrer des donnees halal | Ecosysteme / B2B2C |
| Expansion Belgique + Suisse | Localisation, commerces locaux, partenariats | Croissance geographique |

### V2.5 -- Transactions (S2 2027)

**Objectif** : Premiere marketplace transactionnelle halal.

| Fonctionnalite | Description | Impact |
|---------------|-------------|--------|
| Click-and-collect | Commande en ligne, retrait en magasin partenaire | Transaction |
| Paiement integre | RevenueCat (abonnements) + Stripe (transactions) | Monetisation |
| Dashboard vendeur | Analytics, gestion des commandes, promotions | Valeur B2B |
| Programme de fidelite vendeur | Recompenses pour les commercants les plus actifs | Retention B2B |

### V3.0+ -- Ecosysteme et Expansion (2028+)

| Fonctionnalite | Description | Impact |
|---------------|-------------|--------|
| Naqiy Social | Feed local, profils commerce enrichis, decouverte de quartier | Engagement |
| Scanner IA | Reconnaissance d'etiquettes par image (OCR), scan sans code-barres | Innovation |
| Expansion UK + Allemagne | Marches halal en forte croissance, localisation complete | Echelle europeenne |
| API v2 | Suite complete de donnees halal pour l'ecosysteme | Plateforme |
| Programme ambassadeur | Ambassadeurs locaux dans chaque grande ville | Communaute |

---

## Jalons cles et indicateurs de succes

| Jalon | Delai cible | Indicateur de succes |
|-------|-------------|---------------------|
| Lancement App Store + Play Store | T2 2026 | Apps publiees, fonctionnelles, 0 crash critique |
| 1 000 MAU | T2 2026 | Retention J7 > 40% |
| 10 000 MAU | T3 2026 | Retention J30 > 25%, NPS > 50 |
| Seuil de rentabilite infrastructure | T3 2026 | 20+ abonnes premium |
| Premier revenu B2B | T4 2026 | 20 commercants abonnes |
| 50 000 MAU | T2 2027 | Taux de contribution communautaire > 5% |
| Lancement Naqiy+ officiel | T2 2027 | 2%+ conversion premium |
| Scan cosmetique | T2 2027 | 10 000+ scans cosmetiques/mois |
| Seuil de rentabilite total | T4 2027 | Revenu > couts (equipe incluse) |
| 200 000 MAU | T4 2027 | MRR > 30 000 EUR |
| Expansion Belgique + Suisse | T1 2028 | 10 000 MAU hors France |

---

## Besoins en financement

### Utilisation des fonds

| Poste | Allocation | Justification |
|-------|-----------|---------------|
| **Developpement produit** | 50% | Acceleration V1.5 -> V2.0, scan cosmetique, marketplace, recrutement technique |
| **Marketing / Acquisition** | 25% | Micro-influenceurs, partenariats mosquees, contenu social, ASO avance |
| **Operations / Legal** | 15% | Conformite RGPD, depot de marque INPI, CGU, conseil juridique, comptabilite |
| **Reserve** | 10% | Contingence, opportunites non prevues |

### Pourquoi le besoin en capital est limite

| Facteur | Impact sur le besoin en capital |
|---------|-------------------------------|
| Produit deja construit (40 ecrans, 91+ API) | Zero cout de R&D pour le MVP |
| Infrastructure a 60 EUR/mois | Burn rate infrastructure negligeable |
| Modele Table Ronde (3 AI) | Cout de developpement 10-100x inferieur a une equipe classique |
| Acquisition organique dominante | Budget marketing minimal en phase 1 |
| Fondateur technique autonome | Pas de CTO a recruter, pas de dette technique externe |

### Ce que le capital accelere

Sans financement, Naqiy peut atteindre ses objectifs -- mais plus lentement. Le capital accelere :

1. **Le time-to-market** : soumission stores, landing page, onboarding -- en semaines au lieu de mois
2. **La croissance** : marketing structure des le lancement (Ramadan 2026 = fenetre critique)
3. **La protection juridique** : marque INPI, RGPD, CGU -- securiser la position avant qu'un concurrent emerge
4. **Le recrutement anticipate** : un community manager des 10K MAU pour maintenir la qualite

---

## Pourquoi investir dans Naqiy

### 1. Le produit est deja construit

Naqiy n'est pas un pitch deck. C'est 14 routers API, 91+ procedures, 40 ecrans, 22 tests, deploye en production. Le risque d'execution technique est derriere nous.

### 2. Le marche est massif et vacant

5,5 milliards d'euros de marche halal alimentaire en France. Zero application de qualite. Moins de 1% de penetration. C'est le segment de consommation mobile le plus sous-equipe en France.

### 3. L'economie est structurellement saine

60 EUR/mois d'infrastructure. Rentable a 20 abonnes. LTV/CAC > 30x. Marges qui augmentent avec l'echelle. Un modele SaaS pur avec des couts marginaux quasi-nuls.

### 4. Le timing est optimal

Ramadan 2026 approche (fenetre de croissance annuelle maximale). La generation Z musulmane francaise est numeriquement connectee et culturellement consciente. Le stack technique necessaire est mature depuis moins de 3 ans.

### 5. L'equipe est lean et efficace

Un fondateur technique qui a livre seul un produit de qualite professionnelle. Un modele AI-augmented qui divise les couts de developpement par 10-100x. Zero turnover, zero onboarding, zero politique interne.

### 6. Les valeurs creent un moat

La transparence, la neutralite confessionnelle, et le zero dark pattern ne sont pas des slogans -- ce sont des decisions de design encodees dans le produit. Ces valeurs construisent la confiance communautaire, un actif que les concurrents finances ne peuvent pas acheter.

---

## Vision a 5 ans

Naqiy devient la reference pan-europeenne de la transparence halal. Chaque produit alimentaire et cosmetique en Europe est scannable. Chaque commerce halal est repertorie, note, et accessible. Chaque consommateur musulman a dans sa poche l'outil de confiance dont il avait besoin.

Le halal rejoint la sante, le bio, et le commerce equitable comme dimension normale de la consommation consciente -- et Naqiy est l'application qui rend cela possible.

**Naqiy. Ton halal, en toute clarte.**

---

*Contact : contact@naqiy.app*
