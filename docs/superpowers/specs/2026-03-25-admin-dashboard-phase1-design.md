# Admin Dashboard Phase 1 — Fondations + Overview + Waitlist + Users

> **Pour les agents d'implémentation :** REQUIRED SUB-SKILL: utiliser superpowers:subagent-driven-development ou superpowers:executing-plans pour implémenter ce spec tâche par tâche.

**Goal:** Transformer le dashboard admin de "façade consultative 4/10" en cockpit opérationnel fonctionnel avec fondations architecturales solides, overview analytique, gestion waitlist complète et refonte users.

**Architecture:** Refonte in-place du dashboard existant (`web/src/app/admin/`). Backend tRPC enrichi avec nouveaux routers admin. Recharts pour la data visualization. Icon sidebar compacte style Linear.

**Tech Stack:** Next.js 15 (App Router) · tRPC v11 · Drizzle ORM · Recharts · shadcn/ui · Tailwind CSS v4 · Phosphor Icons

**Audit de référence:** `docs/superpowers/reports/2026-03-25-admin-dashboard-world-class-audit.md` (score 4/10)

---

## Scope Phase 1

### In scope
1. **Fondations architecturales** — Corriger les problèmes structurels P0/P1 identifiés dans l'audit
2. **Layout refonte** — Icon sidebar compacte, dark mode, suppression éléments décoratifs
3. **Dashboard overview** — 6 KPI cards + 2 line charts + métriques fiables
4. **Page waitlist** — CRUD complet, stats, export CSV, suppression RGPD, analytics UTM
5. **Refonte users** — Detail modal, actions support, bulk operations, debounce fix
6. **Backend enrichi** — Nouveaux endpoints admin dédiés (stats, waitlist, users enrichis)

### Out of scope (phases suivantes)
- Products/Stores refonte et routers admin dédiés
- Articles CMS (éditeur Tiptap, workflow draft/publish)
- Alerts workflow (ack, assignation, escalation)
- Admin management UI (grant/revoke)
- Settings fonctionnel (feature flags, cron status)
- Events timeline, Releases manager, Database explorer

---

## 1. Fondations architecturales

### 1.1 Metadata isolation

**Problème (audit §10.3):** Les pages admin héritent des metadata marketing de la landing (title, OG, robots `index,follow`, JSON-LD MobileApplication).

**Solution:**

Fichier: `web/src/app/admin/layout.tsx`

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin — Naqiy", template: "%s | Admin Naqiy" },
  robots: { index: false, follow: false },
  // Pas d'OG, pas de JSON-LD, pas de canonical
};
```

Chaque sous-page admin définit son propre titre :
- `/admin` → "Vue d'ensemble"
- `/admin/waitlist` → "Waitlist"
- `/admin/users` → "Utilisateurs"

### 1.2 SSR admin hydration

**Problème (audit §10.1, §10.2):** Les routes admin sont générées comme contenu statique. Le HTML SSR rend un spinner car `isLoading = typeof window === "undefined"`.

**Solution:**

1. Ajouter `export const dynamic = "force-dynamic"` sur les pages admin protégées
2. La page login DOIT rendre son formulaire en SSR (pas de spinner)
3. Refactorer `AdminAuthProvider` : remplacer `typeof window === "undefined"` par un `mounted` state via `useEffect`

```typescript
// admin-auth.tsx — fix hydration
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
const isLoading = !mounted || isVerifying;
```

### 1.3 Double TRPCProvider

**Problème (audit §10.4):** Root layout ET admin layout wrappent chacun `TRPCProvider`.

**Solution:** Retirer `TRPCProvider` du admin layout. Il hérite déjà du root.

### 1.4 Éléments décoratifs du shell

**Problème (audit §2):** Recherche globale non connectée, bouton notifications sans handler.

**Solution:** Retirer ces éléments. On les ajoutera quand ils seront fonctionnels. Le header admin contiendra uniquement :
- Sidebar trigger (mobile)
- Breadcrumb de la page courante
- Avatar utilisateur admin avec dropdown (profil, déconnexion)

### 1.5 Stats router sécurisé

**Problème (audit §3, stats.ts):** `stats.global` est un `publicProcedure` — les métriques business sont accessibles sans authentification.

**Solution:** Créer `admin.dashboardStats` avec `adminProcedure` qui retourne des données enrichies. Le `stats.global` public reste pour l'app mobile (données limitées), mais l'admin utilise son propre endpoint.

---

## 2. Layout refonte — Icon sidebar compacte

### 2.1 Structure

```
┌──────────────────────────────────────────────┐
│ [≡] Logo    Breadcrumb              [Avatar] │  ← Header 56px
├────┬─────────────────────────────────────────┤
│ 🏠 │                                         │
│ 📊 │         Main content area               │
│ 👥 │                                         │
│ 📦 │         (pages admin)                   │
│ 🏪 │                                         │
│ 📝 │                                         │
│ 🔔 │                                         │
│    │                                         │
│ ⚙️ │                                         │  ← Sidebar 56px (icons)
└────┴─────────────────────────────────────────┘     → 220px on hover/expand
```

### 2.2 Navigation items

| Icon | Label | Route | Badge |
|------|-------|-------|-------|
| SquaresFour | Vue d'ensemble | `/admin` | — |
| EnvelopeSimple | Waitlist | `/admin/waitlist` | count (new today) |
| Users | Utilisateurs | `/admin/users` | — |
| Package | Produits | `/admin/products` | — |
| Storefront | Magasins | `/admin/stores` | — |
| FileText | Articles | `/admin/articles` | — |
| Bell | Alertes | `/admin/alerts` | count (critical) |
| GearSix | Paramètres | `/admin/settings` | — |

### 2.3 Sidebar comportement

- **Collapsed (défaut)** : 56px, icônes seules, tooltip au hover sur chaque item
- **Expanded** : 220px, icônes + labels + badges, transition 200ms ease
- **Trigger** : bouton hamburger dans le header OU hover sur la sidebar
- **Mobile** : sheet overlay, pas de sidebar fixe
- **Active state** : fond gold/10, icône gold, barre latérale gold 2px à gauche
- **Dark mode only** : fond `zinc-950`, borders `zinc-800`

### 2.4 Avatar dropdown

- Nom + email de l'admin
- Rôle (badge "Admin" ou "Super Admin")
- Séparateur
- Déconnexion

### 2.5 Composants shadcn utilisés

On utilise les composants `Sidebar` de shadcn/ui déjà en place (`@/components/ui/sidebar`), en ajustant le styling pour le mode icon-only compacte. On garde `SidebarProvider`, `SidebarTrigger`, `SidebarMenu`, etc.

---

## 3. Dashboard Overview

### 3.1 Nouveau endpoint backend

Procédure: `admin.dashboardStats` (adminProcedure)

```typescript
// Retour
{
  // KPI cards
  totalUsers: number;
  usersTrend: number; // % vs 7 jours avant
  totalWaitlist: number;
  waitlistToday: number;
  scansToday: number;
  scansTrend: number; // % vs J-1
  totalProducts: number;
  halalDistribution: { halal: number; haram: number; doubtful: number; unknown: number };
  totalStores: number;
  storesEnriched: number; // avec Google Places data
  premiumRate: number; // % premium vs total
  premiumTrend: number; // % vs 7 jours avant

  // Charts data (30 derniers jours)
  signupsByDay: Array<{ date: string; users: number; waitlist: number }>;
  scansByDay: Array<{ date: string; count: number }>;
}
```

**Caching:** Redis 5 minutes (`admin:dashboard:stats`), invalidé sur insert user/scan/waitlist.

**Requêtes SQL:**
- `totalUsers` : `COUNT(*) FROM users WHERE is_active = true`
- `usersTrend` : compare `COUNT WHERE created_at > now()-7d` vs `COUNT WHERE created_at BETWEEN now()-14d AND now()-7d`
- `totalWaitlist` : `COUNT(*) FROM waitlist_leads`
- `waitlistToday` : `COUNT(*) FROM waitlist_leads WHERE created_at > today_start`
- `scansToday` : `COUNT(*) FROM scans WHERE scanned_at > today_start`
- `scansTrend` : compare aujourd'hui vs hier à la même heure
- `halalDistribution` : `COUNT GROUP BY halal_status FROM products`
- `premiumRate` : `COUNT(tier='premium') / COUNT(*) * 100`
- `signupsByDay` : `COUNT GROUP BY DATE(created_at) FROM users/waitlist_leads WHERE created_at > now()-30d`
- `scansByDay` : `COUNT GROUP BY DATE(scanned_at) FROM scans WHERE scanned_at > now()-30d`

### 3.2 KPI Cards layout

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 👥 Users │ │ 📨 Wait  │ │ 📷 Scans │ │ 📦 Prods │ │ 🏪 Shops │ │ ⭐ Prem  │
│  12,847  │ │   2,341  │ │   1,203  │ │  817,038 │ │    383   │ │  3.2%    │
│  ↑ +12%  │ │  +47 ↑   │ │  ↑ +8%   │ │  halal % │ │ enriched │ │  ↑ +0.3% │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

Chaque card :
- Icône + label (muted)
- Valeur principale (text-2xl font-bold)
- Sous-métrique (trend %, secondary info)
- Trend positif = vert, négatif = rouge, neutre = muted
- Cliquable → navigue vers la page détail correspondante

### 3.3 Charts

**Chart 1 — Inscriptions (30j)**
- Type: Area chart (Recharts `AreaChart`)
- 2 séries: Users (gold) + Waitlist (emerald)
- Axe X: dates (format "12 mar")
- Axe Y: count
- Tooltip au hover avec valeurs exactes
- Toggle 7j / 30j

**Chart 2 — Scans (30j)**
- Type: Area chart
- 1 série: Scans quotidiens (blue)
- Même pattern que Chart 1
- Toggle 7j / 30j

Layout: 2 charts côte à côte sous les KPI cards (1 colonne sur mobile).

### 3.4 Correction des KPIs trompeurs (audit §3)

- "Utilisateurs actifs" → renommé "Total utilisateurs" (COUNT WHERE is_active)
- "Magasins vérifiés" → renommé "Commerces" avec sous-métrique "X enrichis"
- Compteur d'alertes → retiré de l'overview (pas fiable avec limit:3), les alertes ont leur page dédiée

---

## 4. Page Waitlist

### 4.1 Nouveau router backend

Procédure: `admin.waitlist` (sous-router dans admin)

```typescript
// admin.waitlist.list (adminProcedure)
input: {
  page: number; // 1-indexed
  limit: number; // 1-100, default 20
  search?: string; // email search (ILIKE)
  source?: "landing" | "marketplace" | "navbar" | "cta";
  sortBy?: "createdAt" | "email" | "source"; // default createdAt
  sortOrder?: "asc" | "desc"; // default desc
}
returns: { items: WaitlistLead[]; total: number; page: number; totalPages: number }

// admin.waitlist.stats (adminProcedure)
returns: {
  total: number;
  today: number;
  bySource: Array<{ source: string; count: number }>;
  byDay: Array<{ date: string; count: number }>; // 30 derniers jours
  utmTop: Array<{ utmSource: string; count: number }>; // top 10 UTM sources
}

// admin.waitlist.delete (adminProcedure)
input: { id: string } // UUID
returns: { success: true }

// admin.waitlist.deleteBulk (adminProcedure)
input: { ids: string[] } // max 100
returns: { deleted: number }

// admin.waitlist.export (adminProcedure)
input: { source?: string; format: "csv" }
returns: { data: string; filename: string; contentType: string }
// Retourne le CSV complet en string (côté client on crée le blob + download)
```

### 4.2 Page layout

```
┌─────────────────────────────────────────────────────┐
│ Waitlist                              [Export CSV ↓] │
├────────────┬────────────┬────────────┬──────────────┤
│ Total      │ Aujourd'hui│ Top source │ Top UTM      │
│   2,341    │    +47     │  landing   │ instagram    │
│            │            │   68%      │   23%        │
├────────────┴────────────┴────────────┴──────────────┤
│ [Chart: inscriptions par jour — 30j, bar chart]     │
├─────────────────────────────────────────────────────┤
│ 🔍 Rechercher...    [Landing ▾] [Source ▾]          │
├─────────────────────────────────────────────────────┤
│ ☐ │ Email              │ Source    │ UTM     │ Date │
│ ☐ │ user@example.com   │ landing  │ ig_ads  │ 25/03│
│ ☐ │ autre@mail.com     │ market.  │ —       │ 24/03│
│   │ ...                                             │
├─────────────────────────────────────────────────────┤
│ [Supprimer sélection]     ◀ Page 1/12 ▶            │
└─────────────────────────────────────────────────────┘
```

### 4.3 Fonctionnalités

1. **Stats cards** (4) : total, aujourd'hui, top source (%), top UTM source (%)
2. **Bar chart** : inscriptions/jour sur 30j (Recharts `BarChart`)
3. **Table paginée** : email, source (badge coloré), UTM source/medium/campaign, locale, date inscription
4. **Recherche** : debounce 300ms sur email (ILIKE)
5. **Filtres** : source (dropdown), UTM source (dropdown des top 10)
6. **Tri** : par date (défaut desc), email, source
7. **Sélection bulk** : checkbox par ligne + "Tout sélectionner"
8. **Suppression** : individuelle (icône trash) + bulk (bouton "Supprimer sélection")
9. **Confirmation** : AlertDialog shadcn avant suppression avec compte des éléments
10. **Export CSV** : bouton header, exporte la vue filtrée ou tout
11. **Toast** : confirmation après suppression / export

### 4.4 UTM Analytics

Section collapsible sous le chart principal :
- Top 10 UTM sources (bar horizontal)
- Top 10 UTM mediums
- Top 10 UTM campaigns
- Données issues de `admin.waitlist.stats`

---

## 5. Refonte Users

### 5.1 Endpoints backend enrichis

```typescript
// admin.listUsers — ENRICHI (existe déjà, on ajoute des champs)
// Ajout au retour: lastActiveAt, deviceCount, scanHistory count
returns: {
  items: Array<{
    ...safeUserColumns,
    totalScans: number;
    lastActiveAt: Date | null; // dernière activité
    deviceCount: number; // nombre de devices
    premiumSince: Date | null;
  }>;
  total: number;
  page: number;
  totalPages: number;
}

// admin.getUserDetail — NOUVEAU (adminProcedure)
input: { userId: string } // UUID
returns: {
  user: { ...allSafeColumns };
  stats: { totalScans: number; lastScan: Date | null; favoriteStores: number; reports: number };
  recentScans: Array<{ id, barcode, productName, halalStatus, scannedAt }>; // 20 derniers
  devices: Array<{ id, platform, appVersion, lastActiveAt }>;
  subscription: { tier, startedAt, expiresAt } | null;
}

// admin.updateUser — NOUVEAU (adminProcedure, super_admin)
input: {
  userId: string;
  action: "ban" | "unban" | "resetPassword" | "changeTier" | "deleteGDPR";
  tier?: "free" | "premium"; // pour changeTier
}
returns: { success: true; message: string }
```

### 5.2 Page layout refonte

```
┌─────────────────────────────────────────────────────┐
│ Utilisateurs (12,847)                               │
├─────────────────────────────────────────────────────┤
│ 🔍 Rechercher...   [Free|Premium|Tous]  [Tri: ▾]   │
├─────────────────────────────────────────────────────┤
│ ☐ │ Email           │ Tier │ Scans │ Dernier │ Date│
│ ☐ │ user@mail.com   │ 💎   │  142  │ il y a  │ 12/ │
│ ☐ │ autre@mail.com  │ Free │   23  │ 2j      │ 01/ │
│   │ ...              (clic → ouvre detail modal)     │
├─────────────────────────────────────────────────────┤
│ [Actions ▾]               ◀ Page 1/643 ▶           │
└─────────────────────────────────────────────────────┘
```

### 5.3 Detail modal utilisateur

Au clic sur une ligne → `Sheet` shadcn (panneau latéral droit, 480px) :

```
┌──────────────────────────────────┐
│ ← Retour         user@email.com │
├──────────────────────────────────┤
│ 👤 Mohamed A.                   │
│ Premium depuis le 15/01/2026    │
│ Créé le 03/12/2025              │
│ Dernière activité: il y a 2h    │
├──────────────────────────────────┤
│ Statistiques                    │
│ 142 scans · 3 favoris · 1 report│
├──────────────────────────────────┤
│ Derniers scans                  │
│ • Kinder Bueno — halal — 14:23 │
│ • Nutella — douteux — 13:01    │
│ • Haribo — haram — 12:45       │
├──────────────────────────────────┤
│ Appareils (2)                   │
│ • iPhone 15 — v2.1.0 — actif   │
│ • Galaxy S24 — v2.0.8 — 3j     │
├──────────────────────────────────┤
│ Actions                         │
│ [Changer tier ▾] [Reset MDP]   │
│ [Bannir]  [Supprimer RGPD]     │
└──────────────────────────────────┘
```

### 5.4 Fonctionnalités users

1. **Table enrichie** : email, nom, tier (badge), total scans, dernière activité (relative), date création
2. **Recherche** : debounce 300ms corrigé (pas le pattern `setTimeout` cassé actuel)
3. **Filtres** : tier (free/premium/tous)
4. **Tri** : par date, scans, email, dernière activité
5. **Sélection bulk** : checkbox + "Actions" dropdown (bannir en masse, changer tier)
6. **Detail Sheet** : panneau latéral avec profil complet
7. **Actions admin** (super_admin) :
   - Changer tier (free ↔ premium)
   - Reset mot de passe (génère un code, envoie par email)
   - Bannir / Débannir
   - Suppression RGPD (soft delete + anonymisation)
8. **Confirmation** : AlertDialog avant toute action destructive
9. **Fix debounce** : remplacer le pattern `useRef + setTimeout` par un hook `useDebouncedValue` propre

### 5.5 Hook useDebouncedValue

```typescript
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

Utilisé dans Users ET Waitlist pour remplacer les debounce cassés.

---

## 6. Fichiers impactés

### Backend — Créer
| Fichier | Responsabilité |
|---------|---------------|
| `backend/src/trpc/routers/admin-waitlist.ts` | Sous-router waitlist (list, stats, delete, deleteBulk, export) |

### Backend — Modifier
| Fichier | Changement |
|---------|-----------|
| `backend/src/trpc/routers/admin.ts` | Ajouter `dashboardStats`, `getUserDetail`, `updateUser` ; enrichir `listUsers` |
| `backend/src/trpc/router.ts` | Merger le sous-router waitlist dans admin |

### Web — Créer
| Fichier | Responsabilité |
|---------|---------------|
| `web/src/app/admin/waitlist/page.tsx` | Page waitlist complète |
| `web/src/components/admin/kpi-card.tsx` | Composant KPI card réutilisable |
| `web/src/components/admin/area-chart.tsx` | Wrapper Recharts area chart thémé |
| `web/src/components/admin/bar-chart.tsx` | Wrapper Recharts bar chart thémé |
| `web/src/components/admin/user-detail-sheet.tsx` | Sheet détail utilisateur |
| `web/src/components/admin/data-table.tsx` | Table générique avec sélection, tri, pagination |
| `web/src/components/admin/confirm-dialog.tsx` | AlertDialog de confirmation réutilisable |
| `web/src/hooks/use-debounced-value.ts` | Hook debounce propre |

### Web — Modifier
| Fichier | Changement |
|---------|-----------|
| `web/src/app/admin/layout.tsx` | Metadata isolation, retirer TRPCProvider dupliqué, retirer search/notifications décoratifs, refonte sidebar icon compacte, breadcrumb, avatar dropdown |
| `web/src/app/admin/page.tsx` | Refonte complète : 6 KPI cards + 2 charts via `admin.dashboardStats` |
| `web/src/app/admin/users/page.tsx` | Refonte : table enrichie, debounce fix, bulk actions, clic → Sheet detail |
| `web/src/app/admin/login/page.tsx` | `dynamic = "force-dynamic"`, SSR formulaire |
| `web/src/lib/admin-auth.tsx` | Fix hydration (mounted state au lieu de typeof window) |
| `web/package.json` | Ajouter `recharts` |

---

## 7. Patterns et conventions

### Dark mode
- Fond: `zinc-950` (body), `zinc-900` (cards), `zinc-800` (borders)
- Texte: `zinc-50` (primary), `zinc-400` (muted)
- Accent: `gold` (oklch 0.76 0.14 88) pour les éléments actifs
- Charts: palette gold, emerald, blue, red avec opacité pour les aires

### Composants admin
- Tous dans `web/src/components/admin/` — séparés des composants landing
- Préfixe de fichier descriptif, pas de préfixe "Admin" dans le nom du composant
- Chaque composant = 1 fichier, < 200 lignes idéalement

### Erreurs
- Toast Sonner pour les actions (suppression, export, changement tier)
- Skeleton loading states pour toutes les queries
- Empty states avec icône + message + CTA quand pertinent

### Sécurité
- Toutes les procédures via `adminProcedure` (jamais `publicProcedure` pour les données admin)
- Actions destructives (delete, ban, GDPR) = `super_admin` only
- Confirmation UI (AlertDialog) avant toute action destructive
- Logs backend pour toutes les mutations admin

---

## 8. Ce que cette phase NE fait PAS

Pour éviter le scope creep, ces éléments sont explicitement exclus :

- ❌ Pas de refonte products/stores (restent sur routers publics pour l'instant)
- ❌ Pas de CMS articles (le stub reste tel quel)
- ❌ Pas de workflow alertes (le stub reste tel quel)
- ❌ Pas de settings fonctionnel
- ❌ Pas de NextAuth migration (on garde le système d'auth actuel, on fixe juste l'hydration)
- ❌ Pas de 2FA
- ❌ Pas d'events timeline / releases manager / database explorer
- ❌ Pas de tests E2E (phase séparée)

---

## 9. Critères de succès

La Phase 1 est terminée quand :

1. ✅ Les pages admin ont leurs propres metadata (pas de fuite landing)
2. ✅ La page login rend son formulaire en SSR (pas un spinner)
3. ✅ La sidebar est compacte (56px icons, expand au hover, 8 items)
4. ✅ L'overview affiche 6 KPIs fiables + 2 charts avec données réelles
5. ✅ La page waitlist est opérationnelle (CRUD, stats, export, suppression)
6. ✅ La page users a un detail sheet, des actions admin, du bulk
7. ✅ Toutes les données admin passent par `adminProcedure`
8. ✅ `pnpm build` et `pnpm lint` passent sur `web/` et `backend/`
9. ✅ Les KPIs affichent des libellés corrects (pas de "utilisateurs actifs" trompeur)
10. ✅ Zero éléments décoratifs non-fonctionnels dans le shell
