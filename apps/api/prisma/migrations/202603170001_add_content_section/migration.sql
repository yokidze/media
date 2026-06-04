-- Create enum for archive content sections
CREATE TYPE "ContentSection" AS ENUM ('ARTICLE', 'TV_STORY', 'EVENT_PHOTO');

-- Add section field and keep existing records mapped from material type
ALTER TABLE "ArchiveItem"
  ADD COLUMN "contentSection" "ContentSection" NOT NULL DEFAULT 'ARTICLE';

UPDATE "ArchiveItem"
SET "contentSection" = CASE
  WHEN "materialType" = 'VIDEO' THEN 'TV_STORY'::"ContentSection"
  WHEN "materialType" = 'IMAGE' THEN 'EVENT_PHOTO'::"ContentSection"
  ELSE 'ARTICLE'::"ContentSection"
END;

CREATE INDEX "ArchiveItem_contentSection_idx" ON "ArchiveItem"("contentSection");
