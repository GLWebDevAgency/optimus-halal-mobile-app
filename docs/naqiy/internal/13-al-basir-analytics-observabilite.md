# 13 — Al-Basir (البصير) — Analytics et Observabilite

> "Inna Allaha bassirun bi-l-ibad"
> — Certes, Allah est Clairvoyant envers Ses serviteurs. (Coran 3:15)

---

## Voir Clair, Pas Tout Voir

Al-Basir — le Clairvoyant — ne signifie pas la surveillance totale. Il signifie la **comprehension profonde**. Naqiy ne traque pas ses utilisateurs pour les manipuler. Naqiy observe pour **servir mieux**, diagnostiquer les problemes, et mesurer si la mission est accomplie.

Deux outils, deux roles distincts :
- **Sentry** = le pompier — il detecte ce qui **casse** (crashes, erreurs, exceptions)
- **PostHog** = l'analyste — il comprend ce qui **se passe** (comportements, conversions, usage)

Ils ne se chevauchent pas. Ils se completent.

---

## 1. Architecture Technique

### 1.1 Stack d'Observabilite

```
┌─────────────────────────────────────────────────────────┐
│                    NAQIY MOBILE APP                      │
│                                                          │
│  ┌──────────────────┐      ┌──────────────────────┐     │
│  │   PostHog SDK     │      │   Sentry SDK          │     │
│  │  (posthog-rn)     │      │  (@sentry/react-native)│    │
│  └────────┬─────────┘      └─────────┬────────────┘     │
│           │                          │                    │
│  ┌────────┴─────────┐      ┌────────┴────────────┐      │
│  │  analytics.ts     │      │   sentry.ts          │      │
│  │  - trackEvent()   │      │   - initSentry()     │      │
│  │  - identifyUser() │      │   - setGuestContext() │     │
│  │  - resetUser()    │      │   - setUserContext()  │     │
│  │  - setSuperProps() │     │   - clearSentryUser() │     │
│  └──────────────────┘      └──────────────────────┘      │
└─────────────────────────────────────────────────────────┘
          │                            │
          ▼                            ▼
   PostHog Cloud (EU)          Sentry Cloud
   eu.i.posthog.com            sentry.io
```

### 1.2 Fichiers Cles

| Fichier | Role | Contenu |
|---------|------|---------|
| `src/lib/analytics.ts` | Client PostHog | `initAnalytics()`, `trackEvent()`, `identifyUser()`, `resetUser()`, `setSuperProperties()` |
| `src/lib/sentry.ts` | Client Sentry | `initSentry()`, `setGuestContext()`, `setUserContext()`, `clearSentryUser()` |
| `src/hooks/useAuth.ts` | Pont auth ↔ analytics | Appelle identify/reset sur login/register/logout |
| `app/_layout.tsx` | Initialisation | Init Sentry + PostHog au demarrage, contexte guest par defaut |
| `src/constants/config.ts` | Configuration | `SENTRY_DSN`, `POSTHOG_API_KEY`, `POSTHOG_HOST` |

### 1.3 Variables d'Environnement

```env
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
EXPO_PUBLIC_POSTHOG_API_KEY=phc_xxx
```

PostHog host est hardcode (`https://eu.i.posthog.com`) pour conformite RGPD.

---

## 2. PostHog — Analytics Comportementale

### 2.1 Principe : Anonymous-First, Merge on Identify

PostHog genere automatiquement un `distinct_id` anonyme pour chaque session. Quand l'utilisateur cree un compte ou se connecte, `identifyUser(userId)` fusionne la session anonyme dans le profil identifie. Tous les evenements pre-inscription sont retroactivement attribues a l'utilisateur reel.

C'est le pattern utilise par Netflix, Spotify et Airbnb.

```
Session anonyme:  distinct_id = "auto-abc123"
  → scan_barcode ×3
  → paywall_viewed
  → paywall_subscribe_tapped

identifyUser("user-uuid-456")  ← MERGE
  → Les 3 scans sont maintenant attribues a user-uuid-456
  → Le parcours complet est visible dans le profil utilisateur
```

### 2.2 Catalogue d'Evenements

#### Evenements Scan

| Evenement | Declencheur | Proprietes | Question business |
|-----------|------------|------------|-------------------|
| `scan_barcode` | Scan lance (useScan.ts) | `barcode` | Volume de scans/jour, produits les plus scannes |
| `scan_result_viewed` | Resultat affiche (scan-result.tsx) | `barcode`, `halal_status`, `is_guest`, `is_new_product` | Repartition halal/haram, engagement guest vs premium |

#### Evenements Conversion (Funnel Critique)

| Evenement | Declencheur | Proprietes | Question business |
|-----------|------------|------------|-------------------|
| `guest_quota_reached` | 6eme scan bloque (scanner.tsx) | `trigger: "scan"` | Combien de guests atteignent la limite ? |
| `paywall_viewed` | Paywall affiche (paywall.tsx) | `remaining_scans`, `quota_exhausted` | Le paywall est-il vu a 0 ou avant ? |
| `paywall_subscribe_tapped` | Tap "S'abonner" (paywall.tsx) | — | Intention d'achat |
| `paywall_dismissed` | Tap "Plus tard" (paywall.tsx) | — | Taux de refus |
| `paywall_login_tapped` | Tap "Deja un compte" (paywall.tsx) | — | Utilisateurs existants retrouves |

#### Evenements Auth

| Evenement | Declencheur | Proprietes | Question business |
|-----------|------------|------------|-------------------|
| `signup_completed` | Inscription reussie (useAuth.ts) | `method: "email"` | Taux de conversion inscription |
| `login` | Connexion reussie (useAuth.ts) | `method: "email"` | Frequence de retour Naqiy+ |
| `logout` | Deconnexion (useAuth.ts) | — | Churn signal |

#### Evenements Engagement

| Evenement | Declencheur | Proprietes | Question business |
|-----------|------------|------------|-------------------|
| `add_favorite` | Ajout favori (useFavorites.ts) | `productId` | Produits les plus sauvegardes |

### 2.3 Super Properties

Les super properties sont des proprietes automatiquement ajoutees a **chaque** evenement. Configurees dans `_layout.tsx` via `setSuperProperties()` :

| Propriete | Valeur | Usage |
|-----------|--------|-------|
| `tier` | `"guest"` ou `"premium"` | Segmentation guest vs payant dans tous les dashboards |
| `app_version` | `"1.0.0"` | Comparaison de comportement entre versions |

**Important** : La valeur de `tier` est mise a jour automatiquement :
- Au demarrage : `tier = "guest"` (defaut)
- Quand `useMe()` resout un utilisateur authentifie : `tier = "premium"`
- Sur login/register : `tier = "premium"`
- Sur logout : PostHog `reset()` → nouveau distinct_id anonyme

### 2.4 Identify et Traits Utilisateur

Quand un utilisateur est identifie (login, register, ou retour d'un utilisateur authentifie), PostHog recoit :

```typescript
identifyUser(userId, {
  email: "user@example.com",
  display_name: "Ahmed",
  tier: "premium",
});
```

Ces traits sont stockes sur le profil PostHog et permettent :
- Cohort analysis (utilisateurs premium qui scannent > 10x/jour)
- Segmentation email pour campagnes de retention
- Attribution marketing (d'ou viennent les conversions ?)

### 2.5 Quand Ajouter un Nouvel Evenement

**Regle d'or** : Un evenement doit repondre a une question business specifique. Si tu ne peux pas enoncer la question, ne cree pas l'evenement.

**Bon** :
```typescript
trackEvent("share_card_generated", { halal_status: product.halalStatus });
// Question : Quel % des scans halal sont partages ? Les utilisateurs evangelisent-ils ?
```

**Mauvais** :
```typescript
trackEvent("button_pressed", { button_id: "settings_theme" });
// Pas de question business claire — trop generique
```

**Convention de nommage** :
- Format : `snake_case`, verbe_nom (ex: `scan_result_viewed`, `paywall_dismissed`)
- Prefixe par domaine si ambigu : `guest_quota_reached`, `paywall_subscribe_tapped`
- Proprietes en `snake_case` egalement

---

## 3. Sentry — Monitoring d'Erreurs

### 3.1 Ce Que Sentry Capture Automatiquement

- **Exceptions JS non catchees** : Promise rejections, TypeError, ReferenceError
- **Crashes natifs** : Out of Memory, segfault (via `@sentry/react-native`)
- **Erreurs de rendu React** : Capturees par le `<ErrorBoundary>` global dans `_layout.tsx`
- **Sessions** : `enableAutoSessionTracking: true` → crash-free rate automatique
- **Release tracking** : `release: "Naqiy@1.0.0"` → regression par version

### 3.2 Contexte Utilisateur

Sentry enrichit chaque crash report avec le contexte de l'utilisateur affecte :

#### Mode Guest (anonyme)

```typescript
setGuestContext(deviceId);
// → Sentry.setUser({ id: "device-uuid-abc" })
// → Tags: tier=guest, is_guest=true, app_version=1.0.0
```

Permet de :
- Correler plusieurs crashes du meme appareil
- Filtrer dans le dashboard : "Show me all guest crashes"
- Identifier si un modele de device specifique pose probleme

#### Mode Premium (authentifie)

```typescript
setUserContext(userId, email);
// → Sentry.setUser({ id: "user-uuid-456", email: "ahmed@example.com" })
// → Tags: tier=premium, is_guest=false, app_version=1.0.0
```

Permet de :
- Contacter l'utilisateur si un crash critique le touche
- Prioriser les fixes premium (utilisateurs payants = priorite maximale)
- Mesurer l'impact business d'un bug (combien d'abonnes affectes ?)

#### Cycle de Vie

```
App Launch          → setGuestContext(deviceId)     [guest par defaut]
Login / Register    → setUserContext(userId, email) [upgrade premium]
Logout              → clearSentryUser()             [retour guest]
```

### 3.3 Quand Ajouter un `Sentry.captureException()` Manuel

Sentry capture automatiquement les erreurs non gerees. Tu n'as besoin d'appeler `captureException()` que pour les **erreurs silencieuses** — celles que tu catches mais que tu veux quand meme tracker :

```typescript
// BON — erreur silencieuse qui serait invisible sans tracking
try {
  await syncFavoritesToCloud();
} catch (error) {
  Sentry.captureException(error);
  // Fallback gracieux : l'utilisateur ne voit rien, mais on sait
}

// INUTILE — Sentry capture deja les erreurs non catchees
throw new Error("Something broke"); // Auto-capture par Sentry
```

### 3.4 Breadcrumbs

Sentry enregistre automatiquement des "breadcrumbs" (miettes de pain) avant chaque crash : navigation entre ecrans, taps, requetes reseau. Cela donne le contexte chronologique :

```
14:32:01  navigation → /(tabs)/scanner
14:32:05  ui.tap → scan button
14:32:06  http → POST /trpc/scan.scanBarcode (200)
14:32:06  navigation → /scan-result
14:32:07  ❌ CRASH: TypeError: Cannot read 'halalStatus' of undefined
```

Pas besoin de configurer — c'est actif par defaut avec `@sentry/react-native`.

---

## 4. Cycle de Vie Complet

### 4.1 Diagramme de Flux

```
┌─────────────────────────────────────────────────────────┐
│                    LANCEMENT APP                         │
│                                                          │
│  initSentry()           ← Sentry pret                   │
│  initAnalytics()        ← PostHog pret                  │
│                                                          │
│  getDeviceId() → then:                                   │
│    setGuestContext(id)  ← Sentry: user = deviceId        │
│    setSuperProperties({ tier: "guest", app_version })    │
│                         ← PostHog: chaque event porte    │
│                            tier + version                │
└─────────────────────────────────────────────────────────┘
                          │
            ┌─────────────┴──────────────┐
            │                            │
     Pas de tokens               Tokens trouves
     (guest pur)                 (utilisateur de retour)
            │                            │
            │                   meQuery resolue:
            │                   setUserContext(userId, email)
            │                   identifyUser(userId, traits)
            │                   setSuperProperties({ tier: "premium" })
            │                            │
            ▼                            ▼
┌─────────────────────────────────────────────────────────┐
│                    SESSION ACTIVE                         │
│                                                          │
│  Chaque scan:                                            │
│    trackEvent("scan_barcode")        ← PostHog           │
│    trackEvent("scan_result_viewed")  ← PostHog           │
│    (crash?) → auto-capture           ← Sentry            │
│                                                          │
│  Quota atteint (guest):                                  │
│    trackEvent("guest_quota_reached") ← PostHog           │
│                                                          │
│  Paywall affiche:                                        │
│    trackEvent("paywall_viewed")      ← PostHog           │
│    trackEvent("paywall_*_tapped")    ← PostHog           │
└─────────────────────────────────────────────────────────┘
                          │
            ┌─────────────┴──────────────┐
            │                            │
     Guest reste guest          Guest → Naqiy+
            │                            │
            │                   identifyUser(userId)
            │                     ← PostHog MERGE:
            │                        tous les events anonymes
            │                        sont attribues au user
            │                   setUserContext(userId, email)
            │                     ← Sentry: crashes premium
            │                   setSuperProperties({ tier: "premium" })
            │                   trackEvent("signup_completed")
            │                            │
            ▼                            ▼
┌─────────────────────────────────────────────────────────┐
│                    LOGOUT                                 │
│                                                          │
│  trackEvent("logout")          ← PostHog: dernier event  │
│  resetUser()                   ← PostHog: nouveau ID     │
│  clearSentryUser()             ← Sentry: retour guest    │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Matrice de Responsabilite

| Moment | PostHog | Sentry |
|--------|---------|--------|
| App launch | `setSuperProperties()` | `setGuestContext()` |
| Scan | `trackEvent("scan_*")` | Auto-capture si crash |
| Quota reached | `trackEvent("guest_quota_reached")` | — |
| Paywall | `trackEvent("paywall_*")` | Auto-capture si crash |
| Login | `identifyUser()`, `trackEvent("login")` | `setUserContext()` |
| Register | `identifyUser()`, `trackEvent("signup_completed")` | `setUserContext()` |
| Logout | `resetUser()`, `trackEvent("logout")` | `clearSentryUser()` |
| Crash | — | Auto-capture + contexte user |
| Erreur silencieuse | — | `captureException()` manuel |

---

## 5. Funnels et Dashboards

### 5.1 Funnel Principal : Guest → Premium

C'est **le** funnel qui determine le revenu de Naqiy :

```
scan_barcode
  → scan_result_viewed
    → guest_quota_reached
      → paywall_viewed
        → paywall_subscribe_tapped
          → signup_completed
```

**Comment le creer dans PostHog** :
1. PostHog → Funnels → New Funnel
2. Ajouter chaque evenement dans l'ordre ci-dessus
3. Filtre : `tier = guest` (on ne veut que les conversions guest)
4. Fenetre de conversion : 7 jours

**Ce que tu veux surveiller** :
- `scan_result_viewed → guest_quota_reached` : Quel % des guests fait 5 scans ? (engagement)
- `paywall_viewed → paywall_subscribe_tapped` : Taux de conversion du paywall (design quality)
- `paywall_subscribe_tapped → signup_completed` : Drop-off technique (problemes de payment ?)
- `paywall_viewed → paywall_dismissed` : Taux de refus (pricing trop eleve ?)

### 5.2 Dashboards Recommandes

#### Dashboard 1 : Acquisition (quotidien)

| Widget | Type | Filtre |
|--------|------|--------|
| Scans par jour | Trend line | `scan_barcode` |
| Nouveaux guests par jour | Trend line | Premiere occurrence `scan_barcode` |
| Inscriptions par jour | Trend line | `signup_completed` |
| Taux de conversion global | Number | `signup_completed / premiere scan_barcode` (7 derniers jours) |

#### Dashboard 2 : Conversion (hebdomadaire)

| Widget | Type | Filtre |
|--------|------|--------|
| Funnel guest → premium | Funnel | Voir 5.1 |
| Paywall dismiss rate | Number | `paywall_dismissed / paywall_viewed` |
| Paywall → subscribe rate | Number | `paywall_subscribe_tapped / paywall_viewed` |
| Quota reached rate | Number | `guest_quota_reached / guests uniques` |

#### Dashboard 3 : Engagement (hebdomadaire)

| Widget | Type | Filtre |
|--------|------|--------|
| Scans/user/jour (premium) | Avg | `scan_barcode` filtre `tier = premium` |
| Favoris ajoutes/jour | Trend | `add_favorite` |
| Repartition verdicts | Pie chart | `scan_result_viewed` breakdown par `halal_status` |
| Retention J1/J7/J30 | Retention | Standard PostHog retention |

#### Sentry : Alertes

| Alerte | Condition | Notification |
|--------|-----------|-------------|
| Crash rate critical | Crash-free rate < 99% | Email + Slack |
| Nouveau crash premium | Issue cree avec `tier:premium` | Slack immediat |
| Regression release | Nouveaux issues apres deploy | Email |
| Error spike | > 50 events/heure meme erreur | Slack |

---

## 6. RGPD et Ethique

### 6.1 Conformite

| Aspect | Implementation |
|--------|---------------|
| **Hebergement EU** | PostHog Cloud EU (`eu.i.posthog.com`), Sentry EU |
| **Donnees minimales** | Pas de nom complet, pas d'adresse, pas de geolocalisation precise |
| **Identite guest** | deviceId (UUID genere localement, pas IDFA/GAID) |
| **Identite premium** | userId + email (fournis volontairement a l'inscription) |
| **Pas de tracking publicitaire** | Pas d'IDFA, pas de GAID, pas de fingerprinting |
| **Dev mode** | PostHog desactive en `__DEV__` (`if (!POSTHOG_API_KEY || __DEV__) return`) |
| **Droit a l'oubli** | `resetUser()` genere un nouveau distinct_id aléatoire |

### 6.2 Principe Ethique Naqiy

> On mesure pour **servir**, pas pour **manipuler**.

- Pas de dark patterns guides par les analytics (ex: rendre le bouton "Plus tard" plus petit si le taux de dismiss est eleve)
- Pas de push notifications abusives basees sur les segments PostHog
- Les analytics servent a : diagnostiquer les bugs, ameliorer l'UX, valider que la mission est remplie
- Le paywall reste toujours equitable : bouton "Plus tard" visible, verdict halal gratuit

---

## 7. Guide Operationnel

### 7.1 Routine Quotidienne (5 min)

1. **Sentry** → Issues → trier par "First Seen" → nouveaux crashes ?
2. **PostHog** → Dashboard Acquisition → scans du jour, tendance
3. Si crash `tier:premium` → investigation immediate

### 7.2 Routine Hebdomadaire (15 min)

1. **PostHog** → Dashboard Conversion → evolution du funnel
2. **PostHog** → Dashboard Engagement → retention, favoris
3. **Sentry** → crash-free rate par release → regression ?
4. Comparer conversion semaine N vs N-1

### 7.3 Post-Release (apres chaque deploy)

1. **Sentry** → Releases → comparer crash rate nouvelle version vs precedente
2. **PostHog** → filtre `app_version = X.Y.Z` → comportement normal ?
3. Si spike de crashes ou drop de conversion → rollback ou hotfix

### 7.4 Ajout d'un Nouvel Evenement (checklist)

- [ ] L'evenement repond a une question business specifique ?
- [ ] Le nom suit la convention `snake_case`, `verbe_nom` ?
- [ ] Les proprietes sont en `snake_case` ?
- [ ] L'evenement est ajoute a ce document (section 2.2) ?
- [ ] Les super properties suffisent-elles, ou faut-il des proprietes specifiques ?
- [ ] L'evenement est-il teste en dev (verifier dans PostHog sandbox) ?

---

## 8. Comparaison avec l'Industrie

### 8.1 Comment les Grands Font

| App | Analytics | Error Monitoring | Pattern identify |
|-----|-----------|-----------------|-----------------|
| **Netflix** | Proprietary + segment | Proprietary | Device ID → merge on login |
| **Spotify** | Mixpanel / Amplitude | Sentry | Anonymous → identify on signup |
| **Airbnb** | Proprietary (Minerva) | Sentry | Session ID → merge on auth |
| **Uber** | Proprietary | Sentry | Device ID → merge on login |
| **Naqiy** | PostHog (EU) | Sentry | deviceId → merge on identify |

**Naqiy suit le meme pattern** que les leaders. La difference : PostHog est open-source et heberge en EU, ce qui est un avantage pour la conformite RGPD.

### 8.2 Ce Que Naqiy a de Plus

- **Segmentation tier-aware** : Chaque evenement porte `tier = guest | premium`, permettant de comparer les comportements
- **Conversion funnel complet** : Du premier scan anonyme jusqu'au paiement, avec merge d'identite
- **Sentry enrichi** : Chaque crash porte le tier, le deviceId, et pour les premium l'email — permettant un support proactif
- **Ethique-first** : Pas de tracking pub, pas de dark patterns, donnees EU only

---

## 9. Evenements Futurs (Roadmap)

Evenements a ajouter quand les features seront implementees :

| Evenement | Feature | Priorite |
|-----------|---------|----------|
| `share_card_generated` | Share card produit | P1 — mesure evangelisation |
| `store_viewed` | Carte des magasins | P2 — engagement map |
| `review_submitted` | Avis communautaire | P2 — engagement social |
| `offline_cache_used` | Mode offline premium | P3 — valeur premium |
| `notification_opened` | Push notifications | P2 — re-engagement |
| `subscription_renewed` | RevenueCat webhook | P1 — revenu |
| `subscription_cancelled` | RevenueCat webhook | P1 — churn |
| `trial_started` | Essai gratuit 7j | P1 — conversion |
| `trial_converted` | Essai → paiement | P1 — conversion |
| `search_performed` | Recherche produit | P2 — intent utilisateur |
| `madhab_changed` | Profil madhab | P3 — segmentation religieuse |

---

## 10. Reference Rapide

### PostHog

```typescript
// Tracker un evenement
import { trackEvent } from "@/lib/analytics";
trackEvent("event_name", { property: "value" });

// Identifier un utilisateur (merge anonymous → identified)
import { identifyUser } from "@/lib/analytics";
identifyUser(userId, { email, display_name, tier: "premium" });

// Reset (logout → nouveau anonymous ID)
import { resetUser } from "@/lib/analytics";
resetUser();

// Super properties (auto-ajoutees a chaque event)
import { setSuperProperties } from "@/lib/analytics";
setSuperProperties({ tier: "premium", app_version: "1.0.0" });
```

### Sentry

```typescript
// Contexte guest (anonymous)
import { setGuestContext } from "@/lib/sentry";
setGuestContext(deviceId);

// Contexte premium (authenticated)
import { setUserContext } from "@/lib/sentry";
setUserContext(userId, email);

// Clear sur logout
import { clearSentryUser } from "@/lib/sentry";
clearSentryUser();

// Capture manuelle d'erreur silencieuse
import { Sentry } from "@/lib/sentry";
Sentry.captureException(error);

// Breadcrumb manuel (optionnel, la plupart sont auto)
Sentry.addBreadcrumb({
  category: "scan",
  message: "Product not found in database",
  level: "warning",
});
```
