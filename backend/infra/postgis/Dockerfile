# PostgreSQL 17 + PostGIS 3.5 for Railway
# Official PostGIS image — production-ready, maintained by PostGIS team
FROM postgis/postgis:17-3.5

# Railway injects PGDATA, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
# via environment variables — no config needed here.

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD pg_isready -U ${POSTGRES_USER:-postgres} || exit 1

EXPOSE 5432
