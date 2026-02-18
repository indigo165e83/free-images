-- AlterTable: Add slug column (nullable initially to handle existing rows)
ALTER TABLE "Tag" ADD COLUMN "slug" TEXT;

-- Generate initial slugs from nameEn (lowercase, replace spaces with hyphens, remove special chars)
UPDATE "Tag"
SET "slug" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE("nameEn", '[^a-zA-Z0-9\s\-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '^-+|-+$', '', 'g'
  )
);

-- Fallback: use id for any rows that ended up with an empty slug
UPDATE "Tag" SET "slug" = "id" WHERE "slug" = '' OR "slug" IS NULL;

-- Handle duplicate slugs by appending part of the id (keeps slug unique)
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "slug" ORDER BY "createdAt") AS rn
  FROM "Tag"
)
UPDATE "Tag"
SET "slug" = "Tag"."slug" || '-' || SUBSTRING("Tag"."id" FROM 1 FOR 8)
FROM ranked
WHERE "Tag"."id" = ranked."id" AND ranked.rn > 1;

-- Make slug NOT NULL
ALTER TABLE "Tag" ALTER COLUMN "slug" SET NOT NULL;

-- Add unique index
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");
