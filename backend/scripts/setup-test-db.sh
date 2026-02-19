#!/bin/bash
# Starts a test Postgres + runs migrations (same as prod). Run once before `pnpm test`.
set -euo pipefail

CONTAINER_NAME="optimus-test-db"
DB_PORT=5433
DATABASE_URL="postgres://postgres:postgres@localhost:$DB_PORT/optimus_test"

if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
  echo "Test DB already running on port $DB_PORT"
else
  echo "Starting test Postgres on port $DB_PORT..."
  docker run -d --name $CONTAINER_NAME \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=optimus_test \
    -p $DB_PORT:5432 \
    postgis/postgis:17-3.5

  echo "Waiting for Postgres to be ready..."
  until docker exec $CONTAINER_NAME pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
  done
fi

# Use entrypoint.ts (migrate + verify) — same path as production
# NODE_ENV=test skips seeding (tests manage their own data)
echo "Running migrations via entrypoint (prod parity)..."
DATABASE_URL="$DATABASE_URL" NODE_ENV=test npx tsx src/db/entrypoint.ts

# PostGIS extension (needed for geo features, not in standard migrations)
echo "Applying PostGIS migration..."
PGPASSWORD=postgres psql -h localhost -p $DB_PORT -U postgres -d optimus_test -f drizzle/0002_add_postgis.sql 2>/dev/null || true

echo "Test DB ready at localhost:$DB_PORT/optimus_test"
