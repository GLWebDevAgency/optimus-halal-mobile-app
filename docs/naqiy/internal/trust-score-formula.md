# Trust Score — La formule (version finale)

> Derniere mise a jour : 2026-02-24
> Fichier source : `backend/src/db/schema/certifiers.ts`
> Donnees source : `backend/asset/certification-list.json`
> Seed : `backend/src/db/seeds/run.ts`
> **Document complet** : voir `trust-score-complete.md` pour la reference exhaustive

## Philosophie

Le Trust Score mesure la **rigueur des pratiques de controle** d'un organisme de certification halal. Il repond a la question : "A quel point cet organisme est-il strict dans ses procedures ?"

Ce n'est **pas** un verdict halal/haram. C'est un indicateur de confiance dans la methode de certification.

---

## Les 6 indicateurs

### 3 indicateurs positifs (plus c'est vrai, plus c'est rigoureux)

| Indicateur | Colonne DB | Points | Signification |
|---|---|---|---|
| Controleurs salaries | `controllers_are_employees` | **+15** | Les controleurs sont employes par le certifieur (independants), pas par l'usine. Garantit l'absence de conflit d'interet. |
| Presents a chaque production | `controllers_present_each_production` | **+15** | Un controleur est physiquement present lors de chaque abattage, pas seulement lors d'audits periodiques. |
| Sacrificateurs salaries | `has_salaried_slaughterers` | **+10** | Les sacrificateurs (dhobih) sont employes et formes par le certifieur. Garantit la qualification et la tracabilite. |

### 3 indicateurs negatifs (accepter ces pratiques = moins strict)

| Indicateur | Colonne DB | Points | Signification |
|---|---|---|---|
| Abattage mecanique volaille | `accepts_mechanical_slaughter` | **-15** | Accepte l'abattage mecanique de la volaille au lieu de l'abattage manuel. Contestee car la tasmiya (invocation) exige un humain conscient. |
| Electronarcose volaille | `accepts_electronarcosis` | **-15** | Accepte l'electronarcose (choc electrique pre-abattage) sur la volaille. Risque de tuer l'animal avant la saignee, ce qui invalide le halal. |
| Etourdissement bovins/ovins | `accepts_stunning` | **-20** | Accepte l'etourdissement (stunning) pour les bovins, veaux et agneaux. La pratique la plus contestee — poids le plus fort. |

### Champs stockes mais NON comptabilises

| Champ | Colonne DB | Raison de l'exclusion |
|---|---|---|
| `halal-assessment` | `halal_assessment` | C'est le **resultat** ("est-ce fiable si je suis strict ?"), pas un input. Le score se calcule sur les pratiques, pas sur le verdict. |
| `acceptsPostSlaughterElectrocution` | `accepts_post_slaughter_electrocution` | Stocke en DB mais **pas encore integre** dans le score. Voir `trust-score-roadmap.md` P0. |

---

## Algorithme

```
raw = 0

// Positifs
if controllersAreEmployees === true  → raw += 15
if controllersPresentEachProd === true → raw += 15
if hasSalariedSlaughterers === true  → raw += 10

// Negatifs
if acceptsMechanicalSlaughter === true → raw -= 15
if acceptsElectronarcosis === true    → raw -= 15
if acceptsStunning === true           → raw -= 20

// Normalisation lineaire
MIN_RAW = -50  (tout negatif, aucun positif)
MAX_RAW = +40  (tout positif, aucun negatif)
score = round((raw + 50) / 90 * 100)
score = clamp(score, 0, 100)
```

### Traitement des `null`

Actuellement : `null` = 0 points (neutre). Un champ inconnu n'ajoute ni ne retire de points.
Voir `trust-score-roadmap.md` P0 pour l'amelioration prevue.

---

## Les 18 certifieurs — Detail

### Tier S — 100/100 (raw = +40)

| Certifieur | Employes | Presents | Sacrif. | Meca. | Electro. | Etourd. | Raw |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---:|
| **AVS** (A Votre Service) | +15 | +15 | +10 | 0 | 0 | 0 | +40 |
| **ALTAKWA** | +15 | +15 | +10 | 0 | 0 | 0 | +40 |
| **European Halal Trust** | +15 | +15 | +10 | 0 | 0 | 0 | +40 |
| **Halal Monitoring Committee** | +15 | +15 | +10 | 0 | 0 | 0 | +40 |
| **KHALIS HALAL** | +15 | +15 | +10 | 0 | 0 | 0 | +40 |
| **SIDQ** | +15 | +15 | +10 | 0 | 0 | 0 | +40 |

Tous les indicateurs positifs, aucun negatif. Le profil le plus strict.

### Tier A — 89/100 (raw = +30)

| Certifieur | Employes | Presents | Sacrif. | Meca. | Electro. | Etourd. | Raw |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---:|
| **ACHAHADA** | +15 | +15 | 0 | 0 | 0 | 0 | +30 |
| **HALAL SERVICES** | +15 | +15 | 0 | 0 | 0 | 0 | +30 |

Difference avec le Tier S : pas de sacrificateurs salaries (`hasSalariedSlaughterers = false`), donc -10 points. Refusent toutes les pratiques contestees.

### Tier B — 72/100 (raw = +15)

| Certifieur | Employes | Presents | Sacrif. | Meca. | Electro. | Etourd. | Raw |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---:|
| **MCI** | +15 | +15 | 0 | 0 | -15 | 0 | +15 |

Bons controles (employes + presents), mais **accepte l'electronarcose** (-15). Pas de sacrificateurs salaries.

### Tier C — 44/100 (raw = -10)

| Certifieur | Employes | Presents | Sacrif. | Meca. | Electro. | Etourd. | Raw |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---:|
| **ARGML** (Mosquee de Lyon) | null→0 | +15 | +10 | 0 | -15 | -20 | -10 |

Controleurs presents (+15) et sacrificateurs salaries (+10), mais `controllersAreEmployees = null` (independance non garantie — controleurs parfois salaries de l'usine). Accepte l'electronarcose (-15) ET l'etourdissement (-20).

### Tier D — 28/100 (raw = -25)

| Certifieur | Employes | Presents | Sacrif. | Meca. | Electro. | Etourd. | Raw |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---:|
| **HALAL POLSKA** | +15 | 0 | +10 | -15 | -15 | -20 | -25 |

Controleurs salaries (+15) et sacrificateurs salaries (+10), mais pas presents a chaque production. Accepte les 3 pratiques negatives (-50).

### Tier F — 0/100 (raw = -50)

| Certifieur | Employes | Presents | Sacrif. | Meca. | Electro. | Etourd. | Raw |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---:|
| **ACMIF** (Mosquee d'Evry) | 0 | 0 | 0 | -15 | -15 | -20 | -50 |
| **AFCAI** | 0 | 0 | 0 | -15 | -15 | -20 | -50 |
| **ALAMANE** | 0 | 0 | 0 | -15 | -15 | -20 | -50 |
| **ARRISSALA** | 0 | 0 | 0 | -15 | -15 | -20 | -50 |
| **HALAL CORRECT** | 0 | 0 | 0 | -15 | -15 | -20 | -50 |
| **Islamic Centre Aachen** | 0 | 0 | 0 | -15 | -15 | -20 | -50 |
| **SFCVH** (Mosquee de Paris) | 0 | 0 | 0 | -15 | -15 | -20 | -50 |

Aucun indicateur positif, acceptent toutes les pratiques contestees.

---

## Resume visuel

```
100 ██████████████████████ AVS, ALTAKWA, EHT, HMC, KHALIS, SIDQ
 89 ████████████████████   ACHAHADA, HALAL SERVICES
 72 ████████████████       MCI
 44 ██████████             ARGML
 28 ██████                 HALAL POLSKA
  0 |                      ACMIF, AFCAI, ALAMANE, ARRISSALA, HALAL CORRECT, ICA, SFCVH
```

---

## Correspondance OFF (OpenFoodFacts)

Le mapping `labels_tags` → certifier ID est defini dans `backend/src/services/barcode.service.ts` :

| Tag OFF | Certifieur |
|---|---|
| `fr:a-votre-service`, `fr:avs` | AVS |
| `fr:achahada` | ACHAHADA |
| `fr:altakwa` | ALTAKWA |
| `fr:association-rituelle-de-la-grande-mosquee-de-lyon`, `fr:mosquee-de-lyon`, `fr:argml` | ARGML |
| `fr:societe-francaise-de-controle-de-viande-halal`, `fr:sfcvh`, `fr:mosquee-de-paris` | SFCVH |
| `fr:arrissala` | ARRISSALA |
| `fr:halal-services` | HALAL SERVICES |
| `fr:acmif`, `fr:mosquee-d-evry` | ACMIF |
| `fr:afcai` | AFCAI |
| `fr:muslim-conseil-international`, `fr:mci` | MCI |
| `fr:european-halal-trust`, `fr:eht` | European Halal Trust |
| `fr:halal-monitoring-committee`, `fr:hmc` | HMC |
| `fr:halal-correct` | HALAL CORRECT |
| `fr:halal-polska` | HALAL POLSKA |
| `fr:khalis-halal` | KHALIS HALAL |
| `fr:sidq` | SIDQ |
| `fr:alamane` | ALAMANE |

Quand un produit OFF a un de ces tags dans `labels_tags`, le pipeline l'associe automatiquement au certifieur et charge son trust score depuis la DB.
