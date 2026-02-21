# 03 — Al-Taqwa : Psychologie et Ethique du Design

> "Ittaqi Allaha haythuma kunt"
> — Crains Allah ou que tu sois. (Hadith rapporte par At-Tirmidhi)

---

## La Frontiere entre Aide et Manipulation

Chaque app mobile utilise la psychologie pour engager. La difference entre Optimus Halal et une app classique est **l'intention derriere l'engagement** :

| App classique | Optimus Halal |
|---------------|---------------|
| Engagement = temps passe dans l'app | Engagement = nombre de decisions eclairees |
| Retention = habitude irreflechie | Retention = besoin reel recurrent (courses = hebdomadaire) |
| Monetisation = attention capturee | Monetisation = valeur delivree |
| Dark patterns = tactiques normales | Dark patterns = haram pur et simple |

La taqwa (conscience d'Allah) est le filtre ultime : **si une technique de design exploite une faiblesse humaine plutot que de servir un besoin reel, elle est interdite.**

---

## 1. Les Ressorts Psychologiques Legitimes

### 1.1 Le Doute Halal — Trigger Interne Principal

Le doute face a un produit ("est-ce halal ?") est le trigger interne le plus puissant de l'app. Ce doute est **naturel et sain** — c'est l'expression de la taqwa du musulman qui veut pratiquer sa foi correctement.

**Ce qu'on fait** : On resout ce doute avec une reponse claire, sourcee, personnalisee.
**Ce qu'on ne fait PAS** : On ne genere pas artificiellement du doute. Pas de notifications "Saviez-vous que votre produit prefere est douteux ?" pour forcer l'ouverture de l'app.

### 1.2 La Responsabilite Parentale

Un parent qui scanne un gouter pour ses enfants agit par amour et protection. Ce ressort est extremement puissant — le profil permet de cocher `hasChildren: true` et `isPregnant: true` pour activer des alertes specifiques.

**Ce qu'on fait** : On fournit des alertes pertinentes et calibrees ("Cet additif est deconseille pendant la grossesse selon l'ANSES").
**Ce qu'on ne fait PAS** : On ne joue pas sur la culpabilite parentale. Pas de messages alarmistes ("Vous avez donne ceci a votre enfant !").

### 1.3 Le Besoin de Controle

Face a l'opacite de l'industrie alimentaire, l'utilisateur cherche a reprendre le controle. Scanner un produit donne un sentiment de maitrise — c'est therapeutique.

**Ce qu'on fait** : On maximise ce sentiment avec des informations detaillees, un historique de scans, des statistiques personnelles ("Vous avez scanne 42 produits, dont 89% halal").
**Ce qu'on ne fait PAS** : On ne cree pas de dependance. L'objectif est que l'utilisateur apprenne a lire les etiquettes lui-meme.

---

## 2. Les Dark Patterns Interdits

### Liste Noire — Techniques Bannies de l'App

| Dark Pattern | Description | Pourquoi c'est interdit | Equivalent islamique |
|-------------|-------------|------------------------|---------------------|
| **Faux sentiment d'urgence** | "Offre premium -50% expire dans 2h !" | Manipule la peur de la perte | Gharar (tromperie) |
| **Confirmshaming** | "Non merci, je ne veux pas proteger ma famille" | Exploite la culpabilite | Ikrah (contrainte morale) |
| **Notifications anxiogenes** | "ALERTE : Produit dangereux detecte !" (alors que c'est juste "douteux") | Genere de la peur injustifiee | Iftira' (exageration) |
| **Infinite scroll addictif** | Feed sans fin de contenu pour maximiser le temps passe | Vole le temps de l'utilisateur | Israf (gaspillage) |
| **Metriques de comparaison** | "Vous etes dans les 10% les moins actifs" | Exploite le statut social | Hasad (envie) |
| **Streak punitive** | "Vous avez perdu votre streak de 30 jours !" (avec culpabilisation) | Transforme une bonne habitude en obsession | Waswas (obsession) |
| **Paywall sur la verite** | "Le statut halal de ce produit est reserve aux membres Premium" | Monetise ce qui devrait etre gratuit | Katm al-ilm (cacher le savoir) |
| **Faux social proof** | "1000 personnes ont scanne ce produit aujourd'hui !" (nombre gonfle) | Manipulation statistique | Kadhib (mensonge) |

### Le Test Anti-Dark-Pattern

Avant chaque feature d'engagement, appliquer ce test en 3 questions :

1. **Est-ce que l'utilisateur serait content d'apprendre comment ca marche ?**
   - Si on lui expliquait "on vous envoie cette notification parce que..." et qu'il serait decu → c'est un dark pattern.

2. **Est-ce que ca marcherait aussi bien en etant transparent ?**
   - Si le mecanisme necessite d'etre cache pour etre efficace → c'est un dark pattern.

3. **Est-ce que ca aide l'utilisateur ou est-ce que ca aide uniquement nos metriques ?**
   - Si ca augmente le temps passe sans augmenter la valeur recue → c'est un dark pattern.

---

## 3. La Gamification — Ijtihad sur les Recompenses

Notre systeme de gamification est complet : niveaux, XP, achievements, streaks, points, rewards. C'est un outil puissant qui peut etre utilise pour le bien ou pour le mal.

### Ce qui est en place

```
XP Sources:
  - Scan produit : +10 XP (first scan of day: +5 bonus)
  - Scan nouveau produit : +15 XP
  - Contribution (ajout produit) : +25 XP
  - Streak bonus : +15 a +1000 XP selon le milestone

Niveaux: 1 a ∞ (XP croissant par niveau)

Streaks:
  - Jours consecutifs de scan
  - Milestones : 3j (+15 XP), 7j (+30), 14j (+50), 30j (+100), 60j (+200), 100j (+500), 365j (+1000)
  - Streak Freeze : max 3, coute 50 points, protege 1-3 jours manques

Achievements: definis dans la table `achievements`
Rewards: definis dans la table `rewards`
```

### L'Ethique de la Gamification en Islam

| Question | Notre Position |
|----------|---------------|
| **Les streaks sont-ils une bida'ah ?** | Non. Encourager la regularite dans une bonne action (verifier ce qu'on mange) est conforme au hadith "Les actes les plus aimes d'Allah sont les plus reguliers, meme s'ils sont peu nombreux." Le streak est un outil, pas une obligation religieuse. |
| **Les points/XP trivialisent-ils le halal ?** | Risque reel. Les points recompensent l'**effort de verification**, pas le statut du produit. On ne gagne pas plus de points pour un produit halal que pour un produit haram scanne. L'acte recompense est la curiosite, pas le resultat. |
| **Le leaderboard genere-t-il du riya' (ostentation) ?** | Risque reel. Le leaderboard est **desactive par defaut** (`gamificationEnabled: false` dans les feature flags). Quand il sera active, il sera opt-in et anonymisable. |
| **Le streak freeze est-il ethique ?** | Oui. Il evite la frustration injuste (maladie, voyage, oubli). Max 3 freezes, cout en points = choix delibere. Ca desamorce l'aspect punitif du streak. |

### Garde-fous implementes

1. **Pas de comparaison directe** : Le profil montre MES stats, pas celles des autres (sauf leaderboard opt-in)
2. **Pas de perte visible** : Le streak qui se brise n'affiche pas "-30 jours perdus !" mais "Nouveau depart !"
3. **Pas de notifications de streak anxiogenes** : Pas de "Votre streak de 7 jours se termine ce soir !!" a minuit
4. **Les recompenses sont fonctionnelles** : Themes premium, badges, pas de ressources consommables qui creent de la rarete artificielle

---

## 4. L'Equilibre Scan ↔ Map — Anxiete ↔ Serenite

C'est l'insight psychologique le plus important du produit, correctement identifie par GPT-5.2 :

### Le Scan genere de l'anxiete (necessaire)

```
Scanner un produit → Suspense (350ms d'analyse) → Verdict
                                                     │
                                          ┌──────────┼──────────┐
                                          │          │          │
                                        HALAL     DOUBTFUL    HARAM
                                        (vert)    (orange)    (rouge)
                                        Relief    Inconfort   Choc
                                        Haptic:   Haptic:     Haptic:
                                        Success   Warning     Error
```

L'anxiete pre-verdict est **legitime** — elle reflete le doute reel du musulman. La resolution post-verdict (surtout "halal") genere du soulagement, qui est physiologiquement recompensant (liberation de cortisol).

### La Map genere de la serenite (necessaire)

```
Ouvrir la carte → Explorer les commerces halal → Decouvrir
                                                     │
                                          ┌──────────┼──────────┐
                                          │          │          │
                                      Boucherie   Restaurant  Epicerie
                                      certifiee   note 4.5/5  de quartier
                                      (confiance) (envie)     (proximite)
                                      Dopamine    Dopamine    Dopamine
                                      d'exploration
```

La carte est l'antidote de l'anxiete du scan. Elle montre que le halal existe, qu'il est accessible, qu'il y a des gens de confiance autour de soi. C'est un acte de **tafaul** (optimisme) face au pessimisme que pourrait generer une serie de scans "douteux".

### L'Equilibre dans la Navigation

```
Tab 1: Home     → Vue d'ensemble (neutre)
Tab 2: Scanner  → Action (anxiete productive → resolution)
Tab 3: Map      → Exploration (serenite, decouverte)
Tab 4: Favoris  → Collection (maitrise, organisation)
Tab 5: Profil   → Identite (progression, personnalisation)
```

L'alternance entre Scanner (tab 2) et Map (tab 3) est **deliberee**. Dans la barre de navigation, ils sont cote a cote. Un utilisateur qui enchaine 3 scans "douteux" et se sent frustre peut naturellement glisser vers la carte et decouvrir des commerces certifies autour de lui.

---

## 5. L'Onboarding — Le Premier Contact Compte

### Etat actuel

L'onboarding est **minimaliste** : login/signup → home. L'utilisateur est lache dans l'app sans contexte.

### Ce qui manque (et pourquoi c'est crucial psychologiquement)

1. **Le choix du madhab des le depart** : Ce choix personnalise le moteur de verdicts. Ne pas le demander = donner des reponses generiques = perdre la confiance.

2. **Le premier scan guide** : L'utilisateur devrait scanner un produit connu (ex: "Scannez le Nutella pour voir comment ca marche"). Le premier scan est le moment de verite — s'il est fluide et informatif, l'utilisateur est accroche.

3. **La promesse explicite** : "Nous ne jugeons pas. Nous informons. Vous decidez." Cette phrase devrait apparaitre dans l'onboarding.

4. **Le profil sante** : `isPregnant`, `hasChildren`, `allergens` — ces informations transforment un scanner generique en assistant personnalise. Les demander tot = montrer qu'on se soucie.

---

## 6. Le Risque de Scrupulosite (Al-Waswas)

### Le Danger

L'application peut, involontairement, transformer un musulman serein en obsessionnel. Si chaque produit genere du doute, si chaque additif est suspect, si chaque certification est questionnee — l'utilisateur peut developper une forme d'anxiete alimentaire religieuse (waswas).

### Les Signes

- L'utilisateur scanne 20+ produits par jour (utilisation compulsive)
- Il abandonne des produits clairement halal par exces de prudence
- Il envoie des signalements multiples pour des cas non litigieux
- Il partage des captures d'ecran alarmistes hors contexte

### Notre Responsabilite

1. **Hierarchiser les niveaux de certitude** : Un "doubtful" a 35% de confiance ≠ un "doubtful" a 85%. Le score visuel et les couleurs doivent refleter cette gradation.

2. **Proposer des alternatives, pas des impasses** : Chaque ecran negatif doit offrir une sortie positive ("Vous cherchez une alternative certifiee ? En voici 3.")

3. **Encourager la moderation** : Le hadith sur les choses ambigues dit "celui qui s'en ecarte" — il ne dit pas "celui qui panique". Notre ton doit etre calme, informatif, jamais alarmiste.

4. **Desamorcer l'obsession statistique** : Ne pas mettre en avant "Vous avez evite 47 produits douteux ce mois-ci" — ca valorise l'evitement au lieu de la sérénité.

> La taqwa est une conscience sereine d'Allah, pas une anxiete permanente. Si notre app genere plus de waswas que de sakina (serenite), nous avons echoue — meme si les metriques d'engagement sont excellentes.
