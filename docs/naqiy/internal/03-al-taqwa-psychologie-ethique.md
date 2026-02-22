# Al-Taqwa (التقوى) -- Psychologie et Ethique du Design

> *"La taqwa, c'est ici", et il pointa trois fois son coeur.*
> -- Hadith rapporte par Muslim, d'apres Abu Hurayra (ra)

---

## La conscience comme design principle

La Taqwa est souvent traduite par "crainte de Dieu" mais sa
signification est plus subtile : c'est la conscience vigilante,
l'attention permanente a la justesse de ses actes. Dans le contexte
de Naqiy, la Taqwa guide notre psychologie du design : chaque ecran,
chaque interaction, chaque micro-animation est concue avec la
conscience de son impact emotionnel sur l'utilisateur.

Nous ne construisons pas une app "engageante". Nous construisons
une app "juste". La difference est fondamentale : l'engagement
mesure le temps passe dans l'app, la justesse mesure la qualite de
la reponse obtenue. Notre metrique ideale est un temps d'utilisation
court et un niveau de satisfaction haut.

---

## La dualite anxiete-serenite

### Le scan : un moment d'anxiete

Soyons honnetes : scanner un produit est un acte d'anxiete. Le
geste dit : "Je ne sais pas si ce produit est conforme a ma foi."
Ce doute est intime, personnel, et parfois source de honte
("je devrais savoir"). Naqiy n'a pas cree cette anxiete -- elle
preexiste dans la complexite du systeme alimentaire industriel.
Mais nous avons la responsabilite de ne pas l'amplifier.

**Ce que nous faisons :**
- Le verdict arrive en moins de 3 secondes. L'attente augmente
  l'anxiete.
- Le resultat est presente avec un halo de couleur (vert/orange/
  rouge/gris) avant meme que le texte soit lu. Le cerveau decode
  la couleur 60 000 fois plus vite que le texte.
- L'explication accompagne toujours le verdict. "Haram" seul est
  violent. "Haram -- contient de la gelatine d'origine porcine
  (E441)" est informatif.
- Le score de confiance est visible. "Haram (confiance 90%)" est
  plus respectueux que "HARAM" en majuscules rouges.

**Ce que nous ne faisons JAMAIS :**
- Afficher un ecran d'alerte plein ecran rouge
- Utiliser des sons anxiogenes
- Suggerer que l'utilisateur a "echoue" moralement
- Compter les produits haram scannes comme un "score negatif"

### La carte : un espace de serenite

A l'oppose du scanner, la carte (`app/(tabs)/map.tsx`) est concue
comme un espace de calme. Decouvrir un commerce halal pres de chez
soi est un moment positif. Le design de la carte exploite cette
positivite :

- Les marqueurs de commerces sont des cercles colores par type
  (boucherie rouge, restaurant orange, supermarche bleu, boulangerie
  doree) -- des couleurs vives sur fond de carte sombre.
- Le bottom sheet de detail glisse doucement avec un spring amorti
  (`springNaqiy` : damping 14, stiffness 170, mass 0.9).
- Les filtres sont des chips tactiles, pas des menus complexes.
- La recherche "dans cette zone" recharge silencieusement les
  marqueurs sans animation brusque.

La carte dit : "Tu n'es pas seul. Il y a 212+ commerces qui te
servent." C'est un message d'appartenance, pas de suspicion.

---

## Les dark patterns interdits : inventaire commente

Un dark pattern est un choix de design qui sert les interets du
produit au detriment de l'utilisateur. Voici notre liste noire
exhaustive, avec les raisons de chaque interdiction :

### 1. Compteur de scans restants (INTERDIT)

**Description :** "Il vous reste 3 scans gratuits cette semaine.
Passez a Naqiy+ pour des scans illimites."

**Pourquoi c'est interdit :** Cree une rarete artificielle sur
une information qui doit etre gratuite (Principe 1). Transforme
chaque scan en anxiete de consommation d'un "credit". L'utilisateur
hesite a scanner, ce qui est l'exact inverse de notre mission.

**Dans le code :** La procedure `scan.scanBarcode` ne verifie
jamais `subscriptionTier`. Zero condition, zero compteur.

### 2. Upsell apres scan haram (INTERDIT)

**Description :** L'utilisateur decouvre qu'un produit est haram.
Pop-up : "Avec Naqiy+, trouvez des alternatives halal !"

**Pourquoi c'est interdit :** Exploite un moment de vulnerabilite
emotionnelle. L'utilisateur vient d'apprendre une mauvaise nouvelle
sur sa nourriture -- monetiser cet instant est predateur.

**Alternative Naqiy :** Les alternatives sont gratuites et integrees
directement dans l'ecran `scan-result.tsx` sans aucune mention
premium. La connexion marketplace est un lien vers des produits
halal certifies, pas un upsell.

### 3. Streak break culpabilisant (INTERDIT)

**Description :** "Vous avez brise votre serie de 14 jours !
Vous perdez vos progres."

**Pourquoi c'est interdit :** Transforme la pratique religieuse en
jeu addictif. Le streak est un mecanisme de motivation, pas de
culpabilisation. Briser une serie ne devrait jamais etre presente
comme un echec moral.

**Implementation Naqiy :** Le streak freeze existe justement pour
adoucir les ruptures. 50 points pour un gel, protection de 1 a 3
jours manques. Le message en cas de rupture est neutre :
"Nouvelle serie ! Continuez a scanner." Pas de "Vous avez perdu
X jours."

### 4. Notifications de peur (INTERDIT)

**Description :** "ALERTE : Vous avez scanne un produit haram
hier ! Verifiez votre alimentation."

**Pourquoi c'est interdit :** C'est du harcelement psychologique
deguise en service. Les notifications push de Naqiy concernent :
des nouveaux articles, des mises a jour de la base d'additifs, des
milestones atteints. Jamais des rappels de "mauvais" scans.

### 5. Paywall sur le verdict (INTERDIT)

**Description :** "Ce produit contient des ingredients sensibles.
Passez a Naqiy+ pour voir le detail."

**Pourquoi c'est interdit :** Viole le Principe 1 et constitue une
extorsion informationnelle sur une question religieuse.

### 6. Opt-out par defaut (INTERDIT)

**Description :** Toutes les notifications activees a l'inscription,
partage de donnees active par defaut.

**Pourquoi c'est interdit :** Le consentement eclaire exige un
opt-in. Le champ `notificationEnabled` est `true` par defaut dans
le schema (a corriger -- tech debt identifiee), mais les push
notifications eux-memes necessitent un consentement systeme explicite.

### 7. Faux compte a rebours (INTERDIT)

**Description :** "Offre Naqiy+ a -50% ! Plus que 2h47 !"

**Pourquoi c'est interdit :** Urgence artificielle. L'abonnement
est toujours disponible au meme prix. Pas de ventes flash, pas de
promotions temporaires fictives.

### 8. Comparaison sociale negative (INTERDIT)

**Description :** "Ahmed a un meilleur score halal que vous cette
semaine."

**Pourquoi c'est interdit :** La pratique religieuse n'est pas une
competition. Le leaderboard de Naqiy est base sur les XP (engagement
general), pas sur la "qualite" des scans. Les IDs sont anonymises.
Personne ne peut identifier un autre utilisateur.

### 9. Infinite scroll sans fin (INTERDIT)

**Description :** Un flux de contenu sans fin pour maximiser le
temps passe.

**Pourquoi c'est interdit :** L'historique de scans et les articles
utilisent de la pagination discrete (cursor-based). L'utilisateur
voit clairement quand il a atteint la fin. Pas d'auto-load
infini.

### 10. Revente de donnees (INTERDIT)

**Description :** Vendre les donnees de scan a des marques ou des
annonceurs halal.

**Pourquoi c'est interdit :** Les scans halal sont des donnees de
pratique religieuse -- categorie la plus sensible au sens du RGPD.
Elles ne quittent jamais nos serveurs. PostHog est configure avec
des evenements anonymises, sans contenu de scan.

---

## Gamification ethique

### Le dilemme

La gamification (streaks, XP, niveaux, badges) est un outil
puissant. Mal utilisee, elle cree de la dependance. Bien utilisee,
elle motive des comportements vertueux. La question n'est pas
"faut-il gamifier ?" mais "comment gamifier sans exploiter ?".

### Les regles de la gamification Naqiy

**Regle 1 : Recompenser l'action, pas la frequence.**
Les XP sont gagnes par scan (10 XP/scan), review (20 XP), report
(15 XP), et referral. Le systeme recompense la contribution, pas
la connexion quotidienne vide. Il n'y a pas de "bonus de connexion"
qui donnerait des XP juste pour ouvrir l'app.

**Regle 2 : Le streak est protege, pas puni.**
Le streak freeze (max 3, 50 points chacun) est un mecanisme de
compassion. Il reconnait que la vie reelle est imprevisible.
L'utilisateur ne perd pas tout pour un weekend sans scan.

**Regle 3 : Les milestones sont des celebrants, pas des pressions.**
Le milestone a 3 jours (15 XP bonus) est une tape dans le dos.
Le milestone a 365 jours (1000 XP) est une celebration. Aucun
milestone ne genere de notification pressante avant d'etre atteint.

**Regle 4 : Le leaderboard est opt-in et anonyme.**
Le classement est accessible dans `settings/leaderboard.tsx`. Il
montre des pseudo-IDs hashes (16 caracteres de SHA-256). Personne
ne peut identifier un autre joueur. Le classement n'est pas affiche
sur l'ecran d'accueil -- il faut le chercher.

**Regle 5 : Les recompenses sont tangibles.**
Le systeme de rewards dans `loyalty.ts` permet d'echanger des
points contre des recompenses reelles (bons de reduction chez des
commercants partenaires, acces premium temporaire). Ce n'est pas
un jeu vide -- les points ont une valeur concrete.

### La psychologie du niveau

Les 10 niveaux suivent une courbe non-lineaire :

```
Niveau  1: 0 XP      (gratuit)
Niveau  2: 100 XP    (10 scans)
Niveau  3: 300 XP    (20 scans supplementaires)
Niveau  4: 600 XP    (30 scans supplementaires)
Niveau  5: 1000 XP   (40 scans supplementaires)
...
Niveau 10: 10000 XP  (~400+ scans cumules, ~1 an d'usage actif)
```

La progression ralentit volontairement. Les premiers niveaux sont
rapides (gratification immediate), les derniers sont lents
(engagement de long terme). C'est une courbe logarithmique, pas
exponentielle -- nous ne cherchons pas a rendre les derniers niveaux
impossibles pour frustrer.

Le `LevelUpCelebration` component (`src/components/ui/LevelUpCelebration.tsx`)
affiche une animation springBouncy avec confettis dores quand
l'utilisateur change de niveau. C'est un moment de joie pure,
sans incitation commerciale.

---

## Le nom comme design

### Naqiy : la purete comme promesse psychologique

Le choix du nom "Naqiy" n'est pas seulement semantique -- il est
psychologique. Le mot arabe evoque :

- **La purete** (tahara) : le produit que vous consommez
- **La limpidite** (safa) : l'information que vous recevez
- **La transparence** (shafafiyya) : notre methode

En psychologie du branding, un nom court (4 lettres), sonore,
et porteur de sens positif cree un ancrage emotionnel immediat.
"Naqiy" se prononce de la meme maniere en francais, en anglais,
et en arabe. Il est universel par design.

Le tagline "Ton halal, en toute clarte" renforce l'ancrage :
- "Ton" : personnalisation, respect de l'individu
- "halal" : le domaine, directement
- "en toute clarte" : la promesse, sans ambiguite

### Le contraste avec la concurrence

Les noms concurrents ("Scan Halal", "Halalcheck", "Muslim Pro")
sont fonctionnels mais froids. Ils decrivent ce qu'ils font, pas
ce qu'ils apportent. "Naqiy" decrit ce que l'utilisateur ressent :
la purete, la tranquillite d'esprit, la clarte.

---

## Psychologie des couleurs : le gold dark theme

### Le choix du dark mode comme defaut

Le dark mode n'est pas un choix esthetique -- c'est un choix
psychologique. L'app est principalement utilisee dans deux contextes :

1. **En supermarche** : eclairage au neon, fatigue visuelle. Le
   dark mode reduit l'eblouissement et la fatigue.
2. **Le soir** : planification des courses, lecture d'articles.
   Le dark mode reduit la lumiere bleue.

Le dark mode Naqiy n'est pas un theme secondaire. C'est le theme
de reference, optimise en premier.

### La palette anthracite-or

| Element      | Couleur        | Justification psychologique           |
|--------------|----------------|--------------------------------------|
| Fond         | `#0C0C0C`      | Profondeur, luxe, calme              |
| Carte        | `#1A1A1A`      | Elevation subtile, lisibilite        |
| Or accent    | `#D4AF37`      | Premium, confiance, tradition        |
| Texte        | `#FFFFFF`      | Contraste maximum, lisibilite        |
| Secondaire   | `#A0A0A0`      | Hierarchie claire, repos visuel      |
| Bordures     | `rgba(207,165,51,0.15)` | Or subtil, coherence         |

**L'or (#D4AF37) :** En psychologie des couleurs, l'or evoque :
- La valeur et la confiance (heritage de l'or monetaire)
- Le sacre et le spirituel (dorures des mosquees)
- L'excellence et la qualite (medaille d'or)

Ce n'est pas un choix arbitraire : l'or est la couleur du halal
premium. Il est utilise pour les accents de gamification (streaks,
badges, niveaux), les bordures de cartes, les ombres en dark mode.
Les `darkShadows.card` utilisent `gold[900]` comme couleur d'ombre,
creant un halo dore subtil sous chaque carte.

### Le vert (#13ec6a) : confiance et vitalite

Le vert primaire est reserve au halal confirmé, aux CTAs, et aux
indicateurs positifs. Son intensite electrique (`#13ec6a`, pas un
vert sauge terne) communique l'energie et la vitalite. C'est le
vert des feux de signalisation : avancez, c'est bon.

### Les couleurs de statut halal

| Statut     | Couleur     | Psychologie                          |
|------------|-------------|--------------------------------------|
| Halal      | `#22c55e`   | Vert : securite, approbation         |
| Haram      | `#ef4444`   | Rouge : arret, interdiction claire   |
| Douteux    | `#f97316`   | Orange : prudence, attention         |
| Inconnu    | `#6b7280`   | Gris : absence d'info, neutralite    |

Ces couleurs sont les memes en light et dark mode. C'est un choix
delibere : le statut halal d'un produit ne doit pas changer de
"feeling" selon le theme. Rouge reste rouge. Vert reste vert.

---

## Anti-patterns emotionnels evites

### Le syndrome de l'inspecteur

Risque : L'utilisateur se sent comme un "inspecteur halal" qui
traque les produits haram. Cela cree une relation antagoniste avec
la nourriture.

Solution Naqiy : Le vocabulaire est informatif, pas accusatoire.
"Ce produit contient..." et non "Ce produit est interdit". Les
alternatives sont suggerees, pas imposees.

### La paralysie du choix

Risque : Trop d'informations (additifs, madhabs, scores,
allergenes) paralysent la decision.

Solution Naqiy : Le verdict principal est un mot + une couleur.
Les details sont dans des sections depliables. L'information est
en couches : headline --> resume --> detail --> references savantes.

### L'effet de surveillance

Risque : L'historique de scans donne l'impression d'etre surveille
dans ses choix alimentaires.

Solution Naqiy : L'historique est dans `settings/scan-history.tsx`,
pas sur l'ecran d'accueil. Il n'y a pas de "resume hebdomadaire
de vos scans haram". Les donnees sont presentees comme un outil
personnel, pas comme un dossier de compliance.

---

## Le test de Taqwa

Avant chaque decision de design, nous appliquons le test de Taqwa :

*Si cet ecran etait montre a un juriste islamique, un psychologue
clinicien, et une mere de famille de Montreuil, est-ce que les
trois le valideraient ?*

Le juriste verifie la rigueur informationnelle. Le psychologue
verifie l'absence de manipulation. La mere de famille verifie
l'utilite concrete. Si l'un des trois dit non, on recommence.

---

*Document interne Naqiy -- Version 1.0 -- Fevrier 2026*
*Classification : Strategique -- Diffusion restreinte*
