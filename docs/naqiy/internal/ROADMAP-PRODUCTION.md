# NAQIY — Roadmap Production & Post-Launch

## Date : 6 mars 2026 | Version : 1.0

> Plan ultra-complet, de la beta familiale au déploiement mondial.
> Chaque item est marqué : **[OBLIGATOIRE]** ou **[OPTIONNEL]** (nice-to-have).

---

## Score Audit Actuel

| Domaine | Note | Blockers |
|---------|------|----------|
| **Frontend** | 8.2/10 | Map 1133 lignes, i18n AR incomplet, memoization limitée |
| **Backend** | B+ | 3 critiques (GiST index, receipt verification, N+1 store detail) |
| **Sécurité** | B+ | Secrets en git, reset code faible, rate limiting insuffisant |
| **Infra/CI** | B | iOS non configuré, deep links absents, 0 tests mobile |
| **Store Listing** | F | Aucune capture, pas de privacy policy, pas de CGU |

---

## PHASE 0 — URGENCES SÉCURITÉ (Jour 1)

> Avant toute distribution, même beta familiale.

### [OBLIGATOIRE] S1. Rotation des secrets exposés

- [ ] Régénérer `JWT_SECRET` et `JWT_REFRESH_SECRET` (32+ chars)
- [ ] Régénérer `BREVO_API_KEY`
- [ ] Régénérer `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- [ ] Régénérer `GOOGLE_PLACES_API_KEY`
- [ ] Régénérer R2 credentials (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`)
- [ ] Régénérer Mapbox secret token (`sk.*`)
- [ ] Mettre à jour Railway + EAS secrets avec les nouvelles clés
- [ ] Invalider les anciennes clés chez chaque provider

### [OBLIGATOIRE] S2. Nettoyer l'historique git

- [ ] `git filter-repo` ou `bfg-repo-cleaner` pour supprimer `backend/.env` de l'historique
- [ ] Supprimer `credentials.json` (keystore password `naqiy2026` en clair)
- [ ] Ajouter `**/credentials.json` au `.gitignore`
- [ ] Force push après nettoyage (coordonner avec l'équipe)

### [OBLIGATOIRE] S3. Pre-commit hook anti-secrets

- [ ] Installer `husky` + script qui bloque les commits contenant des patterns sensibles
- [ ] Patterns : `sk_`, `sk.*`, `DATABASE_URL=`, `JWT_SECRET=`, `.env` files

---

## PHASE 1 — FIXES CRITIQUES BACKEND (Jours 2-4)

> Blockers absolus pour la production. Sans ça, l'app crashera ou sera vulnérable.

### [OBLIGATOIRE] B1. Index PostGIS GiST sur `stores.location`

```sql
-- Nouvelle migration 0015
CREATE INDEX stores_location_gist_idx ON stores USING GIST(location);
```

**Pourquoi** : Sans cet index, `store.nearby` fait un scan O(n) de toute la table.
À 422 stores c'est OK, à 10 000 ça timeout.

### [OBLIGATOIRE] B2. Fix N+1 dans `store.getById`

- Combiner les 4-5 queries séquentielles en 2-3 parallèles max
- Utiliser `Promise.all()` pour hours + reviews + rating dist + Google reviews

### [OBLIGATOIRE] B3. Receipt verification — sécuriser ou supprimer

L'endpoint `subscription.verifyPurchase` est stubbé et throw.
Deux options :
- **Option A** : Implémenter la vérification RevenueCat côté serveur
- **Option B** : Supprimer l'endpoint, s'appuyer uniquement sur les webhooks RevenueCat
→ Option B recommandée (plus simple, plus sûr)

### [OBLIGATOIRE] B4. Password reset code cryptographique

Remplacer `randomInt(100000, 1000000)` (900K possibilités, brute-forceable) par :
```typescript
crypto.randomBytes(4).toString('hex') // 4 milliards de possibilités
```
+ Réduire les tentatives de 5 → 3 avec backoff exponentiel.

### [OBLIGATOIRE] B5. Rate limiting granulaire

```typescript
app.use("/trpc/store.nearby", rateLimit({ max: 50, windowMs: 60_000 }));
app.use("/trpc/product.search", rateLimit({ max: 50 }));
app.use("/trpc/scan.create", rateLimit({ max: 20 }));
```

### [OBLIGATOIRE] B6. Sanitisation `ingredients_text`

Valider l'entrée avant de la passer à l'extraction AI :
- Strip null bytes, BOM, caractères de contrôle
- Rate limit per-user sur l'extraction AI (5/minute)

### [OBLIGATOIRE] B7. Index FK manquants

```sql
-- Migration 0016
CREATE INDEX reviews_user_id_idx ON reviews(user_id);
CREATE INDEX reviews_store_id_idx ON reviews(store_id);
CREATE INDEX favorites_folder_id_idx ON favorites(folder_id);
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
```

### [OPTIONNEL] B8. Nettoyage tokens expirés

Cron job quotidien Railway :
```sql
DELETE FROM refresh_tokens WHERE expires_at < NOW();
```

### [OPTIONNEL] B9. JWT audience multi-client

Préparer `audience: ["mobile", "web"]` pour le futur dashboard web.

---

## PHASE 2 — FIXES FRONTEND (Jours 3-5)

> Qualité UX et robustesse pour les beta testeurs.

### [OBLIGATOIRE] F1. Vérifier complétude i18n arabe

- Comparer `fr.ts` (1391 lignes) vs `ar.ts` (1250 lignes) — 141 lignes manquantes
- Identifier et ajouter toutes les clés manquantes
- Vérifier le rendu RTL sur les écrans critiques (home, scan, map)

### [OBLIGATOIRE] F2. Feature flags — masquer les features incomplètes

Les settings stubbés (health-profile, madhab, exclusions, certifications, achievements, leaderboard, rewards, boycott-list) doivent soit :
- Être masqués du menu settings
- Soit afficher un "Bientôt disponible" cohérent

### [OPTIONNEL] F3. Refactoring `map.tsx` (1133 lignes)

Extraire en composants :
- `MapMarkerCluster` — gestion des marqueurs
- `MapSearchOverlay` — barre de recherche
- `MapControls` — FABs (localisation, filtres, refresh)
- `useMapState` hook — state management du map

### [OPTIONNEL] F4. Memoization critique

- `React.memo()` sur les composants de formulaire (Input, PhoneInput)
- `useCallback` sur les handlers des listes (home, favorites, alerts)

### [OPTIONNEL] F5. Accessibilité map

- `accessibilityLabel` sur chaque marqueur de store
- Test TalkBack sur le Samsung Galaxy Note 24

---

## PHASE 3 — INFRASTRUCTURE STORE (Jours 5-10)

> Prérequis absolus pour soumettre aux stores.

### [OBLIGATOIRE] I1. Configurer le build iOS

- [ ] Créer le certificat Apple Distribution dans EAS : `eas credentials --platform ios`
- [ ] Configurer le provisioning profile
- [ ] Build iOS preview : `eas build --platform ios --profile preview`
- [ ] Tester sur un iPhone (ou TestFlight)

### [OBLIGATOIRE] I2. Privacy Policy & CGU

- [ ] Rédiger la privacy policy (données collectées, usage, droits RGPD)
  - Données : email, scan history, localisation (quand app ouverte), favoris
  - Pas de vente à des tiers
  - Droit de suppression du compte
- [ ] Rédiger les CGU (conditions d'utilisation)
- [ ] Héberger sur `naqiy.app/privacy` et `naqiy.app/terms`
- [ ] Ajouter les liens dans `app.config.ts` :
  ```typescript
  ios: { infoPlist: { NSPrivacyTracking: false } }
  ```
- [ ] Ajouter un lien "Politique de confidentialité" dans Settings

### [OBLIGATOIRE] I3. Captures d'écran Store Listing

- [ ] 5 captures iPhone 6.7" (iPhone 15 Pro Max) :
  1. Écran de scan avec produit vert
  2. Résultat détaillé avec Trust Score
  3. Carte avec magasins halal
  4. Home avec veille éthique
  5. Profil avec gamification
- [ ] 5 captures Android (Pixel 8 Pro / Samsung S24 Ultra)
- [ ] Variantes FR / EN / AR si multilingue dans le store listing
- [ ] Feature graphic 1024x500 pour Play Store

### [OBLIGATOIRE] I4. Store Listing Metadata

```
Titre (30 chars) : Naqiy — Halal Scanner
Sous-titre (30 chars) : Scanne. Comprends. Choisis.
Description courte (80 chars) : Scanner halal intelligent — vérifiez vos produits en un scan.
Description longue : [4000 chars max — détailler features, certifications, communauté]
Mots-clés : halal, scanner, produits, certification, halal food, muslim
Catégorie : Food & Drink
Content Rating : Everyone / Tout public
```

### [OBLIGATOIRE] I5. Deep Linking / Universal Links

```typescript
// app.config.ts
android: {
  intentFilters: [{
    action: "VIEW",
    autoVerify: true,
    data: [
      { scheme: "naqiy" },
      { scheme: "https", host: "naqiy.app", pathPrefix: "/store" },
      { scheme: "https", host: "naqiy.app", pathPrefix: "/scan" },
    ]
  }]
},
ios: {
  associatedDomains: ["applinks:naqiy.app"]
}
```

- [ ] Configurer `naqiy.app/.well-known/apple-app-site-association`
- [ ] Configurer `naqiy.app/.well-known/assetlinks.json`

### [OBLIGATOIRE] I6. Sentry & PostHog — Configurer les DSN

- [ ] Créer les projets Sentry (iOS + Android)
- [ ] Ajouter `SENTRY_DSN` dans les EAS secrets
- [ ] Créer le projet PostHog
- [ ] Ajouter `POSTHOG_API_KEY` dans les EAS secrets
- [ ] Vérifier que les events remontent en preview

### [OBLIGATOIRE] I7. CI — Rendre l'audit sécurité bloquant

```yaml
# backend-ci.yml
- run: pnpm audit --audit-level high
  continue-on-error: false  # ← était true
```

### [OPTIONNEL] I8. Android track → production

Changer `eas.json` : `"track": "internal"` → `"track": "production"` quand prêt.

### [OPTIONNEL] I9. Cache warming au deploy

Pré-charger les stats globales et les données de référence dans Redis après le seed.

---

## PHASE 4 — TESTS (Jours 7-14)

> Construire un filet de sécurité minimum avant prod.

### [OBLIGATOIRE] T1. Tests backend — coverage critique

- [ ] Auth : login, register, refresh, logout, password reset
- [ ] Scan : create scan, AI extraction, quota anonymous
- [ ] Store : nearby (avec PostGIS), getById, search
- [ ] Subscription : webhook handling
- **Objectif** : 70% coverage backend

### [OBLIGATOIRE] T2. Tests E2E mobile — flows critiques

Framework : **Maestro** (le plus simple pour Expo)
- [ ] Flow 1 : Lancement → Onboarding → Home
- [ ] Flow 2 : Scan barcode → Résultat → Partage
- [ ] Flow 3 : Map → Recherche → Store detail → Itinéraire
- [ ] Flow 4 : Login → Profile → Favoris

### [OPTIONNEL] T3. Load testing backend

- Artillery ou k6 sur `store.nearby` et `scan.create`
- Objectif : 100 req/s avec P95 < 500ms

### [OPTIONNEL] T4. Tests accessibilité

- TalkBack (Android) sur les 5 écrans principaux
- VoiceOver (iOS) idem
- Vérifier les `accessibilityLabel` et `accessibilityRole`

---

## PHASE 5 — PRODUCTION DEPLOYMENT (Jours 12-15)

> Le grand jour.

### [OBLIGATOIRE] D1. Checklist pré-soumission

- [ ] Toutes les phases 0-3 complétées
- [ ] Build production Android : `eas build --platform android --profile production`
- [ ] Build production iOS : `eas build --platform ios --profile production`
- [ ] Tester les 2 builds sur devices physiques
- [ ] Vérifier que Sentry capture les erreurs
- [ ] Vérifier que PostHog capture les events
- [ ] Vérifier la connexion API production (pas preview)
- [ ] Vérifier les in-app purchases (sandbox RevenueCat)

### [OBLIGATOIRE] D2. Fix déploiement Railway production

Actuellement tous les deploys production échouent depuis le 20 février.
- [ ] Diagnostiquer l'échec (probablement migration tracking table)
- [ ] Appliquer les migrations manquantes sur la DB production
- [ ] Trigger un redeploy
- [ ] Vérifier le health check : `GET /health`

### [OBLIGATOIRE] D3. Soumission stores

**Google Play Store :**
- [ ] `eas submit --platform android --profile production`
- [ ] Remplir le questionnaire de contenu (data safety, target audience)
- [ ] Review time : 1-3 jours (parfois 7 pour les premières soumissions)

**Apple App Store :**
- [ ] `eas submit --platform ios --profile production`
- [ ] Remplir App Store Connect : description, screenshots, privacy
- [ ] Review time : 1-2 jours (parfois jusqu'à 7)
- [ ] Attention : Apple est plus strict sur les permissions (caméra, localisation)

### [OBLIGATOIRE] D4. Monitoring post-launch (48h)

- [ ] Dashboard Sentry : taux d'erreur < 1%
- [ ] Dashboard PostHog : DAU, retention D1
- [ ] Railway : CPU, mémoire, latence P95
- [ ] Redis : hit ratio cache > 80%
- [ ] Store reviews : répondre aux 1-étoiles dans les 24h

### [OPTIONNEL] D5. Rollout progressif

- Google Play : déployer à 10% → 50% → 100% sur 3 jours
- Apple : pas de staged rollout natif, mais possible via phased release

---

## PHASE 6 — POST-LAUNCH SEMAINE 1-2

> Stabilisation et premiers retours.

### [OBLIGATOIRE] P1. Hotfix pipeline

- Process : fix → commit → EAS OTA update (pas besoin de rebuild store)
- Les OTA updates via `eas update` déploient les changements JS sans re-soumission

### [OBLIGATOIRE] P2. Nettoyage code

- [ ] Supprimer les service files legacy inutilisés (`auth.service.ts`, `favorites.service.ts`)
- [ ] Supprimer `useLocalAlertsStore` (remplacé par tRPC)
- [ ] Ajouter `@deprecated` JSDoc sur les fichiers à supprimer dans le futur

### [OBLIGATOIRE] P3. Enrichissement continu des données

- [ ] Cron hebdomadaire : refresh Google Places (rating, reviews, photos)
- [ ] Mise à jour des alertes (RappelConso, Al-Kanz)
- [ ] Ajout de nouvelles certifications quand détectées

### [OPTIONNEL] P4. Email retry logic

Implémenter un retry avec backoff exponentiel pour l'envoi d'emails (Brevo).

### [OPTIONNEL] P5. Cache warming au deploy

Pré-charger les queries fréquentes dans Redis après chaque deploy.

---

## PHASE 7 — POST-LAUNCH MOIS 1-3

> Croissance et fonctionnalités avancées.

### [OBLIGATOIRE] P6. Implémenter les settings stubbés

Par ordre de priorité :
1. **Profil de santé** — allergènes, restrictions alimentaires
2. **Choix du madhab** — Hanafi/Maliki/Shafi'i/Hanbali pour le scoring
3. **Exclusions d'ingrédients** — personnalisation du verdict scan
4. **Préférences de certification** — certifications de confiance

### [OBLIGATOIRE] P7. Système d'alertes complet

Implémenter le plan "Alertes Éthiques" déjà documenté :
- Pagination cursor fix
- Vue détail alerte
- Read/unread tracking
- Critical banner sur le home
- Section "Veille éthique"

### [OPTIONNEL] P8. Marketplace V1

- Catalogue de produits halal vérifiés
- Panier + checkout (Stripe)
- Suivi de commande

### [OPTIONNEL] P9. Gamification avancée

- Achievements débloquables
- Leaderboard communautaire
- Système de récompenses (partenaires halal)

### [OPTIONNEL] P10. Social features

- Avis utilisateur sur les magasins
- Partage de listes de favoris
- Recommandations communautaires

---

## PHASE 8 — SCALING (Mois 3-6)

> Préparer la croissance internationale.

### [OPTIONNEL] S1. Internationalisation complète

- Turc, indonésien, malais (plus gros marchés halal mondiaux)
- Adaptation des certifications par pays
- Stores data pour chaque marché

### [OPTIONNEL] S2. Performance à l'échelle

- Partitionnement des tables à forte cardinalité (scans, notifications)
- Connection pooling avec PgBouncer
- CDN pour les assets statiques (R2 est déjà un CDN)
- Load balancer pour le backend (Railway auto-scale)

### [OPTIONNEL] S3. Web app

- PWA ou Next.js app
- Partage des types tRPC `AppRouter`
- Dashboard web pour les commerçants (B2B)

### [OPTIONNEL] S4. API publique

- Documentation OpenAPI/Swagger
- Rate limiting par API key
- Plans développeurs (free/pro/enterprise)

---

## TIMELINE RÉSUMÉ

```
MARS 2026
─────────────────────────────────────────────────
Sem 1 (6-12)   ▓▓▓▓ Phase 0 (Sécurité) + Phase 1 (Backend critiques)
Sem 2 (13-19)  ▓▓▓▓ Phase 2 (Frontend) + Phase 3 (Store infra)
Sem 3 (20-26)  ▓▓▓▓ Phase 4 (Tests) + Phase 5 (Deploy)
Sem 4 (27-31)  ░░░░ Monitoring + Hotfixes

AVRIL 2026
─────────────────────────────────────────────────
Sem 1-2        ░░░░ Phase 6 (Post-launch stabilisation)
Sem 3-4        ░░░░ Phase 7 (Settings + Alertes)

MAI-JUILLET 2026
─────────────────────────────────────────────────
               ░░░░ Phase 7 suite (Marketplace, Gamification)
               ░░░░ Phase 8 (Scaling international)
```

**Légende** : ▓ = Obligatoire | ░ = Optionnel / Progressif

---

## FICHIERS IMPACTÉS — RÉSUMÉ

### Phase 0-1 (Backend critique)

| Fichier | Action |
|---------|--------|
| `backend/.env` | SUPPRIMER de git |
| `credentials.json` | SUPPRIMER de git |
| `drizzle/0015_gist_index.sql` | CRÉER |
| `drizzle/0016_fk_indexes.sql` | CRÉER |
| `backend/src/trpc/routers/store.ts` | MODIFIER (fix N+1) |
| `backend/src/trpc/routers/auth.ts` | MODIFIER (crypto reset code) |
| `backend/src/trpc/routers/subscription.ts` | MODIFIER (supprimer stub) |
| `backend/src/index.ts` | MODIFIER (rate limits) |
| `backend/src/trpc/routers/scan.ts` | MODIFIER (sanitize input) |

### Phase 2-3 (Frontend + Infra)

| Fichier | Action |
|---------|--------|
| `optimus-halal/src/i18n/translations/ar.ts` | MODIFIER (compléter) |
| `optimus-halal/app.config.ts` | MODIFIER (deep links, privacy) |
| `eas.json` | MODIFIER (iOS signing, track) |
| `.gitignore` | MODIFIER (credentials.json) |
| `.github/workflows/backend-ci.yml` | MODIFIER (audit bloquant) |
| `optimus-halal/app/settings/privacy.tsx` | CRÉER |
| `docs/legal/privacy-policy.md` | CRÉER |
| `docs/legal/terms-of-service.md` | CRÉER |

### Phase 4 (Tests)

| Fichier | Action |
|---------|--------|
| `backend/src/__tests__/store.test.ts` | CRÉER/COMPLÉTER |
| `backend/src/__tests__/scan.test.ts` | CRÉER/COMPLÉTER |
| `optimus-halal/.maestro/` | CRÉER (E2E flows) |

---

## KPIs DE SUCCÈS

| Métrique | Objectif Launch | Objectif Mois 3 |
|----------|----------------|-----------------|
| **Crash-free rate** | > 99.5% | > 99.9% |
| **API P95 latence** | < 500ms | < 200ms |
| **Store rating** | > 4.0 | > 4.5 |
| **DAU** | 100 | 1,000 |
| **Retention D7** | > 30% | > 40% |
| **Scans/jour** | 500 | 5,000 |
| **Cache hit ratio** | > 70% | > 90% |
| **Error rate** | < 2% | < 0.5% |
| **App size** | < 50 MB | < 40 MB (optimisation) |
| **Cold start** | < 3s | < 2s |

---

*Document généré le 6 mars 2026 — Audit complet par Claude Code (Opus 4.6)*
*Basé sur l'analyse de : 52 routes, 91+ procédures tRPC, 20 tables DB, 22 tests, 3 workflows CI/CD*
