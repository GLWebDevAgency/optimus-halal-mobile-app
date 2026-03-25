# Admin Dashboard Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the admin dashboard from a 4/10 consultative facade into a functional operational cockpit with solid architectural foundations, analytics overview, complete waitlist management, and user management refonte.

**Architecture:** In-place refonte of existing `web/src/app/admin/`. Backend tRPC enriched with dedicated admin endpoints. Recharts for data visualization. Compact icon sidebar à la Linear.

**Tech Stack:** Next.js 15 (App Router) · tRPC v11 · Drizzle ORM · Recharts · shadcn/ui · Tailwind CSS v4 · Phosphor Icons

**Spec:** `docs/superpowers/specs/2026-03-25-admin-dashboard-phase1-design.md`
**Audit:** `docs/superpowers/reports/2026-03-25-admin-dashboard-world-class-audit.md`

---

## File Structure

### Backend — Create
| File | Responsibility |
|------|---------------|
| `backend/src/trpc/routers/admin-waitlist.ts` | Waitlist sub-router: list, stats, delete, deleteBulk, export |

### Backend — Modify
| File | Change |
|------|--------|
| `backend/src/trpc/routers/admin.ts` | Add `dashboardStats`, `getUserDetail`, `updateUser`; enrich `listUsers` return |
| `backend/src/trpc/router.ts` | Merge waitlist sub-router into admin |

### Web — Create
| File | Responsibility |
|------|---------------|
| `web/src/hooks/use-debounced-value.ts` | Generic debounce hook (replaces broken setTimeout patterns) |
| `web/src/components/admin/kpi-card.tsx` | Reusable KPI card component |
| `web/src/components/admin/area-chart-card.tsx` | Recharts area chart wrapper with period toggle |
| `web/src/components/admin/bar-chart-card.tsx` | Recharts bar chart wrapper |
| `web/src/components/admin/data-table.tsx` | Generic admin table with selection, sorting, pagination |
| `web/src/components/admin/confirm-dialog.tsx` | Reusable AlertDialog for destructive actions |
| `web/src/components/admin/user-detail-sheet.tsx` | Sheet panel for user profile + actions |
| `web/src/app/admin/waitlist/page.tsx` | Complete waitlist management page |

### Web — Modify
| File | Change |
|------|--------|
| `web/src/lib/admin-auth.tsx` | Fix hydration (mounted state instead of typeof window) |
| `web/src/app/admin/layout.tsx` | Metadata isolation, remove double TRPCProvider, remove decorative elements, icon sidebar refonte, breadcrumb, avatar dropdown |
| `web/src/app/admin/login/page.tsx` | Add `dynamic = "force-dynamic"`, SSR form rendering |
| `web/src/app/admin/page.tsx` | Complete rewrite: 6 KPI cards + 2 area charts via admin.dashboardStats |
| `web/src/app/admin/users/page.tsx` | Refonte: enriched table, debounce fix, bulk actions, click → Sheet detail |
| `web/package.json` | Add `recharts` dependency |

---

## Task 1: Install Recharts + Create useDebouncedValue hook

**Files:**
- Modify: `web/package.json`
- Create: `web/src/hooks/use-debounced-value.ts`

- [ ] **Step 1: Install recharts**

```bash
cd web && pnpm add recharts
```

- [ ] **Step 2: Create the debounce hook**

Create `web/src/hooks/use-debounced-value.ts`:

```typescript
"use client";

import { useState, useEffect } from "react";

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

- [ ] **Step 3: Verify build**

```bash
cd web && pnpm build
```
Expected: Build succeeds with recharts resolved.

- [ ] **Step 4: Commit**

```bash
git add web/package.json web/pnpm-lock.yaml web/src/hooks/use-debounced-value.ts
git commit -m "feat(web): add recharts + useDebouncedValue hook"
```

---

## Task 2: Fix architectural foundations

**Files:**
- Modify: `web/src/lib/admin-auth.tsx`
- Modify: `web/src/app/admin/login/page.tsx`
- Modify: `web/src/app/admin/layout.tsx`

- [ ] **Step 1: Fix AdminAuthProvider hydration**

In `web/src/lib/admin-auth.tsx`, replace `typeof window === "undefined"` pattern with a proper `mounted` state:

```typescript
// Replace the isLoading logic:
// OLD: const isLoading = typeof window === "undefined";
// NEW:
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
// Then use: const isLoading = !mounted || isVerifying;
```

The key change: `isLoading` should be `!mounted` initially (both SSR and first client render), then switch to `!isVerifying` after mount. This prevents the SSR spinner AND avoids hydration mismatch.

- [ ] **Step 2: Fix login page SSR**

In `web/src/app/admin/login/page.tsx`, add at the top of the file (after imports, before component):

```typescript
export const dynamic = "force-dynamic";
```

This ensures the login page renders its form on the server, not a spinner.

- [ ] **Step 3: Fix admin layout — metadata isolation**

In `web/src/app/admin/layout.tsx`, add metadata export to prevent landing metadata leaking:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin — Naqiy", template: "%s | Admin Naqiy" },
  robots: { index: false, follow: false },
};
```

- [ ] **Step 4: Fix admin layout — remove double TRPCProvider**

In `web/src/app/admin/layout.tsx`, remove the `TRPCProvider` wrapper in `AdminLayout`. The root layout already provides it. Keep only `AdminAuthProvider`.

Before:
```tsx
<TRPCProvider>
  <AdminAuthProvider>{children}</AdminAuthProvider>
</TRPCProvider>
```

After:
```tsx
<AdminAuthProvider>{children}</AdminAuthProvider>
```

- [ ] **Step 5: Fix admin layout — remove decorative elements**

In `web/src/app/admin/layout.tsx` (`AdminShell` component):
1. Remove the non-functional search `<Input>` from the header
2. Remove the non-functional notifications `<Button>` from the header
3. Keep: SidebarTrigger, avatar with logout

- [ ] **Step 6: Verify build + lint**

```bash
cd web && pnpm lint && pnpm build
```
Expected: Both pass. Admin pages now have proper metadata and no SSR spinner on login.

- [ ] **Step 7: Commit**

```bash
git add web/src/lib/admin-auth.tsx web/src/app/admin/layout.tsx web/src/app/admin/login/page.tsx
git commit -m "fix(web): admin architectural foundations — hydration, metadata, decorative cleanup"
```

---

## Task 3: Admin layout refonte — Icon sidebar compacte

**Files:**
- Modify: `web/src/app/admin/layout.tsx`

- [ ] **Step 1: Refonte the sidebar to compact icon mode**

Rewrite the `AdminShell` component in `web/src/app/admin/layout.tsx`. The sidebar should:

1. Use shadcn `SidebarProvider` with `defaultOpen={false}` (collapsed by default)
2. Sidebar width: 56px collapsed (icons only), 220px expanded
3. `collapsible="icon"` on the `Sidebar` component
4. Each nav item: icon (size-5) + label (hidden when collapsed, visible when expanded)
5. Active state: gold accent (bg-gold/10, text-gold, left border gold 2px)
6. Dark theme: bg-zinc-950, border-zinc-800

Navigation items (in order):
```typescript
const navItems = [
  { icon: SquaresFour, label: "Vue d'ensemble", href: "/admin", segment: null },
  { icon: EnvelopeSimple, label: "Waitlist", href: "/admin/waitlist", segment: "waitlist" },
  { icon: Users, label: "Utilisateurs", href: "/admin/users", segment: "users" },
  { icon: Package, label: "Produits", href: "/admin/products", segment: "products" },
  { icon: Storefront, label: "Magasins", href: "/admin/stores", segment: "stores" },
  { icon: FileText, label: "Articles", href: "/admin/articles", segment: "articles" },
  { icon: Bell, label: "Alertes", href: "/admin/alerts", segment: "alerts" },
  { icon: GearSix, label: "Paramètres", href: "/admin/settings", segment: "settings" },
];
```

Header should contain:
- SidebarTrigger (hamburger)
- Breadcrumb showing current page name (derive from pathname)
- Avatar with `DropdownMenu`: admin name, email, role badge, separator, sign out button

The sidebar footer should show the Naqiy logo (small, centered when collapsed).

- [ ] **Step 2: Add EnvelopeSimple to Phosphor imports**

Add `EnvelopeSimple` to the icon imports from `@phosphor-icons/react`.

- [ ] **Step 3: Verify build + visual check**

```bash
cd web && pnpm build
```

Also run `pnpm dev` and visually verify:
- Sidebar is 56px collapsed with icons
- Hovering/toggling expands to 220px with labels
- Active page has gold highlight
- Header shows breadcrumb + avatar dropdown
- Login page still works without sidebar

- [ ] **Step 4: Commit**

```bash
git add web/src/app/admin/layout.tsx
git commit -m "feat(web): admin icon sidebar compacte — Linear style, dark mode, breadcrumb"
```

---

## Task 4: Backend — admin.dashboardStats endpoint

**Files:**
- Modify: `backend/src/trpc/routers/admin.ts`

- [ ] **Step 1: Add dashboardStats procedure**

In `backend/src/trpc/routers/admin.ts`, add a new `dashboardStats` query using `adminProcedure`:

```typescript
dashboardStats: adminProcedure.query(async ({ ctx }) => {
  const db = ctx.db;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Execute all queries in parallel
  const [
    totalUsersResult,
    usersLastWeek,
    usersPrevWeek,
    totalWaitlistResult,
    waitlistTodayResult,
    scansTodayResult,
    scansYesterdayResult,
    halalDistResult,
    totalStoresResult,
    storesEnrichedResult,
    premiumCountResult,
    signupsByDayResult,
    waitlistByDayResult,
    scansByDayResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.isActive, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(and(eq(users.isActive, true), gt(users.createdAt, sevenDaysAgo))),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(and(eq(users.isActive, true), gt(users.createdAt, fourteenDaysAgo), lte(users.createdAt, sevenDaysAgo))),
    db.select({ count: sql<number>`count(*)::int` }).from(waitlistLeads),
    db.select({ count: sql<number>`count(*)::int` }).from(waitlistLeads).where(gt(waitlistLeads.createdAt, todayStart)),
    db.select({ count: sql<number>`count(*)::int` }).from(scans).where(gt(scans.scannedAt, todayStart)),
    // Yesterday same hour window
    db.select({ count: sql<number>`count(*)::int` }).from(scans).where(and(
      gt(scans.scannedAt, new Date(todayStart.getTime() - 24 * 60 * 60 * 1000)),
      lte(scans.scannedAt, new Date(now.getTime() - 24 * 60 * 60 * 1000))
    )),
    // Halal distribution
    db.select({
      status: products.halalStatus,
      count: sql<number>`count(*)::int`,
    }).from(products).groupBy(products.halalStatus),
    db.select({ count: sql<number>`count(*)::int` }).from(stores).where(eq(stores.isActive, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(stores).where(and(eq(stores.isActive, true), isNotNull(stores.googlePlaceId))),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.subscriptionTier, "premium")),
    // Signups by day (30d)
    db.select({
      date: sql<string>`to_char(created_at, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    }).from(users).where(gt(users.createdAt, thirtyDaysAgo)).groupBy(sql`to_char(created_at, 'YYYY-MM-DD')`).orderBy(sql`to_char(created_at, 'YYYY-MM-DD')`),
    // Waitlist by day (30d)
    db.select({
      date: sql<string>`to_char(created_at, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    }).from(waitlistLeads).where(gt(waitlistLeads.createdAt, thirtyDaysAgo)).groupBy(sql`to_char(created_at, 'YYYY-MM-DD')`).orderBy(sql`to_char(created_at, 'YYYY-MM-DD')`),
    // Scans by day (30d)
    db.select({
      date: sql<string>`to_char(scanned_at, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    }).from(scans).where(gt(scans.scannedAt, thirtyDaysAgo)).groupBy(sql`to_char(scanned_at, 'YYYY-MM-DD')`).orderBy(sql`to_char(scanned_at, 'YYYY-MM-DD')`),
  ]);

  const totalUsers = totalUsersResult[0]!.count;
  const usersTrend = usersPrevWeek[0]!.count > 0
    ? Math.round(((usersLastWeek[0]!.count - usersPrevWeek[0]!.count) / usersPrevWeek[0]!.count) * 100)
    : 0;

  const scansToday = scansTodayResult[0]!.count;
  const scansYesterday = scansYesterdayResult[0]!.count;
  const scansTrend = scansYesterday > 0
    ? Math.round(((scansToday - scansYesterday) / scansYesterday) * 100)
    : 0;

  const totalPremium = premiumCountResult[0]!.count;
  const premiumRate = totalUsers > 0 ? Math.round((totalPremium / totalUsers) * 1000) / 10 : 0;

  const halalMap: Record<string, number> = { halal: 0, haram: 0, doubtful: 0, unknown: 0 };
  for (const row of halalDistResult) {
    halalMap[row.status ?? "unknown"] = row.count;
  }

  // Merge signups + waitlist by day into one array
  const signupsByDay = mergeByDay(signupsByDayResult, waitlistByDayResult, thirtyDaysAgo, now);

  return {
    totalUsers,
    usersTrend,
    totalWaitlist: totalWaitlistResult[0]!.count,
    waitlistToday: waitlistTodayResult[0]!.count,
    scansToday,
    scansTrend,
    totalProducts: halalMap.halal + halalMap.haram + halalMap.doubtful + halalMap.unknown,
    halalDistribution: halalMap,
    totalStores: totalStoresResult[0]!.count,
    storesEnriched: storesEnrichedResult[0]!.count,
    premiumRate,
    signupsByDay,
    scansByDay: scansByDayResult.map((r) => ({ date: r.date, count: r.count })),
  };
}),
```

Note: The `mergeByDay` helper fills in zero-count days and merges users + waitlist series. Implement as a private function above the router:

```typescript
function mergeByDay(
  userRows: Array<{ date: string; count: number }>,
  waitlistRows: Array<{ date: string; count: number }>,
  from: Date,
  to: Date,
): Array<{ date: string; users: number; waitlist: number }> {
  const userMap = new Map(userRows.map((r) => [r.date, r.count]));
  const waitlistMap = new Map(waitlistRows.map((r) => [r.date, r.count]));
  const result: Array<{ date: string; users: number; waitlist: number }> = [];

  const current = new Date(from);
  while (current <= to) {
    const dateStr = current.toISOString().slice(0, 10);
    result.push({
      date: dateStr,
      users: userMap.get(dateStr) ?? 0,
      waitlist: waitlistMap.get(dateStr) ?? 0,
    });
    current.setDate(current.getDate() + 1);
  }
  return result;
}
```

Add required imports: `gt`, `lte`, `and`, `isNotNull` from drizzle-orm, `waitlistLeads` from schema.

- [ ] **Step 2: Verify backend builds**

```bash
cd backend && pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/trpc/routers/admin.ts
git commit -m "feat(backend): admin.dashboardStats — 6 KPIs + trends + 30-day chart data"
```

---

## Task 5: Backend — admin waitlist sub-router

**Files:**
- Create: `backend/src/trpc/routers/admin-waitlist.ts`
- Modify: `backend/src/trpc/router.ts`

- [ ] **Step 1: Create admin-waitlist.ts**

Create `backend/src/trpc/routers/admin-waitlist.ts` with 5 procedures:

```typescript
import { z } from "zod";
import { router, adminProcedure } from "../trpc.js";
import { waitlistLeads } from "../../db/schema/index.js";
import { eq, ilike, desc, asc, gt, sql, and, inArray } from "drizzle-orm";
import { logger } from "../../lib/logger.js";

export const adminWaitlistRouter = router({
  list: adminProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
      search: z.string().max(320).optional(),
      source: z.enum(["landing", "marketplace", "navbar", "cta"]).optional(),
      sortBy: z.enum(["createdAt", "email", "source"]).default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, source, sortBy, sortOrder } = input;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (search) conditions.push(ilike(waitlistLeads.email, `%${search}%`));
      if (source) conditions.push(eq(waitlistLeads.source, source));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const sortColumn = {
        createdAt: waitlistLeads.createdAt,
        email: waitlistLeads.email,
        source: waitlistLeads.source,
      }[sortBy];
      const orderFn = sortOrder === "asc" ? asc : desc;

      const [items, totalResult] = await Promise.all([
        ctx.db.select().from(waitlistLeads).where(where).orderBy(orderFn(sortColumn)).limit(limit).offset(offset),
        ctx.db.select({ count: sql<number>`count(*)::int` }).from(waitlistLeads).where(where),
      ]);

      const total = totalResult[0]!.count;
      return { items, total, page, totalPages: Math.ceil(total / limit) };
    }),

  stats: adminProcedure.query(async ({ ctx }) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalResult, todayResult, bySourceResult, byDayResult, utmTopResult] = await Promise.all([
      ctx.db.select({ count: sql<number>`count(*)::int` }).from(waitlistLeads),
      ctx.db.select({ count: sql<number>`count(*)::int` }).from(waitlistLeads).where(gt(waitlistLeads.createdAt, todayStart)),
      ctx.db.select({ source: waitlistLeads.source, count: sql<number>`count(*)::int` }).from(waitlistLeads).groupBy(waitlistLeads.source),
      ctx.db.select({ date: sql<string>`to_char(created_at, 'YYYY-MM-DD')`, count: sql<number>`count(*)::int` }).from(waitlistLeads).where(gt(waitlistLeads.createdAt, thirtyDaysAgo)).groupBy(sql`to_char(created_at, 'YYYY-MM-DD')`).orderBy(sql`to_char(created_at, 'YYYY-MM-DD')`),
      ctx.db.select({ utmSource: waitlistLeads.utmSource, count: sql<number>`count(*)::int` }).from(waitlistLeads).where(sql`utm_source IS NOT NULL`).groupBy(waitlistLeads.utmSource).orderBy(desc(sql`count(*)`)).limit(10),
    ]);

    return {
      total: totalResult[0]!.count,
      today: todayResult[0]!.count,
      bySource: bySourceResult,
      byDay: byDayResult,
      utmTop: utmTopResult,
    };
  }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.adminRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Action réservée aux super admins" });
      }
      await ctx.db.delete(waitlistLeads).where(eq(waitlistLeads.id, input.id));
      logger.info({ adminId: ctx.userId, deletedId: input.id }, "Waitlist lead deleted");
      return { success: true as const };
    }),

  deleteBulk: adminProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.adminRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Action réservée aux super admins" });
      }
      const result = await ctx.db.delete(waitlistLeads).where(inArray(waitlistLeads.id, input.ids));
      logger.info({ adminId: ctx.userId, count: input.ids.length }, "Waitlist leads bulk deleted");
      return { deleted: input.ids.length };
    }),

  export: adminProcedure
    .input(z.object({ source: z.enum(["landing", "marketplace", "navbar", "cta"]).optional() }))
    .query(async ({ ctx, input }) => {
      const where = input.source ? eq(waitlistLeads.source, input.source) : undefined;
      const rows = await ctx.db.select().from(waitlistLeads).where(where).orderBy(desc(waitlistLeads.createdAt));

      const header = "email,source,locale,utm_source,utm_medium,utm_campaign,consent_at,created_at";
      const csvRows = rows.map((r) =>
        [r.email, r.source, r.locale, r.utmSource ?? "", r.utmMedium ?? "", r.utmCampaign ?? "", r.consentAt.toISOString(), r.createdAt.toISOString()].join(",")
      );
      const csv = [header, ...csvRows].join("\n");

      return { data: csv, filename: `waitlist-export-${new Date().toISOString().slice(0, 10)}.csv`, contentType: "text/csv" };
    }),
});
```

Add `TRPCError` import from `@trpc/server`.

- [ ] **Step 2: Register in main router**

In `backend/src/trpc/router.ts`, import and add:

```typescript
import { adminWaitlistRouter } from "./routers/admin-waitlist.js";

// In appRouter, add alongside existing admin router:
adminWaitlist: adminWaitlistRouter,
```

- [ ] **Step 3: Verify backend builds**

```bash
cd backend && pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/trpc/routers/admin-waitlist.ts backend/src/trpc/router.ts
git commit -m "feat(backend): admin waitlist router — list, stats, delete, bulk delete, CSV export"
```

---

## Task 6: Backend — admin.getUserDetail + admin.updateUser

**Files:**
- Modify: `backend/src/trpc/routers/admin.ts`

- [ ] **Step 1: Add getUserDetail procedure**

In `backend/src/trpc/routers/admin.ts`, add:

```typescript
getUserDetail: adminProcedure
  .input(z.object({ userId: z.string().uuid() }))
  .query(async ({ ctx, input }) => {
    const user = await ctx.db.select(safeUserColumns)
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    if (!user[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur introuvable" });

    const [statsResult, recentScansResult, devicesResult, subscriptionResult] = await Promise.all([
      ctx.db.select({
        totalScans: sql<number>`count(*)::int`,
        lastScan: sql<string>`max(scanned_at)`,
      }).from(scans).where(eq(scans.userId, input.userId)),
      ctx.db.select({
        id: scans.id,
        barcode: scans.barcode,
        halalStatus: scans.halalStatus,
        scannedAt: scans.scannedAt,
        productName: products.name,
      }).from(scans)
        .leftJoin(products, eq(scans.barcode, products.barcode))
        .where(eq(scans.userId, input.userId))
        .orderBy(desc(scans.scannedAt))
        .limit(20),
      ctx.db.select().from(devices).where(eq(devices.userId, input.userId)),
      ctx.db.select().from(subscriptions).where(eq(subscriptions.userId, input.userId)).limit(1),
    ]);

    return {
      user: user[0],
      stats: {
        totalScans: statsResult[0]?.totalScans ?? 0,
        lastScan: statsResult[0]?.lastScan ?? null,
      },
      recentScans: recentScansResult,
      devices: devicesResult,
      subscription: subscriptionResult[0] ?? null,
    };
  }),
```

Add imports for `devices`, `subscriptions` from schema if not already imported.

- [ ] **Step 2: Add updateUser mutation**

```typescript
updateUser: adminProcedure
  .input(z.object({
    userId: z.string().uuid(),
    action: z.enum(["ban", "unban", "resetPassword", "changeTier", "deleteGDPR"]),
    tier: z.enum(["free", "premium"]).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    if (ctx.adminRole !== "super_admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Action réservée aux super admins" });
    }

    const user = await ctx.db.select().from(users).where(eq(users.id, input.userId)).limit(1);
    if (!user[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur introuvable" });

    switch (input.action) {
      case "ban":
        await ctx.db.update(users).set({ isActive: false }).where(eq(users.id, input.userId));
        logger.info({ adminId: ctx.userId, targetId: input.userId }, "User banned");
        return { success: true as const, message: "Utilisateur banni" };

      case "unban":
        await ctx.db.update(users).set({ isActive: true }).where(eq(users.id, input.userId));
        logger.info({ adminId: ctx.userId, targetId: input.userId }, "User unbanned");
        return { success: true as const, message: "Utilisateur réactivé" };

      case "changeTier":
        if (!input.tier) throw new TRPCError({ code: "BAD_REQUEST", message: "Tier requis" });
        await ctx.db.update(users).set({ subscriptionTier: input.tier }).where(eq(users.id, input.userId));
        logger.info({ adminId: ctx.userId, targetId: input.userId, tier: input.tier }, "User tier changed");
        return { success: true as const, message: `Tier changé en ${input.tier}` };

      case "resetPassword":
        // Generate reset code and send email (reuse existing reset logic)
        const code = randomBytes(3).toString("hex");
        await ctx.db.update(users).set({
          resetCode: code.toUpperCase(),
          resetCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
          resetAttempts: 0,
        }).where(eq(users.id, input.userId));
        logger.info({ adminId: ctx.userId, targetId: input.userId }, "Password reset initiated");
        return { success: true as const, message: `Code de reset: ${code.toUpperCase()}` };

      case "deleteGDPR":
        // Anonymize user data (GDPR right to erasure)
        await ctx.db.update(users).set({
          email: `deleted-${input.userId.slice(0, 8)}@naqiy.app`,
          displayName: "Utilisateur supprimé",
          isActive: false,
          avatarUrl: null,
        }).where(eq(users.id, input.userId));
        // Delete refresh tokens
        await ctx.db.delete(refreshTokens).where(eq(refreshTokens.userId, input.userId));
        logger.info({ adminId: ctx.userId, targetId: input.userId }, "User GDPR deleted");
        return { success: true as const, message: "Données utilisateur anonymisées (RGPD)" };

      default:
        throw new TRPCError({ code: "BAD_REQUEST", message: "Action inconnue" });
    }
  }),
```

Add import for `randomBytes` from `node:crypto`, `refreshTokens` from schema.

- [ ] **Step 3: Enrich listUsers return**

In the existing `listUsers` procedure, add `lastActiveAt` and `deviceCount` to the select. Use a subquery or left join on `devices`:

The simplest approach: add two SQL subqueries in the select:
```typescript
// In the select columns, add:
lastActiveAt: sql<string>`(SELECT MAX(last_active_at) FROM devices WHERE devices.user_id = users.id)`,
deviceCount: sql<number>`(SELECT COUNT(*)::int FROM devices WHERE devices.user_id = users.id)`,
```

- [ ] **Step 4: Verify backend builds**

```bash
cd backend && pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/trpc/routers/admin.ts
git commit -m "feat(backend): admin getUserDetail, updateUser, enriched listUsers"
```

---

## Task 7: Web — Reusable admin components (KpiCard, AreaChartCard, ConfirmDialog, DataTable)

**Files:**
- Create: `web/src/components/admin/kpi-card.tsx`
- Create: `web/src/components/admin/area-chart-card.tsx`
- Create: `web/src/components/admin/bar-chart-card.tsx`
- Create: `web/src/components/admin/confirm-dialog.tsx`
- Create: `web/src/components/admin/data-table.tsx`

- [ ] **Step 1: Create KpiCard**

Create `web/src/components/admin/kpi-card.tsx`:

A card with: icon, label, value (big), sublabel (trend or secondary), optional onClick to navigate. Trend positive = text-emerald-500, negative = text-red-500.

Props:
```typescript
interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: number; // percentage, positive = good
  href?: string; // clickable → navigate
}
```

Uses shadcn `Card`, `CardContent`. Formats trend with arrow icon (TrendUp/TrendDown from Phosphor).

- [ ] **Step 2: Create AreaChartCard**

Create `web/src/components/admin/area-chart-card.tsx`:

A card wrapping Recharts `AreaChart` with:
- Title + period toggle (7j / 30j)
- Responsive container
- Area fills with gold/emerald/blue gradients (10% opacity)
- Dark mode axis colors (zinc-500)
- Custom tooltip

Props:
```typescript
interface AreaChartCardProps {
  title: string;
  data: Array<Record<string, unknown>>;
  series: Array<{ key: string; label: string; color: string }>;
  xKey: string; // the date field
}
```

- [ ] **Step 3: Create BarChartCard**

Create `web/src/components/admin/bar-chart-card.tsx`:

Same pattern as AreaChartCard but with `BarChart`. Single series typically.

- [ ] **Step 4: Create ConfirmDialog**

Create `web/src/components/admin/confirm-dialog.tsx`:

Wraps shadcn `AlertDialog` with:
```typescript
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string; // default "Confirmer"
  variant?: "destructive" | "default";
  onConfirm: () => void;
  loading?: boolean;
}
```

- [ ] **Step 5: Create DataTable**

Create `web/src/components/admin/data-table.tsx`:

Generic admin table with:
- Column definitions (key, label, render function, sortable boolean)
- Checkbox selection (individual + select all)
- Pagination controls (prev/next + page counter)
- Loading state (skeleton rows)
- Empty state

Props:
```typescript
interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  getId: (item: T) => string;
  onRowClick?: (item: T) => void;
}
```

Uses shadcn `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`, `Checkbox`, `Button`, `Skeleton`.

- [ ] **Step 6: Verify build**

```bash
cd web && pnpm build
```

- [ ] **Step 7: Commit**

```bash
git add web/src/components/admin/
git commit -m "feat(web): reusable admin components — KpiCard, AreaChartCard, BarChartCard, ConfirmDialog, DataTable"
```

---

## Task 8: Web — Dashboard overview refonte

**Files:**
- Modify: `web/src/app/admin/page.tsx`

- [ ] **Step 1: Complete rewrite of the overview page**

Rewrite `web/src/app/admin/page.tsx` to use:
- `trpc.admin.dashboardStats.useQuery()` instead of `stats.global` + `alert.list` + `admin.recentScans`
- 6 `KpiCard` components in a responsive grid (3 cols desktop, 2 tablet, 1 mobile)
- 2 `AreaChartCard` components side by side (1 col on mobile)

KPI cards (in order):
1. Users — icon: Users, value: totalUsers, trend: usersTrend%, href: /admin/users
2. Waitlist — icon: EnvelopeSimple, value: totalWaitlist, subValue: "+{waitlistToday} aujourd'hui", href: /admin/waitlist
3. Scans — icon: Scan, value: scansToday, trend: scansTrend%
4. Produits — icon: Package, value: totalProducts, subValue: "{halal}% halal"
5. Commerces — icon: Storefront, value: totalStores, subValue: "{storesEnriched} enrichis"
6. Premium — icon: Crown, value: "{premiumRate}%", trend: premiumTrend%

Charts:
1. "Inscriptions" — series: users (gold) + waitlist (emerald), data: signupsByDay
2. "Scans" — series: scans (blue), data: scansByDay

Add page metadata:
```typescript
export const metadata = { title: "Vue d'ensemble" };
```

- [ ] **Step 2: Verify build + visual check**

```bash
cd web && pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add web/src/app/admin/page.tsx
git commit -m "feat(web): admin overview refonte — 6 KPI cards + 2 area charts with real data"
```

---

## Task 9: Web — Waitlist management page

**Files:**
- Create: `web/src/app/admin/waitlist/page.tsx`

- [ ] **Step 1: Create the waitlist page**

Create `web/src/app/admin/waitlist/page.tsx` with:

1. **Stats section** (4 KpiCards): total, today, top source, top UTM
2. **Bar chart**: inscriptions/jour 30j using `BarChartCard` + `adminWaitlist.stats`
3. **DataTable**: uses `adminWaitlist.list` with:
   - Columns: checkbox, email, source (badge), UTM source, locale, date
   - Search (email, debounced via `useDebouncedValue`)
   - Source filter (dropdown)
   - Pagination (server-side)
4. **Bulk selection** + "Supprimer sélection" button → `ConfirmDialog` → `adminWaitlist.deleteBulk`
5. **Individual delete**: trash icon per row → `ConfirmDialog` → `adminWaitlist.delete`
6. **Export CSV** button in header → `adminWaitlist.export` → create blob → download

CSV export logic (client-side):
```typescript
const handleExport = async () => {
  const result = await utils.adminWaitlist.export.fetch({ source: sourceFilter });
  const blob = new Blob([result.data], { type: result.contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = result.filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Export téléchargé");
};
```

Toast on success/error for all mutations.

Add page metadata:
```typescript
export const metadata = { title: "Waitlist" };
```

- [ ] **Step 2: Verify build**

```bash
cd web && pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add web/src/app/admin/waitlist/
git commit -m "feat(web): waitlist management page — CRUD, stats, charts, export CSV, bulk delete"
```

---

## Task 10: Web — User detail sheet + Users page refonte

**Files:**
- Create: `web/src/components/admin/user-detail-sheet.tsx`
- Modify: `web/src/app/admin/users/page.tsx`

- [ ] **Step 1: Create UserDetailSheet**

Create `web/src/components/admin/user-detail-sheet.tsx`:

Uses shadcn `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`.

Props:
```typescript
interface UserDetailSheetProps {
  userId: string | null; // null = closed
  onClose: () => void;
}
```

When `userId` is set, fetches `admin.getUserDetail` and displays:
- Header: name, email, tier badge, created date, last active (relative)
- Stats: total scans, last scan, favorite stores, reports
- Recent scans: mini table (barcode, product, verdict, time)
- Devices: list with platform, app version, last active
- Actions (super_admin only):
  - "Changer tier" dropdown (free ↔ premium) → `admin.updateUser({ action: "changeTier", tier })`
  - "Reset mot de passe" button → `admin.updateUser({ action: "resetPassword" })` → toast with reset code
  - "Bannir" / "Débannir" toggle → `admin.updateUser({ action: "ban"/"unban" })`
  - "Supprimer RGPD" button (red, destructive) → `ConfirmDialog` → `admin.updateUser({ action: "deleteGDPR" })`

All mutations use `ConfirmDialog` before execution. Toast on success/error.

- [ ] **Step 2: Refonte users page**

Rewrite `web/src/app/admin/users/page.tsx`:

1. Replace broken debounce with `useDebouncedValue(search, 300)`
2. Use `DataTable` component with columns: email, displayName, tier (badge), totalScans, lastActiveAt (relative time), createdAt
3. Add bulk selection checkbox support
4. Row click → open `UserDetailSheet` with userId
5. Bulk actions dropdown: "Bannir sélection", "Changer tier" → `ConfirmDialog`
6. Keep existing tier filter (free/premium/tous)
7. Add sort options (dropdown): date création, scans, email, dernière activité

Add page metadata:
```typescript
export const metadata = { title: "Utilisateurs" };
```

- [ ] **Step 3: Verify build**

```bash
cd web && pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add web/src/components/admin/user-detail-sheet.tsx web/src/app/admin/users/page.tsx
git commit -m "feat(web): users refonte — detail sheet, bulk actions, enriched table, debounce fix"
```

---

## Task 11: Final verification + cleanup

**Files:**
- Various

- [ ] **Step 1: Run full lint + build**

```bash
cd web && pnpm lint && pnpm build
cd ../backend && pnpm lint && pnpm build
```

Both must pass cleanly.

- [ ] **Step 2: Verify all criteria from spec §9**

Manually check each criterion:
1. ✅ Admin pages have own metadata (check HTML output)
2. ✅ Login renders form in SSR
3. ✅ Sidebar is compact 56px with 8 items
4. ✅ Overview has 6 KPIs + 2 charts
5. ✅ Waitlist page is operational
6. ✅ Users page has detail sheet + actions + bulk
7. ✅ All admin data goes through adminProcedure
8. ✅ Build + lint pass
9. ✅ KPI labels are accurate
10. ✅ No decorative non-functional elements in shell

- [ ] **Step 3: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: admin phase 1 cleanup and final fixes"
```
