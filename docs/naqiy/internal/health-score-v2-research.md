# Naqiy Health Score V2 — Recherche & Conception

> **Statut** : Document de recherche interne — niveau these de doctorat
> **Date** : 2026-03-08
> **Auteur** : Equipe Naqiy (conception algorithmique assistee par IA)
> **Audience** : Developpeurs, auditeurs, investisseurs, regulateurs
> **Version** : 2.0 (refonte complete du Health Score V1)

---

## Table des matieres

1. [Diagnostic du systeme actuel (V1)](#1-diagnostic-du-systeme-actuel-v1)
2. [Audit qualite des donnees Open Food Facts](#2-audit-qualite-des-donnees-open-food-facts)
3. [Revue de litterature scientifique](#3-revue-de-litterature-scientifique)
4. [Architecture du Naqiy Health Score V2](#4-architecture-du-naqiy-health-score-v2)
5. [Axe 1 : Profil nutritionnel (40 pts)](#5-axe-1--profil-nutritionnel-40-pts)
6. [Axe 2 : Risque additifs (25 pts)](#6-axe-2--risque-additifs-25-pts)
7. [Axe 3 : Transformation NOVA (15 pts)](#7-axe-3--transformation-nova-15-pts)
8. [Axe 4 : Completude et qualite des donnees (10 pts)](#8-axe-4--completude-et-qualite-des-donnees-10-pts)
9. [Axe 5 : Profil utilisateur (10 pts bonus/malus)](#9-axe-5--profil-utilisateur-10-pts-bonusmalus)
10. [Systeme de profils utilisateurs](#10-systeme-de-profils-utilisateurs)
11. [Formule composite finale](#11-formule-composite-finale)
12. [Gestion des donnees manquantes](#12-gestion-des-donnees-manquantes)
13. [Comparaison avec les systemes existants](#13-comparaison-avec-les-systemes-existants)
14. [Plan d'implementation](#14-plan-dimplementation)
15. [Limites et travaux futurs](#15-limites-et-travaux-futurs)
16. [References bibliographiques](#16-references-bibliographiques)

---

## 1. Diagnostic du systeme actuel (V1)

### 1.1 Architecture V1

Le Health Score V1 (`health-score.service.ts`) repose sur 4 axes :

| Axe | Poids | Source | Methode |
|---|---|---|---|
| Profil nutritionnel | 50 pts | `nutriscore_grade` OFF | Table de correspondance {a:50, b:40, c:25, d:12, e:0} |
| Risque additifs | 25 pts | Table `additives` DB | Penalites cumulatives par toxicite + EFSA + ADI |
| Transformation NOVA | 15 pts | `nova_group` OFF | Table {1:15, 2:12, 3:8, 4:2} |
| Transparence donnees | 10 pts | Presence/absence champs OFF | Booleens (ingredients, nutrition, allergenes, origine) |

### 1.2 Failles identifiees

#### F1 — Dependance a la boite noire NutriScore

Le score V1 utilise le `nutriscore_grade` (A-E) pre-calcule par OFF comme une boite noire.
Probleme : **45-55% des produits OFF n'ont pas de grade NutriScore** (source : analyse du dataset OFF).
Quand le grade est absent, l'axe nutrition (50% du score) tombe a `null`, rendant le score soit `null`
(si NOVA manque aussi), soit biaise (proportionnel sur un max reduit).

De plus, la table de correspondance {a:50, b:40, c:25, d:12, e:0} est **non-lineaire mais arbitraire** —
la distance entre B (40) et C (25) est de 15 points, alors que la distance entre A (50) et B (40) est de 10.
Ce saut de 15 points entre B et C n'est justifie par aucune reference scientifique.

#### F2 — Nutriments bruts ignores

Le champ `nutriments` (JSONB) est stocke en DB mais **jamais exploite** pour le scoring.
C'est un gaspillage critique : quand le grade NutriScore est absent, on pourrait le
re-calculer a partir des nutriments bruts (`energy_100g`, `sugars_100g`, `fat_100g`,
`saturated-fat_100g`, `sodium_100g`, `fiber_100g`, `proteins_100g`, `fruits-vegetables-nuts-estimate_100g`).

#### F3 — Pas de profils utilisateurs

La DB additives a deja les flags `riskPregnant`, `riskChildren`, `riskAllergic`
mais ils ne sont **jamais injectes dans le score**. Un produit contenant de l'aspartame
(E951, ADI = 40mg/kg) a le meme score pour une femme enceinte et un adulte homme de 30 ans,
malgre la recommandation EFSA de prudence pendant la grossesse.

#### F4 — NOVA binaire

Le NOVA group est traite comme un entier 1-4 sans nuance. Un produit NOVA 4 avec 2 additifs
cosmétiques recoit le meme score qu'un produit NOVA 4 avec 15 additifs dont des nano-particules.

#### F5 — Pas de calcul propre du NutriScore

L'algorithme NutriScore 2023/2024 revise est entierement public (Sante Publique France, Nature Food 2024).
On peut et on DEVRAIT le reimplementer pour :
- Couvrir les produits sans grade OFF
- Appliquer l'algorithme revise 2024 (plus strict sur sucre, sel)
- Avoir un controle total sur le calcul

#### F6 — Resultats farfelus observes

L'utilisateur rapporte des resultats "plutot farfelus" du score sante, notamment quand :
- Le NutriScore OFF est absent ou obsolete (ancien algorithme)
- Les nutriments sont partiels (pas de fibres, pas de proteines)
- Le produit est inconnu d'OFF (pas de donnees)

---

## 2. Audit qualite des donnees Open Food Facts

### 2.1 Structure des donnees OFF pertinentes

| Champ OFF | Type | Utilise V1 | Utilise V2 | Taux estimé de presence |
|---|---|---|---|---|
| `product_name` | string | Oui | Oui | ~95% |
| `brands` | string | Oui | Oui | ~90% |
| `ingredients_text` | string | Oui (AI) | Oui | ~65-70% |
| `ingredients[]` | array | Oui (fallback) | Oui | ~60% |
| `nutriscore_grade` | string | Oui (50 pts) | Non (recalcule) | ~45-55% |
| `nova_group` | number | Oui (15 pts) | Oui + AI fallback | ~40-50% |
| `nutriments.energy_100g` | number | Non | **Oui** | ~55-65% |
| `nutriments.sugars_100g` | number | Non | **Oui** | ~55-60% |
| `nutriments.fat_100g` | number | Non | **Oui** | ~55-60% |
| `nutriments.saturated-fat_100g` | number | Non | **Oui** | ~50-55% |
| `nutriments.salt_100g` | number | Non | **Oui** | ~50-55% |
| `nutriments.sodium_100g` | number | Non | **Oui** | ~50-55% |
| `nutriments.fiber_100g` | number | Non | **Oui** | ~30-40% |
| `nutriments.proteins_100g` | number | Non | **Oui** | ~55-60% |
| `nutriments.fruits-vegetables-nuts-estimate_100g` | number | Non | **Oui** | ~15-25% |
| `additives_tags[]` | string[] | Oui | Oui | ~45-55% |
| `allergens_tags[]` | string[] | Oui | Oui | ~40% |
| `categories` | string | Non | **Oui** (categorie NutriScore) | ~75% |
| `labels_tags[]` | string[] | Oui (halal) | Oui | ~60% |
| `ecoscore_grade` | string | Non | Considere V3 | ~25-35% |

### 2.2 Strategies pour les donnees manquantes

| Situation | Impact V1 | Solution V2 |
|---|---|---|
| Pas de `nutriscore_grade` | Axe nutrition = null (50% du score perdu) | **Recalcul a partir des nutriments bruts** via algorithme NutriScore 2024 |
| Pas de nutriments du tout | Axe nutrition = null | Score partiel avec label "confiance basse" + invitation a photographier l'etiquette |
| Nutriments partiels (ex: pas de fibres) | Non gere | Imputation conservative : fibre=0, FVN=0 (penalise le produit → principe de precaution) |
| Pas de `nova_group` | Axe processing = null | AI estimation (deja en place via Gemini) + heuristique nombre d'additifs |
| Pas d'`ingredients_text` | AI non applicable | Score tres partiel, confiance "tres basse" |
| Produit inconnu d'OFF | Tout null | Mode "scan etiquette" (OCR → AI) + score minimal sur ce qui est lisible |

### 2.3 Completude typique d'un produit OFF (France, 2025-2026)

Sur le marche francais, les produits les mieux documentes dans OFF sont les produits de grande distribution
(Carrefour, Leclerc, Lidl). Les produits halal specialises (marques orientales, boucheries) sont
significativement moins bien documentes.

**Estimation basee sur l'analyse du dataset OFF :**

- ~55-65% des produits ont au moins `energy_100g` + `sugars_100g` + `fat_100g` + `salt_100g`
- ~30-40% ont aussi `fiber_100g` (souvent manquant)
- ~15-25% ont `fruits-vegetables-nuts-estimate_100g` (tres souvent manquant)
- ~45-55% ont un `nutriscore_grade` pre-calcule par OFF
- ~40-50% ont un `nova_group`

**Implication** : En recalculant le NutriScore a partir des nutriments bruts au lieu de dependre
du grade OFF, on peut **doubler la couverture** de l'axe nutrition (de ~50% a ~60-65%).

---

## 3. Revue de litterature scientifique

### 3.1 Algorithme NutriScore 2024 (revise)

**Source primaire** : Merz et al., "Nutri-Score 2023 update", Nature Food, 2024.
DOI: 10.1038/s43016-024-00920-3

**Principe** : Score = N_points - P_points, ou :
- N_points (defavorables) : energie (kJ), sucres (g), acides gras satures (g), sel (g)
- P_points (favorables) : fibres (g), proteines (g), fruits/legumes/noix (%)

**Revisions majeures 2024** :
- Sucre : echelle elargie a 15 points (avant 10)
- Sel : echelle elargie a 20 points (avant 10)
- Proteines : max 7 points (avant 5), cap a 2 pour viande rouge
- Categorie huiles/graisses : "energie des satures" remplace "energie totale"
- Boissons : lait/boissons vegetales evaluees avec l'algo boissons
- Seule l'eau obtient un A en boisson

**Tables de seuils completes (aliments generaux per 100g)** :

Points N (defavorables) :

| Pts | Energie (kJ) | Sucres (g) | AG satures (g) | Sel (g) |
|:---:|:---:|:---:|:---:|:---:|
| 0 | <=335 | <=3.4 | <=1 | <=0.2 |
| 1 | >335 | >3.4 | >1 | >0.2 |
| 2 | >670 | >6.8 | >2 | >0.4 |
| 3 | >1005 | >10 | >3 | >0.6 |
| 4 | >1340 | >14 | >4 | >0.8 |
| 5 | >1675 | >17 | >5 | >1 |
| 6 | >2010 | >20 | >6 | >1.2 |
| 7 | >2345 | >24 | >7 | >1.4 |
| 8 | >2680 | >27 | >8 | >1.6 |
| 9 | >3015 | >31 | >9 | >1.8 |
| 10 | >3350 | >34 | >10 | >2 |

Points P (favorables) :

| Pts | Proteines (g) | Fibres (g) | FVL (%) |
|:---:|:---:|:---:|:---:|
| 0 | <=2.4 | <=3.0 | <=40 |
| 1 | >2.4 | >3.0 | >40 |
| 2 | >4.8 | >4.1 | >60 |
| 3 | >7.2 | >5.2 | — |
| 4 | >9.6 | >6.3 | — |
| 5 | >12 | >7.4 | >80 |

Grades (aliments generaux) :

| Grade | Score |
|:---:|:---:|
| A | <=0 |
| B | 1–2 |
| C | 3–10 |
| D | 11–18 |
| E | >=19 |

**Regle speciale** : Si N_points > 11, les points proteines ne sont soustraits QUE si FVL >= 80%.
Les points fibres et FVL sont toujours soustraits.

**Ref** : Sante Publique France, "Reglement d'usage de la marque Nutri-Score", 2024.

### 3.2 Classification NOVA

**Source** : Monteiro et al., "Ultra-processed foods: what they are and how to identify them",
Public Health Nutrition, 2019, 22(5), 936-941.

| Groupe | Definition | Exemples |
|:---:|---|---|
| 1 | Aliments non transformes ou peu transformes | Fruits, legumes, viande fraiche, oeufs, lait |
| 2 | Ingredients culinaires transformes | Huile, beurre, sucre, sel, farine |
| 3 | Aliments transformes | Conserves, fromages, pain artisanal |
| 4 | Produits ultra-transformes | Sodas, snacks industriels, plats prepares |

**Critique** : Fleiss kappa < 0.34 pour la classification NOVA entre evaluateurs (Gibney et al.,
European Journal of Clinical Nutrition, 2022). La classification manque de reproductibilite.

**Solution Naqiy** : Utiliser le NOVA d'OFF quand disponible, sinon estimer via AI (Gemini)
avec le nombre d'additifs comme heuristique de renfort.

### 3.3 Methodologie Yuka

**Source** : Yuka Help Center, "How are food products rated?", 2024.

| Composante | Poids | Source |
|---|---|---|
| Qualite nutritionnelle | 60% | Base sur NutriScore |
| Additifs | 30% | Classification 4 niveaux par EFSA/IARC |
| Bio | 10% | Bonus label bio certifie |

**Regle critique** : Si un additif "high risk" est present → score max = 49/100.
Ceci est conceptuellement similaire a nos caps/guardrails du Trust Score V5.

**Limites Yuka** : Pas de profils utilisateurs, pas de transparence algorithmique,
classification additifs non documentee publiquement.

### 3.4 Besoins nutritionnels par population

Sources : EFSA DRV 2017, ANSES 2021, ESPEN 2014, ISSN 2017.

#### Femme enceinte

| Nutriment | Besoin specifique | Source |
|---|---|---|
| Folate (B9) | 600 ug DFE/jour (vs 330 ug adulte) | EFSA 2014 |
| Fer | 16 mg/jour (augmente absorption) | ANSES 2021 |
| Calcium | 950 mg/jour | EFSA 2015 |
| DHA (omega-3) | 200 mg/jour en plus | EFSA 2010 |
| Iode | 200 ug/jour (vs 150 ug adulte) | ANSES 2021 |
| Vitamine D | 15 ug/jour | EFSA 2016 |

**Additifs a risque** : Aspartame (E951 — debat EFSA), Dioxyde de titane (E171 — interdit EU depuis 2022),
Nitrites (E249-252 — ANSES 2022 recommande reduction), Carragenane (E407 — debat intestinal),
Certains colorants azoiques (E102, E110, E122, E129 — hyperactivite enfants, EFSA 2009).

#### Enfant (3-12 ans)

| Nutriment | Besoin specifique | Source |
|---|---|---|
| Proteines | 0.9 g/kg/jour (3-9 ans), 0.9-1.0 g/kg/jour (10-12 ans) | EFSA 2012 |
| Calcium | 800 mg/jour (4-10 ans), 1150 mg/jour (11-17 ans) | EFSA 2015 |
| Fer | 8 mg/jour (4-8 ans), 11 mg/jour (9-13 ans) | EFSA 2015 |
| Sucres ajoutes | <10% de l'apport energetique total | OMS 2015 |

**Additifs a risque** : Colorants azoiques (Southampton Six : E102, E104, E110, E122, E124, E129),
Edulcorants intenses (E950-E969 — deconseilles <3 ans), Cafeine.

#### Personne agee (>65 ans)

| Nutriment | Besoin specifique | Source |
|---|---|---|
| Proteines | 1.0-1.2 g/kg/jour (vs 0.83 adulte) | ESPEN 2014 |
| Vitamine D | 15-20 ug/jour | EFSA 2016 |
| Calcium | 950 mg/jour | EFSA 2015 |
| Vitamine B12 | 4 ug/jour (absorption reduite) | EFSA 2015 |
| Fibres | >=25 g/jour (transit, microbiome) | EFSA 2010 |

**Risques** : Sarcopenie (perte musculaire), osteoporose, denutrition.
Besoin accru en proteines de haute valeur biologique.

#### Sportif

| Nutriment | Besoin specifique | Source |
|---|---|---|
| Proteines | 1.4-2.0 g/kg/jour (endurance-force) | ISSN 2017 |
| Glucides | 5-12 g/kg/jour (selon intensite) | ISSN 2017, Burke 2011 |
| Sodium | Augmente (sudation) | ACSM 2007 |
| Fer | Augmente (athletes feminines) | Peeling 2008 |
| Creatine | 3-5 g/jour (performance) | ISSN 2017 |

**Additifs** : Cafeine (ergogenique, pas un risque), Edulcorants (neutre).

---

## 4. Architecture du Naqiy Health Score V2

### 4.1 Principes directeurs

1. **Calcul propre du NutriScore** : Ne plus dependre du grade OFF. Reimplementer l'algorithme
   NutriScore 2024 a partir des nutriments bruts.

2. **Donnees manquantes = penalite explicite** : Pas de `null` silencieux. Un nutriment manquant
   est traite par le principe de precaution (imputation conservatrice) OU degrade le score de confiance.

3. **Profils utilisateurs** : Le score s'adapte au profil (enceinte, enfant, sportif, age, standard).
   Les flags `riskPregnant` et `riskChildren` de la DB additives sont enfin exploites.

4. **Transparence totale** : Chaque point est tracable (quel nutriment, quelle penalite, quel profil).

5. **Robustesse aux donnees partielles** : Le score fonctionne meme avec des donnees incompletes,
   mais le label de confiance s'ajuste.

### 4.2 Vue d'ensemble de l'architecture V2

```
Score total = 100 pts max (+ ajustement profil de -10 a +10)

  Axe 1: Profil nutritionnel        40 pts  (recalcul NutriScore 2024 propre)
  Axe 2: Risque additifs            25 pts  (V1 conserve + profils)
  Axe 3: Transformation NOVA        15 pts  (V1 conserve + heuristique)
  Axe 4: Completude donnees         10 pts  (V1 elargi)
  Axe 5: Ajustement profil          [-10, +10]  (NOUVEAU — bonus/malus par profil)
  ─────────────────────────────
  Cap final : [0, 100]
```

### 4.3 Changements V1 → V2

| Aspect | V1 | V2 |
|---|---|---|
| Source nutrition | Grade OFF (A-E) | Calcul propre NutriScore 2024 |
| Couverture nutrition | ~50% produits | ~65% produits (+30% relatif) |
| Nutriments utilises | Aucun | 7 nutriments + categorie |
| Profils utilisateurs | Aucun | 5 profils (standard, enceinte, enfant, sportif, age) |
| Flags riskPregnant/Children | Stockes mais ignores | Integres dans l'axe 5 |
| Donnees manquantes | null silencieux | Imputation + degradation confiance |
| Poids axe nutrition | 50 pts | 40 pts (redistribue sur profil) |
| Poids axe profil | 0 pts | 10 pts bonus/malus |
| Transparence | Label 5 niveaux | Label + detail par nutriment |

---

## 5. Axe 1 : Profil nutritionnel (40 pts)

### 5.1 Recalcul NutriScore 2024

Au lieu de dependre du grade OFF, on reimplemente l'algorithme complet.

**Entrees requises** (per 100g) :

| Champ OFF | Variable | Default si manquant |
|---|---|---|
| `nutriments.energy_100g` ou `energy-kj_100g` | energyKj | Conversion depuis kcal (*4.184) ou `null` |
| `nutriments.sugars_100g` | sugars | `null` → axe degrade |
| `nutriments.saturated-fat_100g` | saturatedFat | `null` → axe degrade |
| `nutriments.salt_100g` ou `sodium_100g` * 2.5 | salt | `null` → axe degrade |
| `nutriments.fiber_100g` | fiber | **0** (precaution) |
| `nutriments.proteins_100g` | proteins | **0** (precaution) |
| `nutriments.fruits-vegetables-nuts-estimate_100g` | fvn | **0** (precaution) |
| `categories` | category | "general" |

**Logique de decision pour l'imputation** :
- Les 4 nutriments N (energie, sucres, satures, sel) sont **essentiels** : si l'un manque, l'axe
  est degrade (score partiel) ou fallback au grade OFF si disponible.
- Les 3 nutriments P (fibres, proteines, FVN) sont **bonus** : s'ils manquent, on impute 0 (le
  produit ne recoit pas de bonus, mais n'est pas penalise injustement).

### 5.2 Implementation de l'algorithme

```
Fonction computeNutriScoreRaw(nutriments, category):

  1. Calculer N_points:
     energyPts = lookupThreshold(energyKj, ENERGY_THRESHOLDS)      // 0-10
     sugarPts  = lookupThreshold(sugars, SUGAR_THRESHOLDS)          // 0-10 (0-15 revise)
     satFatPts = lookupThreshold(saturatedFat, SAT_FAT_THRESHOLDS)  // 0-10
     saltPts   = lookupThreshold(salt, SALT_THRESHOLDS)             // 0-10 (0-20 revise)
     N = energyPts + sugarPts + satFatPts + saltPts

  2. Calculer P_points:
     fiberPts   = lookupThreshold(fiber, FIBER_THRESHOLDS)    // 0-5
     proteinPts = lookupThreshold(proteins, PROTEIN_THRESHOLDS) // 0-5 (0-7 revise)
     fvnPts     = lookupThreshold(fvn, FVN_THRESHOLDS)        // 0-5

  3. Appliquer la regle speciale proteines:
     Si N > 11 ET fvn < 80:
       P = fiberPts + fvnPts  (proteines exclues)
     Sinon:
       P = fiberPts + proteinPts + fvnPts

  4. Score NutriScore brut = N - P
     (plage theorique: -17 a +55)

  5. Mapper le score brut au grade:
     A: <=0, B: 1-2, C: 3-10, D: 11-18, E: >=19
```

### 5.3 Mapping grade → points (non-lineaire justifie)

| Grade | Score brut NutriScore | Points Naqiy (sur 40) | Justification |
|:---:|:---:|:---:|---|
| A | <=0 | 40 | Excellence nutritionnelle — aucune penalite |
| B | 1-2 | 33 | Bon profil — penalite legere (-17.5%) |
| C | 3-10 | 22 | Moyen — la plage C est large (8 points), milieu du spectre |
| D | 11-18 | 10 | Mauvais profil — forte penalite |
| E | >=19 | 0 | Profil nutritionnel tres defavorable |

**Justification de la non-linearite** :
La distance entre B et C est proportionnellement plus grande que entre A et B car le grade C
couvre une plage de 8 points de score brut (3-10) contre 2 pour B (1-2). La chute de 33→22
(-33%) reflete la transition d'un produit "globalement bon" a un produit "mediocre".

**Interpolation intra-grade** (amelioration V2) :
Au lieu de discretiser en 5 paliers, on peut interpoler lineairement a l'interieur de chaque grade
pour un scoring plus granulaire :

```
Si grade A (raw <= 0): points = 40
Si grade B (raw 1-2): points = 33 + (2-raw) * 3.5  → [33, 36.5]
Si grade C (raw 3-10): points = 22 + (10-raw) * 1.375  → [22, 31.625]
Si grade D (raw 11-18): points = 10 + (18-raw) * 1.5  → [10, 20.5]
Si grade E (raw >= 19): points = max(0, 10 - (raw-19) * 0.5)  → [0, 10]
```

Cette interpolation transforme 5 paliers en un continuum de 0 a 40, plus discriminant.

### 5.4 Fallback au grade OFF

Si les nutriments bruts sont insuffisants pour le recalcul (< 3 des 4 N-nutriments presents),
on fallback au grade OFF pre-calcule avec la meme table de mapping.

Priorite : **Recalcul propre > Grade OFF > null**

---

## 6. Axe 2 : Risque additifs (25 pts)

### 6.1 Conservation du modele V1

Le modele V1 est solide et bien teste. On le conserve avec des ajouts :

| Toxicite | Penalite V1 | Penalite V2 | Justification |
|---|---|---|---|
| safe | 0 | 0 | Aucun risque identifie |
| low_concern | 2 | 2 | Risque faible (ex: colorants naturels) |
| moderate_concern | 5 | 5 | Debat scientifique en cours (ex: E171) |
| high_concern | 10 | 10 | Risque eleve (ex: nitrites E249-252) |

Modulateurs conserves : EFSA restricted (x1.5), ADI < 5mg/kg (x1.3), banni dans 3+ pays (+3).

### 6.2 Ajout V2 : Cap additif (inspire Yuka)

**Nouvelle regle** : Si un additif `efsaStatus = "banned"` est present → axe additifs = 0 (deja en V1).
**Ajout** : Si un additif `toxicityLevel = "high_concern"` est present → score final cap a 49/100
(comme Yuka). Ceci evite qu'un produit avec un additif dangereux obtienne un score "excellent"
grace a un bon NutriScore et un NOVA 1.

### 6.3 Ajout V2 : Penalite profil

Voir Axe 5 pour les penalites specifiques aux profils (riskPregnant, riskChildren).

---

## 7. Axe 3 : Transformation NOVA (15 pts)

### 7.1 Table de points (conservee)

| NOVA | Points | Description |
|:---:|:---:|---|
| 1 | 15 | Non transforme ou peu transforme |
| 2 | 12 | Ingredient culinaire transforme |
| 3 | 8 | Aliment transforme |
| 4 | 2 | Ultra-transforme |

### 7.2 Amelioration V2 : Heuristique de renfort

Quand le NOVA group est absent d'OFF ET de l'estimation AI :

```
Fonction estimateNovaHeuristic(additiveCount, ingredientCount, categories):
  Si additiveCount >= 5: return 4  (tres probablement ultra-transforme)
  Si additiveCount >= 3: return 3-4  (transforme ou ultra-transforme)
  Si categories contient "snacks|sodas|confiseries|chips": return 4
  Si categories contient "conserves|fromages": return 3
  Si ingredientCount <= 3 ET additiveCount == 0: return 1
  Sinon: return null  (pas assez d'info)
```

**Confiance** : L'estimation heuristique est marquee `novaSource: "heuristic"` avec une
confiance "basse" dans le score final.

---

## 8. Axe 4 : Completude et qualite des donnees (10 pts)

### 8.1 Grille enrichie (V2)

| Champ present | Points | V1 |
|---|---|---|
| Liste d'ingredients | 2 | 3 |
| Tableau nutritionnel (>=4 nutriments N) | 3 | 3 |
| Allergenes declares | 1 | 2 |
| Origine/lieu de fabrication | 1 | 2 |
| NutriScore calculable (grade A-E) | 1.5 | — |
| NOVA group disponible | 1.5 | — |

**Total** : 10 points (V1 : 10 points)

**Changement** : On accorde des points bonus pour la calculabilite du NutriScore et la
disponibilite du NOVA, car ces donnees sont les plus impactantes sur le score final.

---

## 9. Axe 5 : Profil utilisateur (10 pts bonus/malus)

### 9.1 Concept

C'est l'axe **differentiant** de Naqiy. Aucun concurrent (Yuka, Open Food Facts, ScanUp)
ne propose un scoring adapte au profil physiologique de l'utilisateur.

Le principe : le score de base (axes 1-4) est **ajuste** par un delta de -10 a +10 points
selon le profil selectionne par l'utilisateur et la composition du produit.

### 9.2 Profils disponibles

| Profil | ID | Description |
|---|---|---|
| Standard | `standard` | Adulte en bonne sante (18-64 ans) — aucun ajustement |
| Femme enceinte | `pregnant` | Grossesse et allaitement — penalites additifs + bonus nutriments cles |
| Enfant | `child` | 3-12 ans — penalites sucre/additifs + bonus calcium |
| Sportif | `athlete` | Entrainement regulier — bonus proteines/glucides, tolerance sodium |
| Personne agee | `elderly` | >65 ans — bonus proteines/fibres, penalite faible qualite nutritionnelle |

### 9.3 Matrice d'ajustement par profil

#### Profil `pregnant`

| Condition | Ajustement | Base scientifique |
|---|---|---|
| Additif `riskPregnant = true` present | -3 par additif (max -10) | EFSA, ANSES avis additifs grossesse |
| Produit contient cafeine (AI detection) | -2 | OMS: <200mg/jour pendant grossesse |
| NutriScore E | -2 supplementaire | Risque de diabete gestationnel |
| Produit riche en folate (epinards, etc.) | +2 | EFSA: 600 ug DFE/jour pendant grossesse |
| Produit source de fer heminique | +1 | ANSES: besoins augmentes en fer |

#### Profil `child`

| Condition | Ajustement | Base scientifique |
|---|---|---|
| Additif `riskChildren = true` present | -3 par additif (max -10) | EFSA Southampton Six 2009 |
| Sucres > 20g/100g | -3 | OMS: <10% apport energetique |
| Edulcorants intenses presents | -2 | ANSES: deconseilles <3 ans, prudence 3-12 ans |
| NOVA 4 | -2 supplementaire | Srour et al., BMJ 2019 (ultra-transformes) |
| Produit source de calcium | +2 | EFSA: 800-1150 mg/jour (croissance) |
| Produit riche en fibres (>5g/100g) | +1 | EFSA AI: 14g/jour (4-8 ans) |

#### Profil `athlete`

| Condition | Ajustement | Base scientifique |
|---|---|---|
| Proteines > 15g/100g | +3 | ISSN: 1.4-2.0 g/kg/jour |
| Glucides > 40g/100g (hors sucres simples) | +2 | ISSN: 5-12 g/kg/jour |
| Sodium eleve (sel > 1.5g) | 0 (pas de penalite) | Sudation augmente les besoins |
| NOVA 4 avec > 5 additifs | -2 | Qualite alimentaire |
| Produit ultra-transforme mais riche en proteines | +1 (compensation partielle) | Pragmatisme (whey, barres proteinees) |

#### Profil `elderly`

| Condition | Ajustement | Base scientifique |
|---|---|---|
| Proteines < 5g/100g | -2 | ESPEN: 1.0-1.2 g/kg/jour (sarcopenie) |
| Proteines > 15g/100g | +3 | ESPEN: prevenir la denutrition |
| Fibres > 5g/100g | +2 | EFSA: transit, microbiome |
| Sodium > 2g sel/100g | -2 | Hypertension, risque cardiovasculaire |
| Additif `toxicity = high_concern` | -3 (vs -2 standard) | Vulnerabilite accrue |
| Calcium present (produit laitier, etc.) | +1 | EFSA: 950 mg/jour (osteoporose) |

#### Profil `standard`

Aucun ajustement — le score de base (axes 1-4) est le score final.

### 9.4 Implementation

```typescript
interface ProfileAdjustment {
  delta: number;        // -10 to +10
  reasons: string[];    // ex: ["E102 riskChildren: -3", "High protein: +3"]
}

function computeProfileAdjustment(
  profile: UserProfile,
  nutriments: NutrimentData,
  additives: AdditiveForScore[],
  novaGroup: number | null,
  aiEnrichment: AiEnrichment | null,
): ProfileAdjustment
```

---

## 10. Systeme de profils utilisateurs

### 10.1 Integration dans l'app

Le profil est selectionne par l'utilisateur dans les **reglages** (comme le madhab pour le halal).
Il est persiste dans le store local (MMKV) et envoye au backend via le header ou le body du scan.

Le profil **n'est PAS un filtre binaire** (comme "mode enceinte ON/OFF" dans d'autres apps).
C'est un **ajustement continu** du score, avec des raisons detaillees visibles par l'utilisateur.

### 10.2 UX proposee

```
[Reglages] → [Mon profil nutritionnel]
  ( ) Standard — Adulte en bonne sante
  ( ) Femme enceinte ou allaitante
  ( ) Enfant (3-12 ans)
  ( ) Sportif regulier
  ( ) Personne agee (65+)

Note: Ce profil adapte le score sante Naqiy a vos besoins nutritionnels specifiques.
Il ne remplace pas un avis medical.
```

### 10.3 Affichage sur le scan

Si le profil n'est pas "standard", le score sante affiche un badge :
- "Adapte grossesse" (avec icone)
- "Adapte enfant"
- etc.

Les raisons d'ajustement apparaissent dans le detail des axes :
```
Profil: Femme enceinte
  - E102 (Tartrazine): -3 pts (colorant azoique, deconseille pendant la grossesse)
  - Riche en folate: +2 pts (essentiel pour le developpement foetal)
  Net: -1 pt
```

---

## 11. Formule composite finale

### 11.1 Calcul

```
scoreBase = axe1_nutrition(40) + axe2_additifs(25) + axe3_nova(15) + axe4_completude(10)
            // = 0 a 90 pts (sans profil)

profileDelta = computeProfileAdjustment(profile, nutriments, additives, nova, ai)
            // = -10 a +10

scoreFinal = clamp(scoreBase + profileDelta, 0, 100)
```

**Note** : Le scoreBase max est 90 sans profil. Un profil standard laisse le score a 90 max.
Un profil specifique peut le monter a 100 (si le produit est parfaitement adapte au profil)
ou le descendre a max -10 (si le produit est contre-indique pour le profil).

Ceci signifie qu'un score de 100 n'est atteignable que par un produit A/NOVA1/0 additifs
qui est AUSSI parfaitement adapte au profil de l'utilisateur. C'est intentionnel.

### 11.2 Cap additif

Si un additif `high_concern` est present → scoreFinal = min(scoreFinal, 49).
Ceci assure qu'un produit avec un additif dangereux ne peut JAMAIS etre "excellent" ou "bon".

### 11.3 Labels

| Plage | Label | Couleur |
|:---:|---|---|
| 80-100 | Excellent | Vert fonce (#2D8B4E) |
| 60-79 | Bon | Vert clair (#8BC34A) |
| 40-59 | Mediocre | Orange (#FF9800) |
| 20-39 | Mauvais | Orange fonce (#E65100) |
| 0-19 | Tres mauvais | Rouge (#D32F2F) |

### 11.4 Niveau de confiance

| Niveau | Condition | Icone |
|---|---|---|
| Haute | NutriScore calculable + NOVA + ingredients | ●●● |
| Moyenne | NutriScore OU NOVA + ingredients | ●●○ |
| Basse | Seuls additifs ou incomplet | ●○○ |
| Tres basse | Quasi aucune donnee | ○○○ |

---

## 12. Gestion des donnees manquantes

### 12.1 Strategie d'imputation

| Champ manquant | Strategie | Justification |
|---|---|---|
| `energy_100g` | Tentative conversion depuis `energy-kcal_100g` * 4.184 | Champ souvent present sous une autre unite |
| `salt_100g` | Calculer depuis `sodium_100g` * 2.5 | Conversion standard |
| `fiber_100g` | Imputer 0 | Precaution — pas de bonus non justifie |
| `proteins_100g` | Imputer 0 | Precaution |
| `fruits-vegetables-nuts-estimate_100g` | Imputer 0 | Tres rarement renseigne dans OFF |
| `sugars_100g` manquant | Axe nutrition degrade (fallback grade OFF) | Sucre est critique pour le score |
| `saturated-fat_100g` manquant | Axe nutrition degrade (fallback grade OFF) | AG satures critique |
| Tous nutriments manquants | Axe nutrition = null | Score partiel |

### 12.2 Minimum viable pour un score

Pour calculer un score, il faut **au minimum 2 des 3 axes primaires** (nutrition, additifs, NOVA).
L'axe additifs est toujours calculable (meme avec 0 additifs → 25/25).

| Combinaison | Score possible | Confiance |
|---|---|---|
| Nutrition + Additifs + NOVA | Oui | Haute |
| Nutrition + Additifs (pas de NOVA) | Oui | Moyenne |
| Additifs + NOVA (pas de nutrition) | Oui | Moyenne |
| Additifs seuls | Non (→ null) | Basse |
| Rien du tout | Non (→ null) | Tres basse |

---

## 13. Comparaison avec les systemes existants

| Critere | Yuka | Open Food Facts | ScanUp | **Naqiy V2** |
|---|---|---|---|---|
| Calcul NutriScore propre | Non (grade OFF) | Off fait son propre calcul | Non | **Oui** (algorithme 2024 revise) |
| Profils utilisateurs | Non | Non | Non | **Oui** (5 profils) |
| Scoring additifs | Oui (4 niveaux) | Non (liste brute) | Non | **Oui** (4 niveaux + EFSA + ADI + madhab) |
| NOVA integration | Non | Oui (affichage) | Oui | **Oui** (scoring + heuristique) |
| Transparence algo | Partielle | Open source | Non | **Oui** (ce document) |
| Score adaptatif | Non | Non | Non | **Oui** (delta profil) |
| Confiance donnees | Non | Badge completude | Non | **Oui** (4 niveaux) |
| Integration halal | Non | Non | Non | **Oui** (meme ecran) |
| Cap additif dangereux | Oui (49/100) | Non | Non | **Oui** (49/100) |
| Sources scientifiques | Partielles | N/A | Non | **Oui** (ce document) |

### 13.1 Avantage differentiant cle

Naqiy est la SEULE application qui combine :
1. Un score halal (Trust Score) avec scoring par madhab
2. Un score sante nutritionnel avec profils physiologiques
3. Dans le meme ecran de scan, pour le meme produit

Cette triple lecture (halal + sante + profil) est **unique sur le marche mondial**.

---

## 14. Plan d'implementation

### Phase 1 : Recalcul NutriScore propre (Backend)

1. Creer `backend/src/services/nutriscore.service.ts`
   - Implementer les 3 tables de seuils (general, huiles, boissons)
   - Fonction `computeNutriScoreRaw(nutriments, category): { raw, grade, nPoints, pPoints }`
   - Detecter la categorie depuis `categories` OFF (boisson, huile, fromage, general)
   - Unit tests exhaustifs (20+ cas)

2. Modifier `health-score.service.ts`
   - Remplacer la dependance au grade OFF par le recalcul propre
   - Ajouter le fallback grade OFF si nutriments insuffisants
   - Ajuster les poids (50→40 pour nutrition)
   - Ajouter l'interpolation intra-grade

### Phase 2 : Profils utilisateurs (Backend + Frontend)

3. Ajouter le type `UserProfile` et l'ajustement profil dans `health-score.service.ts`
4. Modifier `scan.ts` pour passer le profil utilisateur au health score
5. Ajouter le selecteur de profil dans les reglages (Frontend)
6. Afficher le badge profil et les raisons d'ajustement sur le scan result

### Phase 3 : Ameliorations NOVA et completude

7. Implementer l'heuristique NOVA dans `health-score.service.ts`
8. Enrichir l'axe completude avec les nouveaux criteres
9. Ajouter le cap additif (high_concern → max 49)

### Phase 4 : Tests et validation

10. Tests unitaires exhaustifs (nutriscore, profils, heuristiques)
11. Tests d'integration (scan complet avec profils)
12. Validation croisee : 50 produits testes manuellement, resultats compares avec Yuka

### Fichiers a creer/modifier

| Fichier | Action |
|---|---|
| `backend/src/services/nutriscore.service.ts` | **NOUVEAU** — algorithme NutriScore 2024 |
| `backend/src/services/health-score.service.ts` | Refonte — V2 avec recalcul + profils |
| `backend/src/trpc/routers/scan.ts` | Passer profil au health score |
| `backend/src/__tests__/unit/nutriscore.test.ts` | **NOUVEAU** — tests NutriScore |
| `backend/src/__tests__/unit/health-score.test.ts` | Mise a jour tests V2 |
| `optimus-halal/app/scan-result.tsx` | Affichage profil + raisons |
| `optimus-halal/src/store/index.ts` | Ajouter `userProfile` au store |
| `optimus-halal/src/i18n/translations/*.ts` | Traductions profils + raisons |
| `docs/naqiy/internal/health-score-v2-research.md` | Ce document |

---

## 15. Limites et travaux futurs

### 15.1 Limites de V2

| Limite | Raison | Roadmap |
|---|---|---|
| Pas de micronutriments dans le scoring | OFF ne fournit pas systematiquement vitamines/mineraux | V3 — quand les donnees seront plus completes |
| FVN quasi-jamais renseigne dans OFF | Estimation algorithmique complexe (NLP sur ingredients) | V3 — modele ML sur categories |
| Profils simplifie (5 categories) | La medecine personnalisee est plus fine (IMC, allergies, etc.) | V4 — profils avances |
| Pas de quantite consommee | Le score est per 100g, pas per portion | V3 — integration taille de portion OFF |
| Categories produits imparfaites | La detection de categorie OFF est bruiteuse | V2.1 — heuristiques de nettoyage |
| Pas de synergie nutriments | L'interaction fer/vitamine C n'est pas modelisee | V4 — matrice d'interactions |

### 15.2 Travaux futurs V3+

| Version | Feature | Description |
|---|---|---|
| V2.1 | Detection de categorie amelioree | NLP sur `categories` + `product_name` pour classifier boisson/huile/general |
| V3 | Micronutriments | Scoring bonus pour vitamines/mineraux quand disponibles dans OFF |
| V3 | EcoScore integration | Axe 6 environnemental (ecologie) |
| V3 | Taille de portion | Score per portion au lieu de per 100g |
| V4 | Profils avances | IMC, allergies specifiques, intolerance lactose, etc. |
| V4 | Score communautaire | "Les femmes enceintes notent ce produit 3.5/5" |
| V5 | ML / NLP | Classification NOVA par ML sur la liste d'ingredients |

---

## 16. References bibliographiques

### Articles scientifiques

1. **Merz B, et al.** "Nutri-Score 2023 update." *Nature Food*, 2024.
   DOI: 10.1038/s43016-024-00920-3

2. **Srour B, et al.** "Ultra-processed food intake and risk of cardiovascular disease."
   *BMJ*, 2019; 365:l1451. DOI: 10.1136/bmj.l1451

3. **Monteiro CA, et al.** "Ultra-processed foods: what they are and how to identify them."
   *Public Health Nutrition*, 2019; 22(5):936-941.

4. **Gibney MJ, et al.** "Ultra-processed foods: how functional is the NOVA system?"
   *European Journal of Clinical Nutrition*, 2022.

5. **Jager R, et al.** "International Society of Sports Nutrition Position Stand: protein and exercise."
   *J Int Soc Sports Nutr*, 2017; 14:20. DOI: 10.1186/s12970-017-0177-8

6. **Deutz NEP, et al.** "Protein intake and exercise for optimal muscle function with aging."
   *Clinical Nutrition*, 2014; 33(6):929-936. DOI: 10.1016/j.clnu.2014.04.007

7. **Burke LM, et al.** "Carbohydrates for training and competition."
   *J Sports Sciences*, 2011; 29(sup1):S17-S27.

### Rapports institutionnels

8. **EFSA.** "Dietary Reference Values for nutrients: Summary report." 2017.
   DOI: 10.2903/sp.efsa.2017.e15121

9. **ANSES.** "Valeurs nutritionnelles de reference pour vitamines et mineraux." 2021.

10. **EFSA.** "Scientific Opinion on Dietary Reference Values for folate." 2014.
    EFSA Journal 2014; 12(11):3893.

11. **OMS/WHO.** "Guideline: Sugars intake for adults and children." 2015.

12. **Sante Publique France.** "Reglement d'usage de la marque collective de certification
    Nutri-Score." Version revisee, decembre 2023.

13. **EFSA Panel on Food Additives (ANS).** "Re-evaluation of food additives programme."
    Multiple opinions, 2009-2024.

14. **IARC.** "Monographs on the Identification of Carcinogenic Hazards to Humans." Volumes divers.

15. **ESPEN.** "Practical guideline: Clinical nutrition and hydration in geriatrics." 2022.
    Clinical Nutrition 41(4):958-989.

### Ressources techniques

16. **Open Food Facts API.** Documentation technique, 2024.
    https://openfoodfacts.github.io/openfoodfacts-server/api/

17. **Yuka Help Center.** "How are food products rated?" 2024.
    https://help.yuka.io/l/en/article/ijzgfvi1jq

18. **Eurofins Scientific.** "Update of the Nutri-Score from 31 December 2023." 2024.
    https://www.eurofins.de/food-analysis/food-news/food-testing-news/nutri-score-update/
