# PgBouncer — Connection Pooler

## Railway Deployment

Deploy as a Docker service on Railway:

```bash
railway add -s pgbouncer
```

### Required Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgres://user:pass@postgis-db.railway.internal:5432/railway` | Upstream PostGIS DB (internal network) |
| `POOL_MODE` | `transaction` | Transaction-level pooling |
| `DEFAULT_POOL_SIZE` | `25` | Server connections per pool |
| `MAX_CLIENT_CONN` | `1000` | Max client connections |
| `MIN_POOL_SIZE` | `5` | Minimum idle server connections |
| `RESERVE_POOL_SIZE` | `5` | Extra connections for burst traffic |
| `SERVER_IDLE_TIMEOUT` | `600` | Close idle server connections after 10min |

### After Deployment

Update `mobile-bff` DATABASE_URL to point to PgBouncer:
```
postgres://user:pass@pgbouncer.railway.internal:5432/railway
```

## Local Development

PgBouncer is optional locally (direct connection is fine for dev).
To test with PgBouncer locally, use docker-compose:

```bash
cd backend && docker compose up pgbouncer -d
```

Then set `DATABASE_URL=postgres://postgres:postgres@localhost:6432/optimus_halal` in `.env`.
