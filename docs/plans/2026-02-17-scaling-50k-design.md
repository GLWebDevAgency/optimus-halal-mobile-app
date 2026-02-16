# Scaling Infrastructure — 50K+ Users Design

**Date**: 2026-02-17
**Sprint**: Infrastructure scaling
**Status**: Design review (Table Ronde)

## Problem

Current backend handles ~100 concurrent users. Target: 50K+ active users.
Bottlenecks identified:
1. No connection pooling — 10 direct DB connections max
2. No caching on hot paths — every `store.nearby` hits PostGIS
3. Missing composite indexes for common query patterns

## Architecture Target

```
Mobile App (Expo)
     │
     ▼
mobile-bff × 1-3 (Hono + tRPC, stateless)
     │
  ┌──┴──┐
  ▼     ▼
Redis  PgBouncer (transaction mode, pool 25)
(cache   │
+queue)  ▼
      postgis-db (PostgreSQL 17 + PostGIS 3.5)
```

## Axe 1 — PgBouncer Connection Pooling

### Why
- `postgres-js` pool `max: 10` = 10 simultaneous DB connections
- At 50K users with 3 replicas, that's 30 connections competing
- PgBouncer in transaction mode: 25 server connections serve 1000+ client connections
- Each transaction borrows a connection only for its duration

### Implementation
- **Railway**: New Docker service `edoburu/pgbouncer:1.23.0`
  - Internal networking: `pgbouncer.railway.internal:6432`
  - Connected to `postgis-db.railway.internal:5432`
  - Config: `pool_mode=transaction`, `default_pool_size=25`, `max_client_conn=1000`
- **Local**: Docker Compose service alongside local PostgreSQL
- **Backend**: `DATABASE_URL` points to PgBouncer instead of direct DB
  - `postgres-js` config: `prepare: false` (required for transaction pooling)

### PgBouncer Config
```ini
[databases]
optimus = host=postgis-db.railway.internal port=5432 dbname=railway

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = scram-sha-256
pool_mode = transaction
default_pool_size = 25
max_client_conn = 1000
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
server_idle_timeout = 600
server_lifetime = 3600
log_connections = 0
log_disconnections = 0
```

### Breaking Change: Prepared Statements
`postgres-js` uses prepared statements by default. PgBouncer in transaction mode
does NOT support prepared statements (connection reuse breaks them).

**Fix**: Set `prepare: false` in `postgres-js` config.
Impact: ~5% slower for repeated identical queries (negligible vs pooling gain).

## Axe 2 — Redis Cache on Hot Paths

### Cache Strategy

| Procedure | Cache Key | TTL | Invalidation |
|-----------|-----------|-----|--------------|
| `store.nearby` | `stores:nearby:{geohash6}:{storeType}:{certified}` | 5 min | On store create/update |
| `certifier.list` | `certifiers:list` | 1 hour | On certifier change |
| `boycott.list` | `boycott:active` | 1 hour | On boycott change |
| `store.byId` | `store:{id}` | 10 min | On store update |
| `additive.byCode` | `additive:{code}` | 1 hour | On additive change |

### Geohash Strategy for store.nearby
- Geohash precision 6 = ~1.2km grid cells
- User's viewport position → round to nearest geohash6
- Cache key includes storeType + halalCertifiedOnly filters
- 5-minute TTL keeps data fresh without hammering PostGIS
- Expected cache hit rate: 80%+ (users in same area see cached results)

### Implementation Pattern
```typescript
// Generic cache wrapper
async function withCache<T>(
  redis: Redis,
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  const data = await fetcher();
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  return data;
}
```

### Geohash Library
Use `ngeohash` (tiny, no dependencies) for encoding lat/lng to geohash strings.

## Axe 3 — Composite Index Migration

### New Indexes
```sql
-- 0003: Composite indexes for 50K+ scaling
-- Scans: user history page (ORDER BY scanned_at DESC)
CREATE INDEX CONCURRENTLY idx_scans_user_scanned
  ON scans (user_id, scanned_at DESC);

-- Favorites: user favorites list
CREATE INDEX CONCURRENTLY idx_favorites_user_created
  ON favorites (user_id, created_at DESC);

-- Alerts: active alerts feed
CREATE INDEX CONCURRENTLY idx_alerts_active_published
  ON alerts (is_active, published_at DESC)
  WHERE is_active = true;

-- Products: barcode scan lookup (covering index)
CREATE INDEX CONCURRENTLY idx_products_barcode_cover
  ON products (barcode)
  INCLUDE (name, brand, halal_status, image_url, confidence_score);
```

### Why CONCURRENTLY
`CREATE INDEX CONCURRENTLY` does not lock the table for writes.
Safe to run on production with live traffic.

### Impact
- Scans history: O(n) → O(log n) for user's scan list
- Favorites: O(n) → O(log n) for user's favorites
- Alerts feed: Skip inactive alerts entirely (partial index)
- Barcode scan: Index-only scan, no heap access needed

## Axe 4 — Lightweight Map Select

### Current
`store.nearby` returns 15 columns for every marker. Most are unused on the map view.

### Optimization
Add a `mapMarkers` flag or separate procedure that returns only:
```typescript
{ id, name, latitude, longitude, storeType, halalCertified, distance }
```
7 columns vs 15 = ~50% less data transfer per marker.

## Environments

| Component | Local Dev | Railway Prod |
|-----------|-----------|-------------|
| PgBouncer | docker-compose service | Railway Docker service |
| Redis cache | Same local Redis | Same Railway Redis |
| DB indexes | Applied via drizzle migrate | Applied via psql CONCURRENTLY |
| Backend config | `prepare: false` | `prepare: false` |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| PgBouncer single point of failure | Railway auto-restarts; can add replica later |
| Stale cache on store.nearby | 5min TTL acceptable; admin can flush `stores:*` |
| `prepare: false` perf impact | ~5% on repeated queries; negligible vs pooling gain |
| Geohash boundary issues | Overlapping queries at grid edges; acceptable at precision 6 |

## Success Metrics
- P95 latency `store.nearby` < 100ms (currently ~300ms uncached)
- DB connections stable at 25 even under 1000 concurrent requests
- Redis cache hit rate > 70% on store.nearby
- Zero connection timeout errors
