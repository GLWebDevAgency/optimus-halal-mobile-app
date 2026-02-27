# Naqiy Trust Score — Documentation Complete

> **Version** : 1.0 — 24 fevrier 2026
> **Auteur** : Equipe Naqiy
> **Statut** : Reference interne
>
> **Fichiers source** :
> - Schema DB : `backend/src/db/schema/certifiers.ts`
> - Donnees : `backend/asset/certification-list.json`
> - Seed : `backend/src/db/seeds/run.ts`
> - UI : `optimus-halal/src/components/scan/TrustScoreBottomSheet.tsx`
> - Voir aussi : `trust-score-formula.md` (synthese), `trust-score-roadmap.md` (evolutions)

---

## Table des matieres

1. [Philosophie](#1-philosophie)
2. [Les 6 indicateurs de pratique](#2-les-6-indicateurs-de-pratique)
3. [Algorithme de calcul](#3-algorithme-de-calcul)
4. [Les 18 certifieurs — Fiches detaillees](#4-les-18-certifieurs--fiches-detaillees)
5. [Classification par tiers](#5-classification-par-tiers)
6. [Correspondance OpenFoodFacts](#6-correspondance-openfoodfacts)
7. [Architecture technique](#7-architecture-technique)
8. [Interface utilisateur](#8-interface-utilisateur)
9. [Feuille de route](#9-feuille-de-route)
10. [FAQ / Questions frequentes](#10-faq--questions-frequentes)

---

## 1. Philosophie

Le Trust Score de Naqiy mesure la **rigueur des pratiques de controle** d'un organisme de certification halal. Il repond a une question simple :

> **"A quel point cet organisme est-il strict dans ses procedures de certification ?"**

### Ce que le score est

- Un indicateur de **confiance dans la methode** de certification
- Base sur **6 criteres factuels et verifiables** (pas d'opinion)
- Calcule automatiquement a partir de donnees structurees
- Affiche sur une echelle de **0 a 100**

### Ce que le score n'est PAS

- **Pas un verdict halal/haram** — un certifieur avec un score bas peut produire du halal valide selon certaines ecoles
- **Pas un classement de qualite des produits** — il mesure le certifieur, pas le produit
- **Pas une fatwa** — c'est un outil d'aide a la decision, pas un avis religieux
- **Pas immuable** — les pratiques des certifieurs evoluent, le score aussi

### Pourquoi 6 indicateurs ?

Ces 6 criteres ont ete choisis car ils sont :
1. **Factuels** — verifiables publiquement (sites web, cahiers des charges, rapports)
2. **Discriminants** — ils separent reellement les certifieurs entre eux
3. **Pertinents** — chaque critere a un impact direct sur la fiabilite de la certification
4. **Consensuels** — les 4 ecoles de jurisprudence s'accordent sur leur importance relative

---

## 2. Les 6 indicateurs de pratique

### 2.1 Indicateurs positifs (+points)

Plus un certifieur coche ces criteres, plus il est rigoureux.

#### Controleurs salaries (+15 points)

| | |
|---|---|
| **Colonne DB** | `controllers_are_employees` |
| **Champ JSON** | `controllersAreEmployees` |
| **Poids** | **+15** |

**Signification** : Les controleurs halal sont employes directement par l'organisme de certification, et non par l'usine qu'ils controlent.

**Pourquoi c'est important** : Un controleur salarie de l'usine a un conflit d'interet — il depend financierement de l'entreprise qu'il est cense auditer. Un controleur salarie du certifieur est independant : il peut refuser un lot sans risquer son emploi.

**Cas reel** : ARGML a `controllersAreEmployees = null` avec la note : *"les controleurs sont aussi salaries de l'usine, ce qui ne garantit pas l'independance"*.

---

#### Presents a chaque production (+15 points)

| | |
|---|---|
| **Colonne DB** | `controllers_present_each_production` |
| **Champ JSON** | `controllersPresentEachProduction` |
| **Poids** | **+15** |

**Signification** : Un controleur est physiquement present lors de **chaque** session d'abattage, pas seulement lors d'audits periodiques (ex: 1 visite par mois).

**Pourquoi c'est important** : Un certifieur qui ne fait que des audits ponctuels ne peut pas garantir que les procedures sont respectees entre deux visites. La presence continue est le seul moyen de certifier avec certitude.

**Analogie** : C'est la difference entre un vigile present 24/7 et un audit de securite trimestriel.

---

#### Sacrificateurs salaries (+10 points)

| | |
|---|---|
| **Colonne DB** | `has_salaried_slaughterers` |
| **Champ JSON** | `hasSalariedSlaughterers` |
| **Poids** | **+10** |

**Signification** : Les sacrificateurs (dhobih / ذابح) sont employes et formes par l'organisme de certification lui-meme.

**Pourquoi c'est important** : Quand le certifieur emploie ses propres sacrificateurs, il controle toute la chaine — de la formation a l'execution. Le sacrificateur est qualifie selon les criteres du certifieur, pas ceux de l'industriel.

**Pourquoi +10 et pas +15** : Moins discriminant que les deux precedents. Meme sans sacrificateurs salaries, un certifieur avec des controleurs independants et presents garde un bon niveau de rigueur.

---

### 2.2 Indicateurs negatifs (-points)

Accepter ces pratiques reduit la rigueur percue de la certification.

#### Abattage mecanique volaille (-15 points)

| | |
|---|---|
| **Colonne DB** | `accepts_mechanical_slaughter` |
| **Champ JSON** | `acceptsMechanicalPoultrySlaughter` |
| **Poids** | **-15** |

**Signification** : Le certifieur accepte que la volaille soit abattue par une machine automatisee au lieu d'un etre humain.

**Pourquoi c'est penalisant** : La tasmiya (بسم الله، الله أكبر) exige une invocation consciente par un musulman au moment de l'abattage. Une machine ne peut pas invoquer le nom d'Allah de maniere consciente. Meme avec un enregistrement audio, le consensus majoritaire des savants considere cela comme invalide.

**Position des ecoles** :
- **Hanafi, Shafi'i, Hanbali** : Interdit — la tasmiya exige un humain conscient
- **Maliki** : Certains savants tolerent avec tasmiya enregistree (position minoritaire)

---

#### Electronarcose volaille (-15 points)

| | |
|---|---|
| **Colonne DB** | `accepts_electronarcosis` |
| **Champ JSON** | `acceptsPoultryElectronarcosis` |
| **Poids** | **-15** |

**Signification** : Le certifieur accepte l'electronarcose — un choc electrique administre **avant** l'abattage pour etourdir l'animal.

**Pourquoi c'est penalisant** : Le risque principal est que l'animal meure **avant** la saignee (egorgement). Si l'animal est deja mort au moment de la saignee, la viande est consideree comme mayta (animal mort sans egorgement) et donc haram. Le taux de mortalite pre-saignee varie selon le voltage, le temps d'exposition, et l'espece.

**Distinction importante** :
- **Electronarcose** = choc electrique **AVANT** la saignee (pour etourdir)
- **Electrocution post-abattage** = choc electrique **APRES** la saignee (pour faciliter le deplumage)

Ce sont deux pratiques distinctes. Seule l'electronarcose est comptee dans le score actuel.

---

#### Etourdissement bovins/ovins/agneaux (-20 points)

| | |
|---|---|
| **Colonne DB** | `accepts_stunning` |
| **Champ JSON** | `acceptsStunningForCattleCalvesLambs` |
| **Poids** | **-20** (le plus penalisant) |

**Signification** : Le certifieur accepte l'etourdissement (stunning) pour les bovins, veaux et agneaux. Cela inclut le pistolet a tige captive (bolt gun), le choc electrique, ou le CO2.

**Pourquoi c'est le plus penalisant (-20)** : L'etourdissement des grands animaux est la pratique la **plus contestee** dans la certification halal :

1. **Risque de mort** : Le bolt gun peut fracturer le crane et tuer instantanement. Contrairement a la volaille, le seuil letal est plus facilement franchi sur les bovins.
2. **Consensus quasi-unanime** : Les 4 ecoles s'accordent sur l'interdiction sauf rare exception (Maliki sous conditions tres strictes).
3. **Legislation europeenne** : L'exemption religieuse (Reglement CE 1099/2009) autorise l'abattage sans etourdissement prealable. Accepter l'etourdissement, c'est renoncer a cette exemption.

---

### 2.3 Champs stockes mais NON comptabilises

| Champ | Colonne DB | Raison de l'exclusion |
|---|---|---|
| `halal-assessment` | `halal_assessment` | C'est le **resultat** ("est-ce fiable ?"), pas un input. Le score se calcule sur les pratiques, pas sur le verdict. |
| `acceptsPostSlaughterElectrocution` | `accepts_post_slaughter_electrocution` | Stocke en DB mais **pas encore integre** dans le score. Voir section [9. Feuille de route](#9-feuille-de-route), priorite P0-A. |

---

## 3. Algorithme de calcul

### 3.1 Pseudo-code

```
raw = 0

// Indicateurs positifs
if controllersAreEmployees === true      → raw += 15
if controllersPresentEachProduction === true → raw += 15
if hasSalariedSlaughterers === true      → raw += 10

// Indicateurs negatifs
if acceptsMechanicalSlaughter === true   → raw -= 15
if acceptsElectronarcosis === true       → raw -= 15
if acceptsStunning === true              → raw -= 20

// Bornes du score brut
MIN_RAW = -50   (tout negatif, aucun positif)
MAX_RAW = +40   (tout positif, aucun negatif)

// Normalisation lineaire vers [0, 100]
score = round((raw - MIN_RAW) / (MAX_RAW - MIN_RAW) × 100)
score = clamp(score, 0, 100)
```

### 3.2 Code source (TypeScript)

Fichier : `backend/src/db/schema/certifiers.ts` — fonction `computeTrustScore()`

```typescript
export function computeTrustScore(practices: {
  controllersAreEmployees: boolean | null;
  controllersPresentEachProduction: boolean | null;
  hasSalariedSlaughterers: boolean | null;
  acceptsMechanicalPoultrySlaughter: boolean | null;
  acceptsPoultryElectronarcosis: boolean | null;
  acceptsPoultryElectrocutionPostSlaughter: boolean | null;
  acceptsStunningForCattleCalvesLambs: boolean | null;
}): number {
  let raw = 0;

  if (practices.controllersAreEmployees === true) raw += 15;
  if (practices.controllersPresentEachProduction === true) raw += 15;
  if (practices.hasSalariedSlaughterers === true) raw += 10;

  if (practices.acceptsMechanicalPoultrySlaughter === true) raw -= 15;
  if (practices.acceptsPoultryElectronarcosis === true) raw -= 15;
  if (practices.acceptsStunningForCattleCalvesLambs === true) raw -= 20;

  const MIN_RAW = -50;
  const MAX_RAW = 40;
  const normalized = Math.round(((raw - MIN_RAW) / (MAX_RAW - MIN_RAW)) * 100);

  return Math.max(0, Math.min(100, normalized));
}
```

### 3.3 Traitement des valeurs `null`

| Valeur | Traitement actuel | Signification |
|---|---|---|
| `true` | Points complets | Le certifieur confirme la pratique |
| `false` | 0 points | Le certifieur ne fait pas / n'accepte pas |
| `null` | **0 points (neutre)** | Information inconnue ou non communicable |

**Limitation connue** : `null` devrait etre legerement penalisant sur les indicateurs positifs (un certifieur qui refuse de communiquer n'inspire pas confiance). Voir P0-B dans la feuille de route.

### 3.4 Exemples de calcul

**AVS (Tier S)** :
```
raw = (+15) + (+15) + (+10) + (0) + (0) + (0) = +40
score = round((40 + 50) / 90 × 100) = round(100) = 100
```

**ARGML (Tier C)** :
```
raw = (null→0) + (+15) + (+10) + (0) + (-15) + (-20) = -10
score = round((-10 + 50) / 90 × 100) = round(44.4) = 44
```

**SFCVH (Tier F)** :
```
raw = (0) + (0) + (0) + (-15) + (-15) + (-20) = -50
score = round((-50 + 50) / 90 × 100) = round(0) = 0
```

---

## 4. Les 18 certifieurs — Fiches detaillees

### Certifieur 1 : AVS — A Votre Service

| | |
|---|---|
| **ID** | `avs-a-votre-service` |
| **Site web** | https://www.halal-avs.com |
| **Annee de creation** | 1992 |
| **Trust Score** | **100/100** (Tier S) |
| **halal-assessment** | `true` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `true` | +15 |
| Presents a chaque production | `true` | +15 |
| Sacrificateurs salaries | `true` | +10 |
| Abattage mecanique volaille | `false` | 0 |
| Electronarcose volaille | `false` | 0 |
| Electrocution post-abattage | `false` | — |
| Etourdissement bovins/ovins | `false` | 0 |

**Profil** : L'organisme de reference en France. Controleurs independants, presents a chaque abattage, sacrificateurs employes par AVS. Refuse categoriquement l'abattage mecanique, l'electronarcose et l'etourdissement. Le standard le plus strict du marche francais.

---

### Certifieur 2 : ALTAKWA

| | |
|---|---|
| **ID** | `altakwa` |
| **Site web** | https://www.altakwa.fr |
| **Annee de creation** | 1990 |
| **Trust Score** | **100/100** (Tier S) |
| **halal-assessment** | `true` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `true` | +15 |
| Presents a chaque production | `true` | +15 |
| Sacrificateurs salaries | `true` | +10 |
| Abattage mecanique volaille | `false` | 0 |
| Electronarcose volaille | `false` | 0 |
| Electrocution post-abattage | `false` | — |
| Etourdissement bovins/ovins | `false` | 0 |

**Profil** : L'un des plus anciens certifieurs halal de France (1990). Meme rigueur qu'AVS sur tous les criteres. Refus total de toutes les pratiques contestees.

---

### Certifieur 3 : European Halal Trust (EHT)

| | |
|---|---|
| **ID** | `european-halal-trust` |
| **Site web** | https://www.ehthalal.com |
| **Annee de creation** | 2015 |
| **Trust Score** | **100/100** (Tier S) |
| **halal-assessment** | `true` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `true` | +15 |
| Presents a chaque production | `true` | +15 |
| Sacrificateurs salaries | `true` | +10 |
| Abattage mecanique volaille | `false` | 0 |
| Electronarcose volaille | `false` | 0 |
| Electrocution post-abattage | `false` | — |
| Etourdissement bovins/ovins | `false` | 0 |

**Profil** : Organisme europeen recemment cree (2015) avec les standards les plus stricts. Approche paneuropeenne — certifie au-dela de la France.

---

### Certifieur 4 : Halal Monitoring Committee (HMC)

| | |
|---|---|
| **ID** | `halal-monitoring-committee` |
| **Site web** | https://www.halalhmc.org |
| **Annee de creation** | Non renseignee |
| **Trust Score** | **100/100** (Tier S) |
| **halal-assessment** | `true` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `true` | +15 |
| Presents a chaque production | `true` | +15 |
| Sacrificateurs salaries | `true` | +10 |
| Abattage mecanique volaille | `false` | 0 |
| Electronarcose volaille | `false` | 0 |
| Electrocution post-abattage | `false` | — |
| Etourdissement bovins/ovins | `false` | 0 |

**Profil** : Organisme britannique reconnu internationalement. Reference au Royaume-Uni pour la certification stricte. Meme profil que les Tier S francais.

---

### Certifieur 5 : KHALIS HALAL

| | |
|---|---|
| **ID** | `khalis-halal` |
| **Site web** | Non renseigne |
| **Annee de creation** | Non renseignee |
| **Trust Score** | **100/100** (Tier S) |
| **halal-assessment** | `true` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `true` | +15 |
| Presents a chaque production | `true` | +15 |
| Sacrificateurs salaries | `true` | +10 |
| Abattage mecanique volaille | `false` | 0 |
| Electronarcose volaille | `false` | 0 |
| Electrocution post-abattage | `false` | — |
| Etourdissement bovins/ovins | `false` | 0 |

**Profil** : Certifieur strict — meme profil complet que les autres Tier S. Peu d'informations publiques disponibles.

---

### Certifieur 6 : SIDQ

| | |
|---|---|
| **ID** | `sidq` |
| **Site web** | Non renseigne |
| **Annee de creation** | 1998 |
| **Trust Score** | **100/100** (Tier S) |
| **halal-assessment** | `true` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `true` | +15 |
| Presents a chaque production | `true` | +15 |
| Sacrificateurs salaries | `true` | +10 |
| Abattage mecanique volaille | `false` | 0 |
| Electronarcose volaille | `false` | 0 |
| Electrocution post-abattage | `false` | — |
| Etourdissement bovins/ovins | `false` | 0 |

**Profil** : "Sidq" signifie "veracite" en arabe (صدق). Actif depuis 1998, profil complet sur tous les criteres.

---

### Certifieur 7 : ACHAHADA

| | |
|---|---|
| **ID** | `achahada` |
| **Site web** | https://www.achahada.com |
| **Annee de creation** | 2009 |
| **Trust Score** | **89/100** (Tier A) |
| **halal-assessment** | `true` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `true` | +15 |
| Presents a chaque production | `true` | +15 |
| Sacrificateurs salaries | `false` | 0 |
| Abattage mecanique volaille | `false` | 0 |
| Electronarcose volaille | `false` | 0 |
| Electrocution post-abattage | `false` | — |
| Etourdissement bovins/ovins | `false` | 0 |

**Profil** : Tres strict sur les controles — controleurs independants et presents a chaque production. Refuse toutes les pratiques contestees. Seul point manquant : les sacrificateurs ne sont pas salaries par l'organisme (`hasSalariedSlaughterers = false`).

**Ce qui le separe du Tier S** : -10 points sur les sacrificateurs. Tout le reste est identique.

---

### Certifieur 8 : HALAL SERVICES

| | |
|---|---|
| **ID** | `halal-services` |
| **Site web** | https://www.halal-services.fr |
| **Annee de creation** | 2007 |
| **Trust Score** | **89/100** (Tier A) |
| **halal-assessment** | `true` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `true` | +15 |
| Presents a chaque production | `true` | +15 |
| Sacrificateurs salaries | `false` | 0 |
| Abattage mecanique volaille | `false` | 0 |
| Electronarcose volaille | `false` | 0 |
| Electrocution post-abattage | `false` | — |
| Etourdissement bovins/ovins | `false` | 0 |

**Profil** : Meme profil qu'ACHAHADA — tres bon sur les controles, refuse tout ce qui est conteste, mais pas de sacrificateurs salaries. Actif depuis 2007.

---

### Certifieur 9 : MCI — Muslim Conseil International

| | |
|---|---|
| **ID** | `muslim-conseil-international-mci` |
| **Site web** | https://www.halal-mci.info |
| **Annee de creation** | Non renseignee |
| **Trust Score** | **72/100** (Tier B) |
| **halal-assessment** | `false` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `true` | +15 |
| Presents a chaque production | `true` | +15 |
| Sacrificateurs salaries | `false` | 0 |
| Abattage mecanique volaille | `false` | 0 |
| Electronarcose volaille | `true` | **-15** |
| Electrocution post-abattage | `true` | — |
| Etourdissement bovins/ovins | `false` | 0 |

**Profil** : Bons controles (controleurs employes et presents a chaque production), mais **accepte l'electronarcose sur la volaille** (-15). N'accepte pas l'etourdissement des bovins ni l'abattage mecanique.

**Ce qui le distingue** : Le seul certifieur a etre bon sur les controles mais a accepter une pratique contestee. Son `halal-assessment = false` reflete cette ambiguite.

**Note** : Accepte aussi l'electrocution post-abattage (non comptee dans le score actuel).

---

### Certifieur 10 : ARGML — Mosquee de Lyon

| | |
|---|---|
| **ID** | `argml-mosquee-de-lyon` |
| **Site web** | https://www.hallal.mosquee-lyon.org |
| **Annee de creation** | 1995 |
| **Trust Score** | **44/100** (Tier C) |
| **halal-assessment** | `false` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `null` | **0** (ambigu) |
| Presents a chaque production | `true` | +15 |
| Sacrificateurs salaries | `true` | +10 |
| Abattage mecanique volaille | `false` | 0 |
| Electronarcose volaille | `true` | **-15** |
| Electrocution post-abattage | `true` | — |
| Etourdissement bovins/ovins | `true` | **-20** |

**Profil** : Cas complexe. Des points positifs reels : controleurs presents a chaque production (+15) et sacrificateurs salaries (+10). Mais :

- `controllersAreEmployees = null` — les notes indiquent : *"les controleurs sont aussi salaries de l'usine, ce qui ne garantit pas l'independance"*. Le doute est reel.
- Accepte l'electronarcose (-15) **ET** l'etourdissement des bovins/ovins (-20).

**Bilan** : +25 de positif, -35 de negatif = raw -10 → 44/100.

---

### Certifieur 11 : HALAL POLSKA

| | |
|---|---|
| **ID** | `halal-polska` |
| **Site web** | https://www.halal.biz.pl |
| **Annee de creation** | 2005 |
| **Trust Score** | **28/100** (Tier D) |
| **halal-assessment** | `false` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `true` | +15 |
| Presents a chaque production | `false` | 0 |
| Sacrificateurs salaries | `true` | +10 |
| Abattage mecanique volaille | `true` | **-15** |
| Electronarcose volaille | `true` | **-15** |
| Electrocution post-abattage | `true` | — |
| Etourdissement bovins/ovins | `true` | **-20** |

**Profil** : Controleurs salaries (+15) et sacrificateurs salaries (+10), ce qui est positif. Mais pas presents a chaque production (0). Et surtout : **accepte les 3 pratiques negatives** (-15 -15 -20 = -50).

**Bilan** : +25 de positif, -50 de negatif = raw -25 → 28/100. Le positif ne compense pas le negatif.

**Contexte** : Certifieur polonais, base juridique et reglementaire differente de la France.

---

### Certifieur 12 : ACMIF — Mosquee d'Evry

| | |
|---|---|
| **ID** | `acmif-mosquee-d-evry` |
| **Site web** | https://www.mosquee-evry.fr |
| **Annee de creation** | 1996 |
| **Trust Score** | **0/100** (Tier F) |
| **halal-assessment** | `false` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `false` | 0 |
| Presents a chaque production | `false` | 0 |
| Sacrificateurs salaries | `false` | 0 |
| Abattage mecanique volaille | `true` | **-15** |
| Electronarcose volaille | `true` | **-15** |
| Electrocution post-abattage | `true` | — |
| Etourdissement bovins/ovins | `true` | **-20** |

**Profil** : Aucun indicateur positif. Accepte toutes les pratiques contestees. Associee a la Mosquee d'Evry-Courcouronnes.

---

### Certifieur 13 : AFCAI

| | |
|---|---|
| **ID** | `afcai` |
| **Site web** | https://www.afcai.com |
| **Annee de creation** | 1992 |
| **Trust Score** | **0/100** (Tier F) |
| **halal-assessment** | `false` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `false` | 0 |
| Presents a chaque production | `false` | 0 |
| Sacrificateurs salaries | `false` | 0 |
| Abattage mecanique volaille | `true` | **-15** |
| Electronarcose volaille | `true` | **-15** |
| Electrocution post-abattage | `true` | — |
| Etourdissement bovins/ovins | `true` | **-20** |

**Profil** : Association Francaise du Controle Alimentaire et Industriel. Un des plus anciens (1992). Aucun indicateur positif, accepte tout.

---

### Certifieur 14 : ALAMANE

| | |
|---|---|
| **ID** | `alamane` |
| **Site web** | Non renseigne |
| **Annee de creation** | 1999 |
| **Trust Score** | **0/100** (Tier F) |
| **halal-assessment** | `false` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `false` | 0 |
| Presents a chaque production | `false` | 0 |
| Sacrificateurs salaries | `false` | 0 |
| Abattage mecanique volaille | `true` | **-15** |
| Electronarcose volaille | `true` | **-15** |
| Electrocution post-abattage | `true` | — |
| Etourdissement bovins/ovins | `true` | **-20** |

**Profil** : Peu d'informations publiques. Meme profil que les autres Tier F.

---

### Certifieur 15 : ARRISSALA

| | |
|---|---|
| **ID** | `arrissala` |
| **Site web** | https://www.arrissala.org |
| **Annee de creation** | 1993 |
| **Trust Score** | **0/100** (Tier F) |
| **halal-assessment** | `false` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `false` | 0 |
| Presents a chaque production | `false` | 0 |
| Sacrificateurs salaries | `false` | 0 |
| Abattage mecanique volaille | `true` | **-15** |
| Electronarcose volaille | `true` | **-15** |
| Electrocution post-abattage | `true` | — |
| Etourdissement bovins/ovins | `true` | **-20** |

**Profil** : "Arrissala" signifie "le message" en arabe (الرسالة). Actif depuis 1993. Meme profil Tier F.

---

### Certifieur 16 : HALAL CORRECT

| | |
|---|---|
| **ID** | `halal-correct` |
| **Site web** | https://www.halalcorrect.com |
| **Annee de creation** | 1999 |
| **Trust Score** | **0/100** (Tier F) |
| **halal-assessment** | `false` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `false` | 0 |
| Presents a chaque production | `false` | 0 |
| Sacrificateurs salaries | `false` | 0 |
| Abattage mecanique volaille | `true` | **-15** |
| Electronarcose volaille | `true` | **-15** |
| Electrocution post-abattage | `true` | — |
| Etourdissement bovins/ovins | `true` | **-20** |

**Profil** : Organisme neerlandais operant en Europe. Meme profil Tier F.

---

### Certifieur 17 : Islamic Centre Aachen (ICA)

| | |
|---|---|
| **ID** | `islamic-centre-aachen` |
| **Site web** | https://www.halal-europe.com |
| **Annee de creation** | Non renseignee |
| **Trust Score** | **0/100** (Tier F) |
| **halal-assessment** | `false` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `false` | 0 |
| Presents a chaque production | `false` | 0 |
| Sacrificateurs salaries | `false` | 0 |
| Abattage mecanique volaille | `true` | **-15** |
| Electronarcose volaille | `true` | **-15** |
| Electrocution post-abattage | `true` | — |
| Etourdissement bovins/ovins | `true` | **-20** |

**Profil** : Basee a Aix-la-Chapelle, Allemagne. Contexte juridique allemand — la legislation sur l'abattage rituel y est plus restrictive qu'en France. Meme profil Tier F.

---

### Certifieur 18 : SFCVH — Mosquee de Paris

| | |
|---|---|
| **ID** | `sfcvh-mosquee-de-paris` |
| **Site web** | https://www.sfcvh.com |
| **Annee de creation** | 1994 |
| **Trust Score** | **0/100** (Tier F) |
| **halal-assessment** | `false` |

| Indicateur | Valeur | Points |
|---|---|---|
| Controleurs salaries | `false` | 0 |
| Presents a chaque production | `false` | 0 |
| Sacrificateurs salaries | `false` | 0 |
| Abattage mecanique volaille | `true` | **-15** |
| Electronarcose volaille | `true` | **-15** |
| Electrocution post-abattage | `true` | — |
| Etourdissement bovins/ovins | `true` | **-20** |

**Profil** : Societe Francaise de Controle de Viande Halal, liee a la Grande Mosquee de Paris. Le certifieur le plus mediatise de France en raison du poids institutionnel de la Mosquee de Paris. Meme profil Tier F — aucun indicateur positif, accepte toutes les pratiques contestees.

---

## 5. Classification par tiers

### Vue d'ensemble

```
Score  Barre                                  Certifieurs
─────  ─────────────────────────────────────  ──────────────────────────────────────
 100   ██████████████████████████████████████  AVS, ALTAKWA, EHT, HMC, KHALIS, SIDQ
  89   ████████████████████████████████████    ACHAHADA, HALAL SERVICES
  72   ████████████████████████████            MCI
  44   ████████████████                        ARGML
  28   ██████████                              HALAL POLSKA
   0   ▏                                       ACMIF, AFCAI, ALAMANE, ARRISSALA,
                                               HALAL CORRECT, ICA, SFCVH
```

### Detail par tier

| Tier | Score | Raw | Nb certifieurs | Profil |
|---|---|---|---|---|
| **S** | 100/100 | +40 | 6 | Tout positif, rien de negatif — le plus strict |
| **A** | 89/100 | +30 | 2 | Tres strict, mais pas de sacrificateurs salaries |
| **B** | 72/100 | +15 | 1 | Bons controles, accepte l'electronarcose |
| **C** | 44/100 | -10 | 1 | Points positifs partiels, annules par les negatifs |
| **D** | 28/100 | -25 | 1 | Controleurs salaries mais accepte tout le reste |
| **F** | 0/100 | -50 | 7 | Aucun positif, accepte tout |

### Distribution

| Tier | % des certifieurs | Interpretation |
|---|---|---|
| S + A (>= 89) | 44% (8/18) | Pres de la moitie des certifieurs sont tres stricts |
| B + C (40-72) | 11% (2/18) | Zone intermediaire peu peuplee |
| D + F (<= 28) | 44% (8/18) | L'autre moitie accepte la plupart des pratiques contestees |

**Observation** : Le marche est polarise. Il n'y a pas de "milieu" — les certifieurs sont soit tres stricts, soit tres laxistes. C'est cette polarisation que Naqiy rend visible.

### Ce qui separe chaque tier

| Passage | Ce qui change | Points perdus |
|---|---|---|
| S → A | Pas de sacrificateurs salaries | -10 |
| A → B | Accepte l'electronarcose | -15 |
| B → C | Controleurs ambigus (`null`), accepte l'etourdissement | Variable |
| C → D | Controleurs pas presents a chaque production | -15 |
| D → F | Plus de controleurs salaries, plus de sacrificateurs salaries | -25 |

---

## 6. Correspondance OpenFoodFacts

Le pipeline de scan Naqiy detecte automatiquement le certifieur a partir des tags OpenFoodFacts.

### Mapping `labels_tags` → certifieur

| Tag(s) OFF | Certifieur | Trust Score |
|---|---|---|
| `fr:a-votre-service`, `fr:avs` | AVS | 100 |
| `fr:achahada` | ACHAHADA | 89 |
| `fr:altakwa` | ALTAKWA | 100 |
| `fr:association-rituelle-de-la-grande-mosquee-de-lyon`, `fr:mosquee-de-lyon`, `fr:argml` | ARGML | 44 |
| `fr:societe-francaise-de-controle-de-viande-halal`, `fr:sfcvh`, `fr:mosquee-de-paris` | SFCVH | 0 |
| `fr:arrissala` | ARRISSALA | 0 |
| `fr:halal-services` | HALAL SERVICES | 89 |
| `fr:acmif`, `fr:mosquee-d-evry` | ACMIF | 0 |
| `fr:afcai` | AFCAI | 0 |
| `fr:muslim-conseil-international`, `fr:mci` | MCI | 72 |
| `fr:european-halal-trust`, `fr:eht` | EHT | 100 |
| `fr:halal-monitoring-committee`, `fr:hmc` | HMC | 100 |
| `fr:halal-correct` | HALAL CORRECT | 0 |
| `fr:halal-polska` | HALAL POLSKA | 28 |
| `fr:khalis-halal` | KHALIS HALAL | 100 |
| `fr:sidq` | SIDQ | 100 |
| `fr:alamane` | ALAMANE | 0 |

### Fichier source

Le mapping est defini dans `backend/src/services/barcode.service.ts`. Quand un produit OpenFoodFacts possede un de ces tags dans `labels_tags`, le pipeline :
1. Identifie le certifieur correspondant
2. Charge ses donnees depuis la table `certifiers`
3. Renvoie le `trustScore` au frontend

### Tags non mappes

Si un produit OFF a un tag halal non reconnu (ex: `fr:certifieur-inconnu`), le scan renvoie `certifier = null` et `trustScore = null`. Le frontend affiche "Certifieur non identifie" sans score.

---

## 7. Architecture technique

### 7.1 Schema de donnees

**Table** : `certifiers` (PostgreSQL via Drizzle ORM)

```
certifiers
├── id                                VARCHAR(100) PK
├── name                              VARCHAR(255) NOT NULL
├── website                           TEXT
├── creation_year                     INTEGER
├── controllers_are_employees         BOOLEAN
├── controllers_present_each_production BOOLEAN
├── has_salaried_slaughterers         BOOLEAN
├── accepts_mechanical_slaughter      BOOLEAN
├── accepts_electronarcosis           BOOLEAN
├── accepts_post_slaughter_electrocution BOOLEAN
├── accepts_stunning                  BOOLEAN
├── halal_assessment                  BOOLEAN NOT NULL DEFAULT false
├── trust_score                       INTEGER NOT NULL DEFAULT 0
├── notes                             TEXT[]
├── is_active                         BOOLEAN NOT NULL DEFAULT true
├── created_at                        TIMESTAMPTZ NOT NULL DEFAULT NOW()
└── updated_at                        TIMESTAMPTZ NOT NULL DEFAULT NOW()

Index:
├── certifiers_trust_score_idx       ON (trust_score)
└── certifiers_halal_assessment_idx  ON (halal_assessment)
```

### 7.2 Flux de donnees

```
certification-list.json
        │
        ▼
   seed (run.ts)
        │
        ├── Pour chaque certifieur:
        │   ├── Lire les 6+1 indicateurs
        │   ├── computeTrustScore() → trust_score
        │   └── UPSERT dans PostgreSQL
        │
        ▼
  Table certifiers (PostgreSQL)
        │
        ▼
  scan.ts (tRPC router)
        │
        ├── Scan produit → OFF labels_tags
        ├── Mapping tag → certifier_id
        ├── SELECT certifier + trust_score
        │
        ▼
  Frontend (scan-result.tsx)
        │
        ├── TrustRing (cercle visuel du score)
        ├── CertifierLogo (logo du certifieur)
        └── TrustScoreBottomSheet (explication "?")
```

### 7.3 Fichiers cles

| Fichier | Role |
|---|---|
| `backend/src/db/schema/certifiers.ts` | Schema Drizzle + `computeTrustScore()` |
| `backend/asset/certification-list.json` | Donnees source des 18 certifieurs |
| `backend/src/db/seeds/run.ts` | Seed qui calcule et insere les scores |
| `backend/src/services/barcode.service.ts` | Mapping OFF tags → certifier ID |
| `backend/src/trpc/routers/scan.ts` | Router tRPC qui renvoie le score au frontend |
| `optimus-halal/src/components/ui/TrustRing.tsx` | Cercle visuel du score (vert/jaune/rouge) |
| `optimus-halal/src/components/scan/TrustScoreBottomSheet.tsx` | Bottom sheet "Comment ce score est calcule ?" |
| `optimus-halal/src/components/scan/CertifierLogo.tsx` | Affichage du logo du certifieur |

---

## 8. Interface utilisateur

### 8.1 TrustRing

Le `TrustRing` est un cercle anime qui affiche le score avec un code couleur :

| Plage | Couleur | Signification |
|---|---|---|
| 70–100 | Vert (`halalStatus.halal.base`) | Haute confiance |
| 40–69 | Jaune (`halalStatus.doubtful.base`) | Confiance moyenne |
| 0–39 | Rouge (`halalStatus.haram.base`) | Faible confiance |

### 8.2 TrustScoreBottomSheet

Declenchee quand l'utilisateur appuie sur l'icone "?" a cote du score. Affiche :

1. **Titre** : "Comment ce score est-il calcule ?"
2. **Introduction** : Explication de la philosophie du score
3. **Score actuel** : Nom du certifieur + score avec couleur
4. **3 indicateurs positifs** : Icone `+` verte + description
5. **3 indicateurs negatifs** : Icone `-` rouge + description
6. **Note de bas de page** : Disclaimer ("Ce n'est pas un verdict halal/haram")

### 8.3 Textes i18n

Les textes sont traduits en 3 langues (FR, EN, AR) dans :
- `optimus-halal/src/i18n/translations/fr.ts`
- `optimus-halal/src/i18n/translations/en.ts`
- `optimus-halal/src/i18n/translations/ar.ts`

Cles concernees : `scanResult.trustScoreExplainTitle`, `scanResult.trustScoreExplainIntro`, `scanResult.trustScorePositive1-3`, `scanResult.trustScoreNegative1-3`, `scanResult.trustScoreNote`.

---

## 9. Feuille de route

### P0 — Corrections immediates (< 30 min)

#### P0-A : Integrer `acceptsPostSlaughterElectrocution` dans le score

Le champ est stocke en DB, present dans le JSON et l'interface TypeScript, mais **jamais utilise dans le calcul**. 8 certifieurs l'acceptent.

**Action** : Ajouter `acceptsPostSlaughterElectrocution → -10` (moins grave que l'electronarcose car post-mortem). Nouveau range : [-60, +40], normalisation sur 100.

#### P0-B : Penaliser `null` sur les indicateurs positifs

Actuellement `null = 0` (neutre). Proposition : `null → -3` par indicateur positif concernant. N'affecte que ARGML dans les donnees actuelles.

---

### P1 — Ameliorations a moyen terme (1-2 sprints)

#### P1-A : Indicateurs de transparence et d'audit

Nouveaux indicateurs proposes pour differencier les Tier F identiques :
- Publication de la liste des certifies en ligne (+8)
- Frequence d'audit > 1x/mois (+7)
- Tracabilite lot-par-lot (+5)
- Tests ADN aleatoires (+10)
- Sanctions/retraits (-15)
- Financement par les industriels certifies (-10)

#### P1-B : Justifier les poids (source fiqh ou editoriale)

Publier un document "Methodologie Naqiy" avec la justification de chaque poids, ses sources (fatawa des 4 ecoles), et le consensus.

---

### P2 — Evolutions structurelles (2-3 sprints)

#### P2-A : Score par madhab

Killer feature — aucune app halal ne fait ca. 4 jeux de poids differents selon le madhab de l'utilisateur (Hanafi, Shafi'i, Maliki, Hanbali). Le meme certifieur aurait un score different selon le madhab choisi.

#### P2-B : Normalisation sigmoide

Remplacer la normalisation lineaire par une sigmoide pour mieux separer les extremes et compresser le milieu.

---

### P3 — Vision long terme

#### P3 : Versioning temporel des pratiques

3 niveaux possibles :
1. **Minimal** : `last_verified_at` + badge "Donnees anciennes" (30 min)
2. **Modere** : Table `certifier_changes` avec changelog automatique (1-2 jours)
3. **Complet** : Historique par periode + graphe d'evolution (1 semaine+)

---

### Ordre d'execution recommande

```
Immediate :   P0-A + P0-B                    (20 min, zero risque)
Sprint +1 :   P2-B sigmoide                   (15 min, tester en QA)
Sprint +2 :   P3 Niveau 1 — lastVerifiedAt    (30 min)
Sprint +3 :   P1-B methodologie + P1-A        (3-5 jours recherche)
Sprint +4 :   P2-A score par madhab            (4-5 jours, le plus impactant)
Sprint +5 :   P3 Niveau 2 changelog            (quand flux de donnees en place)
```

---

## 10. FAQ / Questions frequentes

### "Pourquoi certains certifieurs sont a 0 ?"

Parce qu'ils n'ont aucun des 3 indicateurs positifs (pas de controleurs salaries, pas presents a chaque production, pas de sacrificateurs salaries) ET acceptent les 3 pratiques contestees (abattage mecanique, electronarcose, etourdissement). Le score reflete fidelement leurs pratiques declarees.

### "Est-ce que 0/100 veut dire que la viande n'est pas halal ?"

Non. Le Trust Score mesure la **rigueur de la methode de certification**, pas la validite du halal. Un certifieur a 0/100 peut certifier de la viande halal valide — mais ses methodes sont les moins strictes de notre base.

### "Pourquoi l'etourdissement vaut -20 et pas -15 ?"

C'est la pratique la plus contestee car :
1. Le risque de mort avant la saignee est le plus eleve
2. Les 4 ecoles s'accordent quasi-unanimement sur son interdiction
3. C'est la plus visible mediatiquement (debats reguliers en Europe)

Les poids actuels sont des choix editoriaux. Voir P1-B pour la justification par source fiqh prevue.

### "Pourquoi ARGML a `null` sur les controleurs ?"

Parce que la realite est ambigue. Les notes du JSON source indiquent : *"les controleurs sont aussi salaries de l'usine, ce qui ne garantit pas l'independance"*. Ce n'est ni un `true` (independant) ni un `false` (pas de controleurs). C'est un cas intermediaire que `null` represente honnement.

### "Peut-on contester un score ?"

Oui. Si un certifieur estime que ses donnees sont obsoletes ou incorrectes, il peut nous contacter. Le score sera mis a jour apres verification. C'est l'esprit de Naqiy : transparence et exactitude.

### "Pourquoi `halal-assessment` n'est pas dans le score ?"

Parce que `halal-assessment` est le **resultat** ("ce certifieur est-il fiable pour un consommateur strict ?"), pas un input. L'inclure dans le calcul serait circulaire — le score *produit* le verdict, il ne s'en nourrit pas.

### "Pourquoi `acceptsPostSlaughterElectrocution` n'est pas dans le score ?"

C'est un oubli identifie (P0-A). Le champ est stocke en DB mais pas encore integre dans le calcul. Il sera ajoute avec un poids de -10 dans la prochaine iteration.

---

## Annexe A : Tableau recapitulatif complet

| # | Certifieur | ID | Score | Tier | Emp. | Pres. | Sacr. | Meca. | Elec. | Post. | Etour. | Halal |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | AVS | `avs-a-votre-service` | 100 | S | true | true | true | false | false | false | false | true |
| 2 | ALTAKWA | `altakwa` | 100 | S | true | true | true | false | false | false | false | true |
| 3 | EHT | `european-halal-trust` | 100 | S | true | true | true | false | false | false | false | true |
| 4 | HMC | `halal-monitoring-committee` | 100 | S | true | true | true | false | false | false | false | true |
| 5 | KHALIS | `khalis-halal` | 100 | S | true | true | true | false | false | false | false | true |
| 6 | SIDQ | `sidq` | 100 | S | true | true | true | false | false | false | false | true |
| 7 | ACHAHADA | `achahada` | 89 | A | true | true | false | false | false | false | false | true |
| 8 | HALAL SERVICES | `halal-services` | 89 | A | true | true | false | false | false | false | false | true |
| 9 | MCI | `muslim-conseil-international-mci` | 72 | B | true | true | false | false | true | true | false | false |
| 10 | ARGML | `argml-mosquee-de-lyon` | 44 | C | null | true | true | false | true | true | true | false |
| 11 | HALAL POLSKA | `halal-polska` | 28 | D | true | false | true | true | true | true | true | false |
| 12 | ACMIF | `acmif-mosquee-d-evry` | 0 | F | false | false | false | true | true | true | true | false |
| 13 | AFCAI | `afcai` | 0 | F | false | false | false | true | true | true | true | false |
| 14 | ALAMANE | `alamane` | 0 | F | false | false | false | true | true | true | true | false |
| 15 | ARRISSALA | `arrissala` | 0 | F | false | false | false | true | true | true | true | false |
| 16 | HALAL CORRECT | `halal-correct` | 0 | F | false | false | false | true | true | true | true | false |
| 17 | ICA | `islamic-centre-aachen` | 0 | F | false | false | false | true | true | true | true | false |
| 18 | SFCVH | `sfcvh-mosquee-de-paris` | 0 | F | false | false | false | true | true | true | true | false |

**Legende** : Emp. = Controleurs salaries | Pres. = Presents a chaque production | Sacr. = Sacrificateurs salaries | Meca. = Abattage mecanique | Elec. = Electronarcose | Post. = Electrocution post-abattage | Etour. = Etourdissement | Halal = halal-assessment

---

## Annexe B : Glossaire

| Terme | Definition |
|---|---|
| **Tasmiya** (تسمية) | Invocation du nom d'Allah ("Bismillah, Allahu Akbar") au moment de l'abattage. Obligatoire dans les 4 ecoles. |
| **Dhabih** (ذابح) | Le sacrificateur — la personne qui effectue l'abattage rituel. Doit etre musulman, sain d'esprit, et prononcer la tasmiya. |
| **Electronarcose** | Choc electrique administre **avant** la saignee pour etourdir l'animal. Conteste car risque de mort pre-saignee. |
| **Stunning** | Etourdissement — terme generique incluant le pistolet a tige captive, l'electrocution, et le CO2. |
| **Mayta** (ميتة) | Animal mort autrement que par egorgement rituel. Sa viande est haram par consensus. |
| **Madhab** (مذهب) | Ecole de jurisprudence islamique. Les 4 principales : Hanafi, Shafi'i, Maliki, Hanbali. |
| **Bolt gun** | Pistolet a tige captive — envoie une tige metallique dans le crane pour etourdir. Utilise sur les bovins. |
| **OFF** | OpenFoodFacts — base de donnees ouverte de produits alimentaires. Source de donnees primaire de Naqiy. |
| **Trust Score** | Score Naqiy de 0 a 100 mesurant la rigueur des pratiques de certification d'un organisme halal. |

---

*Document genere le 24 fevrier 2026 — Naqiy (نقيّ) v1.0*
*"Ton halal, en toute clarte."*
