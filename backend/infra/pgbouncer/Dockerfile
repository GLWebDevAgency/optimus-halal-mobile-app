# PgBouncer — Connection pooler for PostGIS DB on Railway
# Transaction mode: each transaction borrows a server connection, then returns it.
# This allows 1000+ client connections with only 25 actual DB connections.
FROM edoburu/pgbouncer:1.23.0

# PgBouncer config is injected via environment variables:
#   DATABASE_URL    — upstream PostGIS connection string
#   POOL_MODE       — transaction (default)
#   DEFAULT_POOL_SIZE — 25 (default)
#   MAX_CLIENT_CONN   — 1000 (default)
#
# edoburu/pgbouncer auto-generates pgbouncer.ini from env vars.

# Railway health check
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD pg_isready -h 127.0.0.1 -p 5432 || exit 1

EXPOSE 5432
