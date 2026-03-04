# 12 — Al-Tijara (التجارة) — Plan B2B Commercants

> "Wa ahalla Allahu al-bay'a wa harrama al-riba"
> — Allah a rendu licite le commerce et a interdit l'usure. (Coran 2:275)

---

## Vision B2B

Les commercants halal en France (boucheries, epiceries, restaurants, boulangeries) n'ont aucune plateforme de visibilite dediee. Google Maps ne filtre pas par certification halal. Instagram ne garantit pas l'authenticite. Naqiy comble ce vide en devenant la plateforme de reference pour la visibilite des commercants halal certifies.

**Principe fondamental** : Les commercants paient pour de la visibilite, JAMAIS pour influencer un verdict halal. Le score de confiance d'un commerce est calcule objectiquement (avis, certification, hygiene) et ne peut etre achete.

---

## Les 3 Tiers Commercants

### Tier 1 — Profil Verifie (9,90 EUR/mois)

| Fonctionnalite | Detail |
|----------------|--------|
| Badge "Verifie par Naqiy" | Visible sur la carte et la fiche |
| Page commerce dedee | Horaires, contact, certification affichee |
| Reponse aux avis | Interagir avec les avis des utilisateurs |
| Statistiques basiques | Nombre de vues, clics "itineraire" |

### Tier 2 — Profil Enrichi (19,90 EUR/mois)

Tout le Tier 1 +

| Fonctionnalite | Detail |
|----------------|--------|
| Photos et menus | Jusqu'a 20 photos, carte/menu PDF |
| Promotions | Offres speciales visibles sur la carte |
| Analytics avances | Taux de conversion, heures de pointe |
| QR Code personnalise | Pour afficher en vitrine (renvoie vers la fiche) |
| Notifications push | Alerter les utilisateurs proches des promotions |

### Tier 3 — Visibilite Locale (29,90 EUR/mois)

Tout le Tier 2 +

| Fonctionnalite | Detail |
|----------------|--------|
| Placement prioritaire | Apparaitre en premier dans un rayon de 1km |
| Badge "Recommande" | Mis en avant dans les resultats |
| Widget sur Home | Apparition dans la section "Autour de vous" |
| Rapport mensuel | PDF de performance envoye par email |

---

## Principes Ethiques B2B

1. **Separation totale visibilite/verdict** : Un commerce peut payer pour etre plus visible, JAMAIS pour ameliorer son score. Le score de confiance est calcule par un algorithme transparent.

2. **Badge "Sponsorise" toujours visible** : Quand un commerce est mis en avant grace a un paiement, l'utilisateur voit clairement "Sponsorise". Pas de publicite deguisee.

3. **Verification prealable** : Seuls les commerces avec une certification halal verificable peuvent acceder aux tiers payants. Pas de certification = pas de commerce sur Naqiy.

4. **Droit de retrait** : Si un commerce perd sa certification ou recoit des signalements graves, son profil payant est suspendu (avec remboursement au prorata) le temps de l'enquete.

---

## Modele Economique B2B

### Projections (France, annee 1-3)

| Metrique | Annee 1 | Annee 2 | Annee 3 |
|----------|---------|---------|---------|
| Commerces cibles | 5 000 | 12 000 | 25 000 |
| Taux conversion | 2% | 4% | 6% |
| Commerces payants | 100 | 480 | 1 500 |
| ARPC (revenu moyen/commerce) | 15 EUR/mois | 18 EUR/mois | 20 EUR/mois |
| MRR B2B | 1 500 EUR | 8 640 EUR | 30 000 EUR |
| ARR B2B | 18 000 EUR | 103 680 EUR | 360 000 EUR |

### Acquisition B2B

1. **Approche bottom-up** : Les utilisateurs Naqiy utilisent la carte → les commerces remarquent le trafic → ils demandent a etre references → on leur propose le tier payant.

2. **Partenariats certifiers** : AVS, Achahada, ARGML peuvent recommander Naqiy a leurs commerces certifies comme plateforme de visibilite.

3. **Equipe terrain (V2)** : Agents locaux dans les quartiers a forte concentration de commerces halal (93, 95, Marseille, Lyon).

---

## Roadmap Technique B2B

### Phase 1 — Fondation (T2 2026)
- [ ] Dashboard commercant web (Next.js)
- [ ] Endpoint tRPC `merchant.register` + `merchant.updateProfile`
- [ ] Integration Stripe pour les paiements B2B
- [ ] Badge "Verifie" dans StoreDetailCard

### Phase 2 — Enrichissement (T3 2026)
- [ ] Upload photos via R2 (Cloudflare)
- [ ] Systeme de promotions avec expiration
- [ ] Analytics dashboard (vues, clics, conversions)
- [ ] QR Code generator

### Phase 3 — Visibilite (T4 2026)
- [ ] Algorithme de placement prioritaire
- [ ] Badge "Sponsorise" transparent
- [ ] Widget "Autour de vous" sur Home
- [ ] Notifications push geofencees

---

## Architecture Technique

```
commercant (web)     -->  merchant.register (tRPC)
                     -->  merchant.updateProfile
                     -->  merchant.uploadPhoto (R2)
                     -->  merchant.createPromo
                     -->  stripe webhook (paiement)

utilisateur (app)    -->  store.getNearby (avec boost tier 3)
                     -->  store.getDetail (avec badge tier 1+)
                     -->  store.getPhotos (tier 2+)
                     -->  store.getPromos (tier 2+)
```

### Tables DB (Drizzle)

```
merchants
  - id: uuid
  - userId: uuid (FK users)  -- le commercant a un compte utilisateur
  - storeId: uuid (FK stores) -- lie au commerce sur la carte
  - tier: "free" | "verified" | "enriched" | "premium"
  - stripeCustomerId: text
  - stripeSubscriptionId: text
  - subscribedAt: timestamp
  - expiresAt: timestamp

merchant_photos
  - id: uuid
  - merchantId: uuid (FK merchants)
  - url: text (R2 presigned)
  - caption: text
  - sortOrder: int

merchant_promotions
  - id: uuid
  - merchantId: uuid (FK merchants)
  - title: text
  - description: text
  - startsAt: timestamp
  - expiresAt: timestamp
  - isActive: boolean
```

---

## Conclusion

Le B2B est le levier economique le plus puissant de Naqiy a moyen terme. Le B2C (Naqiy+) finance le quotidien. Le B2B finance la croissance. Les deux respectent le meme principe : **on monetise le confort et la visibilite, jamais la verite.**
