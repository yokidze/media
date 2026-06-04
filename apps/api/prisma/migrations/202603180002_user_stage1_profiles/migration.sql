-- Stage 1 user system: must-change-password and profile table
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "Profile" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL UNIQUE,
  "fullName" TEXT NOT NULL,
  "position" TEXT,
  "department" TEXT,
  "phone" TEXT,
  "avatarUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Profile_fullName_idx" ON "Profile"("fullName");

INSERT INTO "Profile" ("userId", "fullName", "position", "department", "phone", "avatarUrl")
SELECT
  u."id",
  u."fullName",
  u."jobTitle",
  u."department",
  u."phone",
  u."profilePhotoUrl"
FROM "User" u
LEFT JOIN "Profile" p ON p."userId" = u."id"
WHERE p."userId" IS NULL;

-- Keep currently existing users usable after migration.
UPDATE "User"
SET "mustChangePassword" = false
WHERE "createdAt" < CURRENT_TIMESTAMP;

CREATE TRIGGER profile_updated_at BEFORE UPDATE ON "Profile" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
