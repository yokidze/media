# Architecture

## High-Level
- `apps/web` (Next.js) handles public UI, account area, and admin panel.
- `apps/api` (Express) exposes REST API, auth, RBAC, search, upload, admin actions.
- PostgreSQL stores business entities and full-text/trigram indexes.
- Storage layer abstracts local filesystem and S3-compatible object storage.

## Main Flows
1. User searches archive:
   - UI sends query/filters to `/api/v1/search` or `/api/v1/archive-items`
   - API runs FTS + filters in PostgreSQL
   - UI renders paginated cards with highlights

2. User browses sections:
   - `contentSection` drives top-level tabs (`ARTICLE`, `TV_STORY`, `EVENT_PHOTO`)
   - existing `materialType` filters remain available for detailed slicing

3. Admin uploads materials:
   - Create metadata record (`/archive-items`)
   - Upload one or many files (`/archive-items/:itemId/files`)
   - API validates file type/size, writes to storage, stores metadata in `ArchiveFile`
   - Image previews generated when possible

4. Access control:
   - JWT cookies + session table
   - RBAC middleware checks role
   - Access level (`PUBLIC | STAFF_ONLY | HIDDEN`) enforced per endpoint

## Backend Layers
- `modules/*`: feature routes and use-cases
- `middleware/*`: auth, RBAC, CSRF, validation, rate-limit, error mapping
- `services/*`: audit logging, file storage abstraction, preview generation
- `prisma/*`: schema, migrations, seed

## Database Design
Key entities:
- `User`, `Role`, `UserRole`, `Session`
- `ArchiveItem`, `ArchiveFile`, `Category`, `Tag`, `ArchiveItemTag`, `Author`
- `AccessPermission`, `Favorite`, `ViewHistory`, `AuditLog`, `StatisticsDaily`

Highlights:
- N:M via link tables (`UserRole`, `ArchiveItemTag`)
- category tree via `Category.parentId`
- `ArchiveItem.contentSection` for top-level media sections
- file metadata separated from archive item core data

## Search Design
- Generated `searchVector` column on `ArchiveItem`
- GIN index on `searchVector`
- trigram index on title for typo-tolerant suggestions
- `websearch_to_tsquery`, `ts_rank`, `ts_headline`

## Scalability Notes
- API is stateless; can scale horizontally
- session data in DB enables token rotation and revocation
- file storage adapter allows moving to S3/MinIO without API rewrite
- full-text indexes support large datasets with low-latency search
