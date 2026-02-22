# Al-Ilm (العلم) -- Le Moteur de Savoir

> *"Qul hal yastawi alladhina ya'lamuna walladhina la ya'lamun."*
> *"Dis : sont-ils egaux, ceux qui savent et ceux qui ne savent pas ?"*
> -- Sourate Az-Zumar (39:9)

---

## Le savoir comme mission

L'Ilm -- la connaissance, la science -- est l'un des concepts les plus
veneres de la tradition islamique. Le premier mot revele du Coran est
"Iqra" (Lis). La quete du savoir est une obligation pour chaque
musulman. Naqiy transpose cette obligation dans le domaine alimentaire :
transformer l'opacite industrielle en savoir accessible.

Ce chapitre documente le moteur qui produit ce savoir -- le pipeline
de scan, la base d'additifs, le systeme de verdicts, et les mecanismes
d'humilite epistemique qui font que Naqiy dit "je ne sais pas" quand
il ne sait pas.

---

## Le pipeline de scan : de l'objectif camera au verdict

### Vue d'ensemble

```
[Camera] --> [Barcode] --> [Base locale?] --> [OpenFoodFacts] --> [Analyse]
                                                                     |
                                        +----------------------------+
                                        |
                              [Verdict halal]
                              [Verdicts madhab (x4)]
                              [Alertes personnelles]
                              [Check boycott]
                              [Compteur communautaire]
                              [XP + streak + milestone]
```

### Etape 0 : Capture du code-barres

Le scanner (`app/(tabs)/scanner.tsx`) utilise `expo-camera` avec
detection de barcode en temps reel. Les formats supportes sont
EAN-13, EAN-8, UPC-A, UPC-E, et Code 128 -- couvrant l'immense
majorite des produits alimentaires en France.

Le hook `useScan` orchestre le flow : capture, debounce (eviter les
scans multiples du meme code), appel tRPC, navigation vers le
resultat. Le feedback haptique est differencie selon le verdict
final : haptic lourd pour haram, moyen pour douteux, leger pour
halal (`useHaptics.ts`).

### Etape 1 : Recherche en base locale

La premiere chose que fait `scan.scanBarcode` est de chercher le
produit dans notre table `products` par barcode :

```typescript
let product = await ctx.db.query.products.findFirst({
  where: eq(products.barcode, input.barcode),
});
```

Si le produit existe, nous avons deja ses donnees. Mais nous
re-executons toujours l'analyse halal avec les preferences de
l'utilisateur courant (madhab + strictness), parce que le verdict
n'est pas absolu -- il depend du profil.

### Etape 2 : Appel a OpenFoodFacts

Si le produit n'existe pas en base, nous interrogeons l'API
OpenFoodFacts via `lookupBarcode()` dans `barcode.service.ts`.

**Points techniques :**

- **User-Agent identifie** : `Naqiy/1.0 (contact@naqiy.com)` --
  conformement aux bonnes pratiques OFF.
- **Cache Redis 24h** : Chaque reponse OFF est cachee sous la cle
  `off:{barcode}` avec un TTL de 86400 secondes. Cela reduit la
  charge sur l'API OFF et garantit des temps de reponse < 500ms
  pour les produits deja consultes.
- **Gestion d'erreur gracieuse** : Si l'API OFF est injoignable,
  `lookupBarcode` retourne `{ found: false }` sans crash. Le
  produit recoit le statut `unknown`.

Les donnees recuperees d'OFF comprennent :
- `product_name`, `brands`, `categories`
- `ingredients_text` (texte libre des ingredients)
- `additives_tags` (liste normalisee des additifs, ex: `en:e471`)
- `labels_tags` (labels dont les certifications halal)
- `ingredients_analysis_tags` (analyse OFF : vegan, vegetarian, etc.)
- `allergens_tags`, `traces_tags`
- `nutriscore_grade`, `nova_group`, `ecoscore_grade`
- `nutriments` (donnees nutritionnelles completes)

### Etape 3 : Analyse halal v3 -- madhab-aware, DB-backed

La fonction `analyzeHalalStatus()` dans `barcode.service.ts` est le
coeur intellectuel de Naqiy. Elle opere en quatre tiers successifs.

#### Tier 1 : Detection de certification halal

Le premier check est le plus fiable : existe-t-il un label halal
dans les `labels_tags` du produit ?

```typescript
const HALAL_LABEL_TAGS = [
  "en:halal", "en:halal-certified", "fr:certifie-halal",
  "en:halal-food-authority", "en:muis-halal",
  "en:jakim-halal", "en:mui-halal",
  "fr:halal", "ar:halal",
];
```

Si un label est detecte, le verdict est immediat :
- Status : `halal`
- Confidence : `0.95` (pas 1.0 -- le label peut etre errone)
- Tier : `certified`
- Source d'analyse : "Label certifie OpenFoodFacts"

Le score de confiance est plafonne a 0.95 et non 1.0. C'est un
choix d'humilite epistemique : meme un label certifie peut etre
obsolete ou mal reference dans OFF. Seule l'inspection physique
du produit donnerait un 1.0.

#### Tier 2 : Analyse des additifs (DB + madhab)

Si aucun label halal n'est detecte, nous analysons les additifs
individuellement via notre base de donnees.

La fonction `lookupAdditives()` :
1. Normalise les tags OFF (`en:e322i` --> `E322`)
2. Interroge la table `additives` (140+ entrees) par batch
   `inArray`
3. Si le madhab utilisateur n'est pas `general`, interroge la
   table `additive_madhab_rulings` pour les overrides scolaires

**Exemple concret :** L'additif E120 (carmine/cochenille) est
classe `haram` par defaut dans notre base car il est extrait
d'insectes. Cependant, l'ecole Malikite considere les insectes
comme consommables. Si l'utilisateur est Malikite, le ruling
override de la table `additive_madhab_rulings` s'applique, et
le E120 passe en `halal` pour cet utilisateur.

**Structure de la table `additives` :**

| Colonne                | Type          | Role                          |
|------------------------|---------------|-------------------------------|
| `code`                 | varchar(10)   | Cle primaire (E120, E441...)  |
| `name_fr` / `name_en`  | varchar(255)  | Nom multilingue               |
| `name_ar`              | varchar(255)  | Nom en arabe                  |
| `category`             | enum          | Categorie (colorant, etc.)    |
| `halal_status_default` | enum          | Statut par defaut             |
| `halal_explanation_fr`  | text          | Explication en francais       |
| `origin`               | enum          | plant/animal/synthetic/...    |
| `origin_details`       | text          | Precision sur l'origine       |
| `toxicity_level`       | enum          | safe/low/moderate/high        |
| `adi_mg_per_kg`        | float         | Dose journaliere admissible   |
| `risk_pregnant`        | boolean       | Risque grossesse              |
| `risk_children`        | boolean       | Risque enfants                |
| `risk_allergic`        | boolean       | Risque allergique             |
| `health_effects_fr`    | text          | Effets sante documentes       |
| `efsa_status`          | enum          | Statut EFSA (approved, etc.)  |
| `banned_countries`     | text[]        | Pays ou interdit              |

**Structure de `additive_madhab_rulings` :**

| Colonne               | Type          | Role                         |
|------------------------|---------------|------------------------------|
| `id`                   | uuid          | Cle primaire                 |
| `additive_code`        | varchar(10)   | FK vers `additives.code`     |
| `madhab`               | enum          | hanafi/shafii/maliki/hanbali |
| `ruling`               | enum          | halal/haram/doubtful         |
| `explanation_fr`       | text          | Explication savante          |
| `scholarly_reference`  | text          | Reference bibliographique    |

L'index unique `(additive_code, madhab)` garantit qu'il n'y a
jamais deux avis contradictoires pour la meme ecole sur le meme
additif.

#### Tier 3 : Analyse des ingredients textuels

Le texte libre des ingredients (`ingredients_text`) est scanne
contre deux listes de mots-cles :

**Ingredients haram (arret immediat) :**
- porc, pork, gelatin, gelatine, lard, saindoux
- alcool, alcohol, ethanol, wine, vin, biere, beer
- rhum, rum, whisky, vodka, brandy
- carmine, cochineal

**Ingredients douteux (flag) :**
- mono-, diglycerides, monoglycerides
- whey, lactoserum
- rennet, presure

**Nuance vegan :** Si un ingredient douteux est detecte mais que
le produit porte le tag `en:vegan` dans `ingredients_analysis_tags`,
l'ingredient est reclasse en `halal` avec l'explication : "produit
labellise vegan, donc origine vegetale".

C'est un raccourci rationnel : un produit certifie vegan ne
contient par definition aucune matiere animale, ce qui resout
l'ambiguite des emulsifiants E471/E472/etc. dont l'origine peut
etre animale ou vegetale.

#### Tier 4 : Application de la strictness overlay

Le dernier etage de l'analyse ajuste le verdict selon le niveau
de strictness de l'utilisateur :

| Strictness    | Effet sur "douteux"                              |
|---------------|--------------------------------------------------|
| `relaxed`     | Douteux --> halal (confiance 0.5)                 |
| `moderate`    | Aucun changement (defaut)                        |
| `strict`      | Confiance du douteux augmentee a 0.7              |
| `very_strict` | Tout non-certifie --> douteux (confiance 0.3)     |

Le mode `very_strict` est radical : seuls les produits portant un
label halal reconnu recoivent le statut `halal`. Tout le reste est
douteux ou haram. C'est le choix de l'utilisateur, pas le notre.

### Etape 4 : Verdicts comparatifs par madhab

Apres l'analyse principale, `computeMadhabVerdicts()` produit un
tableau de 4 entrees -- une par ecole juridique -- avec :

- Le statut worst-case pour cette ecole
- La liste des additifs problematiques avec l'avis de cette ecole
- La reference savante pour chaque ruling

La logique worst-case :
```
haram (poids 3) > doubtful (poids 2) > halal (poids 1)
```

Si une ecole a un ruling `haram` pour E120 mais `halal` pour E471,
le verdict global de cette ecole est `haram` -- le pire l'emporte.

### Etape 5 : Alertes personnelles

Le systeme d'alertes croise le profil de l'utilisateur avec le
produit scanne :

**5a. Allergenes** : Les `allergens_tags` et `traces_tags` du
produit sont compares aux `allergens` du profil utilisateur via
`matchAllergens()` dans `allergen.service.ts`. Deux niveaux :
- `allergen` (severity: high) : "Contient : gluten"
- `trace` (severity: medium) : "Traces possibles : arachides"

**5b. Sante** : Si l'utilisateur est `isPregnant` ou `hasChildren`,
les additifs du produit sont filtres par `risk_pregnant` et
`risk_children`. Chaque match genere une alerte avec l'explication
sante de notre base.

**5c. Boycott** : Le brand du produit est verifie contre la table
`boycott_targets` via `checkBoycott()`. La recherche est fuzzy :
`lower(brand) LIKE '%' || lower(b) || '%'` dans les deux directions.

### Etape 6 : Gamification atomique

Le scan met a jour les compteurs du joueur dans une transaction
PostgreSQL :

```
BEGIN TRANSACTION
  INSERT INTO scans (...)
  SELECT user streak data
  CALCULATE new streak (with freeze logic)
  CALCULATE milestone bonus XP
  UPDATE users SET totalScans+1, XP+10+bonus, level, streak
COMMIT
```

**Milestones de streak :**

| Jours consecutifs | Bonus XP |
|-------------------|----------|
| 3                 | 15       |
| 7                 | 30       |
| 14                | 50       |
| 30                | 100      |
| 60                | 200      |
| 100               | 500      |
| 365               | 1000     |

**Streak freeze :** Si l'utilisateur a manque 1 a 3 jours mais
possede un gel de serie (`streakFreezeCount > 0`), la streak est
preservee et un gel est consomme. C'est un mecanisme compassionnel :
la vie reelle ne permet pas toujours de scanner tous les jours.

**Level-up :** Le niveau est recalcule en temps reel. Les seuils
XP suivent une progression non-lineaire :

| Niveau | XP requis |
|--------|-----------|
| 1      | 0         |
| 2      | 100       |
| 3      | 300       |
| 4      | 600       |
| 5      | 1000      |
| 6      | 1500      |
| 7      | 2500      |
| 8      | 4000      |
| 9      | 6000      |
| 10     | 10000     |

Si le niveau augmente, le champ `levelUp` du retour contient
`{ previousLevel, newLevel, newXp }` pour declencher l'animation
`LevelUpCelebration` cote mobile.

---

## La base d'additifs : 140+ entries

### Couverture

Notre base couvre les additifs les plus courants dans l'industrie
alimentaire europeenne, classes par categorie :

| Categorie          | Exemples                       | Nombre |
|--------------------|--------------------------------|--------|
| Colorant           | E100 (curcumine), E120, E150a  | ~20    |
| Conservateur       | E200, E202, E270               | ~15    |
| Antioxydant        | E300, E330, E331               | ~10    |
| Emulsifiant        | E322, E471, E472a-e, E476      | ~25    |
| Stabilisant        | E400, E407, E410, E412, E415   | ~15    |
| Epaississant       | E440, E460                     | ~10    |
| Exhausteur         | E631, E635                     | ~5     |
| Edulcorant         | E420, E966                     | ~10    |
| Acidifiant         | E334                           | ~5     |
| Anti-agglomerant   | E500, E570                     | ~5     |
| Agent de glaçage   | E901, E904                     | ~5     |
| Humectant          | E420                           | ~5     |
| Divers             | E441 (gelatine), E542, E920    | ~15    |

### Additifs critiques

Certains additifs concentrent l'essentiel des enjeux halal :

**E120 (Carmine/Cochenille)** -- Classe `haram` par defaut.
Extrait de l'insecte Dactylopius coccus. Divergence scolaire :
les Malikites autorisent les insectes, les trois autres ecoles
les interdisent.

**E441 (Gelatine)** -- Classe `haram` par defaut. Generalement
d'origine porcine en Europe. Gelatine bovine halal existe mais
est rarement specifiee sur les emballages.

**E471 (Mono/diglycerides)** -- Classe `doubtful` par defaut.
L'origine (vegetale ou animale) n'est presque jamais precisee.
C'est l'additif le plus frequemment rencontre dans la zone grise.

**E542 (Phosphate d'os)** -- Classe `haram`. Origine animale
confirmee (os).

**E920 (L-Cysteine)** -- Classe `doubtful`. Peut etre extraite
de plumes de canard, de cheveux humains (Chine), ou synthetisee.

### Fallback pour additifs inconnus

Si un additif present dans les tags OFF n'est pas dans notre base
PostgreSQL, un dictionnaire de fallback hardcode dans
`barcode.service.ts` (`ADDITIVES_HALAL_DB`) est consulte. Ce
dictionnaire contient ~50 entrees et sert de filet de securite.
Les additifs detectes par ce fallback sont logs pour enrichissement
futur de la base principale.

---

## Score de confiance : epistemologie du doute

Le `confidenceScore` n'est pas un score arbitraire. Il encode
notre niveau de certitude sur le verdict :

| Plage         | Signification                                     |
|---------------|--------------------------------------------------|
| 0.90 - 0.95   | Certifie ou evidence forte (label halal, gelatine)|
| 0.70 - 0.89   | Analyse solide, ingredients clairs                |
| 0.50 - 0.69   | Zone grise, origines non precisees                |
| 0.30 - 0.49   | Peu de donnees, inference faible                  |
| 0.00 - 0.29   | Aucune donnee ou produit inconnu                  |

Le score est affiche a l'utilisateur dans l'ecran `scan-result.tsx`
sous forme d'un anneau de progression colore. Plus le score est bas,
plus la couleur tend vers le gris (`halalStatus.unknown.base`).

### Pourquoi ne pas simplifier en "oui/non" ?

Parce que ce serait mentir. La realite halal est un spectre, pas
un binaire. Un produit peut contenir un E471 d'origine vegetale
(halal) ou animale (haram), et sans information de tracabilite,
la reponse honnte est "nous ne savons pas avec certitude".

Le score de confiance rend cette incertitude explicite. Il permet
a l'utilisateur de faire un choix eclaire : un utilisateur en mode
`relaxed` acceptera un 0.5, un utilisateur en mode `very_strict`
l'interpretera comme un signal d'evitement.

---

## Certification : ce que nous verifions, ce que nous ne verifions pas

### Ce que nous verifions

- La presence d'un label halal dans les `labels_tags` OFF
- La coherence des ingredients avec le statut halal
- Le statut de chaque additif dans notre base documentee
- La correspondance entre le label et les organismes connus

### Ce que nous ne verifions PAS

- La chaine d'approvisionnement physique du produit
- L'authenticit du certificat halal papier
- La conformite du process d'abattage
- L'absence de contamination croisee en usine

Naqiy est un outil d'analyse d'etiquetage, pas un auditeur de
terrain. Cette distinction est fondamentale et communiquee
clairement dans l'interface : "Analyse basee sur l'etiquetage
OpenFoodFacts -- non substitutif d'une verification directe."

---

## Limitations connues et assumees

### 1. Dependance a OpenFoodFacts

Si OFF est indisponible ou si le produit n'y est pas reference,
Naqiy retourne `unknown`. Nous ne fabriquons pas de donnees.
L'utilisateur peut alors soumettre une `requestAnalysis` pour
demander un enrichissement manuel.

### 2. Lag d'actualisation

Les donnees OFF peuvent etre obsoletes. Un produit dont la recette
a change recemment peut encore afficher l'ancienne composition.
Notre cache Redis de 24h ajoute un delai supplementaire. Le champ
`lastSyncedAt` dans la table `products` permet de detecter les
produits dont les donnees sont anciennes.

### 3. Ambiguite des origines

Pour de nombreux additifs (E471, E472, E473, E474, E475, E481,
E491), l'origine (vegetale ou animale) n'est tout simplement pas
disponible dans les donnees publiques. Ces additifs sont classes
`doubtful` par defaut -- la position la plus honnte possible.

### 4. Labels halal non reconnus

Notre liste de labels halal reconnus (`HALAL_LABEL_TAGS`) est
limitative. Un produit certifie par un organisme non liste (par
exemple un certificateur malaysien rare) ne sera pas detecte comme
certifie. Le systeme retombera sur l'analyse d'ingredients.

### 5. Texte d'ingredients non structure

Le champ `ingredients_text` est du texte libre, pas une liste
structuree. Notre analyse par mots-cles peut manquer des
formulations inhabituelles ou des langues non supportees (les
mots-cles sont en francais et anglais).

---

## Feuille de route du moteur de savoir

### Court terme (Q1 2026)

- Enrichir la base d'additifs : passer de 140+ a 300+ entrees
- Ajouter les references savantes manquantes dans
  `additive_madhab_rulings.scholarly_reference`
- Implementer un systeme de "freshness" : re-sync OFF automatique
  pour les produits dont `lastSyncedAt` > 30 jours

### Moyen terme (Q2-Q3 2026)

- OCR sur etiquettes : scanner directement la liste d'ingredients
  depuis une photo quand le produit n'est pas dans OFF
- Integration avec des bases de certificateurs (API AVS, ARGML)
  pour verification en temps reel
- Crowdsourcing : permettre aux utilisateurs confirmes de soumettre
  des corrections sur les additifs (avec moderation)

### Long terme (2027+)

- ML sur les compositions : predire le statut halal probable d'un
  produit base sur sa categorie et sa marque, mme sans ingredients
- Partenariats avec des fabricants pour obtenir des donnees de
  tracabilite (origine des E471 par lot)
- API publique Naqiy : offrir nos donnees d'additifs + rulings comme
  service pour d'autres applications

---

L'Ilm est le fondement de tout le reste. Sans savoir fiable, la
confiance est impossible, la communaute se fragmente, et l'outil
devient nuisible. Chaque ligne de `barcode.service.ts` est ecrite
avec cette conscience : nous manipulons du savoir religieux. La
precision n'est pas une option -- c'est une obligation.

---

*Document interne Naqiy -- Version 1.0 -- Fevrier 2026*
*Classification : Strategique -- Diffusion restreinte*
