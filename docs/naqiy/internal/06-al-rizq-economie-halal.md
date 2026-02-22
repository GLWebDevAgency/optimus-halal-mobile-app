# 06 — Al-Rizq (الرزق) — Economie Halal

> "Ya ayyuha al-ladhina amanu la ta'kulu amwalakum baynakum bi-l-batil illa an takuna tijaratan 'an taradin minkum"
> — O vous qui croyez, ne mangez pas vos biens entre vous de maniere illicite, a moins qu'il ne s'agisse d'un commerce par consentement mutuel. (Coran 4:29)

---

## Le Paradoxe Fondamental de Naqiy

Naqiy existe pour proteger le musulman contre l'opacite de l'industrie alimentaire. Mais pour continuer a exister — pour payer les serveurs, pour maintenir la base de donnees, pour developper de nouvelles fonctionnalites — l'application doit generer du revenu. C'est le noeud gordien de tout projet ethique : **comment monetiser sans corrompre la mission ?**

Ce n'est pas une question theorique. C'est le point de fracture exact ou la plupart des projets "ethiques" meurent (faute de revenu) ou se corrompent (en vendant ce qui devrait rester gratuit). L'histoire des applications halal en France est jalonnee de ces deux destins. Naqiy refuse les deux.

Le mot arabe "rizq" ne designe pas simplement l'argent. Il designe la subsistance — tout ce qu'Allah accorde a Ses creatures pour vivre. Le rizq est toujours suffisant quand il est cherche dans la voie juste. Ce chapitre est notre voie juste.

---

## 1. La Ligne Rouge Absolue : Le Statut Halal Est Gratuit

### 1.1 La Regle Cardinale

> **Le verdict halal/douteux/haram d'un produit est TOUJOURS gratuit. Pour tout le monde. Pour toujours. Sans exception. Sans condition. Sans limite.**

Cette regle n'est pas un choix marketing. Elle est inscrite dans les fondations memes de Naqiy. Elle ne sera jamais negociee, meme si la tresorerie est a zero. Voici pourquoi :

**Argument religieux** : Katm al-ilm — cacher un savoir religieux qui affecte la pratique du musulman — est haram selon le consensus des savants. Si Naqiy sait qu'un produit contient de la gelatine porcine et met cette information derriere un paywall, l'application cache un savoir qui touche directement l'obligation religieuse de manger halal. C'est une trahison de la mission avant d'etre une erreur business.

**Argument economique** : La confiance est l'actif numero un de Naqiy. Le jour ou un utilisateur decouvre qu'il doit payer pour savoir si ce qu'il donne a manger a ses enfants est halal, c'est le jour ou il desinstalle l'application ET en parle a dix personnes dans son groupe WhatsApp. La confiance perdue ne se rachete pas.

**Argument strategique** : Si on met le verdict derriere un paywall "temporairement pour les finances", on ne reviendra jamais en arriere. La tentation sera toujours plus forte. Chaque mois, le revenu du paywall croitra et la volonte de l'enlever diminuera. C'est un piege irreversible.

### 1.2 Ce Qui Est Gratuit (Pour Toujours)

| Fonctionnalite | Justification |
|----------------|---------------|
| Scan d'un produit + verdict complet | Droit fondamental a l'information religieuse |
| Liste des ingredients + additifs | Transparence de base |
| Avis du madhab de l'utilisateur | Personnalisation religieuse essentielle |
| Score de confiance du verdict | Honnetete sur les limites de l'analyse |
| Signalement d'un probleme (base) | Contribution communautaire |
| Carte des commerces halal (consultation) | Service communautaire |
| Alertes sanitaires | Protection de la sante |
| Gamification de base (niveaux, XP, streaks) | Engagement sain et gratuit |

### 1.3 Le Test du Paywall

Avant de placer quoi que ce soit derriere un mur payant, on applique ce test en quatre questions :

1. **Est-ce que cette information affecte la pratique religieuse de l'utilisateur ?** Si oui : gratuit, sans discussion.
2. **Est-ce que cacher cette information met en danger la sante de l'utilisateur ?** Si oui : gratuit, sans discussion.
3. **Est-ce que l'utilisateur percevra un manque d'equite ?** Si oui : gratuit, reconsiderer le modele.
4. **Est-ce que je pourrais expliquer ce choix a un imam et a un utilisateur sans baisser les yeux ?** Si non : gratuit.

---

## 2. Le Modele Economique — Freemium Ethique

### 2.1 La Philosophie : Le Premium Ajoute du Confort, Pas de la Verite

La frontiere entre gratuit et premium est limpide. Le gratuit repond a la question "Est-ce halal ?". Le premium repond a la question "Comment puis-je aller plus loin, plus vite, plus confortablement ?".

```
                GRATUIT (a vie)                         NAQIY+ (Premium)
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│ Scan illimite + verdict complet      │  │ Tout le gratuit +                    │
│ Ingredients + additifs + sources     │  │ Details avances (analyse chimique)    │
│ Avis madhab personnalise             │  │ Historique complet de scans           │
│ Score de confiance                   │  │ Filtres avances sur la carte          │
│ Carte des commerces (consultation)   │  │ Mode hors-ligne (cache local)        │
│ Alertes sanitaires                   │  │ Themes visuels exclusifs              │
│ Gamification de base                 │  │ Badges et recompenses premium         │
│ 1 signalement/jour                   │  │ Signalements illimites                │
│ Favoris (limite 20)                  │  │ Favoris illimites                     │
│                                      │  │ Alertes push personnalisees           │
│                                      │  │ Profil sante avance                   │
│                                      │  │ Support prioritaire                   │
└──────────────────────────────────────┘  └──────────────────────────────────────┘
```

### 2.2 Le Critere de Partition

| Est gratuit | Est premium |
|-------------|-------------|
| Ce qui repond a "Est-ce halal ?" | Ce qui ameliore l'experience au-dela du minimum |
| Ce qui protege la sante | Ce qui apporte du confort supplementaire |
| Ce qui permet de contribuer (base) | Ce qui donne plus de profondeur d'analyse |
| Ce qui informe | Ce qui personnalise a l'extreme |
| Ce qui construit la confiance | Ce qui recompense la fidelite |

### 2.3 Naqiy+ — L'Abonnement Premium

| Parametre | Valeur |
|-----------|--------|
| Prix cible | 2,99 EUR/mois ou 24,99 EUR/an |
| Provider | RevenueCat (App Store + Play Store) |
| Backend | `subscriptionRouter` avec verification de receipts |
| Tiers | `free` / `premium` dans la table `users` |
| Expiration | Auto-downgrade quand `subscriptionExpiresAt < now()` |

**Le prix de 2,99 EUR/mois est delibere.** C'est moins qu'un kebab. Le framing est : "Pour le prix d'un cafe par mois, tu proteges ta famille." Ce prix est assez bas pour ne pas etre un frein, assez haut pour generer du revenu significatif a l'echelle.

### 2.4 Feature Flags — L'Implementation Technique

Le systeme de feature flags controle les portes entre gratuit et premium :

```typescript
// Gates premium (toutes desactivees en V1)
paywallEnabled: false,         // Le paywall n'est pas encore actif
favoritesLimitEnabled: false,  // Pas de limite de favoris en V1
scanHistoryLimitEnabled: false, // Pas de limite d'historique en V1
offlineCacheEnabled: false,    // Hors-ligne pas encore ready
premiumMapEnabled: false,      // Filtres carte avances
healthProfileEnabled: false,   // Profil sante
```

**Strategie V1** : TOUT est gratuit. Le premium n'est pas encore active. Pourquoi ? Parce qu'il faut d'abord prouver la valeur avant de demander de l'argent. Un utilisateur qui n'a jamais ete impressionne par le gratuit ne paiera jamais pour le premium. On offre tout, on mesure la satisfaction, et seulement ensuite on introduit la barriere.

---

## 3. Les Sources de Revenu — Architecture Complete

### 3.1 B2C : L'Abonnement Naqiy+

La premiere source de revenu, la plus naturelle. L'utilisateur aime tellement le gratuit qu'il veut plus.

Le code backend existe deja :
- `subscription.getStatus` verifie le tier et auto-downgrade
- `subscription.getHistory` affiche l'historique d'evenements
- `subscription.verifyPurchase` est volontairement bloque — pas de verification de receipt sans serveur RevenueCat (risque CVSS 8.1)

### 3.2 B2B : Les Commercants — Le Vrai Potentiel

Le revenu B2B est le levier economique le plus puissant de Naqiy. Les commercants halal en France n'ont aucune plateforme de visibilite dediee. Google Maps ne filtre pas par certification halal. Instagram ne garantit pas l'authenticite. Naqiy comble ce vide.

| Offre | Description | Prix cible |
|-------|-------------|------------|
| **Profil verifie** | Badge "Verifie par Naqiy" sur la carte | 9,90 EUR/mois |
| **Profil enrichi** | Photos, menu, horaires detailles, promotions | 19,90 EUR/mois |
| **Visibilite locale** | Apparaitre en premier dans le rayon 1km (badge "Sponsorise") | 29,90 EUR/mois |
| **Analytics commerce** | Nombre de vues, clics, navigations GPS vers le commerce | 19,90 EUR/mois |

**Le garde-fou absolu** : La visibilite payante n'affecte JAMAIS le `relevanceScore` naturel. Un commerce qui paie apparait avec un badge "Sponsorise" — jamais au-dessus du classement organique sans indication. Il n'existe pas de champ `boostPaid` dans le schema de la base de donnees, et il n'en existera jamais.

### 3.3 B2B2C : Les Marques (Horizon An 2-3)

| Offre | Description | Condition |
|-------|-------------|-----------|
| **Certification Naqiy** | Label de confiance verifie par un Conseil Scientifique | Audit reel + documentation |
| **Contenu sponsorise** | Articles educatifs marques "Publie par [marque]" | Contenu verifie, pas de mensonge |
| **Donnees anonymisees** | "42% des scans de votre produit viennent de Paris" | Strictement anonymise, opt-in RGPD |

**Ce qui est formellement interdit** :
- Payer pour ameliorer le statut halal d'un produit
- Payer pour supprimer des avis negatifs
- Payer pour apparaitre dans les resultats de scan
- Payer pour masquer un signalement communautaire
- Payer pour influencer le `confidenceScore` d'un produit

---

## 4. Economie Islamique — Les Principes Appliques

Naqiy n'est pas simplement une application qui vend un service. C'est un projet qui applique les principes de l'economie islamique a sa propre structure financiere. Chaque decision monetaire passe par le filtre de la Charia economique.

### 4.1 Pas de Riba (Interet Usuraire)

Si Naqiy leve des fonds :
- **Interdit** : pret bancaire classique avec taux d'interet
- **Autorise** : equity (parts du capital), sukuk (obligations islamiques), financement participatif halal, murabaha (vente a cout majore transparent)
- **Principe** : le revenu doit venir de la valeur creee, pas du temps de l'argent

Concretement, cela signifie que le bootstrapping est privilegie. Les 60 EUR/mois de couts fixes permettent de fonctionner sans dette. C'est un avantage strategique considirable : pas de pression d'investisseurs, pas de dilution, pas de compromis ethiques pour atteindre des KPIs de croissance imposes.

### 4.2 Pas de Gharar (Incertitude Excessive)

- Les prix sont clairs et annonces a l'avance, sans surprise
- Pas de "premiers 1000 utilisateurs gratuits puis on change les regles"
- Pas d'abonnement avec reconduction tacite sans rappel explicite (notification 7 jours avant renouvellement)
- Pas de frais caches dans les offres B2B
- Pas de promesses non tenues dans les descriptions de l'App Store

### 4.3 Pas de Maysir (Speculation / Jeu de Hasard)

- Pas de loterie ou de tirage au sort comme mecanisme d'engagement
- Les recompenses de la gamification sont basees sur le merite (effort, constance, contribution), jamais sur la chance
- Pas de "roue de la fortune" ou de "coffre mystere a ouvrir"
- Pas de loot boxes deguisees en recompenses
- Les streaks recompensent la regularite, pas le hasard

### 4.4 La Zakat Numerique

Si Naqiy genere du benefice net :
- **2,5% du benefice net** est reserve pour des causes communautaires
- Transparence totale sur l'utilisation (rapport annuel public accessible dans l'application)
- Causes ciblees : education alimentaire dans les quartiers, aide aux familles en difficulte pour acceder au halal de qualite, soutien aux petits commercants halal qui veulent se faire certifier

Ce n'est pas un argument marketing. C'est une obligation que le fondateur s'impose a lui-meme, tracable, auditable, publique.

---

## 5. Projections Financieres — Lucidite, Pas Fantasme

### 5.1 Hypotheses Conservatives

Ces projections ne sont pas optimistes. Elles sont volontairement conservatrices. Mieux vaut etre agreablement surpris que cruellement decu.

| Metrique | An 1 | An 2 | An 3 |
|----------|------|------|------|
| Utilisateurs actifs mensuels (MAU) | 10 000 | 50 000 | 200 000 |
| Taux de conversion premium | 2% | 4% | 6% |
| ARPU premium mensuel | 2,99 EUR | 2,99 EUR | 2,99 EUR |
| Commercants B2B | 20 | 150 | 500 |
| ARPU B2B mensuel | 14,90 EUR | 19,90 EUR | 24,90 EUR |

### 5.2 Revenu Projete

| Source | An 1 | An 2 | An 3 |
|--------|------|------|------|
| B2C (Naqiy+) | ~7 000 EUR | ~72 000 EUR | ~430 000 EUR |
| B2B (Commercants) | ~3 600 EUR | ~36 000 EUR | ~150 000 EUR |
| B2B2C (Marques) | 0 EUR | ~15 000 EUR | ~80 000 EUR |
| **Total** | **~11 000 EUR** | **~123 000 EUR** | **~660 000 EUR** |

### 5.3 Couts Fixes Mensuels

| Poste | Cout mensuel |
|-------|-------------|
| Railway (backend + PostgreSQL + Redis) | ~50 EUR |
| Apple Developer Account | ~8 EUR (99 EUR/an) |
| Google Play Developer | ~2 EUR (25 USD unique, amorti) |
| Mapbox (API cartographique) | 0 EUR (tier gratuit 50K requetes/mois) |
| RevenueCat (gestion abonnements) | 0 EUR (gratuit jusqu'a 2500 USD/mois de revenus) |
| Sentry (crash reporting) | 0 EUR (tier gratuit) |
| PostHog (analytics) | 0 EUR (tier gratuit) |
| **Total infrastructure** | **~60 EUR/mois** |

### 5.4 L'Equation de la Survie

L'application est concue pour etre **rentable a micro-echelle**. Le seuil de rentabilite est absurdement bas :

```
60 EUR/mois de couts fixes / 2,99 EUR/abonne = 20,07 abonnes

→ 20 abonnes premium suffisent pour couvrir l'infrastructure.
→ 21 abonnes et Naqiy est rentable.
```

C'est un avantage structurel enorme. La plupart des startups brulent 50 000 EUR/mois avant de generer un centime. Naqiy brule 60 EUR/mois. Cela signifie :
- Pas de pression pour lever des fonds
- Pas de compromis ethiques pour "accelerer la croissance"
- Pas de runway de 18 mois avant la mort
- Le fondateur peut garder son emploi et developper Naqiy en parallele

### 5.5 Scenarios de Stress

| Scenario | Impact | Survie |
|----------|--------|--------|
| 0 abonne pendant 12 mois | -720 EUR de perte annuelle | Viable (le fondateur couvre sur fonds propres) |
| OpenFoodFacts ferme | Perte de la source de donnees principale | Survie via cache local + base interne enrichie |
| Apple rejette l'application | Pas de revenus iOS | Android seul + web app |
| Railway augmente ses prix x5 | 300 EUR/mois au lieu de 60 | Toujours viable avec 100 abonnes |
| Un concurrent leve 5M EUR | Pression concurrentielle | La confiance communautaire est notre moat |

---

## 6. Le Risque de Corruption — Auto-Diagnostic

### 6.1 Les Signaux d'Alarme

Si un jour l'un de ces signaux apparait, Naqiy a perdu sa voie :

| Signal | Diagnostic |
|--------|------------|
| "On pourrait monetiser les resultats de scan premium" | La tentation du paywall sur la verite |
| "Les commercants qui paient ont de meilleurs scores" | La corruption du classement |
| "On va cacher les avis negatifs des partenaires" | La censure pour le revenu |
| "Les gros certificateurs nous sponsorisent" | Le conflit d'interet sur la verite |
| "On fait de la pub pour des produits non verifies" | L'abandon de la mission |
| "La retention compte plus que la satisfaction" | Le virage dark pattern |
| "On pourrait vendre les donnees de scan des utilisateurs" | La trahison de la confiance |

### 6.2 Le Test Al-Rizq

Avant chaque decision financiere, quatre questions :

1. **Est-ce que le revenu vient de la valeur creee ?** Oui = halal. Non = gharar.
2. **Est-ce que l'utilisateur sait exactement ce qu'il paie ?** Oui = transparent. Non = tromperie.
3. **Est-ce que le service fonctionne aussi bien sans pression ?** Oui = ethique. Non = dark pattern.
4. **Est-ce que je pourrais l'expliquer a un imam, a ma mere, et a un journaliste ?** Oui = confiance. Non = honte.

Si la reponse a n'importe laquelle de ces questions est "non", la decision est rejetee. Sans exception. Sans "juste cette fois". Sans "on reviendra en arriere plus tard".

---

## 7. La Comparaison Avec les Modeles Existants

### 7.1 Ce Que Font les Autres

| Application | Modele economique | Probleme ethique |
|-------------|-------------------|------------------|
| Yuka | Freemium + recommendations payantes | Conflit d'interet sur les produits recommandes |
| Muslim Pro | Abonnement + publicite + donnees vendues (scandale 2020) | Vente de donnees de localisation de musulmans |
| Scan Halal | Gratuit (subventionne par le CFCM) | Dependance a une institution, pas d'independance |
| Halal Check | Gratuit (publicite) | Publicites non halal dans une app halal |

### 7.2 Ce Que Fait Naqiy

- Pas de publicite dans l'application (jamais)
- Pas de vente de donnees (jamais)
- Pas de dependance a une institution religieuse ou politique
- Revenu par la valeur ajoutee (premium + B2B), pas par l'exploitation

---

## 8. Le Pacte de Transparence Financiere

Quand Naqiy generera du revenu significatif (> 10 000 EUR/an), un rapport financier annuel sera publie dans l'application :

- Revenu total par source (B2C, B2B, B2B2C)
- Couts totaux par poste
- Benefice net
- Montant de la zakat numerique versee et a qui
- Decisions ethiques prises (offres refusees, partenariats rejetes)

Ce rapport ne sera pas un document marketing. Ce sera un acte de transparence brut, honnete, complet. Parce que la purete (naqa') ne concerne pas seulement les produits que l'application analyse — elle concerne aussi la maniere dont l'application gagne sa vie.

---

> Le rizq vient d'Allah. Notre travail est de creer de la valeur avec excellence et integrite. Le revenu est une consequence de la confiance, jamais un objectif qui la precede. Naqiy — pur dans ses verdicts, pur dans ses finances.
