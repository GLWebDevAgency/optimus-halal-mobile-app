# Feature Flags System — Design Spec

## Goal

Build a complete, production-grade feature flags system for Naqiy — covering progressive rollout, A/B testing (simple), user targeting, and kill switches — fully custom on PostgreSQL + Redis + tRPC, with admin dashboard management and mobile poll-based sync.

## Architecture

Full custom system using existing infrastructure: PostgreSQL (persistence + rules), Redis (2-level cache: global + per-user), tRPC router (public evaluation + admin CRUD), MMKV (mobile offline cache). The evaluation engine runs server-side, returning resolved flag values per user. Mobile polls every 5 minutes and merges with hardcoded defaults for zero-downtime fallback.

## Tech Stack

- **Database**: PostgreSQL (Drizzle ORM) — 2 tables: `feature_flags`, `flag_user_overrides`
- **Cache**: Redis (ioredis) — `flags:global` (TTL 60s) + `flags:resolved:{userId}` (TTL 300s)
- **API**: tRPC v11 — `featureFlags` router (public + admin procedures)
- **Admin UI**: Next.js + shadcn/ui — flags list page + detail sheet
- **Mobile**: Expo — `useRemoteFlags` hook + MMKV persist + Zustand store update
- **Hashing**: FNV-1a deterministic hash for sticky rollout allocation

---

## 1. Data Model

### Table: `feature_flags`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | |
| key | VARCHAR(100) | UNIQUE, NOT NULL | Machine name (e.g. `marketplaceEnabled`) |
| label | VARCHAR(200) | NOT NULL | Human label (e.g. "Marketplace") |
| description | TEXT | nullable | Admin-facing description |
| flag_type | VARCHAR(20) | NOT NULL, default `'boolean'` | `boolean`, `percentage`, `variant` |
| enabled | BOOLEAN | NOT NULL, default false | Global kill switch |
| default_value | JSONB | NOT NULL, default `'false'` | Value when no rule matches |
| rollout_percentage | INT | CHECK 0-100, default 100 | % of users who get `true` |
| variants | JSONB | nullable | Array of variant names for A/B |
| rules | JSONB | NOT NULL, default `'[]'` | Targeting rules array |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: UNIQUE on `key`, partial index on `enabled = true`.

### Table: `flag_user_overrides`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | |
| flag_id | UUID | FK → feature_flags(id) ON DELETE CASCADE | |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | |
| value | JSONB | NOT NULL | Override value |
| reason | VARCHAR(200) | nullable | Why this override exists |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Constraints**: UNIQUE (flag_id, user_id).
**Indexes**: B-tree on `user_id`, B-tree on `flag_id`.

### Rules JSONB Schema

```json
[
  {
    "attribute": "tier",          // tier | madhab | platform | appVersion
    "operator": "eq",             // eq | neq | in | notIn | gte | lte | semverGte | semverLte
    "value": "premium"            // string | string[] | number
  }
]
```

Rules are evaluated with AND logic — all rules must match for the flag to activate. Phase 2 will add: `city`, `country`, `totalScans`, `currentStreak`, `accountAge`.

---

## 2. Evaluation Engine

### Service: `flag-evaluation.service.ts`

**Input**: `userId`, `context` (tier, madhab, platform, appVersion)

**Algorithm** (per flag):
1. If `enabled === false` → return `default_value` (kill switch OFF)
2. Check `flag_user_overrides` for this userId → if found, return override `value`
3. Evaluate `rules` array (AND logic) against user context → if any rule fails, return `default_value`
4. If `flag_type === 'percentage'` → `fnv1a(key + userId) % 100 < rollout_percentage` → true/false
5. If `flag_type === 'variant'` → `variants[fnv1a(key + userId) % variants.length]`
6. Return `default_value`

### FNV-1a Hash (sticky allocation)

```typescript
function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash;
}
```

Deterministic: same userId + flagKey = same bucket always. No DB storage needed for allocation.

### Redis Cache Strategy

| Key | TTL | Invalidation |
|-----|-----|-------------|
| `flags:global` | 60s | On any flag CRUD operation |
| `flags:resolved:{userId}` | 300s | On flag CRUD or override change |

**Fallback**: If Redis is down, query DB directly (same pattern as existing `resolveSubscriptionTier`).

---

## 3. tRPC Router: `featureFlags`

### Public Procedures

| Procedure | Input | Output | Description |
|-----------|-------|--------|-------------|
| `getForUser` | `{ context: { platform, appVersion } }` | `Record<string, boolean \| string>` | Resolved flags for authenticated user |

**Note**: `userId` comes from auth context (protectedProcedure). `tier` and `madhab` are fetched server-side from the user record — not sent by the client (prevents spoofing).

### Admin Procedures

| Procedure | Input | Output | Description |
|-----------|-------|--------|-------------|
| `list` | `{ search?, enabled?, flagType? }` | `{ items, total }` | List all flags with filters |
| `getById` | `{ id }` | Flag + overrides | Full flag detail |
| `create` | `{ key, label, ... }` | Flag | Create new flag |
| `update` | `{ id, ...partial }` | Flag | Update flag (rules, %, etc.) |
| `delete` | `{ id }` | `{ success }` | Delete flag |
| `toggle` | `{ id, enabled }` | Flag | Quick enable/disable |
| `setOverride` | `{ flagId, userId, value, reason? }` | Override | Add/update user override |
| `removeOverride` | `{ flagId, userId }` | `{ success }` | Remove user override |
| `bulkOverride` | `{ flagId, userIds[], value, reason? }` | `{ count }` | Bulk add overrides (beta testers) |

All admin procedures use `adminProcedure` middleware. Mutations invalidate Redis cache. All mutations log via `logger.info`.

---

## 4. Admin Dashboard UI

### Page: `/admin/flags`

- **Header**: Title "Feature Flags" + count + "Créer un flag" button
- **Filters**: Badge toggle (Tous / Actifs / Inactifs) + search input
- **Table columns**: Label, Key, Type, Rollout %, Rules count, Statut (toggle switch), Dernière MAJ
- **Row actions**: Toggle switch inline, click row → open detail sheet

### Sheet: Flag Detail

- **Sections**:
  1. **Infos générales** — label, key (readonly after creation), description, type, enabled toggle
  2. **Rollout** — percentage slider (0-100), variants editor (if type=variant)
  3. **Règles de ciblage** — dynamic form: attribute dropdown + operator dropdown + value input, add/remove rules
  4. **Overrides utilisateurs** — table of userId + value + reason, add/remove, bulk import field
- **Actions**: Sauvegarder, Supprimer (with ConfirmDialog)

### UX Patterns

- Same patterns as existing admin pages (stores, products): Card + Table + pagination
- Toggle switch for quick enable/disable without opening sheet
- Badge colors: boolean=default, percentage=secondary, variant=outline
- ConfirmDialog for destructive actions (delete flag, remove overrides)

---

## 5. Mobile Integration

### Hook: `useRemoteFlags`

```typescript
// Fetches flags on mount + every 5 minutes
// Persists to MMKV for instant startup
// Merges with defaultFeatureFlags (local always wins if remote unavailable)
```

**Flow**:
1. App starts → read MMKV cached flags → update Zustand store immediately (0ms)
2. Fetch `featureFlags.getForUser` with device context
3. On success → update Zustand store + write to MMKV
4. Set 5-minute interval for re-fetch
5. On fetch error → keep current flags (MMKV cache or defaults)

### Store Update

Modify `useFeatureFlagsStore` to:
- Accept remote flags merge
- Keep `isFeatureEnabled` API identical (zero breaking change)
- Add `lastFetchedAt` timestamp
- Add `isRemoteLoaded` boolean

### Context Sent to Backend

```typescript
{
  platform: Platform.OS,        // "ios" | "android"
  appVersion: Application.nativeApplicationVersion  // "2.1.0"
}
```

`tier` and `madhab` are NOT sent — backend reads them from the user's DB record to prevent client-side spoofing.

---

## 6. Seed Strategy

The 17 existing hardcoded flags from `defaultFeatureFlags` will be seeded into the `feature_flags` table on first deploy, preserving their current enabled/disabled state. This ensures:

- Zero breaking change at deploy time
- Mobile apps with old versions still work (local defaults match DB)
- Admin can immediately start managing flags from the dashboard

After the system is live and stable, the hardcoded `defaultFeatureFlags` object becomes a fallback-only safety net — the source of truth moves to the database.

---

## 7. Security

- **Admin procedures**: `adminProcedure` middleware (existing)
- **Flag deletion**: super_admin only
- **User context**: Server-side resolution (tier, madhab from DB, not client)
- **Rate limiting**: Same `/trpc/admin.*` rate limit (60/min)
- **Audit logging**: All mutations logged with `logger.info`
- **Cache invalidation**: Immediate on mutation (no stale flags after admin change)

---

## 8. Phase 2 (Future)

- Geo targeting (city, country, coordinates)
- Behavioral targeting (totalScans, streak, accountAge)
- A/B metrics dashboard with statistical significance
- Flag scheduling (auto-enable at date/time)
- Flag dependencies (flag A requires flag B)
- Push-based sync for critical kill switches
- Flag audit history table
