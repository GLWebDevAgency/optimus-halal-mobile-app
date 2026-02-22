# Naqiy -- Modele Economique

*Monetisation, projections financieres et chemin vers la rentabilite.*

---

## Principe fondateur

Le statut halal d'un produit est **toujours gratuit**. L'information religieuse ne se monnaie pas.

La monetisation repose sur la valeur ajoutee au-dela du verdict de base : confort d'utilisation, profondeur d'analyse, outils professionnels pour les commercants. Le gratuit resout le probleme. Le premium ameliore l'experience.

Ce principe n'est pas seulement ethique -- il est strategique. En rendant le verdict gratuit, nous maximisons la taille de la base d'utilisateurs et les effets de reseau. La monetisation est une consequence de la valeur delivree, pas un objectif impose.

---

## Sources de revenu

### 1. B2C -- Abonnement Naqiy+ (2,99 EUR/mois | 24,99 EUR/an)

| Fonctionnalite | Gratuit (a vie) | Naqiy+ |
|----------------|-----------------|-------|
| Scan illimite + verdict | Oui | Oui |
| Ingredients + additifs | Oui | Oui |
| Avis du madhab choisi | Oui | Oui |
| Carte des commerces | Oui | Oui |
| Alertes sanitaires | Oui | Oui |
| Gamification (XP, streaks, badges) | Oui | Oui |
| Analyse chimique detaillee | -- | Oui |
| Historique de scans complet | 30 derniers | Illimite |
| Filtres avances carte | -- | Oui |
| Mode hors-ligne | -- | Oui |
| Themes et badges exclusifs | -- | Oui |
| Favoris | 20 max | Illimites |
| Signalements | 1/jour | Illimites |
| Alertes push personnalisees | -- | Oui |
| Profil sante avance | -- | Oui |
| Support prioritaire | -- | Oui |

**Strategie de pricing** : 2,99 EUR/mois est un prix d'impulsion -- inferieur a un cafe. L'offre annuelle a 24,99 EUR (30% de reduction) encourage l'engagement long terme et reduit le churn.

**Conversion ciblee** : 2% en Y1, 4% en Y2, 6% en Y3. Ces taux sont conservateurs par rapport aux benchmarks SaaS B2C (Yuka Premium : ~5%, Spotify : ~40%).

### 2. B2B -- Commercants (9,90 a 29,90 EUR/mois)

| Offre | Prix mensuel | Contenu |
|-------|-------------|---------|
| **Profil Verifie** | 9,90 EUR | Badge "Verifie par Naqiy", apparition prioritaire dans les recherches locales |
| **Profil Enrichi** | 19,90 EUR | Tout Verifie + photos, menu, horaires detailles, promotions |
| **Visibilite Locale** | 29,90 EUR | Tout Enrichi + mise en avant locale, analytics de visibilite, notifications push aux utilisateurs proches |

**Garde-fous ethiques** :
- La visibilite payante est toujours identifiee par un badge "Sponsorise"
- Le classement organique n'est jamais affecte par le statut payant
- Un commercant ne peut pas payer pour ameliorer sa note ou masquer des avis
- La verification implique un controle reel des certifications

**Marche adressable** : 212+ commerces deja sur la carte. Objectif de 500 a 2 000 commerces a horizon 24 mois. Le taux de conversion B2B cible est de 10-20% des commerces repertories.

### 3. B2B2C -- Marques et Certificateurs (Phase 2+)

| Offre | Description | Prix indicatif |
|-------|-------------|----------------|
| **Label "Verifie Naqiy"** | Certification apres audit reel, affichee sur les fiches produit | Sur devis |
| **Contenu sponsorise** | Articles educatifs marques (nutrition halal, ingredients, saisons) | 500-2 000 EUR/article |
| **Donnees anonymisees** | Tendances de consommation halal par region, produit, saison | Sur devis |
| **API Partenaire** | Acces aux donnees halal pour integration dans des apps tierces | Sur devis |

**Interdit** :
- Payer pour ameliorer un statut halal
- Supprimer des avis negatifs ou masquer des signalements
- Afficher du contenu sponsorise sans identification claire
- Vendre des donnees personnelles identifiables

---

## Projections financieres

### Hypotheses

| Parametre | An 1 | An 2 | An 3 |
|-----------|------|------|------|
| Utilisateurs actifs mensuels (MAU) | 10 000 | 50 000 | 200 000 |
| Taux de conversion premium B2C | 2% | 4% | 6% |
| Abonnes Naqiy+ | 200 | 2 000 | 12 000 |
| Commercants B2B abonnes | 20 | 150 | 500 |
| ARPU B2C (prix moyen mensuel) | 2,99 EUR | 2,99 EUR | 2,99 EUR |
| ARPU B2B (prix moyen mensuel) | 14,90 EUR | 19,90 EUR | 24,90 EUR |
| Churn mensuel B2C | 10% | 8% | 6% |
| Churn mensuel B2B | 5% | 4% | 3% |

### Revenu projete

| Source | An 1 | An 2 | An 3 |
|--------|------|------|------|
| B2C (Naqiy+) | ~7 200 EUR | ~71 800 EUR | ~430 600 EUR |
| B2B (Commercants) | ~3 600 EUR | ~35 800 EUR | ~149 400 EUR |
| B2B2C (Marques + API) | 0 EUR | ~15 000 EUR | ~80 000 EUR |
| **Total annuel** | **~10 800 EUR** | **~122 600 EUR** | **~660 000 EUR** |

### Commentaires sur les projections

- **An 1** : Phase d'acquisition, monetisation minimale. Focus sur le product-market fit et la construction de la base d'utilisateurs.
- **An 2** : Activation de la monetisation B2B et montee en puissance du premium. Les effets de reseau commencent a jouer.
- **An 3** : Echelle. 200K MAU avec 6% de conversion = 12K abonnes premium. Le scan cosmetique et la marketplace ouvrent de nouveaux flux de revenus.

---

## Structure de couts

### Couts d'infrastructure (actuels)

| Poste | Cout mensuel |
|-------|-------------|
| Railway (serveur + PostgreSQL + Redis) | ~50 EUR |
| Apple Developer Account | ~8 EUR (amorti) |
| Google Play Console | ~2 EUR (unique, amorti) |
| Mapbox (tier gratuit) | 0 EUR |
| Sentry (tier gratuit) | 0 EUR |
| PostHog (tier gratuit) | 0 EUR |
| **Total infrastructure** | **~60 EUR/mois** |

### Evolution des couts avec la croissance

| MAU | Infra/mois | Marketing/mois | Equipe/mois | Total/mois |
|-----|-----------|---------------|-------------|------------|
| 1 000 | 60 EUR | 0 EUR | 0 EUR | 60 EUR |
| 10 000 | 80 EUR | 500 EUR | 0 EUR | 580 EUR |
| 50 000 | 200 EUR | 2 000 EUR | 3 000 EUR | 5 200 EUR |
| 200 000 | 500 EUR | 5 000 EUR | 12 000 EUR | 17 500 EUR |

**Note** : l'equipe reste minimale grace au modele AI-augmented. Le fondateur + 3 AI remplacent 3-5 developpeurs en phase initiale. Les premiers recrutements interviendront a 50K+ MAU, pour le support communautaire et la moderation.

### Seuil de rentabilite infrastructure

**20 abonnes premium = infrastructure couverte.**

A 2,99 EUR/mois, 20 abonnes Naqiy+ generent 59,80 EUR/mois -- soit exactement le cout d'infrastructure. L'application est concue pour etre economiquement viable des les tout premiers utilisateurs payants.

### Seuil de rentabilite complet (avec equipe)

| Scenario | MAU necessaires | Abonnes premium | Commercants B2B | MRR | Delai estime |
|----------|----------------|----------------|----------------|-----|-------------|
| Infra seulement | 500 | 20 | 0 | 60 EUR | Mois 2-3 |
| Fondateur a mi-temps | 5 000 | 100 | 10 | 450 EUR | Mois 6 |
| Fondateur temps plein | 20 000 | 500 | 30 | 2 000 EUR | Mois 12 |
| Petite equipe (3 pers.) | 50 000 | 2 000 | 100 | 8 000 EUR | Mois 18 |

---

## Unit economics

### Metriques cles

| Metrique | Cible | Justification |
|----------|-------|---------------|
| **CAC** (Customer Acquisition Cost) | < 1 EUR | Acquisition principalement organique |
| **LTV** (Lifetime Value) -- Premium | > 30 EUR | 10 mois de retention moyenne a 2,99 EUR |
| **LTV/CAC** | > 30x | Ratio exceptionnel grace a l'acquisition organique |
| **Churn mensuel** (B2C) | < 8% (cible Y2) | Use case recurrent (courses 2-3x/semaine) |
| **Payback period** | < 1 mois | CAC < 1 EUR, ARPU 2,99 EUR/mois |
| **Gross margin** | > 90% | Couts marginaux quasi-nuls (SaaS pur) |

### Pourquoi le CAC est structurellement bas

L'acquisition est principalement **organique**, pour des raisons structurelles :

| Canal | Cout | Mecanisme |
|-------|------|-----------|
| **ShareCard virale** | 0 EUR | Un utilisateur partage son resultat de scan dans un groupe WhatsApp. 3-5 contacts telecharge l'app. |
| **Groupes WhatsApp** | 0 EUR | La communaute musulmane francophone est organisee en groupes WhatsApp thematiques (mamans, etudiants, mosquee). Un bon produit se propage naturellement. |
| **ASO** (App Store Optimization) | 0 EUR | "Scan halal" est un mot-cle a faible competition mais forte intention. |
| **Bouche-a-oreille mosquees** | ~0 EUR | Canal a cout zero avec audience captive et haut niveau de confiance. |
| **Micro-influenceurs** | 200-500 EUR | Partenariats avec des micro-influenceurs musulmans (5-50K abonnes) a faible cout. |

### Pourquoi la LTV est structurellement elevee

| Facteur | Impact sur la retention |
|---------|----------------------|
| Use case recurrent | Courses 2-3x/semaine = usage naturel et frequent |
| Gamification | Streaks, XP, achievements creent un engagement positif |
| Communaute | Les signalements et avis creent un sentiment d'appartenance |
| Personnalisation madhab | L'utilisateur a configure son profil -- cout de switching eleve |
| Alternatives inexistantes | Pas de concurrent de qualite equivalente |

---

## Scalabilite economique

### La courbe de marge

```
Revenu          xxxxxxxxxx
              xxxx
            xxx
          xx
        xx
       x
Couts  ──────────────────
      |   |    |    |    |
     1K  10K  50K 100K 200K  MAU
```

Les revenus croissent lineairement avec les utilisateurs. Les couts d'infrastructure croissent de maniere sub-lineaire grace au cache Redis, a la compression, et aux tiers gratuits des services. Resultat : **les marges augmentent avec l'echelle**.

| MAU | Revenu/mois | Cout total/mois | Marge brute |
|-----|-------------|----------------|-------------|
| 1 000 | ~50 EUR | 60 EUR | -17% |
| 10 000 | ~900 EUR | 580 EUR | 36% |
| 50 000 | ~10 000 EUR | 5 200 EUR | 48% |
| 200 000 | ~55 000 EUR | 17 500 EUR | 68% |

**Note** : a 200K MAU, les couts incluent une equipe de 3-5 personnes. La marge brute hors personnel depasse 95%.

---

## Comparables et benchmarks

| Metrique | Naqiy (cible Y3) | Yuka | Muslim Pro |
|----------|-----------------|------|------------|
| MAU | 200K | 30M+ | 100M+ |
| Conversion premium | 6% | ~5% | ~3% |
| ARPU | 2,99 EUR | 3,99 EUR | ~2 EUR |
| CAC | < 1 EUR | ~2 EUR | ~0,50 EUR |
| Marche cible | 5,5 Mds EUR (FR) | 100+ Mds EUR (mondial) | 3+ Mds EUR (mondial) |

Naqiy vise un marche plus petit mais beaucoup moins competitif. Le ratio "taille de marche / nombre de concurrents de qualite" est le plus favorable de tous les segments de consommation mobile en France.

---

## Philosophie economique

### Ce que nous faisons

- Monetiser la valeur ajoutee (confort, profondeur, personnalisation)
- Etre transparents sur les prix et les fonctionnalites
- Offrir un produit gratuit qui resout veritablement le probleme de base
- Maintenir un LTV/CAC > 10x a tout moment

### Ce que nous ne faisons jamais

- Mettre un paywall sur l'information halal de base
- Vendre un classement favorable aux commercants
- Creer une dependance artificielle pour pousser a l'achat
- Exploiter les donnees utilisateur a des fins publicitaires
- Vendre des donnees personnelles identifiables

### Engagement social

- **2,5% des benefices nets** sont reserves a des causes communautaires
- Education alimentaire halal (ateliers, contenus, partenariats scolaires)
- Aide aux familles en difficulte alimentaire
- Soutien aux petits commercants halal (formations, outils numeriques)
- Rapport annuel public sur l'utilisation de ces fonds

---

## Scenarios financiers

### Scenario conservateur (50% des objectifs)

| | An 1 | An 2 | An 3 |
|--|------|------|------|
| MAU | 5 000 | 25 000 | 100 000 |
| Revenu annuel | ~5 500 EUR | ~61 000 EUR | ~330 000 EUR |
| Rentable infra ? | Oui (mois 4) | Oui | Oui |
| Rentable total ? | Non | Limite | Oui |

### Scenario de base (objectifs atteints)

| | An 1 | An 2 | An 3 |
|--|------|------|------|
| MAU | 10 000 | 50 000 | 200 000 |
| Revenu annuel | ~11 000 EUR | ~123 000 EUR | ~660 000 EUR |
| Rentable infra ? | Oui (mois 2) | Oui | Oui |
| Rentable total ? | Non | Oui (S2) | Oui |

### Scenario optimiste (150% des objectifs)

| | An 1 | An 2 | An 3 |
|--|------|------|------|
| MAU | 15 000 | 75 000 | 300 000 |
| Revenu annuel | ~16 500 EUR | ~185 000 EUR | ~990 000 EUR |
| Rentable infra ? | Oui (mois 1) | Oui | Oui |
| Rentable total ? | Limite | Oui (S1) | Oui |

**Dans les 3 scenarios, l'infrastructure est rentable des les premiers mois.** Le risque financier est structurellement limite par le cout d'infrastructure ultra-bas (60 EUR/mois).

---

*Un modele economique ou le revenu est une consequence de la valeur delivree, pas un objectif en soi. Et ou 20 abonnes suffisent a couvrir l'infrastructure.*

---

*Contact : contact@naqiy.app*
