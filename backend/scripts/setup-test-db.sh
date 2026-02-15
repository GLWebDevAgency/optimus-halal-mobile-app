#!/bin/bash
# Starts a test Postgres + pushes schema. Run once before `pnpm test`.
set -euo pipefail

CONTAINER_NAME="optimus-test-db"
DB_PORT=5433

if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
  echo "Test DB already running on port $DB_PORT"
else
  echo "Starting test Postgres on port $DB_PORT..."
  docker run -d --name $CONTAINER_NAME \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=optimus_test \
    -p $DB_PORT:5432 \
    postgres:16-alpine

  echo "Waiting for Postgres to be ready..."
  until docker exec $CONTAINER_NAME pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
  done
fi

echo "Pushing schema..."
DATABASE_URL="postgres://postgres:postgres@localhost:$DB_PORT/optimus_test" pnpm run db:push

echo "Test DB ready at localhost:$DB_PORT/optimus_test"
