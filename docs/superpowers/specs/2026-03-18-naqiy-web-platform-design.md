# Naqiy Web Platform — Design Specification

**Date**: 2026-03-18
**Status**: Approved
**Author**: Claude (CTO Lead)
**Scope**: Replace static `vitrine/` with a full Next.js 16 web platform (landing + admin dashboard)

---

## 1. Problem Statement

The current web presence at naqiy.app is a static HTML/CSS landing page (`vitrine/`) with no admin capabilities. The team needs:

1. A **world-class premium landing page** to drive app downloads and Naqiy+ conversions
2. A **comprehensive admin dashboard** to manage 817K+ products, users, events, releases, blog content, and database operations
3. Both under a single Next.js application deployed to Vercel on the existing domain

## 2. Architecture Decision: Single App with Route Groups

**Choice**: Single Next.js 16 app with `(marketing)` and `(admin)` route groups.

**Rationale**:
- Backend lives on Railway (not Vercel) — Turborepo gives no build sharing advantage
- Types already shared via `@backend/*` path alias pattern (proven in mobile app)
- Route groups provide perfect isolation without deployment overhead
- Single domain: `naqiy.app` (landing) + `naqiy.app/admin` (dashboard)
- The real monorepo already exists: the root repo contains backend + mobile + web

**Trade-off accepted**: Admin and landing share a build. Mitigated by Next.js automatic code splitting per route group — admin JS never loads on marketing pages.

## 3. Directory Structure

```
web/                                    # Replaces vitrine/
├── app/
│   ├── layout.tsx                      # Root: fonts, providers, metadata
│   ├── (marketing)/                    # Public landing — SSG/ISR, SEO
│   │   ├── layout.tsx                  # Navbar + footer
│   │   ├── page.tsx                    # Home (13 cosmic-upgraded sections)
│   │   ├── blog/
│   │   │   ├── page.tsx                # Article list (ISR)
│   │   │   └── [slug]/page.tsx         # Article detail
│   │   ├── privacy/page.tsx
│   │   └── terms/page.tsx
│   ├── (admin)/                        # Dashboard — SSR, auth-protected
│   │   ├── layout.tsx                  # Sidebar + topbar
│   │   ├── dashboard/page.tsx          # KPIs, charts, activity feed
│   │   ├── products/
│   │   │   ├── page.tsx                # DataTable 817K (server-side pagination)
│   │   │   └── [barcode]/page.tsx      # Product detail (56 columns)
│   │   ├── users/
│   │   │   ├── page.tsx                # Users table (CRUD)
│   │   │   └── [id]/page.tsx           # User profile + events
│   │   ├── events/page.tsx             # Event timeline (filterable)
│   │   ├── releases/page.tsx           # APK lifecycle (EAS builds, OTA)
│   │   ├── stores/page.tsx             # Store management (383+)
│   │   ├── certifiers/page.tsx         # Certifier management
│   │   ├── articles/
│   │   │   ├── page.tsx                # Blog CMS (CRUD)
│   │   │   └── [id]/edit/page.tsx      # Rich text editor (Tiptap)
│   │   ├── database/page.tsx           # DB explorer (tables, stats)
│   │   └── settings/page.tsx           # Feature flags, config, cron status
│   ├── api/
│   │   ├── trpc/[trpc]/route.ts        # tRPC proxy → Railway backend
│   │   └── auth/[...nextauth]/route.ts # NextAuth admin credentials
├── middleware.ts                        # Auth middleware (Next.js 16, project root)
├── components/
│   ├── ui/                             # shadcn/ui (CLI-installed)
│   ├── landing/                        # Cosmic-upgraded sections
│   ├── admin/                          # Dashboard components
│   └── shared/                         # Logo, theme-provider, loading
├── lib/
│   ├── trpc.ts                         # tRPC client → Railway
│   ├── auth.ts                         # NextAuth v5 config
│   ├── utils.ts                        # cn() + helpers
│   └── constants.ts                    # URLs, feature flags
├── @data/                              # Static content (cosmic pattern)
├── public/                             # Static assets
├── __tests__/                          # Vitest + Testing Library
├── e2e/                                # Playwright E2E tests
├── next.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── components.json                     # shadcn/ui config
├── tsconfig.json
└── package.json
```

## 4. Technology Stack

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Framework | Next.js | 16 (latest) | App Router, RSC, Cache Components, proxy.ts |
| React | React | 19 | Concurrent features, Server Components |
| Styling | Tailwind CSS | v4 | OKLCH color space, @theme inline |
| UI Components | shadcn/ui | latest CLI | Source ownership, Radix primitives |
| Animations | motion (Framer) | v12 | Cosmic effects (beams, sliders, hover) |
| Data Tables | TanStack Table | v8 | Server-side pagination for 817K rows |
| Charts | Recharts | v2 | Dashboard KPIs, analytics |
| Forms | React Hook Form + Zod | latest | Type-safe validation |
| Auth | NextAuth.js | v5 | Admin credentials, JWT sessions |
| API Client | @trpc/client | v11 | Proxy to existing Railway backend |
| Rich Editor | Tiptap | v2 | Blog CMS, extensible, sanitizable |
| Unit Tests | Vitest | latest | Fast, native TypeScript |
| Component Tests | Testing Library | latest | DOM testing |
| E2E Tests | Playwright | latest | Browser automation |
| Package Manager | pnpm | latest | Project standard |
| Icons | Lucide React | latest | Consistent with cosmic + mobile |

## 5. Design System — Naqiy Brand

### 5.1 Color Palette (OKLCH)

```css
/* Dark mode (default) */
--color-primary: oklch(0.72 0.17 162);         /* Emerald Naqiy */
--color-primary-foreground: oklch(0.985 0 0);   /* White */
--color-accent: oklch(0.75 0.12 85);            /* Subtle gold */
--color-background: oklch(0.09 0.01 260);       /* Deep blue-black */
--color-foreground: oklch(0.985 0 0);           /* Near white */
--color-card: oklch(0.14 0.01 260);             /* Dark card */
--color-card-foreground: oklch(0.985 0 0);
--color-muted: oklch(0.20 0.01 260);            /* Muted dark */
--color-muted-foreground: oklch(0.65 0 0);
--color-border: oklch(1 0 0 / 8%);              /* Subtle borders */
--color-input: oklch(0.20 0.01 260);
--color-ring: oklch(0.72 0.17 162);             /* Emerald ring */
--color-destructive: oklch(0.55 0.2 25);        /* Error red */
--radius: 0.625rem;

/* Light mode */
--color-background: oklch(0.985 0 0);
--color-foreground: oklch(0.145 0 0);
--color-card: oklch(1 0 0);
--color-primary: oklch(0.55 0.2 162);           /* Deeper emerald for contrast */
```

### 5.2 Typography

- **Display/Headings**: Bricolage Grotesque (variable, from cosmic)
- **Body**: Inter (variable)
- **Mono**: Geist Mono (barcodes, IDs, timestamps, code)
- **Font loading**: `next/font` with literal names in `@theme inline` (shadcn Geist fix)

### 5.3 Design Direction

- Dark-first (consistent with cosmic template + Naqiy mobile app)
- Emerald primary + gold accent (Islamic-inspired, replacing cosmic's golden-only)
- Cosmic animation effects preserved (beams → emerald, particles → green/gold)
- Admin: Clean data-dense layout with subtle glass-morphism cards
- Landing: Premium, immersive, scroll-driven narrative

## 6. Landing Page — 13 Cosmic-Upgraded Sections

| # | Section | Naqiy Content | Visual Effect |
|---|---------|---------------|---------------|
| 1 | Hero | "Scanne. Comprends. Choisis." + app mockup | BackgroundBeams (emerald) |
| 2 | Trust | Certifier logos (AVS, Achahada, MUI, JAKIM) | InfiniteSlider |
| 3 | Benefits | Scanner, Veille éthique, Trust Score, Carte | Sticky scroll cards |
| 4 | Features | 6 features with animated icons | CardsHover |
| 5 | How It Works | 3 steps: scan → analyze → verdict | Step animation |
| 6 | Stats | 817K products, 383+ stores, 4 certifiers, 3 langs | SlidingNumber |
| 7 | Testimonials | User reviews | Embla Carousel |
| 8 | Pricing | Free / Naqiy+ (monthly/annual toggle) | AnimatedBackground + SlidingNumber |
| 9 | App Preview | Mobile app screenshots (3 screens) | Parallax scroll |
| 10 | Blog | Latest 3 articles | Cards hover |
| 11 | FAQ | Common halal/app questions | Accordion |
| 12 | Newsletter | "Rejoins la communauté Naqiy" | Input + CTA |
| 13 | Footer | Links, legal, contact, socials | Multi-column |

## 7. Admin Dashboard — Module Specifications

### 7.1 Dashboard Overview

- **KPI Cards**: Total users, active users (7d), scans/day, products in DB, Naqiy+ subscribers, MRR
- **Charts**: Scans over time (line), Top scanned products (bar), Users by country (donut), Halal distribution (pie)
- **Activity Feed**: Real-time events (last 50) with auto-refresh

### 7.2 Products Manager

- **DataTable**: Server-side pagination (50/page), search by barcode/name, column sorting
- **Filters**: halal_status, nutriscore, completeness range, has_image, category
- **Detail View**: All 56 V2 columns, product image, ingredients, additives breakdown
- **Actions**: Override halal_status (with audit trail), flag product, export filtered CSV
- **Stats Bar**: Total products, halal/haram/doubtful/unknown distribution

### 7.3 Users Manager

- **DataTable**: Email, subscription_tier, created_at, last_active, scan_count
- **Profile**: Full user info, scan history, device info, subscription timeline
- **Actions**: Ban/unban, force password reset, upgrade/downgrade tier, GDPR delete
- **Bulk**: Select + bulk action (ban, export, notify)

### 7.4 Events Timeline

- **Chronological view**: All events (scans, logins, subscriptions, errors, admin actions)
- **Filters**: By user, by event type, by date range, by severity
- **Detail drawer**: Event payload, user context, timestamps
- **Export**: CSV/JSON for analysis

### 7.5 Releases Manager (v1: Read-only + Links)

- **Table**: Version, platform (iOS/Android), build status, OTA status, date, size
- **Actions v1**: View build logs (external link to EAS dashboard), view OTA history
- **Actions v2 (deferred)**: Trigger new build, rollback OTA (requires EAS API integration + `EXPO_TOKEN` on Railway)
- **History**: Version timeline with deployment status
- **Data source**: Manual entries via `admin.releases` router (v1), EAS API polling (v2)

### 7.6 Stores Manager

- **DataTable**: Name, address, certifier, Google rating, review count, hours
- **Map View**: Leaflet/Mapbox integration showing store locations
- **Actions**: Edit store info, link certifier, flag for review
- **Import**: Bulk import from Google Places export

### 7.7 Blog CMS

- **Articles**: CRUD with Tiptap rich text editor
- **Fields**: Title, slug (auto-generated), SEO title/description, featured image, category, tags
- **Workflow**: Draft → Review → Published (manual publish only in v1)
- **Scheduled Publishing (v2)**: Requires a `POST /internal/publish-scheduled-articles` cron endpoint + GitHub Actions workflow. Deferred — manual publish is sufficient for v1.
- **Preview**: Live rendered preview before publish
- **Media**: Image upload to Cloudflare R2 (existing `naqiy` bucket, consistent with mobile app). Uses signed upload URLs via backend `admin.articles.getUploadUrl` router. No second storage provider.

### 7.8 Database Explorer

- **Tables View**: All 21+ tables with row count, size, last updated
- **Stats**: DB total size, index usage %, top tables by size
- **Quick Queries**: Predefined templates (top scanned products, halal distribution, user growth)
- **Schema Viewer**: Column names, types, constraints per table

### 7.9 Settings

- **Feature Flags**: Toggle app features (scanner, map, trust score, etc.)
- **Rate Limits**: View/edit per-endpoint limits
- **Cron Status**: Last execution times for refresh-stores, cleanup-tokens
- **Maintenance Mode**: Toggle with custom message

## 8. Backend Communication

```
┌──────────────────────┐         ┌──────────────────────────────┐
│  Next.js on Vercel   │         │  Hono + tRPC on Railway      │
│                      │         │                              │
│  /api/trpc/[trpc]  ──┼── HTTP ─┼──► /trpc/* (user routers)    │
│  (public proxy)      │         │    AppRouter (14 existing)    │
│                      │         │                              │
│  /api/admin/         │         │  /admin-trpc/*               │
│  [trpc]/route.ts   ──┼── HTTP ─┼──► AdminRouter (new, isolated)│
│  (admin proxy)       │         │    isAdmin middleware         │
│                      │         │                              │
│  middleware.ts ──────┤         │  Shared:                      │
│  (auth gate /admin)  │         │  - CORS (naqiy.app)          │
│                      │         │  - Rate limit by x-forwarded-for│
│  NextAuth ──────────┤         │  - ADMIN_JWT_SECRET verify    │
│  (admin JWT)         │         │                              │
└──────────────────────┘         └──────────────────────────────┘
```

**Key design**: Admin and user tRPC endpoints are **fully isolated** — separate Hono route prefix (`/admin-trpc/*`), separate proxy route (`/api/admin/[trpc]`), separate rate limiting. User-facing procedures are never exposed through the admin proxy. Rate limits on Railway use `x-forwarded-for` header (Vercel forwards real client IP) instead of caller IP.

### New Database Schema: `admin_users` Table

**File**: `backend/src/db/schema/admin-users.ts`
**Migration**: `0019_admin_users.sql`

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Seed**: One initial `super_admin` user (email from env var `ADMIN_INITIAL_EMAIL`, password hashed with argon2).

### New Backend Environment Variables (Railway)

Added to `backend/src/lib/env.ts` Zod schema:

| Variable | Required | Where | Purpose |
|----------|----------|-------|---------|
| `ADMIN_JWT_SECRET` | Yes | Railway (preview + production) | HS256 verification of admin tokens from NextAuth |
| `ADMIN_INITIAL_EMAIL` | Yes (seed only) | Railway | Initial super_admin email for seed |

### New Backend Routers (AdminRouter — isolated)

Mounted on Hono at `/admin-trpc/*` with `isAdmin` middleware gate.

- `admin.stats` — Dashboard KPIs and aggregations
- `admin.products` — Product CRUD with admin overrides
- `admin.users` — User management (RBAC-enforced per procedure)
- `admin.events` — Event timeline queries
- `admin.articles` — Blog CMS CRUD + R2 upload URLs
- `admin.releases` — Build/OTA read-only (v1)
- `admin.stores` — Store management
- `admin.database` — Table stats, predefined queries (read-only)
- `admin.settings` — Feature flags, config CRUD

### Backend Middleware: `isAdmin` and `isSuperAdmin`

Added to `backend/src/trpc/trpc.ts`, following the existing `protectedProcedure`/`premiumProcedure` pattern:

```typescript
// Validates x-admin-token header using ADMIN_JWT_SECRET (HS256)
// Sets ctx.admin = { id, email, role }
const adminProcedure = t.procedure.use(isAdmin);

// Extends adminProcedure — rejects if role !== 'super_admin'
const superAdminProcedure = adminProcedure.use(isSuperAdmin);
```

### Backend `createContext` Extension

`backend/src/trpc/context.ts` extended to read `x-admin-token` from request headers and pass it through context. The `isAdmin` middleware verifies it via `jsonwebtoken.verify(token, ADMIN_JWT_SECRET)`.

### Auth Flow

1. Admin navigates to `naqiy.app/admin`
2. `middleware.ts` (project root) checks NextAuth JWT session — matcher: `/admin/:path*`
3. No session → redirect to `/admin/login`
4. Login: NextAuth credentials provider → HTTP call to backend `POST /admin-trpc/admin.auth.login` → verify against `admin_users` table (argon2)
5. Session: NextAuth JWT with `{ id, email, role }` — 24h expiry, signed with `NEXTAUTH_SECRET`
6. Admin tRPC proxy (`/api/admin/[trpc]`): Signs a short-lived token (5min) with `ADMIN_JWT_SECRET`, injects as `x-admin-token` header
7. Backend `isAdmin` middleware: Verifies `x-admin-token` using `ADMIN_JWT_SECRET` (HS256), extracts `{ id, email, role }`

### RBAC Permission Matrix

| Router / Procedure | `super_admin` | `editor` | `viewer` |
|-------------------|:---:|:---:|:---:|
| `admin.stats.*` | RW | R | R |
| `admin.products.list/get` | R | R | R |
| `admin.products.update/override` | RW | RW | - |
| `admin.products.export` | RW | RW | R |
| `admin.users.list/get` | R | R | R |
| `admin.users.ban/resetPassword` | RW | - | - |
| `admin.users.delete` (GDPR) | RW | - | - |
| `admin.events.*` | R | R | R |
| `admin.articles.*` | RW | RW | R |
| `admin.releases.*` | R | R | R |
| `admin.stores.list/get` | R | R | R |
| `admin.stores.update` | RW | RW | - |
| `admin.database.*` | R | R | R |
| `admin.settings.*` | RW | - | - |

**Enforcement**: Each procedure uses either `adminProcedure` (any role), `editorProcedure` (editor + super_admin), or `superAdminProcedure` (super_admin only). Viewer gets read-only via `adminProcedure` + explicit write-guard in the procedure body.

## 9. Testing Strategy

### 9.1 Test Pyramid

| Level | Tool | Target | Coverage Goal |
|-------|------|--------|---------------|
| Unit | Vitest | Utils, hooks, transformations, Zod schemas | >90% |
| Component | Vitest + Testing Library | UI components in isolation | Critical paths |
| Integration | Vitest + MSW | tRPC client ↔ mock server responses | All admin routers |
| E2E | Playwright | Landing flow, admin CRUD workflows | Happy paths + edge |
| Visual | Playwright screenshots | Landing at 3 breakpoints | Regression baseline |

### 9.2 Test Structure

```
__tests__/
├── unit/
│   ├── lib/                    # Utils, constants, helpers
│   └── hooks/                  # Custom hooks
├── components/
│   ├── landing/                # Landing section tests
│   └── admin/                  # Admin component tests
├── integration/
│   └── trpc/                   # tRPC client integration
└── setup.ts                    # Test setup (MSW, providers)

e2e/
├── landing.spec.ts             # Landing page flow
├── admin-auth.spec.ts          # Login/logout flow
├── admin-products.spec.ts      # Product CRUD
├── admin-users.spec.ts         # User management
└── admin-articles.spec.ts      # Blog CMS
```

### 9.3 TDD Protocol

1. Write failing test for the feature/component
2. Implement minimum code to pass
3. Refactor while keeping tests green
4. Repeat for each module

## 10. Security (DevSecOps)

| Concern | Mitigation |
|---------|-----------|
| Authentication | NextAuth v5 + JWT, 24h session max, CSRF protection |
| Authorization | RBAC enforced at procedure level: `adminProcedure`, `editorProcedure`, `superAdminProcedure` (see §8 Permission Matrix) |
| Rate Limiting | middleware.ts + backend per-endpoint limits keyed by `x-forwarded-for` |
| CSP | Strict Content-Security-Policy headers in next.config.ts |
| CORS | Backend: only naqiy.app origin |
| Secrets | Vercel env vars, never in code, `.env*.local` in .gitignore |
| Input Validation | Zod on all forms, server-side re-validation |
| XSS | Tiptap output sanitization (DOMPurify) |
| SQL Injection | Drizzle ORM (parameterized queries) — no raw SQL |
| Dependency Audit | `pnpm audit` in CI pipeline |
| Admin Access Log | All admin actions logged with user, timestamp, action |

## 11. Performance Targets

| Metric | Target | How |
|--------|--------|-----|
| LCP (Landing) | <1.5s | SSG + Image optimization + font preload |
| FID | <50ms | Server Components, minimal client JS |
| CLS | <0.05 | next/font, next/image with dimensions |
| TTI (Admin) | <2s | Code splitting per route, lazy chart loading |
| Table render | <200ms | Server-side pagination, virtualized rows |
| Bundle (Marketing) | <150KB gzipped | Tree shaking, no admin code loaded |

## 12. Deployment

- **Vercel Project**: Existing `prj_eTmn5FWtUrvWAiOW2bGlqAwDHCRM` (team `team_XhiPiQHLI1Gkp0PUUJuyvCv3`)
- **Root Directory**: `web/` (configured in Vercel project settings)
- **Domain**: `naqiy.app` (Cloudflare DNS → cname.vercel-dns.com)
- **Preview**: Every PR → automatic preview URL
- **Vercel Env Variables**: `BACKEND_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_JWT_SECRET`
- **Railway Env Variables (new)**: `ADMIN_JWT_SECRET`, `ADMIN_INITIAL_EMAIL` (same secret value as Vercel)
- **CI**: GitHub Actions (lint → typecheck → test → build → deploy)

## 13. Migration Plan

1. Create `web/` directory with Next.js 16 scaffold
2. Move `vitrine/privacy/` and `vitrine/terms/` content into Next.js pages
3. Update Vercel project root directory from `vitrine/` to `web/`
4. Keep `vitrine/` as archive until web/ is verified
5. Update `vercel.json` redirects in new project
6. DNS: No changes needed (same Vercel project, same domain)

## 14. ISR Revalidation Strategy

Blog pages use ISR with `revalidate = 3600` (1h fallback). On-demand revalidation ensures fresh content immediately after publish:

1. Admin publishes/unpublishes article via `admin.articles.publish` router
2. Backend calls `POST https://naqiy.app/api/revalidate` with `{ secret: REVALIDATION_SECRET, paths: ['/', '/blog', '/blog/[slug]'] }`
3. Next.js API route validates secret and calls `revalidatePath()` for each path
4. Landing page blog section + blog list + article page are instantly fresh

**Environment**: `REVALIDATION_SECRET` added to both Vercel and Railway env vars.

## 15. Out of Scope (Deferred)

- Mobile app changes (no impact)
- Backend migration to Vercel (stays on Railway)
- Turborepo monorepo setup (YAGNI for now)
- Multi-language landing (FR only initially, i18n later)
- Real-time WebSocket dashboard (polling sufficient for v1)
- Payment integration in web (RevenueCat handles mobile)
