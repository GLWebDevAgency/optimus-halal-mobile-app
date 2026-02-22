# 09 — Al-Qadar (القدر) — Risques et Contingences

> "Ma asabaka min musibatin fa bi-ma kasabat aydikum wa ya'fu 'an kathir"
> — Tout malheur qui vous atteint est du a ce que vos mains ont acquis, et Il pardonne beaucoup. (Coran 42:30)

> "Iqil wa tawakkal" — "Attache ton chameau, puis place ta confiance en Allah."
> — Hadith rapporte par al-Tirmidhi

---

## Anticiper pour Proteger, Pas pour Craindre

La tawakkul — la confiance en Allah — ne signifie pas l'imprevoyance. Le Prophete (paix et salut sur lui) a ordonne d'attacher le chameau d'abord, puis de s'en remettre a Allah. Ce chapitre est notre corde. Il ne s'agit pas de cultiver la peur, mais de dresser l'inventaire lucide de tout ce qui pourrait menacer Naqiy — et de preparer des reponses avant que les menaces ne se manifestent.

Un projet sans plan de contingence n'est pas un projet courageux. C'est un projet imprudent.

---

## 1. Risques Techniques

### 1.1 Risques Critiques (Impact Catastrophique)

| Risque | Probabilite | Impact | Mitigation en place | Mitigation manquante |
|--------|-------------|--------|---------------------|----------------------|
| **Perte de la base de donnees** | Faible | Catastrophique | Railway backups automatiques, migrations versionnees (Drizzle), seed reproductible | Backup externe (S3), test de restauration periodique, backup georedondant |
| **Fuite de donnees utilisateurs** | Faible | Catastrophique | Argon2 pour passwords, JWT avec rotation, HTTPS everywhere, pas de donnees sensibles en clair | Audit de securite externe, politique de notification de breach, chiffrement at-rest |
| **Compromission du serveur** | Faible | Catastrophique | Railway isole les containers, secrets en variables d'environnement | 2FA sur Railway, rotation des secrets, logs d'acces |
| **Corruption des verdicts halal** | Tres faible | Catastrophique | Donnees versionnees, sources tracables | Systeme d'audit trail sur les modifications de verdicts, double validation pour les changements de statut |

**Plan de reprise pour perte de DB** :
```
Detection (Sentry alerte + health check echoue)
    ↓ < 5 min
Evaluation de la gravite (DB corrompue vs. down vs. perdue)
    ↓ < 15 min
Si DB down : restart Railway service
Si DB corrompue : rollback au dernier backup sain
Si DB perdue : restauration complete depuis backup + seed
    ↓ < 2 heures (objectif)
Verification de l'integrite des donnees
    ↓
Communication aux utilisateurs (si downtime > 30 min)
    ↓ < 48 heures
Post-mortem ecrit avec actions correctives
```

### 1.2 Risques de Performance (Impact Eleve)

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Carte lente avec 10K+ stores** | Elevee a scale | Moyen | PostGIS + GiST index en place, geohash bucketing dans `store.nearby`, clustering Mapbox natif |
| **Scan timeout (OFF API lente)** | Moyenne | Eleve | Timeout 5s sur fetch OpenFoodFacts, cache Redis agressif, fallback DB interne |
| **Bundle JS trop lourd (> 20MB)** | Moyenne | Moyen | Code splitting absent — a implementer via lazy loading des screens settings et marketplace |
| **Memory leak sur la carte** | Moyenne | Moyen | React.memo sur les composants, mais map.tsx = 1133 lignes non decompose (risque connu) |
| **Pic de charge Ramadan** | Certaine (annuel) | Eleve | Railway auto-scale possible, Redis cache, mais jamais teste en conditions reelles |

### 1.3 Risques de Securite

| Risque | Probabilite | Impact | Mitigation actuelle | Manquant |
|--------|-------------|--------|---------------------|----------|
| **Brute force login** | Elevee | Moyen | Rate limiting sur auth endpoints (tRPC middleware) | 2FA absent, CAPTCHA absent |
| **Token hijacking** | Faible | Eleve | Refresh token rotation avec mutex, access tokens courts (15min) | CSP headers a ajouter |
| **SQL injection** | Faible | Catastrophique | Drizzle ORM parametrise toutes les requetes, `escapeLike` sur les search | Audit externe absent |
| **IDOR (acces aux donnees d'autrui)** | Faible | Eleve | `ctx.userId` verifie dans chaque procedure protegee | Tests automatises IDOR absents |
| **XSS dans les avis/signalements** | Moyenne | Moyen | Pas de rendu HTML (tout est texte brut dans React Native) | Validation de sortie cote API a confirmer |
| **Scraping massif de la base** | Moyenne | Moyen | Authentification requise pour toutes les routes, rate limiting | Pas de detection de patterns de scraping |

### 1.4 Dette Technique — Le Risque Silencieux

La dette technique n'est pas un bug. C'est un risque qui s'accumule silencieusement et explose quand on ne l'attend pas.

| Element | Risque induit | Effort de remediation |
|---------|---------------|----------------------|
| `map.tsx` (1133 lignes) | Maintenance penible, bugs difficiles a isoler, regression invisible | 2-3 jours (extraction MapMarkerLayer + MapControls) |
| 292 `fontSize` inline | Inconsistance visuelle, impossible de changer la typographie globalement | 5-7 jours (migration incrementale vers textStyles) |
| `signup.tsx` utilise ancien `authService.register()` | Bypass du systeme d'auth tRPC, comportement incoherent | 1 heure |
| 3 `NotificationBell` dupliques | Bug corrige a 1 endroit = oublie aux 2 autres | 1 heure |
| Pas de tests unitaires mobile | Regression invisible sur 44 screens | 5-10 jours (setup Jest + tests critiques) |
| 22 tests integration backend sur 91+ procedures | Couverture de 24% — une procedure cassee sur quatre n'est pas detectee | 3-5 jours (tests des routes critiques) |
| `handleSearchThisArea` est un no-op dans map.tsx | L'auto-refetch se declenche toujours, le bouton ne sert a rien | 2 heures |
| Division par zero dans relevanceScore si radiusKm=0 | Crash potentiel sur requete store.search avec rayon nul | 15 minutes |

---

## 2. Risques Juridiques

### 2.1 RGPD — Le Risque le Plus Concret

| Obligation RGPD | Statut | Risque si non-conforme |
|-----------------|--------|----------------------|
| Consentement explicite pour les donnees | Partiellement (CGU lors de l'inscription) | Amende jusqu'a 4% du CA ou 20M EUR |
| Droit a l'effacement ("droit a l'oubli") | Non implemente | Amende + plainte CNIL |
| Droit a la portabilite | Non implemente | Amende |
| DPO (Delegue a la Protection des Donnees) | Non nomme (pas obligatoire sous 250 employes sans traitement sensible a grande echelle) | Risque si le traitement de donnees religieuses est requalifie |
| Registre des traitements | Non constitue | Amende |
| Privacy by design | Partiellement (pas de donnees sensibles en clair) | Risque |
| Notification de breach | Pas de processus defini | Amende (72h pour notifier la CNIL) |

**Alerte critique** : Les preferences de madhab et le profil sante (`isPregnant`, `hasChildren`, `allergens`) sont des **donnees sensibles au sens du RGPD** (convictions religieuses + donnees de sante). Elles necessitent un consentement explicite renforce, avec possibilite de retrait du consentement a tout moment.

**Actions urgentes** :
1. Implementer un ecran de consentement RGPD specifique pour les donnees religieuses et de sante
2. Implementer le droit a l'effacement (endpoint `user.deleteAccount` complet avec cascade)
3. Implementer le droit a la portabilite (export JSON de toutes les donnees utilisateur)
4. Constituer le registre des traitements (document obligatoire)
5. Definir une politique de notification de breach (72h CNIL + notification utilisateur)

### 2.2 Responsabilite sur les Verdicts

C'est le risque juridique le plus specifique a Naqiy. L'application emet des jugements sur la conformite halal de produits alimentaires. Si un verdict est errone, les consequences peuvent etre reelles.

| Scenario | Risque juridique | Mitigation |
|----------|-----------------|------------|
| Utilisateur allergique suit un verdict "halal" et tombe malade | Responsabilite civile (Article 1240 Code Civil) | Disclaimer explicite : "Naqiy ne remplace pas la lecture de l'etiquette. Verifiez toujours les ingredients vous-meme, surtout en cas d'allergie." |
| Commerce perd des clients suite a un classement defavorable | Diffamation / denigrement commercial | Criteres objectifs publies, droit de reponse offert, correction rapide si erreur prouvee |
| Certificateur conteste notre evaluation de son label | Atteinte a la reputation professionnelle | Sources documentees, methodologie publique, aucun jugement editorial (presentation factuelle) |
| Produit marque "halal" alors qu'il ne l'est pas | Tromperie involontaire | Affichage systematique du score de confiance, mention "incertain" quand les donnees sont insuffisantes |

**Le disclaimer legal** doit apparaitre :
1. Dans les CGU (conditions generales d'utilisation)
2. En bas de chaque ecran de resultat de scan
3. Dans l'onboarding (premiere utilisation)
4. Dans les metadata de l'App Store et du Play Store

### 2.3 Propriete Intellectuelle

| Element | Statut | Action requise |
|---------|--------|----------------|
| Marque "Naqiy" | A deposer a l'INPI (classes 9, 35, 42) | Verifier la disponibilite, deposer |
| Logo et identite visuelle | A proteger | Depot a l'INPI avec la marque |
| Base de donnees additifs/rulings | Droit sui generis du producteur de base de donnees (directive 96/9/CE) | Documenter l'investissement substantiel |
| Code source | Propriete privee (non open source) | Pas d'action requise |
| Donnees OpenFoodFacts | Licence ODbL (utilisation libre avec attribution) | Verifier que l'attribution est correcte dans l'application |

### 2.4 Risque Fiscal

Si Naqiy genere du revenu :
- **Auto-entrepreneur** : possible jusqu'a 77 700 EUR/an de chiffre d'affaires de services (An 1-2)
- **SASU/SAS** : necessaire au-dela, ou si levee de fonds
- **TVA** : franchise en base jusqu'a 36 800 EUR/an de CA
- **Commissions App Store/Play Store** : 15% (small business program) sur les ventes in-app

---

## 3. Risques Reputationnels

### 3.1 Scenario Cauchemar N.1 : Le Faux Verdict Viral

**"Naqiy dit que c'est halal, mais un imam prouve que non."**

Un leader religieux influent conteste publiquement un verdict de l'application sur les reseaux sociaux. Video TikTok a 500K vues. Hashtag #NaqiyMent en tendance.

**Impact** :
- Perte de confiance immediate et massive
- Vague de desinstallations (10-30% de la base en 48h)
- Couverture mediatique negative ("L'app qui trompe les musulmans")
- Difficulte a recuperer la reputation — le doute persiste des mois

**Prevention** :
- Ne jamais affirmer "C'est halal" de maniere absolue — toujours afficher le score de confiance
- Toujours citer les sources (madhab, certificateur, analyse)
- Afficher "Selon l'ecole X" et non un verdict universel
- Avoir un Comite Scientifique et Religieux comme caution d'expertise (objectif An 2)
- Encourager l'utilisateur a verifier par lui-meme ("Consultez votre imam pour un avis personnalise")

**Reaction (protocole de crise)** :
```
T+0 : Detection (monitoring reseaux sociaux)
T+2h : Verification interne des faits
T+4h : Si erreur confirmee → correction du verdict + notification push aux utilisateurs concernes
T+6h : Communication publique (Twitter, Instagram, in-app) — transparence totale, excuses sinceres
T+24h : Contact direct avec le leader religieux pour dialogue
T+72h : Article educatif de fond sur la complexite du sujet
T+1 semaine : Post-mortem public — comment l'erreur s'est produite, mesures correctives
```

### 3.2 Scenario Cauchemar N.2 : L'Instrumentalisation Politique

Naqiy peut etre instrumentalisee par trois camps :

**L'extreme droite** : "Voila une application communautariste qui divise la France. Les musulmans refusent de manger comme tout le monde."

**Les islamistes** : "Voila un outil pour la Oumma. Naqiy prouve que la France empoisonne les musulmans."

**Les medias sensationnalistes** : "Halal : quand la tech s'invite dans la religion. Enquete sur l'application qui scanne la foi."

**Position de Naqiy** : Naqiy est un outil d'information pour le consommateur, exactement comme Yuka est un outil d'information nutritionnelle. Le fait que le consommateur utilise cette information pour des raisons religieuses, ethiques, ou de sante est son choix personnel, protege par la liberte de conscience.

**Reponse mediatique preparee** :
"Naqiy informe le consommateur sur la composition des produits alimentaires. C'est un droit fondamental du consommateur europeen (Reglement UE n. 1169/2011 sur l'information des consommateurs). Nous ne faisons aucune promotion religieuse. Nous ne prenons aucune position politique. Nous rendons l'information alimentaire accessible et comprehensible."

### 3.3 Scenario Cauchemar N.3 : La Fuite de Donnees

**"Les donnees religieuses de 50 000 musulmans francais fuitent."**

Ce scenario est le pire des trois. Les donnees de Naqiy incluent des preferences de madhab (convictions religieuses) et des donnees de sante (allergies, grossesse). Une fuite de ces donnees est :
- Un desastre reputationnel irreversible
- Une violation RGPD avec amende potentiellement massive
- Un danger reel pour les utilisateurs (profilage religieux, discrimination)

**Prevention** :
- Minimisation des donnees : ne collecter que le strict necessaire
- Chiffrement at-rest des donnees sensibles (madhab, sante)
- Pas de logs contenant des donnees personnelles identifiables
- Rotation reguliere des secrets (JWT secret, DB credentials)
- 2FA sur tous les acces administrateur (Railway, GitHub)

### 3.4 Concurrence Deloyale et Sabotage

| Menace | Probabilite | Mitigation |
|--------|-------------|------------|
| Faux avis massifs (spam negatif) | Moyenne | Rate limiting + detection de patterns + moderation |
| Scraping de la base de donnees | Moyenne | Authentification obligatoire, rate limiting, pas d'API publique |
| Fausses informations diffusees sur Naqiy | Faible | Monitoring reseaux sociaux, droit de reponse, preuves |
| Copie du concept par un acteur finance | Moyenne | Le moat communautaire est incopiable rapidement |

---

## 4. Risques Spirituels

### 4.1 Le Waswas Amplifie — Le Risque le Plus Insidieux

Le plus grand risque spirituel de Naqiy : **amplifier l'obsession alimentaire au lieu de la resoudre**. Le waswas (susurrement, doute obsessionnel) est une realite spirituelle reconnue dans la tradition islamique. Une application qui alimente l'anxiete au lieu de l'apaiser trahit sa mission.

| Signal d'alerte | Seuil | Action automatique |
|-----------------|-------|-------------------|
| Utilisateur scanne > 20 produits/jour | 3 jours consecutifs | Message doux : "Tu as beaucoup scanne aujourd'hui. Rappel : la base en Islam est la permission (al-asl fil-ashya' al-ibahah). Si le doute persiste, consulte un imam de confiance." |
| Utilisateur signale > 5 produits/jour | 1 jour | Rate limit sur les signalements + message |
| Utilisateur scanne le meme produit > 3 fois | En 1 semaine | Message : "Tu as deja scanne ce produit. Le verdict n'a pas change." |
| Commentaires anxiogenes dans les avis | Detection par mots-cles | Moderation + suppression si alarmiste |
| Session > 15 minutes continue | 1 occurrence | Message doux : "Tu utilises Naqiy depuis 15 minutes. Prends une pause." |

**Principe fondamental** : Naqiy doit **reduire** l'anxiete alimentaire, pas l'augmenter. Si un utilisateur est plus stresse apres avoir utilise l'application qu'avant, c'est un echec de design, pas un succes d'engagement.

### 4.2 La Division Confessionnelle

L'application affiche les avis de 4 madhabs (ecoles juridiques). Mal gere, cela peut devenir un terrain de conflit :
- "L'app dit que les hanafis se trompent" (interpretation biaisee)
- "Pourquoi l'ecole X est listee en premier ?" (perception de hierarchie)
- "Mon imam dit autrement" (conflit d'autorite percu)

**Prevention** :
- Ordre alphabetique systematique et immuable (Hanafi, Hanbali, Maliki, Shafi'i)
- Aucune mise en avant d'un avis sur un autre — presentation equitable
- Message explicite : "Naqiy presente les avis des ecoles reconnues. Consultez votre imam pour un avis personnalise."
- Aucun commentaire editorial sur les divergences entre ecoles
- Moderation stricte des avis communautaires qui denigrent une ecole

### 4.3 Le Faux Sentiment de Securite

L'utilisateur pourrait penser : "Naqiy dit halal, donc c'est forcement halal, je n'ai plus besoin de verifier." Cela deresponsabilise et delegue la responsabilite religieuse individuelle a un algorithme.

**Prevention** :
- Afficher le score de confiance de maniere proeminente (pas juste la couleur verte/orange/rouge)
- Message recurrent : "Verifiez toujours les ingredients vous-meme"
- Rappeler que l'application est un outil d'aide a la decision, pas une autorite religieuse
- Le disclaimer "Cet outil ne remplace pas l'avis d'un savant" est visible sur chaque verdict

### 4.4 L'Addiction par la Gamification

La gamification (XP, streaks, niveaux, badges) est un outil puissant qui peut basculer dans l'addiction si mal calibre.

| Mecanisme sain | Mecanisme toxique (interdit) |
|----------------|------------------------------|
| Streak avec freeze (pas de punition dure) | Streak sans pitie (perte = culpabilite) |
| XP pour contribution utile | XP pour temps passe (engagement vide) |
| Milestones celebratoires | Classements competitifs (fitna entre utilisateurs) |
| Progression visible mais non obsessionnelle | Loot boxes, rewards aleatoires |

---

## 5. Plans de Contingence — Protocoles d'Escalade

### 5.1 Incident Technique Majeur

```
SEVERITE 1 (Service completement down)
────────────────────────────────────────
Detection : Sentry alerte + health check
Evaluation : < 5 min
Communication in-app : banniere "Maintenance en cours"
Action : rollback Railway ou restart service
Resolution cible : < 2 heures
Post-mortem : dans les 48h

SEVERITE 2 (Degradation de performance)
────────────────────────────────────────
Detection : Sentry + latency alerts
Evaluation : < 15 min
Action : scale up Railway, optimiser requetes, activer cache agressif
Resolution cible : < 4 heures

SEVERITE 3 (Bug non-bloquant)
────────────────────────────────────────
Detection : Sentry + signalements utilisateurs
Evaluation : < 1 heure
Action : hotfix ou ticket pour le prochain sprint
Resolution cible : < 1 semaine
```

### 5.2 Crise Reputationnelle

```
NIVEAU 1 (Buzz negatif < 1000 vues)
────────────────────────────────────
Detection : monitoring reseaux sociaux
Action : reponse factuelle, calme, dans les commentaires
Resolution : < 24h

NIVEAU 2 (Viralite < 50K vues)
────────────────────────────────────
Detection : alerte volume
Action : communique officiel sur les reseaux + correction si necessaire
Resolution : < 48h

NIVEAU 3 (Crise mediatique, couverture presse)
────────────────────────────────────
Detection : contact presse ou viralite > 100K
Action : communique de presse officiel + correction visible + post-mortem public
Resolution : < 1 semaine
Suivi : article educatif de fond dans le mois qui suit
```

### 5.3 Probleme Juridique

```
Detection : mise en demeure, notification CNIL, ou plainte
    ↓ < 24h
Accusation de reception + consultation juridique
    ↓ < 1 semaine
Plan de mise en conformite avec echeancier
    ↓ selon delai legal
Execution du plan + communication transparente si impact utilisateur
    ↓ < 48h apres resolution
Documentation du cas pour prevention future
```

### 5.4 Scenario Extreme : Naqiy Doit Fermer

Si, pour une raison majeure (juridique, financiere, personnelle), Naqiy doit cesser ses operations :

1. **Notification utilisateurs** : 30 jours avant la fermeture
2. **Export de donnees** : chaque utilisateur peut exporter ses donnees (RGPD)
3. **Open source du code** : publier le code source pour que la communaute puisse continuer
4. **Open data des additifs** : publier la base de donnees additifs/rulings en open data
5. **Archive des verdicts** : fichier statique consultable meme sans serveur
6. **Message final** : "Naqiy s'arrete, mais la purete que nous avons cherchee reste. Qu'Allah accepte l'effort."

---

## 6. La Matrice Risque/Impact Consolidee

```
IMPACT ↑
       │
  CAT. │  Perte DB          Fuite donnees       Verdict faux viral
       │                    utilisateurs         + medias
       │
  ELEV │  OFF API down      App Store reject     Imam conteste
       │  Token hijacking   Crise politique      verdict
       │
  MOY  │  Mapbox quota      Carte lente          Scraping base
       │  Bundle lourd      10K stores           Boycott app
       │
  FAIB │  Memory leak       Faux avis            Streak obsessionnel
       │  map.tsx           isoles               (waswas)
       │
       └────────────────────────────────────────────────────→
         FAIBLE             MOYENNE              ELEVEE     PROBABILITE
```

**Lecture** : Les risques en haut a droite (impact eleve + probabilite elevee) sont les priorites absolues. Aujourd'hui, le risque le plus dangereux du quadrant superieur droit est l'absence de conformite RGPD complete sur les donnees religieuses et de sante.

---

## 7. Le Calendrier de Remediation

| Action | Priorite | Effort | Deadline suggeree |
|--------|----------|--------|-------------------|
| Ecran de consentement RGPD (donnees sensibles) | Critique | 2 jours | Avant lancement public |
| Disclaimer legal sur les verdicts | Critique | 0.5 jour | Avant lancement public |
| Endpoint `user.deleteAccount` complet | Critique | 1 jour | Avant lancement public |
| Depot marque "Naqiy" a l'INPI | Haute | 1 jour (+ delai INPI) | Avant lancement public |
| Tests IDOR automatises | Haute | 2 jours | Sprint suivant |
| Decomposition map.tsx | Haute | 2-3 jours | Sprint suivant |
| GREATEST(radiusMeters, 1) dans store.ts | Haute | 15 min | Immediat |
| Backup externe (S3 ou equivalent) | Moyenne | 1 jour | Mois 2 |
| Registre des traitements RGPD | Moyenne | 1 jour | Mois 2 |
| Plan de notification de breach | Moyenne | 0.5 jour | Mois 2 |

---

> Al-Qadar n'est pas la resignation devant le destin. C'est la preparation rigoureuse combinee avec l'acceptation sereine de ce qui advient malgre nos efforts. On prevoit le pire, on travaille pour le meilleur, et on s'en remet a Allah pour ce qui echappe a notre controle. La purete — naqa' — c'est aussi la purete du regard qu'on pose sur les risques : ni panique, ni deni, mais lucidite bienveillante.
