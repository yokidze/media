param(
  [string]$ComposeFile = "docker-compose.server.yml",
  [string]$DbService = "postgres",
  [string]$DbUser = "archive_user",
  [string]$DbName = "polytech_media_archive",
  [string]$DataFile = "backups/current/polytech_media_archive_data.sql"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $DataFile)) {
  throw "Backup file not found: $DataFile"
}

docker compose -f $ComposeFile up -d $DbService

Write-Host "Waiting for PostgreSQL..."
do {
  docker compose -f $ComposeFile exec -T $DbService pg_isready -U $DbUser -d $DbName *> $null
  $ready = $LASTEXITCODE -eq 0
  if (-not $ready) { Start-Sleep -Seconds 2 }
} until ($ready)

docker compose -f $ComposeFile stop api web *> $null

$truncateSql = @'
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
'@

$truncateSql | docker compose -f $ComposeFile exec -T $DbService psql -U $DbUser -d $DbName -v ON_ERROR_STOP=1

(
  "SET session_replication_role = replica;"
  Get-Content $DataFile -Raw
  "SET session_replication_role = DEFAULT;"
) | docker compose -f $ComposeFile exec -T $DbService psql -U $DbUser -d $DbName -v ON_ERROR_STOP=1

docker compose -f $ComposeFile up -d api web

Write-Host "Current project data restored."
