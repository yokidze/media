#!/usr/bin/env sh
set -eu

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.server.yml}"
DB_SERVICE="${DB_SERVICE:-postgres}"
DB_USER="${POSTGRES_USER:-archive_user}"
DB_NAME="${POSTGRES_DB:-polytech_media_archive}"
DATA_FILE="${DATA_FILE:-backups/current/polytech_media_archive_data.sql}"

if [ ! -f "$DATA_FILE" ]; then
  echo "Backup file not found: $DATA_FILE" >&2
  exit 1
fi

docker compose -f "$COMPOSE_FILE" up -d "$DB_SERVICE"

echo "Waiting for PostgreSQL..."
until docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
  sleep 2
done

docker compose -f "$COMPOSE_FILE" stop api web >/dev/null 2>&1 || true

docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<'SQL'
TRUNCATE TABLE
  "AccessPermission",
  "ArchiveFile",
  "ArchiveItemTag",
  "AuditLog",
  "Favorite",
  "Session",
  "StatisticsDaily",
  "ViewHistory",
  "ArchiveItem",
  "Author",
  "Category",
  "Profile",
  "Tag",
  "UserRole",
  "User",
  "Role"
CASCADE;
SQL

{
  echo "SET session_replication_role = replica;";
  cat "$DATA_FILE";
  echo "SET session_replication_role = DEFAULT;";
} | docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1

docker compose -f "$COMPOSE_FILE" up -d api web

echo "Current project data restored."
