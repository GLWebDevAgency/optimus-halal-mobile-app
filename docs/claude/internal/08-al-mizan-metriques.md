# 08 — Al-Mizan : Metriques et Mesure

> "Wa aqimu al-wazna bi-l-qist wa la tukhsiru al-mizan"
> — Etablissez la pesee avec equite et ne faussez pas la balance. (Coran 55:9)

---

## Mesurer Ce Qui Compte, Pas Ce Qui Flatte

La plupart des startups mesurent ce qui fait plaisir aux investisseurs : downloads, MAU, temps passe dans l'app. Optimus Halal mesure ce qui fait plaisir a Allah : **est-ce que l'utilisateur a ete aide ?**

Cela ne veut pas dire qu'on ignore les metriques business — cela veut dire qu'elles sont secondaires. Un million d'utilisateurs qui ne trouvent pas de reponse a leur question halal est un echec. Mille utilisateurs qui prennent des decisions eclairees est un succes.

---

## 1. La Hierarchie des Metriques

### Niveau 1 : Metriques de Mission (L'essentiel)

| Metrique | Definition | Cible | Mesure actuelle |
|----------|-----------|-------|-----------------|
| **Taux de resolution** | % de scans qui donnent un verdict clair (halal/haram, pas "inconnu") | > 80% | Non mesure |
| **Confiance moyenne des verdicts** | Score moyen de confiance sur les verdicts affiches | > 75% | Non mesure |
| **Taux de satisfaction** | % d'utilisateurs qui jugent le verdict "utile" (feedback post-scan) | > 85% | Non implemente |
| **Signalements traites** | % de signalements avec resolution dans les 72h | > 90% | 0% (pas de systeme de traitement) |
| **Alternatives proposees** | % de verdicts "douteux/haram" qui offrent des alternatives | > 70% | Partiel (lie aux stores proches) |

### Niveau 2 : Metriques Produit (Le comment)

| Metrique | Definition | Cible |
|----------|-----------|-------|
| **DAU/MAU ratio** | Utilisateurs actifs quotidiens / mensuels (stickiness) | > 25% |
| **Scans/utilisateur/semaine** | Frequence d'utilisation du scan | 3-5 |
| **Retention J1 / J7 / J30** | % d'utilisateurs qui reviennent | 60% / 40% / 25% |
| **Taux de contribution** | % d'utilisateurs qui ont fait un signalement ou avis | > 5% |
| **Taux d'adoption de la carte** | % d'utilisateurs qui ouvrent la carte au moins 1x/semaine | > 30% |
| **Funnel onboarding** | % de comptes crees qui scannent dans les 5 minutes | > 70% |
| **Taux de partage** | % de scans qui sont partages (ShareCard) | > 3% |

### Niveau 3 : Metriques Business (La consequence)

| Metrique | Definition | Cible An 1 |
|----------|-----------|------------|
| **MRR** (Monthly Recurring Revenue) | Revenu mensuel recurrent | 1K€ |
| **Taux de conversion freemium** | % utilisateurs gratuits → premium | 2% |
| **CAC** (Customer Acquisition Cost) | Cout d'acquisition d'un utilisateur | < 1€ |
| **LTV** (Lifetime Value) | Valeur d'un utilisateur sur sa duree de vie | > 10€ |
| **LTV/CAC ratio** | Rentabilite de l'acquisition | > 3x |
| **Churn premium** | % d'abonnes qui annulent par mois | < 8% |
| **NPS** (Net Promoter Score) | Recommanderiez-vous l'app ? | > 50 |

---

## 2. Ce Qui Est Mesure Aujourd'hui

### 2.1 Analytics en Place

| Outil | Ce qu'il mesure | Statut |
|-------|----------------|--------|
| **PostHog** | Events custom, funnels, retention | Active (mobile) |
| **Sentry** | Crashes, erreurs, performance | Active (backend + mobile) |
| **tRPC `stats.userDashboard`** | totalScans, totalReports par utilisateur | Active |
| **tRPC `notification.getUnreadCount`** | Notifications non lues | Active |

### 2.2 Donnees Disponibles dans la DB

| Table | Metrique derivable |
|-------|-------------------|
| `scans` | Scans/jour, scans/utilisateur, produits les plus scannes |
| `reports` | Signalements/jour, types de problemes, temps de resolution |
| `reviews` | Avis/jour, note moyenne, taux de "helpful" |
| `users` | Inscriptions/jour, niveau moyen, streak moyen |
| `pointTransactions` | XP distribue, actions les plus recompensees |
| `favorites` | Produits les plus favorises, taux de favoritisme |
| `stores` | Stores les plus visites, repartition geographique |

### 2.3 Ce Qui N'Est PAS Mesure (Et Devrait L'Etre)

| Metrique manquante | Pourquoi c'est important |
|-------------------|--------------------------|
| Taux de resolution de scan | Le KPI numero 1 de la mission |
| Temps entre scan et decision | L'app aide-t-elle a decider rapidement ? |
| Taux de retour apres verdict "inconnu" | L'utilisateur abandonne-t-il ? |
| Carte : rayon moyen de recherche | Les stores sont-ils assez proches ? |
| Carte : taux de navigation GPS | L'utilisateur va-t-il vraiment au commerce ? |
| Funnel onboarding complet | Ou perd-on les nouveaux utilisateurs ? |
| Impact du Ramadan sur l'usage | Les features Ramadan marchent-elles ? |

---

## 3. Le Dashboard Ideal

### 3.1 Vue Fondateur (Quotidienne)

```
┌─────────────────────────────────────────────────┐
│  OPTIMUS HALAL — Dashboard Fondateur            │
├──────────┬──────────┬──────────┬────────────────┤
│ DAU      │ Scans    │ Reports  │ Verdicts       │
│ 847      │ 2,341    │ 12       │ 89% resolus    │
│ +12% ↑   │ +8% ↑    │ +3 ↑     │ -2% ↓         │
├──────────┴──────────┴──────────┴────────────────┤
│ RETENTION                                       │
│ J1: 62% | J7: 38% | J30: 24%                   │
│ ■■■■■■■■■■■■░░░░░░░░ (Target J30: 25%)         │
├─────────────────────────────────────────────────┤
│ ALERTES                                         │
│ ⚠ 3 signalements non traites (>48h)            │
│ ⚠ "Produit inconnu" rate monte a 23% (+5%)     │
│ ✓ 0 crash critique dernières 24h               │
└─────────────────────────────────────────────────┘
```

### 3.2 Vue Mission (Hebdomadaire)

```
┌─────────────────────────────────────────────────┐
│  IMPACT COMMUNAUTAIRE — Semaine 8               │
├─────────────────────────────────────────────────┤
│ Decisions eclairees cette semaine : 16,408      │
│ Produits enrichis par la communaute : 23        │
│ Signalements valides : 8/12                     │
│ Nouveaux produits dans la base : 47             │
│ Commerces decouverts via la carte : 312 visites │
├─────────────────────────────────────────────────┤
│ TOP PRODUITS SCANNES                            │
│ 1. Nutella (842 scans) — Doubtful → E471       │
│ 2. Haribo Tagada (523 scans) — Haram → E120    │
│ 3. Knorr Bouillon (411 scans) — Halal ✓        │
├─────────────────────────────────────────────────┤
│ MADHAB DISTRIBUTION                             │
│ Hanafi: 42% | Maliki: 31% | Shafi'i: 18% |     │
│ Hanbali: 9%                                     │
└─────────────────────────────────────────────────┘
```

---

## 4. Les Anti-Metriques — Ce Qu'on Refuse de Maximiser

| Metrique classique | Pourquoi on la refuse | Ce qu'on mesure a la place |
|-------------------|----------------------|---------------------------|
| **Temps passe dans l'app** | Plus de temps ≠ plus de valeur. Un scan qui prend 3 secondes et resout le doute est meilleur qu'un scan qui genere 5 minutes de navigation confuse. | Temps jusqu'a resolution (plus court = mieux) |
| **Nombre de sessions/jour** | On ne veut pas que l'utilisateur revienne 10 fois. On veut qu'il revienne quand il a besoin (courses = 2-3x/semaine). | Scans/semaine (3-5 = sain) |
| **Notifications ouvertes** | Plus de notifications ouvertes peut signifier plus d'anxiete generee. | Notifications UTILES ouvertes (alertes sanitaires, pas marketing) |
| **Streak length max** | Un streak de 365 jours peut etre obsessionnel (waswas). | Streak moyen (7-14 jours = sain et regulier) |
| **Pages vues** | Vanity metric pure. | Actions completees (scan, signalement, navigation vers commerce) |

---

## 5. Implementation Technique

### 5.1 Stack Analytics

```
PostHog (mobile)                Sentry (backend + mobile)
├── Events custom               ├── Crashes
├── Funnels                     ├── Error rates
├── Cohort analysis             ├── Transaction performance
├── Feature flags A/B           ├── Slow queries
└── Session replays (futur)     └── API latency

PostgreSQL (DB directe)         Future: Metabase / Grafana
├── Requetes SQL sur les tables ├── Dashboards visuels
├── Aggregations quotidiennes   ├── Alertes automatiques
└── Export CSV                  └── Rapports automatiques
```

### 5.2 Events PostHog a Implementer

| Event | Proprietes | Quand |
|-------|-----------|-------|
| `scan_completed` | productId, verdict, confidence, isNewProduct | Apres verdict |
| `scan_unknown` | barcode | Quand produit non trouve |
| `report_created` | type, hasPhotos | Apres signalement |
| `review_created` | targetType, rating | Apres avis |
| `store_viewed` | storeId, distance, source | Quand store ouvert depuis carte |
| `share_completed` | type (card/text), platform | Apres partage |
| `premium_shown` | source, feature | Quand paywall montre |
| `premium_converted` | plan, source | Quand achat premium |
| `favorite_added` | productId | Quand favori ajoute |
| `madhab_selected` | madhab | Quand madhab choisi/change |

---

## 6. La Balance (Al-Mizan) du Succes

Le succes d'Optimus Halal ne se mesure pas a un seul nombre. Il se mesure a l'**equilibre** entre :

- **Mission** : Est-ce que les gens sont mieux informes ?
- **Produit** : Est-ce que l'experience est excellente ?
- **Business** : Est-ce que l'entreprise survit pour continuer ?

Si le business va bien mais la mission echoue → on a trahi.
Si la mission va bien mais le produit est mediocre → on sera depasse.
Si le produit est excellent mais le business echoue → on disparaitra.

> La balance juste ne penche vers aucun cote. Elle maintient l'equilibre — c'est ca, al-mizan.
