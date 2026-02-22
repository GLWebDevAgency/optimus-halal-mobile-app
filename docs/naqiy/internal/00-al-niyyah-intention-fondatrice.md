# Al-Niyyah (النية) -- L'Intention Fondatrice

> *"Innamal a'malou binniyyat -- Les actes ne valent que par les intentions."*
> -- Hadith rapporte par Al-Bukhari et Muslim, d'apres Omar ibn Al-Khattab (ra)

---

## Pourquoi ce document existe

Chaque produit technologique repose sur un ensemble de convictions implicites.
La plupart ne les formulent jamais. Elles finissent diluees dans les sprints,
les compromis de roadmap, les metriques de croissance. Naqiy refuse cet oubli.

Ce chapitre est notre Niyyah : l'intention consciente, articulee, non
negociable, qui precede chaque ligne de code, chaque choix de design, chaque
mot adresse a nos utilisateurs. Comme le rappelle le hadith fondateur, un acte
sans intention juste n'a aucune valeur. Nous codons avec intention.

---

## Le vide que Naqiy comble

### Le paysage avant Naqiy

Le musulman francais qui veut manger halal en 2026 navigue dans un
ecosysteme fracture :

1. **L'opacite industrielle.** Les listes d'ingredients sont ecrites pour
   des chimistes, pas pour des consommateurs. Un E471 peut etre d'origine
   vegetale ou porcine -- rien sur l'emballage ne le precise.

2. **Le monopole de l'anxiete.** Les rares applications existantes
   exploitent la peur. Leurs modeles economiques reposent sur l'angoisse :
   plus l'utilisateur doute, plus il scanne, plus il voit de publicites.

3. **Le jugement confessionnel.** Chaque application impose une grille de
   lecture unique : un seul madhab, une seule ligne de severite. Le Hanafi
   qui utilise une app Shafi'ite se retrouve avec des verdicts qui ne
   correspondent pas a sa pratique.

4. **Les donnees captives.** Le statut halal d'un produit -- information
   qui devrait etre un bien commun -- est cache derriere des paywalls.
   On fait payer l'acces a la verite religieuse.

5. **L'absence geographique.** Aucune solution ne cartographie de maniere
   fiable les commerces halal en France. Le boucher certifie du quartier
   n'existe dans aucune base de donnees.

### Ce que Naqiy signifie

Le mot arabe **Naqiy** (نقي) signifie **pur, limpide, transparent**. Ce
n'est pas un nom commercial arbitraire. Il exprime notre proposition de
valeur en un seul mot :

- **Pur** : comme le produit que vous cherchez.
- **Limpide** : comme l'information que nous vous donnons.
- **Transparent** : comme notre methode, notre code, notre ethique.

Le tagline -- *"Ton halal, en toute clarte"* -- complete cette promesse.
Nous ne disons pas "le halal" (universel, dogmatique). Nous disons
"ton halal" (personnel, respectueux de ta pratique).

---

## Les cinq principes fondateurs

### Principe 1 : La verite est toujours gratuite

C'est notre regle cardinale. Le statut halal d'un produit -- halal,
haram, douteux, inconnu -- est accessible gratuitement, pour toujours,
sans limite de scans, sans inscription obligatoire pour le premier scan.

Nous considerons que facturer l'acces a une information religieuse de
base est ethiquement indefendable. L'abonnement Naqiy+ existe pour
financer le service, mais il porte sur des fonctionnalites de confort
(historique etendu, alertes personnalisees avancees, mode hors-ligne,
partage enrichi), jamais sur la reponse a la question fondamentale :
"Est-ce que ce produit est halal ?"

**Implication technique :** La procedure `scan.scanBarcode` dans notre
backend est une `protectedProcedure` (authentification requise), mais
l'authentification est gratuite. Le champ `subscriptionTier` du user
n'est jamais verifie dans le chemin critique du verdict halal.

### Principe 2 : La neutralite confessionnelle

Naqiy ne favorise aucune ecole juridique islamique. Notre schema `users`
contient un champ `madhab` avec cinq valeurs possibles : `hanafi`,
`shafii`, `maliki`, `hanbali`, et `general`. La valeur par defaut est
`general` -- aucune presomption.

Quand un utilisateur scanne un produit, la reponse contient
systematiquement un tableau `madhabVerdicts` avec les quatre avis
scolaires. Si l'utilisateur a renseigne son madhab, le verdict
principal est adapte a son ecole. Sinon, nous affichons le verdict
le plus prudent (worst-case).

Nous n'affichons jamais un seul avis en pretendant qu'il est "la"
reponse. Nous affichons quatre avis en disant "voici ce que chaque
ecole en dit". L'utilisateur fait son choix eclaire.

**Implementation :** La fonction `computeMadhabVerdicts()` dans
`scan.ts` joint la table `additive_madhab_rulings` avec la table
`additives` pour produire un verdict par ecole. L'index unique
`madhab_ruling_unique_idx` sur `(additive_code, madhab)` garantit
un seul avis par additif par ecole.

### Principe 3 : Zero dark patterns

Nous maintenons une liste explicite de pratiques interdites dans Naqiy.
Ce n'est pas un ideal abstrait -- c'est une checklist de code review.

**Patterns formellement interdits :**

| Pattern                     | Pourquoi c'est interdit                                    |
|-----------------------------|-----------------------------------------------------------|
| Compteur de scans restants  | Cree l'anxiete de rarete sur une info gratuite            |
| Upsell apres scan haram     | Exploite un moment de vulnerabilite                       |
| Streak break culpabilisant   | Transforme la piete en addiction                          |
| Notifications de peur        | "Vous avez mange haram hier !" -- manipulation            |
| Paywall sur le verdict       | Viole le Principe 1                                       |
| Opt-out par defaut           | Le consentement doit etre explicite                       |
| Faux compte a rebours        | Urgence artificielle sur l'abonnement                    |
| Comparaison sociale negative | "X a un meilleur score que vous" -- toxic                 |
| Infinite scroll sans fin     | Addictif by design                                        |
| Donnees revendues            | Les scans halal sont des donnees religieuses sensibles    |

### Principe 4 : L'incertitude est une reponse valide

Quand nous ne savons pas, nous disons "nous ne savons pas". Notre
systeme de verdicts comprend quatre statuts : `halal`, `haram`,
`doubtful` (douteux), et `unknown` (inconnu). Chaque statut est
accompagne d'un score de confiance entre 0 et 1.

La tentation de tout systeme algorithmique est de toujours produire
une reponse definitive. Nous resistons a cette tentation. Un produit
sans liste d'ingredients dans OpenFoodFacts recoit le statut `unknown`
avec une confiance de 0, et nous expliquons pourquoi.

Le doute, en islam, n'est pas une faiblesse. La tradition prophetique
enseigne : *"Ce qui est halal est clair, ce qui est haram est clair,
et entre les deux se trouvent des choses ambigues."* (Hadith d'An-Nawawi).
Naqiy respecte cette zone grise au lieu de la nier.

**Implementation :** Le `confidenceScore` est un `doublePrecision` dans
la table `products`. L'interface `HalalAnalysis` expose un champ `tier`
avec quatre niveaux : `certified` (0.95), `analyzed_clean` (0.80),
`doubtful` (0.60), et `haram` (0.90). Le tier `certified` n'est
attribue que si un label halal reconnu est detecte dans les
`labels_tags` d'OpenFoodFacts.

### Principe 5 : Servir, pas juger

Naqiy est un outil d'information, pas un tribunal religieux. Nous ne
disons jamais a un utilisateur "vous ne devriez pas manger cela". Nous
disons "voici ce que nous savons sur ce produit". La decision appartient
toujours a l'individu.

Cette distinction se manifeste dans chaque choix de wording. Nos
traductions en trois langues (francais, anglais, arabe) dans
`src/i18n/translations/` utilisent un vocabulaire informatif, jamais
imperatif. "Contient de la gelatine d'origine porcine" -- pas
"Ne mangez pas ce produit".

---

## Le test islamique

Avant chaque fonctionnalite significative, nous posons trois questions :

1. **Test de la Niyyah :** Cette fonctionnalite sert-elle l'utilisateur
   ou nos metriques ? Si la reponse est "nos metriques", nous ne la
   construisons pas.

2. **Test de l'Amanah (confiance) :** Si nos utilisateurs voyaient
   exactement comment cette fonctionnalite fonctionne en coulisses,
   nous feraient-ils toujours confiance ? Si non, nous la reconcevoir.

3. **Test de l'Ihsan (excellence) :** Cette fonctionnalite est-elle la
   meilleure version que nous puissions produire avec nos ressources
   actuelles ? Si non, nous iterons avant de livrer.

---

## Ce que nous refusons de devenir

### Pas une autorite religieuse

Naqiy n'emet pas de fatwas. Nous agregeone des donnees publiques
(OpenFoodFacts), une base d'additifs documentee avec references
savantes (`scholarly_reference` dans la table `additive_madhab_rulings`),
et des avis d'ecoles juridiques etablies. Nous synthetisons et
presentons. Nous ne tranchons pas.

### Pas un outil de surveillance

Les donnees de scan sont des donnees de pratique religieuse. Elles sont
traitees avec le meme niveau de sensibilite que des donnees medicales.
Le champ `subscriptionExternalId` est explicitement exclu des requetes
publiques via `safeUserColumns`. Le leaderboard anonymise les IDs via
un hash SHA-256 tronque (`hashUserId()` dans `loyalty.ts`).

### Pas une machine a engagement

Nos metriques de succes ne sont pas le DAU, le temps passe dans l'app,
ou le nombre de notifications ouvertes. Notre metrique principale est :
**l'utilisateur a-t-il obtenu la reponse a sa question en moins de
3 secondes ?** Le scan, le verdict, la confiance. Fait. Au revoir.

### Pas un mur entre communautes

Naqiy est concu pour les musulmans francais mais son code, ses donnees
et son architecture sont universels. Un utilisateur juif qui veut
verifier la casherout d'un additif trouvera la meme rigueur
informationnelle. L'app est traduite en trois langues. La table
`additives` contient des colonnes `name_fr`, `name_en`, `name_ar`.

---

## Le contexte du marche francais

### La demographie

La France compte entre 5 et 6 millions de musulmans, soit la plus
grande communaute musulmane d'Europe occidentale. Notre cible primaire :
20-45 ans, urbains, connectes, soucieux de leur alimentation. Ils font
leurs courses au supermarche (pas exclusivement en boucherie halal),
et n'ont pas le temps de dechiffrer les etiquettes E400-E999.

### Le marche du halal en France

Le marche du halal alimentaire en France est estime entre 5 et 7
milliards d'euros annuels. Mais il reste fragmente, opaque, et
souvent polluee par des controverses sur la certification. Les
principaux organismes (AVS, Achahada, ARGML, Mosquee de Paris,
Mosquee de Lyon) ne s'accordent pas toujours. Notre champ
`certifierEnum` dans la table `stores` les reference tous sans
hierarchie.

### La concurrence

Les applications existantes (Scan Halal, Halalcheck, Muslim Pro --
pour sa fonctionnalite limitee de scan) ont en commun :
- Des bases de donnees proprietaires et souvent obsoletes
- Un modele freemium qui bloque l'information essentielle
- Une approche mono-madhab
- Aucune cartographie de commerces
- Un design date

Naqiy se differencie sur chaque axe : base OpenFoodFacts (ouverte),
verite toujours gratuite, quadri-madhab, 212+ commerces PostGIS,
design system gold dark premium.

---

## L'equipe et la methode

### Le protocole "Table Ronde"

Le developpement de Naqiy suit un protocole original baptise "Table
Ronde" : trois intelligences artificielles collaborent en parallele
sous la direction d'un lead technique humain. Claude (CTO lead),
Gemini CLI (reviews et audits), Codex CLI (implementation ciblee).

Ce n'est pas un gadget. C'est une methode de production qui permet a
une equipe de une personne de produire un codebase de 14 routers tRPC,
91+ procedures, 40 ecrans, 22 tests d'integration, et un design system
complet en moins de 3 mois. Le cout d'infrastructure : 60 dollars par
mois (Railway).

### Le refus de la dette technique silencieuse

Naqiy a subi un "Mega Audit" complet en fevrier 2026 : 1069 lignes de
Zustand stores obsoletes supprimees, migration vers tRPC React Query,
eradication de 16 fichiers de couleurs hardcodees, correction de la
securite sur l'endpoint `verifyPurchase`. La dette technique n'est pas
"pour plus tard" -- elle est traitee comme un bug.

---

## Le contrat moral avec l'utilisateur

Quand un utilisateur installe Naqiy, nous lui faisons implicitement
six promesses :

1. **Tu ne paieras jamais pour savoir si un produit est halal.**
2. **Nous ne te jugerons pas pour tes choix alimentaires.**
3. **Quand nous ne savons pas, nous te le dirons.**
4. **Tes donnees de pratique religieuse ne seront jamais vendues.**
5. **Nous respecterons ta sensibilite juridique (madhab).**
6. **Nous ne manipulerons jamais tes emotions pour te faire revenir.**

Ce chapitre est notre maniere de rendre ces promesses ecrites,
publiques, et contraignantes.

Bismillah. La Niyyah est posee.

---

*Document interne Naqiy -- Version 1.0 -- Fevrier 2026*
*Classification : Strategique -- Diffusion restreinte*
