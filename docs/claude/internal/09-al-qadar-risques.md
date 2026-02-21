# 09 — Al-Qadar : Risques et Contingences

> "Ma asabaka min musibatin fa bi-ma kasabat aydikum wa ya'fu 'an kathir"
> — Tout malheur qui vous atteint est du a ce que vos mains ont acquis, et Il pardonne beaucoup. (Coran 42:30)

---

## Anticiper pour Proteger

La tawakkul (confiance en Allah) ne signifie pas l'imprevoyance. Le Prophete (paix sur lui) a dit d'attacher le chameau d'abord. Ce chapitre est notre corde.

---

## 1. Risques Techniques

### 1.1 Risques Critiques

| Risque | Probabilite | Impact | Mitigation | Statut |
|--------|-------------|--------|------------|--------|
| **Perte de la base de donnees** | Faible | Catastrophique | Railway backups automatiques, migrations versionees dans `drizzle/`, seed reproductible | Partiellement mitigue |
| **Fuite de donnees utilisateurs** | Faible | Catastrophique | Argon2 pour passwords, JWT avec rotation, HTTPS everywhere, pas de donnees sensibles en clair | En place |
| **API OpenFoodFacts inaccessible** | Moyenne | Eleve | Cache local des produits scannes, fallback sur la DB interne, mode offline | Cache basique en place |
| **Mapbox quota depasse** | Faible | Moyen | Tier gratuit 50K req/mois, monitoring, fallback sur carte statique | Non monitore |
| **App Store rejection** | Moyenne | Eleve | Conformite Apple Guidelines, pas de contenu religieux controversiel dans les screenshots | Non teste |
| **Certificate pinning bypass** | Faible | Eleve | HTTPS natif via Expo, pas de certificate pinning custom (a ajouter) | Pas en place |

### 1.2 Risques de Performance

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Carte lente avec 10K+ stores** | Elevee a scale | Moyen | PostGIS + GiST index en place, geohash bucketing dans `store.nearby`, clustering Mapbox |
| **Scan timeout (OFF API lente)** | Moyenne | Eleve | Timeout 5s sur fetch OFF, cache agressif, fallback DB interne |
| **Bundle JS trop lourd** | Moyenne | Moyen | Code splitting absent, lazy load des screens settings a implementer |
| **Memoire leak sur la carte** | Moyenne | Moyen | React.memo sur les composants, mais map.tsx = 1133 lignes non decompose |

### 1.3 Risques de Securite

| Risque | Probabilite | Impact | Mitigation actuelle | Manquant |
|--------|-------------|--------|---------------------|----------|
| **Brute force login** | Elevee | Moyen | Rate limiting sur auth endpoints | 2FA absent |
| **Token hijacking** | Faible | Eleve | Refresh token rotation, mutex, tokens courts (15min) | CSP headers |
| **SQL injection** | Faible | Catastrophique | Drizzle ORM parametrise, `escapeLike` sur search | Audit externe absent |
| **IDOR (acces aux donnees d'autrui)** | Faible | Eleve | `ctx.userId` verifie dans chaque procedure protegee | Test automatise absent |
| **XSS dans les avis** | Moyenne | Moyen | Pas de rendu HTML, tout est texte brut | Validation de sortie a confirmer |

### 1.4 Dette Technique Actuelle

| Element | Risque | Effort de remediation |
|---------|--------|----------------------|
| map.tsx (1133 lignes) | Maintenance penible, bugs difficiles a isoler | 2-3 jours (extraction composants) |
| 292 fontSize inline | Inconsistance visuelle, impossible de changer la typographie globalement | 5-7 jours (migration incrementale) |
| signup.tsx utilise ancien authService | Bypass du nouveau systeme d'auth tRPC | 1 heure |
| 3 NotificationBell dupliques | Bug corrige a 1 endroit = oublie aux 2 autres | 1 heure |
| Pas de tests unitaires mobile | Regression invisible | 5-10 jours (setup + tests critiques) |
| 22 tests integration backend | Couverture faible sur 86 procedures | 3-5 jours |

---

## 2. Risques Juridiques

### 2.1 RGPD

| Obligation | Statut | Risque si non-conforme |
|-----------|--------|----------------------|
| Consentement explicite pour les donnees | Partiellement (CGU lors de l'inscription) | Amende jusqu'a 4% du CA |
| Droit a l'effacement | Non implemente | Amende |
| Droit a la portabilite | Non implemente | Amende |
| DPO (Delegue a la Protection des Donnees) | Non nomme | Risque si > 250 employes ou traitement sensible |
| Registre des traitements | Non constitue | Amende |
| Privacy by design | Partiellement (pas de donnees sensibles en clair) | Risque |

**Donnees sensibles** : Les preferences de madhab et le profil sante (`isPregnant`, `hasChildren`, `allergens`) sont des **donnees sensibles au sens du RGPD** (convictions religieuses + donnees de sante). Elles necessitent un consentement explicite renforce.

**Action urgente** : Implementer un ecran de consentement RGPD specifique pour les donnees religieuses et de sante, avec possibilite de retrait du consentement a tout moment.

### 2.2 Responsabilite sur les Verdicts

| Scenario | Risque | Mitigation |
|----------|--------|------------|
| Utilisateur allergique suit un verdict "halal" et tombe malade | Responsabilite civile | Disclaimer clair : "Cette app ne remplace pas la lecture d'etiquette" |
| Commerce perd des clients suite a un mauvais classement | Diffamation | Criteres objectifs publies, droit de reponse, correction rapide |
| Certificateur conteste notre evaluation | Atteinte a la reputation | Sources documentees, methodologie publique |
| Produit marque "halal" alors qu'il ne l'est pas | Tromperie (involontaire) | Niveaux de confiance affiches, "incertain" quand les donnees sont insuffisantes |

**Le disclaimer legal** doit apparaitre :
1. Dans les CGU
2. En bas de chaque ecran de scan result
3. Dans l'onboarding

### 2.3 Propriete Intellectuelle

| Element | Statut |
|---------|--------|
| Marque "Optimus Halal" | A deposer a l'INPI |
| Logo et identite visuelle | A proteger |
| Base de donnees additifs/rulings | Droit sui generis du producteur de base de donnees |
| Code source | Propriete privee (non open source) |
| Donnees OpenFoodFacts | Licence ODbL (utilisation libre avec attribution) |

---

## 3. Risques Reputationnels

### 3.1 Le Scenario Cauchemar

**"L'app dit que c'est halal, mais un imam prouve que non."**

Si un leader religieux influent conteste publiquement un verdict de l'app sur les reseaux sociaux, l'impact est :
- Perte de confiance immediate
- Vague de desinstallations
- Couverture mediatique negative ("L'app qui trompe les musulmans")
- Difficulte a recuperer la reputation

**Prevention** :
- Ne jamais affirmer "C'est halal" de maniere absolue
- Toujours montrer le niveau de confiance
- Toujours citer les sources
- Afficher "Selon l'ecole X" et non un verdict universel
- Avoir un Conseil Scientifique et Religieux comme caution d'expertise

**Reaction** :
- Reponse dans les 24h
- Contact direct avec le leader religieux
- Correction si erreur averee + notification push
- Article educatif sur la complexite du sujet

### 3.2 Instrumentalisation Politique

L'app peut etre instrumentalisee par :
- **L'extreme droite** : "Voila une app communautariste qui divise la France"
- **Les islamistes** : "Voila un outil pour la Oumma contre l'oppression"
- **Les medias** : "Halal : quand la technologie s'invite dans la religion"

**Notre position** : Optimus Halal est un **outil d'information pour le consommateur**, exactement comme Yuka est un outil d'information nutritionnelle. Il n'a pas de dimension politique.

### 3.3 Concurrence Deloyale

Un concurrent pourrait :
- Creer des faux comptes pour spammer de mauvais avis
- Copier notre base de donnees (scraping)
- Diffuser de fausses informations sur nous

**Mitigations** :
- Rate limiting + detection de patterns sur les avis
- Pas d'API publique sans authentification
- Monitoring des mentions sur les reseaux sociaux
- Constitution de preuves pour action juridique si necessaire

---

## 4. Risques Spirituels

### 4.1 Le Waswas Amplifie

Le plus grand risque spirituel de l'app : **amplifier l'obsession alimentaire au lieu de la resoudre**.

| Signal d'alerte | Seuil | Action |
|----------------|-------|--------|
| Utilisateur qui scanne > 20 produits/jour | 20 scans/jour pendant 3 jours | Message doux : "Vous avez beaucoup scanne aujourd'hui. Rappel : la base en Islam est la permission." |
| Utilisateur qui signale > 5 produits/jour | 5 reports/jour | Rate limit + message |
| Utilisateur qui ne garde aucun produit "douteux" en favori | Pattern comportemental | Pas d'action directe, mais a etudier |
| Commentaires anxiogenes dans les avis | Moderation | Suppression si alarmiste |

### 4.2 La Division Confessionnelle

L'app affiche les avis de 4 madhabs. Mal gere, cela peut devenir :
- "L'app dit que les hanafis se trompent" (interpretation biaisee)
- "Pourquoi l'ecole X est listee en premier ?" (perception de hierarchie)
- "Mon imam dit autrement" (conflit d'autorite)

**Prevention** :
- Ordre alphabetique systematique (Hanafi, Hanbali, Maliki, Shafi'i)
- Pas de mise en avant d'un avis sur un autre
- Message clair : "L'app presente les avis des ecoles reconnues. Consultez votre imam pour un avis personnalise."

### 4.3 Le Faux Sentiment de Securite

L'utilisateur pourrait penser : "L'app dit halal, donc c'est forcement halal." Cela deresponsabilise.

**Prevention** :
- Afficher le score de confiance (pas juste la couleur)
- Encourager la verification des etiquettes ("Verifiez toujours les ingredients vous-meme")
- Rappeler que l'app est un outil d'aide, pas une autorite religieuse

---

## 5. Plan de Contingence

### 5.1 Incident Technique Majeur

```
Detection (Sentry alerte)
    ↓
Evaluation (< 15 min)
    ↓
Communication (Push notification si impact utilisateur)
    ↓
Resolution (Rollback Railway si necessaire)
    ↓
Post-mortem (Rapport ecrit dans les 48h)
```

### 5.2 Crise Reputationnelle

```
Detection (Monitoring reseaux sociaux)
    ↓
Verification des faits (< 2h)
    ↓
Communication (Twitter/Instagram + in-app) (< 24h)
    ↓
Correction si necessaire (< 48h)
    ↓
Article educatif de fond (< 1 semaine)
```

### 5.3 Probleme Juridique

```
Detection (Mise en demeure / notification CNIL)
    ↓
Consultation juridique (< 48h)
    ↓
Mise en conformite (selon delai legal)
    ↓
Communication transparente (si impact utilisateur)
```

---

## 6. La Matrice Risque/Impact

```
IMPACT ↑
       │
  CRIT │  DB loss        Verdict faux       Fuite donnees
       │                 public
       │
  ELEV │  OFF API down   App Store reject   Imam conteste
       │                                     verdict
       │
  MOY  │  Mapbox quota   Carte lente        Boycott app
       │                 10K stores
       │
  FAIB │  Bundle lourd   Streak obsessionnel  Faux avis
       │
       └──────────────────────────────────────────→
         FAIBLE          MOYENNE          ELEVEE    PROBABILITE
```

---

> Al-Qadar n'est pas la resignation devant le destin — c'est la preparation rigoureuse combinee avec l'acceptation sereine de ce qui advient malgre nos efforts. On prevoit le pire, on travaille pour le meilleur, et on s'en remet a Allah pour le resultat.
