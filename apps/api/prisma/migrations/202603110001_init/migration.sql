-- Create extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
CREATE TYPE "RoleName" AS ENUM ('GUEST', 'STAFF', 'ADMIN');
CREATE TYPE "MaterialType" AS ENUM ('DOCUMENT', 'ARTICLE', 'NEWSPAPER', 'BOOKLET', 'IMAGE', 'VIDEO', 'AUDIO', 'SCAN', 'OTHER');
CREATE TYPE "AccessLevel" AS ENUM ('PUBLIC', 'STAFF_ONLY', 'HIDDEN');
CREATE TYPE "ArchiveStatus" AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE "StorageDriver" AS ENUM ('LOCAL', 'S3');

-- Roles
CREATE TABLE "Role" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" "RoleName" NOT NULL UNIQUE,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Users and auth
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "preferredLanguage" TEXT NOT NULL DEFAULT 'ru',
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "UserRole" (
  "userId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("userId", "roleId"),
  CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "refreshTokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Content taxonomy
CREATE TABLE "Author" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "fullName" TEXT NOT NULL,
  "bio" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Category" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "parentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Tag" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Archive core
CREATE TABLE "ArchiveItem" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "materialType" "MaterialType" NOT NULL,
  "accessLevel" "AccessLevel" NOT NULL DEFAULT 'PUBLIC',
  "status" "ArchiveStatus" NOT NULL DEFAULT 'DRAFT',
  "language" TEXT NOT NULL DEFAULT 'ru',
  "keywords" TEXT[] NOT NULL DEFAULT '{}',
  "alphabetLetter" TEXT,
  "archiveYear" INTEGER,
  "academicYear" TEXT,
  "issueNumber" TEXT,
  "publicationDate" TIMESTAMP(3),
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "textContent" TEXT,
  "viewsCount" INTEGER NOT NULL DEFAULT 0,
  "downloadsCount" INTEGER NOT NULL DEFAULT 0,
  "categoryId" TEXT,
  "authorId" TEXT,
  "createdById" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ArchiveItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ArchiveItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ArchiveItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ArchiveItem_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

ALTER TABLE "ArchiveItem" ADD COLUMN "searchVector" tsvector;

CREATE OR REPLACE FUNCTION update_archive_item_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple', coalesce(NEW."title", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."description", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW."keywords", ' '), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW."textContent", '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER archive_item_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "title", "description", "keywords", "textContent"
  ON "ArchiveItem"
  FOR EACH ROW
  EXECUTE FUNCTION update_archive_item_search_vector();

UPDATE "ArchiveItem"
SET "searchVector" =
  setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("description", '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(array_to_string("keywords", ' '), '')), 'B') ||
  setweight(to_tsvector('simple', coalesce("textContent", '')), 'C');

CREATE TABLE "ArchiveItemTag" (
  "archiveItemId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  PRIMARY KEY ("archiveItemId", "tagId"),
  CONSTRAINT "ArchiveItemTag_archiveItemId_fkey" FOREIGN KEY ("archiveItemId") REFERENCES "ArchiveItem"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ArchiveItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ArchiveFile" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "archiveItemId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "relativePath" TEXT NOT NULL,
  "storageDriver" "StorageDriver" NOT NULL DEFAULT 'LOCAL',
  "mimeType" TEXT NOT NULL,
  "extension" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "checksum" TEXT,
  "previewPath" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "width" INTEGER,
  "height" INTEGER,
  "durationSec" INTEGER,
  "pageCount" INTEGER,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArchiveFile_archiveItemId_fkey" FOREIGN KEY ("archiveItemId") REFERENCES "ArchiveItem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AccessPermission" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "archiveItemId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "canView" BOOLEAN NOT NULL DEFAULT true,
  "canDownload" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessPermission_archiveItemId_fkey" FOREIGN KEY ("archiveItemId") REFERENCES "ArchiveItem"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AccessPermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AccessPermission_archiveItemId_roleId_key" UNIQUE ("archiveItemId", "roleId")
);

-- User features
CREATE TABLE "Favorite" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "archiveItemId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Favorite_archiveItemId_fkey" FOREIGN KEY ("archiveItemId") REFERENCES "ArchiveItem"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Favorite_userId_archiveItemId_key" UNIQUE ("userId", "archiveItemId")
);

CREATE TABLE "ViewHistory" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT,
  "archiveItemId" TEXT NOT NULL,
  "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  CONSTRAINT "ViewHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ViewHistory_archiveItemId_fkey" FOREIGN KEY ("archiveItemId") REFERENCES "ArchiveItem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "StatisticsDaily" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "date" TIMESTAMP(3) NOT NULL UNIQUE,
  "totalViews" INTEGER NOT NULL DEFAULT 0,
  "totalDownloads" INTEGER NOT NULL DEFAULT 0,
  "newItems" INTEGER NOT NULL DEFAULT 0,
  "totalFiles" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX "Author_fullName_idx" ON "Author"("fullName");
CREATE INDEX "Category_name_idx" ON "Category"("name");
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");
CREATE INDEX "Tag_name_idx" ON "Tag"("name");
CREATE INDEX "ArchiveItem_title_idx" ON "ArchiveItem"("title");
CREATE INDEX "ArchiveItem_materialType_idx" ON "ArchiveItem"("materialType");
CREATE INDEX "ArchiveItem_accessLevel_idx" ON "ArchiveItem"("accessLevel");
CREATE INDEX "ArchiveItem_status_idx" ON "ArchiveItem"("status");
CREATE INDEX "ArchiveItem_archiveYear_idx" ON "ArchiveItem"("archiveYear");
CREATE INDEX "ArchiveItem_publicationDate_idx" ON "ArchiveItem"("publicationDate");
CREATE INDEX "ArchiveItem_createdAt_idx" ON "ArchiveItem"("createdAt");
CREATE INDEX "ArchiveItem_searchVector_idx" ON "ArchiveItem" USING GIN ("searchVector");
CREATE INDEX "ArchiveItem_title_trgm_idx" ON "ArchiveItem" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "ArchiveItemTag_tagId_idx" ON "ArchiveItemTag"("tagId");
CREATE INDEX "ArchiveFile_archiveItemId_idx" ON "ArchiveFile"("archiveItemId");
CREATE INDEX "ArchiveFile_mimeType_idx" ON "ArchiveFile"("mimeType");
CREATE INDEX "ArchiveFile_createdAt_idx" ON "ArchiveFile"("createdAt");
CREATE INDEX "AccessPermission_roleId_idx" ON "AccessPermission"("roleId");
CREATE INDEX "Favorite_archiveItemId_idx" ON "Favorite"("archiveItemId");
CREATE INDEX "ViewHistory_userId_idx" ON "ViewHistory"("userId");
CREATE INDEX "ViewHistory_archiveItemId_idx" ON "ViewHistory"("archiveItemId");
CREATE INDEX "ViewHistory_viewedAt_idx" ON "ViewHistory"("viewedAt");
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- UpdatedAt trigger helper
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER role_updated_at BEFORE UPDATE ON "Role" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER author_updated_at BEFORE UPDATE ON "Author" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER category_updated_at BEFORE UPDATE ON "Category" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tag_updated_at BEFORE UPDATE ON "Tag" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER archive_item_updated_at BEFORE UPDATE ON "ArchiveItem" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER archive_file_updated_at BEFORE UPDATE ON "ArchiveFile" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER access_permission_updated_at BEFORE UPDATE ON "AccessPermission" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER stats_daily_updated_at BEFORE UPDATE ON "StatisticsDaily" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
