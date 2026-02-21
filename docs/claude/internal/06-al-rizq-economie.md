# 06 — Al-Rizq : Economie Halal

> "Ya ayyuha al-ladhina amanu la ta'kulu amwalakum baynakum bi-l-batil"
> — O vous qui croyez, ne mangez pas vos biens entre vous de maniere illicite. (Coran 4:29)

---

## Le Paradoxe Fondamental

Optimus Halal existe pour proteger le musulman contre l'opacite de l'industrie alimentaire. Mais pour continuer a exister, l'app doit generer du revenu. **Comment monetiser sans trahir la mission ?**

Ce n'est pas une question theorique — c'est le point de fracture ou la plupart des projets "ethiques" meurent ou se corrompent.

---

## 1. La Ligne Rouge Absolue : Le Statut Halal Est Gratuit

### La Regle Cardinale

> **Le verdict halal/doubtful/haram d'un produit est TOUJOURS gratuit. Pour tout le monde. Pour toujours.**

Cette regle n'est pas negociable. Elle est inscrite dans l'ADN du produit. Voici pourquoi :

1. **Katm al-ilm (cacher le savoir religieux) est haram** : Si l'app sait qu'un produit contient un ingredient douteux et met cette information derriere un paywall, elle cache un savoir qui affecte la pratique religieuse. C'est interdit.

2. **La confiance est l'actif numero 1** : Le jour ou un utilisateur decouvre qu'il doit payer pour savoir si ce qu'il mange est halal, c'est le jour ou il desinstalle l'app ET en parle a 10 personnes.

3. **Le precedent est mortel** : Si on met le verdict derriere un paywall "temporairement pour les finances", on ne reviendra jamais en arriere. La tentation sera toujours plus forte.

### Ce Qui Est Gratuit (Pour Toujours)

| Fonctionnalite | Justification |
|---------------|---------------|
| Scan d'un produit + verdict | Droit fondamental a l'information religieuse |
| Liste des ingredients + additifs | Transparence de base |
| Avis du madhab de l'utilisateur | Personnalisation religieuse essentielle |
| Signalement d'un probleme | Contribution communautaire |
| Carte des commerces halal | Service communautaire |
| Alertes sanitaires | Protection de la sante |

---

## 2. Le Modele Economique — Freemium Ethique

### 2.1 Structure de Monetisation

```
                GRATUIT (a vie)                        PREMIUM (Optimus+)
┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐
│ ✓ Scan illimite                     │  │ ✓ Tout le gratuit +                 │
│ ✓ Verdict halal/doubtful/haram      │  │ ✓ Details avances (analyse chimique)│
│ ✓ Ingredients + additifs            │  │ ✓ Historique complet de scans       │
│ ✓ Avis madhab personnalise          │  │ ✓ Filtres avances sur la carte      │
│ ✓ Carte des commerces               │  │ ✓ Mode hors-ligne                   │
│ ✓ Alertes                           │  │ ✓ Themes visuels exclusifs          │
│ ✓ Gamification de base              │  │ ✓ Badges et recompenses             │
│ ✓ 1 signalement/jour                │  │ ✓ Signalements illimites            │
│ ✓ Favoris (limit 20)               │  │ ✓ Favoris illimites                 │
│                                     │  │ ✓ Alertes push personnalisees       │
│                                     │  │ ✓ Profil sante avance               │
│                                     │  │ ✓ Support prioritaire               │
└─────────────────────────────────────┘  └─────────────────────────────────────┘
```

### 2.2 Le Critere de Partition

La frontiere gratuit/premium suit cette regle :

| Est gratuit | Est premium |
|-------------|-------------|
| Ce qui repond a "Est-ce halal ?" | Ce qui ameliore l'experience au-dela du minimum |
| Ce qui protege la sante | Ce qui apporte du confort |
| Ce qui permet de contribuer (base) | Ce qui donne plus de profondeur d'analyse |
| Ce qui informe | Ce qui personnalise au maximum |

### 2.3 Feature Flags — L'Implementation

Le systeme de feature flags dans `config.ts` controle ces portes :

```typescript
// Gates premium (toutes desactivees en V1)
paywallEnabled: false,         // Le paywall n'est pas encore actif
favoritesLimitEnabled: false,  // Pas de limite de favoris en V1
scanHistoryLimitEnabled: false, // Pas de limite d'historique en V1
offlineCacheEnabled: false,    // Hors-ligne pas encore ready
premiumMapEnabled: false,      // Filtres carte avances
healthProfileEnabled: false,   // Profil sante
```

**Strategie V1** : TOUT est gratuit. Le premium n'est pas encore active. Pourquoi ? Parce qu'il faut d'abord prouver la valeur avant de demander de l'argent. Un utilisateur qui n'a jamais ete impressionne par le gratuit ne paiera jamais pour le premium.

---

## 3. Les Sources de Revenu — Le Plan

### 3.1 B2C : L'Abonnement Optimus+

| Parametre | Valeur |
|-----------|--------|
| Prix cible | 2,99€/mois ou 24,99€/an |
| Provider | RevenueCat (App Store + Play Store) |
| Backend | `subscriptionRouter` avec verification de receipts |
| Tiers | `free` / `premium` dans la table `users` |
| Expiration | Auto-downgrade quand `subscriptionExpiresAt < now()` |

Le code backend existe deja :
- `subscription.getStatus` verifie le tier et auto-downgrade
- `subscription.getHistory` affiche l'historique d'evenements
- `subscription.verifyPurchase` est VOLONTAIREMENT bloque — pas de verification de receipt sans serveur RevenueCat (risque CVSS 8.1)

**Le prix de 2,99€/mois est delibere** : C'est moins qu'un kebab. Le framing est "Pour le prix d'un cafe par mois, vous protegez votre famille."

### 3.2 B2B : Les Commercants

Le vrai potentiel economique est B2B :

| Offre | Description | Prix cible |
|-------|-------------|------------|
| **Profil verifie** | Badge "Verifie par Optimus" sur la carte | 9,90€/mois |
| **Profil enrichi** | Photos, menu, horaires detailles, promotions | 19,90€/mois |
| **Visibilite locale** | Apparaitre en premier dans le radius 1km | 29,90€/mois |
| **Analytics** | Nombre de vues, clics, navigation vers le commerce | 19,90€/mois |

**Le garde-fou absolu** : La visibilite payante n'affecte JAMAIS le `relevanceScore` naturel. Un commerce paye apparait avec un badge "Sponsorise" — jamais au-dessus du classement organique. Il n'existe pas de champ `boostPaid` dans le schema et il n'en existera jamais.

### 3.3 B2B2C : Les Marques

| Offre | Description | Condition |
|-------|-------------|-----------|
| **Certification Optimus** | Label de confiance verifie par notre Conseil Scientifique | Audit reel + documentation |
| **Contenu sponsorise** | Articles educatifs marques "Publie par [marque]" | Contenu verifie, pas de mensonge |
| **Donnees anonymisees** | "42% des scans de votre produit viennent de Paris" | Strictement anonymise, opt-in RGPD |

**Ce qui est interdit** :
- Payer pour ameliorer le statut halal d'un produit
- Payer pour supprimer des avis negatifs
- Payer pour apparaitre dans les resultats de scan
- Payer pour masquer un signalement communautaire

---

## 4. Economie Islamique — Les Principes Appliques

### 4.1 Pas de Riba (Interet)

Si Optimus Halal leve des fonds :
- Pas de dette avec interet (pret bancaire classique)
- Alternatives : equity (parts), sukuk (obligations islamiques), financement participatif halal
- Le revenu doit venir de la valeur creee, pas du temps de l'argent

### 4.2 Pas de Gharar (Incertitude Excessive)

- Les prix sont clairs et annonces a l'avance
- Pas de "premiers 1000 utilisateurs gratuits puis surprise"
- Pas d'abonnement avec tacite reconduction sans rappel clair
- Pas de frais caches

### 4.3 Pas de Maysir (Speculation)

- Pas de loterie ou de tirage au sort comme mecanisme d'engagement
- Les recompenses sont basees sur le merite (effort), pas la chance
- Pas de "roue de la fortune" ou de "coffre a ouvrir"

### 4.4 Zakat Numerique

Si l'app genere du profit :
- 2,5% du benefice net est reserve pour des causes communautaires
- Transparence totale sur l'utilisation (rapport annuel public)
- Causes cibles : education alimentaire, aide aux familles, soutien aux petits commercants halal

---

## 5. Projections Financieres — Lucidite, Pas Reve

### 5.1 Hypotheses Conservative

| Metrique | An 1 | An 2 | An 3 |
|----------|------|------|------|
| Utilisateurs actifs mensuels | 10K | 50K | 200K |
| Taux de conversion premium | 2% | 4% | 6% |
| ARPU premium mensuel | 2,99€ | 2,99€ | 2,99€ |
| Commercants B2B | 20 | 150 | 500 |
| ARPU B2B mensuel | 14,90€ | 19,90€ | 24,90€ |

### 5.2 Revenu Projete

| Source | An 1 | An 2 | An 3 |
|--------|------|------|------|
| B2C (Optimus+) | 7K€ | 72K€ | 430K€ |
| B2B (Commercants) | 3,6K€ | 36K€ | 150K€ |
| B2B2C (Marques) | 0€ | 15K€ | 80K€ |
| **Total** | **~11K€** | **~123K€** | **~660K€** |

### 5.3 Couts Fixes Mensuels (Estimes)

| Poste | Cout |
|-------|------|
| Railway (backend + DB + Redis) | ~50€ |
| Apple Developer Account | 8€ (99€/an) |
| Google Play Developer | ~2€ (25$ unique) |
| Mapbox (API) | 0€ (tier gratuit 50K requetes/mois) |
| RevenueCat | 0€ (jusqu'a 2500$/mois de revenus) |
| Sentry | 0€ (tier gratuit) |
| PostHog | 0€ (tier gratuit) |
| **Total infra** | **~60€/mois** |

L'app est concue pour etre **rentable a micro-echelle** : 60€/mois de couts fixes = 20 abonnes premium suffisent pour couvrir l'infrastructure.

---

## 6. Le Risk de Corruption — Auto-Diagnostic

### Les Signaux d'Alarme

Si un jour l'un de ces signaux apparait, l'app a perdu sa voie :

| Signal | Diagnostic |
|--------|------------|
| "On pourrait monetiser les resultats de scan premium" | La tentation du paywall sur la verite |
| "Les commercants qui paient ont de meilleurs scores" | La corruption du ranking |
| "On va cacher les avis negatifs des partenaires" | La censure pour le revenu |
| "Les gros certificateurs nous sponsorisent" | Le conflit d'interet sur la verite |
| "On fait de la pub pour des produits qu'on n'a pas verifies" | L'abandon de la mission |
| "La retention compte plus que la satisfaction" | Le virage dark pattern |

### Le Test Al-Rizq

Avant chaque decision financiere :

1. **Est-ce que le revenu vient de la valeur creee ?** (Oui = halal, Non = gharar)
2. **Est-ce que l'utilisateur sait exactement ce qu'il paie ?** (Oui = transparent, Non = tomperie)
3. **Est-ce que ca fonctionne aussi bien sans pression ?** (Oui = ethique, Non = dark pattern)
4. **Est-ce que je pourrais l'expliquer a un imam ?** (Oui = confiance, Non = honte)

---

> Le rizq (subsistance) vient d'Allah. Notre travail est de creer de la valeur avec excellence et integrite. Le revenu est une consequence, jamais un objectif premier.
