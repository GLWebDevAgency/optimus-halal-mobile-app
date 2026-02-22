# 10 — Al-Mustaqbal (المستقبل) — L'Avenir et les Ouvertures

> "Wa a'iddu lahum ma istata'tum min quwwatin"
> — Preparez contre eux tout ce que vous pouvez comme force. (Coran 8:60)
> (Contexte : se preparer avec excellence pour ce qui vient)

> "Innallaha yuhibbu idha 'amila ahadukum 'amalan an yutqinahu"
> — Allah aime que lorsque l'un d'entre vous fait un travail, il le fasse avec excellence (itqan).
> — Hadith rapporte par al-Bayhaqi

---

## La Graine et l'Arbre

Naqiy V1 est un scanner de produits avec une carte de commerces halal. C'est le **cheval de Troie** — le produit minimum qui resout un probleme reel, gagne la confiance de la communaute, et ouvre la porte a un ecosysteme complet.

La vision complete est un **ecosysteme halal numerique** : scan alimentaire, scan cosmetique, carte de commerces, marketplace curated, module social, education, et expansion internationale. Chaque brique est construite sur la confiance gagnee par la precedente. On ne brule pas les etapes. On ne lance pas une marketplace avant que le scanner ne soit irrreprochable. On ne s'internationalise pas avant que la France ne soit solidement couverte.

Le nom "Naqiy" porte cette vision. La purete ne se limite pas a l'alimentation. Elle s'etend a la cosmetique, au commerce, aux interactions sociales, a l'economie. Chaque extension future est un prolongement naturel de la promesse initiale.

---

## 1. Scanner Cosmetique — "Al-Jamil" (La Beaute)

### 1.1 Le Probleme Non Resolu

Les cosmetiques sont l'angle mort le plus criant du halal en France. La gelatine porcine est omnipresente dans les masques, les rouges a levres, les capsules de complement alimentaire. Le carmin (E120, issu de cochenilles ecrasees) colore la majorite des rouges a levres et des blushs. L'alcool ethylique est le solvant standard des parfums et des cremes. Les tests sur animaux posent question pour certaines ecoles juridiques.

Aucune application sur le marche francais ne couvre correctement ce sujet. Zero. C'est un territoire vierge.

### 1.2 L'Opportunite

| Donnee | Valeur |
|--------|--------|
| Marche cosmetique halal mondial | ~50 milliards USD (croissance 12%/an) |
| Marche cosmetique total en France | ~15 milliards EUR |
| Part halal-conscious parmi les acheteuses francaises musulmanes | Estimee 15-25% |
| Applications de qualite sur ce segment | 0 |

La cible est naturelle : la femme musulmane francaise qui se soucie deja de l'alimentation halal pour sa famille se soucie aussi de ce qu'elle met sur sa peau. Le pas de l'alimentaire au cosmetique est intuitif — c'est la meme question de purete appliquee a un domaine different.

### 1.3 Ce Qui Existe Deja et Qu'on Reutilise

L'architecture de Naqiy est concue pour cette extension :

- **Pipeline de scan barcode** : camera → barcode → API → analyse → verdict. Identique pour l'alimentaire et le cosmetique.
- **Open Beauty Facts** : le pendant cosmetique d'OpenFoodFacts, avec la meme API et la meme philosophie open data.
- **Table `additives`** : extensible pour inclure des ingredients cosmetiques (nomenclature INCI).
- **Table `additiveMadhabRulings`** : les memes divergences entre ecoles s'appliquent aux ingredients cosmetiques.
- **UI de scan result** : adaptable avec un nouveau template visuel pour les cosmetiques.

### 1.4 Ce Qui Est Nouveau

- **Nomenclature INCI** : les ingredients cosmetiques n'utilisent pas les E-numbers mais la nomenclature INCI (International Nomenclature of Cosmetic Ingredients). Il faut un mapping INCI → analyse halal.
- **Criteres specifiques** : tests sur animaux (cruauty-free), alcool comme solvant vs. ingredient actif, derives animaux non alimentaires.
- **Sources de donnees** : Open Beauty Facts, INCI decoder, bases de donnees cruelty-free.
- **Nouveau module onboarding** : "Naqiy scanne aussi tes cosmetiques."

### 1.5 Architecture Proposee

```
Nouveau router: cosmetic.ts
├── scan(barcode) → Open Beauty Facts → analyse INCI
├── analyzeIngredients(inciList) → mapping additifs + rulings
├── getAlternatives(productId, category) → produits halal similaires
├── contribute(barcode, ingredients) → enrichissement communautaire
└── getCosmeticCategories() → maquillage, soin, parfum, hygiene

Nouvelle table: cosmeticProducts
├── id, barcode, name, brand, category
├── ingredients (INCI list)
├── halalStatus, confidenceScore
├── testedOnAnimals (boolean), containsAlcohol (boolean)
├── source, lastVerified
└── createdAt, updatedAt
```

### 1.6 Calendrier

- **Phase 1** (V2, mois 8-10) : Scan basique cosmetique (barcode → Open Beauty Facts → verdict)
- **Phase 2** (V2.5, mois 11-12) : Analyse INCI avancee + alternatives certifiees
- **Phase 3** (V3, mois 13+) : Contributions communautaires + partenariats marques halal cosmetiques

---

## 2. Marketplace Halal — "Al-Suq" (Le Marche)

### 2.1 Le Probleme

Trouver des produits strictement halal en ligne est un parcours du combattant en France :
- Les sites halal sont disperses, mal references, avec une UX generalement mediocre
- Amazon et Carrefour n'ont pas de filtre "halal" fiable
- Les petits producteurs halal n'ont aucune visibilite numerique
- La confiance est impossible sans verification independante

### 2.2 La Vision — Pas un Amazon Halal

La marketplace Naqiy n'est **pas** un Amazon halal. C'est une vitrine **curated** — selectionnee, verifiee, qualitative — ou chaque produit est :
- Verifie halal par Naqiy (certification confirmee, ingredients analyses)
- Note par la communaute (avis reels d'utilisateurs)
- Disponible en livraison ou click-and-collect local

La qualite prime sur la quantite. 500 produits verifies valent mieux que 50 000 produits douteux.

### 2.3 Ce Qui Existe Deja dans le Code

Le code est prepare pour la marketplace. Les ecrans existent mais sont en attente :

```
(marketplace)/
├── cart.tsx          → Panier (UI prete, logique a connecter)
├── catalog.tsx       → Catalogue (UI prete)
├── checkout.tsx      → Paiement (UI prete, integration Stripe a faire)
├── coming-soon.tsx   → Page d'attente actuelle (affichee par defaut)
├── index.tsx         → Accueil marketplace
├── order-tracking.tsx → Suivi commande
└── product/[id].tsx  → Fiche produit
```

Le `coming-soon.tsx` est la page par defaut. Le feature flag `marketplaceEnabled: false` controle la bascule.

### 2.4 Le Modele Economique de la Marketplace

| Source de revenu | Pourcentage | Justification |
|-----------------|-------------|---------------|
| Commission sur vente | 8-12% | Standard marketplace, competitif |
| Abonnement vendeur | 9,90 EUR/mois | Acces au dashboard, analytics, outils de gestion |
| Badge "Verifie Naqiy" | Inclus dans l'abonnement | Differenciation par la confiance |

**Garde-fou** : La commission ne peut JAMAIS affecter le classement, le score de confiance, ou le verdict halal d'un produit. Un produit en vente sur la marketplace a le meme statut halal que n'importe quel produit scanne gratuitement.

### 2.5 Calendrier

- **Phase 1** (V2, mois 10-14) : Catalogue de produits verifies (lecture seule, liens vers les vendeurs externes)
- **Phase 2** (V3, mois 15-18) : Click-and-collect local (partenariat avec commerces existants sur la carte)
- **Phase 3** (V3.5, mois 19-24) : Marketplace complete avec paiement integre (Stripe)

---

## 3. Commerce Trust Scoring — "Al-Islah" (La Reforme)

### 3.1 Le Probleme Structurel du Halal en France

Le halal en France souffre d'un deficit de confiance systematique :
- Certaines certifications sont peu exigeantes (auto-declaration, audits rares ou inexistants)
- Certains commerces affichent "halal" sans aucune verification verifiable
- Il n'existe aucune incitation economique a etre plus rigoureux
- Le consommateur n'a aucun pouvoir de pression organise

Naqiy peut devenir un **levier de pression positive** — pas en punissant les mauvais, mais en recompensant les bons.

### 3.2 Le Trust Score Commerce

Le `relevanceScore` actuel dans la base de donnees prend en compte la distance, la certification, et les avis. L'evolution proposee est un "Trust Score" visible par le consommateur, transparent et explicable.

| Critere | Poids | Source |
|---------|-------|--------|
| Certification par organisme reconnu (AVS, Achahada, etc.) | 35% | Table `certifiers` |
| Note communautaire moyenne | 25% | Table `reviews` |
| Frequence de verification / mise a jour des informations | 15% | Date du dernier audit, fraicheur du profil |
| Reactivite aux signalements | 15% | Temps de reaction aux reports |
| Anciennete et stabilite sur la plateforme | 10% | Date de creation du profil |

Ce score est **public** et **explique**. Le commercant sait exactement comment l'ameliorer. C'est un cercle vertueux : plus un commercant investit dans la qualite, plus son score monte, plus il attire de clients via Naqiy.

### 3.3 Le Programme "Commerce de Confiance"

| Niveau | Criteres | Avantage |
|--------|----------|----------|
| **Bronze** | Profil cree + horaires renseignes | Apparait sur la carte |
| **Argent** | Certification verifiee + > 4.0/5 etoiles | Badge "Verifie" + mise en avant locale |
| **Or** | Certification reconnue + > 4.5/5 + 0 signalement non resolu | Badge "Excellence Naqiy" + partenariat premium |

### 3.4 Calendrier

- **Phase 1** (V1.5, mois 6-8) : Trust Score affiche sur les fiches commerce
- **Phase 2** (V2, mois 9-12) : Programme "Commerce de Confiance" avec badges
- **Phase 3** (V3, mois 13-18) : Partenariats formels avec les organismes de certification

---

## 4. Naqiy Social — Le Reseau Anti-Addiction

### 4.1 Le Vide a Combler

Les commercants et restaurateurs halal en France n'ont pas de vitrine numerique adequate :
- Instagram est generique (pas de filtre halal, pas de certification, pas de carte integree)
- Google Maps n'affiche pas le statut halal
- Les pages Facebook sont mal maintenues et peu credibles
- Il n'existe aucun reseau social dedie a l'ecosysteme halal

### 4.2 La Vision — Un "Instagram Halal" Qui Combat l'Addiction

Naqiy Social est un module integre a l'application — un feed de decouverte locale ou :
- Les restaurateurs postent des photos de leurs plats avec prix, localisation, et certification
- Les commercants montrent leurs nouveaux produits et promotions
- Les utilisateurs partagent des decouvertes halal
- Le scroll est un acte de decouverte utile, pas un trou noir d'addiction

### 4.3 La Difference Fondamentale Avec les Reseaux Sociaux Classiques

| Reseau classique | Naqiy Social |
|-----------------|-------------|
| Feed algorithmique opaque, optimise pour le temps passe | Feed chronologique local (rayon 20km), optimise pour la decouverte |
| Engagement = temps passe = revenus publicitaires | Engagement = decouvertes faites = visites en commerce |
| Likes publics, comparaison sociale, course aux followers | Pas de compteur de likes public, pas de classement d'utilisateurs |
| Stories ephemeres (FOMO : peur de rater quelque chose) | Posts permanents, consultables a tout moment |
| Publicite omnipresente entre les posts | Zero publicite. Les commercants postent eux-memes, naturellement |
| Scroll infini, sans fin, sans friction | Feed pagine — message "Tu as tout vu !" apres 30 posts |
| Notifications pour chaque like, chaque commentaire | Notifications uniquement pour les reponses utiles et les messages directs |

### 4.4 Le Design Anti-Addiction — Un Imperatif Ethique

Un reseau social islamique ne peut pas exploiter les memes mecanismes d'addiction que les reseaux classiques. Ce serait une contradiction fondamentale. L'Islam encourage la moderation (wasatiyya) en toute chose, y compris dans l'usage du numerique.

| Mecanisme | Implementation |
|-----------|---------------|
| **Pas de scroll infini** | Feed pagine, max 30 posts par session, message "Tu as tout vu" |
| **Pas de notifications de likes** | Seules les reponses et les messages directs declenchent une notification |
| **Pas de compteur public** | Les commercants voient leurs statistiques, pas les utilisateurs |
| **Pause naturelle** | Apres 15 minutes d'utilisation continue, message doux |
| **Pas de pull-to-refresh addictif** | Rafraichissement simple, sans animation de slot machine |
| **Pas de dark patterns** | Pas de "Vous avez 5 nouvelles notifications !" en rouge |

### 4.5 Architecture Technique

```
Nouveau router: social.ts
├── getFeed(location, radius, cursor) → posts locaux pagines
├── createPost(type, content, images, location) → publication
├── getProfile(userId | storeId) → profil enrichi
├── follow(targetId) → abonnement
├── reportPost(postId, reason) → signalement de contenu
└── getDiscoverySuggestions(location) → suggestions locales

Nouvelles tables:
├── socialPosts → contenu publie (text, images, location, type)
├── socialFollows → abonnements (followerId, followingId)
├── socialMedia → images/videos uploadees (S3 ou equivalent)
└── socialReports → signalements de contenu
```

### 4.6 Calendrier

- **Phase 1** (V3, mois 18-22) : Profils commerce enrichis (galerie photo, posts, statistiques)
- **Phase 2** (V3.5, mois 22-26) : Feed local de decouverte geographique
- **Phase 3** (V4, mois 26-30) : Module social complet (follow, interactions, messaging)

---

## 5. Expansion Geographique

### 5.1 La Strategie : Cercles Concentriques

L'expansion internationale suit la logique des cercles concentriques : on maitrise le centre (France) avant de s'etendre aux voisins, et on commence par les pays les plus proches culturellement et linguistiquement.

```
Cercle 1 : France (V1-V2)
    │
    ├── Ile-de-France → Lyon → Marseille → Lille → Toulouse → Strasbourg
    │
Cercle 2 : Francophonie europeenne (V3)
    │
    ├── Belgique (Bruxelles, Liege, Charleroi) — 800K musulmans, francophone
    ├── Suisse romande (Geneve, Lausanne) — 400K musulmans, francophone
    │
Cercle 3 : Europe anglophone et germanophone (V4)
    │
    ├── Royaume-Uni (Londres, Birmingham, Manchester) — 4M musulmans, gros marche
    ├── Allemagne (Berlin, Cologne, Francfort) — 5M musulmans, culture halal turque differente
    │
Cercle 4 : Francophonie hors Europe (V5, horizon 3-5 ans)
    │
    ├── Canada (Quebec, Montreal) — 500K musulmans, francophone
    ├── Maghreb (Maroc, Algerie, Tunisie) — usage different, marche emergent
    │
Cercle 5 : Monde (V6, horizon 5-10 ans)
    │
    └── Pays-Bas, Scandinavie, Italie, Espagne
```

### 5.2 Les Defis de l'Expansion

| Defi | Detail | Solution |
|------|--------|----------|
| **Langue** | Traductions necessaires (neerlandais, allemand, anglais) | i18n deja en place (fr, en, ar). Ajouter de/nl. |
| **Donnees locales** | OpenFoodFacts couvre les produits francais, moins les autres pays | Communaute locale + partenariats |
| **Reglementation** | RGPD s'applique dans toute l'UE, mais variations locales | Conformite RGPD de base = couverture UE |
| **Culture halal** | Les turcs d'Allemagne ont des pratiques differentes des maghrebins de France | Etude culturelle avant lancement, adaptation des rulings |
| **Commerces locaux** | Les stores de la carte sont francais | Partenariats locaux, communaute qui ajoute les commerces |
| **Monetisation** | Les prix B2B varient selon les marches | Adapter la grille tarifaire par pays |

### 5.3 Prerequis Avant Expansion

- Taux de resolution > 80% en France
- Retention J30 > 25% en France
- Au moins 200 commerces actifs sur la carte en France
- Base communautaire active (> 5% de taux de contribution)
- Conformite RGPD complete
- Infrastructure qui supporte la charge multi-pays (test de montee en charge)

---

## 6. Technologies Futures

### 6.1 Scanner IA Avance (OCR)

Pour les produits sans barcode — marches, boulangeries, petits producteurs — un scanner base sur la reconnaissance d'image :

- **OCR sur etiquettes** : l'utilisateur photographie la liste d'ingredients, l'IA lit et analyse
- **Reconnaissance de produit** : l'utilisateur photographie le produit, l'IA identifie la marque et le modele
- **Feature flag** : `aiScanner: false` deja prepare dans la configuration

**Technologies envisagees** : Google Cloud Vision, Apple Vision Framework (on-device pour la privacy), ou modele local via ONNX Runtime.

**Calendrier** : Phase exploratoire An 2, lancement An 3 si viable.

### 6.2 API Publique Halal

Partager les donnees halal pour que d'autres applications puissent les utiliser :

- **Vision** : devenir le "OpenFoodFacts du halal" — la reference open data pour les verdicts halal
- **Modele** : gratuit pour les projets open source et non commerciaux, payant pour les entreprises (API key avec limites)
- **Benefice** : positionne Naqiy comme le standard du secteur, genere du revenu supplementaire, renforce l'effet de reseau

### 6.3 Halal Education Platform

- Cours en ligne sur le fiqh alimentaire (partenariats avec des instituts islamiques)
- Mini-articles educatifs dans l'application ("Sais-tu pourquoi le E471 est controverse ?")
- Quiz gamifie sur les connaissances halal (avec XP)
- Certification "Consommateur Halal Eclaire" (badge communautaire)

### 6.4 Intelligence Artificielle pour la Moderation

A mesure que la communaute grandit, la moderation manuelle ne suffira plus. Un systeme d'IA pour :
- Detecter les avis abusifs ou spam
- Identifier les signalements frauduleux
- Reperer les patterns de waswas (usage excessif)
- Suggerer des corrections de verdicts quand de nouvelles donnees emergent

---

## 7. Roadmap Consolidee

```
2026 S1 │ V1.0 — Naqiy : Scanner + Carte + Gamification
         │ Focus : qualite du verdict, retention, communaute de base
         │ Objectif : 10K MAU, retention J30 > 25%
         │
2026 S2 │ V1.5 — Trust Score + Commerce de Confiance
         │ Focus : B2B initial, pression positive sur les commerces
         │ Objectif : 20 commercants payants, MRR > 300 EUR
         │
2027 S1 │ V2.0 — Scanner Cosmetique + Catalogue Marketplace
         │ Focus : extension du scan, monetisation B2C (Naqiy+)
         │ Objectif : 50K MAU, 1000 abonnes Naqiy+, MRR > 5K EUR
         │
2027 S2 │ V2.5 — Click-and-Collect + Moderation Avancee
         │ Focus : transactions reelles, communaute saine a l'echelle
         │ Objectif : 100K MAU, 150 commercants, MRR > 10K EUR
         │
2028 S1 │ V3.0 — Naqiy Social + Expansion Belgique/Suisse
         │ Focus : feed local, effets de reseau, multi-pays francophone
         │ Objectif : 200K MAU (dont 20K hors France), MRR > 30K EUR
         │
2028 S2 │ V3.5 — Marketplace Complete + API Publique
         │ Focus : ecosysteme ouvert, Naqiy comme standard halal numerique
         │ Objectif : 300K MAU, API utilisee par 10+ apps tierces
         │
2029    │ V4.0 — Expansion UK/Allemagne + Scanner IA (OCR)
         │ Focus : internationalisation anglophone/germanophone
         │ Objectif : 500K MAU, presence dans 4 pays
         │
2030    │ V5.0 — La Plateforme Halal de Reference Europeenne
         │ Focus : consolidation, education, certification
         │ Objectif : 1M MAU, equipe de 10+, standard de l'industrie
```

---

## 8. La Vision a 10 Ans

### 8.1 Ce Que Naqiy Peut Devenir

Dans dix ans, si chaque etape est franchie avec excellence et integrite, Naqiy peut etre :

**Pour le consommateur** : L'application de reference pour tout musulman europeen qui veut savoir ce qu'il mange, ce qu'il met sur sa peau, ou il peut acheter halal en confiance, et comment approfondir ses connaissances. Un compagnon de vie quotidienne, pas une app qu'on ouvre une fois et qu'on oublie.

**Pour le commercant** : La plateforme incontournable de visibilite locale halal. Le "Google My Business" du halal, avec une communaute active qui genere du trafic reel en magasin. Un levier economique direct et mesurable.

**Pour l'industrie** : Le standard de certification numerique halal en Europe. La reference que les marques, les certificateurs, et les regulateurs consultent. L'API publique que d'autres applications integrent.

**Pour la communaute** : Un outil d'emancipation collective. La preuve que la technologie peut servir les valeurs islamiques sans les exploiter. Un modele de startup ethique qui inspire d'autres projets.

### 8.2 Ce Que Naqiy Ne Doit Jamais Devenir

- Une application d'addiction deguisee en outil religieux
- Un instrument de division confessionnelle ou communautaire
- Une plateforme ou l'argent influence les verdicts
- Un outil de surveillance ou de profilage des musulmans
- Un projet qui privilegie la croissance sur l'integrite

### 8.3 Le Test du Long Terme

Avant chaque decision strategique, une question :

> "Si je prenais cette decision aujourd'hui, et que les consequences se revelaient dans dix ans, est-ce que j'en serais fier devant ma communaute, devant ma famille, et devant Allah ?"

Si la reponse est oui, on avance. Si la reponse est non, on reconsidere. Si la reponse est "peut-etre", on attend d'avoir plus de clarte.

---

## 9. Le Mot de la Fin — Planter les Graines

L'avenir n'est pas un plan qu'on execute. C'est un jardin qu'on cultive. Les graines sont plantees aujourd'hui — dans le code, dans les principes, dans les choix ethiques, dans la confiance de chaque utilisateur qui ouvre Naqiy et decide de rester.

Certaines graines donneront des arbres magnifiques. D'autres ne germeront pas. Certaines surprises seront bonnes, d'autres difficiles. C'est le qadar — le decret divin — et notre travail n'est pas de le controler mais de planter avec science, avec ethique, avec itqan (excellence), et de faire confiance au Jardinier pour la recolte.

Le mot "naqiy" — pur, limpide, transparent — n'est pas un adjectif qu'on se donne. C'est un ideal qu'on poursuit. A chaque scan, a chaque verdict, a chaque decision, la question est la meme : "Est-ce que c'est naqiy ? Est-ce que c'est pur ?"

Si la reponse est oui, on continue. Si la reponse est non, on corrige. Et on ne s'arrete jamais de poser la question.

---

> Al-Mustaqbal — l'avenir — est entre les mains d'Allah. Notre role est de planter les graines aujourd'hui, avec science, avec ethique, avec excellence. Puis de faire confiance au Jardinier pour la recolte. Naqiy : pur dans ses verdicts, pur dans ses intentions, pur dans son avenir.
