# Optimus Halal — Equipe et Roadmap

---

## L'Equipe

### Fondateur & Lead Developer

Le projet est porte par un fondateur-developpeur full-stack avec une double competence :
- **Technique** : Architecture TypeScript de bout en bout, React Native, PostgreSQL, infrastructure cloud
- **Produit** : UX design, psychologie utilisateur, connaissance approfondie de l'ecosysteme halal en France

Le fondateur a concu, code, et deploye l'integralite du produit — de l'architecture backend au pixel sur l'ecran mobile.

### Assistants IA (Table Ronde)

Le developpement est accelere par un protocole de collaboration IA unique :
- **Claude** (Anthropic) : Lead CTO, architecture, code principal, documentation strategique
- **Gemini** (Google) : Revue de code, audit de performance, validation
- **Codex** (OpenAI) : Implementation parallele, tests, automatisation

Ce protocole permet une cadence de developpement equivalente a une equipe de 3-5 developpeurs, avec un fondateur unique.

---

## Ce Qui Est Construit

### Backend (Production)

| Composant | Quantite | Statut |
|-----------|----------|--------|
| Routers API (tRPC) | 17 | Deploye |
| Procedures (queries + mutations) | 86 | Deploye |
| Tables PostgreSQL | 34 | Deploye |
| Migrations versionnees | 6 | Appliquees |
| Tests d'integration | 22 | Operationnels |
| Workflows CI/CD | 2 | Actifs |

### Mobile (Production-ready)

| Composant | Quantite | Statut |
|-----------|----------|--------|
| Ecrans / Routes | 44 | Implementes |
| Composants UI | 32 | Design system complet |
| Hooks custom | 15 | Operationnels |
| Langues supportees | 3 (FR, EN, AR) | Traduites |
| Feature flags | 14 | Configurables |

### Donnees

| Donnee | Quantite | Source |
|--------|----------|--------|
| Additifs analyses | 154 | Base proprietaire |
| Avis par ecole juridique | 22 | Recherche fiqh |
| Commerces geolocates | 212+ | AVS, Achahada |
| Organismes de certification | 18 | Verification manuelle |
| Cibles de boycott | 19 | Sources communautaires |

### Infrastructure

| Service | Provider | Statut |
|---------|----------|--------|
| Backend + API | Railway | Deploye (preview + production) |
| Base de donnees | PostgreSQL + PostGIS | Operationnelle |
| Cache | Redis | Operationnel |
| Monitoring erreurs | Sentry | Backend + Mobile |
| Analytics | PostHog | Mobile |
| Build mobile | EAS (Expo) | Android operationnel |

---

## Roadmap

### 2026 S1 — V1.0 : Lancement (En cours)

**Objectif** : Lancer sur App Store et Play Store, atteindre 10K MAU.

| Tache | Statut |
|-------|--------|
| Backend complet (17 routers) | FAIT |
| Mobile complet (44 ecrans) | FAIT |
| Design system (gold dark mode) | FAIT |
| Gamification (XP, streaks, achievements) | FAIT |
| Tests + CI/CD | FAIT |
| Build Android (APK) | FAIT |
| Build iOS (TestFlight) | A faire |
| Soumission App Store + Play Store | A faire |
| Onboarding guide (premier scan) | A faire |
| Landing page + site web | A faire |

### 2026 S2 — V1.5 : Communaute et Commerces

**Objectif** : Activer la boucle communautaire et demarrer le B2B.

| Fonctionnalite | Description |
|---------------|-------------|
| Trust Score Commerces | Score de confiance visible et explique |
| Moderation communautaire | Queue de traitement des signalements |
| Programme Commerce de Confiance | Bronze/Argent/Or |
| Avis structures | Criteres notes individuellement |
| Filtres carte avances | "Ouvert maintenant", "Note 4+", par type |

### 2027 S1 — V2.0 : Extension du Scan

**Objectif** : Doubler la proposition de valeur avec le cosmetique.

| Fonctionnalite | Description |
|---------------|-------------|
| Scan cosmetique | Analyse INCI, verdicts personnalises |
| Marketplace catalogue | Produits halal verifies (lecture seule) |
| Premium Optimus+ | Lancement de l'abonnement payant |
| API Publique (beta) | Donnees halal pour apps tierces |

### 2027 S2 — V2.5 : Transactions

**Objectif** : Premiere marketplace transactionnelle halal.

| Fonctionnalite | Description |
|---------------|-------------|
| Marketplace click-and-collect | Commande en ligne, retrait en magasin |
| Paiement integre | RevenueCat + Stripe |
| Dashboard vendeur | Analytics et gestion pour commercants |

### 2028 — V3.0+ : Ecosysteme et Expansion

| Fonctionnalite | Description |
|---------------|-------------|
| Optimus Social | Feed local, profils commerce enrichis, decouverte |
| Expansion Belgique + Suisse | Localisation + stores locaux |
| Scanner IA | Reconnaissance d'etiquettes par image (OCR) |
| Expansion UK + Allemagne | Marches anglophones et germanophones |

---

## Besoins en Financement

### Utilisation des Fonds

| Poste | Allocation | Justification |
|-------|-----------|---------------|
| Developpement produit | 50% | Acceleration V1.5 → V2, cosmetique, marketplace |
| Marketing/Acquisition | 25% | Micro-influenceurs, partenariats mosquees, ASO |
| Operations/Legal | 15% | RGPD, marque INPI, CGU, conseil juridique |
| Reserve | 10% | Contingence |

### Jalons Cles

| Jalon | Delai | Indicateur de succes |
|-------|-------|---------------------|
| Lancement App Store + Play Store | T2 2026 | Apps publiees et fonctionnelles |
| 10 000 MAU | T3 2026 | Retention J30 > 25% |
| Premier revenu B2B | T4 2026 | 20 commercants abonnes |
| 50 000 MAU | T2 2027 | Taux de contribution > 5% |
| Launch Optimus+ | T2 2027 | 2% conversion → premium |
| Seuil de rentabilite | T4 2027 | Revenu > couts (equipe incluse) |

---

## Pourquoi Maintenant

1. **Le marche est pret** : 5,5 milliards EUR de marche halal en France, zeroapp de qualite
2. **La technologie est mature** : Expo, tRPC, PostGIS — le stack pour construire ce produit n'existait pas il y a 3 ans
3. **La communaute est connectee** : WhatsApp + Instagram = canaux de viralite naturels
4. **Le code est ecrit** : 17 routers, 44 ecrans, 34 tables, tout est fonctionnel
5. **Le timing Ramadan** : Le Ramadan est le moment de pic d'attention halal — chaque Ramadan manque est une annee perdue

---

*Optimus Halal n'est pas une idee sur un slide — c'est un produit fonctionnel, deploye, avec 86 procedures API, 44 ecrans, et une vision claire pour les 3 prochaines annees.*

---

*Contact : support@optimushalal.com*
*Tagline : Halal. Ethique. Verifie.*
