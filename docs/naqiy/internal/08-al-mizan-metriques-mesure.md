# 08 — Al-Mizan (الميزان) — Metriques et Mesure

> "Wa aqimu al-wazna bi-l-qist wa la tukhsiru al-mizan"
> — Etablissez la pesee avec equite et ne faussez pas la balance. (Coran 55:9)

---

## Mesurer Ce Qui Compte, Pas Ce Qui Flatte

La balance — al-mizan — est un symbole coranique de justice et de precision. On ne pese pas pour se rassurer. On pese pour connaitre la verite, meme quand elle derange.

La plupart des startups mesurent ce qui fait plaisir aux investisseurs : downloads, MAU, temps passe dans l'application. Naqiy mesure ce qui fait plaisir a sa mission : **est-ce que l'utilisateur a ete aide ? A-t-il pris une decision eclairee ? A-t-il ete respecte dans le processus ?**

Cela ne signifie pas qu'on ignore les metriques business — cela signifie qu'elles sont **subordonnees**. Un million d'utilisateurs qui ne trouvent pas de reponse a leur question halal est un echec retentissant. Mille utilisateurs qui prennent des decisions alimentaires eclairees chaque semaine est un succes veritable.

---

## 1. La Hierarchie des Metriques

### 1.1 Niveau 1 : Metriques de Mission (L'essentiel)

Ces metriques repondent a la question : "Naqiy accomplit-elle sa mission ?"

| Metrique | Definition | Cible | Etat actuel |
|----------|-----------|-------|-------------|
| **Taux de resolution** | % de scans qui donnent un verdict clair (halal/douteux/haram, pas "inconnu") | > 80% | Non mesure |
| **Confiance moyenne des verdicts** | Score moyen de confiance affiche sur les verdicts resolus | > 75% | Non mesure |
| **Taux de satisfaction** | % d'utilisateurs qui jugent le verdict "utile" (feedback post-scan) | > 85% | Non implemente |
| **Signalements traites** | % de signalements communautaires resolus dans les 72h | > 90% | 0% (pas de systeme de traitement automatise) |
| **Alternatives proposees** | % de verdicts "douteux/haram" qui offrent au moins une alternative certifiee | > 70% | Partiel (lie aux stores proches) |
| **Precision des verdicts** | % de verdicts qui ne sont pas contestes apres publication | > 95% | Non mesure |

**Pourquoi ces metriques sont au sommet** : Si le taux de resolution est de 50%, cela signifie qu'un scan sur deux ne sert a rien. L'utilisateur est venu chercher une reponse et repart les mains vides. Tout le reste — la belle UX, la gamification, la carte — est inutile si la promesse fondamentale n'est pas tenue.

### 1.2 Niveau 2 : Metriques Produit (Le comment)

Ces metriques repondent a la question : "L'experience est-elle excellente ?"

| Metrique | Definition | Cible |
|----------|-----------|-------|
| **DAU/MAU ratio** | Stickiness — utilisateurs actifs quotidiens / mensuels | > 25% |
| **Scans/utilisateur/semaine** | Frequence d'utilisation du scan | 3-5 (rythme naturel des courses) |
| **Retention J1 / J7 / J30** | % d'utilisateurs qui reviennent | 60% / 40% / 25% |
| **Taux de contribution** | % d'utilisateurs qui ont fait au moins un signalement ou avis | > 5% |
| **Taux d'adoption de la carte** | % d'utilisateurs qui ouvrent la carte au moins 1x/semaine | > 30% |
| **Funnel onboarding** | % de comptes crees qui completent un scan dans les 5 premieres minutes | > 70% |
| **Taux de partage** | % de scans suivis d'un partage (ShareCard) | > 3% |
| **Temps de scan a verdict** | Duree entre l'ouverture du scanner et l'affichage du verdict | < 3 secondes |
| **Taux d'erreur API** | % d'appels tRPC qui echouent (hors 401/403) | < 0,5% |
| **Crash-free rate** | % de sessions sans crash | > 99,5% |

### 1.3 Niveau 3 : Metriques Business (La consequence)

Ces metriques repondent a la question : "L'entreprise survit-elle pour continuer ?"

| Metrique | Definition | Cible An 1 |
|----------|-----------|------------|
| **MRR** (Monthly Recurring Revenue) | Revenu mensuel recurrent | 1 000 EUR |
| **Taux de conversion freemium** | % d'utilisateurs gratuits qui passent a Naqiy+ | 2% |
| **CAC** (Customer Acquisition Cost) | Cout d'acquisition d'un utilisateur actif | < 1 EUR |
| **LTV** (Lifetime Value) | Valeur d'un utilisateur sur sa duree de vie | > 10 EUR |
| **LTV/CAC ratio** | Rentabilite de l'acquisition | > 3x |
| **Churn premium mensuel** | % d'abonnes Naqiy+ qui annulent par mois | < 8% |
| **NPS** (Net Promoter Score) | "Recommanderiez-vous Naqiy a un proche ?" | > 50 |
| **ARPU B2B** | Revenu moyen par commercant par mois | > 14,90 EUR |

---

## 2. La North Star Metric

### 2.1 Definition

Parmi toutes ces metriques, une seule est la North Star — l'etoile polaire qui guide toutes les decisions :

> **North Star Metric : Nombre de decisions alimentaires eclairees par semaine.**

Une "decision eclairee" est definie comme : un scan qui aboutit a un verdict avec un score de confiance >= 60%, ou l'utilisateur ne quitte pas l'ecran en moins de 2 secondes (il a lu le resultat).

### 2.2 Pourquoi Cette Metrique

- Elle capture la mission (aider les gens a decider)
- Elle capture l'usage (il faut scanner pour decider)
- Elle capture la qualite (un verdict "inconnu" ne compte pas)
- Elle capture l'engagement (l'utilisateur doit lire le resultat)
- Elle est actionnable (on peut l'ameliorer en enrichissant la base, en ameliorant l'UX, en augmentant la couverture)

### 2.3 Comment la Faire Croitre

```
Enrichir la base de donnees
    → Moins de "Produit inconnu"
        → Plus de verdicts affiches
            → Plus de decisions eclairees

Ameliorer le score de confiance
    → Verdicts plus fiables
        → Plus de verdicts >= 60% confiance
            → Plus de decisions eclairees

Augmenter la retention
    → Plus d'utilisateurs recurrents
        → Plus de scans par semaine
            → Plus de decisions eclairees

Faciliter le partage
    → Plus de bouche a oreille
        → Plus d'utilisateurs
            → Plus de decisions eclairees
```

---

## 3. Ce Qui Est Mesure Aujourd'hui

### 3.1 Outils en Place

| Outil | Ce qu'il mesure | Statut |
|-------|----------------|--------|
| **PostHog** | Events custom, funnels, retention, feature flags | Actif (mobile) |
| **Sentry** | Crashes, erreurs, performance des transactions, breadcrumbs | Actif (backend + mobile) |
| **tRPC `stats.userDashboard`** | totalScans, totalReports par utilisateur | Actif |
| **tRPC `notification.getUnreadCount`** | Notifications non lues | Actif |
| **PostgreSQL direct** | Requetes analytiques sur les tables de donnees | Disponible |

### 3.2 Donnees Disponibles dans la Base

| Table | Metrique derivable |
|-------|-------------------|
| `scans` | Scans/jour, scans/utilisateur, produits les plus scannes, taux de resolution |
| `reports` | Signalements/jour, types de problemes, temps de resolution |
| `reviews` | Avis/jour, note moyenne, taux de "helpful", distribution par store |
| `users` | Inscriptions/jour, niveau moyen, streak moyen, distribution par madhab |
| `pointTransactions` | XP distribue, actions les plus recompensees, progression moyenne |
| `favorites` | Produits les plus favorises, taux de favoritisme par categorie |
| `stores` | Stores les plus visites, repartition geographique, taux de certification |
| `refreshTokens` | Sessions actives, frequence de connexion |

### 3.3 Ce Qui N'Est PAS Mesure — Les Lacunes Critiques

| Metrique manquante | Pourquoi c'est important | Priorite |
|-------------------|--------------------------|----------|
| **Taux de resolution de scan** | Le KPI numero 1 de la mission — on ne sait pas si on reussit | Critique |
| **Temps entre scan et decision** | L'application aide-t-elle a decider rapidement ? | Haute |
| **Taux de retour apres verdict "inconnu"** | L'utilisateur abandonne-t-il apres un echec ? | Haute |
| **Funnel onboarding complet** | Ou perd-on les nouveaux utilisateurs exactement ? | Haute |
| **Carte : rayon moyen de recherche** | Les stores sont-ils assez proches pour etre utiles ? | Moyenne |
| **Carte : taux de navigation GPS** | L'utilisateur va-t-il reellement au commerce ? | Moyenne |
| **Impact du Ramadan sur l'usage** | Les features Ramadan generent-elles un pic mesurable ? | Moyenne |
| **Distribution geographique des utilisateurs** | Ou sont nos utilisateurs ? Ou manque-t-on de commerces ? | Moyenne |
| **Score NPS reel** | On a une cible (> 50) mais aucune mesure en place | Haute |

---

## 4. Les Anti-Metriques — Ce Que Naqiy Refuse de Maximiser

C'est ici que Naqiy se differencie fondamentalement des applications conventionnelles. Les anti-metriques sont les chiffres que les autres startups optimisent et que Naqiy refuse deliberement de maximiser.

### 4.1 Le Temps Passe dans l'Application

**Pourquoi les autres l'optimisent** : Plus de temps passe = plus d'impressions publicitaires = plus de revenu.

**Pourquoi Naqiy le refuse** : Plus de temps passe ne signifie pas plus de valeur. Un scan qui prend 3 secondes et resout le doute est meilleur qu'un scan qui genere 5 minutes de navigation confuse. Si l'utilisateur scanne, obtient sa reponse en 3 secondes, et ferme l'application satisfait — c'est un succes, pas un echec.

**Ce qu'on mesure a la place** : Le temps jusqu'a resolution. Plus court = mieux.

### 4.2 Le Nombre de Sessions par Jour

**Pourquoi les autres l'optimisent** : Plus de sessions = plus d'engagement = meilleur ratio DAU/MAU.

**Pourquoi Naqiy le refuse** : On ne veut pas que l'utilisateur revienne 10 fois par jour. On veut qu'il revienne quand il a un besoin reel — pendant ses courses, 2-3 fois par semaine. Si un utilisateur ouvre l'application 10 fois par jour, c'est potentiellement un signe de waswas (obsession), pas d'engagement sain.

**Ce qu'on mesure a la place** : Scans/semaine. 3-5 = sain et regulier.

### 4.3 Les Notifications Ouvertes

**Pourquoi les autres l'optimisent** : Plus de notifications ouvertes = plus de re-engagement = meilleure retention.

**Pourquoi Naqiy le refuse** : Bombarder l'utilisateur de notifications pour le faire revenir est un dark pattern. Plus de notifications ouvertes peut signifier plus d'anxiete generee, pas plus de valeur delivree.

**Ce qu'on mesure a la place** : Notifications utiles ouvertes — uniquement les alertes sanitaires, les reponses a ses signalements, les mises a jour de produits favoris. Pas les "Vous n'avez pas scanne depuis 3 jours !" ou les "Decouvrez les nouveaux commerces !".

### 4.4 La Longueur Maximale des Streaks

**Pourquoi les autres l'optimisent** : Des streaks longs = retention forcee = utilisateurs "captures".

**Pourquoi Naqiy le refuse** : Un streak de 365 jours peut etre le signe d'une obsession malsaine (waswas). Le systeme de gamification de Naqiy inclut des streak freezes (protection contre la perte de streak) et des milestones qui recompensent sans punir. Si un utilisateur perd son streak, il ne doit pas se sentir coupable.

**Ce qu'on mesure a la place** : Streak moyen. 7-14 jours = sain et regulier. Au-dela de 30 jours continus, un message doux : "Masha'Allah pour ta regularite ! Rappel : la base en Islam est la permission."

### 4.5 Les Pages Vues

**Pourquoi les autres l'optimisent** : Plus de pages vues = plus de surface publicitaire.

**Pourquoi Naqiy le refuse** : C'est une vanity metric pure. 100 pages vues sans action utile valent moins que 3 pages vues avec un scan, un signalement, et une navigation vers un commerce.

**Ce qu'on mesure a la place** : Actions completees (scan, signalement, navigation GPS vers un commerce, partage ShareCard).

---

## 5. Les Dashboards Ideaux

### 5.1 Dashboard Fondateur — Vue Quotidienne

```
┌──────────────────────────────────────────────────────────┐
│  NAQIY — Dashboard Fondateur                     22/02/26 │
├──────────┬──────────┬──────────┬─────────────────────────┤
│ DAU      │ Scans    │ Reports  │ Verdicts resolus        │
│ 847      │ 2,341    │ 12       │ 89% (cible: 80%)        │
│ +12% ↑   │ +8% ↑    │ +3 ↑     │ -2% ↓                   │
├──────────┴──────────┴──────────┴─────────────────────────┤
│ NORTH STAR : Decisions eclairees cette semaine           │
│ ████████████████████████████░░░ 16,408 (+7%)             │
├──────────────────────────────────────────────────────────┤
│ RETENTION                                                │
│ J1: 62% | J7: 38% | J30: 24%                            │
│ ████████████████░░░░░░░░░░░░░░ (Cible J30: 25%)         │
├──────────────────────────────────────────────────────────┤
│ SANTE TECHNIQUE                                          │
│ Crash-free: 99.7% | API errors: 0.3% | P95 latency: 280ms│
├──────────────────────────────────────────────────────────┤
│ ALERTES                                                  │
│ ! 3 signalements non traites depuis > 48h                │
│ ! "Produit inconnu" rate monte a 23% (+5%)               │
│ OK 0 crash critique dans les dernieres 24h               │
│ OK Temps moyen scan→verdict : 2.1s                       │
└──────────────────────────────────────────────────────────┘
```

### 5.2 Dashboard Mission — Vue Hebdomadaire

```
┌──────────────────────────────────────────────────────────┐
│  IMPACT COMMUNAUTAIRE — Semaine 8, 2026                  │
├──────────────────────────────────────────────────────────┤
│ Decisions eclairees cette semaine : 16,408               │
│ Produits enrichis par la communaute : 23                 │
│ Signalements valides : 8/12 (67%)                        │
│ Nouveaux produits dans la base : 47                      │
│ Commerces decouverts via la carte : 312 navigations GPS  │
├──────────────────────────────────────────────────────────┤
│ TOP PRODUITS SCANNES                                     │
│ 1. Nutella 750g (842 scans) — Douteux → E471            │
│ 2. Haribo Tagada (523 scans) — Haram → E120 (carmin)    │
│ 3. Knorr Bouillon Poule (411 scans) — Halal             │
│ 4. Kinder Bueno (389 scans) — Douteux → E322            │
│ 5. Panzani Pates (201 scans) — Halal                    │
├──────────────────────────────────────────────────────────┤
│ DISTRIBUTION MADHAB                                      │
│ Hanafi: 42% | Maliki: 31% | Shafi'i: 18% | Hanbali: 9% │
├──────────────────────────────────────────────────────────┤
│ INDICATEUR DE SANTE COMMUNAUTAIRE                        │
│ Contributions/utilisateur: 0.03 (cible: 0.05)           │
│ Signalements abusifs: 2% (seuil alerte: 10%)            │
│ Avis moyen commerces: 4.1/5                              │
└──────────────────────────────────────────────────────────┘
```

### 5.3 Dashboard Anti-Addiction — Vue Mensuelle

```
┌──────────────────────────────────────────────────────────┐
│  SANTE DES UTILISATEURS — Fevrier 2026                   │
├──────────────────────────────────────────────────────────┤
│ Utilisateurs avec > 20 scans/jour : 3 (0.04%)           │
│ Streak moyen : 8 jours (cible: 7-14)                    │
│ Streak max observe : 47 jours                            │
│ Utilisateurs avec > 30 jours streak continu : 12 (0.15%)│
│ Messages de pause affiches : 28                          │
│ Sessions > 15 minutes : 5% (seuil alerte: 10%)          │
├──────────────────────────────────────────────────────────┤
│ NOTIFICATIONS                                            │
│ Envoyees : 12,400 | Ouvertes : 3,720 (30%)              │
│ Type "alerte sanitaire" : 89% taux d'ouverture           │
│ Type "marketing" : 12% taux d'ouverture                  │
│ → Decision : reduire les notifs marketing a 1/semaine    │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Implementation Technique

### 6.1 Stack Analytics Actuelle et Cible

```
ACTUEL                                    CIBLE (An 1-2)
──────                                    ──────────────

PostHog (mobile)                          PostHog (enrichi)
├── Events custom (basiques)              ├── Events custom (complets, cf. 6.2)
├── Funnels (non configures)              ├── Funnels onboarding configures
└── Feature flags (non utilises)          ├── Cohort analysis
                                          ├── Feature flags A/B testing
                                          └── Session replays

Sentry (backend + mobile)                 Sentry (inchange)
├── Crashes                               ├── Crashes
├── Error rates                           ├── Error rates
├── Transaction performance               ├── Transaction performance
└── API latency                           └── API latency

PostgreSQL (requetes manuelles)           Metabase ou Grafana
├── SQL ad hoc                            ├── Dashboards visuels
└── Export CSV                            ├── Alertes automatiques
                                          ├── Rapports hebdomadaires
                                          └── Partage equipe
```

### 6.2 Events PostHog a Implementer

| Event | Proprietes | Declenchement |
|-------|-----------|---------------|
| `scan_completed` | productId, verdict, confidence, isNewProduct, timeToVerdict | Apres affichage du verdict |
| `scan_unknown` | barcode, timestamp | Quand le produit n'est pas trouve |
| `scan_shared` | type (card/text), platform (whatsapp/instagram/other) | Apres partage ShareCard |
| `report_created` | type, hasPhotos, productId | Apres envoi de signalement |
| `review_created` | targetType (store/product), rating | Apres publication d'avis |
| `store_viewed` | storeId, distance, source (map/search/scan) | Quand la fiche commerce est ouverte |
| `store_navigated` | storeId, distance | Quand l'utilisateur lance la navigation GPS |
| `premium_paywall_shown` | source, featureBlocked | Quand le paywall est affiche |
| `premium_converted` | plan (monthly/annual), source | Quand l'achat est confirme |
| `premium_cancelled` | reason (si capture), durationMonths | Quand l'abonnement est annule |
| `favorite_added` | productId, currentCount | Quand un favori est ajoute |
| `madhab_selected` | madhab, isChange | Quand le madhab est choisi ou change |
| `onboarding_step` | step (1-5), completed | A chaque etape de l'onboarding |
| `streak_milestone` | days, xpBonus | Quand un milestone de streak est atteint |
| `pause_message_shown` | sessionDuration, scanCount | Quand le message de pause est affiche |

### 6.3 Alertes Automatiques a Configurer

| Alerte | Condition | Canal | Destinataire |
|--------|-----------|-------|--------------|
| Crash spike | > 5 crashes en 1 heure | Sentry → Slack/email | Fondateur |
| API down | Health check echoue 3x consecutives | Railway → email | Fondateur |
| Taux de resolution chute | < 70% sur 24h glissantes | PostHog → email | Fondateur |
| Signalement non traite | > 72h sans resolution | Cron job → notification | Fondateur |
| Utilisateur en waswas potentiel | > 20 scans/jour, 3 jours consecutifs | PostHog → flag interne | Systeme (message automatique) |
| Churn premium spike | > 5 annulations en 1 jour | RevenueCat → email | Fondateur |

---

## 7. Les Pieges de la Mesure

### 7.1 La Loi de Goodhart

"Quand une mesure devient un objectif, elle cesse d'etre une bonne mesure."

Si on optimise le taux de resolution en abaissant le seuil de confiance pour classer plus de produits, on augmente le chiffre mais on degrade la qualite. Si on optimise la retention en bombardant de notifications, on augmente les retours mais on degrade l'experience.

**Regle** : Toute metrique est accompagnee d'une contre-metrique qui empeche la triche :
- Taux de resolution ↑ + Precision des verdicts ↑ (pas l'un sans l'autre)
- Retention J30 ↑ + Temps moyen de session stable (pas de retention par addiction)
- Notifications ouvertes ↑ + Taux de desinstallation post-notification ↓

### 7.2 Les Vanity Metrics a Ignorer

| Metrique | Pourquoi elle flatte | Pourquoi elle ment |
|----------|---------------------|-------------------|
| Downloads totaux | "On a 100K downloads !" | 90% n'ouvrent jamais l'app apres l'installation |
| Nombre de comptes crees | "On a 50K inscrits !" | 70% ne scannent jamais un produit |
| Followers sur les reseaux | "On a 10K followers !" | 0 correlation avec l'usage de l'app |
| Articles de presse | "On a ete mentionne 5 fois !" | La presse ne fait pas des utilisateurs fideles |

---

## 8. La Balance (Al-Mizan) du Succes

Le succes de Naqiy ne se mesure pas a un seul nombre. Il se mesure a l'**equilibre** entre trois plateaux :

```
                    MISSION
                   /       \
                  /   Naqiy   \
                 /             \
            PRODUIT ─────── BUSINESS
```

- **Mission** : Est-ce que les gens sont mieux informes sur ce qu'ils mangent ?
- **Produit** : Est-ce que l'experience est excellente, respectueuse, et fiable ?
- **Business** : Est-ce que l'entreprise survit pour continuer a servir ?

Si le business va bien mais la mission echoue → on a trahi la communaute.
Si la mission va bien mais le produit est mediocre → on sera depasse par un concurrent.
Si le produit est excellent mais le business echoue → on disparaitra, et la communaute perdra son outil.

Les trois plateaux doivent etre en equilibre. C'est ca, al-mizan.

---

> La balance juste ne penche vers aucun cote. Elle maintient l'equilibre — entre ce qu'on mesure et ce qu'on ne mesure pas, entre ce qu'on optimise et ce qu'on refuse d'optimiser, entre la croissance et l'integrite. La vraie purete — naqa' — c'est aussi la purete de nos intentions quand on regarde les chiffres.
