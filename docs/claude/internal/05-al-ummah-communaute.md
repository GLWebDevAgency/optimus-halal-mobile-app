# 05 — Al-Ummah : La Communaute

> "Les croyants, dans leur affection mutuelle, leur misericorde et leur compassion, sont comme un seul corps."
> — Hadith rapporte par Al-Bukhari et Muslim

---

## Pourquoi la Communaute Est au Coeur du Produit

Optimus Halal n'est PAS un outil individuel. C'est un **bien commun numerique**. Chaque scan enrichit la base de donnees pour tous. Chaque signalement protege la communaute. Chaque avis aide un frere ou une soeur a mieux choisir.

Le musulman qui fait ses courses est seul devant le rayon — mais avec Optimus Halal, il a derriere lui une communaute entiere qui a deja verifie, qui a deja signale, qui a deja note.

---

## 1. Les Mecanismes Communautaires Existants

### 1.1 Le Signalement (Reports)

Le systeme de reports est le premier pilier communautaire :

```
Types de signalements :
├── incorrect_halal_status → "Le statut affiché ne correspond pas à la réalité"
├── wrong_ingredients     → "Les ingrédients sont erronés"
├── missing_product       → "Produit introuvable dans la base"
├── store_issue          → "Problème avec un commerce"
└── other                → Catch-all
```

**Specifications** :
- Titre : 5-255 caracteres (assez pour etre descriptif, pas assez pour un roman)
- Description : 10-2000 caracteres (force l'argumentation, limite le spam)
- Photos : max 5 URLs (preuves visuelles = credibilite)
- Lie au produit ET/OU au commerce (flexibilite du contexte)

**Ce qui marche** : Le signalement est simple, rapide, et recompense par XP (+25 pour une contribution).

**Ce qui manque** :
- Pas de systeme de verification des signalements (moderation)
- Pas de feedback au signaleur ("Votre signalement a ete traite")
- Pas de scoring de fiabilite des signaleurs (un premier utilisateur ≠ un veteran de 200 scans)

### 1.2 Les Avis (Reviews)

Les avis enrichissent les produits et les commerces :

- Note : 1-5 etoiles
- Commentaire : max 2000 caracteres (optionnel)
- Photos : max 5
- "Helpful" : vote de pertinence (deduplique par utilisateur)

**Le calcul de la note moyenne** est en transaction :
```sql
INSERT review → SELECT AVG(rating) → UPDATE stores SET averageRating
```

C'est un pattern classique mais correct — la transaction garantit la coherence.

**Ce qui manque** :
- Pas de moderation des avis (risque d'abus : concurrence deloyale entre commerces)
- Pas de reponse du commercant (dialogue unidirectionnel)
- Pas de criteres structures (qualite de la viande, proprete, accueil, prix)

### 1.3 Le Boycott (Engagement Ethique)

Le systeme de boycott est un acte communautaire fort :

- 19 cibles de boycott avec raisons documentees
- Source : decisions communautaires, pas editoriales
- Router `boycott` avec 3 procedures (list, getByProduct, check)

**Le garde-fou** : Le boycott est INFORMATIF, pas injonctif. L'app montre "Cette marque fait l'objet d'un boycott communautaire pour [raison]" — elle ne dit pas "N'achetez pas."

---

## 2. La Moderation — Le Defi Central

### 2.1 Le Probleme

La communaute musulmane en France est traversee par des tensions reelles :

| Tension | Exemple | Risque pour l'app |
|---------|---------|-------------------|
| **Madhab vs madhab** | "E471 est haram point final" vs "Ca depend de la source" | Commentaires agressifs, signalements contradictoires |
| **Rigorisme vs flexibilite** | "Tout ce qui n'est pas certifie AVS est haram" | Exclusion de commerces valides, polarisation |
| **Politique** | Boycott de marques israeliennes | Instrumentalisation de l'app, risque juridique |
| **Sectarisme** | "Les salafis ne connaissent rien au fiqh" | Communaute toxique, depart des utilisateurs |
| **Concurrence commerciale** | Faux avis negatifs sur un concurrent | Destruction de confiance, poursuites |

### 2.2 Les Principes de Moderation

1. **Neutralite confessionnelle** : L'app presente les avis des 4 madhabs sans hierarchie. Les commentaires qui attaquent un madhab sont supprimes.

2. **Factualite** : Un signalement doit etre verifiable. "Ce produit contient du porc" est factuel. "Ce commerce est geree par des mauvais musulmans" ne l'est pas.

3. **Proportionnalite** : Un premier ecart = avertissement. Recidive = suspension temporaire. Abus systematique = bannissement.

4. **Transparence** : Toute decision de moderation est expliquee a l'utilisateur concerne. Pas de shadow-ban.

### 2.3 Ce Qui N'Existe Pas Encore (Et Qui Est Urgent)

| Fonctionnalite | Priorite | Raison |
|---------------|----------|--------|
| Systeme de moderation des avis | CRITIQUE | Sans moderation, les premiers avis abusifs detruiront la confiance |
| Queue de moderation admin | CRITIQUE | Les signalements s'accumulent sans traitement |
| Scoring de confiance utilisateur | HAUTE | Un veteran de 200 scans a plus de credibilite qu'un nouveau compte |
| Politique de contenu claire | HAUTE | Les utilisateurs doivent savoir les regles avant de contribuer |
| Mecanisme d'appel | MOYENNE | Un utilisateur banni a le droit de contester |

---

## 3. La Contribution — De Consommateur a Gardien

### 3.1 Le Parcours Contributeur

```
Nouveau venu                    Contributeur                    Gardien
─────────────                   ─────────────                   ────────
• Scanne des produits           • Signale des erreurs          • Verifie les signalements
• Consulte les verdicts         • Ajoute des produits manquants • Valide les certifications
• Lit les articles              • Donne des avis               • Propose des corrections de masse
                                • Partage des resultats        • Mentor pour les nouveaux
```

Ce parcours est **naturel** — il se fait par l'usage, pas par une formation. La gamification accompagne cette progression sans la forcer.

### 3.2 XP et Contribution

| Action | XP | Message |
|--------|-----|---------|
| Scan produit | +10 | "Merci pour votre verification" |
| Premier scan du jour | +5 bonus | "Bonne habitude !" |
| Scan nouveau produit | +15 | "Vous enrichissez la base" |
| Signalement | +25 | "La communaute vous remercie" |
| Milestone streak | +15 a +1000 | "Constance recompensee" |

Le XP recompense l'**effort de verification**, pas le resultat. Scanner un produit haram rapporte autant que scanner un produit halal. L'acte vertueux est la curiosite, pas le verdict.

### 3.3 La Gamification Communautaire

**Achievements definis dans la DB** (table `achievements`) :
- Premiers jalons : premier scan, premier signalement, premier favori
- Jalons de volume : 10, 50, 100, 500 scans
- Jalons de streak : 7, 30, 100 jours consecutifs
- Jalons sociaux : premier partage, premier avis

**Rewards** (table `rewards`) :
- Themes visuels premium
- Badges de profil
- Fonctionnalites deblocables

**Le leaderboard** :
- Desactive par defaut (`gamificationEnabled: true` mais leaderboard opt-in)
- Anonymisable (pseudonyme ou nom reel au choix)
- Classe par XP total, pas par scans (evite la compulsivite)
- Pas de "classement des pires" — seulement les meilleurs

---

## 4. Les Controverses — Le Champ de Mines

### 4.1 Le Cas E471

L'additif E471 (mono- et diglycerides d'acides gras) est LE cas d'ecole :

- Peut etre d'origine vegetale (halal) ou animale (possiblement haram)
- Les 4 madhabs divergent sur le verdict quand l'origine est inconnue
- Les certificateurs divergent aussi (AVS strict, Mosquee de Paris plus souple)
- La communaute est TRES divisee sur ce sujet

**Notre position** :
- Afficher "Douteux — L'origine de cet additif est incertaine"
- Montrer les 4 avis des madhabs cote a cote
- Laisser l'utilisateur choisir selon SA position
- NE JAMAIS dire "C'est halal" ou "C'est haram" quand il y a divergence

### 4.2 Le Cas des Certificateurs

Pas tous les certificateurs halal se valent. Certains sont plus rigoureux que d'autres.

**Notre position** :
- Afficher le classement des certificateurs base sur des criteres objectifs (frequence d'audit, processus d'abattage, transparence)
- NE JAMAIS dire "Ce certificateur est mauvais"
- TOUJOURS sourcer les informations
- Permettre a l'utilisateur de filtrer selon SES certificateurs de confiance

Le `certifierRanking` (screen existant dans settings) est concu pour ca.

### 4.3 Le Cas du Boycott

Le boycott de certaines marques est un mouvement communautaire reel avec des implications legales.

**Notre position** :
- Les cibles de boycott sont INFORMATIVES
- La source est toujours citee
- L'app ne prend pas position — elle relaie un fait communautaire
- Le boycott n'affecte PAS le statut halal du produit (un produit peut etre halal ET boycotte)
- Aucun commerce local n'est cible (protege les petits commercants)

### 4.4 Le Cas des "Faux Halal"

Certains produits/commerces affichent "halal" sans certification reelle.

**Notre position** :
- Afficher clairement : "Certifie par [organisme]" vs "Non certifie" vs "Certification non verifiee"
- Le `halalCertified: boolean` dans la table stores est BINAIRE — soit on a verifie la certification, soit non
- Jamais d'accusation ("Ce commerce ment") — seulement des faits ("Aucune certification verificable trouvee")

---

## 5. La Vision Communautaire — Al-Ummah Numerique

### 5.1 Court Terme (V1)

- Signalements fonctionnels mais non moderes
- Avis avec helpful votes
- Boycott informatif
- Partage de resultats de scan (ShareCard visuel)

### 5.2 Moyen Terme (V2)

- Moderation semi-automatique (filtre + queue humaine)
- Scoring de confiance utilisateur
- Reponse des commercants aux avis
- Avis structures (criteres notes individuellement)
- Signalements avec statut de traitement visible

### 5.3 Long Terme (V3)

- Verificateurs communautaires (role "Gardien" avec privileges)
- Contributions validees par consensus (N verificateurs doivent confirmer)
- Programme ambassadeurs locaux (1 par ville, verifie physiquement les commerces)
- API publique pour les donnees communautaires (Open Data halal)

---

## 6. Les Garde-Fous Anti-Toxicite

| Risque | Garde-fou |
|--------|-----------|
| Spam de signalements | Rate limit (5 reports/jour/utilisateur) |
| Faux avis positifs (astroturfing) | Detection de patterns (meme IP, comptes recents, note extreme) |
| Faux avis negatifs (sabotage) | Ponderation par anciennete et scoring de confiance |
| Discours de haine | Filtre de mots + moderation humaine |
| Doxxing de commercants | Interdiction d'informations personnelles dans les avis |
| Spam publicitaire | Detection de liens + bannissement |

---

## La Promesse Ummah

La force de cette app n'est pas son algorithme. C'est **sa communaute**. Chaque utilisateur qui scanne ameliore la base pour tous. Chaque signalement protege les suivants. Chaque avis guide un choix.

Le defi n'est pas technique — il est humain. Construire une communaute saine dans un contexte de diversite d'opinions, c'est un acte de foi autant qu'un acte de produit.

> "Khayr al-nas anfa'uhum li al-nas" — Les meilleurs des gens sont les plus utiles aux gens.
> — Hadith rapporte par Al-Tabarani
