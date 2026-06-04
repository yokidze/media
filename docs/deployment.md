# Deployment Guide

## 1. Production Preparation
1. Copy env file:
   - `cp .env.example .env` (Linux/macOS)
2. Set strong secrets:
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
3. Set production URLs:
   - `APP_ORIGIN`
   - `NEXT_PUBLIC_SITE_URL`
4. Set external PostgreSQL connection:
   - `DATABASE_URL`
   - (optional) `DIRECT_DATABASE_URL` for Prisma CLI/migrations when pooled URLs are used

## 2. Deploy with Docker Compose
```bash
docker compose pull
docker compose up -d --build
```

Services:
- `api`: backend API
- `web`: Next.js frontend
- `minio`: optional S3-compatible storage
- `postgres`: optional local DB service (profile `local-db`)

## 3. Optional Local PostgreSQL (for staging/dev)
```bash
docker compose --profile local-db up -d postgres
```

## 4. Database Migration
```bash
docker compose exec api npm run prisma:migrate -w apps/api
```

Seed once (optional):
```bash
docker compose exec api npm run prisma:seed -w apps/api
```

## 5. Reverse Proxy (Recommended)
Use Nginx or Traefik in front of `web` and `api`.
- Route UI to `web:3000`
- Route API to `api:4000`
- Enable HTTPS and HSTS

## 6. PostgreSQL Backup
For managed DB use provider snapshots + logical backups.

Manual backup example:
```bash
pg_dump "$DATABASE_URL" > backup_$(date +%F).sql
```

Restore:
```bash
psql "$DATABASE_URL" < backup_2026-03-11.sql
```

Recommended schedule:
- daily incremental/logical backups
- weekly full backup
- offsite copy retention policy (e.g. 30/90 days)

## 7. File Backup
Local storage folder:
- `./storage`

Backup example:
```bash
tar -czf storage_backup_$(date +%F).tar.gz storage
```

## 8. Switch Local Storage to S3
1. Set env:
   - `STORAGE_DRIVER=S3`
   - `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
2. Ensure bucket exists and API account has read/write/delete permissions
3. Restart API service

## 9. Performance Checklist
- Enable DB connection pooling
- Keep indexes up to date (`ANALYZE`, `VACUUM`)
- Use CDN/cache for static media
- Monitor API latency and DB slow queries

## 10. Security Checklist
- Use HTTPS only
- Restrict DB network access
- Rotate JWT secrets periodically
- Limit admin accounts
- Configure firewall/WAF and audit logging
